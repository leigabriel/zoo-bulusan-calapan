-- ============================================================
-- Bulusan Zoo Calapan - full schema (no data)
-- Target: MySQL 8.x / phpMyAdmin
-- Derived from: bulusanzoocalapandatabaseversion4.sql
-- Keys, AUTO_INCREMENT and foreign keys are defined inline.
-- ============================================================

CREATE DATABASE IF NOT EXISTS `bulusanzoocalapandatabaseversion4`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bulusanzoocalapandatabaseversion4`;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- users (referenced by most tables, created first)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `gender` enum('male','female','other','prefer_not_to_say') DEFAULT 'prefer_not_to_say',
  `birthday` date DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('admin','staff','user') DEFAULT 'user',
  `profile_image` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `email_verified` tinyint(1) DEFAULT '0',
  `email_verification_token` varchar(255) DEFAULT NULL,
  `email_verification_token_expiry` datetime DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_token_expiry` datetime DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `auth_provider` enum('local','google') DEFAULT 'local',
  `is_suspended` tinyint(1) DEFAULT '0',
  `suspension_reason` text,
  `suspended_at` timestamp NULL DEFAULT NULL,
  `suspended_by` int DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `notification_settings` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `google_onboarding_complete` tinyint(1) DEFAULT '0',
  `is_welcome_sent` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`),
  UNIQUE KEY `uk_users_email` (`email`),
  UNIQUE KEY `uk_users_google_id` (`google_id`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_is_active` (`is_active`),
  KEY `idx_users_auth_provider` (`auth_provider`),
  KEY `idx_users_is_suspended` (`is_suspended`),
  KEY `idx_users_email_verification_token` (`email_verification_token`),
  KEY `idx_users_is_deleted` (`is_deleted`),
  KEY `fk_users_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_users_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- admin_master_keys
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_master_keys` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `key_hash` varchar(255) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_id` (`admin_id`),
  CONSTRAINT `fk_admin_master_key_user` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- ai_assist_sessions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_assist_sessions` (
  `id` varchar(64) NOT NULL,
  `user_id` int NOT NULL,
  `role` varchar(20) NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT 'New chat',
  `messages` json NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ai_assist_owner` (`user_id`,`role`,`updated_at`),
  CONSTRAINT `fk_ai_assist_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- animals
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `animals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `species` varchar(100) NOT NULL,
  `category` enum('mammals','birds','reptiles','amphibians','fish','invertebrates') DEFAULT 'mammals',
  `description` text,
  `habitat` varchar(255) DEFAULT NULL,
  `diet` varchar(255) DEFAULT NULL,
  `animal_information` text,
  `conservation_status` enum('least_concern','near_threatened','vulnerable','endangered','critically_endangered') DEFAULT 'least_concern',
  `age` int DEFAULT NULL,
  `weight` decimal(10,2) DEFAULT NULL,
  `lifespan` varchar(100) DEFAULT NULL,
  `length` decimal(10,2) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `status` enum('healthy','sick','treatment','quarantine','critical') DEFAULT 'healthy',
  `arrival_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `origin_region` varchar(100) DEFAULT NULL,
  `origin_location` varchar(255) DEFAULT NULL,
  `origin_latitude` decimal(9,6) DEFAULT NULL,
  `origin_longitude` decimal(9,6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_animals_species` (`species`),
  KEY `idx_animals_category` (`category`),
  KEY `idx_animals_status` (`status`),
  KEY `idx_animals_is_deleted` (`is_deleted`),
  KEY `fk_animals_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_animals_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- plants
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `plants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `scientific_name` varchar(150) DEFAULT NULL,
  `category` enum('trees','shrubs','flowers','ferns','grasses','aquatic','succulents','vines','herbs','palms') DEFAULT 'trees',
  `description` text,
  `habitat` varchar(255) DEFAULT NULL,
  `origin` varchar(255) DEFAULT NULL,
  `care_level` enum('easy','moderate','difficult') DEFAULT 'moderate',
  `sunlight_requirement` enum('full_sun','partial_shade','full_shade') DEFAULT 'partial_shade',
  `water_requirement` enum('low','moderate','high') DEFAULT 'moderate',
  `height` varchar(100) DEFAULT NULL,
  `bloom_season` varchar(100) DEFAULT NULL,
  `is_endangered` tinyint(1) DEFAULT '0',
  `image_url` varchar(255) DEFAULT NULL,
  `status` enum('healthy','growing','dormant','sick','treatment') DEFAULT 'healthy',
  `location` varchar(255) DEFAULT NULL,
  `arrival_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_plants_name` (`name`),
  KEY `idx_plants_category` (`category`),
  KEY `idx_plants_status` (`status`),
  KEY `idx_plants_is_deleted` (`is_deleted`),
  KEY `fk_plants_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_plants_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- community_posts and related
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `community_posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `content` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `image_public_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','declined') DEFAULT 'pending',
  `moderation_note` varchar(255) DEFAULT NULL,
  `moderated_by` int DEFAULT NULL,
  `moderated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_community_posts_user` (`user_id`),
  KEY `idx_community_posts_status` (`status`),
  KEY `idx_community_posts_created_at` (`created_at`),
  KEY `fk_community_posts_moderated_by` (`moderated_by`),
  CONSTRAINT `fk_community_posts_moderated_by` FOREIGN KEY (`moderated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_community_posts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `community_post_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `image_public_id` varchar(255) DEFAULT NULL,
  `position` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_community_post_images_post` (`post_id`,`position`),
  CONSTRAINT `fk_community_post_images_post` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `community_post_likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_community_post_likes` (`post_id`,`user_id`),
  KEY `idx_community_post_likes_post` (`post_id`),
  KEY `idx_community_post_likes_user` (`user_id`),
  CONSTRAINT `fk_community_post_likes_post` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_community_post_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `community_post_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `reason` varchar(64) NOT NULL,
  `reason_detail` varchar(500) DEFAULT NULL,
  `status` enum('pending','reviewed','dismissed') DEFAULT 'pending',
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_community_post_reports` (`post_id`,`user_id`),
  KEY `idx_community_post_reports_post` (`post_id`),
  KEY `idx_community_post_reports_status` (`status`),
  KEY `fk_community_post_reports_user` (`user_id`),
  KEY `fk_community_post_reports_reviewed_by` (`reviewed_by`),
  CONSTRAINT `fk_community_post_reports_post` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_community_post_reports_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_community_post_reports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `community_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `parent_comment_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  `comment_text` text NOT NULL,
  `is_reported` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_community_comments_post` (`post_id`),
  KEY `idx_community_comments_parent` (`parent_comment_id`),
  KEY `idx_community_comments_user` (`user_id`),
  KEY `idx_community_comments_created_at` (`created_at`),
  CONSTRAINT `fk_community_comments_parent` FOREIGN KEY (`parent_comment_id`) REFERENCES `community_comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_community_comments_post` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_community_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `community_comment_hearts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `comment_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_community_comment_hearts` (`comment_id`,`user_id`),
  KEY `idx_community_hearts_comment` (`comment_id`),
  KEY `idx_community_hearts_user` (`user_id`),
  CONSTRAINT `fk_community_hearts_comment` FOREIGN KEY (`comment_id`) REFERENCES `community_comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_community_hearts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `community_comment_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `comment_id` int NOT NULL,
  `user_id` int NOT NULL,
  `reason` varchar(255) NOT NULL,
  `status` enum('pending','reviewed','dismissed') DEFAULT 'pending',
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_community_comment_reports` (`comment_id`,`user_id`),
  KEY `idx_community_reports_comment` (`comment_id`),
  KEY `idx_community_reports_status` (`status`),
  KEY `fk_community_reports_user` (`user_id`),
  KEY `fk_community_reports_reviewed_by` (`reviewed_by`),
  CONSTRAINT `fk_community_reports_comment` FOREIGN KEY (`comment_id`) REFERENCES `community_comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_community_reports_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_community_reports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- conversations / messages (live chat)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `recipient_type` enum('staff','admin') NOT NULL,
  `staff_recipient_id` int DEFAULT NULL,
  `recipient_scope_id` int NOT NULL,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_chat_conversation_recipient` (`user_id`,`recipient_type`,`recipient_scope_id`),
  KEY `idx_chat_conversations_staff` (`staff_recipient_id`,`last_message_at`),
  KEY `idx_chat_conversations_admin` (`recipient_type`,`last_message_at`),
  CONSTRAINT `fk_chat_conversations_staff` FOREIGN KEY (`staff_recipient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_conversations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `sender_role` enum('user','staff','admin') NOT NULL,
  `content` varchar(4000) NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_conversation` (`conversation_id`,`created_at`,`id`),
  KEY `idx_chat_messages_unread` (`conversation_id`,`is_read`,`sender_id`),
  KEY `fk_chat_messages_sender` (`sender_id`),
  CONSTRAINT `fk_chat_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- events / event_reservations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `event_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `capacity` int DEFAULT '100',
  `registered_count` int DEFAULT '0',
  `status` enum('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
  `color` varchar(20) DEFAULT '#22c55e',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_events_event_date` (`event_date`),
  KEY `idx_events_status` (`status`),
  KEY `idx_events_is_active` (`is_active`),
  KEY `fk_events_created_by` (`created_by`),
  KEY `idx_events_is_deleted` (`is_deleted`),
  KEY `fk_events_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_events_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_events_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event_reservations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reservation_reference` varchar(20) NOT NULL,
  `user_id` int DEFAULT NULL,
  `event_id` int DEFAULT NULL,
  `venue_event_name` varchar(200) DEFAULT NULL,
  `venue_event_date` date DEFAULT NULL,
  `venue_event_time` varchar(50) DEFAULT NULL,
  `venue_event_end_time` varchar(50) DEFAULT NULL,
  `venue_event_description` text,
  `participant_name` varchar(100) NOT NULL,
  `participant_email` varchar(100) NOT NULL,
  `participant_phone` varchar(20) DEFAULT NULL,
  `number_of_participants` int DEFAULT '1',
  `participant_details` text,
  `payment_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_method` varchar(30) DEFAULT NULL,
  `payment_status` enum('unpaid','pending','paid','failed','expired','refunded') NOT NULL DEFAULT 'unpaid',
  `paymongo_checkout_session_id` varchar(100) DEFAULT NULL,
  `paymongo_payment_id` varchar(100) DEFAULT NULL,
  `payment_paid_at` timestamp NULL DEFAULT NULL,
  `refund_status` enum('requested','approved','rejected') DEFAULT NULL,
  `refund_requested_at` timestamp NULL DEFAULT NULL,
  `status` enum('pending','confirmed','completed','cancelled','no_show') DEFAULT 'pending',
  `notes` text,
  `is_archived` tinyint(1) DEFAULT '0',
  `qr_data` text,
  `checked_in_at` timestamp NULL DEFAULT NULL,
  `checked_in_by` int DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `confirmed_by` int DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancelled_reason` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_event_reservations_reference` (`reservation_reference`),
  KEY `idx_event_reservations_user_id` (`user_id`),
  KEY `idx_event_reservations_event_id` (`event_id`),
  KEY `idx_event_reservations_status` (`status`),
  KEY `idx_event_reservations_payment_status` (`payment_status`),
  KEY `idx_event_reservations_checkout` (`paymongo_checkout_session_id`),
  KEY `idx_event_reservations_created_at` (`created_at`),
  KEY `idx_event_reservations_is_archived` (`is_archived`),
  KEY `fk_event_reservations_confirmed_by` (`confirmed_by`),
  KEY `fk_event_reservations_checked_in_by` (`checked_in_by`),
  KEY `idx_event_reservations_is_deleted` (`is_deleted`),
  KEY `fk_event_reservations_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_event_reservations_checked_in_by` FOREIGN KEY (`checked_in_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_event_reservations_confirmed_by` FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_event_reservations_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_event_reservations_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_event_reservations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- notifications
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(32) NOT NULL DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT '0',
  `link` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_id` (`user_id`),
  KEY `idx_notifications_is_read` (`is_read`),
  KEY `idx_notifications_type` (`type`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- paymongo_webhook_events
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `paymongo_webhook_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` varchar(150) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_paymongo_webhook_event` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- predictions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `predictions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `animal_name` varchar(100) NOT NULL,
  `confidence` decimal(5,2) NOT NULL,
  `image_filename` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_predictions_user_id` (`user_id`),
  KEY `idx_predictions_animal_name` (`animal_name`),
  CONSTRAINT `fk_predictions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- site_visits
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `site_visits` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `visitor_key_hash` char(64) NOT NULL,
  `visit_date` date NOT NULL,
  `path` varchar(255) NOT NULL DEFAULT '/',
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_site_visits_visitor_date` (`visitor_key_hash`,`visit_date`),
  KEY `idx_site_visits_date` (`visit_date`),
  KEY `idx_site_visits_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- staff_activity_logs / staff_sessions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff_activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int DEFAULT NULL,
  `action_type` varchar(64) NOT NULL,
  `action_description` text,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `actor_name` varchar(201) DEFAULT NULL,
  `actor_email` varchar(255) DEFAULT NULL,
  `actor_role` varchar(20) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_staff_activity_staff_id` (`staff_id`),
  KEY `idx_staff_activity_action_type` (`action_type`),
  KEY `idx_staff_activity_created_at` (`created_at`),
  CONSTRAINT `fk_staff_activity_staff` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `staff_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `device_info` varchar(255) DEFAULT NULL,
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `login_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `logout_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_staff_sessions_staff_id` (`staff_id`),
  KEY `idx_staff_sessions_is_active` (`is_active`),
  KEY `idx_staff_sessions_last_activity` (`last_activity`),
  CONSTRAINT `fk_staff_sessions_staff` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- tickets / ticket_reservations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_reference` varchar(20) NOT NULL,
  `user_id` int DEFAULT NULL,
  `visitor_email` varchar(100) DEFAULT NULL,
  `visitor_name` varchar(100) DEFAULT NULL,
  `visitor_phone` varchar(20) DEFAULT NULL,
  `visit_date` date NOT NULL,
  `visit_time` enum('morning','afternoon','full_day') DEFAULT 'full_day',
  `ticket_type` enum('senior','adult','child','student','resident') NOT NULL,
  `quantity` int DEFAULT '1',
  `price_per_ticket` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `promo_code` varchar(50) DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('pending','confirmed','used','cancelled','expired') DEFAULT 'pending',
  `payment_method` enum('cash','gcash','card','online') DEFAULT 'cash',
  `payment_status` enum('pending','paid','refunded','free','not_paid') DEFAULT 'pending',
  `qr_code` varchar(255) DEFAULT NULL,
  `resident_id_image` text,
  `verification_status` enum('pending','approved','rejected') DEFAULT NULL,
  `is_archived` tinyint(1) DEFAULT '0',
  `checked_in_at` timestamp NULL DEFAULT NULL,
  `checked_in_by` int DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tickets_booking_reference` (`booking_reference`),
  KEY `idx_tickets_user_id` (`user_id`),
  KEY `idx_tickets_visit_date` (`visit_date`),
  KEY `idx_tickets_status` (`status`),
  KEY `idx_tickets_payment_status` (`payment_status`),
  KEY `idx_tickets_is_archived` (`is_archived`),
  KEY `idx_tickets_created_at` (`created_at`),
  KEY `idx_tickets_ticket_type` (`ticket_type`),
  KEY `idx_tickets_verification_status` (`verification_status`),
  KEY `fk_tickets_checked_in_by` (`checked_in_by`),
  CONSTRAINT `fk_tickets_checked_in_by` FOREIGN KEY (`checked_in_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_tickets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ticket_reservations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reservation_reference` varchar(20) NOT NULL,
  `user_id` int DEFAULT NULL,
  `visitor_name` varchar(100) NOT NULL,
  `visitor_email` varchar(100) NOT NULL,
  `visitor_phone` varchar(20) DEFAULT NULL,
  `reservation_date` date NOT NULL,
  `reservation_time` varchar(20) DEFAULT NULL,
  `adult_quantity` int DEFAULT '0',
  `child_quantity` int DEFAULT '0',
  `bulusan_resident_quantity` int DEFAULT '0',
  `total_visitors` int DEFAULT '0',
  `resident_id_image` text,
  `verification_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `status` enum('pending','confirmed','completed','cancelled','no_show') DEFAULT 'pending',
  `notes` text,
  `is_archived` tinyint(1) DEFAULT '0',
  `qr_data` text,
  `checked_in_at` timestamp NULL DEFAULT NULL,
  `checked_in_by` int DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `confirmed_by` int DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancelled_reason` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ticket_reservations_reference` (`reservation_reference`),
  KEY `idx_ticket_reservations_user_id` (`user_id`),
  KEY `idx_ticket_reservations_date` (`reservation_date`),
  KEY `idx_ticket_reservations_time` (`reservation_time`),
  KEY `idx_ticket_reservations_status` (`status`),
  KEY `idx_ticket_reservations_created_at` (`created_at`),
  KEY `idx_ticket_reservations_is_archived` (`is_archived`),
  KEY `fk_ticket_reservations_confirmed_by` (`confirmed_by`),
  KEY `fk_ticket_reservations_checked_in_by` (`checked_in_by`),
  KEY `idx_ticket_reservations_is_deleted` (`is_deleted`),
  KEY `fk_ticket_reservations_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_ticket_reservations_checked_in_by` FOREIGN KEY (`checked_in_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_reservations_confirmed_by` FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_reservations_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_reservations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- user_activity_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action_type` varchar(64) NOT NULL,
  `action_description` text,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `source_key` varchar(150) DEFAULT NULL,
  `actor_name` varchar(201) DEFAULT NULL,
  `actor_email` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_activity_source` (`source_key`),
  KEY `idx_user_activity_user_id` (`user_id`),
  KEY `idx_user_activity_action_type` (`action_type`),
  KEY `idx_user_activity_created_at` (`created_at`),
  CONSTRAINT `fk_user_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- user_appeals
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_appeals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `appeal_message` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `admin_response` text,
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_appeals_user_id` (`user_id`),
  KEY `idx_appeals_status` (`status`),
  KEY `fk_appeals_reviewed_by` (`reviewed_by`),
  CONSTRAINT `fk_appeals_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_appeals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- user_collections
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_collections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `animal_name` varchar(255) NOT NULL,
  `description` text,
  `category` varchar(100) DEFAULT NULL,
  `confidence` decimal(5,2) DEFAULT '0.00',
  `captured_image` text,
  `scanned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_animal` (`user_id`,`animal_name`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_animal_name` (`animal_name`),
  CONSTRAINT `fk_user_collections_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- user_messages
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int NOT NULL,
  `sender_type` enum('user','admin','staff') DEFAULT 'user',
  `recipient_type` enum('admin','staff','all') DEFAULT 'admin',
  `subject` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `message_type` enum('general','appeal','inquiry','feedback') DEFAULT 'general',
  `is_read` tinyint(1) DEFAULT '0',
  `case_status` enum('open','closed') NOT NULL DEFAULT 'open',
  `admin_response` text,
  `user_response` text,
  `user_responded_at` timestamp NULL DEFAULT NULL,
  `responded_by` int DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_sender_id` (`sender_id`),
  KEY `idx_messages_recipient_type` (`recipient_type`),
  KEY `idx_messages_message_type` (`message_type`),
  KEY `idx_messages_is_read` (`is_read`),
  KEY `idx_messages_created_at` (`created_at`),
  KEY `fk_messages_responded_by` (`responded_by`),
  CONSTRAINT `fk_messages_responded_by` FOREIGN KEY (`responded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- walk-in sales (POS)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `walk_in_capacity_dates` (
  `visit_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`visit_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `walk_in_sales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_number` varchar(32) NOT NULL,
  `receipt_number` varchar(32) NOT NULL,
  `staff_id` int NOT NULL,
  `idempotency_key` varchar(100) NOT NULL,
  `request_hash` char(64) NOT NULL,
  `source` varchar(20) NOT NULL DEFAULT 'walk_in',
  `visitor_name` varchar(100) DEFAULT NULL,
  `visitor_phone` varchar(20) DEFAULT NULL,
  `visit_date` date NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'PHP',
  `subtotal_cents` bigint UNSIGNED NOT NULL,
  `discount_cents` bigint UNSIGNED NOT NULL,
  `total_cents` bigint UNSIGNED NOT NULL,
  `receipt_snapshot` json NOT NULL,
  `status` enum('completed','voided') NOT NULL DEFAULT 'completed',
  `void_reason` varchar(500) DEFAULT NULL,
  `voided_by` int DEFAULT NULL,
  `voided_at` timestamp NULL DEFAULT NULL,
  `checked_in_by` int DEFAULT NULL,
  `checked_in_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_walk_in_sale_number` (`sale_number`),
  UNIQUE KEY `uk_walk_in_receipt_number` (`receipt_number`),
  UNIQUE KEY `uk_walk_in_idempotency` (`staff_id`,`idempotency_key`),
  KEY `idx_walk_in_visit_status` (`visit_date`,`status`),
  KEY `fk_walk_in_voided_by` (`voided_by`),
  KEY `fk_walk_in_checked_in_by` (`checked_in_by`),
  KEY `idx_walk_in_sales_is_deleted` (`is_deleted`),
  KEY `fk_walk_in_sales_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_walk_in_checked_in_by` FOREIGN KEY (`checked_in_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_walk_in_sales_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_walk_in_staff` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_walk_in_voided_by` FOREIGN KEY (`voided_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `walk_in_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `method` varchar(30) NOT NULL,
  `status` enum('paid','pending','voided','refunded','failed') NOT NULL,
  `amount_due_cents` bigint UNSIGNED NOT NULL,
  `amount_received_cents` bigint UNSIGNED DEFAULT NULL,
  `change_cents` bigint UNSIGNED NOT NULL DEFAULT '0',
  `provider_reference` varchar(100) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_walk_in_payment_sale` (`sale_id`),
  CONSTRAINT `fk_walk_in_payment_sale` FOREIGN KEY (`sale_id`) REFERENCES `walk_in_sales` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `walk_in_sale_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `category_code` varchar(32) NOT NULL,
  `category_label` varchar(80) NOT NULL,
  `quantity` int UNSIGNED NOT NULL,
  `unit_price_cents` bigint UNSIGNED NOT NULL,
  `discount_cents` bigint UNSIGNED NOT NULL DEFAULT '0',
  `line_total_cents` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_walk_in_items_sale` (`sale_id`),
  CONSTRAINT `fk_walk_in_items_sale` FOREIGN KEY (`sale_id`) REFERENCES `walk_in_sales` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- default inserts
INSERT INTO users (first_name, last_name, username, email, password, role, is_active, email_verified) VALUES
('System', 'Administrator', 'admin', 'admin@bulusanzoo.com', '$2a$10$NI7Pmj0ikfcWMcYin6s1bu7Ks6R0i1PBoZXtYPCulg4dcgShjAIjG', 'admin', TRUE, TRUE),
('Zoo', 'Staff', 'staff', 'staff@bulusanzoo.com', '$2a$10$NI7Pmj0ikfcWMcYin6s1burrUsZsV./KuMbhblkYuvrG7LQ2KT8d6', 'staff', TRUE, TRUE),
('Regular', 'User', 'user', 'user@bulusanzoo.com', '$2a$10$dQKVLZ1QKtx3GKS2iwNyc.TgIHnS2ECerSBQF1rB6FrjplBFjxLg.', 'user', TRUE, TRUE);