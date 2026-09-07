const db = require('../config/database');

const ensureSupportSchema = async () => {
    const statements = [
        "ALTER TABLE user_messages ADD COLUMN case_status ENUM('open', 'closed') NOT NULL DEFAULT 'open' AFTER is_read",
        'ALTER TABLE user_messages ADD COLUMN user_response TEXT DEFAULT NULL AFTER admin_response',
        'ALTER TABLE user_messages ADD COLUMN user_responded_at TIMESTAMP NULL DEFAULT NULL AFTER user_response'
    ];

    for (const statement of statements) {
        try {
            await db.query(statement);
        } catch (error) {
            if (!/duplicate column/i.test(error.message)) throw error;
        }
    }
};

module.exports = ensureSupportSchema;
