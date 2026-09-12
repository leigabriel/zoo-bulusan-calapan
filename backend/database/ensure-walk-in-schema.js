const db = require('../config/database');

const ensureWalkInSchema = async () => {
    await db.query(`CREATE TABLE IF NOT EXISTS walk_in_capacity_dates (
        visit_date DATE PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await db.query(`CREATE TABLE IF NOT EXISTS walk_in_sales (
        id INT PRIMARY KEY AUTO_INCREMENT,
        sale_number VARCHAR(32) NOT NULL,
        receipt_number VARCHAR(32) NOT NULL,
        staff_id INT NOT NULL,
        idempotency_key VARCHAR(100) NOT NULL,
        request_hash CHAR(64) NOT NULL,
        source VARCHAR(20) NOT NULL DEFAULT 'walk_in',
        visitor_name VARCHAR(100) DEFAULT NULL,
        visitor_phone VARCHAR(20) DEFAULT NULL,
        visit_date DATE NOT NULL,
        currency CHAR(3) NOT NULL DEFAULT 'PHP',
        subtotal_cents BIGINT UNSIGNED NOT NULL,
        discount_cents BIGINT UNSIGNED NOT NULL,
        total_cents BIGINT UNSIGNED NOT NULL,
        receipt_snapshot JSON NOT NULL,
        status ENUM('completed', 'voided') NOT NULL DEFAULT 'completed',
        void_reason VARCHAR(500) DEFAULT NULL,
        voided_by INT DEFAULT NULL,
        voided_at TIMESTAMP NULL DEFAULT NULL,
        checked_in_by INT DEFAULT NULL,
        checked_in_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_walk_in_sale_number (sale_number),
        UNIQUE KEY uk_walk_in_receipt_number (receipt_number),
        UNIQUE KEY uk_walk_in_idempotency (staff_id, idempotency_key),
        INDEX idx_walk_in_visit_status (visit_date, status),
        CONSTRAINT fk_walk_in_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_walk_in_voided_by FOREIGN KEY (voided_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_walk_in_checked_in_by FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await db.query(`CREATE TABLE IF NOT EXISTS walk_in_sale_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        sale_id INT NOT NULL,
        category_code VARCHAR(32) NOT NULL,
        category_label VARCHAR(80) NOT NULL,
        quantity INT UNSIGNED NOT NULL,
        unit_price_cents BIGINT UNSIGNED NOT NULL,
        discount_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
        line_total_cents BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_walk_in_items_sale (sale_id),
        CONSTRAINT fk_walk_in_items_sale FOREIGN KEY (sale_id) REFERENCES walk_in_sales(id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await db.query(`CREATE TABLE IF NOT EXISTS walk_in_payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        sale_id INT NOT NULL,
        method VARCHAR(30) NOT NULL,
        status ENUM('paid', 'pending', 'voided', 'refunded', 'failed') NOT NULL,
        amount_due_cents BIGINT UNSIGNED NOT NULL,
        amount_received_cents BIGINT UNSIGNED DEFAULT NULL,
        change_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
        provider_reference VARCHAR(100) DEFAULT NULL,
        paid_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_walk_in_payment_sale (sale_id),
        CONSTRAINT fk_walk_in_payment_sale FOREIGN KEY (sale_id) REFERENCES walk_in_sales(id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    const upgrades = [
        'ALTER TABLE walk_in_sales ADD COLUMN checked_in_by INT DEFAULT NULL AFTER voided_at',
        'ALTER TABLE walk_in_sales ADD COLUMN checked_in_at TIMESTAMP NULL DEFAULT NULL AFTER checked_in_by',
        'ALTER TABLE walk_in_sales ADD CONSTRAINT fk_walk_in_checked_in_by FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE'
    ];
    for (const statement of upgrades) {
        try {
            await db.query(statement);
        } catch (error) {
            if (!/duplicate column|duplicate foreign key constraint name/i.test(error.message)) throw error;
        }
    }
};

module.exports = ensureWalkInSchema;
