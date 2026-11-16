const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusride');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`MongoDB Connection Warning: ${error.message}`);
    console.warn('Note: Ensure MongoDB is installed and running locally, or update MONGO_URI in server/.env to use MongoDB Atlas.');
    // We do not exit process immediately so server can run with fallback memory store if needed during dev
  }
};

module.exports = connectDB;
