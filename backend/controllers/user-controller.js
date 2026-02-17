const Animal = require('../models/animal-model');
const Ticket = require('../models/ticket-model');
const Event = require('../models/event-model');
const User = require('../models/user-model');
const crypto = require('crypto');
const { saveBase64Image } = require('../middleware/upload-resident-id');

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
        const { tickets, ticketType, quantity, visitDate, paymentMethod, visitorEmail, visitorName, companions, totalAmount, residentIdImage } = req.body;

        const prices = {
            adult: 40,
            child: 20,
            senior: 30,
            student: 25,
            resident: 0
        };

        const bookingReference = 'ZB-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const qrCodeData = crypto.randomBytes(16).toString('hex').toUpperCase();

        const paymentMethodMap = {
            'pay_at_park': 'cash',
            'gcash': 'gcash',
            'paypal': 'online',
            'free': 'cash'
        };
        const mappedPaymentMethod = paymentMethodMap[paymentMethod] || paymentMethod || 'cash';

        let savedResidentIdImage = null;
        if (residentIdImage) {
            savedResidentIdImage = await saveBase64Image(residentIdImage, req.user.id);
        }

        const db = require('../config/database');
        const user = await User.findById(req.user.id);
        const buyerName = visitorName || (user ? `${user.first_name} ${user.last_name}` : 'Guest');

        if (tickets && Array.isArray(tickets) && tickets.length > 0) {
            if (!visitDate) {
                return res.status(400).json({ success: false, message: 'Please provide visit date' });
            }

            const hasResidentOrStudent = tickets.some(t => t.ticketType === 'resident' || t.ticketType === 'student');
            if (hasResidentOrStudent && !residentIdImage) {
                return res.status(400).json({ success: false, message: 'Resident or student tickets require a valid ID image for verification' });
            }

            let calculatedTotal = 0;
            let totalQuantity = 0;
            const ticketDetails = [];

            for (const item of tickets) {
                const price = prices[item.ticketType] !== undefined ? prices[item.ticketType] : 40;
                const itemTotal = price * item.quantity;
                calculatedTotal += itemTotal;
                totalQuantity += item.quantity;
                ticketDetails.push(`${item.quantity}x ${item.ticketType}`);
            }

            const finalTotal = totalAmount !== undefined ? totalAmount : calculatedTotal;

            let paymentStatus = 'pending';
            if (finalTotal === 0) {
                paymentStatus = 'free';
            } else if (mappedPaymentMethod === 'gcash' || mappedPaymentMethod === 'online') {
                paymentStatus = 'paid';
            } else if (mappedPaymentMethod === 'cash') {
                paymentStatus = 'not_paid';
            }

            const ticketStatus = 'pending';
            const ticketTypesSummary = ticketDetails.join(', ');
            const primaryType = tickets[0].ticketType;

            const [result] = await db.query(
                `INSERT INTO tickets (
                    booking_reference, user_id, visitor_email, visitor_name, visit_date, 
                    ticket_type, quantity, price_per_ticket, total_amount, status, 
                    qr_code, payment_status, payment_method, resident_id_image, verification_status, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    bookingReference,
                    req.user.id,
                    visitorEmail || req.user.email || null,
                    buyerName,
                    visitDate,
                    primaryType,
                    totalQuantity,
                    0,
                    finalTotal,
                    ticketStatus,
                    qrCodeData,
                    paymentStatus,
                    mappedPaymentMethod,
                    savedResidentIdImage,
                    hasResidentOrStudent ? 'pending' : null,
                    ticketTypesSummary
                ]
            );

            const ticketId = result.insertId;

            let confirmationMessage = 'Tickets booked successfully! Your booking is pending approval.';
            if (hasResidentOrStudent) {
                confirmationMessage = 'Tickets booked! Your ID will be verified by our staff before confirmation.';
            } else if (mappedPaymentMethod === 'cash') {
                confirmationMessage = 'Tickets booked successfully! Please pay at Bulusan Zoo when you arrive.';
            } else if (mappedPaymentMethod === 'gcash' || mappedPaymentMethod === 'online') {
                confirmationMessage = 'Payment received! Your tickets are pending admin confirmation.';
            }

            return res.status(201).json({
                success: true,
                message: confirmationMessage,
                bookingReference: bookingReference,
                ticket: {
                    id: ticketId,
                    bookingReference: bookingReference,
                    qrCode: qrCodeData,
                    tickets: tickets,
                    quantity: totalQuantity,
                    totalPrice: finalTotal,
                    visitDate,
                    status: ticketStatus,
                    paymentStatus: paymentStatus,
                    paymentMethod: mappedPaymentMethod
                }
            });
        }

        if (!ticketType || !quantity || !visitDate) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        if (ticketType === 'resident' && !residentIdImage) {
            return res.status(400).json({ success: false, message: 'Bulusan resident tickets require a valid ID image for verification' });
        }

        if (ticketType === 'student' && !residentIdImage) {
            return res.status(400).json({ success: false, message: 'Student tickets require a valid student ID image for verification' });
        }

        const price = prices[ticketType] !== undefined ? prices[ticketType] : 40;
        const totalPrice = price * quantity;

        let paymentStatus = 'pending';
        if (ticketType === 'resident' || price === 0) {
            paymentStatus = 'free';
        } else if (mappedPaymentMethod === 'gcash' || mappedPaymentMethod === 'online') {
            paymentStatus = 'paid';
        } else if (mappedPaymentMethod === 'cash') {
            paymentStatus = 'not_paid';
        }

        const ticketStatus = 'pending';

        const [result] = await db.query(
            `INSERT INTO tickets (
                booking_reference, user_id, visitor_email, visitor_name, visit_date, 
                ticket_type, quantity, price_per_ticket, total_amount, status, 
                qr_code, payment_status, payment_method, resident_id_image, verification_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                bookingReference,
                req.user.id,
                visitorEmail || req.user.email || null,
                buyerName,
                visitDate,
                ticketType,
                quantity,
                price,
                totalPrice,
                ticketStatus,
                qrCodeData,
                paymentStatus,
                mappedPaymentMethod,
                savedResidentIdImage,
                (ticketType === 'resident' || ticketType === 'student') ? 'pending' : null
            ]
        );

        const ticketId = result.insertId;

        let confirmationMessage = 'Ticket booked successfully! Your ticket is pending approval.';
        if (ticketType === 'resident') {
            confirmationMessage = 'Free resident ticket booked! Your ID will be verified by our staff before confirmation.';
        } else if (ticketType === 'student') {
            confirmationMessage = 'Student ticket booked! Your student ID will be verified by our staff before confirmation.';
        } else if (mappedPaymentMethod === 'cash') {
            confirmationMessage = 'Ticket booked successfully! Please pay at Bulusan Zoo when you arrive. Your ticket is pending confirmation.';
        } else if (mappedPaymentMethod === 'gcash' || mappedPaymentMethod === 'online') {
            confirmationMessage = 'Payment received! Your ticket is pending admin confirmation.';
        }

        res.status(201).json({
            success: true,
            message: confirmationMessage,
            bookingReference: bookingReference,
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
                isFree: price === 0,
                requiresVerification: ticketType === 'resident' || ticketType === 'student'
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

// ==========================================
// TICKET ARCHIVE ENDPOINTS
// ==========================================

// Get active (non-archived) tickets
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

// ==========================================
// APPEAL ENDPOINTS (for suspended users)
// ==========================================

// Submit an appeal
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