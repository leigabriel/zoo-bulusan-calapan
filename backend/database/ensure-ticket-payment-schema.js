const db = require('../config/database');

/**
 * Payment columns for ticket_reservations.
 *
 * event_reservations already has an equivalent set added by
 * database/ensure-event-payment-schema.js. Tickets had none at all, so ticket
 * reservations could not record a PayMongo checkout, and the webhook had
 * nothing to reconcile against.
 */
const columns = {
    payment_amount: 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
    payment_method: 'VARCHAR(30) DEFAULT NULL',
    payment_status: "ENUM('unpaid', 'pending', 'paid', 'failed', 'expired', 'refunded') NOT NULL DEFAULT 'unpaid'",
    paymongo_checkout_session_id: 'VARCHAR(100) DEFAULT NULL',
    paymongo_payment_id: 'VARCHAR(100) DEFAULT NULL',
    payment_paid_at: 'TIMESTAMP NULL DEFAULT NULL',
    refund_status: "ENUM('requested', 'approved', 'rejected') DEFAULT NULL",
    refund_requested_at: 'TIMESTAMP NULL DEFAULT NULL'
};

const ensureTicketPaymentSchema = async () => {
    for (const [name, definition] of Object.entries(columns)) {
        const [existing] = await db.query('SHOW COLUMNS FROM ticket_reservations LIKE ?', [name]);
        if (!existing.length) {
            await db.query(`ALTER TABLE ticket_reservations ADD COLUMN ${name} ${definition}`);
        }
    }

    const [indexes] = await db.query('SHOW INDEX FROM ticket_reservations');
    const indexNames = new Set(indexes.map(index => index.Key_name));
    if (!indexNames.has('idx_ticket_reservations_payment_status')) {
        await db.query('ALTER TABLE ticket_reservations ADD INDEX idx_ticket_reservations_payment_status (payment_status)');
    }
    if (!indexNames.has('idx_ticket_reservations_checkout')) {
        await db.query('ALTER TABLE ticket_reservations ADD INDEX idx_ticket_reservations_checkout (paymongo_checkout_session_id)');
    }
};

module.exports = ensureTicketPaymentSchema;