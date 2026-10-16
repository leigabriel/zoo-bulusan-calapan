const express = require('express');
const router = express.Router();
const {
    initiateGoogleAuth,
    handleGoogleCallback,
    getGoogleHandoff,
    googleLogout
} = require('../controllers/google-auth-controller');
const { protect } = require('../middleware/auth');
const { oauthLimiter } = require('../middleware/rate-limit');

// Initiate Google OAuth flow - redirects to Google consent screen
router.get('/google', oauthLimiter, initiateGoogleAuth);

// Handle Google OAuth callback - exchanges code for tokens
router.get('/google/callback', oauthLimiter, handleGoogleCallback);
router.get('/google/session', oauthLimiter, getGoogleHandoff);

// Logout endpoint
router.post('/google/logout', protect, googleLogout);

module.exports = router;