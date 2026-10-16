const test = require('node:test');
const assert = require('node:assert');

const {
    normalizeMessage,
    normalizeHistory,
    MAX_MESSAGE_CHARS,
    MAX_HISTORY_TURNS,
    MAX_TURN_CHARS,
    MAX_HISTORY_CHARS
} = require('../utils/ai-input');

test('normalizeMessage', async (t) => {
    await t.test('accepts a normal message', () => {
        assert.deepStrictEqual(normalizeMessage('What animals do you have?'), {
            ok: true,
            message: 'What animals do you have?'
        });
    });

    await t.test('trims surrounding whitespace', () => {
        assert.strictEqual(normalizeMessage('  hello  ').message, 'hello');
    });

    await t.test('rejects empty, whitespace and missing values', () => {
        for (const bad of ['', '   ', null, undefined, 0, false, [], {}]) {
            assert.strictEqual(normalizeMessage(bad).ok, false, `expected reject for ${JSON.stringify(bad)}`);
        }
    });

    await t.test('caps an oversized message instead of rejecting it', () => {
        const result = normalizeMessage('a'.repeat(50_000));
        assert.strictEqual(result.ok, true);
        assert.strictEqual(result.message.length, MAX_MESSAGE_CHARS);
    });

    await t.test('rejects non-string messages that could smuggle objects', () => {
        assert.strictEqual(normalizeMessage({ toString: () => 'x' }).ok, false);
    });
});

test('normalizeHistory', async (t) => {
    await t.test('keeps a normal conversation intact and in order', () => {
        const history = [
            { role: 'user', content: 'hi' },
            { role: 'model', content: 'hello' },
            { role: 'user', content: 'open times?' }
        ];
        const result = normalizeHistory(history);
        assert.strictEqual(result.length, 3);
        assert.deepStrictEqual(result.map(r => r.parts[0].text), ['hi', 'hello', 'open times?']);
        assert.deepStrictEqual(result.map(r => r.role), ['user', 'model', 'user']);
    });

    await t.test('coerces any non-user role to model', () => {
        const result = normalizeHistory([{ role: 'assistant', content: 'x' }]);
        assert.strictEqual(result[0].role, 'model');
    });

    await t.test('returns empty for non-array input instead of throwing', () => {
        // A string history previously caused TypeError -> 500
        for (const bad of ['hello', 42, {}, null, undefined, true]) {
            assert.deepStrictEqual(normalizeHistory(bad), [], `expected [] for ${JSON.stringify(bad)}`);
        }
    });

    await t.test('drops turns that are not usable objects', () => {
        const result = normalizeHistory([
            null,
            'a string turn',
            123,
            [],
            { role: 'user' },
            { role: 'user', content: '   ' },
            { role: 'user', content: 'kept' }
        ]);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].parts[0].text, 'kept');
    });

    await t.test('caps the number of turns', () => {
        const many = Array.from({ length: 500 }, (_, i) => ({ role: 'user', content: `turn ${i}` }));
        const result = normalizeHistory(many);
        assert.strictEqual(result.length, MAX_HISTORY_TURNS);
        assert.strictEqual(result[result.length - 1].parts[0].text, 'turn 499');
    });

    await t.test('caps a single oversized turn', () => {
        const result = normalizeHistory([{ role: 'user', content: 'x'.repeat(100_000) }]);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].parts[0].text.length, MAX_TURN_CHARS);
    });

    await t.test('bounds the total history budget', () => {
        const huge = Array.from({ length: 100 }, () => ({ role: 'user', content: 'y'.repeat(MAX_TURN_CHARS) }));
        const result = normalizeHistory(huge);
        const total = result.reduce((sum, r) => sum + r.parts[0].text.length, 0);
        assert.ok(total <= MAX_HISTORY_CHARS, `total ${total} should be <= ${MAX_HISTORY_CHARS}`);
    });

    await t.test('survives a megabyte-scale payload', () => {
        // The global body parser accepts 10mb; this must not exhaust memory or throw.
        const payload = Array.from({ length: 2000 }, () => ({ role: 'user', content: 'z'.repeat(2000) }));
        const result = normalizeHistory(payload);
        const total = result.reduce((sum, r) => sum + r.parts[0].text.length, 0);
        assert.ok(result.length <= MAX_HISTORY_TURNS);
        assert.ok(total <= MAX_HISTORY_CHARS);
    });

    await t.test('produces exactly the shape the Gemini SDK expects', () => {
        const result = normalizeHistory([{ role: 'user', content: 'hi' }]);
        assert.deepStrictEqual(Object.keys(result[0]).sort(), ['parts', 'role']);
        assert.deepStrictEqual(Object.keys(result[0].parts[0]), ['text']);
    });
});