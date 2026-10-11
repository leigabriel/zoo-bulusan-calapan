const db = require('../config/database');

const ensureAuthSchema = async () => {
    const [columns] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
         AND COLUMN_NAME IN ('password_reset_token', 'password_reset_token_expiry',
                             'google_onboarding_complete', 'is_welcome_sent')`
    );
    const existing = new Set(columns.map(column => column.COLUMN_NAME));

    if (!existing.has('password_reset_token')) {
        await db.query('ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) DEFAULT NULL');
    }
    if (!existing.has('password_reset_token_expiry')) {
        await db.query('ALTER TABLE users ADD COLUMN password_reset_token_expiry DATETIME DEFAULT NULL');
    }
    // One-time onboarding stepper for accounts created through Google sign-in.
    if (!existing.has('google_onboarding_complete')) {
        await db.query('ALTER TABLE users ADD COLUMN google_onboarding_complete BOOLEAN DEFAULT FALSE');
    }
    // Guards the "welcome to Bulusan Zoo" email so it is sent on first login only.
    if (!existing.has('is_welcome_sent')) {
        await db.query('ALTER TABLE users ADD COLUMN is_welcome_sent BOOLEAN NOT NULL DEFAULT FALSE');
    }
};

module.exports = ensureAuthSchema;