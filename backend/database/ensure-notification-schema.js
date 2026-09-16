const db = require('../config/database');

const ensureNotificationSchema = async () => {
    const [settingsColumns] = await db.query(`
        SELECT COLUMN_NAME FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'notification_settings'
    `);
    if (settingsColumns.length === 0) {
        await db.query(`ALTER TABLE users ADD COLUMN notification_settings JSON DEFAULT NULL`);
    }

    await db.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(32) NOT NULL DEFAULT 'info',
            is_read BOOLEAN DEFAULT FALSE,
            link VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_notifications_user_id (user_id),
            INDEX idx_notifications_is_read (is_read),
            INDEX idx_notifications_type (type),
            CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [typeColumns] = await db.query(`
        SELECT DATA_TYPE FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'type'
    `);
    if (typeColumns[0]?.DATA_TYPE === 'enum') {
        await db.query(`ALTER TABLE notifications MODIFY type VARCHAR(32) NOT NULL DEFAULT 'info'`);
    }
};

module.exports = ensureNotificationSchema;
