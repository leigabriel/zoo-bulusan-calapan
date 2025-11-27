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
        const { userId, bookingReference, visitorEmail, ticketType, quantity, pricePerTicket, totalAmount, visitDate, status } = ticketData;
        const [result] = await db.query(
            `INSERT INTO tickets (booking_reference, user_id, visitor_email, visit_date, ticket_type, quantity, price_per_ticket, total_amount, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [bookingReference, userId || null, visitorEmail || null, visitDate, ticketType, quantity, pricePerTicket || 0, totalAmount || 0, status || 'pending']
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
}

module.exports = Ticket;
