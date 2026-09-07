const express = require('express');
const chatController = require('../controllers/chat-controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('user', 'staff', 'admin'));
router.get('/recipients', chatController.getRecipients);
router.get('/conversations', chatController.listConversations);
router.get('/inbox', chatController.listConversations);
router.post('/conversations', chatController.createConversation);
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.patch('/conversations/:conversationId/read', chatController.markRead);
router.get('/unread-count', chatController.getUnreadCount);

module.exports = router;
