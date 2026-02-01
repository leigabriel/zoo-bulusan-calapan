-- =====================================================
-- Insert Admin and Staff Accounts
-- Created: February 2026
-- Description: Predefined admin and staff accounts with
--              bcrypt hashed passwords for immediate login
-- =====================================================

-- Note: Passwords are hashed using bcrypt (salt rounds: 10)
-- Admin credentials: admin / admin123
-- Staff credentials: staff / staff123

USE bulusanzoocalapan;

-- Insert admin account (admin / admin123)
INSERT INTO users (
    first_name,
    last_name,
    username,
    email,
    phone_number,
    gender,
    birthday,
    password,
    role,
    profile_image,
    is_active,
    email_verified
) VALUES (
    'System',
    'Administrator',
    'admin',
    'admin@bulusanzoo.com',
    NULL,
    'prefer_not_to_say',
    NULL,
    '$2a$10$NI7Pmj0ikfcWMcYin6s1bu7Ks6R0i1PBoZXtYPCulg4dcgShjAIjG',
    'admin',
    NULL,
    TRUE,
    TRUE
) ON DUPLICATE KEY UPDATE password = VALUES(password);

-- Insert staff account (staff / staff123)
INSERT INTO users (
    first_name,
    last_name,
    username,
    email,
    phone_number,
    gender,
    birthday,
    password,
    role,
    profile_image,
    is_active,
    email_verified
) VALUES (
    'Zoo',
    'Staff',
    'staff',
    'staff@bulusanzoo.com',
    NULL,
    'prefer_not_to_say',
    NULL,
    '$2a$10$NI7Pmj0ikfcWMcYin6s1burrUsZsV./KuMbhblkYuvrG7LQ2KT8d6',
    'staff',
    NULL,
    TRUE,
    TRUE
) ON DUPLICATE KEY UPDATE password = VALUES(password);

-- Verify inserted accounts
SELECT id, username, email, role, is_active, email_verified, created_at 
FROM users 
WHERE username IN ('admin', 'staff');
