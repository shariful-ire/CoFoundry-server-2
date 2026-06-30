import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail:       { type: String, required: true, lowercase: true },
  stripeSessionId: { type: String, required: true, unique: true },
  plan:            { type: String, enum: ['monthly', 'annual'], required: true },
  amount:          { type: Number, required: true }, // in cents
  status:          { type: String, enum: ['paid', 'pending', 'failed'], default: 'pending' },
  paidAt:          { type: Date },
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
