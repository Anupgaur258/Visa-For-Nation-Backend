import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getPage, getAllPages, getCMSContent, getSEO, getPosts, getPostBySlug, createInquiry, saveCMSSection, getAllCareerJobs, saveCareerApplication, getAllTestimonials, likeTestimonial, getAllBanners, getAllReels, getAllReviews, getAllTeamImages, getCareerApplicationCount } from '../services/storage.js';
import emailService from '../services/emailService.js';

const r = Router();
const wrap = fn => (req, res, next) => fn(req, res).catch(next);
const careerApplicationLocks = new Map();
const getCareerApplicationLimit = () => { const value = Number(process.env.MAX_CAREER_APPLICATIONS_PER_JOB || 50); return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 50; };
const withCareerApplicationLock = async (key, task) => {
  const previous = careerApplicationLocks.get(String(key)) || Promise.resolve();
  let release;
  const current = new Promise(resolve => { release = resolve; });
  careerApplicationLocks.set(String(key), current);
  await previous;
  try { return await task(); }
  finally { release(); if (careerApplicationLocks.get(String(key)) === current) careerApplicationLocks.delete(String(key)); }
};


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


// Public homepage and about page CMS collections
r.get('/banners', wrap(async (_req, res) => res.json(await getAllBanners())));
r.get('/reels', wrap(async (_req, res) => res.json(await getAllReels())));
r.get('/reviews', wrap(async (_req, res) => res.json(await getAllReviews())));
r.get('/team-images', wrap(async (_req, res) => res.json(await getAllTeamImages())));

// Public client testimonials and persisted likes
r.get('/testimonials', wrap(async (_req, res) => {
  res.json(await getAllTestimonials());
}));
r.post('/testimonials/:id/like', wrap(async (req, res) => {
  const testimonial = await likeTestimonial(req.params.id);
  if (!testimonial) return res.status(404).json({ message: 'Testimonial not found.' });
  res.json({ id: testimonial._id, likes: testimonial.likes });
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
  const limit = getCareerApplicationLimit();
  const jobs = (await getAllCareerJobs()).filter(job => job.status === 'open');
  res.json(await Promise.all(jobs.map(async job => {
    const applicationCount = await getCareerApplicationCount(job._id);
    return { ...(job.toObject ? job.toObject() : job), applicationCount, applicationLimit: limit, applicationsFull: applicationCount >= limit };
  })));
}));
r.post('/career/apply', resumeUpload.single('resume'), wrap(async (req, res) => {
  const { job, applicantName, email, phone, currentCtc, coverLetter } = req.body;
  const discardResume = () => { if (req.file) fs.unlink(req.file.path, () => {}); };
  if (!job || !applicantName?.trim() || !email?.trim() || !currentCtc?.trim() || !req.file) { discardResume(); return res.status(400).json({ message: 'Job, name, email, current CTC, and resume are required.' }); }
  if (applicantName.trim().length < 2 || applicantName.length > 100) { discardResume(); return res.status(400).json({ message: 'Please enter a name between 2 and 100 characters.' }); }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { discardResume(); return res.status(400).json({ message: 'Please enter a valid email address.' }); }
  if (!phone?.trim() || !/^[+0-9() .-]{7,24}$/.test(phone)) { discardResume(); return res.status(400).json({ message: 'Please enter a valid phone number.' }); }
  if (String(currentCtc).length > 60) { discardResume(); return res.status(400).json({ message: 'Current CTC must be 60 characters or fewer.' }); }
  if (String(coverLetter || '').length > 2000) { discardResume(); return res.status(400).json({ message: 'Cover note must be 2,000 characters or fewer.' }); }
  const openJob = (await getAllCareerJobs()).find(item => String(item._id) === String(job) && item.status === 'open');
  if (!openJob) { discardResume(); return res.status(404).json({ message: 'This position is no longer open.' }); }
  const limit = getCareerApplicationLimit();
  return withCareerApplicationLock(job, async () => {
    const applicationCount = await getCareerApplicationCount(job);
    if (applicationCount >= limit) {
      discardResume();
      return res.status(409).json({ message: 'Applications are full for this position. Thank you for your interest.' });
    }
    const application = await saveCareerApplication({ job, applicantName: applicantName.trim(), email: email.trim(), phone, currentCtc: String(currentCtc).trim(), coverLetter, resumeUrl: `/uploads/${req.file.filename}` });
    if (!application) { discardResume(); return res.status(503).json({ message: 'Applications are temporarily unavailable.' }); }
    return res.status(201).json({ ok: true, id: application._id, applicationCount: applicationCount + 1, applicationLimit: limit });
  });
}));
export default r;
