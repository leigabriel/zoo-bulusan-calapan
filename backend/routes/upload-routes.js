// upload routes

const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload-controller');
const { protect, authorize } = require('../middleware/auth');
const { 
    handleCloudinaryImageUpload,
    handleCloudinaryResidentIdUpload 
} = require('../middleware/cloudinary-upload');

// require auth
router.use(protect);

// check storage status
router.get('/status', uploadController.checkStatus);

// generic image upload
router.post(
    '/image',
    authorize('admin', 'staff'),
    handleCloudinaryImageUpload('general', 'image'),
    uploadController.uploadImage
);

// animal image upload
router.post(
    '/animal',
    authorize('admin', 'staff'),
    handleCloudinaryImageUpload('animal', 'image'),
    uploadController.uploadAnimalImage
);

// plant image upload
router.post(
    '/plant',
    authorize('admin', 'staff'),
    handleCloudinaryImageUpload('plant', 'image'),
    uploadController.uploadPlantImage
);

// event image upload
router.post(
    '/event',
    authorize('admin', 'staff'),
    handleCloudinaryImageUpload('event', 'image'),
    uploadController.uploadEventImage
);

// resident id upload
router.post(
    '/resident-id',
    handleCloudinaryResidentIdUpload,
    uploadController.uploadResidentIdImage
);

// Base64 image upload (available to all authenticated users)
router.post('/base64', uploadController.uploadBase64Image);

// Delete image (admin and staff only)
router.delete(
    '/image',
    authorize('admin', 'staff'),
    uploadController.deleteImage
);

module.exports = router;
