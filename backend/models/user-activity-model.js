const db = require('../config/database');

class UserActivity {
    /**
     * Log a user activity
     */
    static async logActivity(activityData) {
        const {
            userId,
            actionType,
            actionDescription,
            entityType,
            entityId,
            sourceKey,
            ipAddress,
            userAgent
        } = activityData;

        const uniqueSourceActions = new Set([
            'register', 'ticket_reservation', 'event_reservation',
            'message_sent', 'post_create', 'comment_create'
        ]);
        const resolvedSourceKey = sourceKey || (
            uniqueSourceActions.has(actionType) && entityType && entityId
                ? `${actionType}:${entityType}:${entityId}`
                : null
        );

        try {
            const [result] = await db.query(
                `INSERT INTO user_activity_logs
                 (user_id, action_type, action_description, entity_type, entity_id, source_key,
                  actor_name, actor_email, ip_address, user_agent)
                 SELECT u.id, ?, ?, ?, ?, ?, CONCAT(u.first_name, ' ', u.last_name), u.email, ?, ?
                 FROM users u WHERE u.id = ?`,
                [actionType, actionDescription, entityType, entityId, resolvedSourceKey, ipAddress, userAgent, userId]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error logging user activity:', error);
            return null;
        }
    }

    /**
     * Get user activity logs with filters
     */
    static async getRecentActivities(options = {}) {
        const { limit = 50, userId = null, actionType = null, startDate = null, endDate = null, offset = 0 } = options;

        let query = `SELECT
            ual.id,
            ual.user_id,
            ual.action_type,
            ual.action_description,
            ual.entity_type,
            ual.entity_id,
            ual.ip_address,
            ual.created_at,
            u.first_name,
            u.last_name,
            u.email
         FROM user_activity_logs ual
         JOIN users u ON ual.user_id = u.id
         WHERE 1=1`;

        const params = [];

        if (userId) {
            query += ` AND ual.user_id = ?`;
            params.push(userId);
        }
        if (actionType) {
            query += ` AND ual.action_type = ?`;
            params.push(actionType);
        }
        if (startDate) {
            query += ` AND ual.created_at >= ?`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND ual.created_at <= ?`;
            params.push(endDate);
        }

        // Get total count
        const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
        const [countResult] = await db.query(countQuery, params);

        query += ` ORDER BY ual.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await db.query(query, params);

        return { logs: rows, total: countResult[0]?.total || 0 };
    }
}

module.exports = UserActivity;
