const db = require('../config/database');

/**
 * Table backing JWT revocation (models/revoked-token-model.js).
 *
 * Holds the `jti` of every logged-out token plus the moment that token expires,
 * so revoked rows can be pruned on boot without parsing anything.
 */
const ensureRevokedTokensSchema = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS revoked_tokens (
            jti VARCHAR(64) NOT NULL,
            expires_at DATETIME NOT NULL,
            revoked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (jti),
            INDEX idx_revoked_tokens_expires (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Opportunistic cleanup: rows for tokens that expired anyway are dead weight.
    await db.query('DELETE FROM revoked_tokens WHERE expires_at < NOW()');
};

module.exports = ensureRevokedTokensSchema;
