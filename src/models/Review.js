import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const opts = { timestamps: true };

export const Review = model('Review', new Schema({
  name: { type: String, required: true },
  message: { type: String, required: true, maxlength: Math.min(300, Number(process.env.REVIEW_MAX_MESSAGE_CHARS || 300)) },
  rating: { type: Number, required: true, min: 1, max: 5 },
}, opts));
