const Reservation = require('../models/reservation-model');
const { readConfig: readTicketPaymentConfig } = require('../config/ticket-payment-config');
const Event = require('../models/event-model');
const User = require('../models/user-model');
const bcrypt = require('bcryptjs');
const { notifyManagement, notifyUser } = require('../services/notification-service');
const { logStaffActivity, logUserActivity } = require('../middleware/track-activity');
const crypto = require('crypto');
const { reservationQrSecret } = require('../config/app-config');
const { validateTicketEdit, validateParticipantEdit } = require('../utils/reservation-edit-rules');
const { validateTicketBooking } = require('../utils/reservation-quantity-rules');
const { validateArchiveSelection, validatePermanentDelete } = require('../utils/reservation-archive-rules');
const { readConfig: readEventPaymentConfig } = require('../config/event-payment-config');
const walkInService = require('../services/walk-in-service');

// Helper function to create notifications for admin/staff
const createAdminStaffNotification = async (title, message, type = 'event', link = null) => {
    await notifyManagement({ title, message, type, link });
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
                location: existing.location || 'Bulusan Zoo',
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
        location: 'Bulusan Zoo',
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

// Reservation status -> catalog type. Used by both the ticket and event status handlers.
const RESERVATION_STATUS_TYPES = {
    confirmed: 'reservation.confirmed',
    cancelled: 'reservation.cancelled',
    completed: 'reservation.completed',
    no_show: 'reservation.no_show'
};

// Notify the reservation owner about a status change, event creation or cancellation.
const notifyReservationUser = async (userId, type, data, link = null) => {
    if (!userId) return;
    try {
        await notifyUser(userId, type, data, link);
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

        // Quantities arrive as formdata strings. They must be whole numbers of zero
        // or more: parseInt would accept '-3', and a negative total both slips past
        // a zero check and understates the capacity projection below.
        const quantityCheck = validateTicketBooking({
            adult: adultQuantity,
            child: childQuantity,
            resident: bulusanResidentQuantity
        });
        if (!quantityCheck.ok) {
            return res.status(400).json({ success: false, message: quantityCheck.error });
        }

        const { adult, child, resident: bulusanResident } = quantityCheck.quantities;
        const totalVisitors = quantityCheck.totalVisitors;

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

        // Respond before notifying admin/staff. That notification emails every active
        // admin and staff member inline, and a slow or failing mail transport
        // used to hold this response open for its whole retry budget (tens of
        // seconds), leaving the visitor stuck on "Processing...". The booking is
        // already saved here, so the reply never depends on the mail provider.
        res.status(201).json({
            success: true,
            message: 'Ticket reservation created successfully',
            reservationId,
            reservationReference,
            qrData
        });

        // Best-effort work after the response. notifyManagement swallows its own
        // failures, and the headersSent guard below stops a late error from
        // trying to write a second response.
        await createAdminStaffNotification(
            'New Ticket Reservation',
            `${visitorName} booked ${totalVisitors} visitor(s) for ${reservationDate} (${reservationReference}). Pending confirmation.`,
            'ticket',
            '/admin/reservations'
        );

        // Log user ticket reservation
        if (userId) {
            await logUserActivity(req, 'ticket_reservation', 'Reserved a ticket', 'reservation', reservationId);
        }
    } catch (error) {
        console.error('Error creating ticket reservation:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Error creating reservation' });
        }
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

        // parseInt would accept '-5', and a negative count both slips past a zero
        // check and understates the capacity projection below.
        const participantCheck = validateParticipantEdit({ participants: numberOfParticipants });
        if (!participantCheck.ok) {
            return res.status(400).json({ success: false, message: participantCheck.error });
        }
        const participants = participantCheck.participants;

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
        const paymentAmount = Number(paymentConfig.amountPerParticipant) > 0
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

        res.status(201).json({
            success: true,
            message: 'Event reservation created successfully',
            reservationId,
            reservationReference,
            qrData,
            paymentAmount,
            paymentStatus: 'unpaid'
        });

        // Notify admin/staff only after replying: see the ticket handler above.
        await createAdminStaffNotification(
            'New Event Reservation',
            `${participantName} reserved ${venueEventName} for ${new Date(venueEventDate).toLocaleDateString()}`,
            'event',
            `/admin/reservations?event=${reservationId}`
        );

        // Log user event reservation
        if (userId) {
            await logUserActivity(req, 'event_reservation', 'Reserved an event', 'reservation', reservationId);
        }
    } catch (error) {
        console.error('Error creating event reservation:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Error creating event reservation' });
        }
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

        const statusType = RESERVATION_STATUS_TYPES[status];
        if (statusType) {
            await notifyReservationUser(
                existingReservation?.user_id,
                statusType,
                {
                    kind: 'ticket',
                    reference: `#${existingReservation?.booking_reference || existingReservation?.reservation_reference || id}`,
                    status,
                    reason: cancelledReason
                },
                '/reservations'
            );
        }

        if (req.user && ['staff', 'admin'].includes(req.user.role)) {
            await logStaffActivity(
                req,
                'reservation_update',
                'Updated ticket reservation status',
                'reservation',
                parseInt(id)
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
        }

        if (['cancelled', 'no_show'].includes(status)) {
            // Remove the reservation-created event from the calendars if applicable.
            await removeReservationOwnedEvent(existingReservation);
        }

        const eventStatusType = RESERVATION_STATUS_TYPES[status];
        if (eventStatusType) {
            await notifyReservationUser(
                existingReservation?.user_id,
                eventStatusType,
                {
                    kind: 'event',
                    reference: `"${existingReservation?.venue_event_name || 'your event'}"`,
                    status,
                    reason: cancelledReason
                },
                '/my-events'
            );
        }

        if (req.user && ['staff', 'admin'].includes(req.user.role)) {
            await logStaffActivity(
                req,
                'reservation_update',
                'Updated event reservation status',
                'reservation',
                parseInt(id)
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

        const existingReservation = await Reservation.findTicketReservationById(id);

        const updated = await Reservation.updateVerificationStatus(id, status);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        // This path was previously silent while the admin/staff equivalents notified,
        // so a visitor could not tell their verification had been decided.
        await notifyReservationUser(
            existingReservation?.user_id,
            'reservation.verification',
            {
                reference: `#${existingReservation?.booking_reference || existingReservation?.reservation_reference || id}`,
                status
            },
            '/reservations'
        );

        res.json({ success: true, message: 'Verification status updated successfully' });
    } catch (error) {
        console.error('Error updating verification status:', error);
        res.status(500).json({ success: false, message: 'Error updating verification status' });
    }
};

exports.deleteTicketReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Reservation.deleteTicketReservation(id, req.user.id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        res.json({ success: true, message: 'Reservation moved to trash' });
    } catch (error) {
        console.error('Error deleting reservation:', error);
        res.status(500).json({ success: false, message: 'Error deleting reservation' });
    }
};

exports.deleteEventReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Reservation.deleteEventReservation(id, req.user.id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        res.json({ success: true, message: 'Reservation moved to trash' });
    } catch (error) {
        console.error('Error deleting event reservation:', error);
        res.status(500).json({ success: false, message: 'Error deleting reservation' });
    }
};

exports.getTrashReservations = async (req, res) => {
    try {
        const [ticketReservations, eventReservations] = await Promise.all([
            Reservation.getDeletedTicketReservations(),
            Reservation.getDeletedEventReservations()
        ]);
        res.json({ success: true, ticketReservations, eventReservations });
    } catch (error) {
        console.error('Error fetching trashed reservations:', error);
        res.status(500).json({ success: false, message: 'Error fetching trashed reservations' });
    }
};

exports.restoreTrashReservations = async (req, res) => {
    try {
        const { type } = req.params;
        const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.params.id].filter(Boolean);
        if (!ids.length || !['ticket', 'event'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid reservation selection' });
        }
        const count = type === 'ticket'
            ? await Reservation.restoreTicketReservations(ids)
            : await Reservation.restoreEventReservations(ids);
        if (!count) return res.status(404).json({ success: false, message: 'Reservation not found in trash' });
        res.json({ success: true, message: `${count} reservation(s) restored` });
    } catch (error) {
        console.error('Error restoring reservations:', error);
        res.status(500).json({ success: false, message: 'Error restoring reservations' });
    }
};

exports.permanentDeleteTrashReservations = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
        const { type } = req.params;
        const { password } = req.body;
        const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.params.id].filter(Boolean);
        if (!ids.length || !['ticket', 'event'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid reservation selection' });
        }
        if (!password) return res.status(400).json({ success: false, message: 'Password required for permanent deletion' });
        const admin = await User.findById(req.user.id);
        if (!admin?.password || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ success: false, message: 'Incorrect password' });
        }
        const count = type === 'ticket'
            ? await Reservation.permanentDeleteTicketReservations(ids)
            : await Reservation.permanentDeleteEventReservations(ids);
        if (!count) return res.status(404).json({ success: false, message: 'Reservation not found in trash' });
        res.json({ success: true, message: `${count} reservation(s) permanently deleted` });
    } catch (error) {
        console.error('Error permanently deleting reservations:', error);
        res.status(500).json({ success: false, message: 'Error permanently deleting reservations' });
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

        const participantCheck = validateParticipantEdit({ participants: numberOfParticipants });
        if (!participantCheck.ok) {
            return res.status(400).json({ success: false, message: participantCheck.error });
        }
        const participants = participantCheck.participants;
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
            const amount = Number(paymentConfig.amountPerParticipant) > 0
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

// --- Visitor self-service -----------------------------------------------------------
// Reachable by the reservation's owner only; the model enforces both `user_id` and
// `status = 'pending'`, so a staff-confirmed booking cannot be edited or cancelled here.

const selfServiceDeny = (res) => res.status(404).json({
    success: false,
    message: 'Reservation not found, or it can no longer be changed.'
});

// A visitor amending or cancelling changes what staff will see at the gate, so both actions
// raise a management notification rather than silently mutating the queue.
const notifyManagementOfSelfService = async ({ action, kind }) => {
    await notifyManagement({
        title: `Reservation ${action} by Visitor`,
        message: `A visitor ${action} their own ${kind} reservation.`,
        type: 'reservation',
        link: '/admin/reservations'
    });
};

exports.cancelTicketReservation = async (req, res) => {
    try {
        const reason = String(req.body?.reason || '').trim().slice(0, 255) || null;
        const ok = await Reservation.cancelTicketReservationByOwner(req.params.id, req.user.id, reason);
        if (!ok) return selfServiceDeny(res);

        await notifyUser(req.user.id, 'reservation.cancelled', { reason }, '/reservations');
        await notifyManagementOfSelfService({ action: 'cancelled', kind: 'ticket' });
        await logUserActivity(req, 'reservation_cancel', 'Cancelled a ticket reservation', 'reservation', req.params.id);

        return res.json({ success: true, message: 'Your reservation has been cancelled.' });
    } catch (error) {
        console.error('Error cancelling ticket reservation:', error);
        return res.status(500).json({ success: false, message: 'Could not cancel your reservation right now.' });
    }
};

exports.cancelEventReservation = async (req, res) => {
    try {
        const reason = String(req.body?.reason || '').trim().slice(0, 255) || null;
        const ok = await Reservation.cancelEventReservationByOwner(req.params.id, req.user.id, reason);
        if (!ok) return selfServiceDeny(res);

        await notifyUser(req.user.id, 'reservation.cancelled', { reason }, '/reservations');
        await notifyManagementOfSelfService({ action: 'cancelled', kind: 'event' });
        await logUserActivity(req, 'reservation_cancel', 'Cancelled an event reservation', 'reservation', req.params.id);

        return res.json({ success: true, message: 'Your reservation has been cancelled.' });
    } catch (error) {
        console.error('Error cancelling event reservation:', error);
        return res.status(500).json({ success: false, message: 'Could not cancel your reservation right now.' });
    }
};

exports.updateMyTicketReservation = async (req, res) => {
    try {
        const validation = validateTicketEdit({
            adult: req.body?.adultQuantity,
            child: req.body?.childQuantity,
            resident: req.body?.residentQuantity
        });
        if (!validation.ok) {
            return res.status(400).json({ success: false, message: validation.error });
        }

        const str = (value, max) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null);
        const email = str(req.body?.visitorEmail, 255);
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
        }

        const ok = await Reservation.updateTicketReservationByOwner(req.params.id, req.user.id, {
            adult: validation.quantities.adult,
            child: validation.quantities.child,
            totalVisitors: validation.totalVisitors,
            visitorName: str(req.body?.visitorName, 255),
            visitorEmail: email,
            visitorPhone: str(req.body?.visitorPhone, 20),
            reservationDate: str(req.body?.reservationDate, 10),
            reservationTime: typeof req.body?.reservationTime === 'string' ? req.body.reservationTime : null,
            notes: str(req.body?.notes, 1000)
        });
        if (!ok) return selfServiceDeny(res);

        await notifyManagementOfSelfService({ action: 'updated', kind: 'ticket' });
        await logUserActivity(req, 'reservation_update', 'Updated a ticket reservation', 'reservation', req.params.id);

        return res.json({
            success: true,
            message: 'Your reservation has been updated.',
            totalVisitors: validation.totalVisitors
        });
    } catch (error) {
        console.error('Error updating ticket reservation:', error);
        return res.status(500).json({ success: false, message: 'Could not update your reservation right now.' });
    }
};

exports.updateMyEventReservation = async (req, res) => {
    try {
        const validation = validateParticipantEdit({ participants: req.body?.numberOfParticipants });
        if (!validation.ok) {
            return res.status(400).json({ success: false, message: validation.error });
        }

        const str = (value, max) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null);
        const email = str(req.body?.participantEmail, 255);
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
        }

        const ok = await Reservation.updateEventReservationByOwner(req.params.id, req.user.id, {
            participants: validation.participants,
            participantName: str(req.body?.participantName, 255),
            participantEmail: email,
            participantPhone: str(req.body?.participantPhone, 20),
            notes: str(req.body?.notes, 1000),
            venueEventName: str(req.body?.venueEventName, 255),
            venueEventDate: str(req.body?.venueEventDate, 10),
            venueEventStartTime: typeof req.body?.venueEventStartTime === 'string' ? req.body.venueEventStartTime : null,
            venueEventEndTime: typeof req.body?.venueEventEndTime === 'string' ? req.body.venueEventEndTime : null,
            venueEventDescription: str(req.body?.venueEventDescription, 2000)
        });
        if (!ok) return selfServiceDeny(res);

        await notifyManagementOfSelfService({ action: 'updated', kind: 'event' });
        await logUserActivity(req, 'reservation_update', 'Updated an event reservation', 'reservation', req.params.id);

        return res.json({ success: true, message: 'Your reservation has been updated.' });
    } catch (error) {
        console.error('Error updating event reservation:', error);
        return res.status(500).json({ success: false, message: 'Could not update your reservation right now.' });
    }
};

// Both bulk endpoints funnel through here. The shape of the received body is logged on a
// rejection because a malformed selection is otherwise indistinguishable from an empty one
// in the server log — a client sending `[null]` and one sending `[]` both land here.
const readSelection = (req, res) => {
    const body = req.body || {};
    const selection = validateArchiveSelection({ type: body.type, ids: body.ids });
    if (!selection.ok) {
        console.warn('[reservations] rejected selection:', JSON.stringify({
            type: body.type,
            typeofIds: Array.isArray(body.ids) ? 'array' : typeof body.ids,
            ids: body.ids
        }));
        res.status(400).json({ success: false, message: selection.error });
        return null;
    }
    return selection;
};

/**
 * Archive a selection of the visitor's own reservations in one call. Archiving is reversible
 * (they can unarchive, or permanently delete from the archive view), so it carries no password
 * gate — that is reserved for the irreversible step.
 */
exports.archiveSelectedReservations = async (req, res) => {
    try {
        const selection = readSelection(req, res);
        if (!selection) return undefined;

        const count = selection.type === 'ticket'
            ? await Reservation.archiveTicketReservationsByIds(req.user.id, selection.ids)
            : await Reservation.archiveEventReservationsByIds(req.user.id, selection.ids);

        // Zero is a legitimate answer: the ids may belong to someone else, already be
        // archived, or already be in the trash. The response deliberately does not
        // distinguish those cases.
        return res.json({
            success: true,
            count,
            message: count
                ? `${count} reservation${count > 1 ? 's' : ''} moved to archive.`
                : 'Those reservations could not be archived.'
        });
    } catch (error) {
        console.error('Error archiving reservations:', error);
        return res.status(500).json({ success: false, message: 'Could not archive those reservations.' });
    }
};

/**
 * Permanently delete a selection of the visitor's own already-archived reservations.
 *
 * Gated on the account password. An account with no password at all (Google sign-in) is
 * told to create one rather than being allowed through, because there is nothing to
 * compare against and a silent bypass would make the guard meaningless.
 */
exports.permanentlyDeleteArchivedReservations = async (req, res) => {
    try {
        const { type, ids, password } = req.body || {};
        const account = await User.findById(req.user.id);
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found.' });
        }

        const check = validatePermanentDelete({
            type,
            ids,
            password,
            hasPassword: Boolean(account.password)
        });

        if (!check.ok) {
            const status = check.reason === 'invalid_selection' ? 400 : 401;
            return res.status(status).json({
                success: false,
                message: check.error,
                reason: check.reason
            });
        }

        // Only hash-compare once the selection is known to be well-formed, so a malformed
        // request cannot be used to probe whether an account has a password.
        const isMatch = await bcrypt.compare(password, account.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'That password is incorrect.',
                reason: 'password_incorrect'
            });
        }

        const count = check.type === 'ticket'
            ? await Reservation.permanentlyDeleteArchivedTicketReservations(req.user.id, check.ids)
            : await Reservation.permanentlyDeleteArchivedEventReservations(req.user.id, check.ids);

        if (!count) {
            return res.status(404).json({
                success: false,
                message: 'Those reservations could not be deleted.'
            });
        }

        return res.json({
            success: true,
            count,
            message: `${count} reservation${count > 1 ? 's' : ''} permanently deleted.`
        });
    } catch (error) {
        console.error('Error permanently deleting reservations:', error);
        return res.status(500).json({ success: false, message: 'Could not delete those reservations.' });
    }
};

/**
 * Bring a selection of the visitor's own archived reservations back into the active list.
 * The inverse of archiveSelectedReservations, and equally reversible.
 */
exports.restoreSelectedReservations = async (req, res) => {
    try {
        const selection = readSelection(req, res);
        if (!selection) return undefined;

        const count = selection.type === 'ticket'
            ? await Reservation.restoreTicketReservationsByIds(req.user.id, selection.ids)
            : await Reservation.restoreEventReservationsByIds(req.user.id, selection.ids);

        return res.json({
            success: true,
            count,
            message: count
                ? `${count} reservation${count > 1 ? 's' : ''} restored.`
                : 'Those reservations could not be restored.'
        });
    } catch (error) {
        console.error('Error restoring reservations:', error);
        return res.status(500).json({ success: false, message: 'Could not restore those reservations.' });
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

/**
 * Face-value amount for a scanned ticket reservation, using the configured
 * prices rather than the old hardcoded 40/20 pair.
 *
 * @param {object} reservation
 * @returns {number}
 */
const ticketAmountFor = (reservation) => {
    const config = readTicketPaymentConfig();
    const priceOf = (quantity, price) => (Number(quantity) || 0) * (Number(price) || 0);
    return Math.round((
        priceOf(reservation.adult_quantity, config.adultPrice) +
        priceOf(reservation.child_quantity, config.childPrice) +
        priceOf(reservation.bulusan_resident_quantity, config.residentPrice)
    ) * 100) / 100;
};

exports.scanReservation = async (req, res) => {
    try {
        const { qrData, markUsed } = req.body;
        let payload = parseQrData(qrData);

        if (!payload && typeof qrData === 'string') {
            const walkInMatch = qrData.match(/^WALKIN\|(OR-[A-Z0-9-]+)$/i);
            if (walkInMatch) payload = { type: 'walk_in', ref: walkInMatch[1] };
            else if (/^OR-[A-Z0-9-]+$/i.test(qrData)) payload = { type: 'walk_in', ref: qrData };
        }

        // New QR codes contain only a short verification URL and reference.
        if (!payload && typeof qrData === 'string' && /^https?:\/\//i.test(qrData)) {
            try {
                const parts = new URL(qrData).pathname.split('/').filter(Boolean);
                const type = parts.at(-2);
                const ref = parts.at(-1) ? decodeURIComponent(parts.at(-1)) : null;
                if (['ticket', 'event', 'walk-in'].includes(type) && ref) payload = { type: type === 'walk-in' ? 'walk_in' : type, ref };
            } catch {
                payload = null;
            }
        }

        if (!payload || !payload.ref || !payload.type) {
            return res.json({ success: true, status: 'fake', message: 'Invalid QR code.' });
        }


        if (payload.type === 'walk_in') {
            let sale = await walkInService.getSale(payload.ref);
            if (!sale) return res.json({ success: true, status: 'fake', message: 'Walk-in receipt not found.' });
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const visitDate = new Date(`${sale.visitDate}T00:00:00`);
            let status = sale.status === 'voided' ? 'expired' : sale.checkedInAt ? 'used' : visitDate < today ? 'expired' : 'valid';
            if (markUsed && status === 'valid') {
                sale = await walkInService.markUsed({
                    saleNumber: sale.saleNumber,
                    staff: req.user,
                    ipAddress: req.ip || null,
                    userAgent: req.get('user-agent') || null
                });
                status = 'used';
            }
            return res.json({
                success: true,
                status,
                reservation: {
                    type: 'walk_in',
                    reference: sale.receiptNumber,
                    saleNumber: sale.saleNumber,
                    name: sale.visitorName || 'Walk-in visitor',
                    phone: sale.visitorPhone,
                    date: sale.visitDate,
                    time: new Date(sale.createdAt).toLocaleTimeString('en-PH'),
                    createdAt: sale.createdAt,
                    totalVisitors: sale.items.reduce((sum, item) => sum + Number(item.quantity), 0),
                    status: sale.status,
                    items: sale.items,
                    subtotalCents: sale.subtotalCents,
                    discountCents: sale.discountCents,
                    totalCents: sale.totalCents,
                    currency: sale.currency,
                    payment: sale.payment,
                    staffName: sale.staffName,
                    checkedInAt: sale.checkedInAt,
                    voidReason: sale.voidReason
                }
            });
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
                ticketAmount: isTicket ? ticketAmountFor(reservation) : null,
                eventName: isTicket ? null : (reservation.venue_event_name || reservation.event_title),
                eventDescription: isTicket ? null : reservation.venue_event_description,
                eventEndTime: isTicket ? null : reservation.venue_event_end_time,
                paymentAmount: reservation.payment_amount,
                paymentMethod: reservation.payment_method,
                paymentStatus: reservation.payment_status,
                // The scanner shows these so staff can see when a booking was
                // settled and reconcile it against the PayMongo dashboard.
                paymentPaidAt: reservation.payment_paid_at || null,
                paymentReference: reservation.paymongo_payment_id || reservation.paymongo_checkout_session_id || null
            }
        });
    } catch (error) {
        console.error('Error scanning reservation:', error);
        res.status(500).json({ success: false, message: 'Error scanning reservation' });
    }
};
