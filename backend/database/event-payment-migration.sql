ALTER TABLE event_reservations
    ADD COLUMN payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER participant_details,
    ADD COLUMN payment_method VARCHAR(30) DEFAULT NULL AFTER payment_amount,
    ADD COLUMN payment_status ENUM('unpaid', 'pending', 'paid', 'failed', 'expired', 'refunded') NOT NULL DEFAULT 'unpaid' AFTER payment_method,
    ADD COLUMN paymongo_checkout_session_id VARCHAR(100) DEFAULT NULL AFTER payment_status,
    ADD COLUMN paymongo_payment_id VARCHAR(100) DEFAULT NULL AFTER paymongo_checkout_session_id,
    ADD COLUMN payment_paid_at TIMESTAMP NULL DEFAULT NULL AFTER paymongo_payment_id,
    ADD INDEX idx_event_reservations_payment_status (payment_status),
    ADD INDEX idx_event_reservations_checkout (paymongo_checkout_session_id);

CREATE TABLE IF NOT EXISTS paymongo_webhook_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_paymongo_webhook_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;