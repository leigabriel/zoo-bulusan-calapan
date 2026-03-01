const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff-controller');
const adminController = require('../controllers/admin-controller');
const messageController = require('../controllers/message-controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'staff'));

// Dashboard
router.get('/dashboard', staffController.getDashboardStats);
router.get('/recent-tickets', staffController.getRecentTickets);
router.get('/my-activity-summary', staffController.getMyActivitySummary);

// Animals - Full CRUD for staff
router.get('/animals', staffController.getAnimals);
router.get('/animals/:id', staffController.getAnimalById);
router.post('/animals', adminController.createAnimal);
router.put('/animals/:id', adminController.updateAnimal);
router.put('/animals/:id/status', staffController.updateAnimalStatus);
router.delete('/animals/:id', adminController.deleteAnimal);

// Plants - Full CRUD for staff
router.get('/plants', staffController.getPlants);
router.get('/plants/:id', staffController.getPlantById);
router.post('/plants', adminController.createPlant);
router.put('/plants/:id', adminController.updatePlant);
router.delete('/plants/:id', adminController.deletePlant);

// Tickets
router.get('/tickets', staffController.getAllTickets);
router.get('/tickets/active', staffController.getActiveTickets);
router.get('/tickets/today', staffController.getTodayTickets);
router.get('/tickets/:id', staffController.getTicketById);
router.put('/tickets/:id/status', staffController.updateTicketStatus);
router.put('/tickets/:id/mark-paid', staffController.markTicketAsPaid);
router.put('/tickets/:id/verification', staffController.updateVerificationStatus);
router.post('/tickets/validate', staffController.validateTicket);
router.post('/tickets/check', staffController.checkTicket);
router.post('/tickets/mark-used', staffController.markTicketUsed);

// Events - Full CRUD for staff
router.get('/events', staffController.getAllEvents);
router.get('/events/upcoming', staffController.getUpcomingEvents);
router.post('/events', adminController.createEvent);
router.put('/events/:id', adminController.updateEvent);
router.delete('/events/:id', adminController.deleteEvent);



// Appeals management
router.get('/appeals', staffController.getPendingAppeals);
router.put('/appeals/:id/review', staffController.reviewAppeal);

// Notifications
router.get('/notifications', staffController.getNotifications);
router.put('/notifications/:id/read', staffController.markNotificationRead);
router.put('/notifications/read-all', staffController.markAllNotificationsRead);

// Messages
router.get('/messages', messageController.getAllMessages);
router.put('/messages/:id/read', messageController.markAsRead);
router.put('/messages/read-all', messageController.markAllAsRead);
router.put('/messages/:id/respond', messageController.respondToMessage);
router.delete('/messages/:id', messageController.deleteMessage);
router.get('/appeals', messageController.getAppeals);

module.exports = router;