const db = require('../config/database');

const normalizeSession = (row) => ({
    id: row.id,
    title: row.title || 'New chat',
    messages: typeof row.messages === 'string' ? JSON.parse(row.messages) : (row.messages || []),
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

class AIAssistSession {
    static async getByOwner(userId, role) {
        const [rows] = await db.query(
            `SELECT id, title, messages, created_at, updated_at
             FROM ai_assist_sessions
             WHERE user_id = ? AND role = ?
             ORDER BY updated_at DESC`,
            [userId, role]
        );
        return rows.map(normalizeSession);
    }

    static async create({ id, userId, role, title = 'New chat', messages = [] }) {
        await db.query(
            `INSERT INTO ai_assist_sessions (id, user_id, role, title, messages)
             VALUES (?, ?, ?, ?, ?)`,
            [id, userId, role, title, JSON.stringify(messages)]
        );
        return { id, title, messages, createdAt: new Date(), updatedAt: new Date() };
    }

    static async update({ id, userId, role, title, messages }) {
        const updates = [];
        const params = [];

        if (title !== undefined) {
            updates.push('title = ?');
            params.push(title);
        }
        if (messages !== undefined) {
            updates.push('messages = ?');
            params.push(JSON.stringify(messages));
        }
        if (updates.length === 0) return false;

        params.push(id, userId, role);
        const [result] = await db.query(
            `UPDATE ai_assist_sessions SET ${updates.join(', ')}
             WHERE id = ? AND user_id = ? AND role = ?`,
            params
        );
        return result.affectedRows > 0;
    }

    static async delete(id, userId, role) {
        const [result] = await db.query(
            'DELETE FROM ai_assist_sessions WHERE id = ? AND user_id = ? AND role = ?',
            [id, userId, role]
        );
        return result.affectedRows > 0;
    }
}

module.exports = AIAssistSession;