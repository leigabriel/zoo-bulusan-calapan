/**
 * Central error handling.
 *
 * Two rules this module enforces:
 *
 *  1. An error's message is for the log, not automatically for the client.
 *     mysql2 messages carry table, column, index and constraint names, so
 *     forwarding `err.message` on a 5xx hands an attacker your schema. Only
 *     errors this codebase authored deliberately - ApiError, and the existing
 *     WalkInError shape - may put their own message in a response.
 *
 *  2. Diagnostics are logged in full, server side. The previous handler called
 *     console.error('Server error') and threw the error object away, so the one
 *     code path that actually reached it produced logs with no stack, no driver
 *     code and no request context.
 *
 * Stack traces are exposed only when EXPOSE_ERROR_DETAILS=true, which must not
 * be set in production. This is deliberately not keyed off NODE_ENV: a
 * misspelled NODE_ENV used to publish full stack traces on every unhandled
 * error.
 */

const crypto = require('crypto');

/** Messages for statuses we did not author. Never leak the underlying reason. */
const GENERIC_MESSAGES = {
    400: 'Invalid request',
    401: 'Not authorized',
    403: 'Not authorized',
    404: 'Not found',
    409: 'Conflict',
    413: 'Payload too large',
    429: 'Too many requests'
};

/**
 * An error whose message is safe to return to the client.
 */
class ApiError extends Error {
    /**
     * @param {number} status HTTP status
     * @param {string} message Message safe to show the caller
     * @param {object} [options]
     * @param {string} [options.code] Stable machine-readable code
     * @param {unknown} [options.cause] Original error, logged but not returned
     */
    constructor(status, message, options = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = options.code;
        if (options.cause) this.cause = options.cause;
    }
}

/** Convenience constructors for the common cases. */
ApiError.badRequest = (message, options) => new ApiError(400, message, options);
ApiError.unauthorized = (message, options) => new ApiError(401, message, options);
ApiError.forbidden = (message, options) => new ApiError(403, message, options);
ApiError.notFound = (message, options) => new ApiError(404, message, options);

/**
 * Is this an error whose message we deliberately authored?
 * ApiError is ours. WalkInError (services/walk-in-service.js) sets `status` and
 * a hand-written message; it predates this module and is still thrown with next().
 *
 * @param {any} err
 * @returns {boolean}
 */
/**
 * Errors whose messages we authored and may therefore show the client.
 *
 * This is a strict allowlist by identity, not by shape. Matching on shape
 * (a 4xx status plus a message) was not safe: an upstream library can attach
 * a verbose message to an error that also carries a 4xx status, and that
 * message would then be forwarded to the client.
 */
const AUTHORED_ERROR_NAMES = new Set(['WalkInError']);

const isAuthoredError = (err) => {
    if (err instanceof ApiError) return true;
    return typeof err?.name === 'string' && AUTHORED_ERROR_NAMES.has(err.name);
};

/**
 * Resolve the HTTP status for an error.
 *
 * Only an explicitly valid status is honoured. A driver error can carry an
 * unrelated numeric field, so anything outside 400-599 is treated as a 500.
 *
 * @param {any} err
 * @returns {number}
 */
const resolveStatus = (err) => {
    const candidate = err?.status ?? err?.statusCode;
    if (Number.isInteger(candidate) && candidate >= 400 && candidate <= 599) return candidate;
    return 500;
};

/**
 * Decide what the client is told.
 *
 * @param {any} err
 * @param {number} status
 * @returns {string}
 */
const clientMessage = (err, status) => {
    if (status >= 500) return 'Something went wrong. Please try again.';
    if (isAuthoredError(err)) return err.message;
    return GENERIC_MESSAGES[status] || 'Request failed';
};

/** Attach an id used to correlate a client report with the server log. */
const requestId = (req) => {
    if (req.id) return req.id;
    req.id = crypto.randomBytes(8).toString('hex');
    return req.id;
};

/**
 * Log the failure with everything needed to diagnose it.
 *
 * @param {any} err
 * @param {import('express').Request} req
 * @param {number} status
 * @returns {string} the correlation id
 */
const logError = (err, req, status) => {
    const id = requestId(req);

    // The whole point of this function: the error object is actually logged.
    console.error(`[error ${id}] ${req.method} ${req.originalUrl || req.url} -> ${status}`, {
        requestId: id,
        status,
        method: req.method,
        path: req.originalUrl || req.url,
        userId: req.user?.id ?? null,
        ip: req.ip,
        name: err?.name,
        message: err?.message,
        code: err?.code,
        stack: err?.stack,
        cause: err?.cause ? { name: err.cause.name, message: err.cause.message, code: err.cause.code } : undefined
    });

    return id;
};

/**
 * Express error-handling middleware.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {Function} next
 */
const errorHandler = (err, req, res, next) => {
    // Headers already sent means the response is committed; hand back to
    // Express so it can destroy the socket rather than throwing
    // ERR_HTTP_HEADERS_SENT.
    if (res.headersSent) return next(err);

    const status = resolveStatus(err);
    const id = logError(err, req, status);

    const body = {
        success: false,
        message: clientMessage(err, status),
        requestId: id
    };

    if (err?.code) body.code = err.code;

    // Opt-in only, and never implied by NODE_ENV.
    if (process.env.EXPOSE_ERROR_DETAILS === 'true' && status >= 500 && err?.stack) {
        body.detail = err.stack;
    }

    return res.status(status).json(body);
};

/** 404 handler for unmatched routes. */
const notFoundHandler = (req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
};

module.exports = {
    ApiError,
    errorHandler,
    notFoundHandler,
    isAuthoredError,
    resolveStatus,
    clientMessage,
    GENERIC_MESSAGES
};
