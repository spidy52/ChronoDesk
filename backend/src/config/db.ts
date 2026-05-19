import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/chrono';
    await mongoose.connect(uri);
    console.log('MongoDB Connected via Mongoose');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
