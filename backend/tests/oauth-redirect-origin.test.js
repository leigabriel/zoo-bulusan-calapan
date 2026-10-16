const test = require('node:test');
const assert = require('node:assert');

const {
    buildAllowedOrigins,
    resolveTrustedFrontendOrigin
} = require('../utils/cors-origins');

const env = { FRONTEND_URL: 'https://bulusanzoo.com' };
const allowed = buildAllowedOrigins(env);
const resolve = (referer) => resolveTrustedFrontendOrigin(referer, allowed, env);

// The two attacks the removed heuristic accepted.
test('attacker host on port 5173 is rejected', () => {
    assert.strictEqual(resolve('https://evil.com:5173/login'), 'https://bulusanzoo.com');
    assert.strictEqual(resolve('http://evil.com:5173'), 'https://bulusanzoo.com');
});

test('attacker host with a path containing /login is rejected', () => {
    assert.strictEqual(resolve('https://evil.com/x/login'), 'https://bulusanzoo.com');
    assert.strictEqual(resolve('https://evil.com/login/../..'), 'https://bulusanzoo.com');
});

test('a lookalike of the real domain is rejected', () => {
    for (const bad of [
        'https://bulusanzoo.com.evil.com/login',
        'https://bulusanzoo-com.evil.com:5173',
        'https://bulusanzoo.com@evil.com'
    ]) {
        assert.strictEqual(resolve(bad), 'https://bulusanzoo.com', `expected fallback for ${bad}`);
    }
});

test('the genuine frontend origin is honoured', () => {
    assert.strictEqual(resolve('https://bulusanzoo.com/login'), 'https://bulusanzoo.com');
    assert.strictEqual(resolve('https://www.bulusanzoo.com/login'), 'https://www.bulusanzoo.com');
});

// The feature the heuristic existed to support must keep working.
test('localhost and LAN origins still work (on-site testing)', () => {
    assert.strictEqual(resolve('http://localhost:5173/login'), 'http://localhost:5173');
    assert.strictEqual(resolve('http://192.168.1.20:5173/login'), 'http://192.168.1.20:5173');
    assert.strictEqual(resolve('http://10.0.0.5:3000/login'), 'http://10.0.0.5:3000');
});

test('the result is always an origin, with no path or query', () => {
    for (const ref of ['https://bulusanzoo.com/login?next=/admin', 'http://localhost:5173/a/b?c=d']) {
        const out = resolve(ref);
        // protocol + host only, nothing after it
        assert.match(out, /^https?:\/\/[^/?#]+$/, `expected a bare origin, got ${out}`);
    }
});

test('missing or malformed headers fall back safely', () => {
    for (const bad of [undefined, null, '', 'not a url', 'javascript:alert(1)', '//evil.com']) {
        assert.strictEqual(resolve(bad), 'https://bulusanzoo.com', `expected fallback for ${String(bad)}`);
    }
});

test('never returns an origin outside the allow-list', () => {
    for (const ref of ['https://evil.com:5173', 'https://evil.com/login', 'http://localhost:5173']) {
        const out = resolve(ref);
        assert.ok(
            allowed.some(a => a instanceof RegExp ? a.test(out) : out === a.replace(/\/+$/, '')),
            `${out} is not in the allow-list`
        );
    }
});

test('falls back to localhost:5173 when FRONTEND_URL is unset', () => {
    const bare = buildAllowedOrigins({});
    assert.strictEqual(
        resolveTrustedFrontendOrigin('https://evil.com:5173/login', bare, {}),
        'http://localhost:5173'
    );
});

