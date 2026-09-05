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
            'SELECT * FROM events WHERE (is_deleted IS NULL OR is_deleted = FALSE) ORDER BY event_date ASC'
        );
        return rows.map(formatEventRow);
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
        return formatEventRow(rows[0]);
    }

    static async findByReservationId(reservationId) {
        const [rows] = await db.query(
            `SELECT e.* FROM events e
             INNER JOIN event_reservations er ON er.event_id = e.id
             WHERE er.id = ?
             LIMIT 1`,
            [reservationId]
        );
        return formatEventRow(rows[0]);
    }

    static async getUpcoming() {
        const [rows] = await db.query(
            `SELECT * FROM events 
             WHERE event_date >= CURDATE() 
             AND status IN ('upcoming', 'ongoing')
             AND (is_deleted IS NULL OR is_deleted = FALSE)
             ORDER BY event_date ASC`
        );
        return rows.map(formatEventRow);
    }

    static async getPast() {
        const [rows] = await db.query(
            'SELECT * FROM events WHERE event_date < CURDATE() AND (is_deleted IS NULL OR is_deleted = FALSE) ORDER BY event_date DESC'
        );
        return rows.map(formatEventRow);
    }

    static async create(eventData) {
        const { title, description, eventDate, startTime, endTime, location, imageUrl, status, color, createdBy } = eventData;
        const [result] = await db.query(
            `INSERT INTO events (title, description, event_date, start_time, end_time, location, image_url, status, color, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, eventDate, startTime, endTime, location, imageUrl || null, status || 'upcoming', color || '#22c55e', createdBy || null]
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

    static async updateImageUrl(id, imageUrl) {
        const [result] = await db.query(
            'UPDATE events SET image_url = ? WHERE id = ?',
            [imageUrl, id]
        );
        return result.affectedRows > 0;
    }

    static async count() {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM events WHERE (is_deleted IS NULL OR is_deleted = FALSE)');
        return rows[0].total;
    }

    static async countUpcoming() {
        const [rows] = await db.query(
            'SELECT COUNT(*) as total FROM events WHERE event_date >= CURDATE() AND (is_deleted IS NULL OR is_deleted = FALSE)'
        );
        return rows[0].total;
    }

    // Trash methods
    static async softDelete(id, deletedBy) {
        const [result] = await db.query(
            'UPDATE events SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = ? WHERE id = ?',
            [deletedBy, id]
        );
        return result.affectedRows > 0;
    }

    static async softDeleteMultiple(ids, deletedBy) {
        if (!ids || ids.length === 0) return false;
        const [result] = await db.query(
            'UPDATE events SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = ? WHERE id IN (?)',
            [deletedBy, ids]
        );
        return result.affectedRows > 0;
    }

    static async restore(id) {
        const [result] = await db.query(
            'UPDATE events SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async restoreMultiple(ids) {
        if (!ids || ids.length === 0) return false;
        const [result] = await db.query(
            'UPDATE events SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL WHERE id IN (?)',
            [ids]
        );
        return result.affectedRows > 0;
    }

    static async getDeleted() {
        const [rows] = await db.query(
            `SELECT e.*, CONCAT(d.first_name, ' ', d.last_name) as deleted_by_name
             FROM events e
             LEFT JOIN users d ON e.deleted_by = d.id
             WHERE e.is_deleted = TRUE
             ORDER BY e.deleted_at DESC`
        );
        return rows.map(formatEventRow);
    }

    static async permanentDelete(id) {
        const [result] = await db.query('DELETE FROM events WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async permanentDeleteMultiple(ids) {
        if (!ids || ids.length === 0) return false;
        const [result] = await db.query('DELETE FROM events WHERE id IN (?)', [ids]);
        return result.affectedRows > 0;
    }
}

module.exports = Event;
