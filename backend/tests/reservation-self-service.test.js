const test = require('node:test');
const assert = require('node:assert/strict');

const { validateTicketEdit, validateParticipantEdit } = require('../utils/reservation-edit-rules');

// A visitor may amend or cancel their own reservation, but only while it is still pending.
// These rules are the gate: a self-service edit must never be able to drive a quantity to
// zero, negative, or fractional, which would otherwise corrupt slot availability and totals.

test('accepts a normal ticket edit and sums the quantities', () => {
    const result = validateTicketEdit({ adult: 2, child: 1, resident: 3 });
    assert.equal(result.ok, true);
    assert.deepEqual(result.quantities, { adult: 2, child: 1, resident: 3 });
    assert.equal(result.totalVisitors, 6);
});

test('clamps negative and fractional quantities to whole non-negative numbers', () => {
    const result = validateTicketEdit({ adult: -3, child: 2.7, resident: '2' });
    assert.equal(result.ok, true);
    assert.deepEqual(result.quantities, { adult: 0, child: 2, resident: 2 });
    assert.equal(result.totalVisitors, 4);
});

test('treats missing or unparseable quantities as zero', () => {
    const result = validateTicketEdit({ adult: 'abc', child: undefined, resident: 4 });
    assert.equal(result.ok, true);
    assert.deepEqual(result.quantities, { adult: 0, child: 0, resident: 4 });
    assert.equal(result.totalVisitors, 4);
});

test('rejects a booking with no visitors at all', () => {
    const result = validateTicketEdit({ adult: 0, child: 0, resident: 0 });
    assert.equal(result.ok, false);
    assert.match(result.error, /at least one/i);
});

test('caps a single booking so one visitor cannot book the whole park', () => {
    const result = validateTicketEdit({ adult: 5000 });
    assert.equal(result.ok, false);
    assert.match(result.error, /cannot exceed/i);
});

test('participant count must be a positive whole number', () => {
    assert.equal(validateParticipantEdit({ participants: 25 }).ok, true);
    assert.equal(validateParticipantEdit({ participants: 25 }).participants, 25);
    assert.equal(validateParticipantEdit({ participants: 0 }).ok, false);
    assert.equal(validateParticipantEdit({ participants: -4 }).ok, false);
    assert.equal(validateParticipantEdit({ participants: 2.5 }).ok, false);
    assert.equal(validateParticipantEdit({ participants: 'many' }).ok, false);
});

// Route placement: the user self-service routes must sit ABOVE `router.use(authorize('admin','staff'))`,
// otherwise a visitor gets 403 on their own reservation.

const readReservationRoutes = () => {
    const { readFileSync } = require('node:fs');
    const { join } = require('node:path');
    return readFileSync(join(__dirname, '..', 'routes', 'reservation-routes.js'), 'utf8');
};

const SELF_SERVICE_ROUTES = [
    "router.put('/ticket/:id/cancel'",
    "router.put('/event/:id/cancel'",
    "router.put('/ticket/:id/details'",
    "router.put('/event/:id/details'"
];

test('declares the self-service cancel and edit routes', () => {
    const source = readReservationRoutes();
    for (const route of SELF_SERVICE_ROUTES) {
        assert.ok(source.includes(route), `missing route: ${route}`);
    }
});

test('self-service routes sit above the admin/staff gate', () => {
    const source = readReservationRoutes();
    const gate = source.indexOf("router.use(authorize('admin', 'staff'))");
    assert.ok(gate > -1, 'admin gate not found');
    for (const route of SELF_SERVICE_ROUTES) {
        assert.ok(source.indexOf(route) < gate, `route must be declared before the admin gate: ${route}`);
    }
});
