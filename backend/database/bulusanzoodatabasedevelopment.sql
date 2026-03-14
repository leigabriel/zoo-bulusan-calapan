-- bulusanzoo database schema
CREATE DATABASE IF NOT EXISTS bulusanzoocalapandatabase
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE bulusanzoocalapandatabase;

-- drop existing tables in correct order
DROP TABLE IF EXISTS user_collections;
DROP TABLE IF EXISTS staff_sessions;
DROP TABLE IF EXISTS staff_activity_logs;
DROP TABLE IF EXISTS community_comment_reports;
DROP TABLE IF EXISTS community_post_likes;
DROP TABLE IF EXISTS community_comment_hearts;
DROP TABLE IF EXISTS community_comments;
DROP TABLE IF EXISTS community_posts;
DROP TABLE IF EXISTS user_appeals;
DROP TABLE IF EXISTS user_messages;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS predictions;
DROP TABLE IF EXISTS event_reservations;
DROP TABLE IF EXISTS ticket_reservations;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS plants;
DROP TABLE IF EXISTS animals;
DROP TABLE IF EXISTS users;

-- users
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
    email_verification_token VARCHAR(255) DEFAULT NULL,
    email_verification_token_expiry DATETIME DEFAULT NULL,
    google_id VARCHAR(255) DEFAULT NULL,
    auth_provider ENUM('local', 'google') DEFAULT 'local',
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT DEFAULT NULL,
    suspended_at TIMESTAMP NULL DEFAULT NULL,
    suspended_by INT DEFAULT NULL,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    last_login_ip VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_users_username (username),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_google_id (google_id),
    INDEX idx_users_role (role),
    INDEX idx_users_is_active (is_active),
    INDEX idx_users_auth_provider (auth_provider),
    INDEX idx_users_is_suspended (is_suspended),
    INDEX idx_users_email_verification_token (email_verification_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- community posts
CREATE TABLE community_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    image_public_id VARCHAR(255) DEFAULT NULL,
    status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
    moderation_note VARCHAR(255) DEFAULT NULL,
    moderated_by INT DEFAULT NULL,
    moderated_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_community_posts_user (user_id),
    INDEX idx_community_posts_status (status),
    INDEX idx_community_posts_created_at (created_at),
    CONSTRAINT fk_community_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_community_posts_moderated_by FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- community comments
CREATE TABLE community_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    parent_comment_id INT DEFAULT NULL,
    user_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    is_reported BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_community_comments_post (post_id),
    INDEX idx_community_comments_parent (parent_comment_id),
    INDEX idx_community_comments_user (user_id),
    INDEX idx_community_comments_created_at (created_at),
    CONSTRAINT fk_community_comments_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_community_comments_parent FOREIGN KEY (parent_comment_id) REFERENCES community_comments(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_community_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- community post likes
CREATE TABLE community_post_likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_community_post_likes (post_id, user_id),
    INDEX idx_community_post_likes_post (post_id),
    INDEX idx_community_post_likes_user (user_id),
    CONSTRAINT fk_community_post_likes_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_community_post_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- community comment hearts
CREATE TABLE community_comment_hearts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    comment_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_community_comment_hearts (comment_id, user_id),
    INDEX idx_community_hearts_comment (comment_id),
    INDEX idx_community_hearts_user (user_id),
    CONSTRAINT fk_community_hearts_comment FOREIGN KEY (comment_id) REFERENCES community_comments(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_community_hearts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- community reports
CREATE TABLE community_comment_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    comment_id INT NOT NULL,
    user_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status ENUM('pending', 'reviewed', 'dismissed') DEFAULT 'pending',
    reviewed_by INT DEFAULT NULL,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_community_comment_reports (comment_id, user_id),
    INDEX idx_community_reports_comment (comment_id),
    INDEX idx_community_reports_status (status),
    CONSTRAINT fk_community_reports_comment FOREIGN KEY (comment_id) REFERENCES community_comments(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_community_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_community_reports_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- animals
CREATE TABLE animals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(100) NOT NULL,
    category ENUM('mammals', 'birds', 'reptiles', 'amphibians', 'fish', 'invertebrates') DEFAULT 'mammals',
    description TEXT DEFAULT NULL,
    habitat VARCHAR(255) DEFAULT NULL,
    diet VARCHAR(255) DEFAULT NULL,
    animal_information TEXT DEFAULT NULL,
    conservation_status ENUM('least_concern', 'near_threatened', 'vulnerable', 'endangered', 'critically_endangered') DEFAULT 'least_concern',
    age INT DEFAULT NULL,
    weight DECIMAL(10, 2) DEFAULT NULL,
    lifespan VARCHAR(100) DEFAULT NULL,
    length DECIMAL(10, 2) DEFAULT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    status ENUM('healthy', 'sick', 'treatment', 'quarantine', 'critical') DEFAULT 'healthy',
    arrival_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_animals_species (species),
    INDEX idx_animals_category (category),
    INDEX idx_animals_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- plants
CREATE TABLE plants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    scientific_name VARCHAR(150) DEFAULT NULL,
    category ENUM('trees', 'shrubs', 'flowers', 'ferns', 'grasses', 'aquatic', 'succulents', 'vines', 'herbs', 'palms') DEFAULT 'trees',
    description TEXT DEFAULT NULL,
    habitat VARCHAR(255) DEFAULT NULL,
    origin VARCHAR(255) DEFAULT NULL,
    care_level ENUM('easy', 'moderate', 'difficult') DEFAULT 'moderate',
    sunlight_requirement ENUM('full_sun', 'partial_shade', 'full_shade') DEFAULT 'partial_shade',
    water_requirement ENUM('low', 'moderate', 'high') DEFAULT 'moderate',
    height VARCHAR(100) DEFAULT NULL,
    bloom_season VARCHAR(100) DEFAULT NULL,
    is_endangered BOOLEAN DEFAULT FALSE,
    image_url VARCHAR(255) DEFAULT NULL,
    status ENUM('healthy', 'growing', 'dormant', 'sick', 'treatment') DEFAULT 'healthy',
    location VARCHAR(255) DEFAULT NULL,
    arrival_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_plants_name (name),
    INDEX idx_plants_category (category),
    INDEX idx_plants_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- events
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
    INDEX idx_events_event_date (event_date),
    INDEX idx_events_status (status),
    INDEX idx_events_is_active (is_active),
    CONSTRAINT fk_events_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- tickets
CREATE TABLE tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_reference VARCHAR(20) NOT NULL,
    user_id INT DEFAULT NULL,
    visitor_email VARCHAR(100) DEFAULT NULL,
    visitor_name VARCHAR(100) DEFAULT NULL,
    visitor_phone VARCHAR(20) DEFAULT NULL,
    visit_date DATE NOT NULL,
    visit_time ENUM('morning', 'afternoon', 'full_day') DEFAULT 'full_day',
    ticket_type ENUM('senior', 'adult', 'child', 'student', 'resident') NOT NULL,
    quantity INT DEFAULT 1,
    price_per_ticket DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    promo_code VARCHAR(50) DEFAULT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('pending', 'confirmed', 'used', 'cancelled', 'expired') DEFAULT 'pending',
    payment_method ENUM('cash', 'gcash', 'card', 'online') DEFAULT 'cash',
    payment_status ENUM('pending', 'paid', 'refunded', 'free', 'not_paid') DEFAULT 'pending',
    qr_code VARCHAR(255) DEFAULT NULL,
    resident_id_image TEXT DEFAULT NULL,
    verification_status ENUM('pending', 'approved', 'rejected') DEFAULT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMP NULL DEFAULT NULL,
    checked_in_by INT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tickets_booking_reference (booking_reference),
    INDEX idx_tickets_user_id (user_id),
    INDEX idx_tickets_visit_date (visit_date),
    INDEX idx_tickets_status (status),
    INDEX idx_tickets_payment_status (payment_status),
    INDEX idx_tickets_is_archived (is_archived),
    INDEX idx_tickets_created_at (created_at),
    INDEX idx_tickets_ticket_type (ticket_type),
    INDEX idx_tickets_verification_status (verification_status),
    CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_tickets_checked_in_by FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user messages
CREATE TABLE user_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    sender_type ENUM('user', 'admin', 'staff') DEFAULT 'user',
    recipient_type ENUM('admin', 'staff', 'all') DEFAULT 'admin',
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    message_type ENUM('general', 'appeal', 'inquiry', 'feedback') DEFAULT 'general',
    is_read BOOLEAN DEFAULT FALSE,
    admin_response TEXT DEFAULT NULL,
    responded_by INT DEFAULT NULL,
    responded_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_messages_sender_id (sender_id),
    INDEX idx_messages_recipient_type (recipient_type),
    INDEX idx_messages_message_type (message_type),
    INDEX idx_messages_is_read (is_read),
    INDEX idx_messages_created_at (created_at),
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_messages_responded_by FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user appeals
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
    INDEX idx_appeals_user_id (user_id),
    INDEX idx_appeals_status (status),
    CONSTRAINT fk_appeals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_appeals_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error', 'event', 'ticket', 'system') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_is_read (is_read),
    INDEX idx_notifications_type (type),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- predictions
CREATE TABLE predictions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    animal_name VARCHAR(100) NOT NULL,
    confidence DECIMAL(5, 2) NOT NULL,
    image_filename VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_predictions_user_id (user_id),
    INDEX idx_predictions_animal_name (animal_name),
    CONSTRAINT fk_predictions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ticket reservations
CREATE TABLE ticket_reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reservation_reference VARCHAR(20) NOT NULL,
    user_id INT DEFAULT NULL,
    visitor_name VARCHAR(100) NOT NULL,
    visitor_email VARCHAR(100) NOT NULL,
    visitor_phone VARCHAR(20) DEFAULT NULL,
    reservation_date DATE NOT NULL,
    adult_quantity INT DEFAULT 0,
    child_quantity INT DEFAULT 0,
    bulusan_resident_quantity INT DEFAULT 0,
    total_visitors INT DEFAULT 0,
    resident_id_image TEXT DEFAULT NULL,
    verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
    notes TEXT DEFAULT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP NULL DEFAULT NULL,
    confirmed_by INT DEFAULT NULL,
    cancelled_at TIMESTAMP NULL DEFAULT NULL,
    cancelled_reason TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_ticket_reservations_reference (reservation_reference),
    INDEX idx_ticket_reservations_user_id (user_id),
    INDEX idx_ticket_reservations_date (reservation_date),
    INDEX idx_ticket_reservations_status (status),
    INDEX idx_ticket_reservations_created_at (created_at),
    INDEX idx_ticket_reservations_is_archived (is_archived),
    CONSTRAINT fk_ticket_reservations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ticket_reservations_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- event reservations
CREATE TABLE event_reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reservation_reference VARCHAR(20) NOT NULL,
    user_id INT DEFAULT NULL,
    event_id INT DEFAULT NULL,
    venue_event_name VARCHAR(200) DEFAULT NULL,
    venue_event_date DATE DEFAULT NULL,
    venue_event_time VARCHAR(50) DEFAULT NULL,
    venue_event_description TEXT DEFAULT NULL,
    participant_name VARCHAR(100) NOT NULL,
    participant_email VARCHAR(100) NOT NULL,
    participant_phone VARCHAR(20) DEFAULT NULL,
    number_of_participants INT DEFAULT 1,
    participant_details TEXT DEFAULT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
    notes TEXT DEFAULT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP NULL DEFAULT NULL,
    confirmed_by INT DEFAULT NULL,
    cancelled_at TIMESTAMP NULL DEFAULT NULL,
    cancelled_reason TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_event_reservations_reference (reservation_reference),
    INDEX idx_event_reservations_user_id (user_id),
    INDEX idx_event_reservations_event_id (event_id),
    INDEX idx_event_reservations_status (status),
    INDEX idx_event_reservations_created_at (created_at),
    INDEX idx_event_reservations_is_archived (is_archived),
    CONSTRAINT fk_event_reservations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_event_reservations_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_event_reservations_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- staff activity logs
CREATE TABLE staff_activity_logs (
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

-- staff sessions
CREATE TABLE staff_sessions (
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

-- user collections
CREATE TABLE user_collections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    animal_name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    confidence DECIMAL(5,2) DEFAULT 0.00,
    captured_image TEXT,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_animal (user_id, animal_name),
    INDEX idx_user_id (user_id),
    INDEX idx_animal_name (animal_name),
    CONSTRAINT fk_user_collections_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- default inserts
INSERT INTO users (first_name, last_name, username, email, password, role, is_active, email_verified) VALUES
('System', 'Administrator', 'admin', 'admin@bulusanzoo.com', '$2a$10$NI7Pmj0ikfcWMcYin6s1bu7Ks6R0i1PBoZXtYPCulg4dcgShjAIjG', 'admin', TRUE, TRUE),
('Zoo', 'Staff', 'staff', 'staff@bulusanzoo.com', '$2a$10$NI7Pmj0ikfcWMcYin6s1burrUsZsV./KuMbhblkYuvrG7LQ2KT8d6', 'staff', TRUE, TRUE),
('Regular', 'User', 'user', 'user@bulusanzoo.com', '$2a$10$dQKVLZ1QKtx3GKS2iwNyc.TgIHnS2ECerSBQF1rB6FrjplBFjxLg.', 'user', TRUE, TRUE);