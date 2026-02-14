const Message = require('../models/message-model');
const Notification = require('../models/notification-model');
const User = require('../models/user-model');

exports.sendMessage = async (req, res) => {
    try {
        const { subject, content, recipientType } = req.body;

        if (!subject || !content) {
            return res.status(400).json({ 
                success: false, 
                message: 'Subject and content are required' 
            });
        }

        const messageId = await Message.create({
            senderId: req.user.id,
            senderType: 'user',
            recipientType: recipientType || 'admin',
            subject: subject.trim(),
            content: content.trim()
        });

        const admins = await User.getByRole('admin');
        const staffMembers = await User.getByRole('staff');
        
        const recipients = recipientType === 'staff' ? staffMembers : 
                          recipientType === 'all' ? [...admins, ...staffMembers] : admins;
        
        for (const recipient of recipients) {
            await Notification.create({
                userId: recipient.id,
                title: 'New Message Received',
                message: `New message from ${req.user.firstName || 'a user'}: ${subject}`,
                type: 'message',
                link: '/admin/messages'
            });
        }

        res.status(201).json({ 
            success: true, 
            message: 'Message sent successfully',
            messageId 
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Error sending message' });
    }
};

exports.getMyMessages = async (req, res) => {
    try {
        const messages = await Message.getBySenderId(req.user.id);
        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ success: false, message: 'Error fetching messages' });
    }
};

exports.getAllMessages = async (req, res) => {
    try {
        const recipientType = req.user.role === 'admin' ? 'admin' : 'staff';
        const messages = await Message.getByRecipientType(recipientType);
        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ success: false, message: 'Error fetching messages' });
    }
};

exports.getMessageById = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        res.json({ success: true, message });
    } catch (error) {
        console.error('Error getting message:', error);
        res.status(500).json({ success: false, message: 'Error fetching message' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Message.markAsRead(id);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ success: false, message: 'Error updating message' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const recipientType = req.user.role === 'admin' ? 'admin' : 'staff';
        const count = await Message.markAllAsRead(recipientType);
        res.json({ success: true, message: `${count} messages marked as read` });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ success: false, message: 'Error updating messages' });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const recipientType = req.user.role === 'admin' ? 'admin' : 'staff';
        const count = await Message.getUnreadCount(recipientType);
        res.json({ success: true, count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ success: false, message: 'Error fetching unread count' });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Message.delete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ success: false, message: 'Error deleting message' });
    }
};

exports.respondToMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { response } = req.body;

        if (!response) {
            return res.status(400).json({ success: false, message: 'Response is required' });
        }

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        const db = require('../config/database');
        await db.query(
            `UPDATE user_messages SET admin_response = ?, responded_by = ?, responded_at = NOW(), updated_at = NOW() WHERE id = ?`,
            [response.trim(), req.user.id, id]
        );

        await Notification.create({
            userId: message.sender_id,
            title: 'Response to Your Message',
            message: `Admin has responded to your message: ${message.subject}`,
            type: 'message'
        });

        res.json({ success: true, message: 'Response sent successfully' });
    } catch (error) {
        console.error('Error responding to message:', error);
        res.status(500).json({ success: false, message: 'Error sending response' });
    }
};

exports.getAppeals = async (req, res) => {
    try {
        const appeals = await Message.getAppeals();
        res.json({ success: true, appeals });
    } catch (error) {
        console.error('Error getting appeals:', error);
        res.status(500).json({ success: false, message: 'Error fetching appeals' });
    }
};

exports.submitAppeal = async (req, res) => {
    try {
        const { subject, content } = req.body;

        if (!content) {
            return res.status(400).json({ 
                success: false, 
                message: 'Appeal message is required' 
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const messageId = await Message.createAppealMessage({
            senderId: req.user.id,
            subject: subject || 'Suspension Appeal',
            content: content.trim()
        });

        const admins = await User.getByRole('admin');
        for (const admin of admins) {
            await Notification.create({
                userId: admin.id,
                title: 'New Suspension Appeal',
                message: `${user.first_name} ${user.last_name} has submitted a suspension appeal`,
                type: 'appeal',
                link: '/admin/messages'
            });
        }

        res.status(201).json({ 
            success: true, 
            message: 'Appeal submitted successfully. You will be notified of the decision.',
            messageId 
        });
    } catch (error) {
        console.error('Error submitting appeal:', error);
        res.status(500).json({ success: false, message: 'Error submitting appeal' });
    }
};
