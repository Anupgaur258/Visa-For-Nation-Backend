import mongoose from 'mongoose';

export const dbState = { isConnected: false };
let retryTimer = null;
let retryAttempt = 0;
let listenersAttached = false;

const retryDelay = () => Math.min(30000, 1000 * (2 ** Math.min(retryAttempt++, 5)));
const scheduleReconnect = () => {
  if (retryTimer || mongoose.connection.readyState === 1) return;
  const delay = retryDelay();
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connectDB();
  }, delay);
  retryTimer.unref?.();
};

export default async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    dbState.isConnected = true;
    return true;
  }
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/visafornation';
  mongoose.set('strictQuery', false);
  if (!listenersAttached) {
    listenersAttached = true;
    mongoose.connection.on('connected', () => {
      dbState.isConnected = true;
      retryAttempt = 0;
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
      console.log('MongoDB connected successfully.');
    });
    mongoose.connection.on('disconnected', () => {
      dbState.isConnected = false;
      console.warn('MongoDB disconnected. Retrying connection automatically.');
      scheduleReconnect();
    });
    mongoose.connection.on('error', error => {
      dbState.isConnected = false;
      console.warn(`MongoDB connection error (${error.name || 'unknown'}).`);
    });
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    dbState.isConnected = true;
    retryAttempt = 0;
    return true;
  } catch (error) {
    dbState.isConnected = false;
    console.warn(`MongoDB connection unavailable (${error.name || 'connection error'}); will retry automatically.`);
    scheduleReconnect();
    return false;
  }
}