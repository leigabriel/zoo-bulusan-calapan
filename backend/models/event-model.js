const db = require('../config/database');

// Helper function to format date to YYYY-MM-DD string in local timezone
const formatDate = (date) => {
    if (!date) return null;
    if (typeof date === 'string') return date.split('T')[0];
    if (date instanceof Date) {
        // Use local timezone instead of UTC to prevent date shifting
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return date;
};

// Helper function to format events for consistent output
const formatEventRow = (row) => {
    if (!row) return null;
    return {
        ...row,
        event_date: formatDate(row.event_date)
    };
};

class Event {
    static async getAll() {
        const [rows] = await db.query(
            'SELECT * FROM events ORDER BY event_date ASC'
        );
        return rows.map(formatEventRow);
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
        return formatEventRow(rows[0]);
    }

    static async getUpcoming() {
        const [rows] = await db.query(
            `SELECT * FROM events 
             WHERE event_date >= CURDATE() 
             AND status IN ('upcoming', 'ongoing')
             ORDER BY event_date ASC`
        );
        return rows.map(formatEventRow);
    }

    static async getPast() {
        const [rows] = await db.query(
            'SELECT * FROM events WHERE event_date < CURDATE() ORDER BY event_date DESC'
        );
        return rows.map(formatEventRow);
    }

    static async create(eventData) {
        const { title, description, eventDate, startTime, endTime, location, imageUrl, status, color } = eventData;
        const [result] = await db.query(
            `INSERT INTO events (title, description, event_date, start_time, end_time, location, image_url, status, color) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, eventDate, startTime, endTime, location, imageUrl || null, status || 'upcoming', color || '#22c55e']
        );
        return result.insertId;
    }

    static async update(id, eventData) {
        const { title, description, eventDate, startTime, endTime, location, imageUrl, status, color } = eventData;
        const [result] = await db.query(
            `UPDATE events SET title = ?, description = ?, event_date = ?, start_time = ?, 
             end_time = ?, location = ?, image_url = ?, status = ?, color = ? WHERE id = ?`,
            [title, description, eventDate, startTime, endTime, location, imageUrl, status, color || '#22c55e', id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM events WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async count() {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM events');
        return rows[0].total;
    }

    static async countUpcoming() {
        const [rows] = await db.query(
            'SELECT COUNT(*) as total FROM events WHERE event_date >= CURDATE()'
        );
        return rows[0].total;
    }
}

module.exports = Event;