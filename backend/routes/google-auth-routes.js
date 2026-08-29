const express = require('express');
const router = express.Router();
const {
    initiateGoogleAuth,
    handleGoogleCallback,
    getGoogleHandoff,
    googleLogout
} = require('../controllers/google-auth-controller');
const { protect } = require('../middleware/auth');

// Initiate Google OAuth flow - redirects to Google consent screen
router.get('/google', initiateGoogleAuth);

// Handle Google OAuth callback - exchanges code for tokens
router.get('/google/callback', handleGoogleCallback);
router.get('/google/session', getGoogleHandoff);

// Logout endpoint
router.post('/google/logout', protect, googleLogout);

module.exports = router;