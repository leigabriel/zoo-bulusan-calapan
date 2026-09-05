const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const reservationController = require('../controllers/reservation-controller');
const { protect, authorize } = require('../middleware/auth');
const { trackActivity } = require('../middleware/track-activity');
const { handleCloudinaryResidentIdUpload, handleCloudinaryImageUpload } = require('../middleware/cloudinary-upload');
const { isConfigured: isCloudinaryConfigured } = require('../config/cloudinary');

// Multer local storage for user event image uploads (used when Cloudinary is not configured)
const eventImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `event-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
    }
});

const eventImageUpload = multer({
    storage: eventImageStorage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Dynamic middleware - uses Cloudinary when configured, otherwise local storage
const dynamicEventImageUpload = (req, res, next) => {
    if (isCloudinaryConfigured()) {
        handleCloudinaryImageUpload('event', 'image')(req, res, next);
    } else {
        eventImageUpload.single('image')(req, res, next);
    }
};

router.use(protect);

router.get('/ticket/my', reservationController.getUserTicketReservations);
router.get('/event/my', reservationController.getUserEventReservations);
router.get('/event/hosted', reservationController.getUserHostedEvents);
router.put('/event/hosted/:id', trackActivity('event_update', (req) => 'Updated hosted event'), reservationController.updateUserHostedEvent);
router.post('/event/hosted/:id/image', dynamicEventImageUpload, trackActivity('event_update', (req) => 'Updated hosted event image'), reservationController.uploadHostedEventImage);
router.get('/availability/ticket', reservationController.getTicketAvailability);
router.get('/availability/event', reservationController.getEventAvailability);
router.post('/ticket', handleCloudinaryResidentIdUpload, reservationController.createTicketReservation);
router.post('/event', reservationController.createEventReservation);
router.put('/ticket/:id/archive', trackActivity('ticket_archive', (req) => 'Archived ticket reservation'), reservationController.archiveTicketReservation);
router.put('/ticket/:id/unarchive', trackActivity('ticket_unarchive', (req) => 'Unarchived ticket reservation'), reservationController.unarchiveTicketReservation);
router.put('/event/:id/archive', trackActivity('event_archive', (req) => 'Archived event reservation'), reservationController.archiveEventReservation);
router.put('/event/:id/unarchive', trackActivity('event_unarchive', (req) => 'Unarchived event reservation'), reservationController.unarchiveEventReservation);

router.use(authorize('admin', 'staff'));

router.get('/', reservationController.getAllReservations);
router.post('/scan', trackActivity('reservation_update', 'Scanned reservation'), reservationController.scanReservation);
router.get('/stats', reservationController.getReservationStats);
router.get('/today', reservationController.getTodayReservations);
router.get('/upcoming', reservationController.getUpcomingReservations);
router.get('/ticket', reservationController.getAllTicketReservations);
router.get('/event', reservationController.getAllEventReservations);
router.get('/ticket/:id', reservationController.getTicketReservationById);
router.get('/event/:id', reservationController.getEventReservationById);
router.put('/ticket/:id/status', reservationController.updateTicketReservationStatus);
router.put('/event/:id/status', reservationController.updateEventReservationStatus);
router.put('/ticket/:id/verification', trackActivity('reservation_update', (req) => 'Updated reservation verification'), reservationController.updateVerificationStatus);
router.delete('/ticket/:id', trackActivity('reservation_update', (req) => 'Deleted ticket reservation'), reservationController.deleteTicketReservation);
router.delete('/event/:id', trackActivity('reservation_update', (req) => 'Deleted event reservation'), reservationController.deleteEventReservation);

module.exports = router;
