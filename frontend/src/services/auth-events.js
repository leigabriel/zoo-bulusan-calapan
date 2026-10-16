/**
 * Session-expiry signal.
 *
 * Deliberately dependency-free: the API client emits, AuthContext-adjacent UI
 * reacts. A module event keeps this out of the request/response path and avoids
 * a circular import between api-client and the React tree.
 */

/** Dispatched when the API rejects a request with 401 for a session that was signed in. */
export const AUTH_EXPIRED_EVENT = 'bulusan:auth-expired';

/**
 * Tell the app that the current session is no longer valid.
 * @param {{ status?: number, path?: string }} [detail]
 */
export const emitAuthExpired = (detail = {}) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail }));
};

/**
 * Subscribe to session expiry.
 * @param {(detail: object) => void} handler
 * @returns {() => void} unsubscribe
 */
export const onAuthExpired = (handler) => {
    if (typeof window === 'undefined') return () => {};
    const listener = (event) => handler(event?.detail ?? {});
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
};

/**
 * Endpoints that legitimately answer 401 while a session is still valid.
 * A wrong password or a wrong master key must not be treated as an expired session.
 */
export const CREDENTIAL_ENDPOINTS = [
    '/auth/login',
    '/auth/register',
    '/auth/master-key/verify',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/resend-verification',
    '/auth/verify-email',
    '/auth/google/session',
    '/health'
];

/**
 * Is this a 401 the user should be signed out for?
 * @param {number} status
 * @param {string} url
 * @returns {boolean}
 */
export const isSessionExpiry = (status, url) => {
    if (status !== 401) return false;
    if (typeof url !== 'string' || !url) return false;
    return !CREDENTIAL_ENDPOINTS.some((path) => url.includes(path));
};
