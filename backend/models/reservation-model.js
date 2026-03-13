const db = require('../config/database');

class Reservation {
    static async getAllTicketReservations() {
        const [rows] = await db.query(
            `SELECT tr.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM ticket_reservations tr 
             LEFT JOIN users u ON tr.user_id = u.id 
             ORDER BY tr.created_at DESC`
        );
        return rows;
    }

    static async getAllEventReservations() {
        const [rows] = await db.query(
            `SELECT er.*, e.title as event_title, e.event_date, e.start_time, e.end_time, e.location as event_location,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM event_reservations er 
             LEFT JOIN users u ON er.user_id = u.id 
             LEFT JOIN events e ON er.event_id = e.id
             ORDER BY er.created_at DESC`
        );
        return rows;
    }

    static async findTicketReservationById(id) {
        const [rows] = await db.query(
            `SELECT tr.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM ticket_reservations tr 
             LEFT JOIN users u ON tr.user_id = u.id 
             WHERE tr.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async findEventReservationById(id) {
        const [rows] = await db.query(
            `SELECT er.*, e.title as event_title, e.event_date, e.start_time, e.end_time, e.location as event_location,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM event_reservations er 
             LEFT JOIN users u ON er.user_id = u.id 
             LEFT JOIN events e ON er.event_id = e.id
             WHERE er.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async findTicketReservationByReference(reference) {
        const [rows] = await db.query(
            `SELECT tr.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM ticket_reservations tr 
             LEFT JOIN users u ON tr.user_id = u.id 
             WHERE tr.reservation_reference = ?`,
            [reference]
        );
        return rows[0];
    }

    static async findEventReservationByReference(reference) {
        const [rows] = await db.query(
            `SELECT er.*, e.title as event_title, e.event_date, e.start_time, e.end_time, e.location as event_location,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM event_reservations er 
             LEFT JOIN users u ON er.user_id = u.id 
             LEFT JOIN events e ON er.event_id = e.id
             WHERE er.reservation_reference = ?`,
            [reference]
        );
        return rows[0];
    }

    static async findTicketReservationsByUserId(userId) {
        const [rows] = await db.query(
            `SELECT * FROM ticket_reservations 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [userId]
        );
        return rows;
    }

    static async findEventReservationsByUserId(userId) {
        const [rows] = await db.query(
            `SELECT er.*, e.title as event_title, e.event_date, e.start_time, e.end_time, e.location as event_location
             FROM event_reservations er 
             LEFT JOIN events e ON er.event_id = e.id
             WHERE er.user_id = ? 
             ORDER BY er.created_at DESC`,
            [userId]
        );
        return rows;
    }

    static async createTicketReservation(data) {
        const { 
            reservationReference, userId, visitorName, visitorEmail, visitorPhone,
            reservationDate, adultQuantity, childQuantity, bulusanResidentQuantity,
            totalVisitors, residentIdImage, status, notes
        } = data;
        
        const [result] = await db.query(
            `INSERT INTO ticket_reservations (
                reservation_reference, user_id, visitor_name, visitor_email, visitor_phone,
                reservation_date, adult_quantity, child_quantity, bulusan_resident_quantity,
                total_visitors, resident_id_image, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reservationReference, userId || null, visitorName, visitorEmail,
                visitorPhone || null, reservationDate, adultQuantity || 0,
                childQuantity || 0, bulusanResidentQuantity || 0, totalVisitors || 0,
                residentIdImage || null, status || 'pending', notes || null
            ]
        );
        return result.insertId;
    }

    static async createEventReservation(data) {
        const { 
            reservationReference, userId, eventId, participantName, participantEmail,
            participantPhone, numberOfParticipants, participantDetails, status, notes,
            venueEventName, venueEventDate, venueEventTime, venueEventDescription
        } = data;
        
        const [result] = await db.query(
            `INSERT INTO event_reservations (
                reservation_reference, user_id, event_id, participant_name, participant_email,
                participant_phone, number_of_participants, participant_details, status, notes,
                venue_event_name, venue_event_date, venue_event_time, venue_event_description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reservationReference, userId || null, eventId || null, participantName, participantEmail,
                participantPhone || null, numberOfParticipants || 1, participantDetails || null,
                status || 'pending', notes || null,
                venueEventName || null, venueEventDate || null, venueEventTime || null, venueEventDescription || null
            ]
        );
        return result.insertId;
    }

    static async updateTicketReservationStatus(id, status, confirmedBy = null) {
        let query = 'UPDATE ticket_reservations SET status = ?';
        const params = [status];
        
        if (status === 'confirmed' && confirmedBy) {
            query += ', confirmed_at = NOW(), confirmed_by = ?';
            params.push(confirmedBy);
        }
        if (status === 'cancelled') {
            query += ', cancelled_at = NOW()';
        }
        
        query += ' WHERE id = ?';
        params.push(id);
        
        const [result] = await db.query(query, params);
        return result.affectedRows > 0;
    }

    static async updateEventReservationStatus(id, status, confirmedBy = null) {
        let query = 'UPDATE event_reservations SET status = ?';
        const params = [status];
        
        if (status === 'confirmed' && confirmedBy) {
            query += ', confirmed_at = NOW(), confirmed_by = ?';
            params.push(confirmedBy);
        }
        if (status === 'cancelled') {
            query += ', cancelled_at = NOW()';
        }
        
        query += ' WHERE id = ?';
        params.push(id);
        
        const [result] = await db.query(query, params);
        return result.affectedRows > 0;
    }

    static async updateTicketReservation(id, data) {
        const { status, notes, verificationStatus, cancelledReason } = data;
        let updates = [];
        let params = [];

        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);
            if (status === 'cancelled') {
                updates.push('cancelled_at = NOW()');
            }
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            params.push(notes);
        }
        if (verificationStatus !== undefined) {
            updates.push('verification_status = ?');
            params.push(verificationStatus);
        }
        if (cancelledReason !== undefined) {
            updates.push('cancelled_reason = ?');
            params.push(cancelledReason);
        }

        if (updates.length === 0) return false;

        params.push(id);
        const [result] = await db.query(
            `UPDATE ticket_reservations SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
        return result.affectedRows > 0;
    }

    static async updateEventReservation(id, data) {
        const { status, notes, cancelledReason, numberOfParticipants, participantDetails } = data;
        let updates = [];
        let params = [];

        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);
            if (status === 'cancelled') {
                updates.push('cancelled_at = NOW()');
            }
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            params.push(notes);
        }
        if (cancelledReason !== undefined) {
            updates.push('cancelled_reason = ?');
            params.push(cancelledReason);
        }
        if (numberOfParticipants !== undefined) {
            updates.push('number_of_participants = ?');
            params.push(numberOfParticipants);
        }
        if (participantDetails !== undefined) {
            updates.push('participant_details = ?');
            params.push(participantDetails);
        }

        if (updates.length === 0) return false;

        params.push(id);
        const [result] = await db.query(
            `UPDATE event_reservations SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
        return result.affectedRows > 0;
    }

    static async deleteTicketReservation(id) {
        const [result] = await db.query('DELETE FROM ticket_reservations WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async deleteEventReservation(id) {
        const [result] = await db.query('DELETE FROM event_reservations WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async countTicketReservations() {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM ticket_reservations');
        return rows[0].total;
    }

    static async countEventReservations() {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM event_reservations');
        return rows[0].total;
    }

    static async countTicketReservationsByStatus(status) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as total FROM ticket_reservations WHERE status = ?',
            [status]
        );
        return rows[0].total;
    }

    static async countEventReservationsByStatus(status) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as total FROM event_reservations WHERE status = ?',
            [status]
        );
        return rows[0].total;
    }

    static async getTodayTicketReservations() {
        const [rows] = await db.query(
            `SELECT tr.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM ticket_reservations tr 
             LEFT JOIN users u ON tr.user_id = u.id 
             WHERE DATE(tr.reservation_date) = CURDATE()
             ORDER BY tr.created_at DESC`
        );
        return rows;
    }

    static async getUpcomingTicketReservations() {
        const [rows] = await db.query(
            `SELECT tr.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM ticket_reservations tr 
             LEFT JOIN users u ON tr.user_id = u.id 
             WHERE tr.reservation_date >= CURDATE() AND tr.status IN ('pending', 'confirmed')
             ORDER BY tr.reservation_date ASC`
        );
        return rows;
    }

    static async getUpcomingEventReservations() {
        const [rows] = await db.query(
            `SELECT er.*, e.title as event_title, e.event_date, e.start_time, e.end_time, e.location as event_location,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
             FROM event_reservations er 
             LEFT JOIN users u ON er.user_id = u.id 
             LEFT JOIN events e ON er.event_id = e.id
             WHERE e.event_date >= CURDATE() AND er.status IN ('pending', 'confirmed')
             ORDER BY e.event_date ASC`
        );
        return rows;
    }

    static async updateVerificationStatus(id, status) {
        const [result] = await db.query(
            'UPDATE ticket_reservations SET verification_status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async getByDateRange(startDate, endDate, type = 'ticket') {
        if (type === 'ticket') {
            const [rows] = await db.query(
                `SELECT tr.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
                 FROM ticket_reservations tr 
                 LEFT JOIN users u ON tr.user_id = u.id 
                 WHERE tr.reservation_date BETWEEN ? AND ?
                 ORDER BY tr.reservation_date ASC`,
                [startDate, endDate]
            );
            return rows;
        } else {
            const [rows] = await db.query(
                `SELECT er.*, e.title as event_title, e.event_date, e.start_time, e.end_time, e.location as event_location,
                        CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
                 FROM event_reservations er 
                 LEFT JOIN users u ON er.user_id = u.id 
                 LEFT JOIN events e ON er.event_id = e.id
                 WHERE e.event_date BETWEEN ? AND ?
                 ORDER BY e.event_date ASC`,
                [startDate, endDate]
            );
            return rows;
        }
    }

    static async archiveTicketReservation(id, userId) {
        const [result] = await db.query(
            'UPDATE ticket_reservations SET is_archived = TRUE, updated_at = NOW() WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async unarchiveTicketReservation(id, userId) {
        const [result] = await db.query(
            'UPDATE ticket_reservations SET is_archived = FALSE, updated_at = NOW() WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async archiveEventReservation(id, userId) {
        const [result] = await db.query(
            'UPDATE event_reservations SET is_archived = TRUE, updated_at = NOW() WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async unarchiveEventReservation(id, userId) {
        const [result] = await db.query(
            'UPDATE event_reservations SET is_archived = FALSE, updated_at = NOW() WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Reservation;