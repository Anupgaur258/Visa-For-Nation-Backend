import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const opts = { timestamps: true };

export const TeamImage = model('TeamImage', new Schema({
  imageUrl: { type: String, required: true },
  altText: String,
}, opts));
