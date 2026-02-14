const db = require('../config/database');

class User {
    static async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findByUsername(username) {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    }

    static async findByEmailOrUsername(identifier) {
        const [rows] = await db.query(
            `SELECT *, is_suspended, suspension_reason, suspended_at FROM users WHERE email = ? OR username = ?`,
            [identifier, identifier]
        );
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.query(
            `SELECT id, first_name, last_name, username, email, phone_number, gender, birthday, 
             role, profile_image, is_active, email_verified, created_at, updated_at 
             FROM users WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    static async create(userData) {
        const {
            firstName, lastName, username, email, phoneNumber,
            gender, birthday, password, role
        } = userData;

        const [result] = await db.query(
            `INSERT INTO users (first_name, last_name, username, email, phone_number, gender, birthday, password, role) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, username, email, phoneNumber || null, gender || 'prefer_not_to_say', birthday || null, password, role || 'user']
        );
        return result.insertId;
    }

    static async getAll() {
        const [rows] = await db.query(
            `SELECT id, first_name, last_name, username, email, phone_number, gender, birthday, 
             role, profile_image, is_active, created_at 
             FROM users ORDER BY created_at DESC`
        );
        return rows;
    }

    static async getByRole(role) {
        const [rows] = await db.query(
            `SELECT id, first_name, last_name, username, email, phone_number, role, is_active, created_at 
             FROM users WHERE role = ? ORDER BY created_at DESC`,
            [role]
        );
        return rows;
    }

    static async update(id, userData) {
        const { firstName, lastName, username, email, phoneNumber, gender, birthday, role } = userData;
        const [result] = await db.query(
            `UPDATE users SET first_name = ?, last_name = ?, username = ?, email = ?, 
             phone_number = ?, gender = ?, birthday = ?, role = ?, updated_at = NOW() WHERE id = ?`,
            [firstName, lastName, username, email, phoneNumber, gender, birthday, role, id]
        );
        return result.affectedRows > 0;
    }

    static async updateProfile(id, profileData) {
        const { firstName, lastName, phoneNumber, gender, birthday, profileImage } = profileData;
        const [result] = await db.query(
            `UPDATE users SET first_name = ?, last_name = ?, phone_number = ?, 
             gender = ?, birthday = ?, profile_image = ?, updated_at = NOW() WHERE id = ?`,
            [firstName, lastName, phoneNumber, gender, birthday, profileImage, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async updatePassword(id, newPassword) {
        const [result] = await db.query(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [newPassword, id]
        );
        return result.affectedRows > 0;
    }

    static async count() {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM users');
        return rows[0].total;
    }

    static async countByRole(role) {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM users WHERE role = ?', [role]);
        return rows[0].total;
    }

    static async setActive(id, isActive) {
        const [result] = await db.query(
            'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
            [isActive, id]
        );
        return result.affectedRows > 0;
    }

    static async verifyEmail(id) {
        const [result] = await db.query(
            'UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // Google OAuth methods
    static async findByGoogleId(googleId) {
        const [rows] = await db.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
        return rows[0];
    }

    static async createGoogleUser(userData) {
        const { firstName, lastName, username, email, googleId, profileImage, role } = userData;

        const [result] = await db.query(
            `INSERT INTO users (first_name, last_name, username, email, google_id, 
             profile_image, role, auth_provider, email_verified, password) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'google', TRUE, NULL)`,
            [firstName, lastName, username, email, googleId, profileImage, role || 'user']
        );
        return result.insertId;
    }

    static async linkGoogleAccount(userId, googleId, profileImage = null) {
        const updateQuery = profileImage
            ? 'UPDATE users SET google_id = ?, profile_image = COALESCE(profile_image, ?), updated_at = NOW() WHERE id = ?'
            : 'UPDATE users SET google_id = ?, updated_at = NOW() WHERE id = ?';

        const params = profileImage ? [googleId, profileImage, userId] : [googleId, userId];
        const [result] = await db.query(updateQuery, params);
        return result.affectedRows > 0;
    }

    static async updateGoogleProfile(userId, profileImage) {
        const [result] = await db.query(
            'UPDATE users SET profile_image = ?, updated_at = NOW() WHERE id = ?',
            [profileImage, userId]
        );
        return result.affectedRows > 0;
    }

    static async unlinkGoogleAccount(userId) {
            // Only allow unlinking if user has a password set (local auth)
        const user = await this.findById(userId);
        if (!user || !user.password) {
            return false; // Cannot unlink if no password exists
        }

        const [result] = await db.query(
            'UPDATE users SET google_id = NULL, auth_provider = "local", updated_at = NOW() WHERE id = ?',
            [userId]
        );
        return result.affectedRows > 0;
    }

    // Suspend/Ban user
    static async suspendUser(userId, suspendedBy, reason) {
        const [result] = await db.query(
            `UPDATE users SET is_suspended = TRUE, suspension_reason = ?, 
             suspended_at = NOW(), suspended_by = ?, is_active = FALSE, updated_at = NOW() 
             WHERE id = ?`,
            [reason, suspendedBy, userId]
        );
        return result.affectedRows > 0;
    }

    // Unsuspend/Unban user
    static async unsuspendUser(userId) {
        const [result] = await db.query(
            `UPDATE users SET is_suspended = FALSE, suspension_reason = NULL, 
             suspended_at = NULL, suspended_by = NULL, is_active = TRUE, updated_at = NOW() 
             WHERE id = ?`,
            [userId]
        );
        return result.affectedRows > 0;
    }

    // Check if user is suspended
    static async isSuspended(userId) {
        const [rows] = await db.query(
            'SELECT is_suspended, suspension_reason, suspended_at FROM users WHERE id = ?',
            [userId]
        );
        if (rows[0] && rows[0].is_suspended) {
            return {
                suspended: true,
                reason: rows[0].suspension_reason,
                suspendedAt: rows[0].suspended_at
            };
        }
        return { suspended: false };
    }

    // Get all suspended users
    static async getSuspendedUsers() {
        const [rows] = await db.query(
            `SELECT id, first_name, last_name, username, email, role, 
             is_suspended, suspension_reason, suspended_at, created_at 
             FROM users WHERE is_suspended = TRUE ORDER BY suspended_at DESC`
        );
        return rows;
    }

    // Create appeal
    static async createAppeal(userId, appealMessage) {
        const [result] = await db.query(
            'INSERT INTO user_appeals (user_id, appeal_message) VALUES (?, ?)',
            [userId, appealMessage]
        );
        return result.insertId;
    }

    // Get user's appeals
    static async getUserAppeals(userId) {
        const [rows] = await db.query(
            `SELECT * FROM user_appeals WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );
        return rows;
    }

    // Get all pending appeals (for admin/staff)
    static async getPendingAppeals() {
        const [rows] = await db.query(
            `SELECT a.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email,
             u.suspension_reason
             FROM user_appeals a
             JOIN users u ON a.user_id = u.id
             WHERE a.status = 'pending'
             ORDER BY a.created_at ASC`
        );
        return rows;
    }

    // Review appeal
    static async reviewAppeal(appealId, reviewedBy, status, adminResponse = null) {
        const [result] = await db.query(
            `UPDATE user_appeals SET status = ?, admin_response = ?, 
             reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW() 
             WHERE id = ?`,
            [status, adminResponse, reviewedBy, appealId]
        );
        return result.affectedRows > 0;
    }

    // Get appeal by ID
    static async getAppealById(appealId) {
        const [rows] = await db.query(
            `SELECT a.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email
             FROM user_appeals a
             JOIN users u ON a.user_id = u.id
             WHERE a.id = ?`,
            [appealId]
        );
        return rows[0];
    }
}

module.exports = User;