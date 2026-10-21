import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const opts = { timestamps: true };

export const CareerApplication = model('CareerApplication', new Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerJob' },
  applicationType: { type: String, enum: ['job', 'general'], default: 'job' },
  applicantName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  currentCtc: { type: String, maxlength: 60 },
  resumeUrl: String, // URL to uploaded resume
  coverLetter: String,
  status: { type: String, enum: ["received", "shortlisted", "contacted", "interviewed", "not selected"], default: "received" },
  appliedAt: { type: Date, default: Date.now },
}, opts));
