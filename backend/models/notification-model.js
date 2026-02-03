const db = require('../config/database');

class Notification {
    // Get all notifications for a user
    static async getByUserId(userId, limit = 20) {
        const [rows] = await db.query(
            `SELECT * FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [userId, limit]
        );
        return rows;
    }

    // Get unread count for a user
    static async getUnreadCount(userId) {
        const [rows] = await db.query(
            `SELECT COUNT(*) as count FROM notifications 
             WHERE user_id = ? AND is_read = FALSE`,
            [userId]
        );
        return rows[0]?.count || 0;
    }

    // Get admin/staff system notifications (for dashboard)
    static async getSystemNotifications(limit = 20) {
        const [rows] = await db.query(
            `SELECT * FROM notifications 
             WHERE type IN ('system', 'ticket', 'event')
             AND user_id IN (SELECT id FROM users WHERE role IN ('admin', 'staff'))
             ORDER BY created_at DESC 
             LIMIT ?`,
            [limit]
        );
        return rows;
    }

    // Get recent activity summary for admin/staff dashboard
    static async getActivitySummary() {
        const [ticketStats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as today,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as this_week
            FROM tickets
        `);

        const [userStats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as today,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as this_week
            FROM users WHERE role = 'user'
        `);

        const [animalStats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as today,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as this_week
            FROM animals
        `);

        const [eventStats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'upcoming' THEN 1 ELSE 0 END) as upcoming
            FROM events
        `);

        const [pendingTickets] = await db.query(`
            SELECT COUNT(*) as count FROM tickets WHERE status = 'pending'
        `);

        const [recentTickets] = await db.query(`
            SELECT t.*, u.first_name, u.last_name, u.email
            FROM tickets t
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
            LIMIT 5
        `);

        return {
            tickets: ticketStats[0] || { total: 0, today: 0, this_week: 0 },
            users: userStats[0] || { total: 0, today: 0, this_week: 0 },
            animals: animalStats[0] || { total: 0, today: 0, this_week: 0 },
            events: eventStats[0] || { total: 0, upcoming: 0 },
            pendingTickets: pendingTickets[0]?.count || 0,
            recentTickets: recentTickets || []
        };
    }

    // Generate real-time notifications based on activity
    static async generateDashboardNotifications() {
        const summary = await this.getActivitySummary();
        const notifications = [];

        // New users today
        if (summary.users.today > 0) {
            notifications.push({
                id: 'users-today',
                type: 'user',
                message: `${summary.users.today} new user${summary.users.today > 1 ? 's' : ''} registered today.`,
                time: 'Today',
                read: false
            });
        }

        // New users this week
        if (summary.users.this_week > summary.users.today) {
            notifications.push({
                id: 'users-week',
                type: 'user',
                message: `${summary.users.this_week} new users this week.`,
                time: 'This week',
                read: true
            });
        }

        // Tickets purchased today
        if (summary.tickets.today > 0) {
            notifications.push({
                id: 'tickets-today',
                type: 'ticket',
                message: `${summary.tickets.today} ticket${summary.tickets.today > 1 ? 's' : ''} purchased today.`,
                time: 'Today',
                read: false
            });
        }

        // Pending tickets
        if (summary.pendingTickets > 0) {
            notifications.push({
                id: 'pending-tickets',
                type: 'alert',
                message: `${summary.pendingTickets} ticket${summary.pendingTickets > 1 ? 's' : ''} pending confirmation.`,
                time: 'Action required',
                read: false
            });
        }

        // Animals added today
        if (summary.animals.today > 0) {
            notifications.push({
                id: 'animals-today',
                type: 'info',
                message: `${summary.animals.today} new animal${summary.animals.today > 1 ? 's' : ''} added today.`,
                time: 'Today',
                read: true
            });
        }

        // Upcoming events
        if (summary.events.upcoming > 0) {
            notifications.push({
                id: 'upcoming-events',
                type: 'event',
                message: `${summary.events.upcoming} upcoming event${summary.events.upcoming > 1 ? 's' : ''}.`,
                time: 'Scheduled',
                read: true
            });
        }

        return {
            notifications,
            summary
        };
    }

    // Create a notification
    static async create(notification) {
        const { userId, title, message, type = 'info', link = null } = notification;
        const [result] = await db.query(
            `INSERT INTO notifications (user_id, title, message, type, link) 
             VALUES (?, ?, ?, ?, ?)`,
            [userId, title, message, type, link]
        );
        return result.insertId;
    }

    // Mark as read
    static async markAsRead(id, userId) {
        const [result] = await db.query(
            `UPDATE notifications SET is_read = TRUE 
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    // Mark all as read for a user
    static async markAllAsRead(userId) {
        const [result] = await db.query(
            `UPDATE notifications SET is_read = TRUE 
             WHERE user_id = ?`,
            [userId]
        );
        return result.affectedRows;
    }

    // Delete a notification
    static async delete(id, userId) {
        const [result] = await db.query(
            `DELETE FROM notifications 
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    // Delete old notifications (older than 30 days)
    static async deleteOld() {
        const [result] = await db.query(
            `DELETE FROM notifications 
             WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`
        );
        return result.affectedRows;
    }
}

module.exports = Notification;