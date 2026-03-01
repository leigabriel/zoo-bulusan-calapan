-- Migration: Add user_collections table for AI Scanner collection feature
-- This stores animals that users have scanned and added to their personal collection

CREATE TABLE IF NOT EXISTS user_collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    animal_name VARCHAR(255) NOT NULL,
    confidence DECIMAL(5,2) DEFAULT 0.00,
    captured_image TEXT,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_animal (user_id, animal_name),
    INDEX idx_user_id (user_id),
    INDEX idx_animal_name (animal_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add description field for additional animal info
ALTER TABLE user_collections ADD COLUMN description TEXT AFTER animal_name;

-- Add category field
ALTER TABLE user_collections ADD COLUMN category VARCHAR(100) AFTER description;
