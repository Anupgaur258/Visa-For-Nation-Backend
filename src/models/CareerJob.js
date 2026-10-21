import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const opts = { timestamps: true };

export const CareerJob = model('CareerJob', new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  experience: String, // e.g., "2-5 years"
  position: String, // e.g., "Software Engineer"
  department: String,
  role: String, // e.g., "Full-time"
  location: String,
  salary: String,
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, opts));
