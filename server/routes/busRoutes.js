const express = require('express');
const router = express.Router();
const { 
  getAllBuses, 
  getBusById, 
  createBus, 
  updateBus, 
  updateBusLocation, 
  updateBusStatus,
  startBusSimulation,
  stopBusSimulation,
  resetBusTrip
} = require('../controllers/busController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getAllBuses);
router.get('/:id', getBusById);
router.post('/', protect, authorize('admin'), createBus);
router.put('/:id', protect, authorize('admin'), updateBus);
router.put('/:id/location', protect, authorize('driver', 'admin'), updateBusLocation);
router.put('/:id/status', protect, authorize('driver', 'admin'), updateBusStatus);
router.post('/:id/start-simulation', protect, authorize('driver', 'admin'), startBusSimulation);
router.post('/:id/stop-simulation', protect, authorize('driver', 'admin'), stopBusSimulation);
router.post('/:id/reset-trip', protect, authorize('driver', 'admin'), resetBusTrip);

module.exports = router;
