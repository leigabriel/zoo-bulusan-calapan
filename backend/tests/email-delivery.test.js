const test = require('node:test');
const assert = require('node:assert/strict');
const { sendNotificationEmail } = require('../utils/email');

const clearSmtpEnv = (t) => {
    const previous = {};
    for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']) {
        previous[key] = process.env[key];
        delete process.env[key];
    }
    t.after(() => {
        for (const [key, value] of Object.entries(previous)) {
            if (value !== undefined) process.env[key] = value;
        }
    });
};

test('returns a promise rather than a bare boolean', () => {
    const result = sendNotificationEmail('visitor@example.com', 'Maria', 'Ticket confirmed', 'Your ticket is confirmed.', '/reservations');
    assert.ok(result instanceof Promise);
    return result;
});

test('resolves false when SMTP is not configured instead of throwing', async (t) => {
    clearSmtpEnv(t);
    assert.equal(
        await sendNotificationEmail('visitor@example.com', 'Maria', 'Hi', 'There', null),
        false
    );
});

test('resolves false for a missing recipient', async () => {
    assert.equal(await sendNotificationEmail(null, 'Maria', 'Hi', 'There', null), false);
});