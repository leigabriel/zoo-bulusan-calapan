import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';
import {
    RESERVATION_LOCK_WINDOW_DAYS,
    reservationLockAnchor,
    reservationLockDeadline,
    isReservationLocked
} from './reservation-lock.js';

const SRC_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const NOW = new Date('2026-11-25T12:00:00.000Z');
const daysBefore = (days) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

test('the read-only window is seven days', () => {
    assert.strictEqual(RESERVATION_LOCK_WINDOW_DAYS, 7);
});

test('a pending booking is never locked by age', () => {
    const reservation = {
        status: 'pending',
        confirmed_at: daysBefore(20),
        updated_at: daysBefore(20)
    };
    assert.strictEqual(reservationLockAnchor(reservation), null);
    assert.strictEqual(reservationLockDeadline(reservation), null);
    assert.strictEqual(isReservationLocked(reservation, NOW), false);
});

test('a confirmed booking locks at seven days', () => {
    assert.strictEqual(isReservationLocked({ status: 'confirmed', confirmed_at: daysBefore(6) }, NOW), false);
    assert.strictEqual(isReservationLocked({ status: 'confirmed', confirmed_at: daysBefore(7) }, NOW), true);
    assert.strictEqual(isReservationLocked({ status: 'confirmed', confirmed_at: daysBefore(10) }, NOW), true);
});

test('a completed booking locks from check-in when no confirmation exists', () => {
    assert.strictEqual(
        isReservationLocked({ status: 'completed', checked_in_at: daysBefore(8) }, NOW),
        true
    );
    assert.strictEqual(
        isReservationLocked({ status: 'completed', checked_in_at: daysBefore(1) }, NOW),
        false
    );
});

test('missing or invalid timestamps do not lock a booking', () => {
    assert.strictEqual(isReservationLocked({ status: 'confirmed' }, NOW), false);
    assert.strictEqual(isReservationLocked({ status: 'confirmed', confirmed_at: 'nope' }, NOW), false);
    assert.strictEqual(isReservationLocked({ status: 'cancelled', confirmed_at: daysBefore(30) }, NOW), false);
});

test('reservation history removes mutating actions once locked', () => {
    const source = fs.readFileSync(
        path.join(SRC_ROOT, 'components/features/ReservationHistoryPanel.jsx'),
        'utf8'
    );

    assert.match(source, /isReservationLocked\(selectedReservation\)/,
        'the panel must compute the lock state');

    // Both refund buttons must sit behind the lock.
    const gatedRefunds = source.match(/!selectedReservationLocked && \(\s*canRequestRefund\(/g) || [];
    assert.strictEqual(gatedRefunds.length, 2,
        'ticket and event refund blocks must both check the lock');

    // Payment method buttons must not render for a locked booking.
    assert.strictEqual(
        source.split('!selectedReservationLocked && calculateTotal(selectedReservation) > 0').length - 1,
        1,
        'ticket payment buttons must check the lock'
    );
    assert.strictEqual(
        source.split('!selectedReservationLocked && getEventAmount(selectedReservation) > 0').length - 1,
        1,
        'event payment buttons must check the lock'
    );

    // Managing the event is an edit surface and must be closed too.
    assert.match(
        source,
        /selectedReservation\.status === 'confirmed' && !selectedReservationLocked/,
        'Manage Event must be hidden for a locked booking'
    );

    // Download and archive must remain available.
    assert.match(source, /onClick=\{handleDownload\}/);
    assert.match(source, /onClick=\{\(\) => selectedReservation\.is_archived \? handleUnarchive\(selectedReservation\) : handleArchive\(selectedReservation\)\}/);
});

test('the hosted-event editor refuses a locked event', () => {
    const source = fs.readFileSync(path.join(SRC_ROOT, 'pages/user/MyEvents.jsx'), 'utf8');

    assert.match(source, /import \{[^}]*isReservationLocked[^}]*\} from '\.\.\/\.\.\/utils\/reservation-lock'/,
        'MyEvents must use the shared lock rule');
    assert.match(source, /isReservationLocked\(event\)/, 'each event card must compute its lock state');
    assert.match(source, /isReservationLocked\(editingEvent\)/, 'saving must re-check the lock');
    assert.match(source, /Edit Event Details/, 'the editor button must still exist for open events');
});
