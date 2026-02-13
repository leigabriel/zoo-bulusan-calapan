-- Migration: Add resident_id_image column to tickets table
-- This column stores the path to the uploaded ID image for Bulusan resident ticket verification

ALTER TABLE tickets ADD COLUMN resident_id_image VARCHAR(500) NULL AFTER notes;
ALTER TABLE tickets ADD COLUMN verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER resident_id_image;
ALTER TABLE tickets ADD COLUMN verified_by INT NULL AFTER verification_status;
ALTER TABLE tickets ADD COLUMN verified_at DATETIME NULL AFTER verified_by;

-- Add index for faster filtering by verification status
CREATE INDEX idx_tickets_verification_status ON tickets(verification_status);
