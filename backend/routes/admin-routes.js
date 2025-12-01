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

// Model management routes
router.post('/upload-model', modelUpload.fields([
    { name: 'modelJson', maxCount: 1 },
    { name: 'weights', maxCount: 50 }
]), adminController.uploadModel);

router.get('/model-info', adminController.getModelInfo);

module.exports = router;
