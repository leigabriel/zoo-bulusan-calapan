const Animal = require('../models/animal-model');
const Ticket = require('../models/ticket-model');
const Event = require('../models/event-model');
const User = require('../models/user-model');
const Notification = require('../models/notification-model');
const { notifyManagement, STORED_PREFERENCES } = require('../services/notification-service');
const { checkPersisted } = require('../utils/persist-check');
const UserActivity = require('../models/user-activity-model');
const crypto = require('crypto');


// Helper function to create notifications for admin/staff
const createAdminStaffNotification = async (title, message, type = 'ticket', link = null) => {
    await notifyManagement({ title, message, type, link });
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                email: user.email,
                phoneNumber: user.phone_number,
                gender: user.gender,
                birthday: user.birthday,
                role: user.role,
                profileImage: user.profile_image,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, gender, birthday } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await User.updateProfile(req.user.id, {
            firstName: firstName || user.first_name,
            lastName: lastName || user.last_name,
            phoneNumber: phoneNumber !== undefined ? phoneNumber : user.phone_number,
            gender: gender || user.gender,
            birthday: birthday || user.birthday,
            profileImage: user.profile_image
        });

        // Fetch updated user to return
        const updatedUser = await User.findById(req.user.id);
        res.json({ 
            success: true, 
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                firstName: updatedUser.first_name,
                lastName: updatedUser.last_name,
                fullName: `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim(),
                phoneNumber: updatedUser.phone_number,
                gender: updatedUser.gender,
                birthday: updatedUser.birthday,
                profileImage: updatedUser.profile_image,
                role: updatedUser.role
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
};

exports.getSettings = async (req, res) => {
    try {
        const settings = await User.getSettings(req.user.id);
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ success: false, message: 'Error getting settings' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { settings } = req.body;
        if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
            return res.status(400).json({ success: false, message: 'Invalid notification settings' });
        }
        // STORED_PREFERENCES is the canonical allow-list; `marketing` is a delivery gate
        // derived from marketingEmails and must never be accepted as a stored value.
        const allowedSettings = [...STORED_PREFERENCES];
        const currentSettings = await User.getSettings(req.user.id) || {};
        const nextSettings = { ...currentSettings };
        for (const key of allowedSettings) {
            if (Object.hasOwn(settings, key)) nextSettings[key] = Boolean(settings[key]);
        }

        await User.updateSettings(req.user.id, nextSettings);

        // Confirm by reading back rather than trusting affectedRows: re-enabling a setting
        // that was already on reports 0 affected rows, which is a success, not a failure.
        // The old check turned that into HTTP 400, so the UI reverted a saved toggle.
        const saved = await User.getSettings(req.user.id);
        if (!checkPersisted(saved, nextSettings)) {
            return res.status(500).json({ success: false, message: 'Failed to update settings' });
        }

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: 'Error updating settings' });
    }
};

exports.getActivities = async (req, res) => {
    try {
        const { logs } = await UserActivity.getRecentActivities({ userId: req.user.id, limit: 100 });
        const activities = logs.map(log => ({
            id: log.id,
            type: log.action_type,
            title: log.action_description || log.action_type.replaceAll('_', ' '),
            entityType: log.entity_type,
            entityId: log.entity_id,
            created_at: log.created_at
        }));
        res.json({ success: true, activities });
    } catch (error) {
        console.error('Error getting activities:', error);
        res.status(500).json({ success: false, message: 'Error getting activities' });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const [notifications, unreadCount] = await Promise.all([
            Notification.getByUserId(req.user.id, 50),
            Notification.getUnreadCount(req.user.id)
        ]);
        res.json({
            success: true,
            unreadCount: Number(unreadCount),
            notifications: notifications.map((notification) => ({
                id: notification.id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                read: Boolean(notification.is_read),
                link: notification.link,
                createdAt: notification.created_at,
                time: Notification.formatTime(notification.created_at)
            }))
        });
    } catch (error) {
        console.error('Error getting user notifications:', error);
        res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.markAsRead(id, req.user.id);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking user notification as read:', error);
        res.status(500).json({ success: false, message: 'Error updating notification' });
    }
};

exports.markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.markAllAsRead(req.user.id);
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all user notifications as read:', error);
        res.status(500).json({ success: false, message: 'Error updating notifications' });
    }
};

exports.clearNotifications = async (req, res) => {
    try {
        await Notification.deleteAll(req.user.id);
        res.json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
        console.error('Error clearing user notifications:', error);
        res.status(500).json({ success: false, message: 'Error clearing notifications' });
    }
};

exports.getAnimals = async (req, res) => {
    try {
        const animals = await Animal.getAll();
        res.json({ success: true, animals });
    } catch (error) {
        console.error('Error getting animals:', error);
        res.status(500).json({ success: false, message: 'Error fetching animals' });
    }
};

exports.getAnimalById = async (req, res) => {
    try {
        const { id } = req.params;
        const animal = await Animal.findById(id);

        if (!animal) {
            return res.status(404).json({ success: false, message: 'Animal not found' });
        }

        res.json({ success: true, animal });
    } catch (error) {
        console.error('Error getting animal:', error);
        res.status(500).json({ success: false, message: 'Error fetching animal' });
    }
};

exports.getEvents = async (req, res) => {
    try {
        const { all } = req.query;
        const events = all === 'true' ? await Event.getAll() : await Event.getUpcoming();
        res.json({ success: true, events });
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({ success: false, message: 'Error fetching events' });
    }
};

exports.getSlotAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required' });
        }

        // Define time slots with capacity
        const timeSlotDefinitions = [
            { time: '08:00', capacity: 100 },
            { time: '10:00', capacity: 100 },
            { time: '12:00', capacity: 100 },
            { time: '14:00', capacity: 100 },
            { time: '16:00', capacity: 100 }
        ];

        // Get ticket counts for each time slot on the given date
        const slotAvailability = await Promise.all(
            timeSlotDefinitions.map(async (slot) => {
                const bookedCount = await Ticket.countByDateAndTime(date, slot.time);
                return {
                    time: slot.time,
                    capacity: slot.capacity,
                    bookedCount: bookedCount,
                    available: bookedCount < slot.capacity,
                    remainingSpots: slot.capacity - bookedCount
                };
            })
        );

        res.json({ 
            success: true, 
            date,
            slots: slotAvailability 
        });
    } catch (error) {
        console.error('Error getting slot availability:', error);
        res.status(500).json({ success: false, message: 'Error fetching slot availability' });
    }
};

exports.getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.findByUserId(req.user.id);
        res.json({ success: true, tickets });
    } catch (error) {
        console.error('Error getting tickets:', error);
        res.status(500).json({ success: false, message: 'Error fetching tickets' });
    }
};

exports.getTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (ticket.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this ticket' });
        }

        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Error getting ticket:', error);
        res.status(500).json({ success: false, message: 'Error fetching ticket' });
    }
};

// ticket archive

// get active tickets
exports.getActiveTickets = async (req, res) => {
    try {
        const tickets = await Ticket.getActiveByUserId(req.user.id);
        res.json({ success: true, tickets });
    } catch (error) {
        console.error('Error getting active tickets:', error);
        res.status(500).json({ success: false, message: 'Error fetching tickets' });
    }
};

// Get archived tickets
exports.getArchivedTickets = async (req, res) => {
    try {
        const tickets = await Ticket.getArchivedByUserId(req.user.id);
        res.json({ success: true, tickets });
    } catch (error) {
        console.error('Error getting archived tickets:', error);
        res.status(500).json({ success: false, message: 'Error fetching archived tickets' });
    }
};

// Archive a single ticket
exports.archiveTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (ticket.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to archive this ticket' });
        }

        const archived = await Ticket.archiveTicket(id);
        
        if (!archived) {
            return res.status(500).json({ success: false, message: 'Failed to archive ticket' });
        }

        res.json({ success: true, message: 'Ticket archived successfully' });
    } catch (error) {
        console.error('Error archiving ticket:', error);
        res.status(500).json({ success: false, message: 'Error archiving ticket' });
    }
};

// Archive multiple tickets
exports.archiveMultipleTickets = async (req, res) => {
    try {
        const { ticketIds } = req.body;

        if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide ticket IDs to archive' });
        }

        // Verify ownership of all tickets
        for (const ticketId of ticketIds) {
            const ticket = await Ticket.findById(ticketId);
            if (!ticket || ticket.user_id !== req.user.id) {
                return res.status(403).json({ 
                    success: false, 
                    message: `Not authorized to archive ticket ${ticketId}` 
                });
            }
        }

        const archivedCount = await Ticket.archiveMultiple(ticketIds);
        
        res.json({ 
            success: true, 
            message: `${archivedCount} ticket(s) archived successfully`,
            archivedCount 
        });
    } catch (error) {
        console.error('Error archiving tickets:', error);
        res.status(500).json({ success: false, message: 'Error archiving tickets' });
    }
};

// Unarchive a ticket
exports.unarchiveTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (ticket.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to unarchive this ticket' });
        }

        const unarchived = await Ticket.unarchiveTicket(id);
        
        if (!unarchived) {
            return res.status(500).json({ success: false, message: 'Failed to unarchive ticket' });
        }

        res.json({ success: true, message: 'Ticket restored successfully' });
    } catch (error) {
        console.error('Error unarchiving ticket:', error);
        res.status(500).json({ success: false, message: 'Error restoring ticket' });
    }
};

// appeal endpoints

// submit an appeal
exports.submitAppeal = async (req, res) => {
    try {
        const { appealMessage } = req.body;

        if (!appealMessage || appealMessage.trim() === '') {
            return res.status(400).json({ success: false, message: 'Appeal message is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user || !user.is_suspended) {
            return res.status(400).json({ success: false, message: 'Only suspended users can submit appeals' });
        }

        // Check if user already has a pending appeal
        const existingAppeals = await User.getUserAppeals(req.user.id);
        const hasPendingAppeal = existingAppeals.some(a => a.status === 'pending');
        
        if (hasPendingAppeal) {
            return res.status(400).json({ success: false, message: 'You already have a pending appeal' });
        }

        const appealId = await User.createAppeal(req.user.id, appealMessage.trim());
        
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

// Get user's appeals
exports.getMyAppeals = async (req, res) => {
    try {
        const appeals = await User.getUserAppeals(req.user.id);
        res.json({ success: true, appeals });
    } catch (error) {
        console.error('Error getting appeals:', error);
        res.status(500).json({ success: false, message: 'Error fetching appeals' });
    }
};
