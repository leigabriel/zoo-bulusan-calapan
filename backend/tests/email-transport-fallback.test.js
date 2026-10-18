const test = require('node:test');
const assert = require('node:assert/strict');

const { sendEmailWithRetry } = require('../utils/email');

const BREVO_KEYS = ['BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'BREVO_SENDER_NAME'];

/**
 * A deployment without its Brevo variables keeps relaying through SMTP, which
 * reads like "the Brevo change never deployed". The warning is what makes that
 * visible in the logs, so it is asserted here.
 */
const withBrevoEnv = (t, overrides = {}) => {
    const previous = {};
    const values = { BREVO_API_KEY: 'xkeysib-test-key', BREVO_SENDER_EMAIL: 'no-reply@bulusanzoo.com', ...overrides };
    for (const key of BREVO_KEYS) {
        previous[key] = process.env[key];
        if (values[key] === undefined) delete process.env[key];
        else process.env[key] = values[key];
    }
    t.after(() => {
        for (const [key, value] of Object.entries(previous)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    });
};

/** Captures console.warn/error so the structured [Email] lines can be asserted. */
const captureLogs = (t) => {
    const lines = [];
    const originals = { warn: console.warn, error: console.error };
    console.warn = (...args) => lines.push(args.join(' '));
    console.error = (...args) => lines.push(args.join(' '));
    t.after(() => { console.warn = originals.warn; console.error = originals.error; });
    return lines;
};

test('warns once that it is relaying through SMTP when Brevo is not configured', async (t) => {
    withBrevoEnv(t, { BREVO_API_KEY: undefined, BREVO_SENDER_EMAIL: undefined });
    for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']) delete process.env[key];

    const lines = captureLogs(t);

    await sendEmailWithRetry({ to: 'visitor@example.com', subject: 'One', html: '<p>1</p>' }, 1, 1);
    await sendEmailWithRetry({ to: 'visitor@example.com', subject: 'Two', html: '<p>2</p>' }, 1, 1);

    const warnings = lines.filter(line => line.includes('relaying through SMTP'));
    assert.equal(warnings.length, 1, 'the fallback warning is emitted once per process, not per email');
    assert.match(warnings[0], /BREVO_API_KEY/);
    assert.match(warnings[0], /BREVO_SENDER_EMAIL/);
});

test('stays quiet about SMTP when Brevo is configured', async (t) => {
    withBrevoEnv(t);
    const calls = [];
    const original = global.fetch;
    global.fetch = async (url, options) => {
        calls.push({ url, options });
        return { ok: true, status: 201, json: async () => ({ messageId: 'x' }), text: async () => '' };
    };
    t.after(() => { global.fetch = original; });

    const lines = captureLogs(t);
    await sendEmailWithRetry({ to: 'visitor@example.com', subject: 'Hi', html: '<p>hi</p>' }, 1, 1);

    assert.equal(lines.filter(line => line.includes('relaying through SMTP')).length, 0);
    assert.equal(calls.length, 1);
});