// Rules for ticket quantities on a NEW booking. Pure so the tests can reach them without a
// database, matching backend/utils/reservation-edit-rules.js.
//
// Why this exists separately from validateTicketEdit: the create path previously used
// `parseInt(x) || 0` directly, which let a crafted request store negative counts
// (`parseInt('-3')` -> -3). A negative total passes a `totalVisitors === 0` guard,
// *reduces* the projected daily total used by the capacity check, and is written to
// the database - where it corrupts slot accounting and revenue figures.

const { MAX_TICKETS_PER_BOOKING } = require('./reservation-edit-rules');

/** Values that legitimately mean "nobody in this category". */
const isBlank = (value) => value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

/**
 * Parse one quantity field.
 *
 * Absent/blank means zero. Anything else must be a whole number of zero or more.
 * A present-but-malformed value is an error rather than zero, so a request cannot
 * silently drop a visitor (e.g. adultQuantity='3.7' becoming 0).
 *
 * @param {unknown} value
 * @returns {{ value: number }|{ error: true }}
 */
const parseQuantity = (value) => {
    if (isBlank(value)) return { value: 0 };

    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return { error: true };
        if (!Number.isInteger(value)) return { error: true };
        if (value < 0) return { error: true };
        return { value };
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        // Plain digits only. Rejects '-3', '1e3', '12abc', '0x10' and '3.7'.
        if (!/^\d+$/.test(trimmed)) return { error: true };
        const parsed = Number(trimmed);
        if (!Number.isSafeInteger(parsed)) return { error: true };
        return { value: parsed };
    }

    return { error: true };
};

/**
 * Validate the ticket quantities supplied when creating a reservation.
 *
 * @param {{ adult?: unknown, child?: unknown, resident?: unknown }} input
 * @returns {{ ok: boolean, quantities: {adult:number,child:number,resident:number}|null,
 *             totalVisitors: number, error: string|null }}
 */
const validateTicketBooking = ({ adult, child, resident } = {}) => {
    const supplied = { adult, child, resident };
    const quantities = {};
    let totalVisitors = 0;

    for (const key of ['adult', 'child', 'resident']) {
        const parsed = parseQuantity(supplied[key]);
        if (parsed.error) {
            return {
                ok: false,
                quantities: null,
                totalVisitors: 0,
                error: 'Each ticket quantity must be a whole number of zero or more.'
            };
        }
        quantities[key] = parsed.value;
        totalVisitors += parsed.value;
    }

    if (totalVisitors < 1) {
        return {
            ok: false,
            quantities: null,
            totalVisitors,
            error: 'Please select at least one visitor.'
        };
    }

    if (totalVisitors > MAX_TICKETS_PER_BOOKING) {
        return {
            ok: false,
            quantities: null,
            totalVisitors,
            error: `A single booking cannot exceed ${MAX_TICKETS_PER_BOOKING} tickets.`
        };
    }

    return { ok: true, quantities, totalVisitors, error: null };
};

module.exports = { validateTicketBooking, MAX_TICKETS_PER_BOOKING };

