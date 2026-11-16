const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: [true, 'Please add bus number (e.g. CR-101)'],
    unique: true,
    trim: true
  },
  plateNumber: {
    type: String,
    required: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    default: 50
  },
  status: {
    type: String,
    enum: ['on_route', 'idle', 'delayed', 'breakdown', 'maintenance'],
    default: 'idle'
  },
  currentLocation: {
    lat: { type: Number, default: 8.1685 },
    lng: { type: Number, default: 77.5362 },
    speed: { type: Number, default: 0 },
    heading: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  driverName: {
    type: String,
    default: ''
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    default: null
  },
  routeName: {
    type: String,
    default: ''
  },
  estimatedArrival: {
    type: String,
    default: '15 mins'
  },
  fuelLevel: {
    type: Number,
    default: 85 // percentage
  },
  tireCondition: {
    type: String,
    enum: ['Good', 'Fair', 'Needs Inspection', 'Critical'],
    default: 'Good'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bus', busSchema);
