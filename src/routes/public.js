import { Router } from 'express';
import { getPage, getAllPages, getCMSContent, getSEO, getPosts, getPostBySlug, createInquiry } from '../services/storage.js';

const r = Router();
const wrap = fn => (req, res, next) => fn(req, res).catch(next);

// Fetch a single page by fullUrl
r.get('/pages', wrap(async (req, res) => {
  const url = String(req.query.url || '').replace(/^\/+|\/+$/g, '');
  const page = await getPage(url);
  if (!page) return res.status(404).json({ message: 'Page not found' });
  res.json(page);
}));

// Fetch all pages
r.get('/pages-all', wrap(async (_req, res) => {
  res.json(await getAllPages());
}));

// Fetch CMS content for a page (home, about, contact)
r.get('/cms/:page', wrap(async (req, res) => {
  const data = await getCMSContent(req.params.page);
  res.json(data);
}));

// Fetch SEO metadata for a page
r.get('/seo', wrap(async (req, res) => {
  const url = String(req.query.url || '/');
  const seo = await getSEO(url);
  res.json(seo || {});
}));

// Blog Posts
r.get('/posts', wrap(async (req, res) => {
  res.json(await getPosts(req.query.category));
}));

r.get('/posts/:slug', wrap(async (req, res) => {
  const result = await getPostBySlug(req.params.slug);
  if (!result) return res.status(404).json({ message: 'Post not found' });
  res.json(result);
}));

// Inquiries submission
r.post('/inquiries', wrap(async (req, res) => {
  const { name, phone, email, category, country, visaType, ageGroup, qualification, experience, languageScore, travelDate, intake, serviceNeeded, details, message, sourcePage } = req.body;
  if (!name || !phone) return res.status(400).json({ message: 'Name and phone are required' });
  
  const created = await createInquiry({
    name,
    phone,
    email: email || '',
    category: category || 'General',
    country: country || '',
    visaType: visaType || '',
    ageGroup: ageGroup || '',
    qualification: qualification || '',
    experience: experience || '',
    languageScore: languageScore || '',
    travelDate: travelDate || '',
    intake: intake || '',
    serviceNeeded: serviceNeeded || '',
    details: details || {},
    message: message || '',
    sourcePage: sourcePage || '',
  });

  res.status(201).json({ ok: true, id: created._id });
}));

export default r;
