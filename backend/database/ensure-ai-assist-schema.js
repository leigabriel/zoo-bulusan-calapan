const db = require('../config/database');

const ensureAIAssistSchema = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS ai_assist_sessions (
            id VARCHAR(64) PRIMARY KEY,
            user_id INT NOT NULL,
            role VARCHAR(20) NOT NULL,
            title VARCHAR(255) NOT NULL DEFAULT 'New chat',
            messages JSON NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_ai_assist_owner (user_id, role, updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
};

module.exports = ensureAIAssistSchema;