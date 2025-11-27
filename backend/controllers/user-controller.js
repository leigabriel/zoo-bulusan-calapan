const Animal = require('../models/animal-model');
const Ticket = require('../models/ticket-model');
const Event = require('../models/event-model');
const User = require('../models/user-model');
const crypto = require('crypto');

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

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
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
        const events = await Event.getUpcoming();
        res.json({ success: true, events });
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({ success: false, message: 'Error fetching events' });
    }
};

exports.purchaseTicket = async (req, res) => {
    try {
        const { ticketType, quantity, visitDate } = req.body;

        if (!ticketType || !quantity || !visitDate) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const prices = {
            adult: 150,
            child: 100,
            senior: 120,
            family: 450,
            resident: 0
        };

        const price = prices[ticketType] !== undefined ? prices[ticketType] : 150;
        const totalPrice = price * quantity;
        const ticketCode = crypto.randomBytes(8).toString('hex').toUpperCase();

        // Ensure we send the exact field names the Ticket model expects
        const ticketId = await Ticket.create({
            userId: req.user.id,
            bookingReference: ticketCode,
            visitorEmail: req.user.email || null,
            ticketType,
            quantity,
            pricePerTicket: price,
            totalAmount: totalPrice,
            visitDate,
            status: 'confirmed'
        });

        res.status(201).json({
            success: true,
            message: 'Ticket purchased successfully',
            ticket: {
                id: ticketId,
                ticketCode,
                ticketType,
                quantity,
                totalPrice,
                visitDate,
                status: 'confirmed'
            }
        });
    } catch (error) {
        console.error('Error purchasing ticket:', error);
        res.status(500).json({ success: false, message: 'Error purchasing ticket' });
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
