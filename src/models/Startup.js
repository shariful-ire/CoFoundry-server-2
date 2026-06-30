import mongoose from 'mongoose';

const startupSchema = new mongoose.Schema({
  startupName:  { type: String, required: true, trim: true, minlength: 2 },
  founderEmail: { type: String, required: true, lowercase: true },  // set server-side from session
  founderId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  industry:     { type: String, required: true },
  fundingStage: { type: String, enum: ['Bootstrapped', 'Pre-Seed', 'Seed', 'Series A', 'Series B+'], required: true },
  description:  { type: String, required: true, minlength: 50 },
  status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model('Startup', startupSchema);
