const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  estimatedMinutesFromStart: { type: Number, default: 0 }
});

const routeSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: [true, 'Please add a route name'],
    unique: true,
    trim: true
  },
  routeCode: {
    type: String,
    required: true,
    unique: true
  },
  startPoint: {
    type: String,
    required: true
  },
  endPoint: {
    type: String,
    required: true
  },
  totalDistance: {
    type: String,
    default: '12 km'
  },
  estimatedDuration: {
    type: String,
    default: '35 mins'
  },
  stops: [stopSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Route', routeSchema);
