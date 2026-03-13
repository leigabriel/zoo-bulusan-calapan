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
        // Default values for stats in case tables don't exist
        let ticketStats = [{ total: 0, today: 0, this_week: 0 }];
        let pendingTickets = [{ count: 0 }];
        let recentTickets = [];

        // Try to get ticket stats - table may not exist
        try {
            [ticketStats] = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as today,
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as this_week
                FROM tickets
            `);

            [pendingTickets] = await db.query(`
                SELECT COUNT(*) as count FROM tickets WHERE status = 'pending'
            `);

            [recentTickets] = await db.query(`
                SELECT t.*, u.first_name, u.last_name, u.email
                FROM tickets t
                LEFT JOIN users u ON t.user_id = u.id
                ORDER BY t.created_at DESC
                LIMIT 5
            `);
        } catch (error) {
            // tickets table may not exist - use defaults
            console.log('Note: tickets table not found, using defaults for ticket stats');
        }

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

        return {
            tickets: ticketStats[0] || { total: 0, today: 0, this_week: 0 },
            users: userStats[0] || { total: 0, today: 0, this_week: 0 },
            animals: animalStats[0] || { total: 0, today: 0, this_week: 0 },
            events: eventStats[0] || { total: 0, upcoming: 0 },
            pendingTickets: pendingTickets[0]?.count || 0,
            recentTickets: recentTickets || []
        };
    }

    // Generate real-time notifications based on activity, combined with database notifications
    static async generateDashboardNotifications(userId = null) {
        const summary = await this.getActivitySummary();
        const systemNotifications = [];

        // New users today
        if (summary.users.today > 0) {
            systemNotifications.push({
                id: 'users-today',
                type: 'user',
                title: 'New Users',
                message: `${summary.users.today} new user${summary.users.today > 1 ? 's' : ''} registered today.`,
                time: 'Today',
                read: true,
                link: '/admin/users'
            });
        }

        // New users this week
        if (summary.users.this_week > summary.users.today) {
            systemNotifications.push({
                id: 'users-week',
                type: 'user',
                title: 'Weekly Users',
                message: `${summary.users.this_week} new users this week.`,
                time: 'This week',
                read: true,
                link: '/admin/users'
            });
        }

        // Tickets purchased today
        if (summary.tickets.today > 0) {
            systemNotifications.push({
                id: 'tickets-today',
                type: 'ticket',
                title: 'Today\'s Tickets',
                message: `${summary.tickets.today} ticket${summary.tickets.today > 1 ? 's' : ''} purchased today.`,
                time: 'Today',
                read: true,
                link: '/admin/reservations'
            });
        }

        // Pending tickets
        if (summary.pendingTickets > 0) {
            systemNotifications.push({
                id: 'pending-tickets',
                type: 'alert',
                title: 'Pending Confirmation',
                message: `${summary.pendingTickets} ticket${summary.pendingTickets > 1 ? 's' : ''} pending confirmation.`,
                time: 'Action required',
                read: false,
                link: '/admin/reservations'
            });
        }

        // Animals added today
        if (summary.animals.today > 0) {
            systemNotifications.push({
                id: 'animals-today',
                type: 'info',
                title: 'New Animals',
                message: `${summary.animals.today} new animal${summary.animals.today > 1 ? 's' : ''} added today.`,
                time: 'Today',
                read: true,
                link: '/admin/animals'
            });
        }

        // Upcoming events
        if (summary.events.upcoming > 0) {
            systemNotifications.push({
                id: 'upcoming-events',
                type: 'event',
                title: 'Upcoming Events',
                message: `${summary.events.upcoming} upcoming event${summary.events.upcoming > 1 ? 's' : ''}.`,
                time: 'Scheduled',
                read: true,
                link: '/admin/events'
            });
        }

        // Fetch real notifications from database for the user
        let dbNotifications = [];
        if (userId) {
            try {
                const [rows] = await db.query(
                    `SELECT id, title, message, type, is_read as \`read\`, link, created_at
                     FROM notifications 
                     WHERE user_id = ?
                     ORDER BY created_at DESC
                     LIMIT 20`,
                    [userId]
                );
                dbNotifications = rows.map(n => ({
                    ...n,
                    time: this.formatTime(n.created_at)
                }));
            } catch (error) {
                console.error('Error fetching database notifications:', error);
            }
        }

        // Combine and return notifications (database notifications first, then system)
        const allNotifications = [...dbNotifications, ...systemNotifications];

        return {
            notifications: allNotifications,
            summary
        };
    }

    // Format time for display
    static formatTime(date) {
        if (!date) return 'Recently';
        const now = new Date();
        const notifDate = new Date(date);
        const diffMs = now - notifDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return notifDate.toLocaleDateString();
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
