const Animal = require('../models/animal-model');
const Ticket = require('../models/ticket-model');
const Event = require('../models/event-model');

exports.getDashboardStats = async (req, res) => {
    try {
        const [
            totalAnimals,
            healthyAnimals,
            criticalAnimals,
            activeTickets,
            upcomingEvents
        ] = await Promise.all([
            Animal.count(),
            Animal.countByStatus('healthy'),
            Animal.countByStatus('critical'),
            Ticket.countByStatus('active'),
            Event.countUpcoming()
        ]);

        res.json({
            success: true,
            stats: {
                totalAnimals,
                healthyAnimals,
                criticalAnimals,
                activeTickets,
                upcomingEvents
            }
        });
    } catch (error) {
        console.error('Error getting staff dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboard stats' });
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

        const result = await Ticket.validateTicket(code);
        
        if (!result.valid) {
            return res.status(400).json({ success: false, message: result.message });
        }

        res.json({
            success: true,
            message: result.message,
            ticket: result.ticket
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

exports.getUpcomingEvents = async (req, res) => {
    try {
        const events = await Event.getUpcoming();
        res.json({ success: true, events });
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({ success: false, message: 'Error fetching events' });
    }
};
