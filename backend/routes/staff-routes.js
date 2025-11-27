const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff-controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'staff', 'vet'));

router.get('/dashboard', staffController.getDashboardStats);
router.get('/animals', staffController.getAnimals);
router.get('/animals/:id', staffController.getAnimalById);
router.put('/animals/:id/status', staffController.updateAnimalStatus);
router.post('/tickets/validate', staffController.validateTicket);
router.get('/tickets/active', staffController.getActiveTickets);
router.get('/events', staffController.getUpcomingEvents);

module.exports = router;
