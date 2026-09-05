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
             role, profile_image, password, auth_provider, google_id, is_active, is_suspended, 
             suspension_reason, suspended_at, email_verified, notification_settings, created_at, updated_at
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
             role, profile_image, is_active, is_suspended, suspension_reason, suspended_at, created_at 
             FROM users WHERE (is_deleted IS NULL OR is_deleted = FALSE) ORDER BY created_at DESC`
        );
        return rows;
    }

    static async getByRole(role) {
        const [rows] = await db.query(
            `SELECT id, first_name, last_name, username, email, phone_number, role, is_active, created_at 
             FROM users WHERE role = ? AND (is_deleted IS NULL OR is_deleted = FALSE) ORDER BY created_at DESC`,
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
        const [rows] = await db.query('SELECT COUNT(*) as total FROM users WHERE (is_deleted IS NULL OR is_deleted = FALSE)');
        return rows[0].total;
    }

    static async countByRole(role) {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM users WHERE role = ? AND (is_deleted IS NULL OR is_deleted = FALSE)', [role]);
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
            `UPDATE users SET email_verified = TRUE, 
             email_verification_token = NULL, 
             email_verification_token_expiry = NULL, 
             updated_at = NOW() WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    static async setVerificationToken(id, token, expiresAt) {
        const [result] = await db.query(
            `UPDATE users SET email_verification_token = ?, 
             email_verification_token_expiry = ?, 
             updated_at = NOW() WHERE id = ?`,
            [token, expiresAt, id]
        );
        return result.affectedRows > 0;
    }

    static async findByVerificationToken(token) {
        const [rows] = await db.query(
            `SELECT id, email, first_name, email_verified, 
             email_verification_token_expiry FROM users 
             WHERE email_verification_token = ?`,
            [token]
        );
        return rows[0];
    }

    static async clearVerificationToken(id) {
        const [result] = await db.query(
            `UPDATE users SET email_verification_token = NULL, 
             email_verification_token_expiry = NULL, 
             updated_at = NOW() WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    static async setPasswordResetToken(id, token, expiresAt) {
        const [result] = await db.query(
            `UPDATE users SET password_reset_token = ?, password_reset_token_expiry = ?, updated_at = NOW()
             WHERE id = ?`,
            [token, expiresAt, id]
        );
        return result.affectedRows > 0;
    }

    static async findByPasswordResetToken(token) {
        const [rows] = await db.query(
            `SELECT id, password_reset_token_expiry FROM users
             WHERE password_reset_token = ?`,
            [token]
        );
        return rows[0];
    }

    static async updatePasswordWithResetToken(token, hashedPassword) {
        const [result] = await db.query(
            `UPDATE users SET password = ?, password_reset_token = NULL,
             password_reset_token_expiry = NULL, auth_provider = 'local', updated_at = NOW()
             WHERE password_reset_token = ? AND password_reset_token_expiry > NOW()`,
            [hashedPassword, token]
        );
        return result.affectedRows > 0;
    }

    static async deleteAccountData(id) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Remove rows whose foreign keys preserve historical records with SET NULL.
            const statements = [
                'DELETE FROM community_comment_reports WHERE user_id = ?',
                'DELETE FROM community_comment_hearts WHERE user_id = ?',
                'DELETE FROM community_post_likes WHERE user_id = ?',
                'DELETE FROM community_comments WHERE user_id = ?',
                'DELETE FROM community_posts WHERE user_id = ?',
                'DELETE FROM user_collections WHERE user_id = ?',
                'DELETE FROM predictions WHERE user_id = ?',
                'DELETE FROM ticket_reservations WHERE user_id = ?',
                'DELETE FROM event_reservations WHERE user_id = ?',
                'DELETE FROM tickets WHERE user_id = ?',
                'DELETE FROM user_messages WHERE sender_id = ?',
                'DELETE FROM user_appeals WHERE user_id = ?',
                'DELETE FROM notifications WHERE user_id = ?',
                'DELETE FROM ai_assist_sessions WHERE user_id = ?',
                'DELETE FROM users WHERE id = ?'
            ];

            for (const statement of statements) {
                await connection.query(statement, [id]);
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Trash methods
    static async softDelete(id, deletedBy) {
        const [result] = await db.query(
            'UPDATE users SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = ?, updated_at = NOW() WHERE id = ?',
            [deletedBy, id]
        );
        return result.affectedRows > 0;
    }

    static async softDeleteMultiple(ids, deletedBy) {
        if (!ids || ids.length === 0) return false;
        const [result] = await db.query(
            'UPDATE users SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = ?, updated_at = NOW() WHERE id IN (?)',
            [deletedBy, ids]
        );
        return result.affectedRows > 0;
    }

    static async restore(id) {
        const [result] = await db.query(
            'UPDATE users SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL, updated_at = NOW() WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async restoreMultiple(ids) {
        if (!ids || ids.length === 0) return false;
        const [result] = await db.query(
            'UPDATE users SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL, updated_at = NOW() WHERE id IN (?)',
            [ids]
        );
        return result.affectedRows > 0;
    }

    static async getDeleted() {
        const [rows] = await db.query(
            `SELECT u.id, u.first_name, u.last_name, u.username, u.email, u.role, u.profile_image,
                    u.is_suspended, u.created_at, u.deleted_at, u.deleted_by,
                    CONCAT(d.first_name, ' ', d.last_name) as deleted_by_name
             FROM users u
             LEFT JOIN users d ON u.deleted_by = d.id
             WHERE u.is_deleted = TRUE
             ORDER BY u.deleted_at DESC`
        );
        return rows;
    }

    static async permanentDelete(id) {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async permanentDeleteMultiple(ids) {
        if (!ids || ids.length === 0) return false;
        const [result] = await db.query('DELETE FROM users WHERE id IN (?)', [ids]);
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
    
    // User Settings
    static async getSettings(userId) {
        const [rows] = await db.query(
            'SELECT notification_settings FROM users WHERE id = ?',
            [userId]
        );
        if (rows[0] && rows[0].notification_settings) {
            return typeof rows[0].notification_settings === 'string' ? JSON.parse(rows[0].notification_settings) : rows[0].notification_settings;
        }
        return null;
    }

    static async updateSettings(userId, settings) {
        const [result] = await db.query(
            'UPDATE users SET notification_settings = ?, updated_at = NOW() WHERE id = ?',
            [JSON.stringify(settings), userId]
        );
        return result.affectedRows > 0;
    }

    // User Activities
    static async getActivities(userId) {
        // Fetch tickets
        const [tickets] = await db.query(
            `SELECT id, 'ticket_reservation' as type, created_at, status, ticket_type as details 
             FROM tickets WHERE user_id = ?`,
            [userId]
        );
        
        // Fetch posts
        const [posts] = await db.query(
            `SELECT id, 'community_post' as type, created_at, status, content as details 
             FROM community_posts WHERE user_id = ?`,
            [userId]
        );
        
        // Fetch comments
        const [comments] = await db.query(
            `SELECT id, 'community_comment' as type, created_at, 'published' as status, comment_text as details 
             FROM community_comments WHERE user_id = ?`,
            [userId]
        );
        
        // Fetch likes
        const [likes] = await db.query(
            `SELECT l.id, 'community_like' as type, l.created_at, 'liked' as status, p.content as details 
             FROM community_post_likes l 
             JOIN community_posts p ON l.post_id = p.id 
             WHERE l.user_id = ?`,
            [userId]
        );

        const activities = [...tickets, ...posts, ...comments, ...likes];
        activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        return activities;
    }
}

module.exports = User;