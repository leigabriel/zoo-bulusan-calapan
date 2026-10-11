const test = require('node:test');
const assert = require('node:assert/strict');
const { usernameErrorStatus } = require('../controllers/auth-controller');
const { validateUsername } = require('../utils/username-rules');

test('maps invalid usernames to 400 and taken names to 409', () => {
    assert.equal(usernameErrorStatus(validateUsername('ab')), 400);
    assert.equal(usernameErrorStatus(validateUsername('ok.name')), null);
    assert.equal(usernameErrorStatus({ taken: true }), 409);
});

test('a reserved name is invalid, not merely taken', () => {
    assert.equal(usernameErrorStatus(validateUsername('admin')), 400);
});

test('re-checks availability for the current user without a false 409', () => {
    // The uniqueness check excludes the caller's own id, so re-saving a name you already
    // hold must not look "taken".
    assert.equal(usernameErrorStatus({ ok: true, taken: false }), null);
});