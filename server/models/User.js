const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'driver', 'student'],
    required: true
  },
  phone: {
    type: String,
    default: ''
  },
  parentPhone: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  // Specific role attributes
  rollNumber: {
    type: String, // For Students
    default: ''
  },
  department: {
    type: String, // For Students
    default: ''
  },
  licenseNumber: {
    type: String, // For Drivers
    default: ''
  },
  experienceYears: {
    type: Number, // For Drivers
    default: 0
  },
  assignedBus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    default: null
  },
  rating: {
    type: Number,
    default: 4.8
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isLeadDriver: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
