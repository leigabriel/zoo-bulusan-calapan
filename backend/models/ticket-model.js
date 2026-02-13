const db = require('../config/database');

class Ticket {
    static async getAll() {
        const [rows] = await db.query(
            `SELECT t.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM tickets t 
             LEFT JOIN users u ON t.user_id = u.id 
             ORDER BY t.created_at DESC`
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(
            `SELECT t.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM tickets t 
             LEFT JOIN users u ON t.user_id = u.id 
             WHERE t.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async findByCode(code) {
        const [rows] = await db.query(
            `SELECT t.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM tickets t 
             LEFT JOIN users u ON t.user_id = u.id 
             WHERE t.booking_reference = ?`,
            [code]
        );
        return rows[0];
    }

    static async findByUserId(userId) {
        const [rows] = await db.query(
            'SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    }

    static async create(ticketData) {
        const { userId, bookingReference, visitorEmail, ticketType, quantity, pricePerTicket, totalAmount, visitDate, status, residentIdImage } = ticketData;
        const [result] = await db.query(
            `INSERT INTO tickets (booking_reference, user_id, visitor_email, visit_date, ticket_type, quantity, price_per_ticket, total_amount, status, resident_id_image) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [bookingReference, userId || null, visitorEmail || null, visitDate, ticketType, quantity, pricePerTicket || 0, totalAmount || 0, status || 'pending', residentIdImage || null]
        );
        return result.insertId;
    }

    static async updateStatus(id, status) {
        const [result] = await db.query(
            'UPDATE tickets SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async validateTicket(code) {
        const ticket = await this.findByCode(code);
        if (!ticket) return { valid: false, message: 'Ticket not found' };
        if (ticket.status === 'used') return { valid: false, message: 'Ticket already used' };
        if (ticket.status === 'expired') return { valid: false, message: 'Ticket expired' };

        await this.updateStatus(ticket.id, 'used');
        return { valid: true, message: 'Ticket validated successfully', ticket };
    }

    static async count() {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM tickets');
        return rows[0].total;
    }

    static async countByStatus(status) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as total FROM tickets WHERE status = ?',
            [status]
        );
        return rows[0].total;
    }

    static async getTotalRevenue() {
        const [rows] = await db.query(
            'SELECT SUM(total_amount) as total FROM tickets WHERE status != "cancelled"'
        );
        return rows[0].total || 0;
    }

    static async getRevenueByDateRange(startDate, endDate) {
        const [rows] = await db.query(
            `SELECT DATE(created_at) as date, SUM(total_amount) as revenue, COUNT(*) as count 
             FROM tickets 
             WHERE created_at BETWEEN ? AND ? AND status != 'cancelled'
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [startDate, endDate]
        );
        return rows;
    }

    static async updateTicketWithDetails(id, updateData) {
        const { status, paymentStatus, paymentMethod, cancellationReason, checkedInBy } = updateData;
        let query = 'UPDATE tickets SET ';
        const params = [];
        const updates = [];

        if (status) {
            updates.push('status = ?');
            params.push(status);
        }
        if (paymentStatus) {
            updates.push('payment_status = ?');
            params.push(paymentStatus);
        }
        if (paymentMethod) {
            updates.push('payment_method = ?');
            params.push(paymentMethod);
        }
        if (cancellationReason !== undefined) {
            updates.push('notes = ?');
            params.push(cancellationReason);
        }
        if (status === 'used' || status === 'confirmed') {
            updates.push('checked_in_at = NOW()');
            if (checkedInBy) {
                updates.push('checked_in_by = ?');
                params.push(checkedInBy);
            }
        }

        if (updates.length === 0) return false;

        query += updates.join(', ') + ' WHERE id = ?';
        params.push(id);

        const [result] = await db.query(query, params);
        return result.affectedRows > 0;
    }

    static async updatePaymentStatus(id, paymentStatus) {
        const [result] = await db.query(
            'UPDATE tickets SET payment_status = ? WHERE id = ?',
            [paymentStatus, id]
        );
        return result.affectedRows > 0;
    }

    static async updateQRCode(id, qrCode) {
        const [result] = await db.query(
            'UPDATE tickets SET qr_code = ? WHERE id = ?',
            [qrCode, id]
        );
        return result.affectedRows > 0;
    }

    static async findByQRCode(qrCode) {
        const [rows] = await db.query(
            `SELECT t.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM tickets t 
             LEFT JOIN users u ON t.user_id = u.id 
             WHERE t.qr_code = ?`,
            [qrCode]
        );
        return rows[0];
    }

    static async getByDateRange(startDate, endDate) {
        const [rows] = await db.query(
            `SELECT t.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM tickets t 
             LEFT JOIN users u ON t.user_id = u.id 
             WHERE t.visit_date BETWEEN ? AND ?
             ORDER BY t.visit_date ASC`,
            [startDate, endDate]
        );
        return rows;
    }

    static async getTodayTickets() {
        const [rows] = await db.query(
            `SELECT t.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM tickets t 
             LEFT JOIN users u ON t.user_id = u.id 
             WHERE DATE(t.visit_date) = CURDATE()
             ORDER BY t.created_at DESC`
        );
        return rows;
    }

    static async countTodayTickets() {
        const [rows] = await db.query(
            'SELECT COUNT(*) as total FROM tickets WHERE DATE(visit_date) = CURDATE()'
        );
        return rows[0].total;
    }

    static async countPendingValidations() {
        const [rows] = await db.query(
            "SELECT COUNT(*) as total FROM tickets WHERE status = 'confirmed' AND DATE(visit_date) = CURDATE()"
        );
        return rows[0].total;
    }

    static async countTodayVisitors() {
        const [rows] = await db.query(
            "SELECT COALESCE(SUM(quantity), 0) as total FROM tickets WHERE DATE(visit_date) = CURDATE() AND status IN ('confirmed', 'used')"
        );
        return rows[0].total;
    }

    static async getRecentTickets(limit = 5) {
        const [rows] = await db.query(
            `SELECT t.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM tickets t 
             LEFT JOIN users u ON t.user_id = u.id 
             ORDER BY t.created_at DESC
             LIMIT ?`,
            [limit]
        );
        return rows;
    }

    static async expireOldTickets() {
        // Expire tickets where:
        // 1. Visit date has passed, OR
        // 2. 7 days have passed since purchase (for pending tickets)
        const [result] = await db.query(
            `UPDATE tickets SET status = 'expired' 
             WHERE status IN ('pending', 'confirmed') 
             AND (
                visit_date < CURDATE()
                OR (status = 'pending' AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY))
             )`
        );
        return result.affectedRows;
    }

    static async countByDateAndTime(date, time) {
        // Note: visit_time is stored as 'morning', 'afternoon', 'full_day'
        // Map the hour to the time slot category
        let timeCategory = 'full_day';
        const hour = parseInt(time.split(':')[0]);
        if (hour < 12) {
            timeCategory = 'morning';
        } else {
            timeCategory = 'afternoon';
        }

        // Count tickets for this date with matching or full_day visit time
        const [rows] = await db.query(
            `SELECT COALESCE(SUM(quantity), 0) as total 
             FROM tickets 
             WHERE DATE(visit_date) = ? 
             AND status IN ('pending', 'confirmed', 'used')
             AND (visit_time = ? OR visit_time = 'full_day')`,
            [date, timeCategory]
        );
        return rows[0].total;
    }

    // Get weekly analytics data (last 7 days)
    static async getWeeklyAnalytics() {
        const [rows] = await db.query(
            `SELECT 
                DATE(visit_date) as date,
                DAYNAME(visit_date) as day,
                COUNT(*) as tickets,
                COALESCE(SUM(quantity), 0) as visitors,
                COALESCE(SUM(total_amount), 0) as revenue
             FROM tickets 
             WHERE visit_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             AND status IN ('confirmed', 'used')
             GROUP BY DATE(visit_date), DAYNAME(visit_date)
             ORDER BY date ASC`
        );
        return rows;
    }

    // Get monthly analytics data (last 12 months)
    static async getMonthlyAnalytics() {
        const [rows] = await db.query(
            `SELECT 
                DATE_FORMAT(visit_date, '%Y-%m') as month,
                DATE_FORMAT(visit_date, '%b') as monthName,
                COUNT(*) as tickets,
                COALESCE(SUM(quantity), 0) as visitors,
                COALESCE(SUM(total_amount), 0) as revenue
             FROM tickets 
             WHERE visit_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
             AND status IN ('confirmed', 'used')
             GROUP BY DATE_FORMAT(visit_date, '%Y-%m'), DATE_FORMAT(visit_date, '%b')
             ORDER BY month ASC`
        );
        return rows;
    }

    // Get ticket type distribution
    static async getTicketTypeDistribution() {
        const [rows] = await db.query(
            `SELECT 
                ticket_type as type,
                COUNT(*) as count,
                COALESCE(SUM(total_amount), 0) as revenue
             FROM tickets 
             WHERE status IN ('confirmed', 'used')
             GROUP BY ticket_type`
        );
        return rows;
    }

    // Get daily stats for comparison
    static async getDailyComparison() {
        const [rows] = await db.query(
            `SELECT 
                (SELECT COUNT(*) FROM tickets WHERE DATE(created_at) = CURDATE()) as today_tickets,
                (SELECT COUNT(*) FROM tickets WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) as yesterday_tickets,
                (SELECT COALESCE(SUM(total_amount), 0) FROM tickets WHERE DATE(created_at) = CURDATE() AND status != 'cancelled') as today_revenue,
                (SELECT COALESCE(SUM(total_amount), 0) FROM tickets WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND status != 'cancelled') as yesterday_revenue`
        );
        return rows[0];
    }

    // Archive ticket
    static async archiveTicket(ticketId) {
        const [result] = await db.query(
            'UPDATE tickets SET is_archived = TRUE, updated_at = NOW() WHERE id = ?',
            [ticketId]
        );
        return result.affectedRows > 0;
    }

    // Unarchive ticket
    static async unarchiveTicket(ticketId) {
        const [result] = await db.query(
            'UPDATE tickets SET is_archived = FALSE, updated_at = NOW() WHERE id = ?',
            [ticketId]
        );
        return result.affectedRows > 0;
    }

    // Archive multiple tickets
    static async archiveMultiple(ticketIds) {
        if (!ticketIds || ticketIds.length === 0) return 0;
        const [result] = await db.query(
            'UPDATE tickets SET is_archived = TRUE, updated_at = NOW() WHERE id IN (?)',
            [ticketIds]
        );
        return result.affectedRows;
    }

    // Get archived tickets by user
    static async getArchivedByUserId(userId) {
        const [rows] = await db.query(
            'SELECT * FROM tickets WHERE user_id = ? AND is_archived = TRUE ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    }

    // Get active (non-archived) tickets by user
    static async getActiveByUserId(userId) {
        const [rows] = await db.query(
            'SELECT * FROM tickets WHERE user_id = ? AND (is_archived = FALSE OR is_archived IS NULL) ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    }

    // Mark ticket as paid
    static async markAsPaid(ticketId, paidBy = null) {
        const [result] = await db.query(
            `UPDATE tickets SET payment_status = 'paid', checked_in_by = ?, updated_at = NOW() WHERE id = ?`,
            [paidBy, ticketId]
        );
        return result.affectedRows > 0;
    }

    // Update verification status (for resident tickets)
    static async updateVerificationStatus(ticketId, status) {
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) return false;
        
        const [result] = await db.query(
            'UPDATE tickets SET verification_status = ?, updated_at = NOW() WHERE id = ?',
            [status, ticketId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Ticket;