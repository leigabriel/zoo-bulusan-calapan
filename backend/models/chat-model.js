const db = require('../config/database');

const scopeClause = actor => {
    if (actor.role === 'user') return { sql: 'c.user_id = ?', values: [actor.id] };
    if (actor.role === 'staff') {
        return { sql: "c.recipient_type = 'staff' AND c.staff_recipient_id = ?", values: [actor.id] };
    }
    if (actor.role === 'admin') return { sql: "c.recipient_type = 'admin'", values: [] };
    return { sql: 'FALSE', values: [] };
};

const conversationSelect = `
    SELECT c.id, c.user_id, c.recipient_type, c.staff_recipient_id,
           c.last_message_at, c.created_at, c.updated_at,
           owner.first_name AS user_first_name, owner.last_name AS user_last_name,
           owner.username AS user_username, owner.profile_image AS user_profile_image,
           staff.first_name AS staff_first_name, staff.last_name AS staff_last_name,
           staff.username AS staff_username, staff.profile_image AS staff_profile_image,
           lm.id AS last_message_id, lm.sender_id AS last_sender_id,
           lm.sender_role AS last_sender_role, lm.content AS last_content,
           lm.is_read AS last_is_read, lm.created_at AS last_created_at
    FROM conversations c
    JOIN users owner ON owner.id = c.user_id
    LEFT JOIN users staff ON staff.id = c.staff_recipient_id
    LEFT JOIN messages lm ON lm.id = (
        SELECT newest.id FROM messages newest
        WHERE newest.conversation_id = c.id
        ORDER BY newest.created_at DESC, newest.id DESC LIMIT 1
    )`;

const incomingUnreadCondition = actor => actor.role === 'user'
    ? 'm.sender_id <> c.user_id'
    : 'm.sender_id = c.user_id';

class Chat {
    static async getActiveRecipients(actor) {
        if (actor.role !== 'user') return null;
        const [staff] = await db.query(
            `SELECT id, first_name, last_name, username, profile_image
             FROM users
             WHERE role = 'staff' AND is_active = TRUE AND is_suspended = FALSE
             AND (is_deleted IS NULL OR is_deleted = FALSE)
             ORDER BY first_name, last_name, id`
        );
        const [adminRows] = await db.query(
            `SELECT COUNT(*) AS count FROM users
             WHERE role = 'admin' AND is_active = TRUE AND is_suspended = FALSE
             AND (is_deleted IS NULL OR is_deleted = FALSE)`
        );
        return { staff, adminAvailable: Number(adminRows[0].count) > 0 };
    }

    static async listConversations(actor) {
        const scope = scopeClause(actor);
        const [rows] = await db.query(
            `${conversationSelect}
             WHERE ${scope.sql}
             ORDER BY COALESCE(c.last_message_at, c.created_at) DESC, c.id DESC`,
            scope.values
        );
        if (!rows.length) return rows;

        const [unreadRows] = await db.query(
            `SELECT c.id, COUNT(m.id) AS unread_count
             FROM conversations c
             LEFT JOIN messages m ON m.conversation_id = c.id
                 AND m.is_read = FALSE AND ${incomingUnreadCondition(actor)}
             WHERE ${scope.sql}
             GROUP BY c.id`,
            scope.values
        );
        const unread = new Map(unreadRows.map(row => [Number(row.id), Number(row.unread_count)]));
        return rows.map(row => ({ ...row, unread_count: unread.get(Number(row.id)) || 0 }));
    }

    static async getConversation(actor, conversationId, connection = db, lock = false) {
        const scope = scopeClause(actor);
        const [rows] = await connection.query(
            `SELECT c.* FROM conversations c
             WHERE c.id = ? AND ${scope.sql}${lock ? ' FOR UPDATE' : ''}`,
            [conversationId, ...scope.values]
        );
        return rows[0] || null;
    }

    static async getConversationDetails(actor, conversationId) {
        const scope = scopeClause(actor);
        const [rows] = await db.query(
            `${conversationSelect} WHERE c.id = ? AND ${scope.sql}`,
            [conversationId, ...scope.values]
        );
        return rows[0] || null;
    }

    static async createConversation(actor, recipientType, staffRecipientId) {
        if (actor.role !== 'user') return null;
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            if (recipientType === 'staff') {
                const [recipients] = await connection.query(
                    `SELECT id FROM users WHERE id = ? AND role = 'staff' AND is_active = TRUE
                     AND is_suspended = FALSE AND (is_deleted IS NULL OR is_deleted = FALSE) FOR UPDATE`,
                    [staffRecipientId]
                );
                if (!recipients.length) {
                    await connection.rollback();
                    return null;
                }
            } else {
                const [admins] = await connection.query(
                    `SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE
                     AND is_suspended = FALSE AND (is_deleted IS NULL OR is_deleted = FALSE) LIMIT 1 FOR UPDATE`
                );
                if (!admins.length) {
                    await connection.rollback();
                    return null;
                }
            }

            const [result] = await connection.query(
                `INSERT INTO conversations (user_id, recipient_type, staff_recipient_id, recipient_scope_id)
                 VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
                [
                    actor.id,
                    recipientType,
                    recipientType === 'staff' ? staffRecipientId : null,
                    recipientType === 'staff' ? staffRecipientId : 0
                ]
            );
            const conversationId = result.insertId;
            await connection.commit();
            return this.getConversationDetails(actor, conversationId);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getMessages(actor, conversationId, limit = 100) {
        if (!await this.getConversation(actor, conversationId)) return null;
        const [rows] = await db.query(
            `SELECT m.id, m.conversation_id, m.sender_id, m.sender_role, m.content,
                    m.is_read, m.created_at, u.first_name, u.last_name,
                    u.username, u.profile_image
             FROM messages m JOIN users u ON u.id = m.sender_id
             WHERE m.conversation_id = ?
             ORDER BY m.created_at ASC, m.id ASC LIMIT ?`,
            [conversationId, limit]
        );
        return rows;
    }

    static async sendMessage(actor, conversationId, content) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const conversation = await this.getConversation(actor, conversationId, connection, true);
            if (!conversation) {
                await connection.rollback();
                return null;
            }
            const [result] = await connection.query(
                `INSERT INTO messages (conversation_id, sender_id, sender_role, content)
                 VALUES (?, ?, ?, ?)`,
                [conversationId, actor.id, actor.role, content]
            );
            await connection.query(
                'UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = ?',
                [conversationId]
            );
            const [rows] = await connection.query(
                `SELECT m.id, m.conversation_id, m.sender_id, m.sender_role, m.content,
                        m.is_read, m.created_at, u.first_name, u.last_name,
                        u.username, u.profile_image
                 FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?`,
                [result.insertId]
            );
            await connection.commit();
            return { conversation, message: rows[0] };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async markRead(actor, conversationId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const conversation = await this.getConversation(actor, conversationId, connection, true);
            if (!conversation) {
                await connection.rollback();
                return null;
            }
            const condition = actor.role === 'user' ? 'sender_id <> ?' : 'sender_id = ?';
            const comparedId = actor.role === 'user' ? actor.id : conversation.user_id;
            const [result] = await connection.query(
                `UPDATE messages SET is_read = TRUE
                 WHERE conversation_id = ? AND is_read = FALSE AND ${condition}`,
                [conversationId, comparedId]
            );
            await connection.commit();
            return { conversation, markedRead: result.affectedRows };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getUnreadCount(actor) {
        const scope = scopeClause(actor);
        const [rows] = await db.query(
            `SELECT COUNT(m.id) AS count
             FROM conversations c JOIN messages m ON m.conversation_id = c.id
             WHERE ${scope.sql} AND m.is_read = FALSE AND ${incomingUnreadCondition(actor)}`,
            scope.values
        );
        return Number(rows[0].count);
    }
}

module.exports = Chat;
