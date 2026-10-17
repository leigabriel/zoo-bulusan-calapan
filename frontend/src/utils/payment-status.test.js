import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';
import {
    PAYMENT_STATUSES,
    normalizePaymentStatus,
    paymentStatusBadge,
    paymentStatusLabel,
    paymentMethodLabel,
    canMarkAsPaid,
    ticketPaymentAmount,
    canRequestRefund,
    isPaidAtVenue
} from './payment-status.js';

// The enum comes from backend/database/ensure-ticket-payment-schema.js.
const BACKEND_ENUM = ['unpaid', 'pending', 'paid', 'failed', 'expired', 'refunded'];

test('every status in the backend enum is represented', () => {
    assert.deepStrictEqual([...PAYMENT_STATUSES].sort(), [...BACKEND_ENUM].sort());
});

test('every enum value gets a real badge, not the fallback', () => {
    // The old inline switches covered only 5 of 6, so unpaid/failed/expired all
    // rendered as the same undifferentiated grey. What matters is that each
    // status that should look different does.
    for (const status of BACKEND_ENUM) {
        assert.ok(paymentStatusBadge(status), `${status} has no badge`);
    }
    // The five statuses that were previously collapsed onto grey must now be
    // distinguishable from one another.
    const distinct = ['unpaid', 'failed', 'expired', 'paid', 'pending', 'refunded']
        .map(paymentStatusBadge);
    assert.strictEqual(new Set(distinct).size, distinct.length,
        'every status should have its own colour');
});

test('the visually important statuses are distinguishable', () => {
    assert.match(paymentStatusBadge('paid'), /green/);
    assert.match(paymentStatusBadge('failed'), /red/);
    assert.match(paymentStatusBadge('pending'), /yellow/);
    assert.match(paymentStatusBadge('unpaid'), /slate/);
    assert.match(paymentStatusBadge('expired'), /gray/);
    assert.match(paymentStatusBadge('refunded'), /purple/);
});

test('legacy and messy inputs normalise safely', () => {
    assert.strictEqual(normalizePaymentStatus('not paid'), 'unpaid');
    assert.strictEqual(normalizePaymentStatus('NOT_PAID'), 'unpaid');
    assert.strictEqual(normalizePaymentStatus('not-paid'), 'unpaid');
    assert.strictEqual(normalizePaymentStatus(null), 'unpaid');
    assert.strictEqual(normalizePaymentStatus(''), 'unpaid');
    assert.strictEqual(normalizePaymentStatus(undefined), 'unpaid');
    assert.strictEqual(normalizePaymentStatus('banana'), 'unpaid');
    assert.strictEqual(normalizePaymentStatus('PAID'), 'paid');
});

test('labels are human readable, not raw enum values', () => {
    assert.strictEqual(paymentStatusLabel('paid'), 'Paid');
    assert.strictEqual(paymentStatusLabel('failed'), 'Payment failed');
    assert.strictEqual(paymentStatusLabel('unpaid'), 'Unpaid');
    // No label should be a bare snake_case enum value.
    for (const status of BACKEND_ENUM) {
        assert.doesNotMatch(paymentStatusLabel(status), /_/, `${status} label exposes the raw enum value`);
    }
    assert.strictEqual(paymentStatusLabel('unknown-status'), 'Unpaid');
});

test('an unset payment method is never reported as cash', () => {
    // `payment_method || 'cash'` claimed cash for bookings that had not paid.
    assert.strictEqual(paymentMethodLabel(null), 'Not selected');
    assert.strictEqual(paymentMethodLabel(''), 'Not selected');
    assert.notStrictEqual(paymentMethodLabel(null), paymentMethodLabel('cash'));
    assert.strictEqual(paymentMethodLabel('qrph'), 'QR Ph (PayMongo)');
    assert.strictEqual(paymentMethodLabel('pay_at_bulusan'), 'Pay at Bulusan');
});

test('mark-as-paid is offered for every unsettled status', () => {
    // The old guard matched only 'pending'/'not_paid', but the column defaults to
    // 'unpaid', so a freshly booked ticket offered no way to record payment.
    for (const status of ['unpaid', 'pending', 'failed', 'expired']) {
        assert.strictEqual(canMarkAsPaid(status), true, `${status} should be markable`);
    }
    for (const status of ['paid', 'free']) {
        assert.strictEqual(canMarkAsPaid(status), false, `${status} should not be markable`);
    }
});

test('the amount prefers the recorded payment over the face value', () => {
    assert.strictEqual(ticketPaymentAmount({ paymentAmount: 250, price: 40 }), 250);
    assert.strictEqual(ticketPaymentAmount({ paymentAmount: 0, price: 100 }), 100);
    assert.strictEqual(ticketPaymentAmount({}), 0);
    assert.strictEqual(ticketPaymentAmount(null), 0);
});


// The stored value is 'pay_at_bulus' followed by 'an'. A truncated literal was
// written into both Reservations pages, which made the "Pay at Bulusan -> mark as
// paid" panel unreachable because the guard could never match.
test('the stored pay_at_bulus(an) value is what pages compare against', () => {
    assert.strictEqual(paymentMethodLabel('pay_at_bulus' + 'an'), 'Pay at Bulusan');
    assert.notStrictEqual(paymentMethodLabel('pay_at_bulus'), 'Pay at Bulusan');
});

const SRC_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAYMENT_PAGES = [
    'pages/admin/AdminReservations.jsx',
    'pages/staff/StaffReservations.jsx',
    'pages/admin/AdminTickets.jsx',
    'pages/staff/StaffTickets.jsx',
    'components/features/ReservationHistoryPanel.jsx'
];

test('no page compares against a truncated pay_at_bulus literal', () => {
    const truncated = /pay_at_bulus(?!an)/;
    for (const rel of PAYMENT_PAGES) {
        const source = fs.readFileSync(path.join(SRC_ROOT, rel), 'utf8');
        assert.doesNotMatch(source, truncated, rel + ' contains a truncated pay_at_bulus literal');
    }
});

test('no ticket page renders a bare dash in the payment column', () => {
    // The payment cell used to be gated on activeTab === 'events', so every ticket
    // row showed a literal "-" instead of the method actually used.
    for (const rel of ['pages/admin/AdminReservations.jsx', 'pages/staff/StaffReservations.jsx']) {
        const source = fs.readFileSync(path.join(SRC_ROOT, rel), 'utf8');
        assert.doesNotMatch(source, /activeTab === 'events' \? <div>/,
            rel + ' still gates the payment cell to the events tab');
        assert.doesNotMatch(source, /text-gray-400">-</,
            rel + ' still renders a dash placeholder for tickets');
    }
});

test('both Reservations pages show the payment cell for tickets and events alike', () => {
    for (const rel of ['pages/admin/AdminReservations.jsx', 'pages/staff/StaffReservations.jsx']) {
        const source = fs.readFileSync(path.join(SRC_ROOT, rel), 'utf8');
        assert.match(source, /paymentMethodLabel\(reservation\.payment_method\)/,
            rel + ' does not label the payment method in the table');
        assert.match(source, /paymentStatusLabel\(reservation\.payment_status\)/,
            rel + ' does not label the payment status in the table');
        assert.ok(source.includes("payment_method === 'pay_at_bulus' + 'an'")
            || /payment_method === 'pay_at_bulusan'/.test(source),
        rel + ' has no guard revealing mark-as-paid for Pay at Bulusan');
    }
});

const RESERVATION_PAGES = [
    'pages/admin/AdminReservations.jsx',
    'pages/staff/StaffReservations.jsx'
];

test('marking a reservation paid is gated behind a confirmation', () => {
    // The button used to call the write directly, so a single click recorded a
    // payment with no way to back out.
    for (const rel of RESERVATION_PAGES) {
        const source = fs.readFileSync(path.join(SRC_ROOT, rel), 'utf8');
        assert.match(source, /confirmMarkPaid/,
            rel + ' has no confirm step for mark-as-paid');
        assert.match(source, /markPaidConfirm && \(/,
            rel + ' renders no confirmation dialog');
        assert.match(source, /onClick=\{\(\) => performMarkPaid\(markPaidConfirm\)\}/,
            rel + ' does not wire the dialog to the write');
        // The button must not call the write itself.
        assert.doesNotMatch(source, /onClick=\{\(\) => performMarkPaid\(selectedReservation\)\}/,
            rel + ' fires the write straight from the button');
        assert.match(source, /onClick=\{\(\) => confirmMarkPaid\(selectedReservation\)\}/,
            rel + ' button does not open the confirmation');
    }
});

test('confirming a payment does not relabel the reservation as an event', () => {
    // performMarkPaid used to set type: 'event' unconditionally, so confirming a
    // ticket payment turned the open ticket record into an event.
    for (const rel of RESERVATION_PAGES) {
        const source = fs.readFileSync(path.join(SRC_ROOT, rel), 'utf8');
        assert.doesNotMatch(source, /type: 'event' \}/,
            rel + ' still hardcodes the reservation type');
        assert.match(source, /type: reservation\.type/,
            rel + ' does not preserve the reservation kind');
    }
});

test('the tickets pages keep their own confirmation for mark-as-paid', () => {
    for (const rel of ['pages/admin/AdminTickets.jsx', 'pages/staff/StaffTickets.jsx']) {
        const source = fs.readFileSync(path.join(SRC_ROOT, rel), 'utf8');
        assert.match(source, /showConfirmation\(/,
            rel + ' lost its mark-as-paid confirmation');
        assert.match(source, /Mark as Paid/,
            rel + ' no longer offers mark-as-paid');
    }
});

test('a refund is only offered for a PayMongo charge', () => {
    // 'Pay at Bulusan' is cash settled at the gate, so there is nothing online to
    // reverse. Offering the button would promise something the system cannot do.
    assert.strictEqual(canRequestRefund('qrph', 'paid'), true);
    assert.strictEqual(canRequestRefund('gcash', 'paid'), true);
    assert.strictEqual(canRequestRefund('pay_at_bulus' + 'an', 'paid'), false);
    assert.strictEqual(canRequestRefund('cash', 'paid'), false);
    assert.strictEqual(canRequestRefund(null, 'paid'), false);
    assert.strictEqual(canRequestRefund('qrph', 'unpaid'), false);
    assert.strictEqual(canRequestRefund('qrph', 'refunded'), false);
});

test('pay at venue is recognised so the UI can explain the missing button', () => {
    assert.strictEqual(isPaidAtVenue('pay_at_bulus' + 'an'), true);
    assert.strictEqual(isPaidAtVenue('cash'), true);
    assert.strictEqual(isPaidAtVenue('qrph'), false);
    assert.strictEqual(isPaidAtVenue(null), false);
});

test('both refund buttons are gated on the rule, for tickets and events', () => {
    const source = fs.readFileSync(path.join(SRC_ROOT, 'components/features/ReservationHistoryPanel.jsx'), 'utf8');
    const gates = source.split('canRequestRefund(selectedReservation.payment_method').length - 1;
    assert.strictEqual(gates, 2, 'both the ticket and event refund buttons must be gated');
    // String matching rather than a regex: the parentheses in this call need no
    // escaping, which keeps the assertion immune to backslash mangling.
    assert.ok(
        source.includes('isPaidAtVenue(selectedReservation.payment_method)'),
        'the missing button must be explained rather than silently absent'
    );
    // Every "Request Refund" label must sit inside a canRequestRefund gate.
    const refundLabels = source.split("'Request Refund'").length - 1;
    assert.strictEqual(refundLabels, 2, 'expected a Request Refund label for each of the two blocks');
    assert.strictEqual(
        source.split('canRequestRefund(').length - 1,
        refundLabels,
        'each Request Refund label must be paired with a canRequestRefund guard'
    );
});

test('the scanner shows payment state for both ticket and event reservations', () => {
    const source = fs.readFileSync(path.join(SRC_ROOT, 'pages/staff/QRScanner.jsx'), 'utf8');
    assert.match(source, /const ScannedPayment = /, 'the scanner has no payment summary');
    // It must be rendered for anything that is not a walk-in sale.
    assert.match(source, /scanResult\.type !== 'walk_in'[\s\S]{0,120}<ScannedPayment scanResult=\{scanResult\} \/>/,
        'the scanner must show the payment summary for ticket and event reservations');
    assert.match(source, /paymentMethodLabel\(method\)/, 'the method is not shown');
    assert.match(source, /paymentStatusLabel\(status\)/, 'the status is not shown');
    // Walk-in sales already itemise cash in their own block.
    assert.doesNotMatch(source, /ScannedPayment scanResult=\{scanResult\} \/>\s*\)?\s*:\s*null/, 'walk-in path is broken');
});

test('the scanner payment summary explains a cash-at-gate booking', () => {
    const source = fs.readFileSync(path.join(SRC_ROOT, 'pages/staff/QRScanner.jsx'), 'utf8');
    assert.match(source, /isPaidAtVenue\(method\)/,
        'a Pay at Bulusan booking should say so on the scan screen');
});

// A JS string is rendered verbatim, unlike JSX text. A peso helper that returned
// an HTML entity therefore printed the entity itself on the scan screen.
test('no helper builds a peso sign from an HTML entity', () => {
    const source = fs.readFileSync(path.join(SRC_ROOT, 'pages/staff/QRScanner.jsx'), 'utf8');
    const helperLine = source.split('\n').find((l) => l.includes('minimumFractionDigits'));
    assert.ok(helperLine, 'the peso helper is missing');
    assert.ok(
        helperLine.includes(String.fromCharCode(0x20b1)),
        'the peso helper must use the real U+20B1 character, not an HTML entity'
    );
    // The only remaining entity may be the comment explaining the pitfall.
    const offenders = source
        .split('\n')
        .filter((l) => l.includes('&#8369;') && !l.trim().startsWith('//'));
    assert.deepStrictEqual(offenders, [], 'an HTML entity peso sign would render literally');
});

test('currency helpers produce a real peso sign', () => {
    const PESO = String.fromCharCode(0x20b1);
    const peso = (value) =>
        PESO + Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    assert.strictEqual(peso(60), PESO + '60.00');
    assert.strictEqual(peso(2), PESO + '2.00');
    assert.strictEqual(peso(1234.5), PESO + '1,234.50');
    for (const out of [peso(60), peso(2), peso(1234.5)]) {
        assert.doesNotMatch(out, /&/, 'output must not contain an HTML entity');
    }
});
