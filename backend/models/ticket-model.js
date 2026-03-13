const db = require('../config/database');

class Ticket {
    // Dashboard statistics - uses ticket_reservations table
    static async getAll() {
        const [rows] = await db.query(
            `SELECT tr.*, tr.reservation_reference as booking_reference, tr.visitor_name,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM ticket_reservations tr 
             LEFT JOIN users u ON tr.user_id = u.id 
             ORDER BY tr.created_at DESC`
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(
            `SELECT tr.*, tr.reservation_reference as booking_reference, tr.visitor_name,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM ticket_reservations tr 
             LEFT JOIN users u ON tr.user_id = u.id 
             WHERE tr.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async findByCode(code) {
        const [rows] = await db.query(
            `SELECT tr.*, tr.reservation_reference as booking_reference, tr.visitor_name,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM ticket_reservations tr 
             LEFT JOIN users u ON tr.user_id = u.id 
             WHERE tr.reservation_reference = ?`,
            [code]
        );
        return rows[0];
    }

    static async findByUserId(userId) {
        const [rows] = await db.query(
            `SELECT tr.*, tr.reservation_reference as booking_reference, tr.visitor_name,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM ticket_reservations tr 
             LEFT JOIN users u ON tr.user_id = u.id 
             WHERE tr.user_id = ? ORDER BY tr.created_at DESC`,
            [userId]
        );
        return rows;
    }

    static async create(ticketData) {
        const { userId, bookingReference, visitorEmail, visitorName, visitorPhone, visitDate, adultQuantity, childQuantity, bulusanResidentQuantity, totalVisitors, status, residentIdImage } = ticketData;
        const [result] = await db.query(
            `INSERT INTO ticket_reservations (reservation_reference, user_id, visitor_email, visitor_name, visitor_phone, reservation_date, adult_quantity, child_quantity, bulusan_resident_quantity, total_visitors, status, resident_id_image) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [bookingReference, userId || null, visitorEmail || null, visitorName || null, visitorPhone || null, visitDate, adultQuantity || 0, childQuantity || 0, bulusanResidentQuantity || 0, totalVisitors || 1, status || 'pending', residentIdImage || null]
        );
        return result.insertId;
    }

    static async updateStatus(id, status) {
        const [result] = await db.query(
            'UPDATE ticket_reservations SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async validateTicket(code) {
        const ticket = await this.findByCode(code);
        if (!ticket) return { valid: false, message: 'Ticket not found' };
        if (ticket.status === 'used' || ticket.status === 'completed') return { valid: false, message: 'Ticket already used' };
        if (ticket.status === 'expired' || ticket.status === 'cancelled') return { valid: false, message: 'Ticket expired or cancelled' };

        await this.updateStatus(ticket.id, 'completed');
        return { valid: true, message: 'Ticket validated successfully', ticket };
    }

    static async count() {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM ticket_reservations');
        return rows[0].total;
    }

    static async countByStatus(status) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as total FROM ticket_reservations WHERE status = ?',
            [status]
        );
        return rows[0].total;
    }

    static async getTotalRevenue() {
        // Ticket reservations are free entry system - return 0 or calculate from visitor counts
        // Since this zoo uses reservations (not purchases), revenue is calculated differently
        const [rows] = await db.query(
            `SELECT COALESCE(SUM(
                (adult_quantity * 40) + 
                (child_quantity * 20) + 
                (bulusan_resident_quantity * 0)
            ), 0) as total FROM ticket_reservations WHERE status IN ('confirmed', 'completed')`
        );
        return rows[0].total || 0;
    }

    static async getRevenueByDateRange(startDate, endDate) {
        const [rows] = await db.query(
            `SELECT DATE(created_at) as date, 
                    COALESCE(SUM((adult_quantity * 40) + (child_quantity * 20)), 0) as revenue, 
                    COUNT(*) as count 
             FROM ticket_reservations 
             WHERE created_at BETWEEN ? AND ? AND status NOT IN ('cancelled', 'no_show')
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [startDate, endDate]
        );
        return rows;
    }

    static async updateTicketWithDetails(id, updateData) {
        const { status, cancellationReason, confirmedBy } = updateData;
        let query = 'UPDATE ticket_reservations SET ';
        const params = [];
        const updates = [];

        if (status) {
            updates.push('status = ?');
            params.push(status);
        }
        if (cancellationReason !== undefined) {
            updates.push('notes = ?');
            params.push(cancellationReason);
        }
        if (status === 'completed' || status === 'confirmed') {
            updates.push('confirmed_at = NOW()');
            if (confirmedBy) {
                updates.push('confirmed_by = ?');
                params.push(confirmedBy);
            }
        }
        if (status === 'cancelled') {
            updates.push('cancelled_at = NOW()');
        }

        if (updates.length === 0) return false;

        query += updates.join(', ') + ' WHERE id = ?';
        params.push(id);

        const [result] = await db.query(query, params);
        return result.affectedRows > 0;
    }

    static async findByQRCode(qrCode) {
        const [rows] = await db.query(
            `SELECT tr.*, tr.reservation_reference as booking_reference, tr.visitor_name,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM ticket_reservations tr 
             LEFT JOIN users u ON tr.user_id = u.id 
             WHERE tr.reservation_reference = ?`,
            [qrCode]
        );
        return rows[0];
    }

    static async getByDateRange(startDate, endDate) {
        const [rows] = await db.query(
            `SELECT tr.*, tr.reservation_reference as booking_reference, tr.visitor_name,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM ticket_reservations tr 
             LEFT JOIN users u ON tr.user_id = u.id 
             WHERE tr.reservation_date BETWEEN ? AND ?
             ORDER BY tr.reservation_date ASC`,
            [startDate, endDate]
        );
        return rows;
    }

    static async getTodayTickets() {
        const [rows] = await db.query(
            `SELECT tr.*, tr.reservation_reference as booking_reference, tr.visitor_name,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM ticket_reservations tr 
             LEFT JOIN users u ON tr.user_id = u.id 
             WHERE DATE(tr.reservation_date) = CURDATE()
             ORDER BY tr.created_at DESC`
        );
        return rows;
    }

    static async countTodayTickets() {
        const [rows] = await db.query(
            'SELECT COUNT(*) as total FROM ticket_reservations WHERE DATE(reservation_date) = CURDATE()'
        );
        return rows[0].total;
    }

    static async countPendingValidations() {
        const [rows] = await db.query(
            "SELECT COUNT(*) as total FROM ticket_reservations WHERE status = 'confirmed' AND DATE(reservation_date) = CURDATE()"
        );
        return rows[0].total;
    }

    static async countTodayVisitors() {
        const [rows] = await db.query(
            "SELECT COALESCE(SUM(total_visitors), 0) as total FROM ticket_reservations WHERE DATE(reservation_date) = CURDATE() AND status IN ('confirmed', 'completed')"
        );
        return rows[0].total;
    }

    static async getRecentTickets(limit = 5) {
        const [rows] = await db.query(
            `SELECT tr.*, tr.reservation_reference as booking_reference, tr.visitor_name,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM ticket_reservations tr 
             LEFT JOIN users u ON tr.user_id = u.id 
             ORDER BY tr.created_at DESC
             LIMIT ?`,
            [limit]
        );
        return rows;
    }

    static async expireOldReservations() {
        const [result] = await db.query(
            `UPDATE ticket_reservations SET status = 'no_show' 
             WHERE status IN ('pending', 'confirmed') 
             AND (
                reservation_date < CURDATE()
                OR (status = 'pending' AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY))
             )`
        );
        return result.affectedRows;
    }

    static async countByDateAndTime(date, time) {
        // Count reservations for this date
        const [rows] = await db.query(
            `SELECT COALESCE(SUM(total_visitors), 0) as total 
             FROM ticket_reservations 
             WHERE DATE(reservation_date) = ? 
             AND status IN ('pending', 'confirmed', 'completed')`,
            [date]
        );
        return rows[0].total;
    }

    // Get weekly analytics data (last 7 days)
    static async getWeeklyAnalytics(timeRange = 'week') {
        let dateCondition = 'DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        if (timeRange === 'month') {
            dateCondition = 'DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        } else if (timeRange === 'year') {
            dateCondition = 'DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
        }
        
        const [rows] = await db.query(
            `SELECT 
                DATE(reservation_date) as date,
                DAYNAME(reservation_date) as day,
                COUNT(*) as tickets,
                COALESCE(SUM(total_visitors), 0) as visitors,
                COALESCE(SUM((adult_quantity * 40) + (child_quantity * 20)), 0) as revenue
             FROM ticket_reservations 
             WHERE reservation_date >= ${dateCondition}
             AND status IN ('confirmed', 'completed')
             GROUP BY DATE(reservation_date), DAYNAME(reservation_date)
             ORDER BY date ASC`
        );
        return rows;
    }

    // Get monthly analytics data (variable based on timeRange)
    static async getMonthlyAnalytics(timeRange = 'week') {
        let intervalMonths = 12;
        if (timeRange === 'week') {
            intervalMonths = 3;
        } else if (timeRange === 'month') {
            intervalMonths = 6;
        } else if (timeRange === 'year') {
            intervalMonths = 12;
        }
        
        const [rows] = await db.query(
            `SELECT 
                DATE_FORMAT(reservation_date, '%Y-%m') as month,
                DATE_FORMAT(reservation_date, '%b') as monthName,
                COUNT(*) as tickets,
                COALESCE(SUM(total_visitors), 0) as visitors,
                COALESCE(SUM((adult_quantity * 40) + (child_quantity * 20)), 0) as revenue
             FROM ticket_reservations 
             WHERE reservation_date >= DATE_SUB(CURDATE(), INTERVAL ${intervalMonths} MONTH)
             AND status IN ('confirmed', 'completed')
             GROUP BY DATE_FORMAT(reservation_date, '%Y-%m'), DATE_FORMAT(reservation_date, '%b')
             ORDER BY month ASC`
        );
        return rows;
    }

    // Get ticket type distribution (with optional timeRange filter)
    static async getTicketTypeDistribution(timeRange = 'week') {
        let dateCondition = '';
        if (timeRange === 'week') {
            dateCondition = 'AND reservation_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        } else if (timeRange === 'month') {
            dateCondition = 'AND reservation_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        } else if (timeRange === 'year') {
            dateCondition = 'AND reservation_date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
        }
        
        const [rows] = await db.query(
            `SELECT 
                'adult' as type,
                COALESCE(SUM(adult_quantity), 0) as count,
                COALESCE(SUM(adult_quantity * 40), 0) as revenue
             FROM ticket_reservations 
             WHERE status IN ('confirmed', 'completed') ${dateCondition}
             UNION ALL
             SELECT 
                'child' as type,
                COALESCE(SUM(child_quantity), 0) as count,
                COALESCE(SUM(child_quantity * 20), 0) as revenue
             FROM ticket_reservations 
             WHERE status IN ('confirmed', 'completed') ${dateCondition}
             UNION ALL
             SELECT 
                'resident' as type,
                COALESCE(SUM(bulusan_resident_quantity), 0) as count,
                0 as revenue
             FROM ticket_reservations 
             WHERE status IN ('confirmed', 'completed') ${dateCondition}`
        );
        return rows.filter(r => r.count > 0);
    }

    // Get tickets and revenue for a specific time range
    static async getStatsForTimeRange(timeRange = 'week') {
        let dateCondition = 'DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        if (timeRange === 'month') {
            dateCondition = 'DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        } else if (timeRange === 'year') {
            dateCondition = 'DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
        }
        
        const [rows] = await db.query(
            `SELECT 
                COUNT(*) as totalTickets,
                COALESCE(SUM((adult_quantity * 40) + (child_quantity * 20)), 0) as totalRevenue,
                COALESCE(SUM(total_visitors), 0) as totalVisitors
             FROM ticket_reservations 
             WHERE reservation_date >= ${dateCondition}
             AND status IN ('confirmed', 'completed')`
        );
        return rows[0] || { totalTickets: 0, totalRevenue: 0, totalVisitors: 0 };
    }

    // Get daily stats for comparison
    static async getDailyComparison() {
        const [rows] = await db.query(
            `SELECT 
                (SELECT COUNT(*) FROM ticket_reservations WHERE DATE(created_at) = CURDATE()) as today_tickets,
                (SELECT COUNT(*) FROM ticket_reservations WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) as yesterday_tickets,
                (SELECT COALESCE(SUM((adult_quantity * 40) + (child_quantity * 20)), 0) FROM ticket_reservations WHERE DATE(created_at) = CURDATE() AND status NOT IN ('cancelled', 'no_show')) as today_revenue,
                (SELECT COALESCE(SUM((adult_quantity * 40) + (child_quantity * 20)), 0) FROM ticket_reservations WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND status NOT IN ('cancelled', 'no_show')) as yesterday_revenue`
        );
        return rows[0];
    }

    // Archive reservation
    static async archiveTicket(ticketId) {
        const [result] = await db.query(
            'UPDATE ticket_reservations SET is_archived = TRUE, updated_at = NOW() WHERE id = ?',
            [ticketId]
        );
        return result.affectedRows > 0;
    }

    // Unarchive reservation
    static async unarchiveTicket(ticketId) {
        const [result] = await db.query(
            'UPDATE ticket_reservations SET is_archived = FALSE, updated_at = NOW() WHERE id = ?',
            [ticketId]
        );
        return result.affectedRows > 0;
    }

    // Archive multiple reservations
    static async archiveMultiple(ticketIds) {
        if (!ticketIds || ticketIds.length === 0) return 0;
        const [result] = await db.query(
            'UPDATE ticket_reservations SET is_archived = TRUE, updated_at = NOW() WHERE id IN (?)',
            [ticketIds]
        );
        return result.affectedRows;
    }

    // Get archived reservations by user
    static async getArchivedByUserId(userId) {
        const [rows] = await db.query(
            'SELECT * FROM ticket_reservations WHERE user_id = ? AND is_archived = TRUE ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    }

    // Get active (non-archived) reservations by user
    static async getActiveByUserId(userId) {
        const [rows] = await db.query(
            'SELECT * FROM ticket_reservations WHERE user_id = ? AND (is_archived = FALSE OR is_archived IS NULL) ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    }

    // Mark reservation as confirmed
    static async markAsPaid(ticketId, confirmedBy = null) {
        const [result] = await db.query(
            `UPDATE ticket_reservations SET status = 'confirmed', confirmed_by = ?, confirmed_at = NOW(), updated_at = NOW() WHERE id = ?`,
            [confirmedBy, ticketId]
        );
        return result.affectedRows > 0;
    }

    // Update verification status (for resident reservations)
    static async updateVerificationStatus(ticketId, status) {
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) return false;
        
        const [result] = await db.query(
            'UPDATE ticket_reservations SET verification_status = ?, updated_at = NOW() WHERE id = ?',
            [status, ticketId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Ticket;
