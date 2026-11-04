const test = require('node:test');
const assert = require('node:assert/strict');
const { submitContact, clean, cleanLine, LIMITS } = require('../controllers/contact-controller');

const responseRecorder = () => ({
    statusCode: null,
    body: null,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(payload) {
        this.body = payload;
        return this;
    }
});

test('contact form keeps single-line fields on one line', () => {
    assert.equal(cleanLine('  Jane\r\nDoe  ', LIMITS.name), 'Jane Doe');
    assert.equal(cleanLine('Cannot log in', LIMITS.subject), 'Cannot log in');
});

test('contact form bounds every field', () => {
    assert.equal(clean('x'.repeat(5000), LIMITS.concern).length, LIMITS.concern);
    assert.equal(clean(null, 10), '');
});

test('contact form rejects missing fields before sending', async () => {
    const res = responseRecorder();
    await submitContact({ body: {} }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
});

test('contact form rejects a malformed email before sending', async () => {
    const res = responseRecorder();
    await submitContact({
        body: {
            name: 'Jane',
            email: 'not-an-email',
            subject: 'Login problem',
            concern: 'I cannot sign in.'
        }
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
});
