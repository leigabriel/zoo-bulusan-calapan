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

exports.purchaseTicket = async (req, res) => {
    try {
        const { ticketType, quantity, visitDate, paymentMethod, visitorEmail, visitorName, companions } = req.body;

        if (!ticketType || !quantity || !visitDate) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        // Ticket pricing
        const prices = {
            adult: 40,
            child: 20,
            senior: 30,
            student: 25,
            resident: 0  // Free for residents
        };

        const price = prices[ticketType] !== undefined ? prices[ticketType] : 40;
        const totalPrice = price * quantity;
        
        // Generate unique booking reference
        const bookingReference = 'ZB-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        
        // Generate unique QR code data
        const qrCodeData = crypto.randomBytes(16).toString('hex').toUpperCase();

        // Determine payment status for free tickets
        let paymentStatus = 'pending';
        if (price === 0) {
            paymentStatus = 'paid'; // Free tickets are automatically "paid"
        }

        // Map payment method from frontend
        const paymentMethodMap = {
            'pay_at_park': 'cash',
            'gcash': 'gcash',
            'paypal': 'paypal',
            'free': 'free'
        };
        const mappedPaymentMethod = paymentMethodMap[paymentMethod] || paymentMethod || 'cash';

        // Determine ticket status
        let ticketStatus = 'pending';
        if (price === 0 || mappedPaymentMethod === 'cash') {
            ticketStatus = 'confirmed'; // Free tickets and pay-at-park are confirmed
        }

        // Create the ticket
        const ticketId = await Ticket.create({
            userId: req.user.id,
            bookingReference: bookingReference,
            visitorEmail: visitorEmail || req.user.email || null,
            visitorName: visitorName || null,
            ticketType,
            quantity,
            pricePerTicket: price,
            totalAmount: totalPrice,
            visitDate,
            status: ticketStatus
        });

        // Update with QR code and payment info
        await Ticket.updateQRCode(ticketId, qrCodeData);
        
        // Update payment status and method
        const db = require('../config/database');
        await db.query(
            'UPDATE tickets SET payment_status = ?, payment_method = ? WHERE id = ?',
            [paymentStatus, mappedPaymentMethod, ticketId]
        );

        res.status(201).json({
            success: true,
            message: price === 0 ? 'Free ticket booked successfully' : 'Ticket purchased successfully',
            ticket: {
                id: ticketId,
                bookingReference: bookingReference,
                qrCode: qrCodeData,
                ticketType,
                quantity,
                pricePerTicket: price,
                totalPrice,
                visitDate,
                status: ticketStatus,
                paymentStatus: paymentStatus,
                paymentMethod: paymentMethod || 'cash',
                isFree: price === 0
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