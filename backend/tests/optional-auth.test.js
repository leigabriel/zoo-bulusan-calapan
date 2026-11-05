const test = require('node:test');
const assert = require('node:assert');
const Module = require('node:module');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'optional-auth-test-secret-0123456789abcdef';

const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/secrets');

// Load middleware/auth.js with its database-backed models replaced by stubs.
const loadAuth = ({ revoked }) => {
    const originalLoad = Module._load;
    Module._load = function (request, ...rest) {
        if (/revoked-token-model/.test(request)) return { isRevoked: async () => revoked };
        if (/models[\\/]user-model/.test(request)) {
            return { findAuthenticatedById: async () => ({ id: 1, email: 'a@b.c', role: 'user' }) };
        }
        return originalLoad.call(this, request, ...rest);
    };
    try {
        const resolved = require.resolve('../middleware/auth');
        delete require.cache[resolved];
        return require('../middleware/auth');
    } finally {
        Module._load = originalLoad;
    }
};

const run = async (auth, headers) => {
    const req = { headers };
    let nextCalls = 0;
    await auth.optionalAuth(req, {}, () => { nextCalls += 1; });
    return { req, nextCalls };
};

const token = () => jwt.sign({ id: 1 }, jwtSecret);

test('optionalAuth continues as a guest when the token is revoked', async () => {
    const auth = loadAuth({ revoked: true });
    const { req, nextCalls } = await run(auth, { authorization: `Bearer ${token()}` });
    assert.strictEqual(nextCalls, 1);
    assert.strictEqual(req.user, undefined);
});

test('optionalAuth attaches the user for a valid, unrevoked token', async () => {
    const auth = loadAuth({ revoked: false });
    const { req, nextCalls } = await run(auth, { authorization: `Bearer ${token()}` });
    assert.strictEqual(nextCalls, 1);
    assert.strictEqual(req.user.id, 1);
});

test('optionalAuth continues when the token is invalid or absent', async () => {
    const auth = loadAuth({ revoked: false });
    assert.strictEqual((await run(auth, { authorization: 'Bearer not-a-jwt' })).nextCalls, 1);
    assert.strictEqual((await run(auth, {})).nextCalls, 1);
});
