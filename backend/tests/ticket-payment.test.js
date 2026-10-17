const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const read = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

// ------------------------------------------------------------------ config
test('ticket payment config defaults and clamping', () => {
    // Exercise the real module against a throwaway config file.
    const tmp = path.join(os.tmpdir(), `ticket-payment-${process.pid}.json`);
    process.env.TICKET_PAYMENT_CONFIG_FILE = tmp;
    delete require.cache[require.resolve('../config/ticket-payment-config')];
    const cfg = require('../config/ticket-payment-config');

    assert.strictEqual(cfg.DEFAULT_CONFIG.qrphEnabled, false, 'opt-in by default');
    assert.strictEqual(cfg.readConfig().adultPrice, 40);

    // Negative and non-numeric prices must fall back, never become charges.
    const cleaned = cfg.writeConfig({ qrphEnabled: true, adultPrice: -50, childPrice: 'abc', residentPrice: 10 });
    assert.strictEqual(cleaned.adultPrice, 40, 'negative adult price rejected');
    assert.strictEqual(cleaned.childPrice, 20, 'non-numeric child price rejected');
    assert.strictEqual(cleaned.residentPrice, 10, 'valid price kept');
    assert.strictEqual(cleaned.qrphEnabled, true);
    assert.strictEqual(cleaned.currency, 'PHP', 'currency is not admin-settable');

    // Rounding to 2dp so PayMongo amounts stay exact.
    assert.strictEqual(cfg.writeConfig({ adultPrice: 40.129 }).adultPrice, 40.13);

    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    delete require.cache[require.resolve('../config/ticket-payment-config')];
});

// --------------------------------------------------------- config isolation
test('ticket and event payment configs are separate files with separate toggles', () => {
    const ticket = read('config/ticket-payment-config.js');
    const event = read('config/event-payment-config.js');

    assert.match(ticket, /TICKET_PAYMENT_CONFIG_FILE/);
    assert.match(event, /EVENT_PAYMENT_CONFIG_FILE/);
    assert.notStrictEqual(
        ticket.match(/CONFIG_FILE \|\| path\.join\([^)]*/)[0],
        event.match(/CONFIG_FILE \|\| path\.join\([^)]*/)[0],
        'the two configs must not share a file'
    );
    // Ticket pricing is per category; events are a flat per-participant fee.
    assert.match(ticket, /adultPrice/);
    assert.match(ticket, /childPrice/);
    assert.match(event, /amountPerParticipant/);
    assert.doesNotMatch(event, /adultPrice/);
});

// ------------------------------------------------------- the webhook blocker
test('the webhook resolves ticket reservations, not just events', () => {
    const src = read('controllers/payment-controller.js');

    // This is the defect that would have lost money: the webhook looked only in
    // event_reservations, so a paid ticket checkout never reconciled.
    assert.match(src, /findTicketReservationByPaymentReference/,
        'the webhook must be able to find ticket reservations');
    assert.match(src, /let isTicket = false;/);
    assert.match(src, /applyPaymentUpdate/,
        'payment updates must dispatch on the resolved reservation kind');
    assert.match(src, /updateTicketPayment/);
    assert.match(src, /updateEventPayment/);

    // Ticket checkout tags its metadata so the webhook knows where to look.
    assert.match(src, /reservation_kind: 'ticket'/);
});

test('webhook fallback still finds legacy event checkouts without a kind tag', () => {
    const src = read('controllers/payment-controller.js');
    // Pre-existing event checkouts carry no reservation_kind, so the lookup must
    // try events first and only then fall back to tickets.
    assert.match(src, /kind !== 'ticket'[\s\S]{0,200}findEventReservationByPaymentReference/);
});

// ------------------------------------------------------------------- routes
test('ticket payment routes are registered and auth-gated', () => {
    const src = read('routes/payment-routes.js');
    assert.match(src, /router\.use\(protect\)/, 'all payment routes require auth');
    assert.match(src, /router\.get\('\/ticket\/config'/);
    assert.match(src, /router\.post\('\/ticket\/:id\/checkout'/);
    assert.ok(src.includes("'/ticket/:id/pay-at-bulusan'"), 'pay-at-bulusan route missing');
    assert.match(src, /router\.post\('\/ticket\/:id\/refund'/);
    // mark-paid is a staff action and must stay role-gated.
    assert.match(src, /router\.post\('\/ticket\/:id\/mark-paid',\s*authorize\('admin', 'staff'\)/);
});

// ---------------------------------------------------- ownership enforcement
test('a ticket checkout can only be created by the reservation owner', () => {
    const src = read('controllers/payment-controller.js');
    const block = src.slice(src.indexOf('exports.createTicketCheckout'));
    assert.match(block, /String\(reservation\.user_id\) !== String\(req\.user\.id\)/,
        'must reject a checkout for someone else\'s reservation');
    assert.match(block, /reservation\.payment_status === 'paid'/,
        'must refuse to charge an already-paid reservation');
});

test('an all-free ticket booking is not sent to PayMongo', () => {
    const src = read('controllers/payment-controller.js');
    const block = src.slice(src.indexOf('exports.createTicketCheckout'));
    assert.match(block, /amount <= 0/,
        'a zero-amount booking (e.g. residents only) must short-circuit');
    // The guard must come before the API call.
    const guardAt = block.indexOf('amount <= 0');
    const callAt = block.indexOf('paymongoRequest');
    assert.ok(guardAt > -1 && callAt > guardAt, 'the guard must precede the PayMongo call');
});

// ------------------------------------------------------------------- schema
test('the ticket payment schema initializer is registered at boot', () => {
    const server = read('server.js');
    assert.match(server, /require\('\.\/database\/ensure-ticket-payment-schema'\)/);
    assert.match(server, /schemaInitializers = \[[^\]]*ensureTicketPaymentSchema/);

    const schema = read('database/ensure-ticket-payment-schema.js');
    // It must target ticket_reservations, not event_reservations.
    assert.match(schema, /SHOW COLUMNS FROM ticket_reservations/);
    assert.match(schema, /payment_status/);
    assert.match(schema, /paymongo_checkout_session_id/);
    // Re-running at every boot has to be safe.
    assert.match(schema, /if \(!existing\.length\)/);
});

test('ticket_reservations payment columns match the event set', () => {
    const ticket = read('database/ensure-ticket-payment-schema.js');
    const event = read('database/ensure-event-payment-schema.js');
    for (const column of ['payment_amount', 'payment_method', 'payment_status',
        'paymongo_checkout_session_id', 'paymongo_payment_id', 'refund_status']) {
        assert.ok(ticket.includes(column), `ticket schema is missing ${column}`);
        assert.ok(event.includes(column), `event schema is missing ${column} (reference)`);
    }
});

// ------------------------------------------------- staff scanner visibility
test('the staff scanner no longer blanks ticket payment fields', () => {
    const src = read('controllers/reservation-controller.js');
    // These were hardcoded to null for tickets, hiding payment state from staff.
    assert.doesNotMatch(src, /paymentStatus: isTicket \? null/);
    assert.doesNotMatch(src, /paymentAmount: isTicket \? null/);
    assert.doesNotMatch(src, /paymentMethod: isTicket \? null/);
});

// -------------------------------------------- prices come from config only
test('no hardcoded admission prices remain in revenue reporting', () => {
    for (const rel of ['controllers/admin-controller.js', 'models/ticket-model.js']) {
        const src = read(rel);
        assert.doesNotMatch(src, /\*\s*40\b/, `${rel} still hardcodes the adult price`);
        assert.doesNotMatch(src, /\*\s*20\b/, `${rel} still hardcodes the child price`);
    }
});

test('the AI assistant refreshes prices before quoting totals', () => {
    const src = read('routes/ai-routes.js');
    // refreshTicketPrices was once declared but never called, pinning prices to
    // the defaults forever.
    assert.match(src, /refreshTicketPrices\(\);/, 'prices must be refreshed at call time');
    assert.match(src, /readTicketPaymentConfig/);
});

// A route nested inside another handler's body is only registered when the outer
// handler executes, so it is absent at boot. Assert top-level registration by
// checking brace depth at the point each ticket route is declared.
test('admin config routes are registered at module scope, not inside a handler', () => {
    const src = read('routes/admin-routes.js');

    for (const needle of [
        "router.get('/ticket-payment-config'",
        "router.put('/ticket-payment-config'",
        "router.get('/event-payment-config'",
        "router.put('/event-payment-config'"
    ]) {
        const at = src.indexOf(needle);
        assert.notStrictEqual(at, -1, `${needle} is missing`);
        // Count braces before the declaration. At module scope inside
        // router.get(...)/router.put(...) the depth is 0.
        const before = src.slice(0, at);
        const depth = (before.match(/\{/g) || []).length - (before.match(/\}/g) || []).length;
        assert.strictEqual(depth, 0,
            `${needle} is declared at brace depth ${depth}, so it sits inside another handler and would not exist at boot`);
    }
});

test('the event and ticket config handlers are each complete and separate', () => {
    const src = read('routes/admin-routes.js');
    const eventStart = src.indexOf("router.put('/event-payment-config'");
    const ticketGet = src.indexOf("router.get('/ticket-payment-config'");
    assert.ok(eventStart > -1 && ticketGet > eventStart, 'the ticket config GET must follow the event config PUT');

    // Everything between the event PUT and the ticket GET is the event handler.
    const eventBlock = src.slice(eventStart, ticketGet);
    // The event handler must not mention the ticket config at all.
    assert.doesNotMatch(eventBlock, /TicketPaymentConfig/,
        'the event handler still contains ticket config code');
    assert.match(eventBlock, /writeEventPaymentConfig/);
    assert.match(eventBlock, /Event payment settings updated successfully/);
});
