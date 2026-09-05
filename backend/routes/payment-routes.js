const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment-controller');
const { protect } = require('../middleware/auth');
const { trackActivity } = require('../middleware/track-activity');

router.use(protect);
router.get('/event/config', paymentController.getEventPaymentConfig);
router.post('/event/:id/checkout', trackActivity('payment_checkout', 'Started payment for event reservation'), paymentController.createEventCheckout);
router.post('/event/:id/pay-at-bulusan', trackActivity('payment_method_update', 'Selected pay at Bulusan for event reservation'), paymentController.setPayAtBulusan);
router.post('/event/:id/refund', trackActivity('refund_request', 'Requested refund for event reservation'), paymentController.requestEventRefund);

module.exports = router;
