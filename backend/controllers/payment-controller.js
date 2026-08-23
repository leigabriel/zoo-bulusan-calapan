const crypto = require('crypto');
const db = require('../config/database');
const Reservation = require('../models/reservation-model');
const { readConfig } = require('../config/event-payment-config');

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

const extractCheckout = (event) => {
    const resource = event?.data?.data || event?.data?.attributes?.data || event?.data?.attributes?.resource || event?.data;
    const attributes = resource?.attributes || {};
    const payment = Array.isArray(attributes.payments) ? attributes.payments[0] : null;
    return {
        id: resource?.id || null,
        paymentId: payment?.id || attributes.payment_id || attributes.payment_intent?.id || null,
        metadata: attributes.metadata || {},
        referenceNumber: attributes.reference_number || null
    };
};

const verifyWebhook = (req) => {
    const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
    if (!secret) return process.env.NODE_ENV !== 'production';

    const signature = req.headers['paymongo-signature'];
    if (!signature) return false;
    const parts = Object.fromEntries(signature.split(',').map(part => part.split('=')));
    const timestamp = parts.te;
    const signedPayload = `${timestamp}.${req.body.toString('utf8')}`;
    const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
    const provided = parts.li || parts.h1;
    if (!provided || provided.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
};

const updatePaymentFromWebhook = async (event) => {
    const eventType = event?.data?.type || event?.data?.attributes?.type || event?.type || '';
    const checkout = extractCheckout(event);
    if (!checkout.id) return;

    const reservation = await Reservation.findEventReservationByPaymentReference(
        checkout.id,
        checkout.referenceNumber || checkout.metadata.reservation_reference
    );
    if (!reservation) return;

    if (eventType.includes('paid')) {
        await Reservation.updateEventPayment(reservation.id, {
            paymentStatus: 'paid',
            paymentId: checkout.paymentId,
            paidAt: new Date()
        });
    } else if (eventType.includes('failed')) {
        await Reservation.updateEventPayment(reservation.id, { paymentStatus: 'failed' });
    } else if (eventType.includes('expired')) {
        await Reservation.updateEventPayment(reservation.id, { paymentStatus: 'expired' });
    } else if (eventType.includes('refunded')) {
        await Reservation.updateEventPayment(reservation.id, { paymentStatus: 'refunded' });
    }
};

exports.getEventPaymentConfig = (req, res) => {
    const config = readConfig();
    res.json({
        success: true,
        config: {
            enabled: Boolean(config.enabled && Number(config.amountPerParticipant) > 0),
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
        const paymentAmount = config.enabled && Number(config.amountPerParticipant) > 0
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
        if (!config.enabled || Number(config.amountPerParticipant) <= 0) {
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
        console.error('Error creating PayMongo checkout:', error);
        res.status(500).json({ success: false, message: error.message || 'Unable to start QR Ph payment.' });
    }
};

exports.handleWebhook = async (req, res) => {
    try {
        if (!verifyWebhook(req)) return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
        const event = JSON.parse(req.body.toString('utf8'));
        const eventId = event?.id || event?.data?.id || `${event?.data?.type || 'event'}:${event?.data?.data?.id || event?.data?.attributes?.data?.id || Date.now()}`;
        if (eventId) {
            const [result] = await db.query('INSERT IGNORE INTO paymongo_webhook_events (event_id) VALUES (?)', [eventId]);
            if (result.affectedRows === 0) return res.json({ success: true });
        }
        await updatePaymentFromWebhook(event);
        res.json({ success: true });
    } catch (error) {
        console.error('Error handling PayMongo webhook:', error);
        res.status(500).json({ success: false, message: 'Webhook processing failed.' });
    }
};
