const db = require('../config/database');

const ensureSiteVisitSchema = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS site_visits (
            id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
            visitor_key_hash CHAR(64) NOT NULL,
            visit_date DATE NOT NULL,
            path VARCHAR(255) NOT NULL DEFAULT '/',
            user_id INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_site_visits_visitor_date (visitor_key_hash, visit_date),
            INDEX idx_site_visits_date (visit_date),
            INDEX idx_site_visits_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
};

module.exports = ensureSiteVisitSchema;