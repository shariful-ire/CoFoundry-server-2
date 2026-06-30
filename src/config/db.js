import mongoose from 'mongoose';

let cached = global._mongoConn ?? (global._mongoConn = { conn: null, promise: null });

export default async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI).then(m => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    console.error('MongoDB connection error:', err.message);
    throw err;
  }

  return cached.conn;
}
