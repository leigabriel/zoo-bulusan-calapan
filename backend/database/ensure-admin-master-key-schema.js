const db = require('../config/database');

const ensureAdminMasterKeySchema = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS admin_master_keys (
            id INT PRIMARY KEY AUTO_INCREMENT,
            admin_id INT NOT NULL UNIQUE,
            key_hash VARCHAR(255) NOT NULL,
            enabled BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_admin_master_key_user FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
};

module.exports = ensureAdminMasterKeySchema;
