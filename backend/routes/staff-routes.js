const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff-controller');
const adminController = require('../controllers/admin-controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'staff', 'vet'));

// Dashboard
router.get('/dashboard', staffController.getDashboardStats);
router.get('/recent-tickets', staffController.getRecentTickets);

// Animals - Full CRUD for staff
router.get('/animals', staffController.getAnimals);
router.get('/animals/:id', staffController.getAnimalById);
router.post('/animals', adminController.createAnimal);
router.put('/animals/:id', adminController.updateAnimal);
router.put('/animals/:id/status', staffController.updateAnimalStatus);
router.delete('/animals/:id', adminController.deleteAnimal);

// Tickets
router.get('/tickets', staffController.getAllTickets);
router.get('/tickets/active', staffController.getActiveTickets);
router.get('/tickets/today', staffController.getTodayTickets);
router.get('/tickets/:id', staffController.getTicketById);
router.put('/tickets/:id/status', staffController.updateTicketStatus);
router.post('/tickets/validate', staffController.validateTicket);

// Events - Full CRUD for staff
router.get('/events', staffController.getAllEvents);
router.get('/events/upcoming', staffController.getUpcomingEvents);
router.post('/events', adminController.createEvent);
router.put('/events/:id', adminController.updateEvent);
router.delete('/events/:id', adminController.deleteEvent);

// Users - Full CRUD for staff (limited to user role management)
router.get('/users', staffController.getAllUsers);
router.get('/users/:id', staffController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
