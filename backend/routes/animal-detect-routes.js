/**
 * Animal Detection Proxy Routes
 * 
 * Backend proxy for AnimalDetect API to avoid CORS issues.
 * Routes image detection requests through the server where the API key is stored securely.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const animalDetectController = require('../controllers/animal-detect-controller');

// Configure multer for image uploads (memory storage for direct API forwarding)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
        }
    }
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large',
                errorType: 'IMAGE_TOO_LARGE',
                message: 'Image must be under 10MB'
            });
        }
        return res.status(400).json({
            success: false,
            error: 'Upload error',
            errorType: 'UPLOAD_ERROR',
            message: err.message
        });
    }
    if (err) {
        return res.status(400).json({
            success: false,
            error: 'Invalid image',
            errorType: 'INVALID_IMAGE',
            message: err.message
        });
    }
    next();
};

/**
 * POST /api/animal-detect
 * Main detection endpoint - accepts multipart/form-data with 'image' field
 * or JSON with base64 encoded 'image' field
 */
router.post('/', 
    upload.single('image'), 
    handleMulterError,
    animalDetectController.detectAnimal
);

/**
 * GET /api/animal-detect/health
 * Health check endpoint
 */
router.get('/health', animalDetectController.healthCheck);

/**
 * GET /api/animal-detect/config
 * Get non-sensitive configuration info
 */
router.get('/config', animalDetectController.getConfig);

module.exports = router;
