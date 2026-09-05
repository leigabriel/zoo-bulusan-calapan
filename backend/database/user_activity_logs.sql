CREATE TABLE IF NOT EXISTS user_activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    action_type VARCHAR(64) NOT NULL,
    action_description TEXT DEFAULT NULL,
    entity_type VARCHAR(50) DEFAULT NULL,
    entity_id INT DEFAULT NULL,
    source_key VARCHAR(150) DEFAULT NULL,
    actor_name VARCHAR(201) DEFAULT NULL,
    actor_email VARCHAR(255) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_activity_user_id (user_id),
    INDEX idx_user_activity_action_type (action_type),
    INDEX idx_user_activity_created_at (created_at),
    UNIQUE KEY uk_user_activity_source (source_key),
    CONSTRAINT fk_user_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
