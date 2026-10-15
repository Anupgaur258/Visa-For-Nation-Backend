import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getPage, getAllPages, getCMSContent, getSEO, getPosts, getPostBySlug, createInquiry, saveCMSSection, getAllCareerJobs, saveCareerApplication } from '../services/storage.js';
import emailService from '../services/emailService.js';

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

// Update a section of CMS content for a page
r.put('/cms/:page', wrap(async (req, res) => {
  const { page } = req.params;
  const { sectionName, data } = req.body;
  if (!sectionName) return res.status(400).json({ message: 'sectionName is required' });
  await saveCMSSection(page, sectionName, data);
  res.json({ ok: true });
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

  await emailService.sendInquiryNotification(created);

  res.status(201).json({ ok: true, id: created._id });
}));


// Public career listings and candidate applications
const careerUploadDir = path.resolve('uploads');
if (!fs.existsSync(careerUploadDir)) fs.mkdirSync(careerUploadDir, { recursive: true });
const resumeLimit = Math.max(1, Number(process.env.CAREER_RESUME_MAX_MB || 5)) * 1024 * 1024;
const resumeUpload = multer({
  storage: multer.diskStorage({
    destination: careerUploadDir,
    filename: (_req, file, cb) => cb(null, `resume-${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: resumeLimit },
  fileFilter: (_req, file, cb) => cb(null, /^(application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/msword)$/.test(file.mimetype)),
});
r.get('/career/jobs', wrap(async (_req, res) => {
  res.json((await getAllCareerJobs()).filter(job => job.status === 'open'));
}));
r.post('/career/apply', resumeUpload.single('resume'), wrap(async (req, res) => {
  const { job, applicantName, email, phone, coverLetter } = req.body;
  if (!job || !applicantName || !email || !req.file) return res.status(400).json({ message: 'Job, name, email, and resume are required.' });
  const application = await saveCareerApplication({ job, applicantName, email, phone, coverLetter, resumeUrl: `/uploads/${req.file.filename}` });
  if (!application) return res.status(503).json({ message: 'Applications are temporarily unavailable.' });
  res.status(201).json({ ok: true, id: application._id });
}));
export default r;
