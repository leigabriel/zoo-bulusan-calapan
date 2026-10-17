const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment-controller');
const { protect, authorize } = require('../middleware/auth');
const { trackActivity } = require('../middleware/track-activity');

router.use(protect);
router.get('/event/config', paymentController.getEventPaymentConfig);
router.post('/event/:id/checkout', trackActivity('payment_checkout', 'Started payment for event reservation'), paymentController.createEventCheckout);
router.post('/event/:id/pay-at-bulusan', trackActivity('payment_method_update', 'Selected pay at Bulusan for event reservation'), paymentController.setPayAtBulusan);
router.post('/event/:id/refund', trackActivity('refund_request', 'Requested refund for event reservation'), paymentController.requestEventRefund);
router.post('/event/:id/mark-paid', authorize('admin', 'staff'), trackActivity('payment_method_update', 'Marked event reservation payment as paid'), paymentController.markEventPaid);

// Ticket reservations have their own checkout, config and payment lifecycle,
// independent of events (see config/ticket-payment-config.js).
router.get('/ticket/config', paymentController.getTicketPaymentConfig);
router.post('/ticket/:id/checkout', trackActivity('payment_checkout', 'Started payment for ticket reservation'), paymentController.createTicketCheckout);
router.post('/ticket/:id/pay-at-bulusan', trackActivity('payment_method_update', 'Selected pay at Bulusan for ticket reservation'), paymentController.setTicketPayAtBulusan);
router.post('/ticket/:id/refund', trackActivity('refund_request', 'Requested refund for ticket reservation'), paymentController.requestTicketRefund);
router.post('/ticket/:id/mark-paid', authorize('admin', 'staff'), trackActivity('payment_method_update', 'Marked ticket reservation payment as paid'), paymentController.markTicketPaid);

module.exports = router;
