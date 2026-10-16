const express = require('express');
const { recordVisit } = require('../controllers/analytics-controller');
const { optionalAuth } = require('../middleware/auth');
const { visitLimiter } = require('../middleware/rate-limit');

const router = express.Router();

router.post('/visit', optionalAuth, visitLimiter, recordVisit);

module.exports = router;