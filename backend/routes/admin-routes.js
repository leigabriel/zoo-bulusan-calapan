const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin-controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.get('/users/role/:role', adminController.getUsersByRole);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/animals', adminController.getAllAnimals);
router.post('/animals', adminController.createAnimal);
router.put('/animals/:id', adminController.updateAnimal);
router.delete('/animals/:id', adminController.deleteAnimal);
router.get('/events', adminController.getAllEvents);
router.post('/events', adminController.createEvent);
router.put('/events/:id', adminController.updateEvent);
router.delete('/events/:id', adminController.deleteEvent);
router.get('/tickets', adminController.getAllTickets);
router.get('/reports/revenue', adminController.getRevenueReport);

module.exports = router;
