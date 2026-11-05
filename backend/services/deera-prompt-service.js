const fs = require('fs');
const path = require('path');

const DEERA_PROMPT_DIR = path.join(__dirname, '..', 'prompts', 'deera');

const DEERA_PROMPT_FILES = [
    'instruction.md',
    'factuality.md',
    'security.md',
    'formatting.md',
    'website-help.md',
    'animals.md'
];

const FILE_SEPARATOR = '\n\n---\n\n';

// Last resort used only when none of the markdown files can be read.
const FALLBACK_INSTRUCTIONS = `# Deera AI Assistant

You are Deera, the official AI visitor assistant for Bulusan Zoo.

Never invent, guess, or fabricate information.

If information cannot be verified or is unavailable, clearly say so.`;

let cachedText = null;
let cachedStamps = null;
const warnedFiles = new Set();

const getStamp = (filePath) => {
    const stats = fs.statSync(filePath);
    return `${stats.mtimeMs}:${stats.size}`;
};

const haveStampsChanged = (stamps) => Object.keys(stamps).length !== DEERA_PROMPT_FILES.length
    || Object.entries(stamps).some(([fileName, stamp]) => {
        try {
            return getStamp(path.join(DEERA_PROMPT_DIR, fileName)) !== stamp;
        } catch (error) {
            return true;
        }
    });

const loadDeeraInstructions = () => {
    const parts = [];
    const stamps = {};

    for (const fileName of DEERA_PROMPT_FILES) {
        const filePath = path.join(DEERA_PROMPT_DIR, fileName);
        try {
            stamps[fileName] = getStamp(filePath);
            parts.push(fs.readFileSync(filePath, 'utf8').replace(/\s+$/, ''));
        } catch (error) {
            if (!warnedFiles.has(fileName)) {
                warnedFiles.add(fileName);
                console.error(`Deera prompt file could not be read (${fileName}): ${error.message}`);
            }
        }
    }

    if (parts.length === 0) {
        console.error('No Deera prompt markdown files could be loaded. Using minimal fallback instructions.');
        return { text: FALLBACK_INSTRUCTIONS, stamps: {} };
    }

    return { text: parts.join(FILE_SEPARATOR), stamps };
};

const getDeeraInstructions = () => {
    if (!cachedText || !cachedStamps || haveStampsChanged(cachedStamps)) {
        const loaded = loadDeeraInstructions();
        cachedText = loaded.text;
        cachedStamps = loaded.stamps;
    }
    return cachedText;
};

// Builds the exact system prompt string that is sent to Gemini for Deera chats.
const buildDeeraSystemPrompt = (dynamicContext = '', userReservationContext = '', message = '') =>
    `${getDeeraInstructions()}${dynamicContext}${userReservationContext}\n\nUser's question: ${message}`;

module.exports = {
    DEERA_PROMPT_FILES,
    getDeeraInstructions,
    buildDeeraSystemPrompt
};
