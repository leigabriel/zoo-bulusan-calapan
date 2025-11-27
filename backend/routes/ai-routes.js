const express = require('express');
const router = express.Router();

// Try loading optional Google Generative AI client. If it's not installed,
// keep the server running and fall back to canned responses.
let GoogleGenerativeAI = null;
try {
    const gg = require('@google/generative-ai');
    GoogleGenerativeAI = gg && gg.GoogleGenerativeAI ? gg.GoogleGenerativeAI : null;
} catch (err) {
    console.warn('Optional package @google/generative-ai not installed. AI features will use fallback responses.');
}

// Fallback response function when AI service is not available
const getFallbackResponse = (message) => {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('ticket') || lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('fee')) {
        return "Mabuhay! 🎫 Here are our ticket prices:\n\n• Adult (18+): ₱40\n• Child (4-17): ₱20\n• Senior Citizens: ₱30\n• Students (with ID): ₱25\n• Bulusan Residents: FREE (with valid ID)\n\nYou can book tickets online through our website!";
    }
    
    if (lowerMsg.includes('hour') || lowerMsg.includes('open') || lowerMsg.includes('time') || lowerMsg.includes('schedule')) {
        return "🕐 Zoo Bulusan Operating Hours:\n\n• Tuesday - Sunday: 8:00 AM - 5:00 PM\n• Monday: CLOSED (maintenance day)\n• Last entry: 4:00 PM\n\nPlan your visit accordingly and arrive early to enjoy all our exhibits!";
    }
    
    if (lowerMsg.includes('animal') || lowerMsg.includes('species') || lowerMsg.includes('wildlife')) {
        return "🦅 We have amazing animals at Zoo Bulusan!\n\n• Philippine Eagle (Maya) - Our national bird, critically endangered\n• Philippine Deer (Bantay) - Native deer from Luzon\n• Philippine Macaque (Unggoy) - Playful native monkeys\n• Reticulated Python (Sawa) - One of the longest snake species\n• Philippine Crocodile - Endemic freshwater crocodile\n\nVisit our Animals page for more details!";
    }
    
    if (lowerMsg.includes('zone') || lowerMsg.includes('area') || lowerMsg.includes('exhibit') || lowerMsg.includes('section')) {
        return "🗺️ Our Zoo Zones:\n\n• Mammal Kingdom - Deer, monkeys, wild boars\n• Bird Sanctuary - Native and migratory birds\n• Reptile House - Snakes, lizards, crocodiles\n• Aquatic Zone - Freshwater fish\n• Children's Zoo - Interactive area for kids\n• Conservation Center - Educational exhibits\n\nUse our interactive map to navigate!";
    }
    
    if (lowerMsg.includes('location') || lowerMsg.includes('where') || lowerMsg.includes('address') || lowerMsg.includes('direction')) {
        return "📍 Zoo Bulusan Location:\n\nBulusan Wildlife Park\nBulusan, Sorsogon 4706\nBicol Region, Philippines\n\n📧 Email: info@zoobulusan.com\n📞 Phone: (056) 123-4567";
    }
    
    if (lowerMsg.includes('event') || lowerMsg.includes('activity') || lowerMsg.includes('program')) {
        return "📅 Check out our Events page for:\n\n• Wildlife educational programs\n• Guided tours\n• Conservation workshops\n• School field trips\n• Special seasonal events\n\nBook in advance for group visits!";
    }
    
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey') || lowerMsg.includes('mabuhay')) {
        return "Mabuhay! 🌿 Welcome to Zoo Bulusan! I'm Zooey, your friendly zoo assistant.\n\nHow can I help you today? I can tell you about:\n• Ticket prices and booking\n• Operating hours\n• Our amazing animals\n• Zoo zones and facilities\n• Events and activities\n\nJust ask away!";
    }
    
    return "Salamat for your question! 🌿\n\nI can help you with:\n• Ticket prices and booking\n• Operating hours (Tue-Sun, 8AM-5PM)\n• Our animal collection\n• Zoo zones and map\n• Events and activities\n\nFeel free to ask about any of these topics, or contact us at info@zoobulusan.com for more specific inquiries!";
};

const ZOO_BULUSAN_CONTEXT = `
You are "Zooey", the official AI assistant for Zoo Bulusan - a premier wildlife sanctuary located in Bulusan, Sorsogon, Philippines. 
You are friendly, knowledgeable, and passionate about wildlife conservation.

ABOUT ZOO BULUSAN:
- Location: Bulusan, Sorsogon, Bicol Region, Philippines
- Established: A community-driven wildlife conservation and eco-tourism destination
- Features: Native Philippine wildlife, interactive exhibits, nature trails, and educational programs

TICKET PRICES:
- Adult (18+): ₱40
- Child (4-17): ₱20  
- Senior Citizens: ₱30
- Students (with ID): ₱25
- Bulusan Residents: FREE (with valid ID)

OPERATING HOURS:
- Tuesday to Sunday: 8:00 AM - 5:00 PM
- Monday: CLOSED (maintenance day)
- Last entry: 4:00 PM

ANIMALS AT ZOO BULUSAN:
1. Philippine Eagle (Maya) - Our national bird, critically endangered
2. Philippine Deer (Bantay) - Native deer found in Luzon forests
3. Philippine Macaque (Unggoy) - Playful native monkeys
4. Reticulated Python (Sawa) - One of the longest snake species
5. Philippine Crocodile (Pusit) - Endemic freshwater crocodile, critically endangered
6. Various native birds, reptiles, and small mammals

ZONES/AREAS:
- Mammal Kingdom: Home to deer, monkeys, wild boars
- Bird Sanctuary: Native and migratory birds
- Reptile House: Snakes, lizards, and crocodiles
- Aquatic Zone: Freshwater fish native to Sorsogon
- Children's Zoo: Interactive area for kids
- Conservation Center: Educational exhibits about wildlife preservation

WEBSITE FEATURES:
1. Online Ticket Booking - Reserve tickets in advance
2. AI Animal Scanner - Use your phone camera to identify animals
3. AnimalDex - Encyclopedia of all zoo animals
4. Interactive Zoo Map - Navigate the park easily
5. Events Calendar - Upcoming zoo activities and programs
6. User Profiles - Track your visits and bookings

CONSERVATION EFFORTS:
- Breeding programs for endangered species
- Wildlife rescue and rehabilitation
- Environmental education for schools
- Community outreach programs

VISITOR TIPS:
- Bring comfortable walking shoes
- Wear light clothing (tropical climate)
- Don't feed the animals unless at designated feeding stations
- Photography is allowed but no flash
- Bring water and stay hydrated
- Download the app for the best experience

CONTACT:
- Email: info@zoobulusan.com
- Phone: (056) 123-4567
- Address: Bulusan Wildlife Park, Bulusan, Sorsogon 4706

When responding:
1. Be helpful, friendly, and informative
2. Use Filipino expressions occasionally (like "Mabuhay!", "Salamat!")
3. Encourage wildlife conservation
4. Promote zoo features and upcoming events
5. Provide accurate information about animals and facilities
6. If unsure, suggest contacting the zoo directly
7. Keep responses concise but thorough
8. Add relevant emojis sparingly for friendliness
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

        const apiKey = process.env.GEMINI_API_KEY;
        
        // Check if API key is configured and not empty
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
            // Provide fallback responses when API key is not configured
            return res.json({
                success: true,
                response: getFallbackResponse(message),
                timestamp: new Date().toISOString(),
                source: 'fallback'
            });
        }

        // If the Google generative client isn't available, return fallback.
        if (!GoogleGenerativeAI) {
            return res.json({
                success: true,
                response: getFallbackResponse(message),
                timestamp: new Date().toISOString(),
                source: 'fallback'
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Try a list of candidate models in order until one succeeds.
        const candidateModels = [
            'gemini-1.5-flash',
            'gemini-1.5',
            'gemini-1.0',
            'chat-bison',
            'text-bison'
        ];

        let chosen = null;
        let finalText = null;

        for (const candidate of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({ model: candidate });

                const chat = model.startChat({
                    history: [
                        {
                            role: 'user',
                            parts: [{ text: 'You are Zooey, the AI assistant for Zoo Bulusan. Here is your context and knowledge base:' }]
                        },
                        {
                            role: 'model',
                            parts: [{ text: ZOO_BULUSAN_CONTEXT }]
                        },
                        ...history.map(msg => ({
                            role: msg.role === 'user' ? 'user' : 'model',
                            parts: [{ text: msg.content }]
                        }))
                    ],
                    generationConfig: {
                        maxOutputTokens: 1000,
                        temperature: 0.7,
                    }
                });

                const result = await chat.sendMessage(message);
                const response = await result.response;
                const text = response.text();

                finalText = text;
                chosen = candidate;
                break; // success, stop trying other models
            } catch (err) {
                // If a model isn't available or fails, try the next one
                console.warn(`AI model ${candidate} failed:`, err?.message || err);
                continue;
            }
        }

        if (chosen) {
            res.json({
                success: true,
                response: finalText,
                timestamp: new Date().toISOString(),
                source: chosen
            });
            return;
        }

        // If no model succeeded, fall back to canned responses
        return res.json({
            success: true,
            response: getFallbackResponse(message),
            timestamp: new Date().toISOString(),
            source: 'fallback'
        });

    } catch (error) {
        console.error('AI Chat Error:', error);
        // Fallback to basic responses if Gemini API fails
        return res.json({
            success: true,
            response: getFallbackResponse(req.body.message || ''),
            timestamp: new Date().toISOString(),
            source: 'fallback'
        });
    }
});

router.get('/status', (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    res.json({
        success: true,
        configured: !!(apiKey && apiKey.trim().length > 0),
        assistant: 'Zooey',
        version: '1.0.0'
    });
});

module.exports = router;
