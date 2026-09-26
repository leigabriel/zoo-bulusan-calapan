const fs = require('fs');
const path = require('path');

const JIJI_PROMPT_DIR = path.join(__dirname, '..', 'prompts', 'jiji');

const JIJI_PROMPT_FILES = [
    'instruction.md',
    'factuality.md',
    'security.md',
    'formatting.md',
    'website-help.md',
    'animals.md'
];

const FILE_SEPARATOR = '\n\n---\n\n';

// Last resort used only when none of the markdown files can be read.
const FALLBACK_INSTRUCTIONS = `# Jiji AI Assistant

You are Jiji, the official AI visitor assistant for Bulusan Zoo.

Never invent, guess, or fabricate information.

If information cannot be verified or is unavailable, clearly say so.`;

let cachedText = null;
let cachedStamps = null;
const warnedFiles = new Set();

const getStamp = (filePath) => {
    const stats = fs.statSync(filePath);
    return `${stats.mtimeMs}:${stats.size}`;
};

const haveStampsChanged = (stamps) => Object.keys(stamps).length !== JIJI_PROMPT_FILES.length
    || Object.entries(stamps).some(([fileName, stamp]) => {
        try {
            return getStamp(path.join(JIJI_PROMPT_DIR, fileName)) !== stamp;
        } catch (error) {
            return true;
        }
    });

const loadJijiInstructions = () => {
    const parts = [];
    const stamps = {};

    for (const fileName of JIJI_PROMPT_FILES) {
        const filePath = path.join(JIJI_PROMPT_DIR, fileName);
        try {
            stamps[fileName] = getStamp(filePath);
            parts.push(fs.readFileSync(filePath, 'utf8').replace(/\s+$/, ''));
        } catch (error) {
            if (!warnedFiles.has(fileName)) {
                warnedFiles.add(fileName);
                console.error(`Jiji prompt file could not be read (${fileName}): ${error.message}`);
            }
        }
    }

    if (parts.length === 0) {
        console.error('No Jiji prompt markdown files could be loaded. Using minimal fallback instructions.');
        return { text: FALLBACK_INSTRUCTIONS, stamps: {} };
    }

    return { text: parts.join(FILE_SEPARATOR), stamps };
};

const getJijiInstructions = () => {
    if (!cachedText || !cachedStamps || haveStampsChanged(cachedStamps)) {
        const loaded = loadJijiInstructions();
        cachedText = loaded.text;
        cachedStamps = loaded.stamps;
    }
    return cachedText;
};

// Builds the exact system prompt string that is sent to Gemini for Jiji chats.
const buildJijiSystemPrompt = (dynamicContext = '', userReservationContext = '', message = '') =>
    `${getJijiInstructions()}${dynamicContext}${userReservationContext}\n\nUser's question: ${message}`;

module.exports = {
    JIJI_PROMPT_FILES,
    getJijiInstructions,
    buildJijiSystemPrompt
};
