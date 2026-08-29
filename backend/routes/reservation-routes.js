const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const reservationController = require('../controllers/reservation-controller');
const { protect, authorize } = require('../middleware/auth');
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
router.put('/event/hosted/:id', reservationController.updateUserHostedEvent);
router.post('/event/hosted/:id/image', dynamicEventImageUpload, reservationController.uploadHostedEventImage);
router.get('/availability/ticket', reservationController.getTicketAvailability);
router.get('/availability/event', reservationController.getEventAvailability);
router.post('/ticket', handleCloudinaryResidentIdUpload, reservationController.createTicketReservation);
router.post('/event', reservationController.createEventReservation);
router.put('/ticket/:id/archive', reservationController.archiveTicketReservation);
router.put('/ticket/:id/unarchive', reservationController.unarchiveTicketReservation);
router.put('/event/:id/archive', reservationController.archiveEventReservation);
router.put('/event/:id/unarchive', reservationController.unarchiveEventReservation);

router.use(authorize('admin', 'staff'));

router.get('/', reservationController.getAllReservations);
router.post('/scan', reservationController.scanReservation);
router.get('/stats', reservationController.getReservationStats);
router.get('/today', reservationController.getTodayReservations);
router.get('/upcoming', reservationController.getUpcomingReservations);
router.get('/ticket', reservationController.getAllTicketReservations);
router.get('/event', reservationController.getAllEventReservations);
router.get('/ticket/:id', reservationController.getTicketReservationById);
router.get('/event/:id', reservationController.getEventReservationById);
router.put('/ticket/:id/status', reservationController.updateTicketReservationStatus);
router.put('/event/:id/status', reservationController.updateEventReservationStatus);
router.put('/ticket/:id/verification', reservationController.updateVerificationStatus);
router.delete('/ticket/:id', reservationController.deleteTicketReservation);
router.delete('/event/:id', reservationController.deleteEventReservation);

module.exports = router;
