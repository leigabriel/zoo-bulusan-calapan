const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JIJI_PROMPT_FILES, getJijiInstructions, buildJijiSystemPrompt } = require('../services/jiji-prompt-service');

const PROMPT_MARKERS = {
    'instruction.md': 'You are Jiji, the official AI visitor assistant for Bulusan Zoo.',
    'factuality.md': 'Current application data takes priority over static instructions',
    'security.md': 'I cannot provide confidential internal system information.',
    'formatting.md': "Answer the user's question first.",
    'website-help.md': 'Do not invent page names, buttons, URLs, features, or workflows.',
    'animals.md': 'Never claim an animal is currently at Bulusan Zoo'
};

test('loads and combines every jiji markdown instruction file', () => {
    const instructions = getJijiInstructions();

    for (const fileName of JIJI_PROMPT_FILES) {
        const marker = PROMPT_MARKERS[fileName];
        assert.ok(marker, `no marker defined for ${fileName}`);
        assert.ok(instructions.includes(marker), `content from ${fileName} is missing`);
    }

    const positions = JIJI_PROMPT_FILES.map((fileName) => instructions.indexOf(PROMPT_MARKERS[fileName]));
    const sorted = [...positions].sort((a, b) => a - b);
    assert.deepEqual(positions, sorted, 'files are not combined in the declared order');
});

test('combined instructions contain no outdated or conflicting facts', () => {
    const instructions = getJijiInstructions();

    assert.ok(!instructions.includes('P50'), 'old ticket prices still present');
    assert.ok(!instructions.includes('info@zoobulusan.com'), 'old contact email still present');
    assert.ok(!instructions.includes('(043) 123-4567'), 'old phone number still present');
    assert.ok(!instructions.includes('Bulusan Wildlife Park'), 'old facility name still present');
});

test('builds the exact system prompt sent to Gemini from instructions plus dynamic context', () => {
    const dynamicContext = '\nCURRENT ZOO DATA (Live from database):\n- Total Animals: 42';
    const userReservationContext = '\n\nLOGGED-IN USER RESERVATION DATA (only for the person who is chatting with you):\n- Active ticket reservations: 1';

    const systemPrompt = buildJijiSystemPrompt(dynamicContext, userReservationContext, 'How many animals do you have?');

    for (const marker of Object.values(PROMPT_MARKERS)) {
        assert.ok(systemPrompt.includes(marker), `markdown instructions were not passed into the Gemini prompt: ${marker}`);
    }
    assert.ok(systemPrompt.includes(dynamicContext.trim()), 'dynamic database context is missing from the Gemini prompt');
    assert.ok(systemPrompt.includes(userReservationContext.trim()), 'user reservation context is missing from the Gemini prompt');
    assert.ok(systemPrompt.endsWith("User's question: How many animals do you have?"), 'user question must be appended last');

    const instructionEnd = systemPrompt.indexOf(PROMPT_MARKERS['animals.md']);
    const dynamicStart = systemPrompt.indexOf('CURRENT ZOO DATA');
    assert.ok(instructionEnd < dynamicStart, 'static instructions must come before dynamic data');
});

test('ai routes use the prompt service instead of the old hard-coded jiji prompt', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'ai-routes.js'), 'utf8');

    assert.ok(!source.includes('ZOO_BULUSAN_CONTEXT'), 'old hard-coded prompt is still referenced');
    assert.ok(source.includes("require('../services/jiji-prompt-service')"), 'prompt service is not required');
    assert.ok(source.includes('buildJijiSystemPrompt(dynamicContext, userReservationContext, message)'), 'chat route does not build the prompt from the markdown files');
    assert.ok(source.includes('CURRENT APPLICATION VISITOR INFORMATION'), 'current application data is not supplied as dynamic context');
    assert.ok(source.includes('sanitizePlainText(text)'), 'jiji responses are not sanitized to plain text before returning');
    assert.ok(!source.includes('P50'), 'conflicting old ticket prices remain in ai routes');
    assert.ok(!source.includes('info@zoobulusan.com'), 'conflicting old contact email remains in ai routes');
    assert.ok(!source.includes('(043) 123-4567'), 'conflicting old phone number remains in ai routes');
});
