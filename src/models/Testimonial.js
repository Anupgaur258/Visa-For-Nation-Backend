import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const opts = { timestamps: true };

export const Testimonial = model('Testimonial', new Schema({
  videoUrl: { type: String, required: true },
  title: String,
  description: String,
}, opts));
