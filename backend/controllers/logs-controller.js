const db = require('../config/database');

const MAX_LIMIT = 100;

/**
 * Get staff activity logs with pagination and filters
 */
exports.getStaffLogs = async (req, res) => {
    try {
        const rawLimit = parseInt(req.query.limit, 10) || 50;
        const rawOffset = parseInt(req.query.offset, 10) || 0;
        const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
        const offset = Math.max(rawOffset, 0);
        const { actionType, startDate, endDate, staffId } = req.query;

        let query = `SELECT
            sal.id,
            sal.staff_id,
            sal.action_type,
            sal.action_description,
            sal.entity_type,
            sal.entity_id,
            sal.created_at,
            u.first_name,
            u.last_name,
            u.role
         FROM staff_activity_logs sal
         JOIN users u ON sal.staff_id = u.id
         WHERE 1=1`;

        const params = [];

        if (staffId) {
            query += ` AND sal.staff_id = ?`;
            params.push(parseInt(staffId));
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
            params.push(/^\d{4}-\d{2}-\d{2}$/.test(endDate) ? `${endDate} 23:59:59` : endDate);
        }

        const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
        const [countResult] = await db.query(countQuery, params);

        query += ` ORDER BY sal.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await db.query(query, params);

        res.json({
            success: true,
            logs: rows,
            total: countResult[0]?.total || 0,
            limit,
            offset
        });
    } catch (error) {
        console.error('Error getting staff logs:', error);
        res.status(500).json({ success: false, message: 'Error fetching staff logs' });
    }
};

/**
 * Get user activity logs from user_activity_logs table
 */
exports.getUserLogs = async (req, res) => {
    try {
        const rawLimit = parseInt(req.query.limit, 10) || 50;
        const rawOffset = parseInt(req.query.offset, 10) || 0;
        const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
        const offset = Math.max(rawOffset, 0);
        const { actionType, startDate, endDate, userId } = req.query;

        let query = `SELECT
            ual.id,
            ual.user_id,
            ual.action_type,
            ual.action_description,
            ual.entity_type,
            ual.entity_id,
            ual.created_at,
            COALESCE(u.first_name, ual.actor_name) AS first_name,
            COALESCE(u.last_name, '') AS last_name
         FROM user_activity_logs ual
         LEFT JOIN users u ON ual.user_id = u.id
         WHERE 1=1`;

        const params = [];

        if (userId) {
            query += ` AND ual.user_id = ?`;
            params.push(parseInt(userId));
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
            params.push(/^\d{4}-\d{2}-\d{2}$/.test(endDate) ? `${endDate} 23:59:59` : endDate);
        }

        const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
        const [countResult] = await db.query(countQuery, params);

        query += ` ORDER BY ual.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await db.query(query, params);

        res.json({
            success: true,
            logs: rows,
            total: countResult[0]?.total || 0,
            limit,
            offset
        });
    } catch (error) {
        console.error('Error getting user logs:', error);
        res.status(500).json({ success: false, message: 'Error fetching user logs' });
    }
};

/**
 * Get logs summary counts
 */
exports.getLogsSummary = async (req, res) => {
    try {
        const [staffCount] = await db.query(`SELECT COUNT(*) as count FROM staff_activity_logs`);
        const [userLogCount] = await db.query(`SELECT COUNT(*) as count FROM user_activity_logs`);
        const [userCount] = await db.query(`SELECT COUNT(*) as count FROM users WHERE role = 'user'`);

        // Action type breakdown for staff
        const [staffActions] = await db.query(`
            SELECT action_type, COUNT(*) as count
            FROM staff_activity_logs
            GROUP BY action_type
        `);

        // Action type breakdown for users
        const [userActions] = await db.query(`
            SELECT action_type, COUNT(*) as count
            FROM user_activity_logs
            GROUP BY action_type
        `);

        res.json({
            success: true,
            summary: {
                totalStaffActions: staffCount[0]?.count || 0,
                totalUserActions: userLogCount[0]?.count || 0,
                totalUsers: userCount[0]?.count || 0,
                staffActionBreakdown: staffActions,
                userActionBreakdown: userActions
            }
        });
    } catch (error) {
        console.error('Error getting logs summary:', error);
        res.status(500).json({ success: false, message: 'Error fetching logs summary' });
    }
};
