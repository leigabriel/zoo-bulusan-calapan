const db = require('../config/database');

const ensureAuthSchema = async () => {
    const [columns] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
         AND COLUMN_NAME IN ('password_reset_token', 'password_reset_token_expiry')`
    );
    const existing = new Set(columns.map(column => column.COLUMN_NAME));

    if (!existing.has('password_reset_token')) {
        await db.query('ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) DEFAULT NULL');
    }
    if (!existing.has('password_reset_token_expiry')) {
        await db.query('ALTER TABLE users ADD COLUMN password_reset_token_expiry DATETIME DEFAULT NULL');
    }
};

module.exports = ensureAuthSchema;