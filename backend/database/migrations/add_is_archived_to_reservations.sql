-- Migration: Add is_archived column to ticket_reservations and event_reservations tables
-- Run this migration if tables already exist without is_archived column
-- Compatible with MySQL 5.7+

-- For ticket_reservations (check if column exists first in your MySQL client)
-- ALTER TABLE ticket_reservations ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
-- ALTER TABLE ticket_reservations ADD INDEX idx_ticket_reservations_is_archived (is_archived);

-- For event_reservations (check if column exists first in your MySQL client)
-- ALTER TABLE event_reservations ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
-- ALTER TABLE event_reservations ADD INDEX idx_event_reservations_is_archived (is_archived);

-- Safe migration (will not error if column already exists):
SET @dbname = DATABASE();

-- Check and add is_archived to ticket_reservations
SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'ticket_reservations' AND COLUMN_NAME = 'is_archived');
SET @sql = IF(@columnExists = 0, 'ALTER TABLE ticket_reservations ADD COLUMN is_archived BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add is_archived to event_reservations  
SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'event_reservations' AND COLUMN_NAME = 'is_archived');
SET @sql = IF(@columnExists = 0, 'ALTER TABLE event_reservations ADD COLUMN is_archived BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add venue booking fields to event_reservations
SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'event_reservations' AND COLUMN_NAME = 'venue_event_name');
SET @sql = IF(@columnExists = 0, 'ALTER TABLE event_reservations ADD COLUMN venue_event_name VARCHAR(200) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'event_reservations' AND COLUMN_NAME = 'venue_event_date');
SET @sql = IF(@columnExists = 0, 'ALTER TABLE event_reservations ADD COLUMN venue_event_date DATE DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'event_reservations' AND COLUMN_NAME = 'venue_event_time');
SET @sql = IF(@columnExists = 0, 'ALTER TABLE event_reservations ADD COLUMN venue_event_time VARCHAR(50) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'event_reservations' AND COLUMN_NAME = 'venue_event_description');
SET @sql = IF(@columnExists = 0, 'ALTER TABLE event_reservations ADD COLUMN venue_event_description TEXT DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
