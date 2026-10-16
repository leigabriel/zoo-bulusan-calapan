/**
 * Input bounds for the public AI assistant.
 *
 * POST /api/ai/chat is reachable without authentication (the /help page is
 * public), so `message` and `history` are attacker-controlled and are forwarded
 * verbatim to a metered Gemini key. The global body parser accepts up to 10mb,
 * which means an anonymous caller could otherwise push an arbitrarily large
 * conversation into the model on every request.
 *
 * These bounds are deliberately generous for a zoo visitor asking questions
 * about animals and tickets, while keeping the token cost of any single request
 * bounded. They trim rather than reject wherever a sane result is still
 * possible, so normal conversations are unaffected.
 */

/** Characters allowed in a single user message. */
const MAX_MESSAGE_CHARS = 2000;

/** Conversation turns forwarded to the model. The most recent turns matter most. */
const MAX_HISTORY_TURNS = 20;

/** Characters allowed in one history turn. */
const MAX_TURN_CHARS = 2000;

/** Total characters allowed across all forwarded history. */
const MAX_HISTORY_CHARS = 8000;

/**
 * Coerce an unknown value to a trimmed string.
 * @param {unknown} value
 * @returns {string}
 */
const asText = (value) => (typeof value === 'string' ? value.trim() : '');

/**
 * Normalise a single history turn into the shape the Gemini SDK expects.
 * @param {unknown} turn - Untrusted value from the request body
 * @returns {{role: 'user'|'model', parts: {text: string}[]}|null} null if unusable
 */
const normalizeTurn = (turn) => {
    if (!turn || typeof turn !== 'object' || Array.isArray(turn)) return null;

    const text = asText(turn.content);
    if (!text) return null;

    return {
        role: turn.role === 'user' ? 'user' : 'model',
        parts: [{ text: text.slice(0, MAX_TURN_CHARS) }]
    };
};

/**
 * Bound an untrusted `history` value.
 *
 * Anything that is not an array yields an empty conversation rather than
 * throwing, which also removes a 500 that a caller could trigger by sending
 * `history` as a string or an object.
 *
 * @param {unknown} history - Untrusted value from the request body
 * @returns {{role: 'user'|'model', parts: {text: string}[]}[]}
 */
const normalizeHistory = (history) => {
    if (!Array.isArray(history)) return [];

    const turns = [];
    let budget = MAX_HISTORY_CHARS;

    // Walk backwards so the newest turns survive the budget, then restore order.
    for (let i = history.length - 1; i >= 0 && turns.length < MAX_HISTORY_TURNS; i--) {
        const normalized = normalizeTurn(history[i]);
        if (!normalized) continue;

        const cost = normalized.parts[0].text.length;
        if (cost > budget) continue;

        budget -= cost;
        turns.push(normalized);
    }

    return turns.reverse();
};

/**
 * Validate the user's current message.
 *
 * @param {unknown} message - Untrusted value from the request body
 * @returns {{ok: true, message: string}|{ok: false}}
 */
const normalizeMessage = (message) => {
    const text = asText(message);
    if (!text) return { ok: false };
    return { ok: true, message: text.slice(0, MAX_MESSAGE_CHARS) };
};

module.exports = {
    normalizeMessage,
    normalizeHistory,
    MAX_MESSAGE_CHARS,
    MAX_HISTORY_TURNS,
    MAX_TURN_CHARS,
    MAX_HISTORY_CHARS
};