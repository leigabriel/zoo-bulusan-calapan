/**
 * Single source of truth for cryptographic secrets.
 *
 * Every JWT signature, the Admin Master Key challenge, the public-ID cipher and
 * the reservation QR HMAC are derived from here. The point of this module is
 * that there is no fallback value anywhere: if JWT_SECRET is missing or is one
 * of the well-known placeholder strings, the process refuses to start rather
 * than signing tokens with a secret that is published in the repository.
 *
 * Generate a secret with:
 *   node scripts/generate-secrets.js
 */

const path = require('path');
const crypto = require('crypto');

// Load .env here so secret resolution never depends on module require order.
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Values that have shipped in this repository and must never be accepted.
const INSECURE_VALUES = new Set([
    'your-secret-key',
    'development-only-public-id-secret',
    'zoo-bulusan-reservation-secret',
    'secret',
    'changeme',
    'password',
    '123456'
]);

// Short secrets are brute-forceable offline once a token leaks.
const MIN_SECRET_LENGTH = 32;

/** Fixed application salt. Domain separation comes from the `info` argument. */
const HKDF_SALT = 'bulusan-zoo-calapan';

/**
 * Read a secret from the environment, rejecting placeholders and weak values.
 * @param {string} name Environment variable name
 * @returns {string|null} The trimmed secret, or null if absent/unsafe
 */
const readEnvSecret = (name) => {
    const raw = process.env[name];
    if (typeof raw !== 'string') return null;

    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (INSECURE_VALUES.has(trimmed.toLowerCase())) return null;

    return trimmed;
};

// ---------------------------------------------------------------------------
// Root secret: required. No default, ever.
// ---------------------------------------------------------------------------

const jwtSecret = readEnvSecret('JWT_SECRET');

if (!jwtSecret) {
    const reason = process.env.JWT_SECRET
        ? 'JWT_SECRET is set to a known placeholder value'
        : 'JWT_SECRET is not set';
    throw new Error(
        `[config] ${reason}. Refusing to start.\n` +
        '  Generate one with:  node scripts/generate-secrets.js\n' +
        '  Then set JWT_SECRET in backend/.env.\n' +
        '  Rotating JWT_SECRET signs out every session and invalidates any\n' +
        '  outstanding single-use links.'
    );
}

if (jwtSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
        `[config] JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters ` +
        `(got ${jwtSecret.length}). Generate a strong secret with:  node scripts/generate-secrets.js`
    );
}

// ---------------------------------------------------------------------------
// Purpose-scoped subkeys
//
// Derived from the root secret with HKDF-SHA256 so that a key compromised for
// one purpose cannot be replayed against another, while the operator still
// only has to manage one secret. Setting the environment variable explicitly
// overrides the derived value.
// ---------------------------------------------------------------------------

/**
 * Derive a 32-byte subkey bound to a single purpose.
 * @param {string} info Domain-separation label
 * @returns {string} Hex-encoded key
 */
const deriveSubkey = (info) =>
    Buffer.from(crypto.hkdfSync('sha256', jwtSecret, HKDF_SALT, info, 32)).toString('hex');

/** Signs and verifies JWTs (access tokens, admin master-key challenge). */
const jwtExpire = process.env.JWT_EXPIRE?.trim() || '7d';

/** AES-256-GCM key for opaque public identifiers (`pid_...`). */
const publicIdSecret = readEnvSecret('PUBLIC_ID_SECRET') || deriveSubkey('public-identifiers/aes-256-gcm');

/** HMAC-SHA256 key for signed reservation QR payloads. */
const reservationQrSecret = readEnvSecret('RESERVATION_QR_SECRET') || deriveSubkey('reservation-qr/hmac-sha256');


// ---------------------------------------------------------------------------
// Deployment sanity check
//
// CORS fails closed, so a production deploy whose FRONTEND_URL still points at
// localhost will reject every request the live site makes. That is a total outage
// rather than a warning, so it is worth failing loudly at boot.
// ---------------------------------------------------------------------------

if (process.env.NODE_ENV === 'production') {
    const frontend = (process.env.FRONTEND_URL || '').trim();
    const problems = [];

    if (!frontend) {
        problems.push('FRONTEND_URL is unset. CORS will reject the live frontend.');
    } else if (/localhost|127\.0\.0\.1|^http:\/\/(10|192\.168)\./i.test(frontend)) {
        problems.push(`FRONTEND_URL is \`${frontend}\`, which is a local address. Set it to https://bulusanzoo.com.`);
    }

    if (!process.env.CORS_ORIGIN) {
        problems.push('CORS_ORIGIN is unset. The built-in allow-list will be used instead.');
    }

    if (!process.env.BACKEND_URL) {
        problems.push('BACKEND_URL is unset; generated profile and upload URLs will point at the wrong host.');
    }

    if (!process.env.GOOGLE_CALLBACK_URL) {
        problems.push('GOOGLE_CALLBACK_URL is unset; Google sign-in cannot complete.');
    } else if (/localhost|127\.0\.0\.1/i.test(process.env.GOOGLE_CALLBACK_URL)) {
        problems.push('GOOGLE_CALLBACK_URL points at localhost; Google will refuse the redirect.');
    }

    if (problems.length) {
        console.error(
            '[config] Production deployment looks misconfigured:\n' +
            problems.map(p => '  - ' + p).join('\n') +
            '\n  The server will still start, but requests from the live site may be rejected.'
        );
    }
}

module.exports = {
    jwtSecret,
    jwtExpire,
    publicIdSecret,
    reservationQrSecret
};