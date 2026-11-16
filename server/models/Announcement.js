const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add announcement title']
  },
  message: {
    type: String,
    required: [true, 'Please add announcement message']
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'drivers'],
    default: 'all'
  },
  priority: {
    type: String,
    enum: ['normal', 'important', 'emergency'],
    default: 'normal'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  authorName: {
    type: String,
    default: 'Campus Transit Admin'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);
