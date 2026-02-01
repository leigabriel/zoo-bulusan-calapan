-- Zoo Bulusan Database Schema
-- Created: November 2025
-- Description: Complete database setup for Zoo Bulusan Wildlife & Nature Park

-- Create database
CREATE DATABASE IF NOT EXISTS zoo_bulusan;
USE zoo_bulusan;

-- Users table with extended fields
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say') DEFAULT 'prefer_not_to_say',
    birthday DATE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'vet', 'user') DEFAULT 'user',
    profile_image VARCHAR(255) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Animals table
DROP TABLE IF EXISTS animals;
CREATE TABLE animals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(100) NOT NULL,
    category ENUM('mammals', 'birds', 'reptiles', 'amphibians', 'fish', 'invertebrates') NOT NULL,
    description TEXT,
    habitat VARCHAR(255),
    diet VARCHAR(255),
    conservation_status ENUM('least_concern', 'near_threatened', 'vulnerable', 'endangered', 'critically_endangered') DEFAULT 'least_concern',
    age INT,
    weight DECIMAL(10, 2),
    image_url VARCHAR(255),
    zone VARCHAR(100),
    status ENUM('healthy', 'sick', 'treatment', 'quarantine') DEFAULT 'healthy',
    arrival_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Events table
DROP TABLE IF EXISTS events;
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    image_url VARCHAR(255),
    capacity INT DEFAULT 100,
    registered_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tickets table
DROP TABLE IF EXISTS tickets;
CREATE TABLE tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    user_id INT,
    visitor_email VARCHAR(100) NOT NULL,
    visit_date DATE NOT NULL,
    ticket_type ENUM('adult', 'child', 'resident', 'senior', 'student') NOT NULL,
    quantity INT DEFAULT 1,
    price_per_ticket DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'used', 'cancelled', 'expired') DEFAULT 'pending',
    payment_method ENUM('cash', 'gcash', 'card', 'online') DEFAULT 'cash',
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    qr_code VARCHAR(255),
    checked_in_at TIMESTAMP NULL,
    checked_in_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Ticket companions (for group bookings)
DROP TABLE IF EXISTS ticket_companions;
CREATE TABLE ticket_companions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    ticket_type ENUM('adult', 'child', 'resident', 'senior', 'student') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- AI Predictions table (for animal classifier)
DROP TABLE IF EXISTS predictions;
CREATE TABLE predictions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    animal_name VARCHAR(100) NOT NULL,
    confidence DECIMAL(5, 2) NOT NULL,
    image_filename VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Chat messages for AI assistant
DROP TABLE IF EXISTS chat_messages;
CREATE TABLE chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    session_id VARCHAR(100) NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Feedback/Reviews table
DROP TABLE IF EXISTS feedback;
CREATE TABLE feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    visitor_name VARCHAR(100),
    email VARCHAR(100),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    visit_date DATE,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Zoo zones/areas
DROP TABLE IF EXISTS zones;
CREATE TABLE zones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    map_coordinates JSON,
    color VARCHAR(7) DEFAULT '#2D5A27',
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Account
-- username: lei
-- password: lei2025

-- User Account
-- username: vinafernandez
-- password: vina2025

-- Staff Account
-- username: sofia
-- password: