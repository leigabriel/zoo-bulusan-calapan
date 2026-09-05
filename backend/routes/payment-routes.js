const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment-controller');
const { protect } = require('../middleware/auth');
const { trackActivity } = require('../middleware/track-activity');

router.use(protect);
router.get('/event/config', paymentController.getEventPaymentConfig);
router.post('/event/:id/checkout', trackActivity('payment_checkout', (req) => `Started payment for event reservation #${req.params.id}`), paymentController.createEventCheckout);
router.post('/event/:id/pay-at-bulusan', trackActivity('payment_method_update', (req) => `Selected pay at Bulusan for event reservation #${req.params.id}`), paymentController.setPayAtBulusan);
router.post('/event/:id/refund', trackActivity('refund_request', (req) => `Requested refund for event reservation #${req.params.id}`), paymentController.requestEventRefund);

module.exports = router;
