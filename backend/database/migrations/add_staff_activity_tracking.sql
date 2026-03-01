-- =====================================================
-- Staff Activity Tracking Migration
-- Adds tables for tracking staff login/logout, actions, sessions
-- =====================================================

-- Staff Activity Logs Table
-- Tracks individual staff actions for monitoring
CREATE TABLE IF NOT EXISTS staff_activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT NOT NULL,
    action_type ENUM('login', 'logout', 'message_reply', 'reservation_update', 'ticket_update', 'animal_update', 'plant_update', 'event_update', 'user_update', 'other') NOT NULL,
    action_description TEXT DEFAULT NULL,
    entity_type VARCHAR(50) DEFAULT NULL,
    entity_id INT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_staff_activity_staff_id (staff_id),
    INDEX idx_staff_activity_action_type (action_type),
    INDEX idx_staff_activity_created_at (created_at),
    
    CONSTRAINT fk_staff_activity_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff Sessions Table
-- Tracks active sessions for real-time monitoring
CREATE TABLE IF NOT EXISTS staff_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    device_info VARCHAR(255) DEFAULT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_at TIMESTAMP NULL DEFAULT NULL,
    
    INDEX idx_staff_sessions_staff_id (staff_id),
    INDEX idx_staff_sessions_is_active (is_active),
    INDEX idx_staff_sessions_last_activity (last_activity),
    
    CONSTRAINT fk_staff_sessions_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add last_login tracking to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45) DEFAULT NULL;
