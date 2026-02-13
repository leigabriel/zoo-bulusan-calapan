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

// Check ticket validity without marking as used (validation only)
exports.checkTicket = async (req, res) => {
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

        // Check if visit date matches today using local timezone
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const visitDateObj = new Date(ticket.visit_date);
        const visitDate = `${visitDateObj.getFullYear()}-${String(visitDateObj.getMonth() + 1).padStart(2, '0')}-${String(visitDateObj.getDate()).padStart(2, '0')}`;
        
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

        // Return ticket info WITHOUT marking as used
        res.json({
            success: true,
            message: 'Ticket is valid - ready for check-in',
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
                status: ticket.status
            }
        });
    } catch (error) {
        console.error('Error checking ticket:', error);
        res.status(500).json({ success: false, message: 'Error checking ticket' });
    }
};

// Mark ticket as used (explicit confirmation step)
exports.markTicketUsed = async (req, res) => {
    try {
        const { ticketId } = req.body;

        if (!ticketId) {
            return res.status(400).json({ success: false, message: 'Ticket ID is required' });
        }

        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (ticket.status === 'used') {
            return res.status(400).json({ 
                success: false, 
                message: 'Ticket has already been used'
            });
        }

        if (ticket.status !== 'active') {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot check in ticket with status: ${ticket.status}`
            });
        }

        // Mark ticket as used
        await Ticket.updateTicketWithDetails(ticket.id, { 
            status: 'used',
            checkedInBy: req.user.id
        });

        res.json({
            success: true,
            message: 'Ticket checked in successfully',
            ticket: {
                id: ticket.id,
                bookingReference: ticket.booking_reference,
                visitorName: ticket.user_name || ticket.visitor_name,
                ticketType: ticket.ticket_type,
                quantity: ticket.quantity,
                visitDate: ticket.visit_date,
                status: 'used'
            }
        });
    } catch (error) {
        console.error('Error marking ticket as used:', error);
        res.status(500).json({ success: false, message: 'Error checking in ticket' });
    }
};

// Legacy validateTicket - now calls checkTicket for backwards compatibility
exports.validateTicket = async (req, res) => {
    return exports.checkTicket(req, res);
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
        // Return limited info for staff (including profile_image for display)
        const sanitizedUsers = users.map(u => ({
            id: u.id,
            first_name: u.first_name,
            last_name: u.last_name,
            username: u.username,
            email: u.email,
            role: u.role,
            is_active: u.is_active,
            created_at: u.created_at,
            profile_image: u.profile_image
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

// ==========================================
// USER SUSPENSION / BAN ENDPOINTS (Staff)
// ==========================================

// Suspend user (staff can only suspend regular users)
exports.suspendUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ success: false, message: 'Suspension reason is required' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Staff can only suspend regular users
        if (user.role !== 'user') {
            return res.status(403).json({ success: false, message: 'Staff can only suspend regular users' });
        }

        const suspended = await User.suspendUser(id, req.user.id, reason.trim());
        
        if (!suspended) {
            return res.status(500).json({ success: false, message: 'Failed to suspend user' });
        }

        res.json({ success: true, message: 'User suspended successfully' });
    } catch (error) {
        console.error('Error suspending user:', error);
        res.status(500).json({ success: false, message: 'Error suspending user' });
    }
};

// Unsuspend user
exports.unsuspendUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Staff can only unsuspend regular users
        if (user.role !== 'user') {
            return res.status(403).json({ success: false, message: 'Staff can only manage regular users' });
        }

        const unsuspended = await User.unsuspendUser(id);
        
        if (!unsuspended) {
            return res.status(500).json({ success: false, message: 'Failed to unsuspend user' });
        }

        res.json({ success: true, message: 'User unsuspended successfully' });
    } catch (error) {
        console.error('Error unsuspending user:', error);
        res.status(500).json({ success: false, message: 'Error unsuspending user' });
    }
};

// Get pending appeals (for staff review)
exports.getPendingAppeals = async (req, res) => {
    try {
        const appeals = await User.getPendingAppeals();
        res.json({ success: true, appeals });
    } catch (error) {
        console.error('Error getting pending appeals:', error);
        res.status(500).json({ success: false, message: 'Error fetching appeals' });
    }
};

// Review appeal (staff)
exports.reviewAppeal = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminResponse } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const appeal = await User.getAppealById(id);
        if (!appeal) {
            return res.status(404).json({ success: false, message: 'Appeal not found' });
        }

        const reviewed = await User.reviewAppeal(id, req.user.id, status, adminResponse);
        
        if (!reviewed) {
            return res.status(500).json({ success: false, message: 'Failed to review appeal' });
        }

        // If approved, automatically unsuspend the user
        if (status === 'approved') {
            await User.unsuspendUser(appeal.user_id);
        }

        res.json({ success: true, message: `Appeal ${status} successfully` });
    } catch (error) {
        console.error('Error reviewing appeal:', error);
        res.status(500).json({ success: false, message: 'Error reviewing appeal' });
    }
};

// ==========================================
// TICKET MANAGEMENT ENDPOINTS (Staff)
// ==========================================

// Mark ticket as paid
exports.markTicketAsPaid = async (req, res) => {
    try {
        const { id } = req.params;
        
        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const marked = await Ticket.markAsPaid(id, req.user.id);
        
        if (!marked) {
            return res.status(500).json({ success: false, message: 'Failed to mark ticket as paid' });
        }

        res.json({ success: true, message: 'Ticket marked as paid successfully' });
    } catch (error) {
        console.error('Error marking ticket as paid:', error);
        res.status(500).json({ success: false, message: 'Error updating ticket payment status' });
    }
};

// Update resident verification status
exports.updateVerificationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const updated = await Ticket.updateVerificationStatus(id, status);
        
        if (!updated) {
            return res.status(500).json({ success: false, message: 'Failed to update verification status' });
        }

        // If approved and ticket is pending, confirm it
        if (status === 'approved' && ticket.status === 'pending') {
            await Ticket.updateStatus(id, 'confirmed');
        }

        res.json({ success: true, message: 'Verification status updated successfully' });
    } catch (error) {
        console.error('Error updating verification status:', error);
        res.status(500).json({ success: false, message: 'Error updating verification status' });
    }
};