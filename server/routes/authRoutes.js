const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getAllUsers, seedDemo, toggleLeadDriver, updateAssignedBus } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/seed-demo', seedDemo);
router.get('/me', protect, getMe);
router.put('/assigned-bus', protect, updateAssignedBus);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:id/lead-driver', protect, authorize('admin'), toggleLeadDriver);

module.exports = router;

