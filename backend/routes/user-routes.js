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

// Ticket routes
router.post('/tickets/purchase', userController.purchaseTicket);
router.get('/tickets', userController.getMyTickets);
router.get('/tickets/active', userController.getActiveTickets);
router.get('/tickets/archived', userController.getArchivedTickets);
router.get('/tickets/:id', userController.getTicketById);
router.post('/tickets/:id/archive', userController.archiveTicket);
router.post('/tickets/:id/unarchive', userController.unarchiveTicket);
router.post('/tickets/archive-multiple', userController.archiveMultipleTickets);

// Appeal routes (for suspended users)
router.post('/appeals', userController.submitAppeal);
router.get('/appeals', userController.getMyAppeals);

module.exports = router;