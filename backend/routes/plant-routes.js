const express = require('express');
const router = express.Router();
const plantController = require('../controllers/plant-controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', plantController.getAllPlants);
router.get('/stats', plantController.getPlantStats);
router.get('/category/:category', plantController.getPlantsByCategory);
router.get('/:id', plantController.getPlantById);

router.use(protect);
router.use(authorize('admin', 'staff'));

router.post('/', plantController.createPlant);
router.put('/:id', plantController.updatePlant);
router.put('/:id/status', plantController.updatePlantStatus);
router.delete('/:id', plantController.deletePlant);

module.exports = router;
