const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message-controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', messageController.sendMessage);
router.get('/my-messages', messageController.getMyMessages);
router.post('/appeal', messageController.submitAppeal);

module.exports = router;
