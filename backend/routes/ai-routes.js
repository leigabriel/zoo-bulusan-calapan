const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// import models
const Animal = require('../models/animal-model');
const Event = require('../models/event-model');
const Ticket = require('../models/ticket-model');

// load google ai client
let GoogleGenerativeAI = null;
try {
    const gg = require('@google/generative-ai');
    GoogleGenerativeAI = gg && gg.GoogleGenerativeAI ? gg.GoogleGenerativeAI : null;
} catch (err) {
    console.warn('Optional package @google/generative-ai not installed. AI features will use fallback responses.');
}

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

// fallback response for ai
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
        response += " Visit our Animals page to explore all our wildlife. You can also use the AI Animal Scanner to identify animals during your visit!";
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
        let greeting = "Mabuhay! Welcome to Zoo Bulusan! I'm Zusan, your zoo assistant.";
        if (dynamicData?.animalCount) {
            greeting += ` We currently have ${dynamicData.animalCount} amazing animals waiting to meet you!`;
        }
        greeting += "\n\nHow can I help you today? I can tell you about:\n- Ticket prices and booking\n- Operating hours\n- Any animal (just ask about any animal and I will tell you about it)\n- Zoo zones and facilities\n- Events and activities\n- Ticket availability\n\nJust ask away!";
        return greeting;
    }

    return "Salamat for your question!\n\nI can help you with:\n- Ticket prices and booking\n- Operating hours (Tue-Sun, 8AM-5PM)\n- Information about any animal you ask about\n- Zoo zones and map\n- Events and activities\n- Current ticket availability\n\nFeel free to ask about any of these topics, or contact us at info@zoobulusan.com for more specific inquiries!";
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

const getCompanionFallbackResponse = (role, message, dynamicData = null, language = 'english') => {
    const lowerMsg = String(message || '').toLowerCase();
    const totalAnimals = dynamicData?.animalCount || 'the latest';
    const ticketSoldToday = dynamicData?.ticketStats?.todayTickets ?? 'latest';
    const availability = dynamicData?.ticketStats?.availableSlots || 'unknown';
    const isTagalog = language === 'tagalog';

    if (role === 'admin') {
        if (lowerMsg.includes('priority') || lowerMsg.includes('today') || lowerMsg.includes('focus')) {
            if (isTagalog) {
                return `Mga prayoridad ng admin ngayong araw:\n1. Suriin ang demand sa ticket (${ticketSoldToday} sold, availability: ${availability}).\n2. I-check ang staffing at community moderation queues.\n3. I-validate ang event readiness at visitor flow.\n\nKung gusto mo, gagawan kita ng 3-step action plan.`;
            }
            return `Admin priorities for today:\n1. Review live ticket demand (${ticketSoldToday} sold, availability: ${availability}).\n2. Check staffing and community moderation queues.\n3. Validate event readiness and visitor flow.\n\nIf you want, I can prepare a concise 3-step action plan.`;
        }

        if (lowerMsg.includes('report') || lowerMsg.includes('analytics') || lowerMsg.includes('kpi')) {
            if (isTagalog) {
                return `Para sa admin reporting, tumuon sa reservations trend, attendance, event engagement, at moderation turnaround. Ang kasalukuyang animal registry count ay ${totalAnimals}. Maaari kitang bigyan ng maikling dashboard summary format.`;
            }
            return `For admin reporting, focus on reservations trend, attendance, event engagement, and moderation turnaround. The current animal registry count is ${totalAnimals}. I can provide a concise dashboard summary format.`;
        }

        if (isTagalog) {
            return 'Handa ang Admin Companion. Makakatulong ako sa planning, analytics interpretation, operations strategy, at policy-aligned decisions para sa Zoo Bulusan. Humingi ka ng action plan, risk check, o reporting summary.';
        }
        return 'Admin companion ready. I can help with planning, analytics interpretation, operations strategy, and policy-aligned decisions for Zoo Bulusan. Ask for an action plan, risk check, or reporting summary.';
    }

    if (lowerMsg.includes('shift') || lowerMsg.includes('opening') || lowerMsg.includes('checklist')) {
        if (isTagalog) {
            return `Checklist para sa staff shift:\n1. I-verify ang status updates ng animal at plant areas.\n2. I-confirm ang reservation queues at ticket verification tasks.\n3. I-review ang bagong community reports na kailangan ng moderation.\n\nMaaari kong iayon ang checklist sa kasalukuyan mong page at task.`;
        }
        return `Staff shift checklist:\n1. Verify animal and plant area status updates.\n2. Confirm reservation queues and ticket verification tasks.\n3. Review new community reports that need moderation.\n\nI can tailor this checklist to your current page and task.`;
    }

    if (lowerMsg.includes('reservation') || lowerMsg.includes('ticket') || lowerMsg.includes('verify')) {
        if (isTagalog) {
            return `Para sa reservation handling, kumpirmahin ang visitor details, i-validate ang schedule at slot availability, at panatilihing malinaw ang notes para sa handoff. Sa system ngayon, ${ticketSoldToday} ang sold tickets at ${availability} ang availability.`;
        }
        return `For reservation handling, confirm visitor details, validate schedule and slot availability, and keep notes clear for handoff. Today's system shows ${ticketSoldToday} tickets sold with ${availability} availability.`;
    }

    if (isTagalog) {
        return 'Handa ang Staff Companion. Makakatulong ako sa daily operations, reservation verification, moderation workflows, at mabilis na response templates para sa frontline tasks sa Zoo Bulusan.';
    }
    return 'Staff companion ready. I can help with daily operations, reservation verification, moderation workflows, and quick response templates for frontline tasks in Zoo Bulusan.';
};

const getCompanionSystemContext = (role, preferredLanguage = 'english') => {
    const languageRule = preferredLanguage === 'tagalog'
        ? 'Respond only in clear, professional Tagalog. Do not switch to English unless the user explicitly asks.'
        : 'Respond only in clear, professional English. Do not switch to Tagalog unless the user explicitly asks.';

    const sharedRules = `
You are an internal AI companion for Zoo Bulusan Calapan.

Core rules:
- Give practical, factual, workflow-focused guidance.
- Keep responses concise and actionable.
- Never reveal personal data, payment records, private account details, tokens, or secrets.
- If user asks for sensitive data, refuse and suggest the proper in-system workflow.
- Do not fabricate database records, metrics, or unavailable facts.
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
- If useful, provide short templates for admin announcements and task delegation.
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
- Suggest escalation to admin when issue exceeds staff permissions.
`;
};

const ZOO_BULUSAN_CONTEXT = `
you are "zusan", the official ai assistant of zoo bulusan calapan, a wildlife conservation sanctuary located in calapan city, oriental mindoro, philippines. you provide accurate, professional, and educational information about the zoo, wildlife, conservation, visitor services, and animal protection laws.

general behavior

* provide only factual and verified information
* remain professional, clear, and helpful
* be concise but informative
* do not invent zoo statistics or data
* if specific zoo information is unavailable, advise the user to visit the official website or contact the zoo directly
* promote wildlife conservation awareness whenever appropriate

response rules

1. responses must be plain text only
2. do not use emojis
3. do not use markdown formatting
4. do not use asterisks or decorative symbols
5. use simple dashes (-) for lists only when necessary
6. keep answers short and conversational
7. simple questions must be answered in 3 to 5 sentences
8. maintain a warm but professional tone
9. occasionally use filipino expressions such as mabuhay, magandang araw, or salamat
10. include a short conservation reminder when relevant

animal knowledge rules

* you can answer questions about any animal species whether it exists in the zoo or not
* animal responses must include:

  * common name
  * scientific name
  * habitat
  * diet
  * behavior
  * conservation status
* animal information must be written as short paragraphs, not lists
* keep explanations concise and educational
* if the animal exists in zoo bulusan, mention where visitors can find it
* if the animal is not in the zoo, briefly mention similar animals available in the zoo when possible

animal law and protection information

* you can provide accurate information about animal protection laws and wildlife regulations
* prioritize philippine laws when relevant
* you may explain:

  * animal welfare laws
  * wildlife protection laws
  * conservation regulations
  * penalties for illegal wildlife activities
  * responsible wildlife interaction rules
* provide clear and factual explanations when discussing animal laws

zoo bulusan information

name

* zoo bulusan calapan

location

* calapan city, oriental mindoro, philippines
* mimaropa region

type

* community-driven wildlife conservation and eco-tourism destination

features

* native philippine wildlife
* interactive exhibits
* nature trails
* educational programs
* ai-powered features

ticket prices

* adult (18+): p50
* child (4-17): p30
* senior citizens (60+): p40
* students with valid id: p35
* pwd with valid id: p35
* calapan city residents: free with valid government id

operating hours

* tuesday to sunday: 8:00 am to 5:00 pm
* monday: closed
* last entry: 4:00 pm
* holiday schedules may vary

zoo areas

* mammal kingdom
* bird sanctuary
* reptile house
* aquatic zone
* children's zoo
* conservation center

website features

online ticket system

* reserve tickets in advance
* view reservation history

ai animal scanner

* identify animals using camera
* receive instant animal information

animaldex

* encyclopedia of zoo animals

interactive map

* digital zoo navigation

events calendar

* view upcoming activities and programs

user profiles

* account creation
* visit tracking
* reservation history

ai assistant

* instant zoo and animal information

data privacy rules

* never reveal personal user information
* never reveal reservation records
* never reveal payment information
* never reveal account details
* you may provide general statistics such as:

  * total animals
  * number of events
  * ticket availability

contact information

* email: [info@zoobulusan.com](mailto:info@zoobulusan.com)
* phone: (043) 123-4567
* location: bulusan wildlife park, calapan city, oriental mindoro, philippines

uncertainty handling

* if unsure about zoo-specific data:

  * recommend visiting the official website
  * recommend contacting zoo bulusan directly

mission

* promote wildlife conservation awareness
* encourage responsible tourism
* educate visitors about protecting wildlife and natural habitats

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
            // fallback response
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
                source: chosen
            });
            return;
        }

        // fallback
        return res.json({
            success: true,
            response: getFallbackResponse(message, dynamicData),
            timestamp: new Date().toISOString(),
            source: 'fallback'
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
${dynamicData.upcomingEvents.map(e => `- ${e.title} on ${e.date}: ${e.description || 'Check system for details'}`).join('\n')}` : '- No upcoming events scheduled at this time'}

Only provide operationally useful summaries. Never expose personal user records.
`;
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0 || !GoogleGenerativeAI) {
            return res.json({
                success: true,
                response: sanitizeCompanionOutput(getCompanionFallbackResponse(role, message, dynamicData, preferredLanguage)),
                timestamp: new Date().toISOString(),
                source: 'fallback',
                role,
                language: preferredLanguage
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

                const systemPrompt = `${getCompanionSystemContext(role, preferredLanguage)}${dynamicContext}\n\nUser request: ${message}`;

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
                language: preferredLanguage
            });
        }

        return res.json({
            success: true,
            response: sanitizeCompanionOutput(getCompanionFallbackResponse(role, message, dynamicData, preferredLanguage)),
            timestamp: new Date().toISOString(),
            source: 'fallback',
            role,
            language: preferredLanguage
        });
    } catch (error) {
        const preferredLanguage = detectCompanionLanguage(req.body.message || '');
        return res.json({
            success: true,
            response: sanitizeCompanionOutput(getCompanionFallbackResponse(req.user?.role || 'staff', req.body.message || '', null, preferredLanguage)),
            timestamp: new Date().toISOString(),
            source: 'fallback',
            language: preferredLanguage
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
        assistant: 'Zusan',
        version: '1.0.0',
        message: !isConfigured
            ? 'GEMINI_API_KEY not configured in .env'
            : !hasGoogleAI
                ? '@google/generative-ai package not installed'
                : 'AI service is ready'
    });
});

module.exports = router;
