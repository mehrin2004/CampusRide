const mongoose = require('mongoose');

const dailyAttendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  rollNumber: {
    type: String,
    default: 'RCET-STUDENT'
  },
  busNumber: {
    type: String,
    required: true,
    trim: true
  },
  stopName: {
    type: String,
    required: [true, 'Please specify your bus stop'],
    trim: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['coming', 'not_coming'],
    required: true
  }
}, {
  timestamps: true
});

// Ensure a student can only have one attendance record per date
dailyAttendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyAttendance', dailyAttendanceSchema);
