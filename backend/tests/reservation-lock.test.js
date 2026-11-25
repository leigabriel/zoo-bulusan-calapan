const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
    RESERVATION_LOCK_WINDOW_DAYS,
    reservationLockAnchor,
    reservationLockDeadline,
    isReservationLocked
} = require('../utils/reservation-lock-rules');

const NOW = new Date('2026-11-25T12:00:00.000Z');
const daysBefore = (days) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

const read = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('the read-only window is seven days', () => {
    assert.equal(RESERVATION_LOCK_WINDOW_DAYS, 7);
});

test('a pending booking is never locked by age', () => {
    const reservation = {
        status: 'pending',
        created_at: daysBefore(30),
        confirmed_at: daysBefore(20),
        updated_at: daysBefore(20)
    };
    assert.equal(reservationLockAnchor(reservation), null);
    assert.equal(reservationLockDeadline(reservation), null);
    assert.equal(isReservationLocked(reservation, NOW), false);
});

test('a confirmed booking stays open inside the window and locks at the boundary', () => {
    const inside = { status: 'confirmed', confirmed_at: daysBefore(6) };
    assert.equal(isReservationLocked(inside, NOW), false);

    const boundary = { status: 'confirmed', confirmed_at: daysBefore(7) };
    assert.equal(isReservationLocked(boundary, NOW), true);

    const past = { status: 'confirmed', confirmed_at: daysBefore(8) };
    assert.equal(isReservationLocked(past, NOW), true);
});

test('a completed booking locks from its check-in time when it was never confirmed', () => {
    const reservation = {
        status: 'completed',
        confirmed_at: null,
        checked_in_at: daysBefore(8),
        updated_at: daysBefore(8)
    };
    assert.equal(isReservationLocked(reservation, NOW), true);

    const recent = {
        status: 'completed',
        confirmed_at: null,
        checked_in_at: daysBefore(2)
    };
    assert.equal(isReservationLocked(recent, NOW), false);
});

test('confirmation takes precedence over check-in', () => {
    const reservation = {
        status: 'confirmed',
        confirmed_at: daysBefore(1),
        checked_in_at: daysBefore(30)
    };
    assert.equal(isReservationLocked(reservation, NOW), false);
});

test('older rows without confirmation timestamps fall back to updated_at', () => {
    const reservation = { status: 'confirmed', confirmed_at: null, checked_in_at: null, updated_at: daysBefore(9) };
    assert.equal(isReservationLocked(reservation, NOW), true);
});

test('camelCase objects are accepted for callers that do not read raw rows', () => {
    const reservation = { status: 'confirmed', confirmedAt: daysBefore(8) };
    assert.equal(isReservationLocked(reservation, NOW), true);
});

test('missing or invalid timestamps do not lock a booking', () => {
    assert.equal(isReservationLocked({ status: 'confirmed' }, NOW), false);
    assert.equal(isReservationLocked({ status: 'confirmed', confirmed_at: 'not-a-date' }, NOW), false);
    assert.equal(isReservationLocked({ status: 'cancelled', confirmed_at: daysBefore(30) }, NOW), false);
});

test('an invalid clock does not lock anything', () => {
    const reservation = { status: 'confirmed', confirmed_at: daysBefore(30) };
    assert.equal(isReservationLocked(reservation, Number.NaN), false);
});

test('payment changes and refunds enforce the lock on the server', () => {
    const src = read('controllers/payment-controller.js');
    const blocks = [
        'exports.setPayAtBulusan',
        'exports.requestEventRefund',
        'exports.createEventCheckout',
        'exports.setTicketPayAtBulusan',
        'exports.requestTicketRefund',
        'exports.createTicketCheckout'
    ];

    for (const handler of blocks) {
        const start = src.indexOf(handler);
        assert.ok(start > -1, `${handler} is missing`);
        const next = src.indexOf('\nexports.', start + 1);
        const block = src.slice(start, next === -1 ? undefined : next);
        assert.match(block, /isReservationLocked\(reservation\)/,
            `${handler} must refuse a locked reservation`);
    }
});

test('hosted event edits and photo uploads enforce the lock on the server', () => {
    const src = read('controllers/reservation-controller.js');

    for (const handler of ['exports.updateUserHostedEvent', 'exports.uploadHostedEventImage']) {
        const start = src.indexOf(handler);
        assert.ok(start > -1, `${handler} is missing`);
        const next = src.indexOf('\nexports.', start + 1);
        const block = src.slice(start, next === -1 ? undefined : next);
        assert.match(block, /isReservationLocked\(existingReservation|isReservationLocked\(reservation\)/,
            `${handler} must refuse a locked reservation`);
    }
});
