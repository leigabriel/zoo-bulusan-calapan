const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin-controller');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for model uploads
const modelStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Upload to frontend public/models directory
        const modelsPath = path.join(__dirname, '../../frontend/public/models');
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

// Configure multer for general image uploads (animals, events)
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
router.get('/tickets/:id', adminController.getTicketById);
router.put('/tickets/:id/status', adminController.updateTicketStatus);
router.get('/reports/revenue', adminController.getRevenueReport);

// Notification routes
router.get('/notifications', adminController.getNotifications);
router.put('/notifications/:id/read', adminController.markNotificationRead);
router.put('/notifications/read-all', adminController.markAllNotificationsRead);

// Model management routes
router.post('/upload-model', modelUpload.fields([
    { name: 'modelJson', maxCount: 1 },
    { name: 'weights', maxCount: 50 }
]), adminController.uploadModel);

router.get('/model-info', adminController.getModelInfo);

// Image upload route for animals and events
router.post('/upload-image', imageUpload.single('image'), adminController.uploadImage);

module.exports = router;