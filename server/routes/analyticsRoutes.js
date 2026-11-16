const express = require('express');
const router = express.Router();
const { getAnalyticsStats } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('admin'), getAnalyticsStats);

module.exports = router;
