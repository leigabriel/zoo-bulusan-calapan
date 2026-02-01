-- =====================================================
-- Migration: Add color column to events table
-- Created: December 2025
-- Description: Adds color field for calendar event display
-- =====================================================

-- Add color column to events table
ALTER TABLE events 
ADD COLUMN color VARCHAR(20) DEFAULT '#22c55e' AFTER status;

-- Update existing events with default colors based on status
UPDATE events SET color = CASE 
    WHEN status = 'upcoming' THEN '#22c55e'
    WHEN status = 'ongoing' THEN '#3b82f6'
    WHEN status = 'completed' THEN '#6b7280'
    WHEN status = 'cancelled' THEN '#ef4444'
    ELSE '#22c55e'
END;
