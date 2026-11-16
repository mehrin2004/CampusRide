const express = require('express');
const router = express.Router();
const { 
  submitStudentDemand, 
  getStudentTodayDemand, 
  getDriverStopDemand,
  recordBoardingScan
} = require('../controllers/demandController');
const { protect } = require('../middleware/authMiddleware');

router.post('/respond', protect, submitStudentDemand);
router.get('/my-status', protect, getStudentTodayDemand);
router.get('/bus-summary/:busNumber', protect, getDriverStopDemand);
router.post('/scan-boarding', protect, recordBoardingScan);

module.exports = router;
