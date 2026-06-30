import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String },
  role:         { type: String, enum: ['founder', 'collaborator', 'admin'], default: 'collaborator' },
  image:        { type: String, default: null },
  isPremium:    { type: Boolean, default: false },
  isBlocked:    { type: Boolean, default: false },
  bio:          { type: String, maxlength: 300 },
  skills:       [{ type: String }],
  googleId:     { type: String, default: null },
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (_doc, ret) => { delete ret.passwordHash; return ret; },
});

export default mongoose.model('User', userSchema);
