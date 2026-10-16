/**
 * CORS origin allow-list.
 *
 * Origins are matched EXACTLY after normalising a trailing slash. An earlier
 * implementation used String.prototype.startsWith, which is a prefix match and
 * let any lookalike through: 'https://bulusanzoo.vercel.app.evil.com' and
 * 'http://localhost:51730' both passed. With `credentials: true` that is a real
 * cross-origin exposure, so exact comparison is required here.
 */

/** Strip a trailing slash so 'https://site/' and 'https://site' compare equal. */
const normalizeOrigin = (value) =>
    (typeof value === 'string' ? value.trim() : '').replace(/\/+$/, '');

/**
 * Build the allow-list from the environment plus the known first-party origins.
 *
 * The localhost and private-range patterns are anchored, so they only match a
 * complete origin. They exist because staff test the app from phones and other
 * devices on the site LAN.
 *
 * @param {NodeJS.ProcessEnv} env
 * @returns {Array<string|RegExp>}
 */
const buildAllowedOrigins = (env = process.env) => [
    env.CORS_ORIGIN,
    env.FRONTEND_URL,
    // Production frontend. Keep these in sync with the deployed FRONTEND_URL /
    // CORS_ORIGIN settings: CORS fails closed, so a missing entry here means the
    // live site cannot call the API.
    'https://bulusanzoo.com',
    'https://www.bulusanzoo.com',
    // Previous deployment, kept so an in-flight rollout is not locked out.
    'https://bulusanzoo.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'capacitor://localhost',
    'https://localhost',
    'https://localhost:8100',
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/,
    /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
    // Note: the original pattern here was ^http:\/\/192\.168\.\d+\.\d+\.\d+:\d+$,
    // which demands three octets after "192.168." (192.168.X.Y.Z) and therefore
    // matched no real address at all. Corrected to two octets.
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/
].filter(Boolean);

/**
 * Test an origin against the allow-list.
 *
 * @param {string} origin - Value of the Origin header
 * @param {Array<string|RegExp>} allowed - Result of buildAllowedOrigins()
 * @returns {boolean}
 */
const isOriginAllowed = (origin, allowed) => {
    if (typeof origin !== 'string' || !origin) return false;

    const candidate = normalizeOrigin(origin);

    return allowed.some(entry => {
        if (entry instanceof RegExp) return entry.test(candidate);
        return candidate === normalizeOrigin(entry);
    });
};

/**
 * Resolve whether CORS should permit an origin.
 *
 * Requests with no Origin header (curl, native apps, server-to-server) are
 * allowed: CORS is a browser mechanism and does not apply to them.
 *
 * `ALLOW_ANY_ORIGIN` is an explicit, deliberate opt-in. It replaces the old
 * behaviour where any NODE_ENV other than 'production' silently permitted every
 * origin, which turned a deployment misconfiguration into a full cross-origin
 * bypass.
 *
 * @param {string|undefined} origin
 * @param {Array<string|RegExp>} allowed
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {boolean}
 */
const shouldAllowOrigin = (origin, allowed, env = process.env) => {
    if (!origin) return true;
    if (isOriginAllowed(origin, allowed)) return true;
    return env.ALLOW_ANY_ORIGIN === 'true';
};


/**
 * Resolve which origin a server-driven redirect may target.
 *
 * Google OAuth used to take the post-login origin from the client Referer header and
 * accept it when the port was 5173 or the path contained "/login". Both checks are
 * trivially satisfiable by an attacker: https://evil.com:5173 and https://evil.com/x/login
 * both passed, so a victim could be redirected to an arbitrary host straight after
 * authenticating - a ready-made phishing page.
 *
 * The CORS allow-list is already the set of origins we are willing to interact with, so
 * it is reused here. Localhost and private-range patterns keep LAN testing on phones
 * working; everything else falls back to FRONTEND_URL.
 *
 * @param {string|undefined} referer Raw Referer or Origin header
 * @param {Array<string|RegExp>} allowed Result of buildAllowedOrigins()
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string} A trusted origin, never attacker-controlled
 */
const resolveTrustedFrontendOrigin = (referer, allowed, env = process.env) => {
    const fallback = normalizeOrigin(env.FRONTEND_URL) || 'http://localhost:5173';
    if (typeof referer !== 'string' || !referer) return fallback;

    try {
        const parsed = new URL(referer);
        const origin = `${parsed.protocol}//${parsed.host}`;
        return isOriginAllowed(origin, allowed) ? origin : fallback;
    } catch {
        return fallback;
    }
};

module.exports = {
    buildAllowedOrigins,
    isOriginAllowed,
    normalizeOrigin,
    shouldAllowOrigin,
    resolveTrustedFrontendOrigin
};