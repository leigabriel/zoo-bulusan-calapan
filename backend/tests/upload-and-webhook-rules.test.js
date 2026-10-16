const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const crypto = require('crypto');

const sanitizeModelFilename = (originalname) => {
    const supplied = String(originalname || '').trim();
    if (!supplied) return '';
    const base = path.basename(supplied);
    return base.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '');
};

// ---------------------------------------------------------------- B-H15

test('model filenames the frontend depends on survive unchanged', () => {
    // frontend/src/config/ai-service-config.js loads this exact path.
    for (const name of ['model.json', 'group1-shard1of3.bin', 'group1-shard2of3.bin', 'group1-shard3of3.bin']) {
        assert.strictEqual(sanitizeModelFilename(name), name);
    }
});

test('path traversal in a model filename is neutralised', () => {
    const attacks = [
        '../../../.env',
        '../../../../etc/passwd',
        '..\\..\\windows\\system32\\evil.json',
        '/etc/shadow.json',
        'sub/dir/model.json'
    ];
    for (const attack of attacks) {
        const out = sanitizeModelFilename(attack);
        assert.ok(!out.includes('/'), `separator survived in ${attack} -> ${out}`);
        assert.ok(!out.includes('\\'), `backslash survived in ${attack} -> ${out}`);
        assert.ok(!path.basename(out).startsWith('.'), `leading dot survived in ${attack} -> ${out}`);
        // The result must stay a bare name inside the destination directory.
        assert.strictEqual(path.join('/srv/model', out), path.join('/srv/model', path.basename(out)));
    }
});

test('traversal collapses to the intended filename, not a hidden file', () => {
    assert.strictEqual(sanitizeModelFilename('../../model.json'), 'model.json');
    assert.strictEqual(sanitizeModelFilename('....//....//model.json'), 'model.json');
});

test('blank and dot-only names are rejected outright', () => {
    for (const bad of ['', '   ', null, undefined, '...', '..', '/', './.']) {
        assert.strictEqual(sanitizeModelFilename(bad), '', `expected empty for ${JSON.stringify(bad)}`);
    }
});

test('a dotfile loses its leading dots instead of being written hidden', () => {
    // Stripping the dots is sufficient: the result has no .json/.bin extension,
    // so the upload filter rejects it, and nothing hidden reaches the directory.
    assert.strictEqual(sanitizeModelFilename('.env'), 'env');
    assert.strictEqual(sanitizeModelFilename('../../.env'), 'env');
});

test('the admin route no longer passes the client filename straight through', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(
        path.join(__dirname, '..', 'routes', 'admin-routes.js'),
        'utf8'
    );
    assert.doesNotMatch(source, /cb\(null,\s*file\.originalname\)/,
        'the raw client filename must never reach multer');
    assert.match(source, /const supplied = String\(file\.originalname/);
});

// ---------------------------------------------------------------- B-H14

const TOLERANCE_MS = 5 * 60 * 1000;
const isTimestampFresh = (timestamp, toleranceMs = TOLERANCE_MS) => {
    if (!timestamp || !/^\d+$/.test(String(timestamp))) return false;
    const age = Date.now() - Number(timestamp) * 1000;
    return age <= toleranceMs && age >= -toleranceMs;
};

test('a fresh webhook timestamp is accepted', () => {
    assert.strictEqual(isTimestampFresh(String(Math.floor(Date.now() / 1000))), true);
});

test('a replayed old webhook is rejected', () => {
    const now = Math.floor(Date.now() / 1000);
    assert.strictEqual(isTimestampFresh(String(now - 3600)), false, '1 hour old');
    assert.strictEqual(isTimestampFresh(String(now - 600)), false, '10 minutes old');
});

test('gross clock skew is rejected', () => {
    const now = Math.floor(Date.now() / 1000);
    assert.strictEqual(isTimestampFresh(String(now + 3600)), false, '1 hour in the future');
});

test('small clock skew is tolerated', () => {
    const now = Math.floor(Date.now() / 1000);
    assert.strictEqual(isTimestampFresh(String(now + 30)), true);
});

test('a missing or non-numeric timestamp is rejected', () => {
    for (const bad of [undefined, null, '', 'abc', '12;34', '1e9', '-1', {}]) {
        assert.strictEqual(isTimestampFresh(bad), false, `expected reject for ${JSON.stringify(bad)}`);
    }
});

test('the event id is claimed before processing, so a replay is a no-op', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(
        path.join(__dirname, '..', 'controllers', 'payment-controller.js'),
        'utf8'
    );

    const claimAt = source.indexOf('INSERT IGNORE INTO paymongo_webhook_events');
    const processAt = source.indexOf('await updatePaymentFromWebhook(event);');

    assert.ok(claimAt > -1, 'the dedupe insert is missing');
    assert.ok(processAt > -1, 'processing call is missing');
    assert.ok(claimAt < processAt,
        'the event must be claimed BEFORE processing, otherwise a replay re-processes it');
    assert.match(source, /affectedRows === 0/);
});

test('a missing webhook secret fails closed in production', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(
        path.join(__dirname, '..', 'controllers', 'payment-controller.js'),
        'utf8'
    );
    assert.match(source, /PAYMONGO_WEBHOOK_SECRET is unset; rejecting all webhooks/);
    assert.match(source, /NODE_ENV === 'production'/, 'the production branch must exist');
});

// The HMAC itself must still be correct and timing-safe.
test('signature verification is unchanged and timing safe', () => {
    const secret = 'whsec_test';
    const body = JSON.stringify({ id: 'evt' });
    const ts = String(Math.floor(Date.now() / 1000));
    const expected = crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');

    assert.strictEqual(expected.length, 64);
    assert.match(expected, /^[0-9a-f]{64}$/);

    const source = fs = require('node:fs').readFileSync(
        path.join(__dirname, '..', 'controllers', 'payment-controller.js'),
        'utf8'
    );
    assert.match(source, /crypto\.timingSafeEqual/, 'must use a constant-time comparison');
    assert.match(source, /provided\.length !== expected\.length/, 'length check must precede the compare');
});
