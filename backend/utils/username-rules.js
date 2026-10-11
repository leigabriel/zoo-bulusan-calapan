const RESERVED_USERNAMES = new Set(['admin', 'staff', 'jiji', 'bulusanzoo', 'system']);

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const MIN_LENGTH = 3;
const MAX_LENGTH = 50;

// Duplicated from auth-controller.js sanitizeInput rather than imported: controllers
// import this module, so requiring the controller here would create a circular require.
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate a visitor-chosen username.
 *
 * Case is preserved in the returned value (it is displayed as a name), but the
 * reserved-name check is case-insensitive. MySQL's utf8mb4_unicode_ci collation
 * makes the uniqueness check case-insensitive too, so `Maria` and `maria` collide
 * and only one can be claimed.
 *
 * @param {unknown} input
 * @returns {{ ok: boolean, value: string, error: string|null }}
 */
const validateUsername = (input) => {
    const trimmed = typeof input === 'string' ? input.trim() : '';

    if (!trimmed) {
        return { ok: false, value: '', error: 'Please choose a name.' };
    }
    // The charset check runs on the raw trimmed value, before sanitizing: stripping
    // angle brackets first would turn "<script>" into the valid name "script" and
    // silently accept it instead of rejecting the attempt.
    if (!USERNAME_PATTERN.test(trimmed)) {
        return { ok: false, value: trimmed, error: 'Use letters, numbers, dots, hyphens and underscores only.' };
    }
    if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
        return { ok: false, value: trimmed, error: `Name must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.` };
    }
    if (RESERVED_USERNAMES.has(trimmed.toLowerCase())) {
        return { ok: false, value: trimmed, error: 'That name is reserved. Please choose another.' };
    }

    // Belt and braces: the charset check above already excludes < and >, so this is
    // a no-op in practice and exists only to keep the stored value sanitized.
    return { ok: true, value: sanitizeInput(trimmed), error: null };
};

module.exports = { validateUsername, RESERVED_USERNAMES };