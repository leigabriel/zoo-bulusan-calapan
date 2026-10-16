/**
 * Rate limiting.
 *
 * Limits are applied per route group rather than as one blanket global limiter.
 * That is deliberate: this app polls from several places at once (Header, both
 * layouts, the dashboard, the staff monitor, the reservations panel), so a
 * single per-IP budget would rate-limit legitimate staff using the admin UI and
 * would also penalise whole schools or mobile carriers sharing one public IP.
 * The abuse cases that actually matter - credential stuffing, account
 * enumeration, password-reset bombing, and metered LLM spend - are all on
 * specific endpoints, so those are the ones that get tight budgets.
 *
 * Escape hatch: set RATE_LIMIT_ENABLED=false (or RATE_LIMIT_DISABLED=true) to
 * turn every limiter off.
 */

const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// Keep the test suite (and future supertest runs) deterministic.
const DISABLED =
    process.env.NODE_ENV === 'test' ||
    process.env.RATE_LIMIT_ENABLED === 'false' ||
    process.env.RATE_LIMIT_DISABLED === 'true';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/**
 * Build a limiter with this project's shared defaults.
 *
 * @param {object} options
 * @param {number} options.limit Requests permitted per window
 * @param {number} options.windowMs Window length in ms
 * @param {string} options.message Message returned with the 429
 * @param {boolean} [options.skipSuccessfulRequests] Only count failed attempts
 * @param {boolean} [options.authenticated] Key authenticated users by id instead of IP
 */
const limiter = ({ limit, windowMs, message, skipSuccessfulRequests = false, authenticated = false }) =>
    rateLimit({
        windowMs,
        limit,
        // draft-6 emits separate RateLimit-Limit / -Remaining / -Reset headers,
        // which gateways, monitoring tools and API clients parse most reliably.
        standardHeaders: 'draft-6',
        legacyHeaders: false,
        skip: () => DISABLED,
        skipSuccessfulRequests,
        // Keying by IP keeps anonymous abuse contained. For authenticated
        // endpoints we key by user id so that many users behind one NAT do not
        // share a budget, and a stolen token cannot be laundered by rotating IPs.
        keyGenerator: authenticated
            ? (req) => (req.user?.id ? `u:${req.user.id}` : `ip:${ipKeyGenerator(req.ip)}`)
            : (req) => ipKeyGenerator(req.ip),
        message: { success: false, message },
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });

/**
 * Credential endpoints: login, register, reset, resend.
 * Only failed attempts count, so a legitimate user who signs in repeatedly is
 * never locked out, while password spraying and enumeration are throttled.
 */
const authLimiter = limiter({
    windowMs: 15 * MINUTE,
    limit: 10,
    skipSuccessfulRequests: true,
    message: 'Too many attempts. Please wait a few minutes and try again.'
});

/**
 * Admin master-key verification. Tight: it is a second factor on the most
 * privileged role in the system.
 */
const masterKeyLimiter = limiter({
    windowMs: 15 * MINUTE,
    limit: 5,
    message: 'Too many master key attempts. Please wait before trying again.'
});

/** Google OAuth start/callback/handoff. */
const oauthLimiter = limiter({
    windowMs: 15 * MINUTE,
    limit: 20,
    message: 'Too many sign-in attempts. Please wait a few minutes and try again.'
});

/**
 * Public appeal submission. Rare, unauthenticated, and writes to a staff queue.
 */
const appealLimiter = limiter({
    windowMs: HOUR,
    limit: 5,
    message: 'Too many submissions. Please try again later.'
});

/**
 * LLM-backed endpoints. Each call is billed against the Gemini key, and
 * POST /api/ai/chat is reachable without authentication.
 */
const aiLimiter = limiter({
    windowMs: MINUTE,
    limit: 20,
    message: 'Too many AI requests. Please slow down.'
});

/** AI scanner predictions; heavier compute, moderate volume. */
const predictionLimiter = limiter({
    windowMs: MINUTE,
    limit: 30,
    authenticated: true,
    message: 'Too many scan requests. Please slow down.'
});

/** Public analytics beacon. Fires on ordinary page views, so the budget is high. */
const visitLimiter = limiter({
    windowMs: MINUTE,
    limit: 60,
    message: 'Too many requests.'
});

/** Upload endpoints, including the legacy base64 route that writes files. */
const uploadLimiter = limiter({
    windowMs: 15 * MINUTE,
    limit: 30,
    authenticated: true,
    message: 'Too many uploads. Please wait a few minutes and try again.'
});

/**
 * The `?full=true` health probe opens a database connection on every call and
 * is public and unauthenticated, so it gets its own small budget.
 */
const healthLimiter = limiter({
    windowMs: MINUTE,
    limit: 30,
    message: 'Too many health check requests.'
});

/** Generic authenticated-write backstop for admin/staff management routes. */
const writeLimiter = limiter({
    windowMs: MINUTE,
    limit: 120,
    authenticated: true,
    message: 'Too many requests. Please slow down.'
});

module.exports = {
    authLimiter,
    masterKeyLimiter,
    oauthLimiter,
    appealLimiter,
    aiLimiter,
    predictionLimiter,
    visitLimiter,
    uploadLimiter,
    healthLimiter,
    writeLimiter,
    RATE_LIMIT_DISABLED: DISABLED
};