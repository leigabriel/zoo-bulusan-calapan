/**
 * Upload Controller
 * 
 * Centralized controller for handling image uploads to Cloudinary.
 * Supports various image types: profile, animal, plant, event, resident ID.
 */

const { isConfigured } = require('../config/cloudinary');
const { 
    deleteFromCloudinary, 
    extractPublicId,
    uploadBase64ToCloudinary 
} = require('../middleware/cloudinary-upload');

/**
 * Upload a generic image to Cloudinary
 * Expects cloudinaryResult to be attached by middleware
 */
exports.uploadImage = async (req, res) => {
    try {
        // Check if Cloudinary is configured
        if (!isConfigured()) {
            return res.status(500).json({
                success: false,
                message: 'Cloud storage is not configured. Please contact administrator.'
            });
        }

        // Check if upload was successful
        if (!req.cloudinaryResult) {
            return res.status(400).json({
                success: false,
                message: 'No image was uploaded.'
            });
        }

        const result = req.cloudinaryResult;

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes
            }
        });
    } catch (error) {
        console.error('Upload image error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading image'
        });
    }
};

/**
 * Upload animal image
 */
exports.uploadAnimalImage = async (req, res) => {
    try {
        if (!isConfigured()) {
            return res.status(500).json({
                success: false,
                message: 'Cloud storage is not configured.'
            });
        }

        if (!req.cloudinaryResult) {
            return res.status(400).json({
                success: false,
                message: 'No image was uploaded.'
            });
        }

        const result = req.cloudinaryResult;

        res.json({
            success: true,
            message: 'Animal image uploaded successfully',
            imageUrl: result.secure_url,
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height
            }
        });
    } catch (error) {
        console.error('Upload animal image error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading animal image'
        });
    }
};

/**
 * Upload plant image
 */
exports.uploadPlantImage = async (req, res) => {
    try {
        if (!isConfigured()) {
            return res.status(500).json({
                success: false,
                message: 'Cloud storage is not configured.'
            });
        }

        if (!req.cloudinaryResult) {
            return res.status(400).json({
                success: false,
                message: 'No image was uploaded.'
            });
        }

        const result = req.cloudinaryResult;

        res.json({
            success: true,
            message: 'Plant image uploaded successfully',
            imageUrl: result.secure_url,
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height
            }
        });
    } catch (error) {
        console.error('Upload plant image error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading plant image'
        });
    }
};

/**
 * Upload event image
 */
exports.uploadEventImage = async (req, res) => {
    try {
        if (!isConfigured()) {
            return res.status(500).json({
                success: false,
                message: 'Cloud storage is not configured.'
            });
        }

        if (!req.cloudinaryResult) {
            return res.status(400).json({
                success: false,
                message: 'No image was uploaded.'
            });
        }

        const result = req.cloudinaryResult;

        res.json({
            success: true,
            message: 'Event image uploaded successfully',
            imageUrl: result.secure_url,
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height
            }
        });
    } catch (error) {
        console.error('Upload event image error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading event image'
        });
    }
};

/**
 * Upload resident ID image
 */
exports.uploadResidentIdImage = async (req, res) => {
    try {
        if (!isConfigured()) {
            return res.status(500).json({
                success: false,
                message: 'Cloud storage is not configured.'
            });
        }

        if (!req.cloudinaryResult) {
            return res.status(400).json({
                success: false,
                message: 'No image was uploaded.'
            });
        }

        const result = req.cloudinaryResult;

        res.json({
            success: true,
            message: 'Resident ID image uploaded successfully',
            imageUrl: result.secure_url,
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height
            }
        });
    } catch (error) {
        console.error('Upload resident ID image error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading resident ID image'
        });
    }
};

/**
 * Upload base64 image (for legacy support)
 */
exports.uploadBase64Image = async (req, res) => {
    try {
        const { image, type = 'general' } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                message: 'No image data provided.'
            });
        }

        if (!isConfigured()) {
            return res.status(500).json({
                success: false,
                message: 'Cloud storage is not configured.'
            });
        }

        const userId = req.user?.id || 'unknown';
        const imageUrl = await uploadBase64ToCloudinary(image, type, userId);

        if (!imageUrl) {
            return res.status(500).json({
                success: false,
                message: 'Failed to upload image.'
            });
        }

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: imageUrl
        });
    } catch (error) {
        console.error('Upload base64 image error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading image'
        });
    }
};

/**
 * Delete image from Cloudinary
 */
exports.deleteImage = async (req, res) => {
    try {
        const { url, publicId } = req.body;

        if (!url && !publicId) {
            return res.status(400).json({
                success: false,
                message: 'Image URL or public ID is required.'
            });
        }

        if (!isConfigured()) {
            return res.status(500).json({
                success: false,
                message: 'Cloud storage is not configured.'
            });
        }

        // Extract public ID from URL if not provided
        const imagePublicId = publicId || extractPublicId(url);

        if (!imagePublicId) {
            return res.status(400).json({
                success: false,
                message: 'Could not determine image public ID.'
            });
        }

        const result = await deleteFromCloudinary(imagePublicId);

        res.json({
            success: true,
            message: 'Image deleted successfully',
            result
        });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting image'
        });
    }
};

/**
 * Check Cloudinary configuration status
 */
exports.checkStatus = (req, res) => {
    res.json({
        success: true,
        configured: isConfigured(),
        message: isConfigured() 
            ? 'Cloud storage is properly configured.' 
            : 'Cloud storage is not configured. Using local storage fallback.'
    });
};