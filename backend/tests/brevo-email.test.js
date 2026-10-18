const test = require('node:test');
const assert = require('node:assert/strict');

const BREVO_KEYS = ['BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'BREVO_SENDER_NAME'];

/**
 * Brevo is the production transport, so the payload shape and the retry policy
 * are pinned here: a rejected key must not be retried, while a server fault
 * should be.
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

/** Replaces global.fetch and records every request it received. */
const stubFetch = (t, handler) => {
    const original = global.fetch;
    const calls = [];
    global.fetch = async (url, options) => {
        calls.push({ url, options, body: JSON.parse(options.body) });
        return handler(calls.length);
    };
    t.after(() => { global.fetch = original; });
    return calls;
};

const jsonResponse = (status, payload = {}) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
    text: async () => JSON.stringify(payload)
});

const loadEmail = () => require('../utils/email');

test('posts to the Brevo transactional endpoint with the documented payload', async (t) => {
    withBrevoEnv(t);
    const calls = stubFetch(t, () => jsonResponse(201, { messageId: '<abc@relay.brevo.com>' }));

    const { sendEmailWithRetry } = loadEmail();
    const sent = await sendEmailWithRetry({
        from: '"Bulusan Zoo" <no-reply@bulusanzoo.com>',
        to: 'visitor@example.com',
        subject: 'Verify Your Email - Bulusan Zoo',
        html: '<p>hello</p>',
        text: 'hello'
    }, 1, 1);

    assert.equal(sent, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].options.headers['api-key'], 'xkeysib-test-key');
    assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
    assert.deepEqual(calls[0].body.sender, { name: 'Bulusan Zoo', email: 'no-reply@bulusanzoo.com' });
    assert.deepEqual(calls[0].body.to, [{ email: 'visitor@example.com' }]);
    assert.equal(calls[0].body.subject, 'Verify Your Email - Bulusan Zoo');
    assert.equal(calls[0].body.htmlContent, '<p>hello</p>');
    assert.equal(calls[0].body.textContent, 'hello');
});

test('uses BREVO_SENDER_NAME when one is configured', async (t) => {
    withBrevoEnv(t, { BREVO_SENDER_NAME: 'Bulusan Zoo & Wildlife Park' });
    const calls = stubFetch(t, () => jsonResponse(201, { messageId: 'x' }));

    const { sendEmailWithRetry } = loadEmail();
    await sendEmailWithRetry({ to: 'visitor@example.com', subject: 'Hi', html: '<p>hi</p>' }, 1, 1);

    assert.deepEqual(calls[0].body.sender, { name: 'Bulusan Zoo & Wildlife Park', email: 'no-reply@bulusanzoo.com' });
});

test('does not retry a rejected API key', async (t) => {
    withBrevoEnv(t);
    const calls = stubFetch(t, () => jsonResponse(401, { code: 'unauthorized', message: 'Key not found' }));

    const { sendEmailWithRetry } = loadEmail();
    const sent = await sendEmailWithRetry({ to: 'visitor@example.com', subject: 'Hi', html: '<p>hi</p>' }, 3, 1);

    assert.equal(sent, false);
    assert.equal(calls.length, 1, 'a rejected key must fail immediately, not three times');
});

test('does not retry an invalid payload', async (t) => {
    withBrevoEnv(t);
    const calls = stubFetch(t, () => jsonResponse(400, { code: 'missing_parameter', message: 'sender is required' }));

    const { sendEmailWithRetry } = loadEmail();
    const sent = await sendEmailWithRetry({ to: 'visitor@example.com', subject: 'Hi', html: '<p>hi</p>' }, 3, 1);

    assert.equal(sent, false);
    assert.equal(calls.length, 1);
});

test('retries a server fault and reports failure when it never recovers', async (t) => {
    withBrevoEnv(t);
    const calls = stubFetch(t, () => jsonResponse(500, { message: 'Internal server error' }));

    const { sendEmailWithRetry } = loadEmail();
    const sent = await sendEmailWithRetry({ to: 'visitor@example.com', subject: 'Hi', html: '<p>hi</p>' }, 3, 1);

    assert.equal(sent, false);
    assert.equal(calls.length, 3, 'a 5xx should use every attempt');
});

test('retries a rate limit', async (t) => {
    withBrevoEnv(t);
    const calls = stubFetch(t, attempt => (attempt < 2
        ? jsonResponse(429, { message: 'Too many requests' })
        : jsonResponse(201, { messageId: 'recovered' })));

    const { sendEmailWithRetry } = loadEmail();
    const sent = await sendEmailWithRetry({ to: 'visitor@example.com', subject: 'Hi', html: '<p>hi</p>' }, 3, 1);

    assert.equal(sent, true);
    assert.equal(calls.length, 2);
});

test('treats a transport error as retryable', async (t) => {
    withBrevoEnv(t);
    const original = global.fetch;
    let calls = 0;
    global.fetch = async () => {
        calls += 1;
        if (calls === 1) throw new Error('fetch failed');
        return jsonResponse(201, { messageId: 'recovered' });
    };
    t.after(() => { global.fetch = original; });

    const { sendEmailWithRetry } = loadEmail();
    assert.equal(await sendEmailWithRetry({ to: 'visitor@example.com', subject: 'Hi', html: '<p>hi</p>' }, 2, 1), true);
    assert.equal(calls, 2);
});

test('falls back to SMTP when no Brevo sender is verified', async (t) => {
    // A key without BREVO_SENDER_EMAIL is not usable, so SMTP must still be
    // reachable rather than failing the request outright.
    withBrevoEnv(t, { BREVO_SENDER_EMAIL: undefined });
    for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']) delete process.env[key];

    const { sendEmailWithRetry } = loadEmail();
    const sent = await sendEmailWithRetry({ to: 'visitor@example.com', subject: 'Hi', html: '<p>hi</p>' }, 1, 1);

    assert.equal(sent, false, 'no transport configured resolves false rather than throwing');
});

test('omits the text part when no plain-text body is supplied', async (t) => {
    withBrevoEnv(t);
    const calls = stubFetch(t, () => jsonResponse(201, { messageId: 'x' }));

    const { sendEmailWithRetry } = loadEmail();
    await sendEmailWithRetry({ to: 'visitor@example.com', subject: 'Hi', html: '<p>hi</p>' }, 1, 1);

    assert.equal('textContent' in calls[0].body, false);
});