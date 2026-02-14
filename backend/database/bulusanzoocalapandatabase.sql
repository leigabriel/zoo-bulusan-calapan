-- =====================================================
-- Bulusan Zoo Calapan Database Schema
-- Version: 1.0.0
-- Description: Clean database schema with only required 
--              tables and columns for the application
-- Roles: admin, staff, user (3 roles only)
-- =====================================================

CREATE DATABASE IF NOT EXISTS bulusanzoocalapandatabase
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE bulusanzoocalapandatabase;

-- Drop existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS user_appeals;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS predictions;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS animals;
DROP TABLE IF EXISTS users;

-- =====================================================
-- USERS TABLE
-- Stores all user accounts: admin, staff, and regular users
-- =====================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) DEFAULT NULL,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say') DEFAULT 'prefer_not_to_say',
    birthday DATE DEFAULT NULL,
    password VARCHAR(255) DEFAULT NULL,
    role ENUM('admin', 'staff', 'user') DEFAULT 'user',
    profile_image VARCHAR(255) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    
    -- Google OAuth fields
    google_id VARCHAR(255) DEFAULT NULL,
    auth_provider ENUM('local', 'google') DEFAULT 'local',
    
    -- Suspension/Ban fields
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT DEFAULT NULL,
    suspended_at TIMESTAMP NULL DEFAULT NULL,
    suspended_by INT DEFAULT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Unique constraints
    UNIQUE KEY uk_users_username (username),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_google_id (google_id),
    
    -- Indexes for performance
    INDEX idx_users_role (role),
    INDEX idx_users_is_active (is_active),
    INDEX idx_users_auth_provider (auth_provider),
    INDEX idx_users_is_suspended (is_suspended)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ANIMALS TABLE
-- Stores zoo animal information
-- =====================================================
CREATE TABLE animals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(100) NOT NULL,
    category ENUM('mammals', 'birds', 'reptiles', 'amphibians', 'fish', 'invertebrates') DEFAULT 'mammals',
    description TEXT DEFAULT NULL,
    habitat VARCHAR(255) DEFAULT NULL,
    diet VARCHAR(255) DEFAULT NULL,
    conservation_status ENUM('least_concern', 'near_threatened', 'vulnerable', 'endangered', 'critically_endangered') DEFAULT 'least_concern',
    age INT DEFAULT NULL,
    weight DECIMAL(10, 2) DEFAULT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    status ENUM('healthy', 'sick', 'treatment', 'quarantine', 'critical') DEFAULT 'healthy',
    arrival_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_animals_species (species),
    INDEX idx_animals_category (category),
    INDEX idx_animals_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- EVENTS TABLE
-- Stores zoo events and activities
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
    color VARCHAR(20) DEFAULT '#22c55e',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_events_event_date (event_date),
    INDEX idx_events_status (status),
    INDEX idx_events_is_active (is_active),
    
    -- Foreign keys
    CONSTRAINT fk_events_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TICKETS TABLE
-- Stores ticket purchases and reservations
-- Ticket types: senior, adult, child, student, resident (Bulusan)
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
    
    -- Ticket type: 5 types supported
    ticket_type ENUM('senior', 'adult', 'child', 'student', 'resident') NOT NULL,
    quantity INT DEFAULT 1,
    price_per_ticket DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    promo_code VARCHAR(50) DEFAULT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Status fields
    status ENUM('pending', 'confirmed', 'used', 'cancelled', 'expired') DEFAULT 'pending',
    payment_method ENUM('cash', 'gcash', 'card', 'online') DEFAULT 'cash',
    payment_status ENUM('pending', 'paid', 'refunded', 'free', 'not_paid') DEFAULT 'pending',
    
    -- QR code and verification
    qr_code VARCHAR(255) DEFAULT NULL,
    resident_id_image TEXT DEFAULT NULL,
    verification_status ENUM('pending', 'approved', 'rejected') DEFAULT NULL,
    
    -- Archive feature
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- Check-in tracking
    checked_in_at TIMESTAMP NULL DEFAULT NULL,
    checked_in_by INT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Unique constraints
    UNIQUE KEY uk_tickets_booking_reference (booking_reference),
    
    -- Indexes
    INDEX idx_tickets_user_id (user_id),
    INDEX idx_tickets_visit_date (visit_date),
    INDEX idx_tickets_status (status),
    INDEX idx_tickets_payment_status (payment_status),
    INDEX idx_tickets_is_archived (is_archived),
    INDEX idx_tickets_created_at (created_at),
    INDEX idx_tickets_ticket_type (ticket_type),
    INDEX idx_tickets_verification_status (verification_status),
    
    -- Foreign keys
    CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_tickets_checked_in_by FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USER APPEALS TABLE
-- Stores suspension appeal messages from users
-- =====================================================
CREATE TABLE user_appeals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    appeal_message TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_response TEXT DEFAULT NULL,
    reviewed_by INT DEFAULT NULL,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_appeals_user_id (user_id),
    INDEX idx_appeals_status (status),
    
    -- Foreign keys
    CONSTRAINT fk_appeals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_appeals_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- NOTIFICATIONS TABLE
-- Stores user notifications
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
    
    -- Indexes
    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_is_read (is_read),
    INDEX idx_notifications_type (type),
    
    -- Foreign keys
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PREDICTIONS TABLE
-- Stores AI animal recognition predictions
-- =====================================================
CREATE TABLE predictions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    animal_name VARCHAR(100) NOT NULL,
    confidence DECIMAL(5, 2) NOT NULL,
    image_filename VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_predictions_user_id (user_id),
    INDEX idx_predictions_animal_name (animal_name),
    
    -- Foreign keys
    CONSTRAINT fk_predictions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DEFAULT DATA INSERTS
-- =====================================================

-- Insert default admin, staff, and user accounts
-- Default passwords: admin123, staff123, user123 (bcrypt hashed)
INSERT INTO users (first_name, last_name, username, email, password, role, is_active, email_verified) VALUES
('System', 'Administrator', 'admin', 'admin@bulusanzoo.com', '$2a$10$NI7Pmj0ikfcWMcYin6s1bu7Ks6R0i1PBoZXtYPCulg4dcgShjAIjG', 'admin', TRUE, TRUE),
('Zoo', 'Staff', 'staff', 'staff@bulusanzoo.com', '$2a$10$NI7Pmj0ikfcWMcYin6s1burrUsZsV./KuMbhblkYuvrG7LQ2KT8d6', 'staff', TRUE, TRUE),
('Regular', 'User', 'user', 'user@bulusanzoo.com', '$2a$10$dQKVLZ1QKtx3GKS2iwNyc.TgIHnS2ECerSBQF1rB6FrjplBFjxLg.', 'user', TRUE, TRUE);

-- =====================================================
-- TICKET PRICING REFERENCE (for application use)
-- =====================================================
-- senior:   ₱30 (Ages 60+)
-- adult:    ₱40 (Ages 18-59)
-- child:    ₱20 (Ages 4-17)
-- student:  ₱25 (With valid student ID)
-- resident: ₱0  (Bulusan residents with valid ID - FREE)
-- =====================================================
