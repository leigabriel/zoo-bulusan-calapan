// cloudinary upload middleware

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { cloudinary, isConfigured, uploadConfig } = require('../config/cloudinary');

// allowed mime types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Video formats every current browser can play without a plugin. MOV is included
// because phones commonly record in it; Cloudinary transcodes it on delivery.
const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];

// max file size 5mb
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// max community video size 80mb
const MAX_VIDEO_FILE_SIZE = 80 * 1024 * 1024;

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
 * Memory storage with a per-field size ceiling.
 *
 * Multer's own `limits.fileSize` applies to every file in the request, so a single 80MB
 * video ceiling would also let five 80MB photos buffer before the handler could reject
 * them. This engine enforces the right limit while the upload is still streaming, so an
 * oversized photo stops collecting chunks at 5MB instead of reaching 80MB.
 */
const createPerFieldMemoryStorage = (fieldLimits) => ({
    _handleFile(req, file, cb) {
        const maxSize = fieldLimits[file.fieldname] ?? MAX_FILE_SIZE;
        const chunks = [];
        let size = 0;
        let settled = false;

        const fail = (error) => {
            if (settled) return;
            settled = true;
            // Keep draining the request so busboy can finish the multipart body, but stop
            // retaining bytes. Without resume() the upload would stall instead of failing.
            file.stream.removeAllListeners('data');
            file.stream.resume();
            cb(error);
        };

        file.stream.on('data', (chunk) => {
            if (settled) return;
            size += chunk.length;
            if (size > maxSize) {
                fail(new multer.MulterError('LIMIT_FILE_SIZE', file.fieldname));
                return;
            }
            chunks.push(chunk);
        });
        file.stream.on('end', () => {
            if (settled) return;
            settled = true;
            cb(null, { buffer: Buffer.concat(chunks), size });
        });
        file.stream.on('error', fail);
    },
    _removeFile(req, file, cb) {
        delete file.buffer;
        cb(null);
    }
});

const communityStorage = createPerFieldMemoryStorage({
    postVideo: MAX_VIDEO_FILE_SIZE
});

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
 * Community posts accept photos and one optional video in the same multipart request.
 * The size ceiling is applied per field by `communityStorage`, so photos stop at 5MB
 * while the video may reach 80MB.
 */
const communityMediaFileFilter = (req, file, cb) => {
    if (file.fieldname === 'postVideo') {
        if (ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid video type. Only MP4, WebM, MOV, and M4V videos are allowed.'), false);
        }
        return;
    }

    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
};

/**
 * Create multer upload instance with specified options
 * @param {number} maxSize - Per-file size ceiling in bytes
 * @param {number} maxFiles - Total files accepted across all fields. Defaults to 1 for the
 *   single-image routes; the gallery route raises it to match its own cap.
 * @param {Function} filter - Multer fileFilter implementation
 */
const createUpload = (maxSize = MAX_FILE_SIZE, maxFiles = 1, filter = fileFilter) => {
    return multer({
        storage: storage,
        fileFilter: filter,
        limits: {
            fileSize: maxSize,
            files: maxFiles
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
 * Delete an asset from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {'image'|'video'} resourceType - Asset type; videos live in a separate namespace
 * @returns {Promise<Object>} Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    if (!isConfigured()) {
        console.warn('Cloudinary not configured, skipping cloud deletion');
        return null;
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
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
 * Upload several images to Cloudinary for one request (community post galleries).
 * Populates req.cloudinaryResults (array); req.cloudinaryResult stays in sync with the first
 * image so existing single-image consumers keep working unchanged.
 *
 * @param {string} type - Cloudinary folder config key
 * @param {string} fieldName - Form field name
 * @param {number} maxCount - Maximum files accepted
 */
const handleCloudinaryMultiImageUpload = (type = 'general', fieldName = 'images', maxCount = 5, legacyFieldName = null) => {
    return (req, res, next) => {
        // `limits.files` counts every file across every field, so the legacy single-file field
        // has to be included in the ceiling or a client still posting both would be cut off at
        // maxCount before multer ever looks at the field-level caps.
        const maxFiles = legacyFieldName ? maxCount + 1 : maxCount;
        const upload = createUpload(MAX_FILE_SIZE, maxFiles);
        // Accept the legacy single-file field alongside the gallery one. A cached client still
        // posting the old field name would otherwise trip multer's LIMIT_UNEXPECTED_FILE and
        // come back as a confusing "you can attach up to 5 photos" 400.
        const expected = legacyFieldName
            ? [{ name: fieldName, maxCount }, { name: legacyFieldName, maxCount: 1 }]
            : [{ name: fieldName, maxCount }];
        const uploadMiddleware = upload.fields(expected);

        uploadMiddleware(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    const noun = maxCount === 1 ? 'photo' : 'photos';
                    return res.status(400).json({ success: false, message: `You can attach up to ${maxCount} ${noun}.` });
                }
                return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
            } else if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            // `fields()` yields an object keyed by field name; flatten it with the primary
            // field first so the cover photo is the first entry of the gallery.
            const groups = (req.files && !Array.isArray(req.files)) ? req.files : {};
            const picked = [...(groups[fieldName] || []), ...(groups[legacyFieldName] || [])];

            // Images are optional: a text-only post is a valid post.
            if (picked.length === 0) {
                req.cloudinaryResults = [];
                return next();
            }

            try {
                const config = uploadConfig[type] || uploadConfig.general;
                const userId = req.user?.id || 'system';

                // Cloudinary's Upload API takes a single asset per request, so five photos are
                // five calls. They are sent strictly one at a time: the client shows a running
                // total across the batch, and a queued sequence keeps the request rate
                // predictable instead of bursting three at once.
                const results = new Array(picked.length).fill(null);
                const failed = [];

                for (let index = 0; index < picked.length; index += 1) {
                    try {
                        results[index] = await uploadToCloudinary(picked[index].buffer, {
                            ...config,
                            public_id: generatePublicId(type, userId)
                        });
                    } catch (fileError) {
                        // One rejected photo must not cost the visitor the whole post.
                        console.error(`Cloudinary upload failed for ${picked[index].originalname}:`, fileError.message);
                        failed.push(picked[index].originalname);
                    }
                }

                const uploaded = results.filter(Boolean);
                if (!uploaded.length) {
                    return res.status(502).json({
                        success: false,
                        message: 'We could not upload your photos. Please try again.'
                    });
                }

                req.cloudinaryResults = uploaded;
                req.cloudinaryResult = uploaded[0];
                if (failed.length) {
                    console.warn(`Continuing without ${failed.length} photo(s): ${failed.join(', ')}`);
                    req.uploadWarnings = failed;
                }
                next();
            } catch (uploadError) {
                console.error('Cloudinary multi-upload error:', uploadError);
                return res.status(500).json({ success: false, message: 'Error uploading images to cloud storage.' });
            }
        });
    };
};

/**
 * Upload the media for a community post: up to `maxImages` photos and one optional video.
 *
 * Photos and the video share one multipart request so a post is created atomically from the
 * visitor's point of view. Images keep the existing 5MB ceiling; the video is capped at 80MB.
 * A failed photo is reported as a warning (the rest of the post still publishes), while a
 * failed video fails the request because losing the main attachment would be surprising.
 *
 * @param {number} maxImages - Maximum photos accepted for this route (5 on create, 1 on edit)
 */
const handleCloudinaryCommunityPostUpload = (maxImages = 5) => {
    return (req, res, next) => {
        // `limits.files` counts every file across every field, so both the gallery field and
        // the legacy single-photo field have to fit inside it. No `limits.fileSize` here:
        // `communityStorage` enforces the 5MB/80MB split per field while streaming.
        const upload = multer({
            storage: communityStorage,
            fileFilter: communityMediaFileFilter,
            limits: { files: maxImages + 2 }
        });
        const uploadMiddleware = upload.fields([
            { name: 'postImages', maxCount: maxImages },
            { name: 'postImage', maxCount: 1 },
            { name: 'postVideo', maxCount: 1 }
        ]);

        uploadMiddleware(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    const message = err.field === 'postVideo'
                        ? 'Video too large. Maximum size is 80MB.'
                        : 'Photo too large. Maximum size is 5MB.';
                    return res.status(400).json({ success: false, message });
                }
                if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
                    const noun = maxImages === 1 ? 'photo' : 'photos';
                    return res.status(400).json({
                        success: false,
                        message: `You can attach up to ${maxImages} ${noun} and one video.`
                    });
                }
                return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
            } else if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            const groups = (req.files && !Array.isArray(req.files)) ? req.files : {};
            // Primary field first so the cover photo is the first entry of the gallery.
            const images = [...(groups.postImages || []), ...(groups.postImage || [])].slice(0, maxImages);
            const video = groups.postVideo?.[0] || null;

            const config = uploadConfig.community || uploadConfig.general;
            const videoConfig = uploadConfig.communityVideo;
            const userId = req.user?.id || 'system';

            const results = new Array(images.length).fill(null);
            const failed = [];

            for (let index = 0; index < images.length; index += 1) {
                try {
                    results[index] = await uploadToCloudinary(images[index].buffer, {
                        ...config,
                        public_id: generatePublicId('community', userId)
                    });
                } catch (fileError) {
                    // One rejected photo must not cost the visitor the whole post.
                    console.error(`Cloudinary upload failed for ${images[index].originalname}:`, fileError.message);
                    failed.push(images[index].originalname);
                }
            }

            const uploaded = results.filter(Boolean);

            if (video) {
                try {
                    req.cloudinaryVideoResult = await uploadToCloudinary(video.buffer, {
                        ...videoConfig,
                        public_id: generatePublicId('community_video', userId)
                    });
                } catch (videoError) {
                    console.error(`Cloudinary video upload failed for ${video.originalname}:`, videoError.message);
                    // Do not strand the photos that already reached Cloudinary for a post
                    // that will never be created.
                    for (const image of uploaded) {
                        await deleteFromCloudinary(image.public_id, 'image');
                    }
                    return res.status(502).json({
                        success: false,
                        message: 'We could not upload your video. Please try again.'
                    });
                }
            }

            if (!uploaded.length && !req.cloudinaryVideoResult) {
                if (images.length) {
                    return res.status(502).json({
                        success: false,
                        message: 'We could not upload your photos. Please try again.'
                    });
                }
                req.cloudinaryResults = [];
                return next();
            }

            req.cloudinaryResults = uploaded;
            req.cloudinaryResult = uploaded[0];
            if (failed.length) {
                console.warn(`Continuing without ${failed.length} photo(s): ${failed.join(', ')}`);
                req.uploadWarnings = failed;
            }
            next();
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
    ALLOWED_VIDEO_MIME_TYPES,
    MAX_FILE_SIZE,
    MAX_VIDEO_FILE_SIZE,
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
    handleCloudinaryImageUpload,
    handleCloudinaryMultiImageUpload,
    handleCloudinaryCommunityPostUpload
};
