// Rules for the read-only window of a visitor's reservation history.
//
// A confirmed or completed ticket/event becomes historical seven days after it was
// settled. From that point the visitor may only download the receipt or archive the
// reservation; edits, cancellations, refunds and payment changes are refused.
//
// Kept pure and free of database access, matching reservation-edit-rules.js, so the
// boundary can be tested without a connection.

const RESERVATION_LOCK_WINDOW_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

// A booking only becomes read-only once staff have settled it. Pending bookings keep
// their existing self-service rules.
const LOCKABLE_STATUSES = new Set(['confirmed', 'completed']);

const LOCKED_MESSAGE =
    'This reservation is closed. Seven days after confirmation or completion, it can only be downloaded or archived.';

// Rows arrive from MySQL in snake_case, while tests and callers may build camelCase
// objects. Accept both rather than forcing every call site to duplicate a mapping.
const readField = (reservation, camel, snake) => {
    if (!reservation) return null;
    if (reservation[camel] !== undefined && reservation[camel] !== null) return reservation[camel];
    return reservation[snake] ?? null;
};

const toDate = (raw) => {
    if (!raw) return null;
    const parsed = raw instanceof Date ? raw : new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Moment the seven-day read-only window starts from.
 *
 * Confirmation and check-in are recorded in separate columns, so a completed booking
 * that was never explicitly confirmed still locks from its check-in time. `updated_at`
 * is the last resort for older rows written before those timestamps existed.
 *
 * @param {object} reservation
 * @returns {Date|null} null when the reservation is not lockable
 */
const reservationLockAnchor = (reservation) => {
    const status = String(reservation?.status ?? '').toLowerCase();
    if (!LOCKABLE_STATUSES.has(status)) return null;

    return toDate(readField(reservation, 'confirmedAt', 'confirmed_at'))
        || toDate(readField(reservation, 'checkedInAt', 'checked_in_at'))
        || toDate(readField(reservation, 'updatedAt', 'updated_at'));
};

/**
 * Moment after which a confirmed/completed reservation becomes read-only.
 * Returns null when the reservation is not lockable or has no usable timestamp.
 *
 * @param {object} reservation
 * @returns {Date|null}
 */
const reservationLockDeadline = (reservation) => {
    const anchor = reservationLockAnchor(reservation);
    if (!anchor) return null;
    return new Date(anchor.getTime() + RESERVATION_LOCK_WINDOW_DAYS * DAY_IN_MS);
};

/**
 * True once a confirmed/completed reservation is past its seven-day read-only window.
 *
 * @param {object} reservation
 * @param {number|Date} [now] - injectable clock for tests
 * @returns {boolean}
 */
const isReservationLocked = (reservation, now = Date.now()) => {
    const deadline = reservationLockDeadline(reservation);
    if (!deadline) return false;

    const nowMs = now instanceof Date ? now.getTime() : Number(now);
    if (!Number.isFinite(nowMs)) return false;

    return nowMs >= deadline.getTime();
};

module.exports = {
    RESERVATION_LOCK_WINDOW_DAYS,
    LOCKABLE_STATUSES,
    LOCKED_MESSAGE,
    reservationLockAnchor,
    reservationLockDeadline,
    isReservationLocked
};
