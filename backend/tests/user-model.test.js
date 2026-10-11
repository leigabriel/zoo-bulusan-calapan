const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeNotificationSettings } = require('../models/notification-model');
const { STORED_PREFERENCES } = require('../services/notification-service');

test('returns full defaults when nothing is stored', () => {
    assert.deepEqual(Object.keys(mergeNotificationSettings(null)).sort(), [...STORED_PREFERENCES].sort());
    assert.equal(mergeNotificationSettings(null).emailNotifications, true);
    assert.equal(mergeNotificationSettings(null).marketingEmails, false);
});

test('stored values win over defaults', () => {
    const merged = mergeNotificationSettings({ emailNotifications: false });
    assert.equal(merged.emailNotifications, false);
    assert.equal(merged.pushNotifications, true);
});

test('tolerates the column arriving as a JSON string', () => {
    const merged = mergeNotificationSettings('{"ticketUpdates":false}');
    assert.equal(merged.ticketUpdates, false);
    assert.equal(merged.pushNotifications, true);
});

test('ignores unknown keys and unparseable JSON', () => {
    assert.equal(mergeNotificationSettings({ hacked: true }).hacked, undefined);
    assert.equal(mergeNotificationSettings('not json').emailNotifications, true);
});

test('never returns the marketing delivery gate as a stored preference', () => {
    const merged = mergeNotificationSettings({ marketing: false });
    assert.equal(merged.marketing, undefined);
    assert.equal(merged.marketingEmails, false);
});

test('coerces stored values to booleans', () => {
    const merged = mergeNotificationSettings({ pushNotifications: 0, ticketUpdates: 'yes' });
    assert.equal(merged.pushNotifications, false);
    assert.equal(merged.ticketUpdates, true);
});