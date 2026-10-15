import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const opts = { timestamps: true };

export const Reel = model('Reel', new Schema({
  urls: [{ type: String, required: true }], // array of Instagram reel URLs
  displayOrder: { type: Number, default: 0 },
}, opts));
