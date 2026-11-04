const db = require('../config/database');

const ensureSupportSchema = async () => {
    const statements = [
        "ALTER TABLE user_messages ADD COLUMN case_status ENUM('open', 'closed') NOT NULL DEFAULT 'open' AFTER is_read",
        'ALTER TABLE user_messages ADD COLUMN user_response TEXT DEFAULT NULL AFTER admin_response',
        'ALTER TABLE user_messages ADD COLUMN user_responded_at TIMESTAMP NULL DEFAULT NULL AFTER user_response',
        // Guests submit the public login-page contact form without an account, so
        // the sender is stored in these columns instead of the users table.
        'ALTER TABLE user_messages ADD COLUMN guest_name VARCHAR(120) DEFAULT NULL AFTER sender_type',
        'ALTER TABLE user_messages ADD COLUMN guest_email VARCHAR(254) DEFAULT NULL AFTER guest_name',
        'ALTER TABLE user_messages MODIFY COLUMN sender_id INT NULL',
        "ALTER TABLE user_messages MODIFY COLUMN sender_type ENUM('user', 'admin', 'staff', 'guest') DEFAULT 'user'"
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
