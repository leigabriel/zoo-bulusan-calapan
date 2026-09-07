const Message = require('../models/message-model');
const Notification = require('../models/notification-model');
const User = require('../models/user-model');
const { logStaffActivity, logUserActivity } = require('../middleware/track-activity');

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

        try {
            const admins = await User.getByRole('admin');
            const staffMembers = await User.getByRole('staff');
            
            const recipients = recipientType === 'staff' ? staffMembers : 
                              recipientType === 'all' ? [...admins, ...staffMembers] : admins;
            
            for (const recipient of recipients) {
                await Notification.create({
                    userId: recipient.id,
                    title: 'New Message Received',
                    message: `New message from ${req.user.firstName || 'a user'}: ${subject}`,
                    type: 'info',
                    link: '/admin/messages'
                });
            }
        } catch (notificationError) {
            console.error('Error creating notifications (message was sent):', notificationError);
        }

        res.status(201).json({ 
            success: true, 
            message: 'Message sent successfully',
            messageId 
        });

        // Log user message sent
        if (req.user.role === 'user') {
            await logUserActivity(req, 'message_sent', 'Sent a message', 'message', messageId);
        }
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

exports.replyToMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
        if (!content) return res.status(400).json({ success: false, message: 'Reply content is required' });
        if (content.length > 4000) return res.status(400).json({ success: false, message: 'Reply cannot exceed 4000 characters' });

        const updated = await Message.replyToMessage(id, req.user.id, content);
        if (!updated) return res.status(404).json({ success: false, message: 'Support case not found or already closed' });
        await Notification.notifyManagement({
            title: 'Support Case Reply',
            message: `${req.user.firstName || req.user.username || 'A user'} replied to a support case.`,
            type: 'info',
            link: '/admin/messages'
        });
        res.json({ success: true, message: 'Reply sent successfully' });
    } catch (error) {
        console.error('Error replying to support message:', error);
        res.status(500).json({ success: false, message: 'Error sending reply' });
    }
};

exports.closeCase = async (req, res) => {
    try {
        const supportMessage = await Message.findById(req.params.id);
        if (!supportMessage || supportMessage.message_type === 'appeal') {
            return res.status(404).json({ success: false, message: 'Support case not found' });
        }
        const closed = await Message.closeCase(req.params.id);
        if (!closed) return res.status(404).json({ success: false, message: 'Support case not found' });
        await Notification.create({
            userId: supportMessage.sender_id,
            title: 'Support Case Closed',
            message: `Your support case "${supportMessage.subject}" has been closed.`,
            type: 'info',
            link: '/my-messages'
        });
        res.json({ success: true, message: 'Support case closed' });
    } catch (error) {
        console.error('Error closing support case:', error);
        res.status(500).json({ success: false, message: 'Error closing support case' });
    }
};

exports.getAllMessages = async (req, res) => {
    try {
        // Staff and admin should both be able to see all messages to handle user inquiries
        const isAdminOrStaff = ['admin', 'staff'].includes(req.user.role);
        let messages;
        
        if (isAdminOrStaff) {
            // Admin and staff can see all messages (admin, staff, and all types)
            messages = await Message.getAll();
        } else {
            // For other roles, filter by their recipient type
            messages = await Message.getByRecipientType(req.user.role);
        }
        
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
        const isAdminOrStaff = ['admin', 'staff'].includes(req.user.role);
        let count;
        
        if (isAdminOrStaff) {
            // Admin and staff can mark all messages as read
            count = await Message.markAllUnread();
        } else {
            const recipientType = req.user.role;
            count = await Message.markAllAsRead(recipientType);
        }
        
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

        // Try to create notification (non-critical)
        try {
            await Notification.create({
                userId: message.sender_id,
                title: 'Response to Your Message',
                message: `Admin has responded to your message: ${message.subject}`,
                type: 'info',
                link: '/my-messages'
            });
        } catch (notificationError) {
            console.error('Error creating notification (response was saved):', notificationError);
        }

        // Track staff/admin activity
        if (['admin', 'staff'].includes(req.user.role)) {
            try {
                await logStaffActivity(req, 'message_reply', 'Replied to message', 'message', parseInt(id));
            } catch (activityError) {
                console.error('Error logging activity:', activityError);
            }
        }

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

        // Create appeal in user_appeals table (used by admin review flow)
        const appealId = await User.createAppeal(req.user.id, content.trim());

        const admins = await User.getByRole('admin');
        for (const admin of admins) {
            await Notification.create({
                userId: admin.id,
                title: 'New Suspension Appeal',
                message: `${user.first_name} ${user.last_name} has submitted a suspension appeal`,
                type: 'warning',
                link: '/admin/messages'
            });
        }

        res.status(201).json({ 
            success: true, 
            message: 'Appeal submitted successfully. You will be notified of the decision.',
            appealId 
        });
    } catch (error) {
        console.error('Error submitting appeal:', error);
        res.status(500).json({ success: false, message: 'Error submitting appeal' });
    }
};
