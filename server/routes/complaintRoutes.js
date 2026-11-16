const express = require('express');
const router = express.Router();
const { 
  getComplaints, 
  createComplaint, 
  updateComplaintProgress, 
  getComplaintById 
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getComplaints);
router.get('/:id', protect, getComplaintById);
router.post('/', protect, createComplaint);
router.put('/:id/progress', protect, authorize('admin'), updateComplaintProgress);

module.exports = router;
