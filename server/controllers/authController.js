const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'campusride_super_secret_jwt_key_2026_antigravity', {
    expiresIn: '30d'
  });
};

// @desc    Register new user (Student, Driver, Admin)
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, parentPhone, rollNumber, department, licenseNumber, experienceYears, adminKey, busNumber } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please enter all required fields' });
    }

    // Role safety check for admin registration
    if (role === 'admin' && adminKey !== 'ADMIN2026') {
      return res.status(400).json({ success: false, message: 'Invalid Admin Authorization Passkey' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    let assignedBusId = null;
    if (busNumber && busNumber.trim()) {
      const Bus = require('../models/Bus');
      const rawNum = busNumber.trim();
      const cleanBusNum = rawNum.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const sanitized = rawNum.replace(/bus|route|shuttle|\s|-/gi, '');
      let foundBus = await Bus.findOne({
        $or: [
          { busNumber: { $regex: new RegExp('^' + cleanBusNum + '$', 'i') } },
          { busNumber: { $regex: new RegExp(cleanBusNum, 'i') } },
          { busNumber: { $regex: new RegExp(sanitized, 'i') } }
        ]
      });
      if (foundBus) {
        assignedBusId = foundBus._id;
      }
    }

    const userData = {
      name,
      email: email.toLowerCase(),
      password,
      role,
      phone: phone || '',
      parentPhone: parentPhone || phone || '+91 98421 00202',
      rollNumber: rollNumber || '',
      department: department || '',
      licenseNumber: licenseNumber || '',
      experienceYears: experienceYears || 0,
      assignedBus: assignedBusId
    };

    const user = await User.create(userData);

    let createdUser = user;
    if (assignedBusId) {
      createdUser = await User.findById(user._id).populate({ path: 'assignedBus', populate: { path: 'route' } });
    }

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      data: {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        phone: createdUser.phone,
        rollNumber: createdUser.rollNumber,
        licenseNumber: createdUser.licenseNumber,
        assignedBus: createdUser.assignedBus,
        token: generateToken(createdUser._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user (Student, Driver, Admin)
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password, role, busNumber } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    let user = await User.findOne({ email: email.toLowerCase() }).select('+password').populate('assignedBus');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Verify role if specified
    if (role && user.role !== role) {
      return res.status(403).json({ 
        success: false, 
        message: `Account found, but it is registered as a '${user.role.toUpperCase()}', not '${role.toUpperCase()}'. Please select correct login tab.` 
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // If busNumber provided during login (Student / Driver), assign session to that bus
    if (busNumber && busNumber.trim()) {
      const Bus = require('../models/Bus');
      const rawNum = busNumber.trim();
      const cleanBusNum = rawNum.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const sanitized = rawNum.replace(/bus|route|shuttle|\s|-/gi, '');
      let foundBus = await Bus.findOne({
        $or: [
          { busNumber: { $regex: new RegExp('^' + cleanBusNum + '$', 'i') } },
          { busNumber: { $regex: new RegExp(cleanBusNum, 'i') } },
          { busNumber: { $regex: new RegExp(sanitized, 'i') } }
        ]
      });
      if (foundBus) {
        user.assignedBus = foundBus._id;
        await user.save();
        user = await User.findById(user._id).populate({ path: 'assignedBus', populate: { path: 'route' } });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        rollNumber: user.rollNumber,
        licenseNumber: user.licenseNumber,
        rating: user.rating,
        assignedBus: user.assignedBus,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'assignedBus',
      populate: { path: 'route' }
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (for Admin)
// @route   GET /api/auth/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).populate('assignedBus').select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Lead Driver status for a driver (Admin only)
// @route   PUT /api/auth/users/:id/lead-driver
// @access  Private (Admin)
exports.toggleLeadDriver = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role !== 'driver') {
      return res.status(400).json({ success: false, message: 'Only drivers can be assigned as Lead Drivers' });
    }

    user.isLeadDriver = !user.isLeadDriver;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Driver ${user.name} lead status updated to ${user.isLeadDriver ? 'LEAD DRIVER' : 'STANDARD DRIVER'}`,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update current user assigned bus
// @route   PUT /api/auth/assigned-bus
// @access  Private
exports.updateAssignedBus = async (req, res) => {
  try {
    const { busId, busNumber } = req.body;
    const Bus = require('../models/Bus');
    let busToAssign = null;

    if (busId) {
      busToAssign = await Bus.findById(busId).populate('route');
    } else if (busNumber) {
      const cleanBusNum = busNumber.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const sanitized = busNumber.trim().replace(/bus|route|shuttle|\s|-/gi, '');
      busToAssign = await Bus.findOne({
        $or: [
          { busNumber: { $regex: new RegExp('^' + cleanBusNum + '$', 'i') } },
          { busNumber: { $regex: new RegExp(cleanBusNum, 'i') } },
          { busNumber: { $regex: new RegExp(sanitized, 'i') } }
        ]
      }).populate('route');
    }

    if (!busToAssign) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { assignedBus: busToAssign._id },
      { new: true }
    ).populate({ path: 'assignedBus', populate: { path: 'route' } });

    res.status(200).json({
      success: true,
      message: `Assigned bus updated to ${busToAssign.busNumber}`,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Seed demo database
// @route   POST /api/auth/seed-demo
// @access  Public
exports.seedDemo = async (req, res) => {
  try {
    const seedHelper = require('../utils/seeder');
    await seedHelper();
    res.status(200).json({
      success: true,
      message: 'Demo database seeded successfully! You can now sign in with any demo role.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Seeding failed: ' + error.message });
  }
};




