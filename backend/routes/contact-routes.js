const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact-controller');
const { contactLimiter } = require('../middleware/rate-limit');

// Public: the login page lets visitors without an account ask for help.
router.post('/', contactLimiter, contactController.submitContact);

module.exports = router;
