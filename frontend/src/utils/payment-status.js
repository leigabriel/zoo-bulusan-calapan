/**
 * Shared payment status/method presentation for the admin and staff ticket views.
 *
 * These two pages previously each carried their own copy of the badge switch and
 * their own idea of the field names, and they drifted: the staff page normalised
 * to `paymentStatus` but filtered on `payment_status`, so its payment filter
 * silently did nothing. One source here stops that recurring.
 *
 * The values come from the ticket_reservations.payment_status enum added by
 * backend/database/ensure-ticket-payment-schema.js:
 *   'unpaid' | 'pending' | 'paid' | 'failed' | 'expired' | 'refunded'
 */

/** Every status the backend can store. Keep in step with the SQL enum. */
export const PAYMENT_STATUSES = Object.freeze([
    'unpaid',
    'pending',
    'paid',
    'failed',
    'expired',
    'refunded'
]);

/** Badge classes, matching the green/amber palette already used by these tables. */
const BADGES = {
    paid: 'bg-green-400/20 text-green-800 border-green-400/30',
    unpaid: 'bg-slate-500/20 text-slate-700 border-slate-400/30',
    pending: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
    failed: 'bg-red-500/20 text-red-700 border-red-500/30',
    expired: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
    refunded: 'bg-purple-500/20 text-purple-700 border-purple-400/30',
    // 'free' is not in the enum but older rows and walk-in flows used it.
    free: 'bg-green-400/20 text-green-800 border-green-400/30'
};

const LABELS = {
    paid: 'Paid',
    unpaid: 'Unpaid',
    pending: 'Payment pending',
    failed: 'Payment failed',
    expired: 'Payment expired',
    refunded: 'Refunded',
    free: 'Free entry'
};

/**
 * Normalise anything the API might hand us (including legacy 'not paid' and
 * missing values) into a known status key.
 *
 * @param {string|null|undefined} status
 * @returns {string} one of PAYMENT_STATUSES, or 'unpaid'
 */
export const normalizePaymentStatus = (status) => {
    const value = String(status ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (!value) return 'unpaid';
    if (value === 'not_paid') return 'unpaid';
    if (PAYMENT_STATUSES.includes(value)) return value;
    return value in BADGES ? value : 'unpaid';
};

/**
 * @param {string|null|undefined} status
 * @returns {string} tailwind classes for the status pill
 */
export const paymentStatusBadge = (status) =>
    BADGES[normalizePaymentStatus(status)] || BADGES.unpaid;

/**
 * @param {string|null|undefined} status
 * @returns {string} human-readable label
 */
export const paymentStatusLabel = (status) =>
    LABELS[normalizePaymentStatus(status)] || LABELS.unpaid;

const METHOD_LABELS = {
    qrph: 'QR Ph (PayMongo)',
    gcash: 'GCash',
    pay_at_bulusan: 'Pay at Bulusan',
    cash: 'Cash',
    free: 'Free entry'
};

/**
 * Human label for a stored payment_method.
 *
 * Returns 'Not selected' rather than defaulting to 'cash': a booking that has
 * not chosen how to pay has not paid cash, and saying so was misleading once
 * real QR Ph payments existed.
 *
 * @param {string|null|undefined} method
 * @returns {string}
 */
export const paymentMethodLabel = (method) => {
    const value = String(method ?? '').trim().toLowerCase();
    if (!value) return 'Not selected';
    return METHOD_LABELS[value] || value.replace(/_/g, ' ');
};

/**
 * The amount a ticket reservation is for, preferring the recorded payment amount
 * and falling back to what the visitor booked.
 *
 * @param {object} ticket - normalised ticket object
 * @returns {number} pesos
 */
export const ticketPaymentAmount = (ticket) => {
    const recorded = Number(ticket?.paymentAmount);
    if (Number.isFinite(recorded) && recorded > 0) return recorded;
    return Number(ticket?.price) || 0;
};

/**
 * True when a staff/admin member may usefully offer the mark-as-paid action:
 * anything not already settled.
 *
 * @param {string|null|undefined} status
 * @returns {boolean}
 */
export const canMarkAsPaid = (status) => {
    const value = normalizePaymentStatus(status);
    return value !== 'paid' && value !== 'free';
};
/**
 * True when a refund can meaningfully be requested for this booking.
 *
 * Only PayMongo (QR Ph) charges can be reversed through this flow. "Pay at
 * Bulusan" is settled in cash at the gate, so offering an online refund button
 * for it would promise something the system cannot deliver. Cash disputes are
 * handled in person.
 *
 * @param {string|null|undefined} method - stored payment_method
 * @param {string|null|undefined} status - stored payment_status
 * @returns {boolean}
 */
export const canRequestRefund = (method, status) => {
    const value = String(method ?? '').trim().toLowerCase();
    if (value !== 'qrph' && value !== 'gcash') return false;
    const state = normalizePaymentStatus(status);
    return state === 'paid' || state === 'failed' || state === 'expired';
};

/**
 * True when the booking was settled in cash at the gate rather than online.
 * Used to explain, rather than silently hide, why no refund button is offered.
 *
 * @param {string|null|undefined} method
 * @returns {boolean}
 */
export const isPaidAtVenue = (method) => {
    const value = String(method ?? '').trim().toLowerCase();
    return value === 'pay_at_bulus' + 'an' || value === 'cash';
};
