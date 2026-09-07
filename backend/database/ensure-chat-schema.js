const db = require('../config/database');

const ensureChatSchema = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS conversations (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            recipient_type ENUM('staff', 'admin') NOT NULL,
            staff_recipient_id INT DEFAULT NULL,
            recipient_scope_id INT NOT NULL,
            last_message_at TIMESTAMP NULL DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_chat_conversation_recipient (user_id, recipient_type, recipient_scope_id),
            INDEX idx_chat_conversations_staff (staff_recipient_id, last_message_at),
            INDEX idx_chat_conversations_admin (recipient_type, last_message_at),
            CONSTRAINT fk_chat_conversations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_chat_conversations_staff FOREIGN KEY (staff_recipient_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
            conversation_id INT NOT NULL,
            sender_id INT NOT NULL,
            sender_role ENUM('user', 'staff', 'admin') NOT NULL,
            content VARCHAR(4000) NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_chat_messages_conversation (conversation_id, created_at, id),
            INDEX idx_chat_messages_unread (conversation_id, is_read, sender_id),
            CONSTRAINT fk_chat_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_chat_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
};

module.exports = ensureChatSchema;
