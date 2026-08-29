const express = require('express');
const { recordVisit } = require('../controllers/analytics-controller');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/visit', optionalAuth, recordVisit);

module.exports = router;