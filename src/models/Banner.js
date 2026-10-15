import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const opts = { timestamps: true };

export const Banner = model('Banner', new Schema({
  imageUrl: { type: String, required: true },
  altText: String,
  linkUrl: String,
  displayOrder: { type: Number, default: 0 },
}, opts));
