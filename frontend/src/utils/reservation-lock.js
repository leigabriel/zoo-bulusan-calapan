/**
 * Read-only window for a visitor's reservation history.
 *
 * A confirmed or completed ticket/event is settled, not forever editable. Seven days
 * after it was confirmed (or checked in, for a completed booking) the visitor may only
 * download the receipt or archive the reservation.
 *
 * Mirrors backend/utils/reservation-lock-rules.js. The server enforces the same rule;
 * the helpers here only keep the UI from offering actions that would be refused.
 */

export const RESERVATION_LOCK_WINDOW_DAYS = 7;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/** Only settled reservations lock. Pending bookings keep their self-service rules. */
export const LOCKABLE_RESERVATION_STATUSES = Object.freeze(['confirmed', 'completed']);

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
 * @param {object} reservation
 * @returns {Date|null} null when the reservation is not lockable
 */
export const reservationLockAnchor = (reservation) => {
    const status = String(reservation?.status ?? '').toLowerCase();
    if (!LOCKABLE_RESERVATION_STATUSES.includes(status)) return null;

    return toDate(readField(reservation, 'confirmedAt', 'confirmed_at'))
        || toDate(readField(reservation, 'checkedInAt', 'checked_in_at'))
        || toDate(readField(reservation, 'updatedAt', 'updated_at'));
};

/**
 * Moment after which a confirmed/completed reservation becomes read-only.
 *
 * @param {object} reservation
 * @returns {Date|null}
 */
export const reservationLockDeadline = (reservation) => {
    const anchor = reservationLockAnchor(reservation);
    if (!anchor) return null;
    return new Date(anchor.getTime() + RESERVATION_LOCK_WINDOW_DAYS * DAY_IN_MS);
};

/**
 * True once a confirmed/completed reservation is past its seven-day read-only window.
 *
 * @param {object} reservation
 * @param {number|Date} [now]
 * @returns {boolean}
 */
export const isReservationLocked = (reservation, now = Date.now()) => {
    const deadline = reservationLockDeadline(reservation);
    if (!deadline) return false;

    const nowMs = now instanceof Date ? now.getTime() : Number(now);
    if (!Number.isFinite(nowMs)) return false;

    return nowMs >= deadline.getTime();
};
