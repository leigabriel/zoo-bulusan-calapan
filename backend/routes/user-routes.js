const express = require('express');
const router = express.Router();
const userController = require('../controllers/user-controller');
const { protect } = require('../middleware/auth');
const { trackActivity } = require('../middleware/track-activity');

router.get('/animals', userController.getAnimals);
router.get('/animals/:id', userController.getAnimalById);
router.get('/events', userController.getEvents);
router.get('/tickets/availability', userController.getSlotAvailability);

router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', trackActivity('profile_update', 'Updated profile'), userController.updateProfile);
router.get('/settings', userController.getSettings);
router.put('/settings', trackActivity('settings_update', 'Updated account settings'), userController.updateSettings);
router.get('/activities', userController.getActivities);
router.get('/notifications', userController.getNotifications);
router.put('/notifications/:id/read', userController.markNotificationRead);
router.put('/notifications/read-all', userController.markAllNotificationsRead);
router.delete('/notifications', userController.clearNotifications);

// Ticket routes
// NOTE: POST /tickets/purchase was removed. It was a duplicate of
// POST /api/reservations/ticket and required an uploaded resident/student ID
// image. Resident admission is now verified on site against a physical ID, so
// the live booking flow is reservationController.createTicketReservation.
router.get('/tickets', userController.getMyTickets);
router.get('/tickets/active', userController.getActiveTickets);
router.get('/tickets/archived', userController.getArchivedTickets);
router.get('/tickets/:id', userController.getTicketById);
router.post('/tickets/:id/archive', trackActivity('ticket_archive', (req) => 'Archived ticket'), userController.archiveTicket);
router.post('/tickets/:id/unarchive', trackActivity('ticket_unarchive', (req) => 'Unarchived ticket'), userController.unarchiveTicket);
router.post('/tickets/archive-multiple', trackActivity('ticket_archive', 'Archived multiple tickets'), userController.archiveMultipleTickets);

// appeal routes
router.post('/appeals', trackActivity('appeal_submit', 'Submitted an account appeal'), userController.submitAppeal);
router.get('/appeals', userController.getMyAppeals);

module.exports = router;
