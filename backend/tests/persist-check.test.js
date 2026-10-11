const test = require('node:test');
const assert = require('node:assert/strict');
const { checkPersisted } = require('../utils/persist-check');

test('treats an unchanged value as persisted', () => {
    assert.equal(checkPersisted({ emailNotifications: true }, { emailNotifications: true }), true);
});

test('reports a mismatch when a value did not land', () => {
    assert.equal(checkPersisted({ emailNotifications: true }, { emailNotifications: false }), false);
});

test('requires every attempted key to match', () => {
    assert.equal(
        checkPersisted({ emailNotifications: true, pushNotifications: true }, { emailNotifications: true, pushNotifications: false }),
        false
    );
});

test('treats a null or missing read-back as not persisted', () => {
    assert.equal(checkPersisted(null, { emailNotifications: true }), false);
    assert.equal(checkPersisted(undefined, { emailNotifications: true }), false);
    assert.equal(checkPersisted({}, { emailNotifications: true }), false);
});