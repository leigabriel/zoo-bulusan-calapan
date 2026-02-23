USE bulusanzoocalapandatabase;

ALTER TABLE animals
ADD COLUMN IF NOT EXISTS lifespan VARCHAR(100) DEFAULT NULL AFTER weight,
ADD COLUMN IF NOT EXISTS length DECIMAL(10, 2) DEFAULT NULL AFTER lifespan,
ADD COLUMN IF NOT EXISTS animal_information TEXT DEFAULT NULL AFTER diet;

CREATE TABLE IF NOT EXISTS plants (
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

CREATE TABLE IF NOT EXISTS ticket_reservations (
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

CREATE TABLE IF NOT EXISTS event_reservations (
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
