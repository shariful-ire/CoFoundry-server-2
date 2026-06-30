import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema({
  startupId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Startup', required: true },
  founderEmail:    { type: String, required: true, lowercase: true }, // set server-side from session
  roleTitle:       { type: String, required: true, trim: true, minlength: 3 },
  requiredSkills:  [{ type: String }],
  workType:        { type: String, enum: ['Remote', 'Hybrid', 'On-site'], required: true },
  commitmentLevel: { type: String, enum: ['Full-time', 'Part-time'], required: true },
  deadline:        { type: Date, required: true },
  applicantCount:  { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Opportunity', opportunitySchema);
