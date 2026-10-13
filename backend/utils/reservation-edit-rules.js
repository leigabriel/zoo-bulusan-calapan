// Rules for a visitor amending or cancelling their own reservation. Pure so the tests can
// reach them without a database, matching backend/utils/post-report-rules.js.

const MAX_TICKETS_PER_BOOKING = 200;

const toCount = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.floor(parsed);
};

/**
 * Validate a self-service ticket amendment.
 *
 * Quantities are clamped to whole non-negative numbers so a crafted request cannot store a
 * negative or fractional count (which would corrupt slot availability and revenue totals),
 * and a booking may not be edited down to zero visitors — that is a cancellation, not an edit.
 *
 * @param {{ adult?: unknown, child?: unknown, resident?: unknown }} input
 * @returns {{ ok: boolean, quantities: {adult:number,child:number,resident:number}|null,
 *             totalVisitors: number, error: string|null }}
 */
const validateTicketEdit = ({ adult, child, resident } = {}) => {
    const quantities = {
        adult: toCount(adult),
        child: toCount(child),
        resident: toCount(resident)
    };
    const totalVisitors = quantities.adult + quantities.child + quantities.resident;

    if (totalVisitors === 0) {
        return { ok: false, quantities: null, totalVisitors: 0, error: 'Please keep at least one visitor. Cancel the booking instead.' };
    }
    if (totalVisitors > MAX_TICKETS_PER_BOOKING) {
        return { ok: false, quantities: null, totalVisitors, error: `A single booking cannot exceed ${MAX_TICKETS_PER_BOOKING} tickets.` };
    }

    return { ok: true, quantities, totalVisitors, error: null };
};

/**
 * Validate a self-service event amendment.
 *
 * @param {{ participants?: unknown }} input
 * @returns {{ ok: boolean, participants: number|null, error: string|null }}
 */
const validateParticipantEdit = ({ participants } = {}) => {
    const parsed = Number(participants);
    if (!Number.isInteger(parsed) || parsed < 1) {
        return { ok: false, participants: null, error: 'Please enter a whole number of at least one participant.' };
    }
    if (parsed > MAX_TICKETS_PER_BOOKING) {
        return { ok: false, participants: null, error: `A single booking cannot exceed ${MAX_TICKETS_PER_BOOKING} participants.` };
    }
    return { ok: true, participants: parsed, error: null };
};

module.exports = { validateTicketEdit, validateParticipantEdit, MAX_TICKETS_PER_BOOKING };
