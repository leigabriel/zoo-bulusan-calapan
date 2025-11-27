const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    updateProfile,
    updatePassword,
    deleteAccount,
    logout
} = require('../controllers/auth-controller');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/updatepassword', protect, updatePassword);
router.delete('/account', protect, deleteAccount);
router.post('/logout', protect, logout);

module.exports = router;
