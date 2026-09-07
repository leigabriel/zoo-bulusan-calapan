const db = require('../config/database');

class Notification {
    // Get all notifications for a user
    static async getByUserId(userId, limit = 20) {
        const [rows] = await db.query(
            `SELECT * FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC, id DESC
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
        let ticketStats = [{ total: 0, today: 0, this_week: 0 }];
        let pendingTickets = [{ count: 0 }];
        let recentTickets = [];
        try {
            [ticketStats] = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as today,
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as this_week
                FROM ticket_reservations
            `);

            [pendingTickets] = await db.query(`
                SELECT COUNT(*) as count FROM ticket_reservations WHERE status = 'pending'
            `);

            [recentTickets] = await db.query(`
                SELECT t.*, u.first_name, u.last_name, u.email
                FROM ticket_reservations t
                LEFT JOIN users u ON t.user_id = u.id
                ORDER BY t.created_at DESC
                LIMIT 5
            `);
        } catch (error) {
            console.error('Error loading ticket notification summary:', error.message);
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

        const [eventReservationStats] = await db.query(`
            SELECT COUNT(*) AS total,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) AS today,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
            FROM event_reservations
        `);

        const [messageStats] = await db.query(`
            SELECT COUNT(*) AS total,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) AS today,
                SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) AS unread
            FROM user_messages
        `);

        let pendingCommunityPosts = [{ count: 0 }];
        let pendingAppeals = [{ count: 0 }];
        try {
            [pendingCommunityPosts] = await db.query(`
                SELECT COUNT(*) AS count FROM community_posts WHERE status = 'pending'
            `);
            [pendingAppeals] = await db.query(`
                SELECT COUNT(*) AS count FROM user_appeals WHERE status = 'pending'
            `);
        } catch (error) {
            // Tables may not exist yet
        }

        return {
            tickets: ticketStats[0] || { total: 0, today: 0, this_week: 0 },
            users: userStats[0] || { total: 0, today: 0, this_week: 0 },
            animals: animalStats[0] || { total: 0, today: 0, this_week: 0 },
            events: eventStats[0] || { total: 0, upcoming: 0 },
            eventReservations: eventReservationStats[0] || { total: 0, today: 0, pending: 0 },
            messages: messageStats[0] || { total: 0, today: 0, unread: 0 },
            pendingTickets: pendingTickets[0]?.count || 0,
            pendingCommunityPosts: pendingCommunityPosts[0]?.count || 0,
            pendingAppeals: pendingAppeals[0]?.count || 0,
            recentTickets: recentTickets || []
        };
    }

    static async generateDashboardNotifications(userId, role) {
        const [rows, unreadCount, summary] = await Promise.all([
            this.getByUserId(userId, 50),
            this.getUnreadCount(userId),
            this.getActivitySummary()
        ]);
        return {
            notifications: rows.map(n => ({
                ...n,
                read: Boolean(n.is_read),
                link: this.managementLink(n.link, role),
                time: this.formatTime(n.created_at)
            })),
            unreadCount: Number(unreadCount),
            summary
        };
    }

    static managementLink(link, role) {
        if (!link) return null;
        // Only destinations available in both management portals may cross roles.
        const match = link.match(/^\/(?:admin|staff)\/(reservations|tickets|messages|community-moderation|animals|plants|events)([?#].*)?$/);
        if (match) return `/${role}/${match[1]}${match[2] || ''}`;
        return role === 'admin' && link.startsWith('/admin/') ? link : null;
    }

    static async notifyManagement({ title, message, type = 'info', link = null }) {
        try {
            // One statement gives every eligible recipient an independent read state.
            await db.query(
                `INSERT INTO notifications (user_id, title, message, type, link)
                 SELECT id, ?, ?, ?, CASE WHEN role = 'staff' THEN ? ELSE ? END
                 FROM users WHERE role IN ('admin', 'staff')
                 AND is_active = TRUE AND is_suspended = FALSE AND deleted_at IS NULL`,
                [title, message, type, this.managementLink(link, 'staff'), this.managementLink(link, 'admin')]
            );
        } catch (error) {
            // Notification failures must not turn a saved booking/message into a retry.
            console.error('Error creating management notifications:', error);
        }
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
