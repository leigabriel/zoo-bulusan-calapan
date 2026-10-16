const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    updateProfile,
    updateEmail,
    updatePassword,
    setInitialPassword,
    setUsername,
    checkUsername,
    completeOnboarding,
    deleteAccount,
    logout,
    uploadProfileImage,
    deleteProfileImage,
    submitPublicAppeal,
    verifyEmail,
    resendVerification,
    requestPasswordReset,
    resetPassword
} = require('../controllers/auth-controller');
const { protect } = require('../middleware/auth');
const adminMasterKeyController = require('../controllers/admin-master-key-controller');
const { handleCloudinaryProfileUpload } = require('../middleware/cloudinary-upload');
const { authLimiter, masterKeyLimiter, appealLimiter, writeLimiter } = require('../middleware/rate-limit');

// Public routes (no auth required)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/master-key/verify', masterKeyLimiter, adminMasterKeyController.verifyLoginMasterKey);
router.post('/appeal', appealLimiter, submitPublicAppeal);
router.get('/verify-email', authLimiter, verifyEmail);
router.post('/resend-verification', authLimiter, resendVerification);
router.post('/forgot-password', authLimiter, requestPasswordReset);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes (auth required)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/email', protect, updateEmail);
router.post('/profile/image', protect, handleCloudinaryProfileUpload, uploadProfileImage);
router.delete('/profile/image', protect, deleteProfileImage);
router.put('/updatepassword', protect, writeLimiter, updatePassword);
// For accounts with no password yet (Google sign-in). Refuses when one already exists.
router.post('/password/initial', protect, writeLimiter, setInitialPassword);
router.put('/username', protect, writeLimiter, setUsername);
router.get('/username/check', protect, checkUsername);
router.post('/onboarding/complete', protect, writeLimiter, completeOnboarding);
router.delete('/account', protect, writeLimiter, deleteAccount);
router.post('/logout', protect, logout);

module.exports = router;
