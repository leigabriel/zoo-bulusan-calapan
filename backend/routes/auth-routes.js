const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    updateProfile,
    updatePassword,
    deleteAccount,
    logout,
    uploadProfileImage,
    deleteProfileImage,
    submitPublicAppeal,
    verifyEmail,
    resendVerification
} = require('../controllers/auth-controller');
const { protect } = require('../middleware/auth');
const { handleProfileImageUpload } = require('../middleware/upload-profile-image');
const { handleCloudinaryProfileUpload } = require('../middleware/cloudinary-upload');
const { isConfigured: isCloudinaryConfigured } = require('../config/cloudinary');

// Middleware to choose between Cloudinary or local upload
const profileImageMiddleware = (req, res, next) => {
    if (isCloudinaryConfigured()) {
        return handleCloudinaryProfileUpload(req, res, next);
    } else {
        return handleProfileImageUpload(req, res, next);
    }
};

// Public routes (no auth required)
router.post('/register', register);
router.post('/login', login);
router.post('/appeal', submitPublicAppeal);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Protected routes (auth required)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/profile/image', protect, profileImageMiddleware, uploadProfileImage);
router.delete('/profile/image', protect, deleteProfileImage);
router.put('/updatepassword', protect, updatePassword);
router.delete('/account', protect, deleteAccount);
router.post('/logout', protect, logout);

module.exports = router;