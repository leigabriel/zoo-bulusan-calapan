-- =====================================================
-- Google OAuth Migration Script
-- Description: Adds Google authentication fields to users table
-- Run this migration to enable Google Sign-In
-- =====================================================

USE bulusanzoocalapan;

-- Add Google OAuth fields to users table
ALTER TABLE users
    ADD COLUMN google_id VARCHAR(255) DEFAULT NULL AFTER email_verified,
    ADD COLUMN auth_provider ENUM('local', 'google') DEFAULT 'local' AFTER google_id,
    ADD UNIQUE KEY uk_users_google_id (google_id),
    ADD INDEX idx_users_auth_provider (auth_provider);

-- Allow password to be NULL for Google-only accounts
ALTER TABLE users
    MODIFY COLUMN password VARCHAR(255) DEFAULT NULL;

-- Update existing users to have 'local' auth provider
UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL;
