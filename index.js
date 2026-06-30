import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/db.js';

connectDB();

export default app;
