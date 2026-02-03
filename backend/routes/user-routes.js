const express = require('express');
const router = express.Router();
const userController = require('../controllers/user-controller');
const { protect } = require('../middleware/auth');

router.get('/animals', userController.getAnimals);
router.get('/animals/:id', userController.getAnimalById);
router.get('/events', userController.getEvents);
router.get('/tickets/availability', userController.getSlotAvailability);

router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/tickets/purchase', userController.purchaseTicket);
router.get('/tickets', userController.getMyTickets);
router.get('/tickets/:id', userController.getTicketById);

module.exports = router;