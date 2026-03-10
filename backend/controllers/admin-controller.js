const User = require('../models/user-model');
const Animal = require('../models/animal-model');
const Ticket = require('../models/ticket-model');
const Event = require('../models/event-model');
const Notification = require('../models/notification-model');
const Plant = require('../models/plant-model');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Helper to get date range based on period
const getDateRange = (period) => {
    const now = new Date();
    let startDate;
    
    switch (period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = null;
    }
    
    return startDate;
};

exports.getDashboardStats = async (req, res) => {
    try {
        const { period = 'today' } = req.query;
        const startDate = getDateRange(period);
        
        // For counts that should be filtered by period
        let ticketsQuery, revenueQuery;
        
        if (startDate) {
            const dateStr = startDate.toISOString().slice(0, 19).replace('T', ' ');
            const [ticketsResult] = await db.query(
                'SELECT COUNT(*) as count FROM ticket_reservations WHERE created_at >= ?',
                [dateStr]
            );
            const [revenueResult] = await db.query(
                `SELECT COALESCE(SUM((adult_quantity * 40) + (child_quantity * 20)), 0) as total 
                 FROM ticket_reservations 
                 WHERE status IN ('confirmed', 'completed') AND created_at >= ?`,
                [dateStr]
            );
            ticketsQuery = ticketsResult[0]?.count || 0;
            revenueQuery = revenueResult[0]?.total || 0;
        } else {
            ticketsQuery = await Ticket.count();
            revenueQuery = await Ticket.getTotalRevenue();
        }

        const [
            totalUsers,
            totalAnimals,
            totalPlants,
            activeTickets,
            upcomingEvents
        ] = await Promise.all([
            User.count(),
            Animal.count(),
            Plant.count(),
            Ticket.countByStatus('confirmed'),
            Event.countUpcoming()
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers: Number(totalUsers) || 0,
                totalAnimals: Number(totalAnimals) || 0,
                totalPlants: Number(totalPlants) || 0,
                totalTickets: Number(ticketsQuery) || 0,
                totalRevenue: Number(revenueQuery) || 0,
                activeTickets: Number(activeTickets) || 0,
                upcomingEvents: Number(upcomingEvents) || 0
            },
            period
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboard stats' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ success: false, message: 'Error fetching users' });
    }
};

exports.getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;
        const users = await User.getByRole(role);
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error getting users by role:', error);
        res.status(500).json({ success: false, message: 'Error fetching users' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { firstName, lastName, username, email, password, role, phoneNumber, gender, birthday } = req.body;

        if (!firstName || !lastName || !username || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const existingUsername = await User.findByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userId = await User.create({
            firstName,
            lastName,
            username,
            email,
            phoneNumber: phoneNumber || null,
            gender: gender || 'prefer_not_to_say',
            birthday: birthday || null,
            password: hashedPassword,
            role: role || 'user'
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            userId
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, message: 'Error creating user' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, username, email, phoneNumber, gender, birthday, role } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const updated = await User.update(id, { 
            firstName: firstName || user.first_name,
            lastName: lastName || user.last_name,
            username: username || user.username,
            email: email || user.email,
            phoneNumber: phoneNumber !== undefined ? phoneNumber : user.phone_number,
            gender: gender || user.gender,
            birthday: birthday || user.birthday,
            role: role || user.role
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Failed to update user' });
        }

        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Error updating user' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await User.delete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Error deleting user' });
    }
};

exports.getAllAnimals = async (req, res) => {
    try {
        const animals = await Animal.getAll();
        res.json({ success: true, animals });
    } catch (error) {
        console.error('Error getting animals:', error);
        res.status(500).json({ success: false, message: 'Error fetching animals' });
    }
};

exports.createAnimal = async (req, res) => {
    try {
        const animalId = await Animal.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Animal created successfully',
            animalId
        });
    } catch (error) {
        console.error('Error creating animal:', error);
        res.status(500).json({ success: false, message: 'Error creating animal' });
    }
};

exports.updateAnimal = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Animal.update(id, req.body);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Animal not found' });
        }

        res.json({ success: true, message: 'Animal updated successfully' });
    } catch (error) {
        console.error('Error updating animal:', error);
        res.status(500).json({ success: false, message: 'Error updating animal' });
    }
};

exports.deleteAnimal = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Animal.delete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Animal not found' });
        }

        res.json({ success: true, message: 'Animal deleted successfully' });
    } catch (error) {
        console.error('Error deleting animal:', error);
        res.status(500).json({ success: false, message: 'Error deleting animal' });
    }
};

exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.getAll();
        res.json({ success: true, events });
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({ success: false, message: 'Error fetching events' });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const eventId = await Event.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            eventId
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ success: false, message: 'Error creating event' });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Event.update(id, req.body);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.json({ success: true, message: 'Event updated successfully' });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ success: false, message: 'Error updating event' });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Event.delete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ success: false, message: 'Error deleting event' });
    }
};

// plant crud
exports.getAllPlants = async (req, res) => {
    try {
        const plants = await Plant.getAll();
        res.json({ success: true, plants });
    } catch (error) {
        console.error('Error getting plants:', error);
        res.status(500).json({ success: false, message: 'Error fetching plants' });
    }
};

exports.createPlant = async (req, res) => {
    try {
        const plantId = await Plant.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Plant created successfully',
            plantId
        });
    } catch (error) {
        console.error('Error creating plant:', error);
        res.status(500).json({ success: false, message: 'Error creating plant' });
    }
};

exports.updatePlant = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Plant.update(id, req.body);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Plant not found' });
        }

        res.json({ success: true, message: 'Plant updated successfully' });
    } catch (error) {
        console.error('Error updating plant:', error);
        res.status(500).json({ success: false, message: 'Error updating plant' });
    }
};

exports.deletePlant = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Plant.delete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Plant not found' });
        }

        res.json({ success: true, message: 'Plant deleted successfully' });
    } catch (error) {
        console.error('Error deleting plant:', error);
        res.status(500).json({ success: false, message: 'Error deleting plant' });
    }
};

exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.getAll();
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

        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Error getting ticket:', error);
        res.status(500).json({ success: false, message: 'Error fetching ticket' });
    }
};

exports.updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancellationReason } = req.body;

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (status === 'cancelled' && cancellationReason) {
            updateData.cancellationReason = cancellationReason;
        }
        updateData.confirmedBy = req.user.id;

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

// Helper to format date in local timezone
const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

exports.getRevenueReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate || formatLocalDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        const end = endDate || formatLocalDate(new Date());

        const revenueData = await Ticket.getRevenueByDateRange(start, end);
        const totalRevenue = await Ticket.getTotalRevenue();

        res.json({
            success: true,
            data: revenueData,
            totalRevenue,
            period: { startDate: start, endDate: end }
        });
    } catch (error) {
        console.error('Error getting revenue report:', error);
        res.status(500).json({ success: false, message: 'Error fetching revenue report' });
    }
};

// Comprehensive analytics endpoint
exports.getAnalytics = async (req, res) => {
    try {
        const { timeRange = 'week' } = req.query;

        // Get all analytics data in parallel - pass timeRange for proper filtering
        const [
            weeklyData,
            monthlyData,
            ticketDistribution,
            dailyComparison,
            totalUsers,
            totalAnimals,
            totalTickets,
            totalRevenue,
            upcomingEvents,
            timeRangeStats
        ] = await Promise.all([
            Ticket.getWeeklyAnalytics(timeRange),
            Ticket.getMonthlyAnalytics(timeRange),
            Ticket.getTicketTypeDistribution(timeRange),
            Ticket.getDailyComparison(),
            User.count(),
            Animal.count(),
            Ticket.count(),
            Ticket.getTotalRevenue(),
            Event.countUpcoming(),
            Ticket.getStatsForTimeRange(timeRange)
        ]);

        // Calculate growth rates
        const ticketGrowth = dailyComparison.yesterday_tickets > 0 
            ? ((dailyComparison.today_tickets - dailyComparison.yesterday_tickets) / dailyComparison.yesterday_tickets * 100).toFixed(1)
            : 0;
        const revenueGrowth = dailyComparison.yesterday_revenue > 0 
            ? ((dailyComparison.today_revenue - dailyComparison.yesterday_revenue) / dailyComparison.yesterday_revenue * 100).toFixed(1)
            : 0;

        res.json({
            success: true,
            data: {
                summary: {
                    totalUsers,
                    totalAnimals,
                    // Use timeRange-specific stats for filtered view
                    totalTickets: timeRangeStats.totalTickets || totalTickets,
                    totalRevenue: parseFloat(timeRangeStats.totalRevenue) || totalRevenue,
                    upcomingEvents,
                    todayTickets: dailyComparison.today_tickets,
                    todayRevenue: dailyComparison.today_revenue,
                    ticketGrowth: parseFloat(ticketGrowth),
                    revenueGrowth: parseFloat(revenueGrowth),
                    timeRange // Include current filter in response
                },
                weeklyData: weeklyData.map(d => ({
                    day: d.day?.substring(0, 3) || 'N/A',
                    date: d.date,
                    tickets: d.tickets,
                    visitors: d.visitors,
                    revenue: parseFloat(d.revenue) || 0
                })),
                monthlyData: monthlyData.map(d => ({
                    month: d.monthName,
                    tickets: d.tickets,
                    visitors: d.visitors,
                    revenue: parseFloat(d.revenue) || 0
                })),
                ticketDistribution: ticketDistribution.map(d => ({
                    type: d.type,
                    count: d.count,
                    revenue: parseFloat(d.revenue) || 0
                }))
            }
        });
    } catch (error) {
        console.error('Error getting analytics:', error);
        res.status(500).json({ success: false, message: 'Error fetching analytics data' });
    }
};

// Comprehensive Report Data endpoint
exports.getReportData = async (req, res) => {
    try {
        const { startDate, endDate, reportType = 'sales' } = req.query;
        
        // Default to last 30 days if no date range provided
        const now = new Date();
        const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        const start = startDate || formatLocalDate(defaultStart);
        const end = endDate || formatLocalDate(now);

        // Query for report items based on report type
        let items = [];
        let totalRevenue = 0;
        let ticketsSold = 0;
        let visitors = 0;

        if (reportType === 'sales' || reportType === 'tickets') {
            // Get detailed ticket data for the date range
            const [rows] = await db.query(
                `SELECT 
                    DATE(tr.created_at) as date,
                    tr.reservation_reference,
                    tr.visitor_name,
                    tr.adult_quantity,
                    tr.child_quantity,
                    tr.bulusan_resident_quantity,
                    tr.total_visitors,
                    tr.status,
                    (tr.adult_quantity * 40) + (tr.child_quantity * 20) as amount
                 FROM ticket_reservations tr
                 WHERE DATE(tr.created_at) BETWEEN ? AND ?
                 ORDER BY tr.created_at DESC
                 LIMIT 100`,
                [start, end]
            );

            // Transform to report items
            for (const row of rows) {
                if (row.adult_quantity > 0) {
                    items.push({
                        date: formatLocalDate(new Date(row.date)),
                        type: 'Adult Ticket',
                        quantity: row.adult_quantity,
                        amount: row.adult_quantity * 40,
                        status: row.status === 'completed' || row.status === 'confirmed' ? 'Completed' : 
                               row.status === 'cancelled' ? 'Cancelled' : 'Pending',
                        reference: row.reservation_reference
                    });
                }
                if (row.child_quantity > 0) {
                    items.push({
                        date: formatLocalDate(new Date(row.date)),
                        type: 'Child Ticket',
                        quantity: row.child_quantity,
                        amount: row.child_quantity * 20,
                        status: row.status === 'completed' || row.status === 'confirmed' ? 'Completed' : 
                               row.status === 'cancelled' ? 'Cancelled' : 'Pending',
                        reference: row.reservation_reference
                    });
                }
                if (row.bulusan_resident_quantity > 0) {
                    items.push({
                        date: formatLocalDate(new Date(row.date)),
                        type: 'Bulusan Resident',
                        quantity: row.bulusan_resident_quantity,
                        amount: 0,
                        status: row.status === 'completed' || row.status === 'confirmed' ? 'Completed' : 
                               row.status === 'cancelled' ? 'Cancelled' : 'Pending',
                        reference: row.reservation_reference
                    });
                }
            }

            // Get totals for the date range
            const [totals] = await db.query(
                `SELECT 
                    COALESCE(SUM((adult_quantity * 40) + (child_quantity * 20)), 0) as totalRevenue,
                    COALESCE(SUM(adult_quantity + child_quantity + bulusan_resident_quantity), 0) as ticketsSold,
                    COALESCE(SUM(total_visitors), 0) as visitors
                 FROM ticket_reservations
                 WHERE DATE(created_at) BETWEEN ? AND ?
                 AND status NOT IN ('cancelled', 'no_show')`,
                [start, end]
            );

            totalRevenue = parseFloat(totals[0]?.totalRevenue) || 0;
            ticketsSold = parseInt(totals[0]?.ticketsSold) || 0;
            visitors = parseInt(totals[0]?.visitors) || 0;

        } else if (reportType === 'visitors') {
            // Get visitor data grouped by date
            const [rows] = await db.query(
                `SELECT 
                    DATE(reservation_date) as date,
                    SUM(total_visitors) as visitors,
                    SUM(adult_quantity) as adults,
                    SUM(child_quantity) as children,
                    SUM(bulusan_resident_quantity) as residents,
                    COUNT(*) as reservations
                 FROM ticket_reservations
                 WHERE DATE(reservation_date) BETWEEN ? AND ?
                 AND status IN ('confirmed', 'completed')
                 GROUP BY DATE(reservation_date)
                 ORDER BY date DESC`,
                [start, end]
            );

            items = rows.map(row => ({
                date: formatLocalDate(new Date(row.date)),
                type: 'Daily Visitors',
                quantity: parseInt(row.visitors) || 0,
                amount: 0,
                status: 'Completed',
                details: `${row.adults || 0} adults, ${row.children || 0} children, ${row.residents || 0} residents`
            }));

            const [totals] = await db.query(
                `SELECT 
                    COALESCE(SUM(total_visitors), 0) as visitors,
                    COUNT(*) as ticketsSold
                 FROM ticket_reservations
                 WHERE DATE(reservation_date) BETWEEN ? AND ?
                 AND status IN ('confirmed', 'completed')`,
                [start, end]
            );

            visitors = parseInt(totals[0]?.visitors) || 0;
            ticketsSold = parseInt(totals[0]?.ticketsSold) || 0;

        } else if (reportType === 'events') {
            // Get event data
            const [rows] = await db.query(
                `SELECT 
                    id,
                    title,
                    DATE(event_date) as date,
                    status,
                    created_at
                 FROM events
                 WHERE DATE(event_date) BETWEEN ? AND ?
                 ORDER BY event_date DESC`,
                [start, end]
            );

            items = rows.map(row => ({
                date: formatLocalDate(new Date(row.date)),
                type: 'Event',
                quantity: 1,
                amount: 0,
                status: row.status === 'active' ? 'Active' : 
                       row.status === 'completed' ? 'Completed' : 'Cancelled',
                name: row.title
            }));
        }

        res.json({
            success: true,
            data: {
                totalRevenue,
                ticketsSold,
                visitors,
                items,
                period: { startDate: start, endDate: end },
                reportType
            }
        });

    } catch (error) {
        console.error('Error generating report data:', error);
        res.status(500).json({ success: false, message: 'Error generating report data' });
    }
};

// Get quick stats for reports page
exports.getQuickStats = async (req, res) => {
    try {
        const [stats] = await db.query(
            `SELECT 
                COALESCE(SUM((adult_quantity * 40) + (child_quantity * 20)), 0) as totalRevenue,
                COALESCE(SUM(adult_quantity + child_quantity + bulusan_resident_quantity), 0) as ticketsSold,
                COALESCE(SUM(total_visitors), 0) as visitors
             FROM ticket_reservations
             WHERE status NOT IN ('cancelled', 'no_show')`
        );

        res.json({
            success: true,
            data: {
                totalRevenue: parseFloat(stats[0]?.totalRevenue) || 0,
                ticketsSold: parseInt(stats[0]?.ticketsSold) || 0,
                visitors: parseInt(stats[0]?.visitors) || 0
            }
        });
    } catch (error) {
        console.error('Error getting quick stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching quick stats' });
    }
};

// Model Management
const fs = require('fs');
const path = require('path');

exports.uploadModel = async (req, res) => {
    try {
        const modelJson = req.files['modelJson'] ? req.files['modelJson'][0] : null;
        const weights = req.files['weights'] || [];

        if (!modelJson) {
            return res.status(400).json({ 
                success: false, 
                message: 'model.json file is required' 
            });
        }

        if (weights.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'At least one weight file (.bin) is required' 
            });
        }

        // Log upload details
        console.log('Model upload successful:');
        console.log('- Model JSON:', modelJson.filename);
        console.log('- Weight files:', weights.map(w => w.filename).join(', '));

        res.json({
            success: true,
            message: 'Model uploaded successfully',
            files: {
                modelJson: modelJson.filename,
                weights: weights.map(w => w.filename)
            }
        });
    } catch (error) {
        console.error('Error uploading model:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Error uploading model' 
        });
    }
};

exports.getModelInfo = async (req, res) => {
    try {
        const modelsPath = path.join(__dirname, '../../frontend/public/models');
        const modelJsonPath = path.join(modelsPath, 'model.json');

        // Check if model.json exists
        if (!fs.existsSync(modelJsonPath)) {
            return res.status(404).json({
                success: false,
                message: 'No model found'
            });
        }

        // Read model.json to get info
        const modelData = JSON.parse(fs.readFileSync(modelJsonPath, 'utf-8'));
        
        // Get list of weight files
        const files = fs.readdirSync(modelsPath);
        const weightFiles = files.filter(f => f.endsWith('.bin'));
        
        // Get model file stats
        const stats = fs.statSync(modelJsonPath);

        res.json({
            success: true,
            modelInfo: {
                path: '/models/model.json',
                weightFiles: weightFiles.length,
                lastModified: stats.mtime,
                format: modelData.format || 'unknown',
                generatedBy: modelData.generatedBy || 'unknown'
            }
        });
    } catch (error) {
        console.error('Error getting model info:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching model info' 
        });
    }
};

// Upload image for animals/events
// Supports both Cloudinary (cloud storage) and local file storage
// Cloudinary is used if configured, otherwise falls back to local storage
exports.uploadImage = async (req, res) => {
    try {
        // Check if Cloudinary upload was performed
        if (req.cloudinaryResult) {
            return res.json({
                success: true,
                message: 'Image uploaded to cloud storage successfully',
                imageUrl: req.cloudinaryResult.secure_url,
                publicId: req.cloudinaryResult.public_id,
                storage: 'cloudinary'
            });
        }

        // Fallback to local file storage
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // Build the image URL - use BACKEND_URL env var if available for production
        let imageUrl;
        if (process.env.BACKEND_URL) {
            imageUrl = `${process.env.BACKEND_URL}/uploads/${req.file.filename}`;
        } else {
            const protocol = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
            const host = req.get('host');
            imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
        }

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: imageUrl,
            filename: req.file.filename,
            storage: 'local'
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading image'
        });
    }
};

// Get dashboard notifications
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id || null;
        const result = await Notification.generateDashboardNotifications(userId);
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

// user suspension

// suspend user
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

        // Prevent suspending admins
        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot suspend admin users' });
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

// Get all suspended users
exports.getSuspendedUsers = async (req, res) => {
    try {
        const users = await User.getSuspendedUsers();
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error getting suspended users:', error);
        res.status(500).json({ success: false, message: 'Error fetching suspended users' });
    }
};

// Get pending appeals
exports.getPendingAppeals = async (req, res) => {
    try {
        const appeals = await User.getPendingAppeals();
        res.json({ success: true, appeals });
    } catch (error) {
        console.error('Error getting pending appeals:', error);
        res.status(500).json({ success: false, message: 'Error fetching appeals' });
    }
};

// Review appeal
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

// ticket management

// mark ticket as paid
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

// Export tickets data
exports.exportTickets = async (req, res) => {
    try {
        const { startDate, endDate, format = 'json' } = req.query;
        
        let tickets;
        if (startDate && endDate) {
            tickets = await Ticket.getByDateRange(startDate, endDate);
        } else {
            tickets = await Ticket.getAll();
        }

        if (format === 'csv') {
            // Generate CSV
            const headers = ['ID', 'Reference', 'Visitor Name', 'Email', 'Adults', 'Children', 'Residents', 'Total Visitors', 'Reservation Date', 'Status', 'Created At'];
            const csvRows = [headers.join(',')];
            
            tickets.forEach(t => {
                const row = [
                    t.id,
                    t.booking_reference || t.reservation_reference,
                    `"${(t.user_name || t.visitor_name || '').replace(/"/g, '""')}"`,
                    t.user_email || t.visitor_email || '',
                    t.adult_quantity || 0,
                    t.child_quantity || 0,
                    t.bulusan_resident_quantity || 0,
                    t.total_visitors || 0,
                    t.reservation_date ? (t.reservation_date instanceof Date ? t.reservation_date.toISOString().split('T')[0] : t.reservation_date) : '',
                    t.status,
                    t.created_at ? (t.created_at instanceof Date ? t.created_at.toISOString() : t.created_at) : ''
                ];
                csvRows.push(row.join(','));
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=tickets_export_${Date.now()}.csv`);
            return res.send(csvRows.join('\n'));
        }

        res.json({ success: true, tickets, count: tickets.length });
    } catch (error) {
        console.error('Error exporting tickets:', error);
        res.status(500).json({ success: false, message: 'Error exporting tickets' });
    }
};

// Get user details by ID (for view user modal)
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get user's ticket count
        const userTickets = await Ticket.findByUserId(id);

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
                isActive: user.is_active,
                isSuspended: user.is_suspended,
                suspensionReason: user.suspension_reason,
                suspendedAt: user.suspended_at,
                createdAt: user.created_at,
                ticketCount: userTickets ? userTickets.length : 0
            }
        });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ success: false, message: 'Error fetching user' });
    }
};