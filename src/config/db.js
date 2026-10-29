import mongoose from 'mongoose';

export const dbState = {
  isConnected: false,
};

export default async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/visafornation';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    dbState.isConnected = true;
    console.log('MongoDB connected successfully.');
  } catch (err) {
    dbState.isConnected = false;
    console.warn(`⚠️ MongoDB connection warning: ${err.message}`);
    console.warn('MongoDB is unavailable. Database-backed content changes will fail until it reconnects.');
  }

  // Handle connection events for the mongoose connection db 
  mongoose.connection.on('connected', () => {
    dbState.isConnected = true;
    console.log('✅ MongoDB connection established sucessfully');
  });

  mongoose.connection.on('disconnected', () => {
    dbState.isConnected = false;
    console.warn('MongoDB disconnected. Database-backed content changes are unavailable until it reconnects.');
  });
}
