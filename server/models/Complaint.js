const mongoose = require('mongoose');

const progressUpdateSchema = new mongoose.Schema({
  note: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved'],
    default: 'in_progress'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedByName: {
    type: String,
    default: 'Admin'
  },
  targetAudience: {
    type: String,
    enum: ['students', 'drivers', 'all'],
    default: 'all'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title/short summary']
  },
  category: {
    type: String,
    enum: [
      'oil',          
      'brake',        
      'seat',         
      'seating',      
      'water_wash',   
      'tyre',         
      'tire',         
      'window',       
      'other_problem',
      'fuel',
      'engine',
      'delay',
      'overcrowding',
      'sanitation',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    required: [true, 'Please provide details of the complaint']
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedRole: {
    type: String,
    enum: ['driver', 'student'],
    required: true
  },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  targetAudience: {
    type: String,
    enum: ['students', 'drivers', 'all'],
    default: 'all'
  },
  isVoiceSubmitted: {
    type: Boolean,
    default: false
  },
  isRequisition: {
    type: Boolean,
    default: false
  },
  estimatedPrice: {
    type: Number,
    default: 0
  },
  // Uploaded Spare Parts Bill Receipt Image (Base64 / URL)
  billReceiptImage: {
    type: String,
    default: ''
  },
  billPassNote: {
    type: String,
    default: ''
  },
  billIssuedAt: {
    type: Date,
    default: null
  },
  progressUpdates: [progressUpdateSchema],
  resolutionNote: {
    type: String,
    default: ''
  },
  proofNote: {
    type: String,
    default: ''
  },
  proofImage: {
    type: String,
    default: ''
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Complaint', complaintSchema);
