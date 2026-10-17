import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const opts = { timestamps: true };

export const Page = model('Page', new Schema({
  category: String,
  subCategory: String,
  slug: String,
  fullUrl: { type: String, required: true, unique: true },
  bannerImage: String,
  heroBadge: String,
  heroTitle: { type: String, required: true },
  heroDesc: String,
  content: String,
  faqs: [{ q: String, a: String }],
  metaTitle: String,
  metaDescription: String,
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
}, opts));

export const Post = model('Post', new Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  image: String,
  content: String,
  category: String,
  subCategory: String,
  metaTitle: String,
  metaDescription: String,
  views: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
}, opts));

export const Inquiry = model('Inquiry', new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  category: { type: String, default: 'General' },
  country: { type: String, default: '' },
  visaType: { type: String, default: '' },
  ageGroup: String,
  qualification: String,
  experience: String,
  languageScore: String,
  travelDate: String,
  intake: String,
  serviceNeeded: String,
  details: Schema.Types.Mixed,
  message: String,
  sourcePage: String,
  status: { type: String, enum: ['new', 'contacted', 'in_progress', 'closed'], default: 'new' },
  notes: String,
}, opts));

export const CMSContent = model('CMSContent', new Schema({
  page: { type: String, required: true }, // 'home', 'about', 'contact', etc.
  section: { type: String, required: true }, // 'hero', 'banners', 'why_us', etc.
  data: { type: Schema.Types.Mixed, default: {} },
}, opts));

export const SEOMetadata = model('SEOMetadata', new Schema({
  pageUrl: { type: String, required: true, unique: true },
  metaTitle: String,
  metaDescription: String,
  keywords: String,
  canonicalUrl: String,
  ogTitle: String,
  ogDescription: String,
  ogImage: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, opts));

export const Admin = model('Admin', new Schema({
  email: { type: String, unique: true },
  password: String,
}, opts));

export { Banner } from './Banner.js';
export { Reel } from './Reel.js';
export { Testimonial } from './Testimonial.js';
export { Review } from './Review.js';
export { TeamImage } from './TeamImage.js';
export { CareerJob } from './CareerJob.js';
export { CareerApplication } from './CareerApplication.js';
