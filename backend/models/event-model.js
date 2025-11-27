const db = require('../config/database');

class Event {
    static async getAll() {
        const [rows] = await db.query(
            'SELECT * FROM events ORDER BY event_date ASC'
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
        return rows[0];
    }

    static async getUpcoming() {
        const [rows] = await db.query(
            'SELECT * FROM events WHERE event_date >= CURDATE() ORDER BY event_date ASC'
        );
        return rows;
    }

    static async getPast() {
        const [rows] = await db.query(
            'SELECT * FROM events WHERE event_date < CURDATE() ORDER BY event_date DESC'
        );
        return rows;
    }

    static async create(eventData) {
        const { title, description, eventDate, startTime, endTime, location, imageUrl, status } = eventData;
        const [result] = await db.query(
            `INSERT INTO events (title, description, event_date, start_time, end_time, location, image_url, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, eventDate, startTime, endTime, location, imageUrl || null, status || 'upcoming']
        );
        return result.insertId;
    }

    static async update(id, eventData) {
        const { title, description, eventDate, startTime, endTime, location, imageUrl, status } = eventData;
        const [result] = await db.query(
            `UPDATE events SET title = ?, description = ?, event_date = ?, start_time = ?, 
             end_time = ?, location = ?, image_url = ?, status = ? WHERE id = ?`,
            [title, description, eventDate, startTime, endTime, location, imageUrl, status, id]
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
