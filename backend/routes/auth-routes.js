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
    deleteProfileImage
} = require('../controllers/auth-controller');
const { protect } = require('../middleware/auth');
const { handleProfileImageUpload } = require('../middleware/upload-profile-image');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/profile/image', protect, handleProfileImageUpload, uploadProfileImage);
router.delete('/profile/image', protect, deleteProfileImage);
router.put('/updatepassword', protect, updatePassword);
router.delete('/account', protect, deleteAccount);
router.post('/logout', protect, logout);

module.exports = router;