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
const { handleCloudinaryProfileUpload } = require('../middleware/cloudinary-upload');

// Public routes (no auth required)
router.post('/register', register);
router.post('/login', login);
router.post('/appeal', submitPublicAppeal);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Protected routes (auth required)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/profile/image', protect, handleCloudinaryProfileUpload, uploadProfileImage);
router.delete('/profile/image', protect, deleteProfileImage);
router.put('/updatepassword', protect, updatePassword);
router.delete('/account', protect, deleteAccount);
router.post('/logout', protect, logout);

module.exports = router;