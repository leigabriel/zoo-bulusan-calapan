const test = require('node:test');
const assert = require('node:assert');

const {
    buildAllowedOrigins,
    isOriginAllowed,
    normalizeOrigin,
    shouldAllowOrigin
} = require('../utils/cors-origins');

const env = { CORS_ORIGIN: undefined, FRONTEND_URL: undefined };
const allowed = buildAllowedOrigins(env);

test('normalizeOrigin strips trailing slashes only', () => {
    assert.strictEqual(normalizeOrigin('https://bulusanzoo.com/'), 'https://bulusanzoo.com');
    assert.strictEqual(normalizeOrigin('https://bulusanzoo.com///'), 'https://bulusanzoo.com');
    assert.strictEqual(normalizeOrigin('  https://bulusanzoo.com  '), 'https://bulusanzoo.com');
    assert.strictEqual(normalizeOrigin(undefined), '');
});

test('production origins are allowed', () => {
    for (const origin of [
        'https://bulusanzoo.com',
        'https://www.bulusanzoo.com',
        'https://bulusanzoo.vercel.app'
    ]) {
        assert.strictEqual(isOriginAllowed(origin, allowed), true, `expected allowed: ${origin}`);
    }
});

test('local development origins are allowed', () => {
    for (const origin of [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        'capacitor://localhost',
        'https://localhost:8100',
        'http://localhost:4321'
    ]) {
        assert.strictEqual(isOriginAllowed(origin, allowed), true, `expected allowed: ${origin}`);
    }
});

// The regression this file exists for: origins used to be compared with
// String.prototype.startsWith, which is a prefix match.
test('prefix lookalike origins are REJECTED', () => {
    const attacks = [
        ['suffix subdomain', 'https://bulusanzoo.com.evil.com'],
        ['no dot suffix', 'https://bulusanzoo.comX'],
        ['hyphen variant', 'https://bulusanzoo-com.evil.com'],
        ['userinfo trick', 'https://bulusanzoo.com@evil.com'],
        ['path suffix', 'https://bulusanzoo.com.evil.com/steal'],
        ['host suffix on localhost', 'http://localhost:5173.evil.com']
    ];

    for (const [label, origin] of attacks) {
        assert.strictEqual(isOriginAllowed(origin, allowed), false, `${label} must be rejected: ${origin}`);
    }
});

test('loopback origins allow any port by design', () => {
    // Vite and other dev servers pick arbitrary ports, and a loopback origin can
    // only be opened by code already running on this machine. This is not a
    // cross-origin bypass: an attacker cannot claim a loopback origin from a
    // page the victim visits on the internet.
    for (const origin of ['http://localhost:51730', 'http://127.0.0.1:9999']) {
        assert.strictEqual(isOriginAllowed(origin, allowed), true, `expected allowed: ${origin}`);
    }
});

test('unrelated origins are rejected', () => {
    for (const origin of [
        'https://evil.com',
        'http://bulusanzoo.com',
        'https://sub.bulusanzoo.com',
        'null'
    ]) {
        assert.strictEqual(isOriginAllowed(origin, allowed), false, `expected rejected: ${origin}`);
    }
});

test('private LAN origins stay allowed for on-site staff devices', () => {
    for (const origin of ['http://192.168.1.20:5173', 'http://10.0.0.5:3000']) {
        assert.strictEqual(isOriginAllowed(origin, allowed), true, `expected allowed: ${origin}`);
    }
});

test('malformed and missing values are handled', () => {
    assert.strictEqual(isOriginAllowed(undefined, allowed), false);
    assert.strictEqual(isOriginAllowed('', allowed), false);
    assert.strictEqual(isOriginAllowed(42, allowed), false);
});

test('requests without an Origin header are permitted (non-browser clients)', () => {
    // curl, native apps and server-to-server calls send no Origin.
    assert.strictEqual(shouldAllowOrigin(undefined, allowed, env), true);
});

test('unknown origins are rejected regardless of NODE_ENV', () => {
    for (const nodeEnv of ['production', 'development', 'test', undefined]) {
        assert.strictEqual(
            shouldAllowOrigin('https://evil.com', allowed, { ...env, NODE_ENV: nodeEnv }),
            false,
            `must reject in NODE_ENV=${nodeEnv}`
        );
    }
});

test('ALLOW_ANY_ORIGIN=true is an explicit opt-out', () => {
    assert.strictEqual(
        shouldAllowOrigin('https://evil.com', allowed, { ...env, ALLOW_ANY_ORIGIN: 'true' }),
        true
    );
    // Only the exact string 'true' opts out.
    assert.strictEqual(
        shouldAllowOrigin('https://evil.com', allowed, { ...env, ALLOW_ANY_ORIGIN: '1' }),
        false
    );
});

test('env-supplied origins are included', () => {
    const custom = buildAllowedOrigins({ CORS_ORIGIN: 'https://staging.example.com', FRONTEND_URL: 'https://app.example.com' });
    assert.strictEqual(isOriginAllowed('https://staging.example.com', custom), true);
    assert.strictEqual(isOriginAllowed('https://app.example.com', custom), true);
    assert.strictEqual(isOriginAllowed('https://bulusanzoo.com.evil.com', custom), false);
});