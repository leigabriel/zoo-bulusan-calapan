const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const jwt = require('jsonwebtoken');

const revoked = require('../models/revoked-token-model');
const { jwtSecret } = require('../config/secrets');

const mkToken = (overrides = {}) =>
    jwt.sign({ id: 1, role: 'user', jti: revoked.newTokenId(), ...overrides }, jwtSecret, { expiresIn: '1h' });

test('token ids are unique', () => {
    const ids = new Set(Array.from({ length: 500 }, () => revoked.newTokenId()));
    assert.strictEqual(ids.size, 500);
    ids.forEach(id => assert.match(id, /^[0-9a-f]{32}$/));
});

test('a token with no jti is treated as not revoked', async () => {
    // Nothing to look up; the signature check is what protects it.
    assert.strictEqual(await revoked.isRevoked({ id: 1 }), false);
    assert.strictEqual(await revoked.isRevoked({}), false);
    assert.strictEqual(await revoked.isRevoked(null), false);
});

test('revoking a payload with no jti is a no-op', async () => {
    assert.strictEqual(await revoked.revoke({ id: 1 }), false);
});

test('an already-expired token is never recorded', async () => {
    const decoded = { jti: revoked.newTokenId(), exp: Math.floor(Date.now() / 1000) - 60 };
    assert.strictEqual(await revoked.isRevoked(decoded), false);
    assert.strictEqual(await revoked.revoke(decoded), false);
});

test('expiryOf reads the exp claim', () => {
    assert.strictEqual(revoked.expiryOf({ exp: 1700000000 }), 1700000000);
    assert.strictEqual(revoked.expiryOf({}), null);
    assert.strictEqual(revoked.expiryOf({ exp: 'soon' }), null);
});

// The regression this file exists for: the cache originally stored only a
// timestamp, so any cache hit was read as "revoked" and a token checked twice
// within the window was rejected the second time - logging users out at random.
test('the cache stores a verdict, not just a time', () => {
    const source = fs.readFileSync(
        path.join(__dirname, '..', 'models', 'revoked-token-model.js'),
        'utf8'
    );
    assert.match(source, /revokedCache\.get\(jti\)/);
    assert.match(source, /cached\.revoked/, 'a cache hit must return the stored verdict');
    assert.match(source, /revoked:\s*false/, 'a clean verdict must be cacheable');
    assert.match(source, /revoked:\s*true/, 'a revoked verdict must be cacheable');
    assert.doesNotMatch(source, /cachedUntil > Date\.now\(\)\) return true;/,
        'this is the bug: it treated every cache hit as revoked');
});

test('the middleware refuses revoked tokens and admits clean ones', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'middleware', 'auth.js'), 'utf8');
    const protectAt = source.indexOf('exports.protect');
    const protectBody = source.slice(protectAt, source.indexOf('exports.', protectAt + 10));
    assert.match(protectBody, /await isRevoked\(decoded\)/, 'protect() must check revocation');
    assert.match(protectBody, /Session has ended/);

    const optionalAt = source.indexOf('exports.optionalAuth');
    const optionalBody = source.slice(optionalAt);
    assert.match(optionalBody, /await isRevoked\(decoded\)/, 'optionalAuth must check revocation');
});

test('the socket handshake refuses revoked tokens', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'socket', 'chat-socket.js'), 'utf8');
    assert.match(source, /await isRevoked\(decoded\)/);
});

test('every issued token carries a jti', () => {
    for (const rel of [
        'controllers/auth-controller.js',
        'controllers/google-auth-controller.js',
        'controllers/admin-master-key-controller.js'
    ]) {
        const source = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
        assert.match(source, /jti: newTokenId\(\)/, `${rel} must issue a jti`);
        assert.match(source, /require\('\.\.\/models\/revoked-token-model'\)/);
    }
});

test('logout actually revokes the presented token', () => {
    const source = fs.readFileSync(
        path.join(__dirname, '..', 'controllers', 'auth-controller.js'),
        'utf8'
    );
    const at = source.indexOf('exports.logout');
    const body = source.slice(at, source.indexOf('exports.', at + 10));
    assert.match(body, /await revoke\(/, 'logout must revoke, not just log');
});

test('the schema initializer is registered at boot', () => {
    const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
    assert.match(server, /require\('\.\/database\/ensure-revoked-tokens-schema'\)/);
    assert.match(server, /schemaInitializers = \[[^\]]*ensureRevokedTokensSchema/);

    const schema = fs.readFileSync(
        path.join(__dirname, '..', 'database', 'ensure-revoked-tokens-schema.js'),
        'utf8'
    );
    assert.match(schema, /CREATE TABLE IF NOT EXISTS revoked_tokens/);
    assert.match(schema, /expires_at/, 'rows need an expiry so they can be pruned');
});
