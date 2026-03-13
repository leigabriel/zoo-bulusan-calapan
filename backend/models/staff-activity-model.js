const db = require('../config/database');

class StaffActivity {
    /**
     * Log a staff activity
     */
    static async logActivity(activityData) {
        const { 
            staffId, 
            actionType, 
            actionDescription, 
            entityType, 
            entityId, 
            ipAddress, 
            userAgent 
        } = activityData;

        try {
            const [result] = await db.query(
                `INSERT INTO staff_activity_logs 
                 (staff_id, action_type, action_description, entity_type, entity_id, ip_address, user_agent)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [staffId, actionType, actionDescription, entityType, entityId, ipAddress, userAgent]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error logging staff activity:', error);
            return null;
        }
    }

    /**
     * Create or update a staff session
     */
    static async createSession(sessionData) {
        const { staffId, sessionToken, ipAddress, userAgent, deviceInfo } = sessionData;

        try {
            // First, mark any existing active sessions as inactive
            await db.query(
                `UPDATE staff_sessions SET is_active = FALSE, logout_at = NOW() 
                 WHERE staff_id = ? AND is_active = TRUE`,
                [staffId]
            );

            // Create new session
            const [result] = await db.query(
                `INSERT INTO staff_sessions 
                 (staff_id, session_token, ip_address, user_agent, device_info)
                 VALUES (?, ?, ?, ?, ?)`,
                [staffId, sessionToken, ipAddress, userAgent, deviceInfo]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating staff session:', error);
            return null;
        }
    }

    /**
     * Update session last activity
     */
    static async updateSessionActivity(staffId) {
        try {
            await db.query(
                `UPDATE staff_sessions SET last_activity = NOW() 
                 WHERE staff_id = ? AND is_active = TRUE`,
                [staffId]
            );
            return true;
        } catch (error) {
            console.error('Error updating session activity:', error);
            return false;
        }
    }

    /**
     * End a staff session (logout)
     */
    static async endSession(staffId, sessionToken = null) {
        try {
            let query = `UPDATE staff_sessions SET is_active = FALSE, logout_at = NOW() 
                         WHERE staff_id = ? AND is_active = TRUE`;
            const params = [staffId];

            if (sessionToken) {
                query += ` AND session_token = ?`;
                params.push(sessionToken);
            }

            await db.query(query, params);
            return true;
        } catch (error) {
            console.error('Error ending staff session:', error);
            return false;
        }
    }

    /**
     * Get all active staff sessions with user details
     */
    static async getActiveSessions() {
        const [rows] = await db.query(
            `SELECT 
                ss.id,
                ss.staff_id,
                ss.is_active,
                ss.ip_address,
                ss.device_info,
                ss.last_activity,
                ss.login_at,
                u.first_name,
                u.last_name,
                u.email,
                u.role,
                u.profile_image,
                TIMESTAMPDIFF(MINUTE, ss.last_activity, NOW()) as inactive_minutes
             FROM staff_sessions ss
             JOIN users u ON ss.staff_id = u.id
             WHERE ss.is_active = TRUE AND u.role IN ('staff', 'admin')
             ORDER BY ss.last_activity DESC`
        );
        return rows;
    }

    /**
     * Get recent staff activities with filters
     */
    static async getRecentActivities(options = {}) {
        const { limit = 50, staffId = null, actionType = null, startDate = null, endDate = null } = options;

        let query = `SELECT 
            sal.id,
            sal.staff_id,
            sal.action_type,
            sal.action_description,
            sal.entity_type,
            sal.entity_id,
            sal.ip_address,
            sal.created_at,
            u.first_name,
            u.last_name,
            u.email,
            u.role,
            u.profile_image
         FROM staff_activity_logs sal
         JOIN users u ON sal.staff_id = u.id
         WHERE 1=1`;
        
        const params = [];

        if (staffId) {
            query += ` AND sal.staff_id = ?`;
            params.push(staffId);
        }

        if (actionType) {
            query += ` AND sal.action_type = ?`;
            params.push(actionType);
        }

        if (startDate) {
            query += ` AND sal.created_at >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND sal.created_at <= ?`;
            params.push(endDate);
        }

        query += ` ORDER BY sal.created_at DESC LIMIT ?`;
        params.push(limit);

        const [rows] = await db.query(query, params);
        return rows;
    }

    /**
     * Get staff activity summary (counts by action type)
     */
    static async getActivitySummaryByType(staffId = null, days = 7) {
        let query = `SELECT 
            action_type,
            COUNT(*) as count
         FROM staff_activity_logs
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`;
        
        const params = [days];

        if (staffId) {
            query += ` AND staff_id = ?`;
            params.push(staffId);
        }

        query += ` GROUP BY action_type`;

        const [rows] = await db.query(query, params);
        return rows;
    }

    /**
     * Get staff activity summary with today's actions, week actions, and last activity
     */
    static async getActivitySummary(staffId) {
        try {
            // Get today's action count
            const [todayResult] = await db.query(
                `SELECT COUNT(*) as count FROM staff_activity_logs 
                 WHERE staff_id = ? AND DATE(created_at) = CURDATE()`,
                [staffId]
            );

            // Get this week's action count
            const [weekResult] = await db.query(
                `SELECT COUNT(*) as count FROM staff_activity_logs 
                 WHERE staff_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
                [staffId]
            );

            // Get last activity description
            const [lastActivityResult] = await db.query(
                `SELECT action_description, created_at FROM staff_activity_logs 
                 WHERE staff_id = ? ORDER BY created_at DESC LIMIT 1`,
                [staffId]
            );

            return {
                todayActions: todayResult[0]?.count || 0,
                weekActions: weekResult[0]?.count || 0,
                lastAction: lastActivityResult[0]?.action_description || null
            };
        } catch (error) {
            console.error('Error getting activity summary:', error);
            return {
                todayActions: 0,
                weekActions: 0,
                lastAction: null
            };
        }
    }

    /**
     * Get staff member statistics
     */
    static async getStaffStats() {
        const [rows] = await db.query(
            `SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.role,
                u.profile_image,
                u.last_login_at,
                u.created_at,
                (SELECT COUNT(*) FROM staff_activity_logs WHERE staff_id = u.id) as total_actions,
                (SELECT COUNT(*) FROM staff_activity_logs WHERE staff_id = u.id AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as actions_this_week,
                (SELECT COUNT(*) FROM staff_activity_logs WHERE staff_id = u.id AND action_type = 'message_reply') as messages_replied,
                (SELECT COUNT(*) FROM staff_activity_logs WHERE staff_id = u.id AND action_type = 'reservation_update') as reservations_handled,
                (SELECT is_active FROM staff_sessions WHERE staff_id = u.id ORDER BY last_activity DESC LIMIT 1) as is_online
             FROM users u
             WHERE u.role IN ('staff', 'admin')
             ORDER BY u.created_at DESC`
        );
        return rows;
    }

    /**
     * Get activity timeline for a specific staff member
     */
    static async getStaffTimeline(staffId, limit = 20) {
        const [rows] = await db.query(
            `SELECT 
                id,
                action_type,
                action_description,
                entity_type,
                entity_id,
                created_at
             FROM staff_activity_logs
             WHERE staff_id = ?
             ORDER BY created_at DESC
             LIMIT ?`,
            [staffId, limit]
        );
        return rows;
    }

    /**
     * Get daily activity counts for charts
     */
    static async getDailyActivityCounts(days = 7) {
        const [rows] = await db.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as count,
                COUNT(DISTINCT staff_id) as active_staff
             FROM staff_activity_logs
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [days]
        );
        return rows;
    }

    /**
     * Update user's last login
     */
    static async updateLastLogin(userId, ipAddress) {
        try {
            await db.query(
                `UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?`,
                [ipAddress, userId]
            );
            return true;
        } catch (error) {
            console.error('Error updating last login:', error);
            return false;
        }
    }
}

module.exports = StaffActivity;