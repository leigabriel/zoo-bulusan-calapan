const Animal = require('../models/animal-model');
const Ticket = require('../models/ticket-model');
const Event = require('../models/event-model');
const User = require('../models/user-model');
const Notification = require('../models/notification-model');

exports.getDashboardStats = async (req, res) => {
    try {
        const [
            todayTickets,
            pendingValidations,
            todayVisitors,
            activeAnimals,
            upcomingEvents
        ] = await Promise.all([
            Ticket.countTodayTickets(),
            Ticket.countPendingValidations(),
            Ticket.countTodayVisitors(),
            Animal.count(),
            Event.countUpcoming()
        ]);

        res.json({
            success: true,
            data: {
                todayTickets,
                pendingValidations,
                todayVisitors,
                activeAnimals,
                upcomingEvents
            }
        });
    } catch (error) {
        console.error('Error getting staff dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboard stats' });
    }
};

exports.getRecentTickets = async (req, res) => {
    try {
        const tickets = await Ticket.getRecentTickets(5);
        res.json({ success: true, data: tickets });
    } catch (error) {
        console.error('Error getting recent tickets:', error);
        res.status(500).json({ success: false, message: 'Error fetching recent tickets' });
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

exports.updateAnimalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['healthy', 'sick', 'critical', 'quarantine'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const updated = await Animal.updateStatus(id, status);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Animal not found' });
        }

        res.json({ success: true, message: 'Animal status updated successfully' });
    } catch (error) {
        console.error('Error updating animal status:', error);
        res.status(500).json({ success: false, message: 'Error updating animal status' });
    }
};

exports.validateTicket = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Ticket code is required' });
        }

        // Try to find by booking reference or QR code
        let ticket = await Ticket.findByCode(code);
        if (!ticket) {
            ticket = await Ticket.findByQRCode(code);
        }

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Check ticket status
        if (ticket.status === 'used') {
            return res.status(400).json({ 
                success: false, 
                message: 'Ticket has already been used',
                ticket: {
                    id: ticket.id,
                    bookingReference: ticket.booking_reference,
                    visitorName: ticket.user_name || ticket.visitor_name,
                    ticketType: ticket.ticket_type,
                    visitDate: ticket.visit_date,
                    status: ticket.status,
                    checkedInAt: ticket.checked_in_at
                }
            });
        }

        if (ticket.status === 'cancelled') {
            return res.status(400).json({ 
                success: false, 
                message: 'Ticket has been cancelled',
                ticket: {
                    id: ticket.id,
                    bookingReference: ticket.booking_reference,
                    status: ticket.status
                }
            });
        }

        if (ticket.status === 'expired') {
            return res.status(400).json({ 
                success: false, 
                message: 'Ticket has expired',
                ticket: {
                    id: ticket.id,
                    bookingReference: ticket.booking_reference,
                    visitDate: ticket.visit_date,
                    status: ticket.status
                }
            });
        }

        // Check if visit date matches today
        const today = new Date().toISOString().split('T')[0];
        const visitDate = new Date(ticket.visit_date).toISOString().split('T')[0];
        
        if (visitDate !== today) {
            return res.status(400).json({ 
                success: false, 
                message: `Ticket is valid for ${visitDate}, not today`,
                ticket: {
                    id: ticket.id,
                    bookingReference: ticket.booking_reference,
                    visitorName: ticket.user_name || ticket.visitor_name,
                    ticketType: ticket.ticket_type,
                    visitDate: ticket.visit_date,
                    status: ticket.status
                }
            });
        }

        // Mark ticket as used
        await Ticket.updateTicketWithDetails(ticket.id, { 
            status: 'used',
            checkedInBy: req.user.id
        });

        res.json({
            success: true,
            message: 'Ticket validated successfully',
            ticket: {
                id: ticket.id,
                bookingReference: ticket.booking_reference,
                visitorName: ticket.user_name || ticket.visitor_name,
                visitorEmail: ticket.user_email || ticket.visitor_email,
                ticketType: ticket.ticket_type,
                quantity: ticket.quantity,
                visitDate: ticket.visit_date,
                totalAmount: ticket.total_amount,
                paymentStatus: ticket.payment_status,
                status: 'used'
            }
        });
    } catch (error) {
        console.error('Error validating ticket:', error);
        res.status(500).json({ success: false, message: 'Error validating ticket' });
    }
};

exports.getActiveTickets = async (req, res) => {
    try {
        const tickets = await Ticket.getAll();
        const activeTickets = tickets.filter(t => t.status === 'active');
        res.json({ success: true, tickets: activeTickets });
    } catch (error) {
        console.error('Error getting active tickets:', error);
        res.status(500).json({ success: false, message: 'Error fetching tickets' });
    }
};

// Get all tickets for staff management
exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.getAll();
        res.json({ success: true, tickets });
    } catch (error) {
        console.error('Error getting tickets:', error);
        res.status(500).json({ success: false, message: 'Error fetching tickets' });
    }
};

// Get ticket by ID
exports.getTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Error getting ticket:', error);
        res.status(500).json({ success: false, message: 'Error fetching ticket' });
    }
};

// Update ticket status
exports.updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancellationReason, paymentStatus } = req.body;

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const validStatuses = ['pending', 'confirmed', 'used', 'cancelled', 'expired'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (status === 'cancelled' && cancellationReason) {
            updateData.cancellationReason = cancellationReason;
        }
        updateData.checkedInBy = req.user.id;

        const updated = await Ticket.updateTicketWithDetails(id, updateData);

        if (!updated) {
            return res.status(500).json({ success: false, message: 'Failed to update ticket' });
        }

        res.json({ success: true, message: 'Ticket updated successfully' });
    } catch (error) {
        console.error('Error updating ticket status:', error);
        res.status(500).json({ success: false, message: 'Error updating ticket status' });
    }
};

// Get all events
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.getAll();
        res.json({ success: true, events });
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({ success: false, message: 'Error fetching events' });
    }
};

exports.getUpcomingEvents = async (req, res) => {
    try {
        const events = await Event.getUpcoming();
        res.json({ success: true, events });
    } catch (error) {
        console.error('Error getting upcoming events:', error);
        res.status(500).json({ success: false, message: 'Error fetching events' });
    }
};

// Get all users (view only for staff)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        // Return limited info for staff
        const sanitizedUsers = users.map(u => ({
            id: u.id,
            firstName: u.first_name,
            lastName: u.last_name,
            email: u.email,
            role: u.role,
            isActive: u.is_active,
            createdAt: u.created_at
        }));
        res.json({ success: true, users: sanitizedUsers });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ success: false, message: 'Error fetching users' });
    }
};

// Get user by ID (view only for staff)
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ 
            success: true, 
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                phoneNumber: user.phone_number,
                role: user.role,
                isActive: user.is_active,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ success: false, message: 'Error fetching user' });
    }
};

// Get today's tickets
exports.getTodayTickets = async (req, res) => {
    try {
        const tickets = await Ticket.getTodayTickets();
        res.json({ success: true, tickets });
    } catch (error) {
        console.error('Error getting today tickets:', error);
        res.status(500).json({ success: false, message: 'Error fetching tickets' });
    }
};

// Get dashboard notifications
exports.getNotifications = async (req, res) => {
    try {
        const result = await Notification.generateDashboardNotifications();
        res.json({
            success: true,
            notifications: result.notifications,
            summary: result.summary
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
};

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await Notification.markAsRead(id, userId);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification read:', error);
        res.status(500).json({ success: false, message: 'Error updating notification' });
    }
};

// Mark all notifications as read
exports.markAllNotificationsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await Notification.markAllAsRead(userId);
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications read:', error);
        res.status(500).json({ success: false, message: 'Error updating notifications' });
    }
};
