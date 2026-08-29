// cloudinary upload middleware

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { cloudinary, isConfigured, uploadConfig } = require('../config/cloudinary');

// allowed mime types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// max file size 5mb
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// max profile image size 2mb
const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024;

// sanitize filename
const sanitizeFilename = (filename) => {
    // Remove path components
    const basename = path.basename(filename);
    // Remove potentially dangerous characters
    const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
    // Ensure filename doesn't start with a dot or dash
    return sanitized.replace(/^[.-]+/, '');
};

// generate unique public id
const generatePublicId = (prefix, userId = 'unknown') => {
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    return `${prefix}_${userId}_${timestamp}_${randomHash}`;
};

/**
 * Configure multer storage (memory storage for streaming to Cloudinary)
 */
const storage = multer.memoryStorage();

/**
 * File filter for validating MIME types
 */
const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
};

/**
 * Create multer upload instance with specified options
 */
const createUpload = (maxSize = MAX_FILE_SIZE) => {
    return multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: maxSize,
            files: 1
        }
    });
};

/**
 * Upload buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        // Check if Cloudinary is configured
        if (!isConfigured()) {
            return reject(new Error('Cloudinary is not configured. Please set environment variables.'));
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                unique_filename: true,
                overwrite: false,
                ...options
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        // Stream the buffer to Cloudinary
        uploadStream.end(buffer);
    });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId) => {
    if (!isConfigured()) {
        console.warn('Cloudinary not configured, skipping cloud deletion');
        return null;
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        return null;
    }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary secure URL
 * @returns {string|null} Public ID or null if not a Cloudinary URL
 */
const extractPublicId = (url) => {
    if (!url || !url.includes('cloudinary.com')) {
        return null;
    }

    try {
        // Extract the public ID from the URL
        // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.ext
        const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
        return matches ? matches[1] : null;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};

/**
 * Middleware handler for profile image uploads
 */
const handleCloudinaryProfileUpload = (req, res, next) => {
    const upload = createUpload(MAX_PROFILE_IMAGE_SIZE);
    const uploadMiddleware = upload.single('profileImage');

    uploadMiddleware(req, res, async (err) => {
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

        try {
            // Generate unique public ID
            const userId = req.user?.id || 'unknown';
            const publicId = generatePublicId('profile', userId);

            // Upload to Cloudinary
            const result = await uploadToCloudinary(req.file.buffer, {
                ...uploadConfig.profile,
                public_id: publicId
            });

            // Attach Cloudinary result to request
            req.cloudinaryResult = result;
            next();
        } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            return res.status(500).json({
                success: false,
                message: 'Error uploading image to cloud storage.'
            });
        }
    });
};

/**
 * Middleware handler for resident ID image uploads
 */
const handleCloudinaryResidentIdUpload = (req, res, next) => {
    const upload = createUpload(MAX_FILE_SIZE);
    const uploadMiddleware = upload.single('residentIdImage');

    uploadMiddleware(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 5MB.'
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

        if (!req.file) {
            // Resident ID is optional, continue without error
            return next();
        }

        try {
            const userId = req.user?.id || req.body.userId || 'guest';
            const publicId = generatePublicId('resident_id', userId);

            const result = await uploadToCloudinary(req.file.buffer, {
                ...uploadConfig.residentId,
                public_id: publicId
            });

            req.cloudinaryResult = result;
            next();
        } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            return res.status(500).json({
                success: false,
                message: 'Error uploading resident ID image to cloud storage.'
            });
        }
    });
};

/**
 * Generic middleware handler for image uploads (animals, plants, events)
 * @param {string} type - Type of upload (animal, plant, event, general)
 * @param {string} fieldName - Form field name for the image
 */
const handleCloudinaryImageUpload = (type = 'general', fieldName = 'image') => {
    return (req, res, next) => {
        const upload = createUpload(MAX_FILE_SIZE);
        const uploadMiddleware = upload.single(fieldName);

        uploadMiddleware(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File too large. Maximum size is 5MB.'
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

            // Image is optional for create/update operations
            if (!req.file) {
                return next();
            }

            try {
                const config = uploadConfig[type] || uploadConfig.general;
                const userId = req.user?.id || 'system';
                const publicId = generatePublicId(type, userId);

                const result = await uploadToCloudinary(req.file.buffer, {
                    ...config,
                    public_id: publicId
                });

                req.cloudinaryResult = result;
                next();
            } catch (uploadError) {
                console.error('Cloudinary upload error:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading image to cloud storage.'
                });
            }
        });
    };
};

/**
 * Upload base64 image to Cloudinary
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} type - Type of upload (profile, residentId, animal, etc.)
 * @param {string} userId - User ID for naming
 * @returns {Promise<string|null>} Secure URL or null on failure
 */
const uploadBase64ToCloudinary = async (base64Data, type = 'general', userId = 'unknown') => {
    if (!base64Data) return null;
    
    if (!isConfigured()) {
        console.warn('Cloudinary not configured, cannot upload base64 image');
        return null;
    }

    try {
        const config = uploadConfig[type] || uploadConfig.general;
        const publicId = generatePublicId(type, userId);

        // Upload base64 directly to Cloudinary
        const result = await cloudinary.uploader.upload(base64Data, {
            ...config,
            public_id: publicId
        });

        return result.secure_url;
    } catch (error) {
        console.error('Error uploading base64 to Cloudinary:', error);
        return null;
    }
};

module.exports = {
    // Configuration
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE,
    MAX_PROFILE_IMAGE_SIZE,
    
    // Utilities
    sanitizeFilename,
    generatePublicId,
    extractPublicId,
    
    // Cloudinary operations
    uploadToCloudinary,
    deleteFromCloudinary,
    uploadBase64ToCloudinary,
    
    // Middleware handlers
    handleCloudinaryProfileUpload,
    handleCloudinaryResidentIdUpload,
    handleCloudinaryImageUpload
};
