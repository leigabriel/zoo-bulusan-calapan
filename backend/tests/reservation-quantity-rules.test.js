const test = require('node:test');
const assert = require('node:assert');

const { validateTicketBooking, MAX_TICKETS_PER_BOOKING } = require('../utils/reservation-quantity-rules');

test('accepts a normal booking', () => {
    const r = validateTicketBooking({ adult: '2', child: '1', resident: '0' });
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(r.quantities, { adult: 2, child: 1, resident: 0 });
    assert.strictEqual(r.totalVisitors, 3);
    assert.strictEqual(r.error, null);
});

test('accepts numbers as well as formdata strings', () => {
    const r = validateTicketBooking({ adult: 2, child: 1, resident: 0 });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.totalVisitors, 3);
});

test('blank and absent fields mean zero', () => {
    for (const blank of [undefined, null, '', '   ']) {
        const r = validateTicketBooking({ adult: '2', child: blank, resident: blank });
        assert.strictEqual(r.ok, true, `expected accept for ${JSON.stringify(blank)}`);
        assert.strictEqual(r.totalVisitors, 2);
    }
});

test('a completely empty booking is rejected', () => {
    for (const blank of [{}, { adult: '', child: null, resident: undefined }]) {
        const r = validateTicketBooking(blank);
        assert.strictEqual(r.ok, false);
        assert.match(r.error, /at least one visitor/i);
    }
});

// The regression: parseInt('-3') is -3, which passed the `=== 0` guard.
test('negative quantities are rejected', () => {
    for (const bad of ['-3', -3, '-1']) {
        const r = validateTicketBooking({ adult: bad, child: '2' });
        assert.strictEqual(r.ok, false, `expected reject for ${JSON.stringify(bad)}`);
        assert.match(r.error, /whole number/i);
    }
});

test('non-integer and malformed quantities are rejected', () => {
    for (const bad of ['3.7', '1e3', '12abc', '0x10', 'abc', {}, [], true, NaN, Infinity]) {
        const r = validateTicketBooking({ adult: bad, child: '1' });
        assert.strictEqual(r.ok, false, `expected reject for ${String(bad)}`);
    }
});

test('a malformed field is an error, never silently zero', () => {
    // If adult='3.7' became 0 the visitor would vanish without the caller knowing.
    const r = validateTicketBooking({ adult: '3.7', child: '2' });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.quantities, null);
});

test('enforces the per-booking cap', () => {
    const over = validateTicketBooking({ adult: String(MAX_TICKETS_PER_BOOKING + 1) });
    assert.strictEqual(over.ok, false);
    assert.match(over.error, /cannot exceed/i);

    const at = validateTicketBooking({ adult: String(MAX_TICKETS_PER_BOOKING) });
    assert.strictEqual(at.ok, true);
});

test('the cap applies across all categories combined', () => {
    const r = validateTicketBooking({
        adult: String(MAX_TICKETS_PER_BOOKING),
        child: '1'
    });
    assert.strictEqual(r.ok, false);
});

test('totalVisitors is never negative, so the capacity check cannot be gamed', () => {
    for (const bad of ['-100', -100]) {
        const r = validateTicketBooking({ adult: bad });
        assert.ok(!(r.totalVisitors < 0), 'negative total would understate daily capacity');
    }
});

test('never returns negative quantities', () => {
    const r = validateTicketBooking({ adult: '-5', child: '2' });
    assert.strictEqual(r.quantities, null);
});
