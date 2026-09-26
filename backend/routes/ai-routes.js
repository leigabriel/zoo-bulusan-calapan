const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { sanitizePlainText } = require('../utils/helpers');
const { buildJijiSystemPrompt } = require('../services/jiji-prompt-service');
const appConfig = require('../config/app-config');

// import models
const Animal = require('../models/animal-model');
const Plant = require('../models/plant-model');
const Event = require('../models/event-model');
const Ticket = require('../models/ticket-model');
const Reservation = require('../models/reservation-model');
const AIAssistSession = require('../models/ai-assist-model');

// load google ai client
let GoogleGenerativeAI = null;
try {
    const gg = require('@google/generative-ai');
    GoogleGenerativeAI = gg && gg.GoogleGenerativeAI ? gg.GoogleGenerativeAI : null;
} catch (err) {
    console.warn('Optional package @google/generative-ai not installed. AI features will use fallback responses.');
}

// verified visitor-facing application information shown on the website About and Help pages
const VISITOR_INFO = {
    facilityName: 'Calapan City Recreational and Zoological Park (Bulusan Park)',
    location: 'Barangay Bulusan, Calapan City, Oriental Mindoro, Philippines',
    operatingHours: '8:00 AM to 5:00 PM daily',
    email: 'info@bulusanwildlife.com',
    phone: '(043) 288-7291'
};

const TICKET_TYPE_LABELS = {
    adult: 'Adult (18+)',
    child: 'Child (4-17)',
    resident: 'Bulusan resident (with valid ID)'
};

const formatTicketPriceLines = () => Object.values(appConfig.ticketTypes)
    .map((ticketType) => {
        const label = TICKET_TYPE_LABELS[ticketType.name] || ticketType.name;
        const isFree = ticketType.price === 'free' || Number(ticketType.price) === 0;
        return `- ${label}: ${isFree ? 'Free' : `P${ticketType.price}`}`;
    })
    .join('\n');

// current application information supplied to Jiji as context data
const buildVisitorInfoContext = () => `

CURRENT APPLICATION VISITOR INFORMATION (verified website information - use this when answering):
- Facility: ${VISITOR_INFO.facilityName}
- Location: ${VISITOR_INFO.location}
- Operating hours: ${VISITOR_INFO.operatingHours}
- Ticket prices (current application configuration):
${formatTicketPriceLines()}
- Email: ${VISITOR_INFO.email}
- Phone: ${VISITOR_INFO.phone}`;

// fetch dynamic zoo data
const getDynamicZooData = async () => {
    try {
        // Fetch animals from database
        const animals = await Animal.getAll();
        const animalCount = animals?.length || 0;

        // Create a summary of animals by category
        const animalsByStatus = {};
        const animalNames = [];
        if (animals && animals.length > 0) {
            animals.forEach(animal => {
                const status = animal.status || 'unknown';
                animalsByStatus[status] = (animalsByStatus[status] || 0) + 1;
                if (animal.name) {
                    animalNames.push(`${animal.name} (${animal.species || 'species unknown'})`);
                }
            });
        }

        let plants = [];
        try {
            plants = await Plant.getAll() || [];
        } catch (e) {
            console.warn('Could not fetch plants:', e.message);
        }

        let upcomingEvents = [];
        try {
            upcomingEvents = await Event.getUpcoming() || [];
        } catch (e) {
            console.warn('Could not fetch events:', e.message);
        }

        let ticketStats = { todayTickets: 0, availableSlots: 'plenty' };
        try {
            const todayTickets = await Ticket.countTodayTickets();
            ticketStats.todayTickets = todayTickets || 0;
            const maxCapacity = 500;
            const remaining = maxCapacity - ticketStats.todayTickets;
            ticketStats.availableSlots = remaining > 100 ? 'plenty' : remaining > 50 ? 'some' : remaining > 0 ? 'limited' : 'sold out';
        } catch (e) {
            console.warn('Could not fetch ticket stats:', e.message);
        }

        const formatDate = (d) => {
            if (!d) return null;
            if (typeof d === 'string') return d.split('T')[0];
            return d;
        };

        return {
            animalCount,
            animalsByStatus,
            animalNames: animalNames.slice(0, 20),
            animalCatalog: (animals || []).slice(0, 8).map(a => ({
                id: a.id,
                name: a.name,
                species: a.species || null,
                exhibit: a.habitat || a.exhibit || null,
                diet: a.diet || null,
                description: a.description || null,
                imageUrl: a.image_url || null,
                status: a.status || 'healthy'
            })),
            plantCatalog: plants.slice(0, 8).map(p => ({
                id: p.id,
                name: p.name,
                scientificName: p.scientific_name || null,
                category: p.category || null,
                description: p.description || null,
                imageUrl: p.image_url || null
            })),
            upcomingEvents,
            eventCatalog: upcomingEvents.slice(0, 5).map(e => ({
                id: e.id,
                title: e.title,
                date: formatDate(e.event_date),
                time: e.start_time || null,
                location: e.location || null,
                description: e.description?.substring(0, 120) || null,
                imageUrl: e.image_url || null,
                status: e.status || 'upcoming'
            })),
            ticketStats
        };
    } catch (error) {
        console.error('Error fetching dynamic zoo data:', error);
        return null;
    }
};

const getCompanionOperationalData = async (dynamicData) => {
    try {
        const [ticketReservations, eventReservations, allEvents] = await Promise.all([
            Reservation.getAllTicketReservations(),
            Reservation.getAllEventReservations(),
            Event.getAll()
        ]);

        const safeDate = (value) => value ? String(value).split('T')[0] : null;
        const safeTickets = (ticketReservations || []).slice(0, 20).map((r) => ({
            kind: 'ticket',
            title: 'Zoo Visit',
            reference: r.reservation_reference || null,
            date: safeDate(r.reservation_date),
            time: r.reservation_time || null,
            visitors: Number(r.total_visitors || 0),
            status: r.status || 'pending'
        }));
        const safeEvents = (eventReservations || []).slice(0, 20).map((r) => ({
            kind: 'event',
            title: r.event_title || 'Event Reservation',
            reference: r.reservation_reference || null,
            date: safeDate(r.venue_event_date || r.event_date),
            time: r.venue_event_time || r.start_time || null,
            participants: Number(r.number_of_participants || 0),
            status: r.status || 'pending'
        }));

        return {
            tickets: safeTickets,
            eventReservations: safeEvents,
            events: (allEvents || dynamicData?.eventCatalog || []).slice(0, 20).map((event) => ({
                id: event.id,
                title: event.title,
                date: event.date || event.event_date,
                time: event.time || event.start_time,
                location: event.location,
                status: event.status || 'upcoming',
                description: event.description?.substring(0, 160) || null
            }))
        };
    } catch (error) {
        console.error('Could not fetch companion operational data:', error.message);
        return { tickets: [], eventReservations: [], events: [] };
    }
};

const buildCompanionCards = (message, dynamicData, operationalData, role = 'staff') => {
    const lowerMsg = String(message || '').toLowerCase();
    const asksList = /\b(list|show|current|existing|pending|upcoming|all|records|data|status)\b/.test(lowerMsg);
    const asksPending = /\b(pending|awaiting|unconfirmed|to review)\b/.test(lowerMsg);
    const cards = [];
    let action = null;
    const add = (items) => items.slice(0, 6).forEach((item) => cards.push(item));

    if (asksList && /\b(ticket|tickets)\b/.test(lowerMsg)) {
        const tickets = asksPending
            ? (operationalData?.tickets || []).filter(ticket => ticket.status === 'pending')
            : (operationalData?.tickets || []);
        add(tickets);
        action = { label: 'Open Reservations', href: `/${role}/reservations`, variant: 'primary' };
    } else if (asksList && /\b(reservation|reservations|booking|bookings)\b/.test(lowerMsg)) {
        const reservations = [...(operationalData?.tickets || []), ...(operationalData?.eventReservations || [])];
        add(asksPending ? reservations.filter(reservation => reservation.status === 'pending') : reservations);
        action = { label: 'Open Reservations', href: `/${role}/reservations`, variant: 'primary' };
    } else if (asksList && /\b(animal|animals|wildlife|species)\b/.test(lowerMsg)) {
        add((dynamicData?.animalCatalog || []).map((animal) => ({ kind: 'animal', ...animal })));
        action = { label: 'Open Animal Records', href: `/${role}/animals`, variant: 'ghost' };
    } else if (asksList && /\b(plant|plants|flora|botanical)\b/.test(lowerMsg)) {
        add((dynamicData?.plantCatalog || []).map((plant) => ({ kind: 'plant', ...plant })));
        action = { label: 'Open Plant Records', href: `/${role}/plants`, variant: 'ghost' };
    } else if (asksList && /\b(event|events|calendar|activity|activities)\b/.test(lowerMsg)) {
        add((operationalData?.events || []).map((event) => ({ kind: 'zoo-event', ...event })));
        action = { label: 'Open Events', href: `/${role}/events`, variant: 'primary' };
    }

    return { cards, action };
};

const getSanitizedUserReservations = async (userId) => {
    if (!userId) return null;
    try {
        const [ticketReservations, eventReservations] = await Promise.all([
            Reservation.findTicketReservationsByUserId(userId),
            Reservation.findEventReservationsByUserId(userId)
        ]);

        const sanitizeTicket = (r) => ({
            type: 'ticket',
            reference: r.reservation_reference || null,
            visitorName: r.visitor_name || null,
            date: r.reservation_date || null,
            time: r.reservation_time || null,
            adults: r.adult_quantity || 0,
            children: r.child_quantity || 0,
            residents: r.bulusan_resident_quantity || 0,
            totalVisitors: r.total_visitors || 0,
            status: r.status || 'pending',
            archived: !!r.is_archived
        });

        const sanitizeEvent = (r) => ({
            type: 'event',
            reference: r.reservation_reference || null,
            eventTitle: r.event_title || r.venue_event_name || null,
            date: r.venue_event_date || r.event_date || null,
            time: r.venue_event_time || r.start_time || null,
            location: r.venue_event_location || r.event_location || null,
            participants: r.number_of_participants || 1,
            status: r.status || 'pending',
            archived: !!r.is_archived
        });

        return {
            tickets: (ticketReservations || []).map(sanitizeTicket),
            events: (eventReservations || []).map(sanitizeEvent)
        };
    } catch (error) {
        console.error('Error fetching user reservations for AI:', error);
        return null;
    }
};

const buildUserReservationContext = (userData) => {
    if (!userData) return '';

    const activeTickets = userData.tickets.filter(t => !t.archived && ['pending', 'confirmed'].includes(t.status));
    const activeEvents = userData.events.filter(e => !e.archived && ['pending', 'confirmed'].includes(e.status));

    let text = `\n\nLOGGED-IN USER RESERVATION DATA (only for the person who is chatting with you):\n`;
    text += `- Active ticket reservations: ${activeTickets.length}\n`;
    text += `- Active event reservations: ${activeEvents.length}`;

    if (activeTickets.length > 0) {
        text += `\nActive tickets:`;
        activeTickets.forEach(t => {
            text += `\n  - Reference ${t.reference}, name ${t.visitorName}, date ${t.date}${t.time ? ` at ${t.time}` : ''}, ${t.totalVisitors} visitor(s), status ${t.status}.`;
        });
    }

    if (activeEvents.length > 0) {
        text += `\nActive events:`;
        activeEvents.forEach(e => {
            text += `\n  - Reference ${e.reference}, event ${e.eventTitle}, ${e.date}${e.time ? ` at ${e.time}` : ''}, ${e.participants} participant(s), status ${e.status}.`;
        });
    }

    if (userData.tickets.length === 0 && userData.events.length === 0) {
        text += `\n(This user has no reservations on record.)`;
    }

    text += `\nAnswer this user's question about their own tickets or reservations using the details above only. If there is no active reservation, say so clearly. Never claim to have reservation data for any other person.`;
    return text;
};

const buildChatCards = (message, userData, dynamicData) => {
    const lowerMsg = String(message || '').toLowerCase();
    const cards = [];
    let action = null;

    const asksReservation = /reservation|ticket|booking|booked|receipt/.test(lowerMsg);
    const asksMine = /\bmy\b|mine/.test(lowerMsg) || /(current|active|upcoming) reservation/.test(lowerMsg);
    const asksToBook = /\b(book|reserve|purchase|buy)\b/.test(lowerMsg);

    if (asksReservation) {
        if (asksMine && userData) {
            (userData.tickets || [])
                .filter(t => !t.archived && ['pending', 'confirmed'].includes(t.status))
                .forEach(t => cards.push({
                    kind: 'ticket',
                    title: 'Zoo Visit',
                    reference: t.reference,
                    name: t.visitorName,
                    date: t.date,
                    time: t.time,
                    adults: t.adults,
                    children: t.children,
                    residents: t.residents,
                    visitors: t.totalVisitors,
                    total: ((t.adults || 0) * 40) + ((t.children || 0) * 20),
                    status: t.status
                }));

            (userData.events || [])
                .filter(e => !e.archived && ['pending', 'confirmed'].includes(e.status))
                .forEach(e => cards.push({
                    kind: 'event',
                    title: e.eventTitle,
                    reference: e.reference,
                    date: e.date,
                    time: e.time,
                    participants: e.participants,
                    status: e.status
                }));

            if (cards.length > 0) {
                action = { label: 'View Reservations', href: '/reservations', variant: 'primary' };
            } else {
                action = { label: 'Open Reservations', href: '/reservations', variant: 'ghost' };
            }
            return { cards, action };
        }

        if (asksMine && !userData) {
            action = { label: 'Sign In', href: '/login', variant: 'primary' };
            return { cards, action };
        }

        if (asksToBook) {
            action = { label: 'Book Now', href: '/reservations', variant: 'primary' };
            return { cards, action };
        }

        return { cards, action };
    }

    const asksAnimals = /\b(animal|animals|wildlife|species|mammal|mammals|reptile|reptiles|bird|birds)\b/.test(lowerMsg);
    const asksPlants = /\b(plant|plants|flora|botanical|botany|tree|trees|endangered)\b/.test(lowerMsg);
    const asksEvents = /\b(event|events|activity|activities|upcoming|calendar)\b/.test(lowerMsg);

    if (dynamicData?.animalCatalog?.length) {
        const matched = dynamicData.animalCatalog.filter(a => a.name && lowerMsg.includes(String(a.name).toLowerCase()));
        if (matched.length > 0) {
            matched.slice(0, 3).forEach(a => cards.push({ kind: 'animal', ...a }));
            action = { label: 'Explore More Animals', href: '/animals', variant: 'ghost' };
            return { cards, action };
        }
    }

    if (asksAnimals && dynamicData?.animalCatalog?.length) {
        dynamicData.animalCatalog.slice(0, 5).forEach(a => cards.push({ kind: 'animal', ...a }));
        action = { label: 'View All Animals', href: '/animals', variant: 'primary' };
        return { cards, action };
    }

    if (dynamicData?.plantCatalog?.length) {
        const matched = dynamicData.plantCatalog.filter(p => p.name && lowerMsg.includes(String(p.name).toLowerCase()));
        if (matched.length > 0) {
            matched.slice(0, 3).forEach(p => cards.push({ kind: 'plant', ...p }));
            action = { label: 'Explore More Plants', href: '/plants', variant: 'ghost' };
            return { cards, action };
        }
    }

    if (asksPlants && dynamicData?.plantCatalog?.length) {
        dynamicData.plantCatalog.slice(0, 5).forEach(p => cards.push({ kind: 'plant', ...p }));
        action = { label: 'View All Plants', href: '/plants', variant: 'primary' };
        return { cards, action };
    }

    if (asksEvents && dynamicData?.eventCatalog?.length) {
        dynamicData.eventCatalog.slice(0, 5).forEach(e => cards.push({ kind: 'zoo-event', ...e }));
        action = { label: 'View Events Calendar', href: '/events', variant: 'primary' };
        return { cards, action };
    }

    return { cards, action };
};

const getUserReservationFallback = (message, userData) => {
    const lowerMsg = String(message || '').toLowerCase();

    const asksReservation = /reservation|ticket|booking|booked/.test(lowerMsg);
    if (!asksReservation) return null;

    const asksOwn = /my\s+(active|current|upcoming|latest|reservation|reservations|ticket|tickets|booking)/.test(lowerMsg)
        || /(my|mine)/.test(lowerMsg);

    if (!asksOwn) return null;

    if (!userData) {
        return 'I can check your reservations for you. Please sign in to your account, then ask me again and I will look up your booking details.';
    }

    const activeTickets = (userData.tickets || []).filter(t => !t.archived && ['pending', 'confirmed'].includes(t.status));
    const activeEvents = (userData.events || []).filter(e => !e.archived && ['pending', 'confirmed'].includes(e.status));

    const asksActive = /active|current|upcoming|latest|next/.test(lowerMsg);

    const formatTickets = (items) => items.map(t =>
        `Ticket ${t.reference} for ${t.visitorName} on ${t.date}${t.time ? ` at ${t.time}` : ''} (${t.totalVisitors} visitor(s), status ${t.status})`
    );
    const formatEvents = (items) => items.map(e =>
        `${e.eventTitle} on ${e.date}${e.time ? ` at ${e.time}` : ''} (${e.participants} participant(s), status ${e.status})`
    );

    if (asksActive || /active|current|upcoming/.test(lowerMsg)) {
        const parts = [];
        if (activeTickets.length > 0) parts.push(...formatTickets(activeTickets));
        if (activeEvents.length > 0) parts.push(...formatEvents(activeEvents));

        if (parts.length > 0) {
            return `You have ${activeTickets.length + activeEvents.length} active reservation(s).\n${parts.map(p => `- ${p}`).join('\n')}\n\nView full details on your Reservations page or show your booking reference at the zoo entrance.`;
        }
        return 'You currently have no active reservations. When a reservation is confirmed, it will appear here. You can also check your Reservations page for your booking history.';
    }

    const allParts = [...formatTickets(userData.tickets || []), ...formatEvents(userData.events || [])];
    if (allParts.length > 0) {
        return `Here is a summary of your reservations:\n${allParts.map(p => `- ${p}`).join('\n')}\n\nYou can view the full list on your Reservations page. Only your own booking details are shown.`;
    }

    return 'You have no reservations on record. When you make a booking, they will show up here. You can reserve tickets on the Reservations page.';
};

const getFallbackResponse = (message, dynamicData = null, userData = null) => {
    const lowerMsg = message.toLowerCase();

    const userReservationAnswer = getUserReservationFallback(message, userData);
    if (userReservationAnswer) {
        return userReservationAnswer;
    }

    if (lowerMsg.includes('ticket') || lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('fee')) {
        let response = `Mabuhay! Here are the current ticket prices:\n\n${formatTicketPriceLines()}\n\nYou can book tickets online through our website!`;
        if (dynamicData?.ticketStats) {
            response += `\n\nToday's availability: ${dynamicData.ticketStats.availableSlots}`;
        }
        return response;
    }

    if (lowerMsg.includes('hour') || lowerMsg.includes('open') || lowerMsg.includes('time') || lowerMsg.includes('schedule')) {
        return `Bulusan Park Operating Hours:\n\n- ${VISITOR_INFO.operatingHours}\n\nPlan your visit accordingly and arrive early to enjoy all our exhibits!`;
    }

    if (lowerMsg.includes('animal') || lowerMsg.includes('species') || lowerMsg.includes('wildlife')) {
        let response = "We have amazing animals at Bulusan Zoo!";
        if (dynamicData?.animalCount) {
            response = `We currently have ${dynamicData.animalCount} animals at Bulusan Zoo!`;
            if (dynamicData.animalNames?.length > 0) {
                response += ` Some of our residents include: ${dynamicData.animalNames.slice(0, 5).join(', ')}.`;
            }
        }
        response += " Visit our Animals page to explore all our wildlife. You can also use the AI Animal Scanner to identify animals during your visit!";
        return response;
    }

    if (lowerMsg.includes('zone') || lowerMsg.includes('area') || lowerMsg.includes('exhibit') || lowerMsg.includes('section')) {
        const exhibits = [...new Set((dynamicData?.animalCatalog || []).map(a => a.exhibit).filter(Boolean))].slice(0, 6);
        if (exhibits.length === 0) {
            return "I do not have enough verified information to confirm the zoo zones right now. Open the Map page from the main menu to see the current exhibits and facilities.";
        }
        return `Current exhibits in our records:\n\n${exhibits.map(e => `- ${e}`).join('\n')}\n\nOpen the Map page from the main menu to see exhibits, facilities, and walking routes.`;
    }

    if (lowerMsg.includes('location') || lowerMsg.includes('where') || lowerMsg.includes('address') || lowerMsg.includes('direction')) {
        return `Bulusan Park Location:\n\n${VISITOR_INFO.facilityName}\n${VISITOR_INFO.location}\n\nEmail: ${VISITOR_INFO.email}\nPhone: ${VISITOR_INFO.phone}`;
    }

    if (lowerMsg.includes('plant') || lowerMsg.includes('flora') || lowerMsg.includes('botanical') || lowerMsg.includes('botany') || lowerMsg.includes('tree')) {
        let response = "Bulusan Zoo also features a lush botanical collection across our grounds.";
        if (dynamicData?.plantCatalog?.length > 0) {
            response = `Our botanical collection features ${dynamicData.plantCatalog.length}+ plants, including ${dynamicData.plantCatalog.slice(0, 5).map(p => p.name).join(', ')}.`;
        }
        response += " Visit our Plants page to explore the full collection and learn about each species.";
        return response;
    }

    if (lowerMsg.includes('event') || lowerMsg.includes('activity') || lowerMsg.includes('program')) {
        let response = "Check out our Events page for:\n\n- Wildlife educational programs\n- Guided tours\n- Conservation workshops\n- School field trips\n- Special seasonal events";
        if (dynamicData?.upcomingEvents?.length > 0) {
            response = `Upcoming Events at Bulusan Zoo:\n\n${dynamicData.upcomingEvents.map(e => `- ${e.title} (${e.event_date})`).join('\n')}\n\nVisit our Events page for more details!`;
        }
        response += "\n\nBook in advance for group visits!";
        return response;
    }

    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey') || lowerMsg.includes('mabuhay')) {
        let greeting = "Mabuhay! Welcome to Bulusan Zoo! I'm Jiji, your zoo assistant.";
        if (dynamicData?.animalCount) {
            greeting += ` We currently have ${dynamicData.animalCount} amazing animals waiting to meet you!`;
        }
        greeting += "\n\nHow can I help you today? I can tell you about:\n- Ticket prices and booking\n- Operating hours\n- Any animal (just ask about any animal and I will tell you about it)\n- Website features and navigation\n- Events and activities\n- Ticket availability\n\nJust ask away!";
        return greeting;
    }

    return `Salamat for your question!\n\nI can help you with:\n- Ticket prices and booking\n- Operating hours (${VISITOR_INFO.operatingHours})\n- Information about any animal you ask about\n- Zoo zones and map\n- Events and activities\n- Current ticket availability\n\nFeel free to ask about any of these topics, or contact us at ${VISITOR_INFO.email} for more specific inquiries!`;
};

const detectCompanionLanguage = (text = '') => {
    const normalized = String(text || '').toLowerCase();
    const tagalogSignals = [
        'ang', 'mga', 'sa', 'ng', 'si', 'namin', 'natin', 'ako', 'ikaw', 'kayo',
        'paki', 'pakisuyo', 'pwede', 'maaari', 'salamat', 'kamusta', 'kumusta',
        'ano', 'saan', 'kailan', 'paano', 'bakit', 'gusto', 'kailangan', 'tulong',
        'reserbasyon', 'pang-araw', 'mangyaring', 'opo', 'po'
    ];

    const hitCount = tagalogSignals.reduce((count, word) => {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(normalized) ? count + 1 : count;
    }, 0);

    return hitCount >= 2 ? 'tagalog' : 'english';
};

const sanitizeCompanionOutput = (text = '') => {
    if (!text) return '';

    let cleaned = String(text)
        .replace(/```[\s\S]*?```/g, '')
        .replace(/[`*_~>#]/g, '')
        .replace(/[•●○■□▪▫◆◇★☆→✓✔✦✧✨]/g, '-')
        .replace(/\p{Extended_Pictographic}/gu, '')
        .replace(/\r\n/g, '\n')
        .replace(/([.:])\s+(\d+\.\s+)/g, '$1\n$2')
        .replace(/[ \t]+\n/g, '\n');

    cleaned = cleaned
        .split('\n')
        .map(line => line
            .replace(/^\s*[•●○■□▪▫◆◇★☆]+\s*/g, '- ')
            .replace(/^\s*[-–—]{2,}\s*/g, '- ')
            .replace(/\s{2,}/g, ' ')
            .trimEnd()
        )
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    return cleaned;
};

const getCompanionFallbackResponse = (role, message, dynamicData = null, language = 'english', operationalData = null) => {
    const lowerMsg = String(message || '').toLowerCase();
    const totalAnimals = dynamicData?.animalCount || 'the latest';
    const ticketSoldToday = dynamicData?.ticketStats?.todayTickets ?? 'latest';
    const availability = dynamicData?.ticketStats?.availableSlots || 'unknown';
    const isTagalog = language === 'tagalog';
    const asksList = /\b(list|show|current|existing|pending|upcoming|all|records|data|status)\b/.test(lowerMsg);
    const asksPending = /\b(pending|awaiting|unconfirmed|to review)\b/.test(lowerMsg);

    const formatOperationalList = (items, label) => {
        if (!items || items.length === 0) {
            return isTagalog ? `Walang ${label} na available sa kasalukuyang records.` : `No ${label} are available in the current records.`;
        }
        return items.slice(0, 6).map((item, index) => {
            const details = [item.reference, item.date, item.status].filter(Boolean).join(' | ');
            return `${index + 1}. ${item.title || label}${details ? ` (${details})` : ''}`;
        }).join('\n');
    };

    if (asksList && /\b(ticket|tickets)\b/.test(lowerMsg)) {
        const tickets = asksPending
            ? (operationalData?.tickets || []).filter(ticket => ticket.status === 'pending')
            : (operationalData?.tickets || []);
        return isTagalog
            ? `Mga ticket reservation sa system:\n${formatOperationalList(tickets, 'ticket reservation')}\n\nBuksan ang Reservations page para sa susunod na action.`
            : `Ticket reservations in the system:\n${formatOperationalList(tickets, 'ticket reservation')}\n\nOpen the Reservations page for the next action.`;
    }

    if (asksList && /\b(reservation|reservations|booking|bookings)\b/.test(lowerMsg)) {
        const allReservations = [...(operationalData?.tickets || []), ...(operationalData?.eventReservations || [])];
        const reservations = asksPending
            ? allReservations.filter(reservation => reservation.status === 'pending')
            : allReservations;
        return isTagalog
            ? `Mga reservation sa system:\n${formatOperationalList(reservations, 'reservation')}\n\nBuksan ang Reservations page para sa susunod na action.`
            : `Reservations in the system:\n${formatOperationalList(reservations, 'reservation')}\n\nOpen the Reservations page for the next action.`;
    }

    if (asksList && /\b(event|events|calendar|activity|activities)\b/.test(lowerMsg)) {
        const events = operationalData?.events || [];
        return isTagalog
            ? `Mga kasalukuyan at paparating na event:\n${formatOperationalList(events, 'event')}\n\nBuksan ang Events page para sa buong detalye.`
            : `Current and upcoming events:\n${formatOperationalList(events, 'event')}\n\nOpen the Events page for full details.`;
    }

    if (asksList && /\b(animal|animals|wildlife|species)\b/.test(lowerMsg) && dynamicData?.animalCatalog?.length) {
        const animals = dynamicData.animalCatalog.slice(0, 6).map((animal) => `${animal.name}${animal.species ? ` (${animal.species})` : ''}`);
        return isTagalog
            ? `Mga animal record na available:\n${animals.map((animal, index) => `${index + 1}. ${animal}`).join('\n')}`
            : `Animal records currently available:\n${animals.map((animal, index) => `${index + 1}. ${animal}`).join('\n')}`;
    }

    if (role === 'admin') {
        if (lowerMsg.includes('priority') || lowerMsg.includes('today') || lowerMsg.includes('focus')) {
            if (isTagalog) {
                return `Mga prayoridad ng admin ngayong araw:\n1. Suriin ang demand sa ticket (${ticketSoldToday} sold, availability: ${availability}).\n2. I-check ang staffing at community moderation queues.\n3. I-validate ang event readiness at visitor flow.\n\nKung gusto mo, gagawan kita ng 3-step action plan.`;
            }
            return `Admin priorities for today:\n1. Review live ticket demand (${ticketSoldToday} sold, availability: ${availability}).\n2. Check staffing and community moderation queues.\n3. Validate event readiness and visitor flow.\n\nIf you want, I can prepare a concise 3-step action plan.`;
        }

        if (lowerMsg.includes('report') || lowerMsg.includes('analytics') || lowerMsg.includes('kpi')) {
            if (isTagalog) {
                return `Para sa admin reporting, tumuon sa reservations trend, attendance, event engagement, at moderation turnaround. Ang kasalukuyang animal registry count ay ${totalAnimals}. Sabihin ang time range at report type para mabigyan kita ng maikling KPI summary.`;
            }
            return `For admin reporting, focus on reservations trend, attendance, event engagement, and moderation turnaround. The current animal registry count is ${totalAnimals}. Share the time range and report type so I can draft a concise KPI summary.`;
        }

        if (isTagalog) {
            return 'Handa ang Admin Companion. Makakatulong ako sa priorities, staffing alignment, analytics interpretation, at escalation decisions. Sabihin ang goal at time range para makagawa ako ng action plan.';
        }
        return 'Admin companion ready. I can help with priorities, staffing alignment, analytics interpretation, and escalation decisions. Share your goal and time range for a focused action plan.';
    }

    if (lowerMsg.includes('shift') || lowerMsg.includes('opening') || lowerMsg.includes('checklist')) {
        if (isTagalog) {
            return `Checklist para sa staff shift:\n1. I-verify ang status updates ng animal at plant areas.\n2. I-confirm ang reservation queues at ticket verification tasks.\n3. I-review ang bagong community reports na kailangan ng moderation.\n\nMaaari kong iayon ang checklist sa kasalukuyan mong page at task.`;
        }
        return `Staff shift checklist:\n1. Verify animal and plant area status updates.\n2. Confirm reservation queues and ticket verification tasks.\n3. Review new community reports that need moderation.\n\nI can tailor this checklist to your current page and task.`;
    }

    if (lowerMsg.includes('reservation') || lowerMsg.includes('ticket') || lowerMsg.includes('verify')) {
        if (isTagalog) {
            return `Para sa reservation handling, i-verify ang booking reference, i-validate ang schedule at slot availability, at panatilihing malinaw ang notes para sa handoff. Sa system ngayon, ${ticketSoldToday} ang sold tickets at ${availability} ang availability.`;
        }
        return `For reservation handling, verify the booking reference, validate schedule and slot availability, and keep notes clear for handoff. Today's system shows ${ticketSoldToday} tickets sold with ${availability} availability.`;
    }

    if (isTagalog) {
        return 'Handa ang Staff Companion. Makakatulong ako sa shift checklist, reservation verification, moderation triage, at quick response templates. Sabihin ang task para maibigay ko ang tamang steps.';
    }
    return 'Staff companion ready. I can help with shift checklists, reservation verification, moderation triage, and quick response templates. Tell me the task so I can give the exact steps.';
};

const getCompanionSystemContext = (role, preferredLanguage = 'english') => {
    const languageRule = preferredLanguage === 'tagalog'
        ? 'Respond only in clear, professional Tagalog. Do not switch to English unless the user explicitly asks.'
        : 'Respond only in clear, professional English. Do not switch to Tagalog unless the user explicitly asks.';

    const sharedRules = `
You are an internal AI companion for Bulusan Zoo Calapan.

Core rules:
- Provide role-appropriate, workflow-focused guidance only.
- Keep responses concise, actionable, and task-oriented.
- Never reveal or request personal data, payment records, private account details, tokens, or secrets.
- If the request requires restricted data, refuse and suggest the proper in-system workflow.
- Do not fabricate database records, metrics, or unavailable facts. If unknown, say it is unavailable.
- Ask up to two clarifying questions when the request is missing key context (time range, report type, status, or priority).
- Use plain text only.
- ${languageRule}

Output formatting rules:
- No markdown.
- No emojis.
- No decorative symbols.
- No asterisks, hashes, or code blocks.
- Keep output clean and professional.
- Use short paragraphs.
- If a list is necessary, use simple numbered points (1., 2., 3.).
`;

    if (role === 'admin') {
        return `${sharedRules}

Role: ADMIN companion.

What you should help with:
- Executive priorities and operational planning.
- Resource allocation and queue balancing.
- Reporting and KPI interpretation.
- Community moderation policy decisions.
- Staff monitoring and escalation guidelines.

Response style:
- Prefer structured steps and decision checkpoints.
- Mention risks, dependencies, and recommended next actions.
- Offer brief templates for delegation notes, escalation summaries, or KPI highlights.
- If the request is staff-only, respond with admin guidance and note where staff should execute.
`;
    }

    return `${sharedRules}

Role: STAFF companion.

What you should help with:
- Daily shift workflows and task sequencing.
- Ticket and reservation verification process.
- Animal/plant records handling reminders.
- Community moderation triage and response drafting.
- Visitor support response phrasing.

Response style:
- Give quick checklist-like instructions.
- Keep steps concrete, short, and operational.
- Suggest escalation to admin when the issue exceeds staff permissions or needs approval.
- If the request is admin-only, state the limitation and advise escalation.
`;
};

const normalizeSessionMessages = (messages) => (Array.isArray(messages) ? messages : [])
    .slice(-50)
    .filter(message => message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string')
    .map(message => ({
        role: message.role,
        content: message.content.slice(0, 8000),
        ...(Array.isArray(message.cards) ? { cards: message.cards.slice(0, 10) } : {}),
        ...(message.action && typeof message.action === 'object' ? { action: message.action } : {})
    }));

router.get('/companion/sessions', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const sessions = await AIAssistSession.getByOwner(req.user.id, req.user.role);
        return res.json({ success: true, sessions });
    } catch (error) {
        console.error('AI Assist session list error:', error.message);
        return res.status(500).json({ success: false, message: 'Could not load AI Assist sessions.' });
    }
});

router.post('/companion/sessions', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const session = await AIAssistSession.create({
            id: crypto.randomUUID(),
            userId: req.user.id,
            role: req.user.role,
            title: typeof req.body.title === 'string' ? req.body.title.slice(0, 255) : 'New chat',
            messages: normalizeSessionMessages(req.body.messages)
        });
        return res.status(201).json({ success: true, session });
    } catch (error) {
        console.error('AI Assist session create error:', error.message);
        return res.status(500).json({ success: false, message: 'Could not create an AI Assist session.' });
    }
});

router.put('/companion/sessions/:sessionId', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const updated = await AIAssistSession.update({
            id: req.params.sessionId,
            userId: req.user.id,
            role: req.user.role,
            title: typeof req.body.title === 'string' ? req.body.title.slice(0, 255) : undefined,
            messages: req.body.messages === undefined ? undefined : normalizeSessionMessages(req.body.messages)
        });
        if (!updated) return res.status(404).json({ success: false, message: 'AI Assist session not found.' });
        return res.json({ success: true });
    } catch (error) {
        console.error('AI Assist session update error:', error.message);
        return res.status(500).json({ success: false, message: 'Could not save the AI Assist session.' });
    }
});

router.delete('/companion/sessions/:sessionId', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const deleted = await AIAssistSession.delete(req.params.sessionId, req.user.id, req.user.role);
        if (!deleted) return res.status(404).json({ success: false, message: 'AI Assist session not found.' });
        return res.json({ success: true });
    } catch (error) {
        console.error('AI Assist session delete error:', error.message);
        return res.status(500).json({ success: false, message: 'Could not delete the AI Assist session.' });
    }
});

router.get('/sessions', protect, authorize('user'), async (req, res) => {
    try {
        const sessions = await AIAssistSession.getByOwner(req.user.id, 'user');
        return res.json({ success: true, sessions });
    } catch (error) {
        console.error('User AI session list error:', error.message);
        return res.status(500).json({ success: false, message: 'Could not load your AI chat history.' });
    }
});

router.post('/sessions', protect, authorize('user'), async (req, res) => {
    try {
        const session = await AIAssistSession.create({
            id: crypto.randomUUID(),
            userId: req.user.id,
            role: 'user',
            title: typeof req.body.title === 'string' ? req.body.title.slice(0, 255) : 'New chat',
            messages: normalizeSessionMessages(req.body.messages)
        });
        return res.status(201).json({ success: true, session });
    } catch (error) {
        console.error('User AI session create error:', error.message);
        return res.status(500).json({ success: false, message: 'Could not create a new AI chat.' });
    }
});

router.put('/sessions/:sessionId', protect, authorize('user'), async (req, res) => {
    try {
        const updated = await AIAssistSession.update({
            id: req.params.sessionId,
            userId: req.user.id,
            role: 'user',
            title: typeof req.body.title === 'string' ? req.body.title.slice(0, 255) : undefined,
            messages: req.body.messages === undefined ? undefined : normalizeSessionMessages(req.body.messages)
        });
        if (!updated) return res.status(404).json({ success: false, message: 'AI chat not found.' });
        return res.json({ success: true });
    } catch (error) {
        console.error('User AI session update error:', error.message);
        return res.status(500).json({ success: false, message: 'Could not save your AI chat.' });
    }
});

router.delete('/sessions/:sessionId', protect, authorize('user'), async (req, res) => {
    try {
        const deleted = await AIAssistSession.delete(req.params.sessionId, req.user.id, 'user');
        if (!deleted) return res.status(404).json({ success: false, message: 'AI chat not found.' });
        return res.json({ success: true });
    } catch (error) {
        console.error('User AI session delete error:', error.message);
        return res.status(500).json({ success: false, message: 'Could not delete your AI chat.' });
    }
});

router.post('/chat', optionalAuth, async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        const dynamicData = await getDynamicZooData();
        const userData = req.user?.id ? await getSanitizedUserReservations(req.user.id) : null;
        const userReservationContext = buildUserReservationContext(userData);
        const cardsPayload = buildChatCards(message, userData, dynamicData);

        let dynamicContext = '';
        if (dynamicData) {
            dynamicContext = `

CURRENT ZOO DATA (Live from database - use this information when answering):
- Total Animals: ${dynamicData.animalCount}
- Animal Health Status: ${Object.entries(dynamicData.animalsByStatus).map(([status, count]) => `${count} ${status}`).join(', ') || 'Data not available'}
- Some of our animals: ${dynamicData.animalNames.join(', ') || 'Various species'}
- Today's Ticket Availability: ${dynamicData.ticketStats.availableSlots} (${dynamicData.ticketStats.todayTickets} tickets sold today)
${dynamicData.upcomingEvents.length > 0 ? `
UPCOMING EVENTS:
${dynamicData.upcomingEvents.map(e => `- ${e.title} on ${e.event_date}: ${e.description || 'Check website for details'}`).join('\n')}` : '- No upcoming events scheduled at this time'}

Remember: Only share this general zoo information. Never expose passwords, account credentials, payment card data, or any other person's reservation/booking details.`;
        }

        dynamicContext += buildVisitorInfoContext();

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
            return res.json({
                success: true,
                response: getFallbackResponse(message, dynamicData, userData),
                timestamp: new Date().toISOString(),
                source: 'fallback',
                cards: cardsPayload.cards,
                action: cardsPayload.action
            });
        }

        if (!GoogleGenerativeAI) {
            return res.json({
                success: true,
                response: getFallbackResponse(message, dynamicData, userData),
                timestamp: new Date().toISOString(),
                source: 'fallback',
                cards: cardsPayload.cards,
                action: cardsPayload.action
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const candidateModels = [
            'gemini-2.0-flash',
            'gemini-2.5-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro-latest',
            'gemini-pro',
            'models/gemini-pro'
        ];

        let chosen = null;
        let finalText = null;

        for (const candidate of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({ model: candidate });

                const conversationHistory = history
                    .filter(msg => msg.content && msg.content.trim())
                    .map(msg => ({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.content }]
                    }));

                const systemPrompt = buildJijiSystemPrompt(dynamicContext, userReservationContext, message);

                const result = await model.generateContent({
                    contents: [
                        ...conversationHistory,
                        {
                            role: 'user',
                            parts: [{ text: systemPrompt }]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 1000,
                        temperature: 0.7,
                    }
                });

                const response = result.response;
                const text = response.text();

                const cleanedText = sanitizePlainText(text);
                if (cleanedText) {
                    finalText = cleanedText;
                    chosen = candidate;
                    break;
                }
            } catch (err) {
                continue;
            }
        }

        if (chosen && finalText) {
            res.json({
                success: true,
                response: finalText,
                timestamp: new Date().toISOString(),
                source: chosen,
                cards: cardsPayload.cards,
                action: cardsPayload.action
            });
            return;
        }

        return res.json({
            success: true,
            response: getFallbackResponse(message, dynamicData, userData),
            timestamp: new Date().toISOString(),
            source: 'fallback',
            cards: cardsPayload.cards,
            action: cardsPayload.action
        });

    } catch (error) {
        console.error('AI chat error');
        return res.json({
            success: true,
            response: getFallbackResponse(req.body.message || '', null),
            timestamp: new Date().toISOString(),
            source: 'fallback'
        });
    }
});

router.post('/companion/chat', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        const role = req.user?.role;
        const preferredLanguage = detectCompanionLanguage(message);

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        const dynamicData = await getDynamicZooData();
        const operationalData = await getCompanionOperationalData(dynamicData);
        const cardsPayload = buildCompanionCards(message, dynamicData, operationalData, role);

        let dynamicContext = '';
        if (dynamicData) {
            dynamicContext = `

CURRENT ZOO DATA (Live from database):
- Total Animals: ${dynamicData.animalCount}
- Animal Health Status: ${Object.entries(dynamicData.animalsByStatus).map(([status, count]) => `${count} ${status}`).join(', ') || 'Data not available'}
- Sample Animal Records: ${dynamicData.animalNames.join(', ') || 'Various species'}
- Today's Tickets Sold: ${dynamicData.ticketStats.todayTickets}
- Today's Ticket Availability: ${dynamicData.ticketStats.availableSlots}
${dynamicData.upcomingEvents.length > 0 ? `
UPCOMING EVENTS:
${dynamicData.eventCatalog.map(e => `- ${e.title} on ${e.date || 'date unavailable'}${e.time ? ` at ${e.time}` : ''}${e.location ? ` at ${e.location}` : ''} (${e.status})`).join('\n')}` : '- No upcoming events scheduled at this time'}

Only provide operationally useful summaries. Never expose personal user records.
`;
        }

        const operationalContext = `

SAFE OPERATIONAL LISTS (reference, date, status, and visitor totals only; no personal, payment, or credential data):
- Ticket reservations: ${JSON.stringify(operationalData.tickets.slice(0, 20))}
- Event reservations: ${JSON.stringify(operationalData.eventReservations.slice(0, 20))}
- Current/upcoming events: ${JSON.stringify(operationalData.events.slice(0, 10))}
`;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0 || !GoogleGenerativeAI) {
            return res.json({
                success: true,
                response: sanitizeCompanionOutput(getCompanionFallbackResponse(role, message, dynamicData, preferredLanguage, operationalData)),
                timestamp: new Date().toISOString(),
                source: 'fallback',
                role,
                language: preferredLanguage,
                cards: cardsPayload.cards,
                action: cardsPayload.action
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const candidateModels = [
            'gemini-2.0-flash',
            'gemini-2.5-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro-latest',
            'gemini-pro',
            'models/gemini-pro'
        ];

        let chosen = null;
        let finalText = null;

        for (const candidate of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({ model: candidate });

                const conversationHistory = history
                    .filter(msg => msg.content && msg.content.trim())
                    .map(msg => ({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.content }]
                    }));

                const systemPrompt = `${getCompanionSystemContext(role, preferredLanguage)}${dynamicContext}${operationalContext}\n\nUser request: ${message}`;

                const result = await model.generateContent({
                    contents: [
                        ...conversationHistory,
                        {
                            role: 'user',
                            parts: [{ text: systemPrompt }]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 1000,
                        temperature: 0.6,
                    }
                });

                const response = result.response;
                const text = response.text();

                if (text && text.trim().length > 0) {
                    finalText = sanitizeCompanionOutput(text);
                    chosen = candidate;
                    break;
                }
            } catch (err) {
                continue;
            }
        }

        if (chosen && finalText) {
            return res.json({
                success: true,
                response: sanitizeCompanionOutput(finalText),
                timestamp: new Date().toISOString(),
                source: chosen,
                role,
                language: preferredLanguage,
                cards: cardsPayload.cards,
                action: cardsPayload.action
            });
        }

        return res.json({
            success: true,
            response: sanitizeCompanionOutput(getCompanionFallbackResponse(role, message, dynamicData, preferredLanguage, operationalData)),
            timestamp: new Date().toISOString(),
            source: 'fallback',
            role,
            language: preferredLanguage,
            cards: cardsPayload.cards,
            action: cardsPayload.action
        });
    } catch (error) {
        const preferredLanguage = detectCompanionLanguage(req.body.message || '');
        return res.json({
            success: true,
            response: sanitizeCompanionOutput(getCompanionFallbackResponse(req.user?.role || 'staff', req.body.message || '', null, preferredLanguage, null)),
            timestamp: new Date().toISOString(),
            source: 'fallback',
            language: preferredLanguage,
            cards: [],
            action: null
        });
    }
});

router.get('/status', (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const isConfigured = !!(apiKey && apiKey.trim().length > 0);
    const hasGoogleAI = !!GoogleGenerativeAI;

    res.json({
        success: true,
        configured: isConfigured,
        googleAIAvailable: hasGoogleAI,
        ready: isConfigured && hasGoogleAI,
        assistant: 'Jiji',
        version: '1.0.0',
        message: !isConfigured
            ? 'GEMINI_API_KEY not configured in .env'
            : !hasGoogleAI
                ? '@google/generative-ai package not installed'
                : 'AI service is ready'
    });
});

module.exports = router;