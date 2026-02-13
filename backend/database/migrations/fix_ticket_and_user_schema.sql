-- =====================================================
-- Migration: Fix Ticket and User Schema
-- Description: Add missing columns and fix ENUM values
-- Created: February 2026
-- =====================================================

-- 1. Fix payment_status ENUM to include 'free' and 'not paid'
ALTER TABLE tickets 
MODIFY COLUMN payment_status ENUM('pending', 'paid', 'refunded', 'free', 'not_paid') DEFAULT 'pending';

-- 2. Add resident_id_image column for Bulusan resident verification
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS resident_id_image VARCHAR(500) DEFAULT NULL AFTER notes;

-- 3. Add verification_status column for resident ID verification
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER resident_id_image;

-- 4. Add is_archived column for ticket archive feature
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE AFTER verification_status;

-- 5. Add suspension/ban fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE AFTER is_active;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS suspension_reason TEXT DEFAULT NULL AFTER is_suspended;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP NULL DEFAULT NULL AFTER suspension_reason;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS suspended_by INT DEFAULT NULL AFTER suspended_at;

-- 6. Create user_appeals table for appeal messages
CREATE TABLE IF NOT EXISTS user_appeals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    appeal_message TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_response TEXT DEFAULT NULL,
    reviewed_by INT DEFAULT NULL,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    INDEX idx_user_appeals_user_id (user_id),
    INDEX idx_user_appeals_status (status),
    CONSTRAINT fk_user_appeals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_appeals_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for archived tickets
CREATE INDEX IF NOT EXISTS idx_tickets_is_archived ON tickets(is_archived);
CREATE INDEX IF NOT EXISTS idx_users_is_suspended ON users(is_suspended);
