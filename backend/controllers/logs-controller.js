const db = require('../config/database');

const MAX_LIMIT = 100;

/**
 * Shared pieces for the three log sources (staff/admin and visitor).
 *
 * The Logs page has to answer "who did what, from where, on what device", and
 * both tables already store ip_address/user_agent - they simply were never
 * selected. Each source also keeps an actor snapshot, so an entry stays readable
 * after the account behind it is deleted (see
 * database/ensure-staff-activity-schema.js).
 */

// Role a deleted account is reported under. 'staff' for staff_activity_logs
// rows, 'user' for user_activity_logs rows: the table the entry came from is the
// honest answer when the account itself is gone.
const STAFF_ROLE = "'staff'";
const USER_ROLE = "'user'";

/**
 * @returns {{limit: number, offset: number}}
 */
const readPaging = (query) => {
    const rawLimit = parseInt(query.limit, 10) || 50;
    const rawOffset = parseInt(query.offset, 10) || 0;
    return {
        limit: Math.min(Math.max(rawLimit, 1), MAX_LIMIT),
        offset: Math.max(rawOffset, 0)
    };
};

/**
 * Date-range filter shared by every source. startDate is inclusive from
 * midnight, endDate inclusive to the end of that day.
 *
 * Clauses are pushed without a leading AND: callers join them with ' AND '.
 */
const applyDateRange = (clauses, params, column, { startDate, endDate }) => {
    if (startDate) {
        clauses.push(`${column} >= ?`);
        params.push(startDate);
    }
    if (endDate) {
        clauses.push(`${column} <= ?`);
        params.push(/^\d{4}-\d{2}-\d{2}$/.test(endDate) ? `${endDate} 23:59:59` : endDate);
    }
};

/**
 * Get staff/admin activity logs with pagination and filters
 */
exports.getStaffLogs = async (req, res) => {
    try {
        const { limit, offset } = readPaging(req.query);
        const { actionType, startDate, endDate, staffId, role, search } = req.query;

        let query = `SELECT
            sal.id,
            sal.staff_id,
            sal.action_type,
            sal.action_description,
            sal.entity_type,
            sal.entity_id,
            sal.ip_address,
            sal.user_agent,
            sal.created_at,
            COALESCE(sal.actor_name, CONCAT(u.first_name, ' ', u.last_name)) AS actor_name,
            COALESCE(sal.actor_email, u.email) AS actor_email,
            COALESCE(sal.actor_role, u.role, ${STAFF_ROLE}) AS role,
            u.first_name,
            u.last_name,
            u.email,
            u.profile_image,
            u.username,
            'staff' AS source
         FROM staff_activity_logs sal
         LEFT JOIN users u ON sal.staff_id = u.id
         WHERE 1=1`;

        const params = [];

        if (staffId) {
            query += ` AND sal.staff_id = ?`;
            params.push(parseInt(staffId, 10));
        }
        if (actionType) {
            query += ` AND sal.action_type = ?`;
            params.push(actionType);
        }
        if (role === 'admin' || role === 'staff') {
            query += ` AND COALESCE(sal.actor_role, u.role, ${STAFF_ROLE}) = ?`;
            params.push(role);
        }
        if (search) {
            query += ` AND (COALESCE(sal.actor_name, CONCAT(u.first_name, ' ', u.last_name)) LIKE ?
                OR COALESCE(sal.actor_email, u.email) LIKE ?
                OR sal.action_description LIKE ?
                OR sal.action_type LIKE ?
                OR sal.ip_address LIKE ?
                OR sal.user_agent LIKE ?
                OR sal.entity_type LIKE ?)`;
            const needle = `%${String(search).trim()}%`;
            params.push(needle, needle, needle, needle, needle, needle, needle);
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

        query += ` ORDER BY sal.created_at DESC, sal.id DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await db.query(query, params);

        res.json({
            success: true,
            logs: rows,
            total: Number(countResult[0]?.total) || 0,
            limit,
            offset
        });
    } catch (error) {
        console.error('Error getting staff logs:', error);
        res.status(500).json({ success: false, message: 'Error fetching staff logs' });
    }
};

/**
 * Get visitor activity logs from user_activity_logs table
 */
exports.getUserLogs = async (req, res) => {
    try {
        const { limit, offset } = readPaging(req.query);
        const { actionType, startDate, endDate, userId, search } = req.query;

        let query = `SELECT
            ual.id,
            ual.user_id,
            ual.action_type,
            ual.action_description,
            ual.entity_type,
            ual.entity_id,
            ual.ip_address,
            ual.user_agent,
            ual.created_at,
            COALESCE(u.first_name, ual.actor_name) AS first_name,
            COALESCE(u.last_name, '') AS last_name,
            COALESCE(u.email, ual.actor_email) AS email,
            ual.actor_name,
            ual.actor_email,
            COALESCE(u.role, ${USER_ROLE}) AS role,
            u.profile_image,
            u.username,
            'user' AS source
         FROM user_activity_logs ual
         LEFT JOIN users u ON ual.user_id = u.id
         WHERE 1=1`;

        const params = [];

        if (userId) {
            query += ` AND ual.user_id = ?`;
            params.push(parseInt(userId, 10));
        }
        if (actionType) {
            query += ` AND ual.action_type = ?`;
            params.push(actionType);
        }
        if (search) {
            query += ` AND (COALESCE(ual.actor_name, CONCAT(u.first_name, ' ', u.last_name)) LIKE ?
                OR COALESCE(ual.actor_email, u.email) LIKE ?
                OR ual.action_description LIKE ?
                OR ual.action_type LIKE ?
                OR ual.ip_address LIKE ?
                OR ual.user_agent LIKE ?
                OR ual.entity_type LIKE ?)`;
            const needle = `%${String(search).trim()}%`;
            params.push(needle, needle, needle, needle, needle, needle, needle);
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

        query += ` ORDER BY ual.created_at DESC, ual.id DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await db.query(query, params);

        res.json({
            success: true,
            logs: rows,
            total: Number(countResult[0]?.total) || 0,
            limit,
            offset
        });
    } catch (error) {
        console.error('Error getting user logs:', error);
        res.status(500).json({ success: false, message: 'Error fetching user logs' });
    }
};

/**
 * Every action from both tables in one chronological stream: admins, staff and
 * visitors together. Same filters as the single-source endpoints.
 */
exports.getAllLogs = async (req, res) => {
    try {
        const { limit, offset } = readPaging(req.query);
        const { actionType, startDate, endDate, role, search } = req.query;

        const staffFilter = [];
        const userFilter = [];
        const staffParams = [];
        const userParams = [];

        if (actionType) {
            staffFilter.push('sal.action_type = ?');
            userFilter.push('ual.action_type = ?');
            staffParams.push(actionType);
            userParams.push(actionType);
        }
        if (role && ['admin', 'staff', 'user'].includes(role)) {
            staffFilter.push(`COALESCE(sal.actor_role, u.role, ${STAFF_ROLE}) = ?`);
            userFilter.push(`COALESCE(u.role, ${USER_ROLE}) = ?`);
            staffParams.push(role);
            userParams.push(role);
        }
        if (search) {
            const needle = `%${String(search).trim()}%`;
            staffFilter.push(`(COALESCE(sal.actor_name, CONCAT(u.first_name, ' ', u.last_name)) LIKE ?
                OR COALESCE(sal.actor_email, u.email) LIKE ?
                OR sal.action_description LIKE ?
                OR sal.action_type LIKE ?
                OR sal.ip_address LIKE ?
                OR sal.user_agent LIKE ?
                OR sal.entity_type LIKE ?)`);
            userFilter.push(`(COALESCE(ual.actor_name, CONCAT(u.first_name, ' ', u.last_name)) LIKE ?
                OR COALESCE(ual.actor_email, u.email) LIKE ?
                OR ual.action_description LIKE ?
                OR ual.action_type LIKE ?
                OR ual.ip_address LIKE ?
                OR ual.user_agent LIKE ?
                OR ual.entity_type LIKE ?)`);
            staffParams.push(needle, needle, needle, needle, needle, needle, needle);
            userParams.push(needle, needle, needle, needle, needle, needle, needle);
        }
        applyDateRange(staffFilter, staffParams, 'sal.created_at', { startDate, endDate });
        applyDateRange(userFilter, userParams, 'ual.created_at', { startDate, endDate });

        const staffWhere = staffFilter.length ? ` AND ${staffFilter.join(' AND ')}` : '';
        const userWhere = userFilter.length ? ` AND ${userFilter.join(' AND ')}` : '';

        const staffSelect = `SELECT
            sal.id,
            'staff' AS source,
            sal.staff_id AS actor_id,
            sal.action_type,
            sal.action_description,
            sal.entity_type,
            sal.entity_id,
            sal.ip_address,
            sal.user_agent,
            sal.created_at,
            COALESCE(sal.actor_name, CONCAT(u.first_name, ' ', u.last_name)) AS actor_name,
            COALESCE(sal.actor_email, u.email) AS actor_email,
            COALESCE(sal.actor_role, u.role, ${STAFF_ROLE}) AS role,
            u.profile_image,
            u.username
         FROM staff_activity_logs sal
         LEFT JOIN users u ON sal.staff_id = u.id
         WHERE 1=1`;

        const userSelect = `SELECT
            ual.id,
            'user' AS source,
            ual.user_id AS actor_id,
            ual.action_type,
            ual.action_description,
            ual.entity_type,
            ual.entity_id,
            ual.ip_address,
            ual.user_agent,
            ual.created_at,
            COALESCE(ual.actor_name, CONCAT(u.first_name, ' ', u.last_name)) AS actor_name,
            COALESCE(ual.actor_email, u.email) AS actor_email,
            COALESCE(u.role, ${USER_ROLE}) AS role,
            u.profile_image,
            u.username
         FROM user_activity_logs ual
         LEFT JOIN users u ON ual.user_id = u.id
         WHERE 1=1`;

        const combinedParams = [...staffParams, ...userParams];
        const [countRows] = await db.query(
            `SELECT (
                SELECT COUNT(*) FROM staff_activity_logs sal
                LEFT JOIN users u ON sal.staff_id = u.id
                WHERE 1=1${staffWhere}
            ) + (
                SELECT COUNT(*) FROM user_activity_logs ual
                LEFT JOIN users u ON ual.user_id = u.id
                WHERE 1=1${userWhere}
            ) AS total`,
            combinedParams
        );

        const [rows] = await db.query(
            `SELECT * FROM (
                ${staffSelect}${staffWhere}
                UNION ALL
                ${userSelect}${userWhere}
             ) combined_logs
             ORDER BY created_at DESC, id DESC
             LIMIT ? OFFSET ?`,
            [...combinedParams, limit, offset]
        );

        res.json({
            success: true,
            logs: rows,
            total: Number(countRows[0]?.total) || 0,
            limit,
            offset
        });
    } catch (error) {
        console.error('Error getting all logs:', error);
        res.status(500).json({ success: false, message: 'Error fetching activity logs' });
    }
};

/**
 * Get logs summary counts
 */
exports.getLogsSummary = async (req, res) => {
    try {
        const [[staffCount], [userLogCount], [accountCount], [staffActions], [userActions], [roleRows]] = await Promise.all([
            db.query(`SELECT COUNT(*) as count FROM staff_activity_logs`),
            db.query(`SELECT COUNT(*) as count FROM user_activity_logs`),
            // Every account, not just visitors: the page reports on admins and
            // staff too, so counting only role = 'user' under-reported them.
            db.query(`SELECT COUNT(*) as count FROM users`),
            db.query(`
                SELECT action_type, COUNT(*) as count
                FROM staff_activity_logs
                GROUP BY action_type
            `),
            db.query(`
                SELECT action_type, COUNT(*) as count
                FROM user_activity_logs
                GROUP BY action_type
            `),
            db.query(`
                SELECT role, COUNT(*) as count FROM (
                    SELECT COALESCE(sal.actor_role, u.role, ${STAFF_ROLE}) AS role
                    FROM staff_activity_logs sal
                    LEFT JOIN users u ON sal.staff_id = u.id
                    UNION ALL
                    SELECT COALESCE(u.role, ${USER_ROLE}) AS role
                    FROM user_activity_logs ual
                    LEFT JOIN users u ON ual.user_id = u.id
                ) roles
                GROUP BY role
            `)
        ]);

        const totalStaffActions = Number(staffCount[0]?.count) || 0;
        const totalUserActions = Number(userLogCount[0]?.count) || 0;

        res.json({
            success: true,
            summary: {
                totalStaffActions,
                totalUserActions,
                totalActivity: totalStaffActions + totalUserActions,
                totalUsers: Number(accountCount[0]?.count) || 0,
                roleBreakdown: roleRows.map(row => ({ role: row.role, count: Number(row.count) })),
                staffActionBreakdown: staffActions,
                userActionBreakdown: userActions
            }
        });
    } catch (error) {
        console.error('Error getting logs summary:', error);
        res.status(500).json({ success: false, message: 'Error fetching logs summary' });
    }
};