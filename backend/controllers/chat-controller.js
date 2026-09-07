const Chat = require('../models/chat-model');
const chatSocket = require('../socket/chat-socket');

const normalizePerson = (row, prefix = '') => ({
    id: row[`${prefix}id`] ?? row.id,
    firstName: row[`${prefix}first_name`] ?? row.first_name,
    lastName: row[`${prefix}last_name`] ?? row.last_name,
    username: row[`${prefix}username`] ?? row.username,
    profileImage: row[`${prefix}profile_image`] ?? row.profile_image
});

const normalizeMessage = row => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderRole: row.sender_role,
    content: row.content,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
    sender: {
        id: row.sender_id,
        firstName: row.first_name,
        lastName: row.last_name,
        username: row.username,
        profileImage: row.profile_image
    }
});

const normalizeConversation = row => ({
    id: row.id,
    userId: row.user_id,
    recipientType: row.recipient_type,
    staffRecipientId: row.staff_recipient_id || null,
    user: {
        id: row.user_id,
        firstName: row.user_first_name,
        lastName: row.user_last_name,
        username: row.user_username,
        profileImage: row.user_profile_image
    },
    recipient: row.recipient_type === 'admin' ? { type: 'admin', name: 'Admin inbox' } : {
        type: 'staff',
        id: row.staff_recipient_id,
        firstName: row.staff_first_name,
        lastName: row.staff_last_name,
        username: row.staff_username,
        profileImage: row.staff_profile_image
    },
    lastMessage: row.last_message_id ? {
        id: row.last_message_id,
        senderId: row.last_sender_id,
        senderRole: row.last_sender_role,
        content: row.last_content,
        isRead: Boolean(row.last_is_read),
        createdAt: row.last_created_at
    } : null,
    unreadCount: Number(row.unread_count || 0),
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

const failure = (res, error) => {
    console.error('Chat API error:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to process chat request' });
};

exports.getRecipients = async (req, res) => {
    if (req.user.role !== 'user') return res.status(403).json({ success: false, message: 'Only users can select chat recipients' });
    try {
        const recipients = await Chat.getActiveRecipients(req.user);
        return res.json({
            success: true,
            recipients: [
                ...(recipients.adminAvailable ? [{ type: 'admin', name: 'Admin inbox' }] : []),
                ...recipients.staff.map(person => ({ type: 'staff', ...normalizePerson(person) }))
            ]
        });
    } catch (error) {
        return failure(res, error);
    }
};

exports.listConversations = async (req, res) => {
    try {
        const rows = await Chat.listConversations(req.user);
        return res.json({ success: true, conversations: rows.map(normalizeConversation) });
    } catch (error) {
        return failure(res, error);
    }
};

exports.createConversation = async (req, res) => {
    if (req.user.role !== 'user') return res.status(403).json({ success: false, message: 'Only users can create conversations' });
    const recipientType = req.body.recipientType;
    const recipientId = req.body.recipientId;
    if (!['staff', 'admin'].includes(recipientType) || (recipientType === 'staff' && !/^\d+$/.test(String(recipientId)))) {
        return res.status(400).json({ success: false, message: 'A valid staff or admin recipient is required' });
    }
    try {
        const row = await Chat.createConversation(req.user, recipientType, recipientId || null);
        if (!row) return res.status(404).json({ success: false, message: 'Active recipient not found' });
        const conversation = normalizeConversation(row);
        chatSocket.emitConversationUpdated(row, conversation);
        return res.status(201).json({ success: true, conversation });
    } catch (error) {
        return failure(res, error);
    }
};

exports.getMessages = async (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 200);
    try {
        const rows = await Chat.getMessages(req.user, req.params.conversationId, limit);
        if (!rows) return res.status(404).json({ success: false, message: 'Conversation not found' });
        return res.json({ success: true, messages: rows.map(normalizeMessage) });
    } catch (error) {
        return failure(res, error);
    }
};

exports.sendMessage = async (req, res) => {
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!content) return res.status(400).json({ success: false, message: 'Message content is required' });
    if (content.length > 4000) return res.status(400).json({ success: false, message: 'Message content cannot exceed 4000 characters' });
    try {
        const result = await Chat.sendMessage(req.user, req.params.conversationId, content);
        if (!result) return res.status(404).json({ success: false, message: 'Conversation not found' });
        const message = normalizeMessage(result.message);
        chatSocket.emitMessageCreated(result.conversation, message);
        chatSocket.emitConversationUpdated(result.conversation, { conversationId: result.conversation.id });

        const recipient = req.user.role === 'user'
            ? (result.conversation.recipient_type === 'admin'
                ? { role: 'admin' }
                : { id: result.conversation.staff_recipient_id, role: 'staff' })
            : { id: result.conversation.user_id, role: 'user' };
        const count = await Chat.getUnreadCount(recipient);
        chatSocket.emitUnreadCount(recipient, count);
        return res.status(201).json({ success: true, message });
    } catch (error) {
        return failure(res, error);
    }
};

exports.markRead = async (req, res) => {
    try {
        const result = await Chat.markRead(req.user, req.params.conversationId);
        if (!result) return res.status(404).json({ success: false, message: 'Conversation not found' });
        if (result.markedRead > 0) {
            const count = await Chat.getUnreadCount(req.user);
            chatSocket.emitConversationRead(result.conversation, req.user, result.markedRead);
            chatSocket.emitUnreadCount(req.user, count);
            return res.json({ success: true, markedRead: result.markedRead, unreadCount: count });
        }
        return res.json({ success: true, markedRead: 0 });
    } catch (error) {
        return failure(res, error);
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Chat.getUnreadCount(req.user);
        return res.json({ success: true, unreadCount: count });
    } catch (error) {
        return failure(res, error);
    }
};
