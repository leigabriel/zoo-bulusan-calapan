const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff-controller');
const adminController = require('../controllers/admin-controller');
const messageController = require('../controllers/message-controller');
const monitoringController = require('../controllers/monitoring-controller');
const { protect, authorize } = require('../middleware/auth');
const { trackActivity } = require('../middleware/track-activity');
const multer = require('multer');
const path = require('path');
const { handleCloudinaryImageUpload } = require('../middleware/cloudinary-upload');
const { isConfigured: isCloudinaryConfigured } = require('../config/cloudinary');

// multer for local image uploads
const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsPath = path.join(__dirname, '../uploads');
        cb(null, uploadsPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `image-${uniqueSuffix}${ext}`);
    }
});

const imageUpload = multer({
    storage: imageStorage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, GIF and WebP images are allowed'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

router.use(protect);
router.use(authorize('admin', 'staff'));

// Dashboard
router.get('/dashboard', staffController.getDashboardStats);
router.get('/recent-tickets', staffController.getRecentTickets);
router.get('/my-activity-summary', staffController.getMyActivitySummary);
router.post('/monitoring/heartbeat', monitoringController.heartbeat);

// Animals - Full CRUD for staff
router.get('/animals', staffController.getAnimals);
router.get('/animals/:id', staffController.getAnimalById);
router.post('/animals', trackActivity('animal_update', (req) => 'Created animal record'), adminController.createAnimal);
router.put('/animals/:id', trackActivity('animal_update', (req) => `Updated animal record #${req.params.id}`), adminController.updateAnimal);
router.put('/animals/:id/status', staffController.updateAnimalStatus);
router.delete('/animals/:id', trackActivity('animal_update', (req) => `Deleted animal record #${req.params.id}`), adminController.deleteAnimal);

// Plants - Full CRUD for staff
router.get('/plants', staffController.getPlants);
router.get('/plants/:id', staffController.getPlantById);
router.post('/plants', trackActivity('plant_update', (req) => 'Created plant record'), adminController.createPlant);
router.put('/plants/:id', trackActivity('plant_update', (req) => `Updated plant record #${req.params.id}`), adminController.updatePlant);
router.delete('/plants/:id', trackActivity('plant_update', (req) => `Deleted plant record #${req.params.id}`), adminController.deletePlant);

// Tickets
router.get('/tickets', staffController.getAllTickets);
router.get('/tickets/active', staffController.getActiveTickets);
router.get('/tickets/today', staffController.getTodayTickets);
router.get('/tickets/:id', staffController.getTicketById);
router.put('/tickets/:id/status', staffController.updateTicketStatus);
router.put('/tickets/:id/mark-paid', trackActivity('ticket_update', (req) => 'Marked ticket as paid'), staffController.markTicketAsPaid);
router.put('/tickets/:id/verification', trackActivity('ticket_update', (req) => 'Updated ticket verification'), staffController.updateVerificationStatus);
router.post('/tickets/validate', staffController.validateTicket);
router.post('/tickets/check', staffController.checkTicket);
router.post('/tickets/mark-used', staffController.markTicketUsed);

// Events - Full CRUD for staff
router.get('/events', staffController.getAllEvents);
router.get('/events/upcoming', staffController.getUpcomingEvents);
router.post('/events', trackActivity('event_update', (req) => 'Created event'), adminController.createEvent);
router.put('/events/:id', trackActivity('event_update', (req) => 'Updated event'), adminController.updateEvent);
router.delete('/events/:id', trackActivity('event_update', (req) => 'Deleted event'), adminController.deleteEvent);



// Appeals management
router.get('/appeals', staffController.getPendingAppeals);
router.put('/appeals/:id/review', trackActivity('other', (req) => 'Reviewed appeal'), staffController.reviewAppeal);

// Notifications
router.get('/notifications', staffController.getNotifications);
router.put('/notifications/:id/read', staffController.markNotificationRead);
router.put('/notifications/read-all', staffController.markAllNotificationsRead);

// Messages
router.get('/messages', messageController.getAllMessages);
router.put('/messages/:id/read', messageController.markAsRead);
router.put('/messages/read-all', messageController.markAllAsRead);
router.put('/messages/:id/respond', messageController.respondToMessage);
router.delete('/messages/:id', trackActivity('other', (req) => 'Deleted message'), messageController.deleteMessage);

// dynamic middleware - checks cloudinary at request time
const createDynamicUploadMiddleware = (type, fieldName) => {
    return (req, res, next) => {
        if (isCloudinaryConfigured()) {
            handleCloudinaryImageUpload(type, fieldName)(req, res, next);
        } else {
            imageUpload.single(fieldName)(req, res, next);
        }
    };
};

// image upload routes
router.post('/upload-image', createDynamicUploadMiddleware('general', 'image'), adminController.uploadImage);
router.post('/upload-animal-image', createDynamicUploadMiddleware('animal', 'image'), adminController.uploadImage);
router.post('/upload-plant-image', createDynamicUploadMiddleware('plant', 'image'), adminController.uploadImage);
router.post('/upload-event-image', createDynamicUploadMiddleware('event', 'image'), adminController.uploadImage);

// ==================== TRASH ROUTES ====================

// Users trash (staff can only manage regular users)
router.get('/users-trash', staffController.getTrashUsers);
router.put('/users/:id/restore', staffController.restoreUser);
router.delete('/users/:id', staffController.softDeleteUser);

// Animals trash
router.get('/animals-trash', staffController.getTrashAnimals);
router.put('/animals/:id/restore', staffController.restoreAnimal);

// Plants trash
router.get('/plants-trash', staffController.getTrashPlants);
router.put('/plants/:id/restore', staffController.restorePlant);

// Events trash
router.get('/events-trash', staffController.getTrashEvents);
router.put('/events/:id/restore', staffController.restoreEvent);

module.exports = router;
