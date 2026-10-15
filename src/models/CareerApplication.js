import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const opts = { timestamps: true };

export const CareerApplication = model('CareerApplication', new Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerJob', required: true },
  applicantName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  resumeUrl: String, // URL to uploaded resume
  coverLetter: String,
  appliedAt: { type: Date, default: Date.now },
}, opts));
