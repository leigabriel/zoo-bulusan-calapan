const db = require('../config/database');

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

const ensureEventPaymentSchema = async () => {
    for (const [name, definition] of Object.entries(columns)) {
        const [existing] = await db.query('SHOW COLUMNS FROM event_reservations LIKE ?', [name]);
        if (!existing.length) {
            await db.query(`ALTER TABLE event_reservations ADD COLUMN ${name} ${definition}`);
        }
    }

    const [indexes] = await db.query('SHOW INDEX FROM event_reservations');
    const indexNames = new Set(indexes.map(index => index.Key_name));
    if (!indexNames.has('idx_event_reservations_payment_status')) {
        await db.query('ALTER TABLE event_reservations ADD INDEX idx_event_reservations_payment_status (payment_status)');
    }
    if (!indexNames.has('idx_event_reservations_checkout')) {
        await db.query('ALTER TABLE event_reservations ADD INDEX idx_event_reservations_checkout (paymongo_checkout_session_id)');
    }

    await db.query(`
        CREATE TABLE IF NOT EXISTS paymongo_webhook_events (
            id INT PRIMARY KEY AUTO_INCREMENT,
            event_id VARCHAR(150) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_paymongo_webhook_event (event_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
};

module.exports = ensureEventPaymentSchema;