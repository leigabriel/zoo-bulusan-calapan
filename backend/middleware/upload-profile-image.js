const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Profile images are stored in frontend/public/profile-img/ for direct serving
// This can be migrated to cloud storage (S3, Azure Blob, etc.) by changing the storage configuration
const PROFILE_IMAGE_DIR = path.join(__dirname, '../../frontend/public/profile-img');

// Ensure the upload directory exists
if (!fs.existsSync(PROFILE_IMAGE_DIR)) {
    fs.mkdirSync(PROFILE_IMAGE_DIR, { recursive: true });
}

// Allowed MIME types for profile images
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Maximum file size (2MB for profile images)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/**
 * Generate a secure, unique filename to avoid collisions
 * Format: profile_{userId}_{timestamp}_{randomHash}.{ext}
 */
const generateSecureFilename = (userId, originalName) => {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    return `profile_${userId}_${timestamp}_${randomHash}${ext}`;
};

/**
 * Multer disk storage configuration
 * Can be replaced with cloud storage (multer-s3, etc.) for production
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, PROFILE_IMAGE_DIR);
    },
    filename: (req, file, cb) => {
        // User ID comes from the authenticated request
        const userId = req.user?.id || 'unknown';
        const filename = generateSecureFilename(userId, file.originalname);
        cb(null, filename);
    }
});

/**
 * File filter to validate image types
 */
const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
};

/**
 * Multer upload configuration
 */
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1 // Only allow single file upload
    }
});

/**
 * Middleware handler for profile image upload
 * Handles multer errors and provides user-friendly messages
 */
const handleProfileImageUpload = (req, res, next) => {
    const uploadMiddleware = upload.single('profileImage');

    uploadMiddleware(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 2MB.'
                });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    success: false,
                    message: 'Unexpected field. Use "profileImage" as the field name.'
                });
            }
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        // Check if file was provided
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided.'
            });
        }

        next();
    });
};

/**
 * Delete old profile image file if it exists
 * @param {string} filename - The filename (not full path) of the image to delete
 */
const deleteOldProfileImage = (filename) => {
    if (!filename || filename === 'default-avatar.svg') {
        return;
    }

    const filePath = path.join(PROFILE_IMAGE_DIR, filename);
    
    // Check if the file exists before attempting to delete
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`Deleted old profile image: ${filename}`);
        } catch (error) {
            console.error(`Failed to delete old profile image: ${filename}`, error);
        }
    }
};

/**
 * Get the relative path for storing in database
 * This returns just the filename, as the frontend knows the base path
 * Can be modified to return full URLs for cloud storage
 */
const getProfileImagePath = (filename) => {
    return filename;
};

module.exports = {
    handleProfileImageUpload,
    deleteOldProfileImage,
    getProfileImagePath,
    PROFILE_IMAGE_DIR,
    ALLOWED_TYPES,
    MAX_FILE_SIZE
};
