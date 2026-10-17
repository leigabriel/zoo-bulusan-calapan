const crypto = require('crypto');
const db = require('../config/database');
const Reservation = require('../models/reservation-model');
const { notifyUser } = require('../services/notification-service');
const { readConfig } = require('../config/event-payment-config');
const ticketPaymentCfg = require('../config/ticket-payment-config');
const readTicketConfig = ticketPaymentCfg.readConfig;

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const getPayMongoSecretKey = () => process.env.PAYMONGO_SECRET_KEY?.trim();

const paymongoRequest = async (body) => {
    const secretKey = getPayMongoSecretKey();
    if (!secretKey) {
        throw new Error('PayMongo is not configured. Set PAYMONGO_SECRET_KEY.');
    }

    const response = await fetch('https://api.paymongo.com/v2/checkout_sessions', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload?.errors?.[0]?.detail || 'PayMongo checkout could not be created.');
    }
    return payload.data;
};

const extractPaymentResource = (event) => event?.data?.data || event?.data?.attributes?.data || event?.data?.attributes?.resource || event?.data;

const extractCheckout = (event) => {
    const resource = extractPaymentResource(event);
    const attributes = resource?.attributes || {};
    const payment = Array.isArray(attributes.payments) ? attributes.payments[0] : null;
    return {
        id: resource?.id || null,
        checkoutSessionId: attributes.checkout_session_id || attributes.checkout_session?.id ||
            (resource?.type === 'checkout_session' ? resource.id : null),
        paymentId: payment?.id || attributes.payment_id || attributes.payment_intent?.id ||
            (resource?.type === 'payment' || resource?.type === 'qr' ? resource.id : null),
        metadata: { ...(attributes.metadata || {}), ...(attributes.payment_intent?.attributes?.metadata || {}) },
        referenceNumber: attributes.reference_number || null
    };
};

/**
 * PayMongo signs "<timestamp>.<body>". The timestamp was read but never checked,
 * so a captured request stayed replayable indefinitely - the HMAC is valid forever.
 * Five minutes is comfortably longer than any legitimate retry.
 */
const WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * Reject a webhook whose signed timestamp is missing or outside the window.
 * @param {string|undefined} timestamp parts.t from the signature header
 * @param {number} [toleranceMs]
 * @returns {boolean}
 */
const isTimestampFresh = (timestamp, toleranceMs = WEBHOOK_TIMESTAMP_TOLERANCE_MS) => {
    if (!timestamp || !/^\d+$/.test(String(timestamp))) return false;
    const age = Date.now() - Number(timestamp) * 1000;
    // A little clock skew into the future is normal; more than that is not.
    return age <= toleranceMs && age >= -toleranceMs;
};

/**
 * Stable id for an event, so replays can be detected.
 * @param {any} event parsed webhook body
 * @param {Buffer} rawBody
 * @returns {string}
 */
const webhookEventId = (event, rawBody) =>
    event?.id || event?.data?.id || crypto.createHash('sha256').update(rawBody).digest('hex');

const verifyWebhook = (req) => {
    const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
    if (!secret) {
        // Fail closed in production. Locally there is no real PayMongo traffic to
        // protect, and blocking a developer without a secret helps nobody.
        if (process.env.NODE_ENV === 'production') {
            console.error('[security] PAYMONGO_WEBHOOK_SECRET is unset; rejecting all webhooks.');
            return false;
        }
        console.warn('[security] PAYMONGO_WEBHOOK_SECRET is unset; accepting unsigned webhooks (development only).');
        return true;
    }

    const signature = req.headers['paymongo-signature'];
    if (!signature) return false;

    const parts = Object.fromEntries(signature.split(',').map(part => {
        const separator = part.indexOf('=');
        return separator === -1 ? [part, ''] : [part.slice(0, separator), part.slice(separator + 1)];
    }));

    if (!parts.t || !Buffer.isBuffer(req.body)) return false;
    if (!isTimestampFresh(parts.t)) return false;

    const signedPayload = `${parts.t}.${req.body.toString('utf8')}`;
    const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

    return [parts.li, parts.te].some(provided => {
        if (!provided || provided.length !== expected.length) return false;
        return crypto.timingSafeEqual(Buffer.from(provided, 'utf8'), Buffer.from(expected, 'utf8'));
    });
};

const updatePaymentFromWebhook = async (event) => {
    // PayMongo wraps webhook events in a resource with type "event". The
    // actual event name is stored in data.attributes.type.
    const eventType = event?.data?.attributes?.type || event?.type || event?.data?.type || '';
    const checkout = extractCheckout(event);
    const metadata = checkout.metadata || {};
    const checkoutId = checkout.checkoutSessionId || (event?.data?.type === 'checkout_session' ? checkout.id : null);

    const reference = checkout.referenceNumber || metadata.reservation_reference;
    const metadataId = metadata.reservation_id;

    // Event and ticket reservations live in different tables, so a ticket
    // checkout used to fall through this lookup entirely. The webhook then threw
    // "reservation mismatch" and the visitor's payment never reconciled - they
    // paid and the reservation stayed unpaid. Both kinds must be resolved here.
    // metadata.reservation_kind was added with ticket checkout; when it is absent
    // we fall back to trying both so in-flight event checkouts keep working.
    const kind = metadata.reservation_kind === 'ticket' ? 'ticket'
        : metadata.reservation_kind === 'event' ? 'event'
            : null;

    let isTicket = false;
    let reservation = null;

    if (kind !== 'ticket') {
        reservation = await Reservation.findEventReservationByPaymentReference(checkoutId, reference, checkout.paymentId, metadataId);
    }
    if (!reservation) {
        isTicket = true;
        reservation = await Reservation.findTicketReservationByPaymentReference(checkoutId, reference, checkout.paymentId, metadataId);
    }
    if (!reservation) {
        throw new Error(`PayMongo webhook reservation mismatch: ${eventType}`);
    }

    const applyPaymentUpdate = (data) => (isTicket
        ? Reservation.updateTicketPayment(reservation.id, data)
        : Reservation.updateEventPayment(reservation.id, data));

    let paymentStatus = null;
    let updated = true;
    if (eventType === 'qr.paid' || eventType === 'payment.paid' || eventType.endsWith('.paid')) {
        if (reservation.payment_status === 'paid') return true;
        paymentStatus = 'paid';
        updated = await applyPaymentUpdate({
            paymentStatus: 'paid',
            paymentId: checkout.paymentId,
            paidAt: new Date()
        });
    } else if (eventType.includes('failed')) {
        paymentStatus = 'failed';
        updated = await applyPaymentUpdate({ paymentStatus });
    } else if (eventType.includes('expired')) {
        paymentStatus = 'expired';
        updated = await applyPaymentUpdate({ paymentStatus });
    } else if (eventType.includes('refunded')) {
        paymentStatus = 'refunded';
        updated = await applyPaymentUpdate({ paymentStatus });
    }
    if (updated && paymentStatus && reservation.user_id) {
        await notifyUser(
            reservation.user_id,
            'ticket.paid',
            { reference: reservation.reservation_reference, status: paymentStatus },
            '/reservations'
        );
    }
    return updated;
};

exports.getEventPaymentConfig = (req, res) => {
    const config = readConfig();
    res.json({
        success: true,
        config: {
            enabled: Boolean(config.qrphEnabled && Number(config.amountPerParticipant) > 0),
            qrphEnabled: Boolean(config.qrphEnabled && Number(config.amountPerParticipant) > 0),
            amountPerParticipant: Number(config.amountPerParticipant) || 0,
            currency: config.currency || 'PHP'
        }
    });
};

exports.setPayAtBulusan = async (req, res) => {
    try {
        const reservation = await Reservation.findEventReservationById(req.params.id);
        if (!reservation || String(reservation.user_id) !== String(req.user.id)) {
            return res.status(404).json({ success: false, message: 'Event reservation not found.' });
        }
        if (reservation.payment_status === 'paid') {
            return res.json({ success: true, reservation });
        }
        const config = readConfig();
        const paymentAmount = Number(config.amountPerParticipant) > 0
            ? Math.round(Number(config.amountPerParticipant) * 100) / 100
            : Number(reservation.payment_amount || 0);
        await Reservation.updateEventPayment(reservation.id, {
            paymentAmount,
            paymentMethod: 'pay_at_bulusan',
            paymentStatus: 'unpaid',
            checkoutSessionId: null
        });
        res.json({ success: true, message: 'Payment will be collected at Bulusan.', paymentMethod: 'pay_at_bulusan', paymentStatus: 'unpaid' });
    } catch (error) {
        console.error('Error selecting pay-at-Bulusan:', error);
        res.status(500).json({ success: false, message: 'Unable to select payment method.' });
    }
};

exports.markEventPaid = async (req, res) => {
    try {
        const reservation = await Reservation.findEventReservationById(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Event reservation not found.' });
        if (reservation.payment_method !== 'pay_at_bulusan') return res.status(400).json({ success: false, message: 'Only Pay at Bulusan reservations can be marked paid here.' });
        if (reservation.payment_status === 'paid') return res.json({ success: true, reservation });
        if (reservation.status === 'cancelled') return res.status(400).json({ success: false, message: 'Cancelled reservations cannot be marked paid.' });
        await Reservation.updateEventPayment(reservation.id, { paymentStatus: 'paid', paidAt: new Date() });
        if (reservation.user_id) {
            await notifyUser(
                reservation.user_id,
                'ticket.paid',
                { reference: reservation.reservation_reference, status: 'paid' },
                '/reservations'
            );
        }
        const updated = await Reservation.findEventReservationById(reservation.id);
        return res.json({ success: true, message: 'Event payment marked as paid.', reservation: updated });
    } catch (error) {
        console.error('Error marking event payment paid:', error);
        return res.status(500).json({ success: false, message: 'Unable to mark event payment as paid.' });
    }
};

exports.requestEventRefund = async (req, res) => {
    try {
        const reservation = await Reservation.findEventReservationById(req.params.id);
        if (!reservation || String(reservation.user_id) !== String(req.user.id)) {
            return res.status(404).json({ success: false, message: 'Event reservation not found.' });
        }
        if (reservation.payment_status !== 'paid') {
            return res.status(400).json({ success: false, message: 'Only paid reservations can request a refund.' });
        }
        if (reservation.refund_status) {
            return res.json({ success: true, refundStatus: reservation.refund_status });
        }

        await Reservation.updateEventPayment(reservation.id, {
            refundStatus: 'requested',
            refundRequestedAt: new Date()
        });
        return res.json({ success: true, refundStatus: 'requested', message: 'Refund request submitted for review.' });
    } catch (error) {
        console.error('Error requesting event refund:', error);
        return res.status(500).json({ success: false, message: 'Unable to submit refund request.' });
    }
};

exports.createEventCheckout = async (req, res) => {
    try {
        const config = readConfig();
        if (!config.qrphEnabled || Number(config.amountPerParticipant) <= 0) {
            return res.status(400).json({ success: false, message: 'Online event payment is currently disabled.' });
        }

        const reservation = await Reservation.findEventReservationById(req.params.id);
        if (!reservation || String(reservation.user_id) !== String(req.user.id)) {
            return res.status(404).json({ success: false, message: 'Event reservation not found.' });
        }
        if (reservation.payment_status === 'paid') {
            return res.status(400).json({ success: false, message: 'This reservation is already paid.' });
        }

        const amount = Math.round(Number(config.amountPerParticipant) * 100);
        const checkout = await paymongoRequest({
            data: {
                attributes: {
                    billing: {
                        name: reservation.participant_name,
                        email: reservation.participant_email,
                        phone: reservation.participant_phone || undefined
                    },
                    line_items: [{
                        currency: config.currency || 'PHP',
                        amount,
                        name: `Event reservation: ${reservation.venue_event_name}`,
                        quantity: 1
                    }],
                    payment_method_types: ['qrph'],
                    description: `Event reservation ${reservation.reservation_reference}`,
                    reference_number: reservation.reservation_reference,
                    success_url: `${getFrontendUrl()}/reservations?payment=success&reservation=${reservation.id}`,
                    cancel_url: `${getFrontendUrl()}/reservations?payment=cancelled&reservation=${reservation.id}`,
                    metadata: {
                        reservation_id: String(reservation.id),
                        reservation_reference: reservation.reservation_reference
                    }
                }
            }
        });

        await Reservation.updateEventPayment(reservation.id, {
            paymentAmount: amount / 100,
            paymentMethod: 'qrph',
            paymentStatus: 'pending',
            checkoutSessionId: checkout.id
        });

        res.json({
            success: true,
            paymentMethod: 'qrph',
            checkoutUrl: checkout.attributes?.checkout_url,
            checkoutSessionId: checkout.id
        });
    } catch (error) {
        // Full detail goes to the log; the client gets a safe, fixed message.
        console.error('Error creating PayMongo checkout:', error);
        res.status(500).json({ success: false, message: 'Unable to start QR Ph payment.' });
    }
};

exports.handleWebhook = async (req, res) => {
  try {
    if (!verifyWebhook(req)) {
      console.warn('PayMongo webhook rejected (bad signature, stale timestamp, or missing secret).');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    let event;
    try {
      event = JSON.parse(req.body.toString('utf8'));
    } catch {
      console.warn('PayMongo webhook contained invalid JSON.');
      return res.status(400).json({ success: false, message: 'Invalid webhook body.' });
    }

    // Claim the event id BEFORE processing. The row used to be inserted afterwards,
    // so a replayed webhook ran updatePaymentFromWebhook() a second time and only
    // then had its INSERT IGNORE silently dropped - the dedupe protected nothing.
    const eventId = webhookEventId(event, req.body);
    const [claim] = await db.query(
      'INSERT IGNORE INTO paymongo_webhook_events (event_id) VALUES (?)',
      [eventId]
    );

    if (!claim || claim.affectedRows === 0) {
      console.log(`PayMongo webhook ${eventId} already processed; ignoring replay.`);
      return res.status(200).json({ success: true, duplicate: true });
    }

    await updatePaymentFromWebhook(event);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling PayMongo webhook:', error);
    return res.status(500).json({ success: false, message: 'Webhook processing failed.' });
  }
};

/**
 * Work out what a ticket reservation costs from the quantities already stored on
 * the row. Prices come from the admin-editable config rather than being
 * hardcoded, so changing a price does not need a code deploy.
 *
 * @param {object} reservation
 * @param {object} config
 * @returns {number} amount in pesos, rounded to 2dp
 */
const computeTicketAmount = (reservation, config) => {
    const priceOf = (quantity, price) => (Number(quantity) || 0) * (Number(price) || 0);
    const total =
        priceOf(reservation.adult_quantity, config.adultPrice) +
        priceOf(reservation.child_quantity, config.childPrice) +
        priceOf(reservation.bulusan_resident_quantity, config.residentPrice);
    return Math.round(total * 100) / 100;
};

/**
 * One PayMongo line item per non-zero category, so the visitor sees a breakdown
 * rather than a single opaque total.
 *
 * @param {object} reservation
 * @param {object} config
 * @returns {Array<{currency: string, amount: number, name: string, quantity: number}>} amounts in centavos
 */
const ticketLineItems = (reservation, config) => {
    const items = [];
    const add = (quantity, price, name) => {
        const qty = Number(quantity) || 0;
        const cents = Math.round((Number(price) || 0) * 100) * qty;
        if (qty > 0 && cents > 0) {
            items.push({ currency: config.currency || 'PHP', amount: cents, name: `${name} x${qty}`, quantity: 1 });
        }
    };
    add(reservation.adult_quantity, config.adultPrice, 'Adult');
    add(reservation.child_quantity, config.childPrice, 'Child');
    add(reservation.bulusan_resident_quantity, config.residentPrice, 'Bulusan Resident');
    return items;
};

exports.getTicketPaymentConfig = (req, res) => {
    const config = readTicketConfig();
    res.json({
        success: true,
        config: {
            enabled: Boolean(config.qrphEnabled),
            qrphEnabled: Boolean(config.qrphEnabled),
            adultPrice: Number(config.adultPrice) || 0,
            childPrice: Number(config.childPrice) || 0,
            residentPrice: Number(config.residentPrice) || 0,
            currency: config.currency || 'PHP'
        }
    });
};

exports.setTicketPayAtBulusan = async (req, res) => {
    try {
        const reservation = await Reservation.findTicketReservationById(req.params.id);
        if (!reservation || String(reservation.user_id) !== String(req.user.id)) {
            return res.status(404).json({ success: false, message: 'Ticket reservation not found.' });
        }
        if (reservation.payment_status === 'paid') {
            return res.json({ success: true, reservation });
        }
        const config = readTicketConfig();
        await Reservation.updateTicketPayment(reservation.id, {
            paymentAmount: computeTicketAmount(reservation, config),
            paymentMethod: 'pay_at_bulusan',
            paymentStatus: 'unpaid'
        });
        return res.json({ success: true, message: 'Payment method saved: Pay at Bulusan.' });
    } catch (error) {
        console.error('Error selecting pay at Bulusan for ticket:', error);
        return res.status(500).json({ success: false, message: 'Unable to select payment method.' });
    }
};

exports.markTicketPaid = async (req, res) => {
    try {
        const reservation = await Reservation.findTicketReservationById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Ticket reservation not found.' });
        }
        if (reservation.payment_status === 'paid') {
            return res.json({ success: true, reservation });
        }
        const config = readTicketConfig();
        await Reservation.updateTicketPayment(reservation.id, {
            paymentAmount: computeTicketAmount(reservation, config),
            paymentMethod: reservation.payment_method || 'cash',
            paymentStatus: 'paid',
            paidAt: new Date()
        });
        return res.json({ success: true, message: 'Ticket reservation marked as paid.' });
    } catch (error) {
        console.error('Error marking ticket reservation paid:', error);
        return res.status(500).json({ success: false, message: 'Unable to mark the ticket reservation as paid.' });
    }
};

exports.requestTicketRefund = async (req, res) => {
    try {
        const reservation = await Reservation.findTicketReservationById(req.params.id);
        if (!reservation || String(reservation.user_id) !== String(req.user.id)) {
            return res.status(404).json({ success: false, message: 'Ticket reservation not found.' });
        }
        if (reservation.payment_status !== 'paid') {
            return res.status(400).json({ success: false, message: 'Only paid reservations can request a refund.' });
        }
        await Reservation.updateTicketPayment(reservation.id, {
            refundStatus: 'requested',
            refundRequestedAt: new Date()
        });
        return res.json({ success: true, refundStatus: 'requested', message: 'Refund request submitted for review.' });
    } catch (error) {
        console.error('Error requesting ticket refund:', error);
        return res.status(500).json({ success: false, message: 'Unable to submit refund request.' });
    }
};

exports.createTicketCheckout = async (req, res) => {
    try {
        const config = readTicketConfig();
        if (!config.qrphEnabled) {
            return res.status(400).json({ success: false, message: 'Online ticket payment is currently disabled.' });
        }

        const reservation = await Reservation.findTicketReservationById(req.params.id);
        if (!reservation || String(reservation.user_id) !== String(req.user.id)) {
            return res.status(404).json({ success: false, message: 'Ticket reservation not found.' });
        }
        if (reservation.payment_status === 'paid') {
            return res.status(400).json({ success: false, message: 'This reservation is already paid.' });
        }

        const amount = computeTicketAmount(reservation, config);
        // Bulusan residents are free, so an all-resident booking has nothing to
        // charge and PayMongo would reject a zero-amount checkout anyway.
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'This reservation has no payable amount, so there is nothing to pay online.'
            });
        }

        const lineItems = ticketLineItems(reservation, config);
        if (!lineItems.length) {
            return res.status(400).json({ success: false, message: 'No chargeable tickets in this reservation.' });
        }

        const checkout = await paymongoRequest({
            data: {
                attributes: {
                    billing: {
                        name: reservation.visitor_name,
                        email: reservation.visitor_email,
                        phone: reservation.visitor_phone || undefined
                    },
                    line_items: lineItems,
                    payment_method_types: ['qrph'],
                    description: `Zoo admission ${reservation.reservation_reference}`,
                    reference_number: reservation.reservation_reference,
                    success_url: `${getFrontendUrl()}/reservations?payment=success&reservation=${reservation.id}`,
                    cancel_url: `${getFrontendUrl()}/reservations?payment=cancelled&reservation=${reservation.id}`,
                    metadata: {
                        reservation_id: String(reservation.id),
                        reservation_reference: reservation.reservation_reference,
                        reservation_kind: 'ticket'
                    }
                }
            }
        });

        await Reservation.updateTicketPayment(reservation.id, {
            paymentAmount: amount,
            paymentMethod: 'qrph',
            paymentStatus: 'pending',
            checkoutSessionId: checkout.id
        });

        res.json({
            success: true,
            paymentMethod: 'qrph',
            amount,
            checkoutUrl: checkout.attributes?.checkout_url,
            checkoutSessionId: checkout.id
        });
    } catch (error) {
        // Full detail goes to the log; the client gets a safe, fixed message.
        console.error('Error creating ticket PayMongo checkout:', error);
        res.status(500).json({ success: false, message: 'Unable to start QR Ph payment.' });
    }
};
