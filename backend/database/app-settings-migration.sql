-- Admin-managed settings (ticket payments, event payments, reservation access).
-- Run once on an existing database; the server also creates this table at boot
-- through database/ensure-app-settings-schema.js, so applying it manually is only
-- needed for deployments that do not run the startup initialisers.

CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(64) PRIMARY KEY,
    setting_value JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
