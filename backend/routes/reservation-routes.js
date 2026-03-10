const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservation-controller');
const { protect, authorize } = require('../middleware/auth');
const { handleCloudinaryResidentIdUpload } = require('../middleware/cloudinary-upload');

router.use(protect);

router.get('/ticket/my', reservationController.getUserTicketReservations);
router.get('/event/my', reservationController.getUserEventReservations);
router.post('/ticket', handleCloudinaryResidentIdUpload, reservationController.createTicketReservation);
router.post('/event', reservationController.createEventReservation);
router.put('/ticket/:id/archive', reservationController.archiveTicketReservation);
router.put('/ticket/:id/unarchive', reservationController.unarchiveTicketReservation);
router.put('/event/:id/archive', reservationController.archiveEventReservation);
router.put('/event/:id/unarchive', reservationController.unarchiveEventReservation);

router.use(authorize('admin', 'staff'));

router.get('/', reservationController.getAllReservations);
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
