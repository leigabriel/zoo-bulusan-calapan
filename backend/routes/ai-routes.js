const express = require('express');
const router = express.Router();

// Import models for database access
const Animal = require('../models/animal-model');
const Event = require('../models/event-model');
const Ticket = require('../models/ticket-model');

// Try loading optional Google Generative AI client. If it's not installed,
// keep the server running and fall back to canned responses.
let GoogleGenerativeAI = null;
try {
    const gg = require('@google/generative-ai');
    GoogleGenerativeAI = gg && gg.GoogleGenerativeAI ? gg.GoogleGenerativeAI : null;
} catch (err) {
    console.warn('Optional package @google/generative-ai not installed. AI features will use fallback responses.');
}

// Function to fetch dynamic zoo data from the database
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
        
        // Fetch upcoming events
        let upcomingEvents = [];
        try {
            upcomingEvents = await Event.getUpcoming() || [];
        } catch (e) {
            console.warn('Could not fetch events:', e.message);
        }
        
        // Fetch ticket stats (non-sensitive)
        let ticketStats = { todayTickets: 0, availableSlots: 'plenty' };
        try {
            const todayTickets = await Ticket.countTodayTickets();
            ticketStats.todayTickets = todayTickets || 0;
            // Estimate availability (zoo capacity ~500 per day)
            const maxCapacity = 500;
            const remaining = maxCapacity - ticketStats.todayTickets;
            ticketStats.availableSlots = remaining > 100 ? 'plenty' : remaining > 50 ? 'some' : remaining > 0 ? 'limited' : 'sold out';
        } catch (e) {
            console.warn('Could not fetch ticket stats:', e.message);
        }
        
        return {
            animalCount,
            animalsByStatus,
            animalNames: animalNames.slice(0, 20), // Limit to 20 animals for context
            upcomingEvents: upcomingEvents.slice(0, 5).map(e => ({
                title: e.title,
                date: e.start_date || e.event_date,
                description: e.description?.substring(0, 100)
            })),
            ticketStats
        };
    } catch (error) {
        console.error('Error fetching dynamic zoo data:', error);
        return null;
    }
};

// Fallback response function when AI service is not available
const getFallbackResponse = (message, dynamicData = null) => {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('ticket') || lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('fee')) {
        let response = "Mabuhay! Here are our ticket prices:\n\n- Adult (18+): P50\n- Child (4-17): P30\n- Senior Citizens: P40\n- Students (with ID): P35\n- PWD (with ID): P35\n- Calapan Residents: FREE (with valid ID)\n\nYou can book tickets online through our website!";
        if (dynamicData?.ticketStats) {
            response += `\n\nToday's availability: ${dynamicData.ticketStats.availableSlots}`;
        }
        return response;
    }

    if (lowerMsg.includes('hour') || lowerMsg.includes('open') || lowerMsg.includes('time') || lowerMsg.includes('schedule')) {
        return "Zoo Bulusan Operating Hours:\n\n- Tuesday to Sunday: 8:00 AM - 5:00 PM\n- Monday: CLOSED (maintenance day)\n- Last entry: 4:00 PM\n\nPlan your visit accordingly and arrive early to enjoy all our exhibits!";
    }

    if (lowerMsg.includes('animal') || lowerMsg.includes('species') || lowerMsg.includes('wildlife')) {
        let response = "We have amazing animals at Zoo Bulusan!";
        if (dynamicData?.animalCount) {
            response = `We currently have ${dynamicData.animalCount} animals at Zoo Bulusan!`;
            if (dynamicData.animalNames?.length > 0) {
                response += ` Some of our residents include: ${dynamicData.animalNames.slice(0, 5).join(', ')}.`;
            }
        }
        response += " Visit our Animals page or use the AnimalDex feature to explore our complete collection. You can also use the AI Animal Scanner to identify animals during your visit!";
        return response;
    }

    if (lowerMsg.includes('zone') || lowerMsg.includes('area') || lowerMsg.includes('exhibit') || lowerMsg.includes('section')) {
        return "Our Zoo Zones:\n\n- Mammal Kingdom: Home to deer, monkeys, wild boars\n- Bird Sanctuary: Native and migratory birds\n- Reptile House: Snakes, lizards, and crocodiles\n- Aquatic Zone: Freshwater fish native to Oriental Mindoro\n- Children's Zoo: Interactive area for kids\n- Conservation Center: Educational exhibits about wildlife preservation\n\nUse our interactive map to navigate!";
    }

    if (lowerMsg.includes('location') || lowerMsg.includes('where') || lowerMsg.includes('address') || lowerMsg.includes('direction')) {
        return "Zoo Bulusan Location:\n\nBulusan Wildlife Park\nCalapan City, Oriental Mindoro\nMIMAROPA Region, Philippines\n\nEmail: info@zoobulusan.com\nPhone: (043) 123-4567";
    }

    if (lowerMsg.includes('event') || lowerMsg.includes('activity') || lowerMsg.includes('program')) {
        let response = "Check out our Events page for:\n\n- Wildlife educational programs\n- Guided tours\n- Conservation workshops\n- School field trips\n- Special seasonal events";
        if (dynamicData?.upcomingEvents?.length > 0) {
            response = `Upcoming Events at Zoo Bulusan:\n\n${dynamicData.upcomingEvents.map(e => `- ${e.title} (${e.date})`).join('\n')}\n\nVisit our Events page for more details!`;
        }
        response += "\n\nBook in advance for group visits!";
        return response;
    }

    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey') || lowerMsg.includes('mabuhay')) {
        let greeting = "Mabuhay! Welcome to Zoo Bulusan! I'm Zooey, your zoo assistant.";
        if (dynamicData?.animalCount) {
            greeting += ` We currently have ${dynamicData.animalCount} amazing animals waiting to meet you!`;
        }
        greeting += "\n\nHow can I help you today? I can tell you about:\n- Ticket prices and booking\n- Operating hours\n- Any animal (just ask about any animal and I will tell you about it)\n- Zoo zones and facilities\n- Events and activities\n- Ticket availability\n\nJust ask away!";
        return greeting;
    }

    return "Salamat for your question!\n\nI can help you with:\n- Ticket prices and booking\n- Operating hours (Tue-Sun, 8AM-5PM)\n- Information about any animal you ask about\n- Zoo zones and map\n- Events and activities\n- Current ticket availability\n\nFeel free to ask about any of these topics, or contact us at info@zoobulusan.com for more specific inquiries!";
};

const ZOO_BULUSAN_CONTEXT = `
You are "Zooey", the official AI assistant for Zoo Bulusan - a premier wildlife sanctuary located in Calapan City, Oriental Mindoro, Philippines. 
You are helpful, knowledgeable, and passionate about wildlife conservation.

IMPORTANT RESPONSE RULES:
1. DO NOT use any emojis in your responses - keep it professional and text-only
2. Keep responses professional and informative
3. Use Filipino expressions occasionally (like "Mabuhay!", "Salamat!", "Magandang araw!")
4. Be concise but thorough
5. If asked about ANY animal (whether in the zoo or not), provide educational information about that animal including scientific name, habitat, diet, behavior, and conservation status
6. You can provide general zoo statistics like total animals, upcoming events count, and ticket availability, but NEVER reveal personal user information
7. Always encourage wildlife conservation awareness
8. If unsure about specific zoo data, suggest visiting the website or contacting the zoo directly

ABOUT ZOO BULUSAN:
- Full Name: Zoo Bulusan Calapan
- Location: Calapan City, Oriental Mindoro, MIMAROPA Region, Philippines
- Type: Community-driven wildlife conservation and eco-tourism destination
- Features: Native Philippine wildlife, interactive exhibits, nature trails, educational programs, and AI-powered features

TICKET PRICES:
- Adult (18+): P50
- Child (4-17): P30
- Senior Citizens (60+): P40
- Students (with valid ID): P35
- PWD (with valid ID): P35
- Calapan City Residents: FREE (with valid government-issued ID)

OPERATING HOURS:
- Tuesday to Sunday: 8:00 AM - 5:00 PM
- Monday: CLOSED (maintenance and animal care day)
- Last entry: 4:00 PM
- Holiday schedules may vary - check the Events page

ZONES/AREAS IN THE ZOO:
- Mammal Kingdom: Home to deer, monkeys, wild boars, and other mammals
- Bird Sanctuary: Native and migratory birds including Philippine eagles
- Reptile House: Snakes, lizards, monitor lizards, and crocodiles
- Aquatic Zone: Freshwater fish native to Oriental Mindoro
- Children's Zoo: Interactive and educational area for kids
- Conservation Center: Educational exhibits about wildlife preservation and endemic species

WEBSITE FEATURES (what users can do on our platform):
1. Online Ticket Booking - Reserve and purchase tickets in advance, view booking history
2. AI Animal Scanner - Use phone camera to identify and learn about animals in real-time
3. AnimalDex - Complete encyclopedia/database of all zoo animals with details
4. Interactive Zoo Map - Navigate the park easily with our digital map
5. Events Calendar - View upcoming zoo activities, programs, and special events
6. User Profiles - Create account, track visits, view ticket history
7. AI Chat Assistant (You/Zooey) - Get instant answers about the zoo

ANIMAL INFORMATION CAPABILITY:
You can answer questions about ANY animal the user asks about, whether it exists in the zoo or not. When a user asks about an animal, provide a brief and friendly response covering: what it is, where it lives, what it eats, and one interesting fact. If the animal is in our zoo, tell them where to find it. If not, mention similar animals we have.

DATABASE ACCESS:
You can share general zoo stats like total animals, upcoming events, and ticket availability. Never share user personal info, booking details, payment info, or account data.

CONTACT: info@zoobulusan.com | (043) 123-4567 | Bulusan Wildlife Park, Calapan City, Oriental Mindoro

RESPONSE FORMAT RULES - VERY IMPORTANT:
1. DO NOT use any emojis
2. DO NOT use asterisks (*) or markdown formatting like **bold** or *italics*
3. DO NOT use bullet points with asterisks
4. Use plain text only with simple dashes (-) for lists if needed
5. Keep responses SHORT and CONVERSATIONAL - 3 to 5 sentences for simple questions
6. For animal info, write in flowing paragraphs, not bullet lists
7. Use Filipino greetings naturally (Mabuhay, Salamat, Magandang araw)
8. Be warm and helpful but concise
9. End with a brief conservation message or helpful tip when relevant
10. If animal is not in zoo, keep it brief and redirect to what we have
`;

router.post('/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // Fetch dynamic data from database
        const dynamicData = await getDynamicZooData();
        
        // Build dynamic context section
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
${dynamicData.upcomingEvents.map(e => `- ${e.title} on ${e.date}: ${e.description || 'Check website for details'}`).join('\n')}` : '- No upcoming events scheduled at this time'}

Remember: Only share this general zoo information. Never share personal user data, booking details, or payment information.
`;
        }

        const apiKey = process.env.GEMINI_API_KEY;

        // Check if API key is configured and not empty
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
            // Provide fallback responses when API key is not configured
            return res.json({
                success: true,
                response: getFallbackResponse(message, dynamicData),
                timestamp: new Date().toISOString(),
                source: 'fallback'
            });
        }

        // If the Google generative client isn't available, return fallback.
        if (!GoogleGenerativeAI) {
            return res.json({
                success: true,
                response: getFallbackResponse(message, dynamicData),
                timestamp: new Date().toISOString(),
                source: 'fallback'
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Try a list of candidate models in order until one succeeds.
        // Updated model names for Google Generative AI SDK (as of late 2024/2025)
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

                // Build the conversation history for context
                const conversationHistory = history
                    .filter(msg => msg.content && msg.content.trim())
                    .map(msg => ({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.content }]
                    }));

                // Create the full prompt with context
                const systemPrompt = `${ZOO_BULUSAN_CONTEXT}${dynamicContext}\n\nUser's question: ${message}`;

                // Use generateContent for simpler, more reliable response
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

                if (text && text.trim().length > 0) {
                    finalText = text;
                    chosen = candidate;
                    console.log(`AI response generated successfully using model: ${candidate}`);
                    break; // success, stop trying other models
                }
            } catch (err) {
                // If a model isn't available or fails, try the next one
                console.warn(`AI model ${candidate} failed:`, err?.message || err);
                continue;
            }
        }

        if (chosen && finalText) {
            res.json({
                success: true,
                response: finalText,
                timestamp: new Date().toISOString(),
                source: chosen
            });
            return;
        }

        // If no model succeeded, fall back to canned responses
        console.warn('All AI models failed, using fallback response');
        return res.json({
            success: true,
            response: getFallbackResponse(message, dynamicData),
            timestamp: new Date().toISOString(),
            source: 'fallback'
        });

    } catch (error) {
        console.error('AI Chat Error:', error?.message || error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        // Fallback to basic responses if Gemini API fails
        // Note: dynamicData may not be available in catch block, pass null
        return res.json({
            success: true,
            response: getFallbackResponse(req.body.message || '', null),
            timestamp: new Date().toISOString(),
            source: 'fallback'
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
        assistant: 'Zooey',
        version: '1.0.0',
        message: !isConfigured
            ? 'GEMINI_API_KEY not configured in .env'
            : !hasGoogleAI
                ? '@google/generative-ai package not installed'
                : 'AI service is ready'
    });
});

module.exports = router;