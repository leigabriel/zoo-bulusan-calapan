/**
 * Cloudinary Configuration Module
 * 
 * This module configures and exports the Cloudinary SDK instance
 * for secure, server-side image uploads.
 * 
 * Environment Variables Required:
 * - CLOUDINARY_CLOUD_NAME: Your Cloudinary cloud name
 * - CLOUDINARY_API_KEY: Your Cloudinary API key
 * - CLOUDINARY_API_SECRET: Your Cloudinary API secret
 */

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // Always use HTTPS URLs
});

/**
 * Validates that Cloudinary is properly configured
 * @returns {boolean} True if all required environment variables are set
 */
const isConfigured = () => {
    return !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
};

/**
 * Upload configuration options for different image types
 */
const uploadConfig = {
    // Profile images configuration
    profile: {
        folder: 'zoo-bulusan/profile-images',
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
        ],
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        resource_type: 'image'
    },
    // Resident ID images configuration
    residentId: {
        folder: 'zoo-bulusan/resident-id-images',
        transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
        ],
        allowed_formats: ['jpg', 'jpeg', 'png'],
        resource_type: 'image'
    },
    // Animal images configuration
    animal: {
        folder: 'zoo-bulusan/animals',
        transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
        ],
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        resource_type: 'image'
    },
    // Plant images configuration
    plant: {
        folder: 'zoo-bulusan/plants',
        transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
        ],
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        resource_type: 'image'
    },
    // Event images configuration
    event: {
        folder: 'zoo-bulusan/events',
        transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
        ],
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        resource_type: 'image'
    },
    // General images configuration (fallback)
    general: {
        folder: 'zoo-bulusan/uploads',
        transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
        ],
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        resource_type: 'image'
    }
};

module.exports = {
    cloudinary,
    isConfigured,
    uploadConfig
};