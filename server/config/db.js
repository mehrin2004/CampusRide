const mongoose = require('mongoose');

const DEFAULT_ATLAS_URI = 'mongodb+srv://admin:campusride123@cluster0.be9ttwf.mongodb.net/campusride?retryWrites=true&w=majority';

const connectDB = async () => {
  try {
    const rawUri = (process.env.MONGO_URI || '').trim();
    // Use Atlas cluster if rawUri is empty or points to localhost in production
    const targetUri = (rawUri && rawUri.startsWith('mongodb+srv://'))
      ? rawUri
      : (process.env.NODE_ENV === 'production' || !rawUri || rawUri.includes('127.0.0.1'))
        ? DEFAULT_ATLAS_URI
        : rawUri;

    console.log(`[DB] Connecting to MongoDB: ${targetUri.replace(/:([^:@]+)@/, ':****@')}`);
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });
    console.log(`[DB] MongoDB Connected Successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[DB] MongoDB Connection Error: ${error.message}`);
  }
};

module.exports = connectDB;
