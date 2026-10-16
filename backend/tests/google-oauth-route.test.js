const test = require('node:test');
const assert = require('node:assert');

// Configure before requiring the controller: getGoogleConfig() throws without these.
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'https://service.bulusanzoo.com/auth/google/callback';
process.env.FRONTEND_URL = 'https://bulusanzoo.com';

const controller = require('../controllers/google-auth-controller');
// Requiring the controller pulls in the models, which create a mysql2 pool and its
// internal timers. Close them, or this file hangs after the tests finish.
const { after } = require('node:test');
const path = require('node:path');
after(async () => {
    try {
        await require(path.join(__dirname, '..', 'config', 'database')).end();
    } catch {
        // never opened
    }
    setTimeout(() => process.exit(0), 500).unref();
});

/**
 * These assert what the handler DOES, not just that it loads.
 *
 * `require()` and `node --check` both pass when a controller calls a helper it
 * forgot to import, because neither executes the function body - and this
 * handler wraps its work in try/catch, so the ReferenceError is swallowed and
 * turned into a redirect to /login?error=configuration_error. That is how a
 * missing import reached the live route unnoticed.
 *
 * So the assertion has to be on the outcome: did it reach Google?
 */

const call = (referer) => {
    const req = { get: (header) => (header.toLowerCase() === 'referer' ? referer : undefined) };
    let redirected = null;
    const res = { redirect: (url) => { redirected = url; }, setHeader: () => {}, json: () => {} };
    controller.initiateGoogleAuth(req, res);
    return redirected;
};

test('reaches Google rather than falling into the catch block', () => {
    const url = call(undefined);
    assert.ok(url, 'no redirect issued');
    assert.match(url, /^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth/,
        `expected a Google OAuth URL, got: ${url}`);
});

test('no referer still reaches Google', () => {
    assert.match(call(undefined), /accounts\.google\.com/);
});

test('a legitimate frontend referer reaches Google', () => {
    assert.match(call('https://bulusanzoo.com/login'), /accounts\.google\.com/);
});

test('LAN and localhost referers reach Google', () => {
    assert.match(call('http://192.168.1.20:5173/login'), /accounts\.google\.com/);
    assert.match(call('http://localhost:5173/login'), /accounts\.google\.com/);
});

// The two payloads the removed heuristic accepted.
test('an attacker referer still reaches Google, and is not used as the origin', () => {
    for (const evil of ['https://evil.com:5173/login', 'https://evil.com/x/login']) {
        const url = call(evil);
        assert.match(url, /accounts\.google\.com/, `expected Google redirect for ${evil}, got ${url}`);
        assert.ok(!url.includes('evil.com'), 'attacker origin leaked into the OAuth URL');
    }
});

test('a malformed referer still reaches Google', () => {
    assert.match(call('not-a-url'), /accounts\.google\.com/);
});

test('every helper the handler calls is actually imported', () => {
    // Catches the ReferenceError class directly, independent of try/catch.
    const fs = require('node:fs');
    const path = require('node:path');
    const source = fs.readFileSync(
        path.join(__dirname, '..', 'controllers', 'google-auth-controller.js'),
        'utf8'
    );

    const required = new Set(['crypto', 'jwt', 'https', 'User', 'AdminMasterKey', 'jwtSecret', 'jwtExpire', 'buildAllowedOrigins', 'resolveTrustedFrontendOrigin']);
    const declarations = source.matchAll(/^(?:const|let)\s+\{?\s*([\w,\s]+?)\s*\}?\s*=\s*require\(/gm);
    for (const [, names] of declarations) {
        names.split(',').map((n) => n.trim()).filter(Boolean).forEach((n) => required.add(n));
    }
    const functions = [...source.matchAll(/^(?:const|function)\s+(\w+)/gm)].map((m) => m[1]);
    functions.forEach((n) => required.add(n));
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
        .split('\n').forEach((line) => {
            const m = line.match(/^\s*(?:const|let|var)\s+(\w+)/);
            if (m) required.add(m[1]);
        });

    const unresolved = ['buildAllowedOrigins', 'resolveTrustedFrontendOrigin'].filter((name) => !required.has(name));
    assert.deepStrictEqual(unresolved, [], 'handler references a helper it never imports');
});
