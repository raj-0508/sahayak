import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sahayak_db';

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}
export default connectDB;
