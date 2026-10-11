const test = require('node:test');
const assert = require('node:assert/strict');
const { isEligibleRecipient, selectVisitorRecipients } = require('../services/notification-service');

test('excludes inactive, suspended and deleted accounts', () => {
    const active = { role: 'user', is_active: 1, is_suspended: 0, deleted_at: null };
    assert.equal(isEligibleRecipient(active), true);
    assert.equal(isEligibleRecipient({ ...active, is_active: 0 }), false);
    assert.equal(isEligibleRecipient({ ...active, is_suspended: 1 }), false);
    assert.equal(isEligibleRecipient({ ...active, deleted_at: new Date() }), false);
    assert.equal(isEligibleRecipient({ ...active, role: 'staff' }), false);
});

test('never notifies an inactive or deleted account', () => {
    const rows = [
        { id: 1, role: 'user', is_active: 1, is_suspended: 0, deleted_at: null },
        { id: 2, role: 'user', is_active: 0, is_suspended: 0, deleted_at: null },
        { id: 3, role: 'staff', is_active: 1, is_suspended: 0, deleted_at: null }
    ];
    assert.deepEqual(selectVisitorRecipients(rows).map(r => r.id), [1]);
});

test('a boolean-typed column value is handled the same as 0/1', () => {
    // mysql2 returns TINYINT(1) as a number on some paths and boolean on others.
    const row = { role: 'user', is_active: true, is_suspended: false, deleted_at: null };
    assert.equal(isEligibleRecipient(row), true);
    assert.equal(isEligibleRecipient({ ...row, is_suspended: true }), false);
});