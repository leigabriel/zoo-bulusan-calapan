const Reservation = require('../models/reservation-model');
const Event = require('../models/event-model');
const Notification = require('../models/notification-model');
const { logStaffActivity } = require('../middleware/track-activity');
const crypto = require('crypto');
const { reservationQrSecret } = require('../config/app-config');
const { readConfig: readEventPaymentConfig } = require('../config/event-payment-config');

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

const TICKET_DAILY_CAPACITY = 100;
const EVENT_SLOT_CAPACITY = 100;

const EVENT_IMAGE_PLACEHOLDER = '/images/event-img-placeholder.jpg';

// Helper to normalize a date value to YYYY-MM-DD
const toDateString = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value.split('T')[0];
    if (value instanceof Date) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return String(value);
};

// Create (or update) an entry in the events table so a confirmed event
// reservation shows up on the user/admin/staff event calendars.
const createOrUpdateLinkedEvent = async (reservation, imageUrl = null) => {
    if (!reservation) return null;

    const title = reservation.venue_event_name || reservation.event_title || 'Venue Event';
    const eventDate = toDateString(reservation.venue_event_date || reservation.event_date);
    const startTime = reservation.venue_event_time || reservation.start_time || null;
    const endTime = reservation.venue_event_end_time || reservation.end_time || null;
    const description = reservation.venue_event_description || null;

    if (reservation.event_id) {
        const existing = await Event.findById(reservation.event_id);
        if (existing) {
            await Event.update(reservation.event_id, {
                title,
                description,
                eventDate,
                startTime,
                endTime,
                location: existing.location || 'Zoo Bulusan',
                imageUrl: imageUrl || existing.image_url || EVENT_IMAGE_PLACEHOLDER,
                status: 'upcoming',
                color: existing.color || '#22c55e'
            });
            return reservation.event_id;
        }
    }

    const newEventId = await Event.create({
        title,
        description,
        eventDate,
        startTime,
        endTime,
        location: 'Zoo Bulusan',
        imageUrl: imageUrl || EVENT_IMAGE_PLACEHOLDER,
        status: 'upcoming',
        color: '#22c55e',
        createdBy: reservation.user_id || null
    });

    await Reservation.updateEventReservationEventId(reservation.id, newEventId);
    return newEventId;
};

// Remove an event from the calendar that was created on behalf of a
// reservation, so cancelled bookings no longer clutter the calendars.
const removeReservationOwnedEvent = async (reservation) => {
    if (!reservation?.event_id) return;
    try {
        const linked = await Event.findById(reservation.event_id);
        if (linked && linked.created_by && reservation.user_id &&
            String(linked.created_by) === String(reservation.user_id)) {
            await Event.delete(reservation.event_id);
        }
    } catch (error) {
        console.error('Error removing linked reservation event:', error);
    }
};

// Notify the reservation owner about confirmation/cancellation.
const notifyReservationUser = async (userId, title, message, link = null) => {
    if (!userId) return;
    try {
        await Notification.create({ userId, title, message, type: 'event', link });
    } catch (error) {
        console.error('Error creating user notification:', error);
    }
};

const TICKET_TIME_SLOTS = [
    { id: '09:00', label: '09:00 AM', start: '09:00', end: '10:30' },
    { id: '11:00', label: '11:00 AM', start: '11:00', end: '12:30' },
    { id: '13:00', label: '01:00 PM', start: '13:00', end: '14:30' },
    { id: '15:00', label: '03:00 PM', start: '15:00', end: '16:30' }
];

const EVENT_TIME_SLOTS = [
    { id: '09:00', label: '09:00 AM', start: '09:00', end: '10:30' },
    { id: '11:00', label: '11:00 AM', start: '11:00', end: '12:30' },
    { id: '13:00', label: '01:00 PM', start: '13:00', end: '14:30' },
    { id: '15:00', label: '03:00 PM', start: '15:00', end: '16:30' }
];

const buildDateRange = (startDate, days) => {
    const start = new Date(startDate);
    const range = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        range.push(d.toISOString().split('T')[0]);
    }
    return range;
};

const signQrPayload = (payloadJson) => {
    return crypto.createHmac('sha256', reservationQrSecret).update(payloadJson).digest('hex');
};

const buildQrData = (payload) => {
    const payloadJson = JSON.stringify(payload);
    const signature = signQrPayload(payloadJson);
    const encoded = Buffer.from(payloadJson).toString('base64');
    return `ZBCZ|${encoded}|${signature}`;
};

const parseQrData = (qrData) => {
    if (!qrData || typeof qrData !== 'string') return null;
    const parts = qrData.split('|');
    if (parts.length !== 3 || parts[0] !== 'ZBCZ') return null;

    const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
    const signature = parts[2];
    const expected = signQrPayload(payloadJson);
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

    try {
        return JSON.parse(payloadJson);
    } catch {
        return null;
    }
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
            reservationTime, adultQuantity, childQuantity, bulusanResidentQuantity,
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

        if (!reservationTime) {
            return res.status(400).json({
                success: false,
                message: 'Please select a visit time.'
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

        const dailyTotals = await Reservation.getTicketTotalsByDate(reservationDate);
        const projectedTotal = (dailyTotals?.total_visitors || 0) + totalVisitors;
        if (projectedTotal > TICKET_DAILY_CAPACITY) {
            return res.status(400).json({
                success: false,
                message: `Daily capacity reached. Only ${Math.max(0, TICKET_DAILY_CAPACITY - (dailyTotals?.total_visitors || 0))} slots remaining for this date.`
            });
        }

        const reservationReference = generateReservationReference();
        const userId = req.user?.id || null;

        const qrData = buildQrData({
            type: 'ticket',
            ref: reservationReference,
            date: reservationDate,
            time: reservationTime,
            name: visitorName,
            email: visitorEmail,
            visitors: totalVisitors,
            createdAt: new Date().toISOString()
        });

        const reservationId = await Reservation.createTicketReservation({
            reservationReference,
            userId,
            visitorName,
            visitorEmail,
            visitorPhone,
            reservationDate,
            reservationTime,
            adultQuantity: adult,
            childQuantity: child,
            bulusanResidentQuantity: bulusanResident,
            totalVisitors,
            residentIdImage,
            status: 'pending',
            notes,
            qrData
        });

        res.status(201).json({
            success: true,
            message: 'Ticket reservation created successfully',
            reservationId,
            reservationReference,
            qrData
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
            venueEventName, venueEventDate, venueEventStartTime, venueEventEndTime, venueEventDescription
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

        if (!venueEventStartTime || !venueEventEndTime) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both event start and end time.'
            });
        }

        const participants = parseInt(numberOfParticipants, 10) || 1;

        const eventTotals = await Reservation.getEventTotalsByDate(venueEventDate);
        const projectedTotal = (eventTotals?.total_participants || 0) + participants;
        if (projectedTotal > EVENT_SLOT_CAPACITY) {
            return res.status(400).json({
                success: false,
                message: `This date only has ${Math.max(0, EVENT_SLOT_CAPACITY - (eventTotals?.total_participants || 0))} spots remaining.`
            });
        }

        const reservationReference = generateReservationReference();
        const userId = req.user?.id || null;
        const paymentConfig = readEventPaymentConfig();
        const paymentAmount = paymentConfig.enabled && Number(paymentConfig.amountPerParticipant) > 0
            ? Math.round(Number(paymentConfig.amountPerParticipant) * 100) / 100
            : 0;

        const qrData = buildQrData({
            type: 'event',
            ref: reservationReference,
            date: venueEventDate,
            time: venueEventStartTime,
            endTime: venueEventEndTime,
            name: participantName,
            email: participantEmail,
            participants,
            eventName: venueEventName,
            createdAt: new Date().toISOString()
        });

        const reservationId = await Reservation.createEventReservation({
            reservationReference,
            userId,
            eventId: eventId || null,
            participantName,
            participantEmail,
            participantPhone,
            numberOfParticipants: participants,
            participantDetails,
            status: 'pending',
            notes,
            venueEventName,
            venueEventDate,
            venueEventStartTime,
            venueEventEndTime,
            venueEventDescription,
            qrData,
            paymentAmount
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
            reservationReference,
            qrData,
            paymentAmount,
            paymentStatus: 'unpaid'
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
        const existingReservation = await Reservation.findTicketReservationById(id);
        
        const updateData = { status };
        if (cancelledReason) updateData.cancelledReason = cancelledReason;

        const updated = await Reservation.updateTicketReservation(id, updateData);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        if (status === 'confirmed' && confirmedBy) {
            await Reservation.updateTicketReservationStatus(id, status, confirmedBy);
        }

        if (req.user && ['staff', 'admin'].includes(req.user.role)) {
            const ref = existingReservation?.reservation_reference || `#${id}`;
            await logStaffActivity(
                req,
                'reservation_update',
                `Updated ticket reservation ${ref} to ${status}`,
                'reservation',
                id
            );
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
        const existingReservation = await Reservation.findEventReservationById(id);
        
        const updateData = { status };
        if (cancelledReason) updateData.cancelledReason = cancelledReason;

        const updated = await Reservation.updateEventReservation(id, updateData);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        if (status === 'confirmed' && confirmedBy) {
            await Reservation.updateEventReservationStatus(id, status, confirmedBy);
        }

        if (status === 'confirmed') {
            // Create/update the linked event so it appears on the event calendars.
            await createOrUpdateLinkedEvent(existingReservation);
            await notifyReservationUser(
                existingReservation?.user_id,
                'Event Reservation Confirmed',
                `Your event "${existingReservation?.venue_event_name || 'reservation'}" has been confirmed and added to the events calendar.`,
                '/my-events'
            );
        }

        if (['cancelled', 'no_show'].includes(status)) {
            // Remove the reservation-created event from the calendars if applicable.
            await removeReservationOwnedEvent(existingReservation);
            if (status === 'cancelled') {
                await notifyReservationUser(
                    existingReservation?.user_id,
                    'Event Reservation Cancelled',
                    `Your event "${existingReservation?.venue_event_name || 'reservation'}" has been cancelled.`,
                    '/my-events'
                );
            }
        }

        if (req.user && ['staff', 'admin'].includes(req.user.role)) {
            const ref = existingReservation?.reservation_reference || `#${id}`;
            await logStaffActivity(
                req,
                'reservation_update',
                `Updated event reservation ${ref} to ${status}`,
                'event',
                id
            );
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
        const existing = await Reservation.findEventReservationById(id);
        const deleted = await Reservation.deleteEventReservation(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        // Clean up the calendar event created from this reservation if applicable.
        await removeReservationOwnedEvent(existing);

        res.json({ success: true, message: 'Reservation deleted successfully' });
    } catch (error) {
        console.error('Error deleting event reservation:', error);
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

exports.getUserHostedEvents = async (req, res) => {
    try {
        const userId = req.user.id;
        const reservations = await Reservation.findHostedEventReservationsByUserId(userId);
        res.json({ success: true, reservations });
    } catch (error) {
        console.error('Error getting user hosted events:', error);
        res.status(500).json({ success: false, message: 'Error fetching hosted events' });
    }
};

exports.updateUserHostedEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const {
            venueEventName, venueEventDate, venueEventStartTime, venueEventEndTime,
            venueEventDescription, numberOfParticipants, notes
        } = req.body;

        if (!venueEventName || !venueEventDate) {
            return res.status(400).json({ success: false, message: 'Event name and date are required' });
        }

        const participants = parseInt(numberOfParticipants, 10) || 1;
        const existingReservation = await Reservation.findEventReservationById(id);
        if (!existingReservation || Number(existingReservation.user_id) !== Number(userId)) {
            return res.status(404).json({ success: false, message: 'Event not found or you are not authorized to edit it' });
        }
        if (existingReservation.payment_status === 'paid' && participants !== Number(existingReservation.number_of_participants)) {
            return res.status(400).json({ success: false, message: 'Paid event reservations cannot change participant count.' });
        }

        const updated = await Reservation.updateHostedEvent(id, userId, {
            venueEventName,
            venueEventDate,
            venueEventStartTime,
            venueEventEndTime,
            venueEventDescription,
            numberOfParticipants: participants,
            notes
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Event not found or you are not authorized to edit it' });
        }

        if (existingReservation.payment_status !== 'paid') {
            const paymentConfig = readEventPaymentConfig();
            const amount = paymentConfig.enabled && Number(paymentConfig.amountPerParticipant) > 0
                ? Math.round(Number(paymentConfig.amountPerParticipant) * 100) / 100
                : 0;
            await Reservation.updateEventPayment(id, { paymentAmount: amount });
        }

        // Keep the calendar event in sync with the edited reservation details.
        const updatedReservation = await Reservation.findEventReservationById(id);
        if (updatedReservation && updatedReservation.status === 'confirmed') {
            await createOrUpdateLinkedEvent(updatedReservation);
        }

        res.json({ success: true, message: 'Event updated successfully' });
    } catch (error) {
        console.error('Error updating hosted event:', error);
        res.status(500).json({ success: false, message: 'Error updating hosted event' });
    }
};

// Upload a photo for a confirmed hosted event, replacing the placeholder image.
exports.uploadHostedEventImage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const reservation = await Reservation.findEventReservationById(id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }
        if (Number(reservation.user_id) !== Number(userId)) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this event' });
        }
        if (reservation.status !== 'confirmed') {
            return res.status(400).json({ success: false, message: 'Only confirmed events can have an image uploaded.' });
        }

        let imageUrl = null;
        if (req.cloudinaryResult && req.cloudinaryResult.secure_url) {
            imageUrl = req.cloudinaryResult.secure_url;
        } else if (req.file && req.file.filename) {
            if (process.env.BACKEND_URL) {
                imageUrl = `${process.env.BACKEND_URL}/uploads/${req.file.filename}`;
            } else {
                const protocol = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
                const host = req.get('host');
                imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
            }
        }

        if (!imageUrl) {
            return res.status(400).json({ success: false, message: 'No image uploaded.' });
        }

        // Ensure the linked calendar event exists (creates one if needed) with the new image.
        await createOrUpdateLinkedEvent(reservation, imageUrl);

        res.json({ success: true, message: 'Event image updated successfully', imageUrl });
    } catch (error) {
        console.error('Error uploading hosted event image:', error);
        res.status(500).json({ success: false, message: 'Error uploading event image' });
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

exports.getTicketAvailability = async (req, res) => {
    try {
        const startDate = req.query.start || new Date().toISOString().split('T')[0];
        const days = Math.min(parseInt(req.query.days, 10) || 30, 60);
        const endDate = buildDateRange(startDate, days).slice(-1)[0];

        const totals = await Reservation.getTicketTotalsByDateRange(startDate, endDate);
        const totalsByDate = new Map();
        const totalsBySlot = new Map();

        totals.forEach((row) => {
            const dateKey = row.reservation_date instanceof Date
                ? row.reservation_date.toISOString().split('T')[0]
                : row.reservation_date;
            const timeKey = row.reservation_time || 'unspecified';
            const total = Number(row.total_visitors || 0);

            totalsByDate.set(dateKey, (totalsByDate.get(dateKey) || 0) + total);
            totalsBySlot.set(`${dateKey}|${timeKey}`, total);
        });

        const dates = buildDateRange(startDate, days).map((date) => {
            const dailyTotal = totalsByDate.get(date) || 0;
            const dailyRemaining = Math.max(0, TICKET_DAILY_CAPACITY - dailyTotal);
            const slots = TICKET_TIME_SLOTS.map((slot) => {
                const slotTotal = totalsBySlot.get(`${date}|${slot.id}`) || 0;
                const remaining = Math.max(0, Math.min(TICKET_DAILY_CAPACITY - slotTotal, dailyRemaining));
                return {
                    time: slot.id,
                    label: slot.label,
                    totalVisitors: slotTotal,
                    remaining,
                    isFull: remaining <= 0 || dailyRemaining <= 0
                };
            });

            return {
                date,
                totalVisitors: dailyTotal,
                remaining: dailyRemaining,
                isFull: dailyRemaining <= 0,
                slots
            };
        });

        res.json({
            success: true,
            schedule: { dailyCapacity: TICKET_DAILY_CAPACITY },
            timeSlots: TICKET_TIME_SLOTS,
            dates
        });
    } catch (error) {
        console.error('Error getting ticket availability:', error);
        res.status(500).json({ success: false, message: 'Error fetching availability' });
    }
};

exports.getEventAvailability = async (req, res) => {
    try {
        const startDate = req.query.start || new Date().toISOString().split('T')[0];
        const days = Math.min(parseInt(req.query.days, 10) || 30, 60);
        const endDate = buildDateRange(startDate, days).slice(-1)[0];

        const totals = await Reservation.getEventTotalsByDateRange(startDate, endDate);
        const totalsBySlot = new Map();

        totals.forEach((row) => {
            const dateKey = row.venue_event_date instanceof Date
                ? row.venue_event_date.toISOString().split('T')[0]
                : row.venue_event_date;
            const timeKey = row.venue_event_time || 'unspecified';
            const total = Number(row.total_participants || 0);
            totalsBySlot.set(`${dateKey}|${timeKey}`, total);
        });

        const dates = buildDateRange(startDate, days).map((date) => {
            const slots = EVENT_TIME_SLOTS.map((slot) => {
                const slotTotal = totalsBySlot.get(`${date}|${slot.id}`) || 0;
                const remaining = Math.max(0, EVENT_SLOT_CAPACITY - slotTotal);
                return {
                    time: slot.id,
                    label: slot.label,
                    totalParticipants: slotTotal,
                    remaining,
                    isFull: remaining <= 0
                };
            });

            return {
                date,
                isFull: slots.every((slot) => slot.isFull),
                slots
            };
        });

        res.json({
            success: true,
            schedule: { slotCapacity: EVENT_SLOT_CAPACITY },
            timeSlots: EVENT_TIME_SLOTS,
            dates
        });
    } catch (error) {
        console.error('Error getting event availability:', error);
        res.status(500).json({ success: false, message: 'Error fetching availability' });
    }
};

exports.scanReservation = async (req, res) => {
    try {
        const { qrData, markUsed } = req.body;
        let payload = parseQrData(qrData);

        // New QR codes contain only a short verification URL and reference.
        if (!payload && typeof qrData === 'string' && /^https?:\/\//i.test(qrData)) {
            try {
                const parts = new URL(qrData).pathname.split('/').filter(Boolean);
                const type = parts.at(-2);
                const ref = parts.at(-1) ? decodeURIComponent(parts.at(-1)) : null;
                if (['ticket', 'event'].includes(type) && ref) payload = { type, ref };
            } catch {
                payload = null;
            }
        }

        if (!payload || !payload.ref || !payload.type) {
            return res.json({ success: true, status: 'fake', message: 'Invalid QR code.' });
        }

        const isTicket = payload.type === 'ticket';
        const reservation = isTicket
            ? await Reservation.findTicketReservationByReference(payload.ref)
            : await Reservation.findEventReservationByReference(payload.ref);

        if (!reservation) {
            return res.json({ success: true, status: 'fake', message: 'Reservation not found.' });
        }

        const reservationDate = isTicket
            ? reservation.reservation_date
            : reservation.venue_event_date || reservation.event_date;
        const reservationTime = isTicket
            ? reservation.reservation_time
            : reservation.venue_event_time;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const resDate = reservationDate ? new Date(reservationDate) : null;
        const isExpired = resDate ? resDate < today : false;
        const isUsed = Boolean(reservation.checked_in_at) || reservation.status === 'completed';

        let status = 'valid';
        if (isUsed) status = 'used';
        else if (isExpired) status = 'expired';

        if (markUsed && status === 'valid') {
            if (isTicket) {
                await Reservation.markTicketReservationUsed(payload.ref, req.user?.id || null);
            } else {
                await Reservation.markEventReservationUsed(payload.ref, req.user?.id || null);
            }
            status = 'used';
        }

        res.json({
            success: true,
            status,
            reservation: {
                type: payload.type,
                reference: reservation.reservation_reference,
                name: isTicket ? reservation.visitor_name : reservation.participant_name,
                email: isTicket ? reservation.visitor_email : reservation.participant_email,
                date: reservationDate,
                time: reservationTime,
                totalVisitors: isTicket ? reservation.total_visitors : reservation.number_of_participants,
                status: reservation.status,
                phone: isTicket ? reservation.visitor_phone : reservation.participant_phone,
                adultQuantity: isTicket ? reservation.adult_quantity : null,
                childQuantity: isTicket ? reservation.child_quantity : null,
                residentQuantity: isTicket ? reservation.bulusan_resident_quantity : null,
                ticketAmount: isTicket ? ((reservation.adult_quantity * 40) + (reservation.child_quantity * 20)) : null,
                eventName: isTicket ? null : (reservation.venue_event_name || reservation.event_title),
                eventDescription: isTicket ? null : reservation.venue_event_description,
                eventEndTime: isTicket ? null : reservation.venue_event_end_time,
                paymentAmount: isTicket ? null : reservation.payment_amount,
                paymentMethod: isTicket ? null : reservation.payment_method,
                paymentStatus: isTicket ? null : reservation.payment_status
            }
        });
    } catch (error) {
        console.error('Error scanning reservation:', error);
        res.status(500).json({ success: false, message: 'Error scanning reservation' });
    }
};