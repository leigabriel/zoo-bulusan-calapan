/**
 * Server-side revocation for issued JWTs.
 *
 * A JWT is self-contained, so without this the logout endpoint only cleared the
 * browser copy: the same token stayed valid until its 7 day expiry. This records
 * the individual token id (`jti`) so exactly that token stops working, without
 * disturbing other sessions the same user has open in other tabs.
 */

const crypto = require('crypto');
const db = require('../config/database');

/** Short-lived cache so a page that fires several requests pays one lookup. */
const CACHE_TTL_MS = 5000;
const revokedCache = new Map(); // jti -> { revoked: boolean, until: number }

/**
 * Generate a unique token id.
 * @returns {string}
 */
const newTokenId = () => crypto.randomBytes(16).toString('hex');

/**
 * Read the expiry (epoch seconds) from a decoded token payload.
 * @param {any} decoded
 * @returns {number|null}
 */
const expiryOf = (decoded) => {
    const exp = decoded?.exp;
    return Number.isInteger(exp) ? exp : null;
};

/**
 * Has this token been revoked?
 *
 * A token that has already expired needs no check - the signature check rejects
 * it anyway - so that case short-circuits without touching the database.
 *
 * @param {any} decoded Verified JWT payload
 * @returns {Promise<boolean>}
 */
const isRevoked = async (decoded) => {
    const jti = decoded?.jti;
    if (!jti) return false;

    const exp = expiryOf(decoded);
    if (exp !== null && exp * 1000 <= Date.now()) return false;

    const cached = revokedCache.get(jti);
    if (cached) {
        if (cached.until > Date.now()) return cached.revoked;
        revokedCache.delete(jti);
    }

    const [rows] = await db.query('SELECT jti FROM revoked_tokens WHERE jti = ? LIMIT 1', [jti]);

    if (rows.length) {
        revokedCache.set(jti, { revoked: true, until: exp ? exp * 1000 : Date.now() + CACHE_TTL_MS });
        return true;
    }

    // Remember the negative result briefly so a burst of requests costs one query.
    revokedCache.set(jti, { revoked: false, until: Date.now() + CACHE_TTL_MS });
    return false;
};

/**
 * Revoke one specific decoded token.
 *
 * @param {any} decoded Verified JWT payload
 * @returns {Promise<boolean>}
 */
const revoke = async (decoded) => {
    const jti = decoded?.jti;
    if (!jti) return false;

    const exp = expiryOf(decoded);
    if (exp !== null && exp * 1000 <= Date.now()) {
        // Already expired, so it cannot be replayed; nothing worth recording.
        return false;
    }

    // Store the expiry so the row can be pruned without re-parsing the token.
    const expiresAt = exp ? new Date(exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
        'INSERT IGNORE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)',
        [jti, expiresAt]
    );

    revokedCache.set(jti, { revoked: true, until: expiresAt.getTime() });
    return true;
};

/**
 * Drop rows for tokens that have expired anyway.
 * @returns {Promise<number>} rows removed
 */
const pruneExpired = async () => {
    const [result] = await db.query('DELETE FROM revoked_tokens WHERE expires_at < NOW()');
    return result?.affectedRows ?? 0;
};

module.exports = { newTokenId, isRevoked, revoke, pruneExpired, expiryOf };
