-- =====================================================
-- Zoo Bulusan Database Schema
-- Created: December 2025
-- Description: Complete database setup for Zoo Bulusan 
--              Wildlife & Nature Park Management System
-- =====================================================

-- =====================================================
-- DATABASE CREATION
-- =====================================================
CREATE DATABASE IF NOT EXISTS bulusanzoocalapan
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE bulusanzoocalapan;

-- =====================================================
-- TABLE: users
-- Description: Stores all user accounts including 
--              visitors, staff, veterinarians, and admins
-- =====================================================
DROP TABLE IF EXISTS ticket_companions;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS predictions;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS animals;
DROP TABLE IF EXISTS zones;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) DEFAULT NULL,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say') DEFAULT 'prefer_not_to_say',
    birthday DATE DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'vet', 'user') DEFAULT 'user',
    profile_image VARCHAR(255) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE KEY uk_users_username (username),
    UNIQUE KEY uk_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_is_active (is_active),
    INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: zones
-- Description: Zoo areas/sections for organizing 
--              animal exhibits and navigation
-- =====================================================
CREATE TABLE zones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    map_coordinates JSON DEFAULT NULL,
    color VARCHAR(7) DEFAULT '#2D5A27',
    icon VARCHAR(50) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE KEY uk_zones_name (name),
    INDEX idx_zones_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: animals
-- Description: Animal records with health status,
--              species info, and exhibit location
-- =====================================================
CREATE TABLE animals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(100) NOT NULL,
    category ENUM('mammals', 'birds', 'reptiles', 'amphibians', 'fish', 'invertebrates') NOT NULL,
    description TEXT DEFAULT NULL,
    habitat VARCHAR(255) DEFAULT NULL,
    diet VARCHAR(255) DEFAULT NULL,
    conservation_status ENUM('least_concern', 'near_threatened', 'vulnerable', 'endangered', 'critically_endangered') DEFAULT 'least_concern',
    age INT DEFAULT NULL,
    weight DECIMAL(10, 2) DEFAULT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    zone VARCHAR(100) DEFAULT NULL,
    zone_id INT DEFAULT NULL,
    status ENUM('healthy', 'sick', 'treatment', 'quarantine', 'critical') DEFAULT 'healthy',
    arrival_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    INDEX idx_animals_species (species),
    INDEX idx_animals_category (category),
    INDEX idx_animals_status (status),
    INDEX idx_animals_zone_id (zone_id),
    INDEX idx_animals_conservation_status (conservation_status),
    CONSTRAINT fk_animals_zone FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: events
-- Description: Zoo events, shows, feeding schedules,
--              and special activities
-- =====================================================
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    event_date DATE NOT NULL,
    start_time TIME DEFAULT NULL,
    end_time TIME DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    capacity INT DEFAULT 100,
    registered_count INT DEFAULT 0,
    status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    INDEX idx_events_event_date (event_date),
    INDEX idx_events_status (status),
    INDEX idx_events_is_active (is_active),
    INDEX idx_events_created_by (created_by),
    CONSTRAINT fk_events_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: tickets
-- Description: Ticket bookings with pricing, 
--              validation status, and payment info
-- =====================================================
CREATE TABLE tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_reference VARCHAR(20) NOT NULL,
    user_id INT DEFAULT NULL,
    visitor_email VARCHAR(100) DEFAULT NULL,
    visitor_name VARCHAR(100) DEFAULT NULL,
    visitor_phone VARCHAR(20) DEFAULT NULL,
    visit_date DATE NOT NULL,
    visit_time ENUM('morning', 'afternoon', 'full_day') DEFAULT 'full_day',
    ticket_type ENUM('adult', 'child', 'resident', 'senior', 'student') NOT NULL,
    quantity INT DEFAULT 1,
    price_per_ticket DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    promo_code VARCHAR(50) DEFAULT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('pending', 'confirmed', 'used', 'cancelled', 'expired') DEFAULT 'pending',
    payment_method ENUM('cash', 'gcash', 'card', 'online') DEFAULT 'cash',
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    qr_code VARCHAR(255) DEFAULT NULL,
    checked_in_at TIMESTAMP NULL DEFAULT NULL,
    checked_in_by INT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE KEY uk_tickets_booking_reference (booking_reference),
    INDEX idx_tickets_user_id (user_id),
    INDEX idx_tickets_visit_date (visit_date),
    INDEX idx_tickets_status (status),
    INDEX idx_tickets_payment_status (payment_status),
    INDEX idx_tickets_created_at (created_at),
    CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_tickets_checked_in_by FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: ticket_companions
-- Description: Group booking companion details
--              linked to main ticket
-- =====================================================
CREATE TABLE ticket_companions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    ticket_type ENUM('adult', 'child', 'resident', 'senior', 'student') NOT NULL,
    age INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    INDEX idx_ticket_companions_ticket_id (ticket_id),
    CONSTRAINT fk_ticket_companions_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: predictions
-- Description: AI animal classifier prediction logs
--              for analytics and tracking
-- =====================================================
CREATE TABLE predictions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    animal_name VARCHAR(100) NOT NULL,
    confidence DECIMAL(5, 2) NOT NULL,
    image_filename VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    INDEX idx_predictions_user_id (user_id),
    INDEX idx_predictions_animal_name (animal_name),
    INDEX idx_predictions_created_at (created_at),
    CONSTRAINT fk_predictions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: chat_messages
-- Description: AI assistant conversation history
--              for context and analytics
-- =====================================================
CREATE TABLE chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    session_id VARCHAR(100) NOT NULL,
    role ENUM('user', 'assistant', 'system') NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    INDEX idx_chat_messages_user_id (user_id),
    INDEX idx_chat_messages_session_id (session_id),
    INDEX idx_chat_messages_created_at (created_at),
    CONSTRAINT fk_chat_messages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: feedback
-- Description: Visitor reviews and ratings
--              for quality improvement
-- =====================================================
CREATE TABLE feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    visitor_name VARCHAR(100) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    rating INT NOT NULL,
    comment TEXT DEFAULT NULL,
    visit_date DATE DEFAULT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    INDEX idx_feedback_user_id (user_id),
    INDEX idx_feedback_rating (rating),
    INDEX idx_feedback_is_approved (is_approved),
    INDEX idx_feedback_created_at (created_at),
    CONSTRAINT chk_feedback_rating CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: promo_codes
-- Description: Discount promo codes for ticket bookings
-- =====================================================
CREATE TABLE promo_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase DECIMAL(10, 2) DEFAULT 0.00,
    max_uses INT DEFAULT NULL,
    used_count INT DEFAULT 0,
    valid_from DATE DEFAULT NULL,
    valid_until DATE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE KEY uk_promo_codes_code (code),
    INDEX idx_promo_codes_is_active (is_active),
    INDEX idx_promo_codes_valid_until (valid_until),
    CONSTRAINT fk_promo_codes_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: animal_dex_collection
-- Description: User's collected/scanned animals
--              for gamification feature
-- =====================================================
CREATE TABLE animal_dex_collection (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    animal_id INT DEFAULT NULL,
    animal_name VARCHAR(100) NOT NULL,
    scanned_count INT DEFAULT 1,
    first_scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE KEY uk_animal_dex_user_animal (user_id, animal_name),
    INDEX idx_animal_dex_user_id (user_id),
    INDEX idx_animal_dex_animal_id (animal_id),
    CONSTRAINT fk_animal_dex_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_animal_dex_animal FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: user_settings
-- Description: User preferences and settings
-- =====================================================
CREATE TABLE user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE KEY uk_user_settings_user_key (user_id, setting_key),
    INDEX idx_user_settings_user_id (user_id),
    CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: activity_logs
-- Description: System activity and audit logs
-- =====================================================
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) DEFAULT NULL,
    entity_id INT DEFAULT NULL,
    details JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    INDEX idx_activity_logs_user_id (user_id),
    INDEX idx_activity_logs_action (action),
    INDEX idx_activity_logs_entity (entity_type, entity_id),
    INDEX idx_activity_logs_created_at (created_at),
    CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: notifications
-- Description: User notifications for events,
--              tickets, and system messages
-- =====================================================
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error', 'event', 'ticket', 'system') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_is_read (is_read),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_created_at (created_at),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- END OF SCHEMA
-- =====================================================

-- To execute this script:
-- mysql -u root -p < zoo_bulusan_schema.sql
-- 
-- Or in MySQL client:
-- source /path/to/zoo_bulusan_schema.sql
