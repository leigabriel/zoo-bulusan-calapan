// Rules for the visitor-facing reservation archive and permanent-delete flow.
//
// Kept pure and free of database access, matching reservation-edit-rules.js, so the rules
// that gate an irreversible action can be tested without a connection.

const RESERVATION_TYPES = new Set(['ticket', 'event']);

// A single request may not touch more than this many rows. Bulk selection is a convenience
// for the handful of bookings a visitor actually makes, not a bulk-import path.
const MAX_SELECTION = 100;

const normalizeIds = (raw) => {
    if (!Array.isArray(raw)) return null;

    const ids = [];
    for (const value of raw) {
        const n = typeof value === 'number' ? value : Number(String(value).trim());
        // Number('') is 0 and Number('  ') is 0, both caught by the positive check below.
        if (!Number.isInteger(n) || n <= 0) return null;
        if (!ids.includes(n)) ids.push(n);
    }
    return ids;
};

/**
 * Validate a selection of reservations to act on.
 *
 * @param {{type?: string, ids?: Array<number|string>}} input
 * @returns {{ok: boolean, ids?: number[], type?: string, error?: string}}
 */
const validateArchiveSelection = ({ type, ids } = {}) => {
    if (!RESERVATION_TYPES.has(type)) {
        return { ok: false, error: 'Invalid reservation type.' };
    }

    const normalized = normalizeIds(ids);
    if (!normalized || normalized.length === 0) {
        return { ok: false, error: 'Select at least one reservation.' };
    }

    if (normalized.length > MAX_SELECTION) {
        return { ok: false, error: 'Too many reservations selected at once.' };
    }

    return { ok: true, ids: normalized, type };
};

/**
 * Validate a permanent-delete request. Archives are reversible; this is not, so it carries
 * its own confirmation gate on top of the selection rules.
 *
 * @param {object} input
 * @param {string} input.type - 'ticket' | 'event'
 * @param {Array<number|string>} input.ids
 * @param {string} [input.password] - the visitor's account password
 * @param {boolean} input.hasPassword - whether the account has a password at all
 * @returns {{ok: boolean, reason?: string, error?: string, ids?: number[], type?: string}}
 */
const validatePermanentDelete = ({ type, ids, password, hasPassword } = {}) => {
    const selection = validateArchiveSelection({ type, ids });
    if (!selection.ok) {
        return { ok: false, reason: 'invalid_selection', error: selection.error };
    }

    // Google sign-in leaves users.password NULL. Checking that first keeps the account from
    // being permanently locked out of this action; the client offers to create a password.
    if (!hasPassword) {
        return {
            ok: false,
            reason: 'password_setup_required',
            error: 'Create a password for your account before permanently deleting reservations.'
        };
    }

    if (typeof password !== 'string' || password.trim() === '') {
        return {
            ok: false,
            reason: 'password_required',
            error: 'Enter your password to confirm permanent deletion.'
        };
    }

    return { ok: true, ids: selection.ids, type: selection.type };
};

module.exports = {
    RESERVATION_TYPES,
    MAX_SELECTION,
    validateArchiveSelection,
    validatePermanentDelete
};