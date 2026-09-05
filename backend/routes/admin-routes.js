const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin-controller');
const messageController = require('../controllers/message-controller');
const monitoringController = require('../controllers/monitoring-controller');
const logsController = require('../controllers/logs-controller');
const donationController = require('../controllers/donation-controller');
const { readConfig: readEventPaymentConfig, writeConfig: writeEventPaymentConfig } = require('../config/event-payment-config');
const { protect, authorize } = require('../middleware/auth');
const { trackActivity } = require('../middleware/track-activity');
const multer = require('multer');
const path = require('path');
const { handleCloudinaryImageUpload } = require('../middleware/cloudinary-upload');
const { isConfigured: isCloudinaryConfigured } = require('../config/cloudinary');

// multer for model uploads
const modelStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const modelsPath = path.join(__dirname, '../../frontend/public/model/bulusanzoo_machine_learning');
        cb(null, modelsPath);
    },
    filename: function (req, file, cb) {
        // Keep original filename for model files
        cb(null, file.originalname);
    }
});

const modelUpload = multer({
    storage: modelStorage,
    fileFilter: function (req, file, cb) {
        // Accept only .json and .bin files
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.json' || ext === '.bin') {
            cb(null, true);
        } else {
            cb(new Error('Only .json and .bin files are allowed'), false);
        }
    },
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit per file
    }
});

// multer for image uploads
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
router.use(authorize('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/transactions', adminController.getTransactions);
router.get('/users', adminController.getAllUsers);
router.get('/users/role/:role', adminController.getUsersByRole);
router.post('/users', trackActivity('user_update', (req) => 'Created user'), adminController.createUser);
router.put('/users/:id', trackActivity('user_update', (req) => 'Updated user'), adminController.updateUser);
router.delete('/users/:id', trackActivity('user_update', (req) => 'Deleted user'), adminController.deleteUser);
router.get('/animals', adminController.getAllAnimals);
router.post('/animals', trackActivity('animal_update', (req) => 'Created animal'), adminController.createAnimal);
router.put('/animals/:id', trackActivity('animal_update', (req) => 'Updated animal'), adminController.updateAnimal);
router.delete('/animals/:id', trackActivity('animal_update', (req) => 'Deleted animal'), adminController.deleteAnimal);
router.get('/plants', adminController.getAllPlants);
router.post('/plants', trackActivity('plant_update', (req) => 'Created plant'), adminController.createPlant);
router.put('/plants/:id', trackActivity('plant_update', (req) => 'Updated plant'), adminController.updatePlant);
router.delete('/plants/:id', trackActivity('plant_update', (req) => 'Deleted plant'), adminController.deletePlant);
router.get('/events', adminController.getAllEvents);
router.post('/events', trackActivity('event_update', (req) => 'Created event'), adminController.createEvent);
router.put('/events/:id', trackActivity('event_update', (req) => 'Updated event'), adminController.updateEvent);
router.delete('/events/:id', trackActivity('event_update', (req) => 'Deleted event'), adminController.deleteEvent);
router.get('/tickets', adminController.getAllTickets);
router.get('/tickets/export', adminController.exportTickets);
router.get('/tickets/:id', adminController.getTicketById);
router.put('/tickets/:id/status', trackActivity('ticket_update', (req) => 'Updated ticket status'), adminController.updateTicketStatus);
router.put('/tickets/:id/mark-paid', trackActivity('ticket_update', (req) => 'Marked ticket as paid'), adminController.markTicketAsPaid);
router.put('/tickets/:id/verification', trackActivity('ticket_update', (req) => 'Updated ticket verification'), adminController.updateVerificationStatus);
router.get('/reports/revenue', adminController.getRevenueReport);
router.get('/reports/data', adminController.getReportData);
router.get('/reports/quick-stats', adminController.getQuickStats);
router.get('/analytics', adminController.getAnalytics);

// user management
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/suspend', trackActivity('user_update', (req) => 'Suspended user'), adminController.suspendUser);
router.put('/users/:id/unsuspend', trackActivity('user_update', (req) => 'Unsuspended user'), adminController.unsuspendUser);
router.get('/users-suspended', adminController.getSuspendedUsers);

// appeal management
router.get('/appeals', adminController.getPendingAppeals);
router.put('/appeals/:id/review', trackActivity('other', (req) => 'Reviewed appeal'), adminController.reviewAppeal);

// Notification routes
router.get('/notifications', adminController.getNotifications);
router.put('/notifications/:id/read', adminController.markNotificationRead);
router.put('/notifications/read-all', adminController.markAllNotificationsRead);

// Donation settings
router.get('/donation-config', donationController.getConfig);
router.put('/donation-config', trackActivity('other', 'Updated donation settings'), donationController.updateConfig);
router.get('/event-payment-config', (req, res) => {
    res.json({ success: true, config: readEventPaymentConfig() });
});
router.put('/event-payment-config', trackActivity('other', 'Updated event payment settings'), (req, res) => {
    try {
        const updated = writeEventPaymentConfig(req.body.config || {});
        res.json({ success: true, message: 'Event payment settings updated successfully', config: updated });
    } catch (error) {
        console.error('Error updating event payment config:', error);
        res.status(500).json({ success: false, message: 'Unable to update event payment settings.' });
    }
});

// model management
router.post('/upload-model', modelUpload.fields([
    { name: 'modelJson', maxCount: 1 },
    { name: 'weights', maxCount: 50 }
]), trackActivity('other', 'Uploaded a machine-learning model'), adminController.uploadModel);

router.get('/model-info', adminController.getModelInfo);

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

router.get('/messages', messageController.getAllMessages);
router.get('/messages/unread-count', messageController.getUnreadCount);
router.get('/messages/:id', messageController.getMessageById);
router.put('/messages/:id/read', messageController.markAsRead);
router.put('/messages/read-all', messageController.markAllAsRead);
router.post('/messages/:id/respond', messageController.respondToMessage);
router.delete('/messages/:id', trackActivity('other', (req) => 'Deleted message'), messageController.deleteMessage);
// staff monitoring
router.get('/monitoring/dashboard', monitoringController.getMonitoringDashboard);
router.get('/monitoring/sessions', monitoringController.getActiveSessions);
router.get('/monitoring/activities', monitoringController.getRecentActivities);
router.get('/monitoring/staff-stats', monitoringController.getStaffStats);
router.get('/monitoring/staff/:staffId/timeline', monitoringController.getStaffTimeline);
router.post('/monitoring/heartbeat', monitoringController.heartbeat);

// logs
router.get('/logs/staff', logsController.getStaffLogs);
router.get('/logs/users', logsController.getUserLogs);
router.get('/logs/summary', logsController.getLogsSummary);

module.exports = router;
