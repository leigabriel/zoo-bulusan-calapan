const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/prediction-controller');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { trackActivity } = require('../middleware/track-activity');

router.post('/', optionalAuth, trackActivity('prediction_create', 'Saved an AI scanner prediction'), predictionController.createPrediction);
router.get('/', protect, authorize('admin', 'staff'), predictionController.getPredictions);
router.get('/stats', protect, authorize('admin', 'staff'), predictionController.getStats);
router.delete('/', protect, authorize('admin'), predictionController.deletePredictions);
router.delete('/clear', protect, authorize('admin'), predictionController.clearAllPredictions);

module.exports = router;
