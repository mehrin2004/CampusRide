const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Complaint = require('../models/Complaint');
const Announcement = require('../models/Announcement');

dotenv.config();

const clearSampleData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusride');
    console.log('Connected to MongoDB. Removing all sample data...');

    // Delete all complaints, announcements, buses, routes, and notifications
    await Complaint.deleteMany({});
    await Announcement.deleteMany({});
    await Bus.deleteMany({});
    await Route.deleteMany({});
    await User.deleteMany({});

    // Try deleting notifications if Notification model exists
    try {
      const Notification = require('../models/Notification');
      await Notification.deleteMany({});
    } catch (e) {
      // Ignored if model not present
    }

    console.log('Cleared all sample complaints, announcements, notifications, buses, and routes.');

    // Create base accounts (Admin, Student)
    await User.create({
      name: 'Campus Admin',
      email: 'admin@campusride.edu',
      password: 'password123',
      role: 'admin',
      phone: '+91 94431 00000'
    });

    await User.create({
      name: 'Campus Student',
      email: 'student@campusride.edu',
      password: 'password123',
      role: 'student',
      phone: '+91 88701 00000',
      rollNumber: 'RCET-2026-001',
      department: 'Computer Science'
    });

    console.log('✅ All sample data removed successfully!');
    console.log('\n--- FRESH LOG IN CREDENTIALS ---');
    console.log('ADMIN   : admin@campusride.edu    / password123');
    console.log('STUDENT : student@campusride.edu  / password123');
    console.log('--------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Error clearing sample data:', error);
    process.exit(1);
  }
};

clearSampleData();
