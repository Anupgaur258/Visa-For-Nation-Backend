import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const opts = { timestamps: true };

export const Review = model('Review', new Schema({
  name: { type: String, required: true },
  message: { type: String, required: true, maxlength: Number(process.env.REVIEW_MAX_MESSAGE_CHARS || 200) },
  rating: { type: Number, required: true, min: 1, max: 5 },
}, opts));
