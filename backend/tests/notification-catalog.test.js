const test = require('node:test');
const assert = require('node:assert/strict');
const { CATALOG, resolveNotification, CATEGORIES, STORED_PREFERENCES } = require('../services/notification-service');

const EXPECTED_TYPES = [
    'event.announced', 'event.updated', 'event.cancelled',
    'reservation.confirmed', 'reservation.cancelled', 'reservation.completed',
    'reservation.no_show', 'reservation.verification',
    'ticket.paid', 'ticket.checked_in',
    'appeal.reviewed', 'post.moderated', 'post.published', 'message.replied',
    'account.password_set', 'marketing.broadcast'
];

test('contains every documented type and nothing else', () => {
    assert.deepEqual(Object.keys(CATALOG).sort(), [...EXPECTED_TYPES].sort());
});

test('exposes the five stored preferences plus the marketing category', () => {
    assert.deepEqual([...CATEGORIES].sort(),
        ['emailNotifications', 'eventReminders', 'marketing', 'marketingEmails', 'pushNotifications', 'ticketUpdates']);
});

test('the stored preference set is the five persisted keys, excluding marketing', () => {
    // users.notification_settings holds exactly these five; `marketing` is a delivery
    // gate derived from marketingEmails and must never be written as a stored value.
    assert.deepEqual([...STORED_PREFERENCES].sort(),
        ['emailNotifications', 'eventReminders', 'marketingEmails', 'pushNotifications', 'ticketUpdates']);
});

test('every entry declares a category and resolvable copy', () => {
    for (const [key, entry] of Object.entries(CATALOG)) {
        const resolved = resolveNotification(key, { reference: 'BK-1', title: 'Night Safari', status: 'confirmed' });
        assert.equal(typeof resolved.title, 'string', key);
        assert.equal(typeof resolved.message, 'string', key);
        assert.ok(resolved.message.length > 0, key);
        assert.ok(CATEGORIES.has(resolved.category) || resolved.category === null, key);
        assert.equal(typeof entry.emailByDefault, 'boolean', key);
    }
});

test('new event announcements are not conflated with event reminders', () => {
    // Review Focus #5: event.announced and any future event.reminder must not share a gate.
    assert.equal(resolveNotification('event.announced', {}).category, 'eventReminders');
    assert.equal(CATALOG['event.announced'].reminder, false,
        'mark event.announced as a non-reminder so a reminder type can be added later without collision');
});

test('substitutes data into the copy', () => {
    const resolved = resolveNotification('reservation.confirmed', { reference: 'BK-1234' });
    assert.match(resolved.title, /Ticket Reservation Confirmed/);
    assert.match(resolved.message, /BK-1234/);
});

test('throws on an unknown type rather than sending an empty notification', () => {
    assert.throws(() => resolveNotification('nope.not.real', {}), /Unknown notification type: nope\.not\.real/);
});

test('marketing and the visitor\'s own post confirmation are the only entries that skip email', () => {
    // marketing.broadcast is opt-in bulk mail. post.published tells someone their own post
    // went live — they watched it happen seconds earlier, so emailing it is noise, not news.
    const off = Object.entries(CATALOG).filter(([, e]) => e.emailByDefault === false).map(([k]) => k);
    assert.deepEqual(off.sort(), ['marketing.broadcast', 'post.published']);
});

test('post.published confirms the visitor\'s own post and stays in-app', () => {
    const entry = CATALOG['post.published'];
    // No preference gate: a visitor who muted every category must still be told their own
    // post succeeded, otherwise a silent publish is indistinguishable from a lost one.
    assert.equal(entry.category, null);
    assert.equal(entry.emailByDefault, false);

    const resolved = resolveNotification('post.published', { photos: 3 });
    assert.match(resolved.title, /Post Posted/i);
    assert.match(resolved.message, /3 photos/);
});

test('every key fits the notifications.type VARCHAR(32) column', () => {
    // ensure-notification-schema.js:19 — a longer key would be truncated by MySQL.
    for (const key of Object.keys(CATALOG)) {
        assert.ok(key.length <= 32, `${key} is ${key.length} characters`);
    }
});