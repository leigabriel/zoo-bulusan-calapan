const db = require('../config/database');

class Message {
    static async create(messageData) {
        const { senderId, senderType, recipientType, subject, content } = messageData;
        const [result] = await db.query(
            `INSERT INTO user_messages (sender_id, sender_type, recipient_type, subject, content) 
             VALUES (?, ?, ?, ?, ?)`,
            [senderId, senderType, recipientType || 'admin', subject, content]
        );
        return result.insertId;
    }

    static async getAll() {
        const [rows] = await db.query(
            `SELECT m.*, 
             CONCAT(u.first_name, ' ', u.last_name) as sender_name, 
             u.email as sender_email,
             u.profile_image as sender_profile_image
             FROM user_messages m
             JOIN users u ON m.sender_id = u.id
             ORDER BY m.created_at DESC`
        );
        return rows;
    }

    static async getByRecipientType(recipientType) {
        const [rows] = await db.query(
            `SELECT m.*, 
             CONCAT(u.first_name, ' ', u.last_name) as sender_name, 
             u.email as sender_email,
             u.profile_image as sender_profile_image
             FROM user_messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.recipient_type = ? OR m.recipient_type = 'all'
             ORDER BY m.created_at DESC`,
            [recipientType]
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(
            `SELECT m.*, 
             CONCAT(u.first_name, ' ', u.last_name) as sender_name, 
             u.email as sender_email,
             u.profile_image as sender_profile_image
             FROM user_messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async getUnreadCount(recipientType) {
        const [rows] = await db.query(
            `SELECT COUNT(*) as count FROM user_messages 
             WHERE (recipient_type = ? OR recipient_type = 'all') AND is_read = FALSE`,
            [recipientType]
        );
        return rows[0]?.count || 0;
    }

    static async markAsRead(id) {
        const [result] = await db.query(
            'UPDATE user_messages SET is_read = TRUE, updated_at = NOW() WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async markAllAsRead(recipientType) {
        const [result] = await db.query(
            `UPDATE user_messages SET is_read = TRUE, updated_at = NOW() 
             WHERE (recipient_type = ? OR recipient_type = 'all') AND is_read = FALSE`,
            [recipientType]
        );
        return result.affectedRows;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM user_messages WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getBySenderId(senderId) {
        const [rows] = await db.query(
            `SELECT * FROM user_messages WHERE sender_id = ? ORDER BY created_at DESC`,
            [senderId]
        );
        return rows;
    }

    static async getAppeals() {
        const [rows] = await db.query(
            `SELECT m.*, 
             CONCAT(u.first_name, ' ', u.last_name) as sender_name, 
             u.email as sender_email,
             u.profile_image as sender_profile_image,
             u.is_suspended,
             u.suspension_reason
             FROM user_messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.message_type = 'appeal'
             ORDER BY m.created_at DESC`
        );
        return rows;
    }

    static async createAppealMessage(messageData) {
        const { senderId, subject, content } = messageData;
        const [result] = await db.query(
            `INSERT INTO user_messages (sender_id, sender_type, recipient_type, subject, content, message_type) 
             VALUES (?, 'user', 'admin', ?, ?, 'appeal')`,
            [senderId, subject, content]
        );
        return result.insertId;
    }
}

module.exports = Message;
