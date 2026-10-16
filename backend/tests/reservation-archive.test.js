const test = require('node:test');
const assert = require('node:assert/strict');

const {
    validateArchiveSelection,
    validatePermanentDelete,
    RESERVATION_TYPES
} = require('../utils/reservation-archive-rules');

// A visitor moves a reservation through three states: active -> archived (their Trash) ->
// permanently deleted. Archiving and deletion are both owner-scoped, and the final step is
// gated on the account password so a stolen session token cannot destroy booking history.

test('accepts a single valid selection', () => {
    const result = validateArchiveSelection({ type: 'ticket', ids: [12] });
    assert.equal(result.ok, true);
    assert.deepEqual(result.ids, [12]);
    assert.equal(result.type, 'ticket');
});

test('deduplicates a selection so a row is never processed twice', () => {
    const result = validateArchiveSelection({ type: 'ticket', ids: [3, 3, 4, 3] });
    assert.equal(result.ok, true);
    assert.deepEqual(result.ids, [3, 4]);
});

test('coerces numeric strings so a hand-built request still validates', () => {
    const result = validateArchiveSelection({ type: 'event', ids: ['7', 8] });
    assert.equal(result.ok, true);
    assert.deepEqual(result.ids, [7, 8]);
});

test('accepts the digit strings produced by decoding pid_ identifiers', () => {
    // Reservation ids reach the API as opaque `pid_` tokens. decodeRequestIdentifiers turns
    // them back into digit STRINGS before the controller runs, so this is the shape the
    // server actually sees — not integers.
    const result = validateArchiveSelection({ type: 'ticket', ids: ['3', '5', '6'] });
    assert.equal(result.ok, true);
    assert.deepEqual(result.ids, [3, 5, 6]);
});

test('rejects an undecoded pid_ token rather than guessing at it', () => {
    // Fail closed: if the decode middleware is ever bypassed, the opaque token must not be
    // silently coerced into NaN or, worse, stripped down to something that looks valid.
    const result = validateArchiveSelection({ type: 'ticket', ids: ['pid_K5FNs5NxU388ypGY9nu5YW87ANq3cs9TtFhms4A'] });
    assert.equal(result.ok, false);
});

test('rejects null ids, which is what NaN serialises to on the wire', () => {
    // A client that does Number() on a pid_ token gets NaN, which JSON.stringify turns
    // into null. That must be a clean rejection, not a row silently skipped.
    assert.equal(validateArchiveSelection({ type: 'ticket', ids: [null] }).ok, false);
    assert.equal(validateArchiveSelection({ type: 'ticket', ids: [3, null] }).ok, false);
});

test('rejects an unknown reservation type', () => {
    const result = validateArchiveSelection({ type: 'booking', ids: [1] });
    assert.equal(result.ok, false);
    assert.match(result.error, /type/i);
});

test('rejects an empty or absent selection', () => {
    assert.equal(validateArchiveSelection({ type: 'ticket', ids: [] }).ok, false);
    assert.equal(validateArchiveSelection({ type: 'ticket' }).ok, false);
});

test('rejects non-positive, fractional and non-numeric ids', () => {
    assert.equal(validateArchiveSelection({ type: 'ticket', ids: [0] }).ok, false);
    assert.equal(validateArchiveSelection({ type: 'ticket', ids: [-4] }).ok, false);
    assert.equal(validateArchiveSelection({ type: 'ticket', ids: [2.5] }).ok, false);
    assert.equal(validateArchiveSelection({ type: 'ticket', ids: ['abc'] }).ok, false);
});

test('caps a single request so one call cannot flood the database', () => {
    const result = validateArchiveSelection({ type: 'ticket', ids: Array.from({ length: 500 }, (_, i) => i + 1) });
    assert.equal(result.ok, false);
    assert.match(result.error, /too many/i);
});

/* ------------------------------------------------ permanent delete password gate */

test('permanent delete requires the account password', () => {
    const result = validatePermanentDelete({ type: 'ticket', ids: [5], password: 'secret123', hasPassword: true });
    assert.equal(result.ok, true);
});

test('an account with no password is told to create one before deleting', () => {
    // Google sign-in leaves users.password NULL. bcrypt.compare against NULL can never
    // succeed, so without this branch the visitor is locked out of deleting their own
    // reservations with no way forward.
    const result = validatePermanentDelete({ type: 'ticket', ids: [5], password: 'anything', hasPassword: false });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'password_setup_required');
    assert.match(result.error, /password/i);
});

test('a blank or missing password is rejected as a confirmation failure', () => {
    for (const password of ['', null, undefined, '   ']) {
        const result = validatePermanentDelete({ type: 'ticket', ids: [5], password, hasPassword: true });
        assert.equal(result.ok, false, `expected rejection for ${JSON.stringify(password)}`);
        assert.equal(result.reason, 'password_required');
    }
});

test('permanent delete validates the selection the same way archiving does', () => {
    const result = validatePermanentDelete({ type: 'nope', ids: [1], password: 'secret123', hasPassword: true });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'invalid_selection');

    const empty = validatePermanentDelete({ type: 'ticket', ids: [], password: 'secret123', hasPassword: true });
    assert.equal(empty.reason, 'invalid_selection');
});

test('exposes exactly the two supported reservation types', () => {
    assert.deepEqual([...RESERVATION_TYPES].sort(), ['event', 'ticket']);
});

/* ------------------------------------------------------------ route placement */

const readReservationRoutes = () => {
    const { readFileSync } = require('node:fs');
    const { join } = require('node:path');
    return readFileSync(join(__dirname, '..', 'routes', 'reservation-routes.js'), 'utf8');
};

// These are visitor self-service routes. Below the admin gate a visitor gets 403 on their own
// reservations, which is exactly the bug the existing placement test guards against.
const ARCHIVE_ROUTES = [
    "router.put('/archive'",
    "router.put('/restore'",
    "router.delete('/archived'"
];

test('declares the bulk archive, restore and permanent delete routes', () => {
    const source = readReservationRoutes();
    for (const route of ARCHIVE_ROUTES) {
        assert.ok(source.includes(route), `missing route: ${route}`);
    }
});

test('archive, restore and permanent delete sit above the admin/staff gate', () => {
    const source = readReservationRoutes();
    const gate = source.indexOf("router.use(authorize('admin', 'staff'))");
    assert.ok(gate > -1, 'admin gate not found');
    for (const route of ARCHIVE_ROUTES) {
        assert.ok(source.indexOf(route) < gate, `route must be declared before the admin gate: ${route}`);
    }
});