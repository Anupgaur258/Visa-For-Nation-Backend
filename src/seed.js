import 'dotenv/config';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import connectDB, { dbState } from './config/db.js';
import { Admin, Page, Post, CMSContent, SEOMetadata, Inquiry } from './models/index.js';

const read = p => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), 'utf8'));
await connectDB();

if (!dbState.isConnected) {
  console.log('MongoDB not connected. Local JSON files in backend/data/ are already up to date.');
  process.exit(0);
}

const pages = read('../data/pages.json');
const posts = read('../data/posts.json');
const cms = read('../data/cms.json');
const seo = read('../data/seo.json');
const inquiries = read('../data/inquiries.json');

await Page.deleteMany({});
await Page.insertMany(pages);

await Post.deleteMany({});
await Post.insertMany(posts);

await CMSContent.deleteMany({});
for (const [page, sections] of Object.entries(cms)) {
  for (const [section, data] of Object.entries(sections)) {
    await CMSContent.create({ page, section, data });
  }
}

await SEOMetadata.deleteMany({});
await SEOMetadata.insertMany(seo);

await Inquiry.deleteMany({});
await Inquiry.insertMany(inquiries);

const email = (process.env.ADMIN_EMAIL || 'admin@visafornation.com').toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
await Admin.findOneAndUpdate({ email }, { email, password: await bcrypt.hash(password, 10) }, { upsert: true });

console.log(`✅ MongoDB Seeded Successfully!`);
console.log(`- ${pages.length} Pages`);
console.log(`- ${posts.length} Posts`);
console.log(`- CMS Content for Home, About, Contact`);
console.log(`- ${seo.length} SEO Configs`);
console.log(`- ${inquiries.length} Inquiries`);
console.log(`- Admin: ${email}`);

process.exit(0);
