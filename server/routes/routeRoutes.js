const express = require('express');
const router = express.Router();
const { getAllRoutes, createRoute, updateRoute } = require('../controllers/routeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getAllRoutes);
router.post('/', protect, authorize('admin'), createRoute);
router.put('/:id', protect, authorize('admin'), updateRoute);

module.exports = router;
