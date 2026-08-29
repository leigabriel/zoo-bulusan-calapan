const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment-controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/event/config', paymentController.getEventPaymentConfig);
router.post('/event/:id/checkout', paymentController.createEventCheckout);
router.post('/event/:id/pay-at-bulusan', paymentController.setPayAtBulusan);
router.post('/event/:id/refund', paymentController.requestEventRefund);

module.exports = router;