const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveDelivery } = require('../models/notification-model');

const DEFAULTS = {
    emailNotifications: true, pushNotifications: true,
    eventReminders: true, ticketUpdates: true, marketingEmails: false
};
const withSettings = (overrides) => ({ ...DEFAULTS, ...overrides });
// Most catalog entries carry emailByDefault: true.
const EMAIL = true;

test('push and email are both sent by default', () => {
    assert.deepEqual(resolveDelivery(withSettings(), 'ticketUpdates', EMAIL),
        { push: true, email: true });
});

test('a disabled category suppresses the whole notification', () => {
    assert.deepEqual(resolveDelivery(withSettings({ ticketUpdates: false }), 'ticketUpdates', EMAIL),
        { push: false, email: false });
});

test('a null category is never suppressed by a preference', () => {
    assert.deepEqual(resolveDelivery(withSettings({ ticketUpdates: false }), null, EMAIL),
        { push: true, email: true });
});

test('marketing needs both the category and its own preference', () => {
    assert.equal(resolveDelivery(withSettings(), 'marketing', EMAIL).email, false);
    assert.equal(resolveDelivery(withSettings({ marketingEmails: true }), 'marketing', EMAIL).email, true);
    // ...and still respects the global email switch.
    assert.equal(resolveDelivery(withSettings({ marketingEmails: true, emailNotifications: false }), 'marketing', EMAIL).email, false);
});

test('in-app and email switches are independent', () => {
    assert.deepEqual(resolveDelivery(withSettings({ pushNotifications: false }), 'ticketUpdates', EMAIL),
        { push: false, email: true });
    assert.deepEqual(resolveDelivery(withSettings({ emailNotifications: false }), 'ticketUpdates', EMAIL),
        { push: true, email: false });
});

test('an entry that defaults to no email stays un-emailed even when opted in', () => {
    // marketing.broadcast carries emailByDefault: false
    assert.equal(resolveDelivery(withSettings({ marketingEmails: true }), 'marketing', false).email, false);
    assert.equal(resolveDelivery(withSettings({ marketingEmails: true }), 'marketing', true).email, true);
});