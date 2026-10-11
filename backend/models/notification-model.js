const db = require('../config/database');
const { sendNotificationEmail } = require('../utils/email');
const { DEFAULT_SETTINGS, MARKETING_CATEGORY, STORED_PREFERENCES } = require('../services/notification-service');

/**
 * Merge a visitor's stored notification_settings over the defaults, always returning
 * every stored preference key. mysql2 returns a JSON column as an object on some paths
 * and as a string on others, so both are accepted. Unknown keys are discarded.
 */
const mergeNotificationSettings = (stored) => {
    let parsed = stored;
    if (typeof parsed === 'string') {
        try {
            parsed = JSON.parse(parsed);
        } catch {
            parsed = null;
        }
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        parsed = {};
    }
    const merged = {};
    for (const key of STORED_PREFERENCES) {
        merged[key] = key in parsed ? Boolean(parsed[key]) : DEFAULT_SETTINGS[key];
    }
    return merged;
};

// Delivery counters for GET /api/health?full=true. Email failures used to be invisible
// because sendNotificationEmail returned true unconditionally.
const emailDeliveryStats = { sent: 0, failed: 0 };

const recordEmailDelivery = (delivered) => {
    if (delivered) emailDeliveryStats.sent += 1;
    else emailDeliveryStats.failed += 1;
};

/**
 * Decide whether a notification should be inserted in-app and emailed.
 *
 * Extracted as a pure function so it is testable without a database.
 *
 * @param {object} settings - merged visitor preferences
 * @param {string|null} category - catalog category gating this notification, or null
 * @param {boolean} emailByDefault - catalog entry's default email behaviour
 * @returns {{ push: boolean, email: boolean }}
 */
const resolveDelivery = (settings, category, emailByDefault) => {
    if (category && settings[category] === false) {
        return { push: false, email: false };
    }
    const optedIntoMarketing = category !== MARKETING_CATEGORY || settings.marketingEmails === true;
    return {
        push: settings.pushNotifications !== false,
        email: emailByDefault && optedIntoMarketing && settings.emailNotifications !== false
    };
};

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
        // Types are catalog keys like 'event.announced' / 'reservation.confirmed', so
        // prefix matching is required — an exact IN list would match nothing.
        const [rows] = await db.query(
            `SELECT * FROM notifications
             WHERE (type LIKE 'event%' OR type LIKE 'ticket%' OR type LIKE 'reservation%' OR type = 'system')
             AND user_id IN (SELECT id FROM users WHERE role IN ('admin', 'staff'))
             ORDER BY created_at DESC
             LIMIT ?`,
            [limit]
        );
        return rows;
    }

    // Get recent activity summary for admin/staff dashboard
    static async getActivitySummary(role = null) {
        let ticketStats = [{ total: 0, today: 0, this_week: 0 }];
        let pendingTickets = [{ count: 0 }];
        let recentTickets = [];
        try {
            // "Sold" counts confirmed/completed bookings created on the calendar
            // day or week (not a rolling window), excluding soft-deleted rows.
            [ticketStats] = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status IN ('confirmed', 'completed') AND DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today,
                    SUM(CASE WHEN status IN ('confirmed', 'completed') AND created_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) THEN 1 ELSE 0 END) as this_week
                FROM ticket_reservations
                WHERE (is_deleted IS NULL OR is_deleted = FALSE)
            `);

            [pendingTickets] = await db.query(`
                SELECT COUNT(*) as count FROM ticket_reservations 
                WHERE status = 'pending' AND (is_deleted IS NULL OR is_deleted = FALSE)
            `);

            [recentTickets] = await db.query(`
                SELECT t.*, u.first_name, u.last_name, u.email
                FROM ticket_reservations t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE (t.is_deleted IS NULL OR t.is_deleted = FALSE)
                ORDER BY t.created_at DESC
                LIMIT 5
            `);
        } catch (error) {
            console.error('Error loading ticket notification summary:', error.message);
        }

        const [userStats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today,
                SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) THEN 1 ELSE 0 END) as this_week
            FROM users WHERE role = 'user' AND deleted_at IS NULL
        `);

        const [animalStats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) THEN 1 ELSE 0 END) as this_week
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
                SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) THEN 1 ELSE 0 END) AS today,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
            FROM event_reservations
            WHERE (is_deleted IS NULL OR is_deleted = FALSE)
        `);

        // Scope the inbox unread count to the requestor's portal when known.
        const isPortal = role === 'admin' || role === 'staff';
        const messageParams = isPortal ? [role] : [];
        const [messageStats] = await db.query(
            `SELECT COUNT(*) AS total,
                SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) THEN 1 ELSE 0 END) AS today,
                SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) AS unread
            FROM user_messages
            ${isPortal ? "WHERE (recipient_type = ? OR recipient_type = 'all')" : ''}`,
            messageParams
        );

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
            this.getActivitySummary(role)
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

    // notifyManagement / notifyUsers were removed: they now live in
    // services/notification-service.js alongside the catalog. Every call site was
    // migrated there, so keeping copies here would reintroduce the drift this
    // service was created to remove.

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
        const { userId, title, message, type = 'info', link = null, category = null, emailByDefault = true } = notification;
        const [rows] = await db.query(
            `SELECT email, first_name, notification_settings FROM users
             WHERE id = ? AND is_active = TRUE AND deleted_at IS NULL`,
            [userId]
        );
        if (!rows[0]) return { id: null, emailSent: false, skipped: true };

        const settings = mergeNotificationSettings(rows[0].notification_settings);
        const delivery = resolveDelivery(settings, category, emailByDefault);
        if (!delivery.push && !delivery.email) {
            return { id: null, emailSent: false, skipped: true };
        }

        let insertId = null;
        if (delivery.push) {
            const [result] = await db.query(
                `INSERT INTO notifications (user_id, title, message, type, link)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, title, message, type, link]
            );
            insertId = result.insertId;
        }

        let emailSent = false;
        if (delivery.email) {
            try {
                emailSent = await sendNotificationEmail(rows[0].email, rows[0].first_name, title, message, link);
            } catch (error) {
                // The in-app row (if any) is already committed; an SMTP fault must not
                // discard it or propagate into the caller's request.
                console.error('Notification email failed:', error.message);
            }
            recordEmailDelivery(emailSent);
        }

        return { id: insertId, emailSent, skipped: false };
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

    // Delete all notifications for a user
    static async deleteAll(userId) {
        const [result] = await db.query(
            `DELETE FROM notifications 
             WHERE user_id = ?`,
            [userId]
        );
        return result.affectedRows;
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
module.exports.resolveDelivery = resolveDelivery;
module.exports.mergeNotificationSettings = mergeNotificationSettings;
module.exports.emailDeliveryStats = () => ({ ...emailDeliveryStats });
