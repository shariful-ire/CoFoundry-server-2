import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  opportunityId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
  startupId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Startup',     required: true },
  applicantId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',        required: true },
  applicantEmail:    { type: String, required: true, lowercase: true }, // set server-side from session — never from body
  portfolioLink:     { type: String, required: true, trim: true },
  motivationMessage: { type: String, required: true, minlength: 20 },
  status:            { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
}, { timestamps: true });

// One application per collaborator per opportunity
applicationSchema.index({ opportunityId: 1, applicantId: 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema);
