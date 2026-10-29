import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const opts = { timestamps: true };

export const Banner = model('Banner', new Schema({
  imageUrl: { type: String, required: true },
  overlayText: { type: String, trim: true, maxlength: 120, default: '' },
  eyebrow: { type: String, trim: true, maxlength: 60, default: 'VISA FOR NATION' },
  title: { type: String, trim: true, maxlength: 120, default: '' },
  accentText: { type: String, trim: true, maxlength: 60, default: '' },
  description: { type: String, trim: true, maxlength: 240, default: '' },
  altText: String,
  linkUrl: String,
  displayOrder: { type: Number, default: 0 },
}, opts));
