import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const opts = { timestamps: true };

export const Review = model('Review', new Schema({
  name: { type: String, required: true },
  message: { type: String, required: true, maxlength: Math.max(1, Number(process.env.REVIEW_MAX_MESSAGE_CHARS || 500)) },
  rating: { type: Number, required: true, min: 1, max: 5 },
}, opts));
