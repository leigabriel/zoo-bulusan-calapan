const Reservation = require('../models/reservation-model');
const Event = require('../models/event-model');
const Notification = require('../models/notification-model');

// Helper function to create notifications for admin/staff
const createAdminStaffNotification = async (title, message, type = 'event', link = null) => {
    try {
        const db = require('../config/database');
        // Get all admin and staff users
        const [adminStaff] = await db.query(
            "SELECT id FROM users WHERE role IN ('admin', 'staff') AND is_active = TRUE"
        );
        
        // Create notification for each admin/staff
        for (const user of adminStaff) {
            await Notification.create({
                userId: user.id,
                title,
                message,
                type,
                link
            });
        }
    } catch (error) {
        console.error('Error creating admin/staff notification:', error);
    }
};

const generateReservationReference = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'RES-';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

exports.getAllTicketReservations = async (req, res) => {
    try {
        const reservations = await Reservation.getAllTicketReservations();
        res.json({ success: true, reservations });
    } catch (error) {
        console.error('Error getting ticket reservations:', error);
        res.status(500).json({ success: false, message: 'Error fetching ticket reservations' });
    }
};

exports.getAllEventReservations = async (req, res) => {
    try {
        const reservations = await Reservation.getAllEventReservations();
        res.json({ success: true, reservations });
    } catch (error) {
        console.error('Error getting event reservations:', error);
        res.status(500).json({ success: false, message: 'Error fetching event reservations' });
    }
};

exports.getAllReservations = async (req, res) => {
    try {
        const [ticketReservations, eventReservations] = await Promise.all([
            Reservation.getAllTicketReservations(),
            Reservation.getAllEventReservations()
        ]);
        res.json({ 
            success: true, 
            ticketReservations,
            eventReservations
        });
    } catch (error) {
        console.error('Error getting all reservations:', error);
        res.status(500).json({ success: false, message: 'Error fetching reservations' });
    }
};

exports.getTicketReservationById = async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await Reservation.findTicketReservationById(id);
        
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }
        
        res.json({ success: true, reservation });
    } catch (error) {
        console.error('Error getting reservation:', error);
        res.status(500).json({ success: false, message: 'Error fetching reservation' });
    }
};

exports.getEventReservationById = async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await Reservation.findEventReservationById(id);
        
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }
        
        res.json({ success: true, reservation });
    } catch (error) {
        console.error('Error getting reservation:', error);
        res.status(500).json({ success: false, message: 'Error fetching reservation' });
    }
};

exports.createTicketReservation = async (req, res) => {
    try {
        const { 
            visitorName, visitorEmail, visitorPhone, reservationDate,
            adultQuantity, childQuantity, bulusanResidentQuantity,
            notes
        } = req.body;

        // get resident id image url from cloudinary upload
        let residentIdImage = null;
        if (req.cloudinaryResult && req.cloudinaryResult.secure_url) {
            residentIdImage = req.cloudinaryResult.secure_url;
        }

        if (!visitorName || !visitorEmail || !reservationDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Visitor name, email, and reservation date are required' 
            });
        }

        // parse quantities from formdata strings
        const adult = parseInt(adultQuantity) || 0;
        const child = parseInt(childQuantity) || 0;
        const bulusanResident = parseInt(bulusanResidentQuantity) || 0;
        const totalVisitors = adult + child + bulusanResident;
        
        if (totalVisitors === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'At least one visitor is required' 
            });
        }

        const reservationReference = generateReservationReference();
        const userId = req.user?.id || null;

        const reservationId = await Reservation.createTicketReservation({
            reservationReference,
            userId,
            visitorName,
            visitorEmail,
            visitorPhone,
            reservationDate,
            adultQuantity: adult,
            childQuantity: child,
            bulusanResidentQuantity: bulusanResident,
            totalVisitors,
            residentIdImage,
            status: 'pending',
            notes
        });

        res.status(201).json({
            success: true,
            message: 'Ticket reservation created successfully',
            reservationId,
            reservationReference
        });
    } catch (error) {
        console.error('Error creating ticket reservation:', error);
        res.status(500).json({ success: false, message: 'Error creating reservation' });
    }
};

exports.createEventReservation = async (req, res) => {
    try {
        const { 
            eventId, participantName, participantEmail, participantPhone,
            numberOfParticipants, participantDetails, notes,
            venueEventName, venueEventDate, venueEventTime, venueEventDescription
        } = req.body;

        if (!participantName || !participantEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'Participant name and email are required' 
            });
        }

        if (!venueEventName || !venueEventDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Event name and date are required for venue booking' 
            });
        }

        const reservationReference = generateReservationReference();
        const userId = req.user?.id || null;

        const reservationId = await Reservation.createEventReservation({
            reservationReference,
            userId,
            eventId: eventId || null,
            participantName,
            participantEmail,
            participantPhone,
            numberOfParticipants: numberOfParticipants || 1,
            participantDetails,
            status: 'pending',
            notes,
            venueEventName,
            venueEventDate,
            venueEventTime,
            venueEventDescription
        });

        // Create notification for admin/staff
        await createAdminStaffNotification(
            'New Event Reservation',
            `${participantName} reserved ${venueEventName} for ${new Date(venueEventDate).toLocaleDateString()}`,
            'event',
            `/admin/reservations?event=${reservationId}`
        );

        res.status(201).json({
            success: true,
            message: 'Event reservation created successfully',
            reservationId,
            reservationReference
        });
    } catch (error) {
        console.error('Error creating event reservation:', error);
        res.status(500).json({ success: false, message: 'Error creating reservation' });
    }
};

exports.updateTicketReservationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancelledReason } = req.body;

        if (!['pending', 'confirmed', 'completed', 'cancelled', 'no_show'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const confirmedBy = status === 'confirmed' ? req.user?.id : null;
        
        const updateData = { status };
        if (cancelledReason) updateData.cancelledReason = cancelledReason;

        const updated = await Reservation.updateTicketReservation(id, updateData);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        if (status === 'confirmed' && confirmedBy) {
            await Reservation.updateTicketReservationStatus(id, status, confirmedBy);
        }

        res.json({ success: true, message: 'Reservation status updated successfully' });
    } catch (error) {
        console.error('Error updating reservation status:', error);
        res.status(500).json({ success: false, message: 'Error updating reservation status' });
    }
};

exports.updateEventReservationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancelledReason } = req.body;

        if (!['pending', 'confirmed', 'completed', 'cancelled', 'no_show'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const confirmedBy = status === 'confirmed' ? req.user?.id : null;
        
        const updateData = { status };
        if (cancelledReason) updateData.cancelledReason = cancelledReason;

        const updated = await Reservation.updateEventReservation(id, updateData);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        if (status === 'confirmed' && confirmedBy) {
            await Reservation.updateEventReservationStatus(id, status, confirmedBy);
        }

        res.json({ success: true, message: 'Reservation status updated successfully' });
    } catch (error) {
        console.error('Error updating reservation status:', error);
        res.status(500).json({ success: false, message: 'Error updating reservation status' });
    }
};

exports.updateVerificationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid verification status' });
        }

        const updated = await Reservation.updateVerificationStatus(id, status);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        res.json({ success: true, message: 'Verification status updated successfully' });
    } catch (error) {
        console.error('Error updating verification status:', error);
        res.status(500).json({ success: false, message: 'Error updating verification status' });
    }
};

exports.deleteTicketReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Reservation.deleteTicketReservation(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        res.json({ success: true, message: 'Reservation deleted successfully' });
    } catch (error) {
        console.error('Error deleting reservation:', error);
        res.status(500).json({ success: false, message: 'Error deleting reservation' });
    }
};

exports.deleteEventReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Reservation.deleteEventReservation(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        res.json({ success: true, message: 'Reservation deleted successfully' });
    } catch (error) {
        console.error('Error deleting reservation:', error);
        res.status(500).json({ success: false, message: 'Error deleting reservation' });
    }
};

exports.getUserTicketReservations = async (req, res) => {
    try {
        const userId = req.user.id;
        const reservations = await Reservation.findTicketReservationsByUserId(userId);
        res.json({ success: true, reservations });
    } catch (error) {
        console.error('Error getting user ticket reservations:', error);
        res.status(500).json({ success: false, message: 'Error fetching reservations' });
    }
};

exports.getUserEventReservations = async (req, res) => {
    try {
        const userId = req.user.id;
        const reservations = await Reservation.findEventReservationsByUserId(userId);
        res.json({ success: true, reservations });
    } catch (error) {
        console.error('Error getting user event reservations:', error);
        res.status(500).json({ success: false, message: 'Error fetching reservations' });
    }
};

exports.getReservationStats = async (req, res) => {
    try {
        const [
            totalTicket, pendingTicket, confirmedTicket,
            totalEvent, pendingEvent, confirmedEvent
        ] = await Promise.all([
            Reservation.countTicketReservations(),
            Reservation.countTicketReservationsByStatus('pending'),
            Reservation.countTicketReservationsByStatus('confirmed'),
            Reservation.countEventReservations(),
            Reservation.countEventReservationsByStatus('pending'),
            Reservation.countEventReservationsByStatus('confirmed')
        ]);

        res.json({
            success: true,
            stats: {
                ticket: {
                    total: totalTicket,
                    pending: pendingTicket,
                    confirmed: confirmedTicket
                },
                event: {
                    total: totalEvent,
                    pending: pendingEvent,
                    confirmed: confirmedEvent
                }
            }
        });
    } catch (error) {
        console.error('Error getting reservation stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching stats' });
    }
};

exports.getTodayReservations = async (req, res) => {
    try {
        const reservations = await Reservation.getTodayTicketReservations();
        res.json({ success: true, reservations });
    } catch (error) {
        console.error('Error getting today reservations:', error);
        res.status(500).json({ success: false, message: 'Error fetching reservations' });
    }
};

exports.getUpcomingReservations = async (req, res) => {
    try {
        const [ticketReservations, eventReservations] = await Promise.all([
            Reservation.getUpcomingTicketReservations(),
            Reservation.getUpcomingEventReservations()
        ]);
        res.json({ 
            success: true, 
            ticketReservations,
            eventReservations
        });
    } catch (error) {
        console.error('Error getting upcoming reservations:', error);
        res.status(500).json({ success: false, message: 'Error fetching reservations' });
    }
};

exports.archiveTicketReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const result = await Reservation.archiveTicketReservation(id, userId);
        if (result) {
            res.json({ success: true, message: 'Reservation archived successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Reservation not found or not authorized' });
        }
    } catch (error) {
        console.error('Error archiving ticket reservation:', error);
        res.status(500).json({ success: false, message: 'Error archiving reservation' });
    }
};

exports.unarchiveTicketReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const result = await Reservation.unarchiveTicketReservation(id, userId);
        if (result) {
            res.json({ success: true, message: 'Reservation restored successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Reservation not found or not authorized' });
        }
    } catch (error) {
        console.error('Error restoring ticket reservation:', error);
        res.status(500).json({ success: false, message: 'Error restoring reservation' });
    }
};

exports.archiveEventReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const result = await Reservation.archiveEventReservation(id, userId);
        if (result) {
            res.json({ success: true, message: 'Reservation archived successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Reservation not found or not authorized' });
        }
    } catch (error) {
        console.error('Error archiving event reservation:', error);
        res.status(500).json({ success: false, message: 'Error archiving reservation' });
    }
};

exports.unarchiveEventReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const result = await Reservation.unarchiveEventReservation(id, userId);
        if (result) {
            res.json({ success: true, message: 'Reservation restored successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Reservation not found or not authorized' });
        }
    } catch (error) {
        console.error('Error restoring event reservation:', error);
        res.status(500).json({ success: false, message: 'Error restoring reservation' });
    }
};
