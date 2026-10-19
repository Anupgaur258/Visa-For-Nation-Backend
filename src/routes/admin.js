import { Router } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import auth from '../middleware/auth.js';
import {
  verifyAdmin,
  getInquiries,
  updateInquiry,
  deleteInquiry,
  getAllPages,
  savePage,
  deletePage,
  getCMSContent,
  saveCMSSection,
  getAllSEO,
  saveSEO,
  deleteSEO,
  getAllPostsAdmin,
  savePost,
  deletePost,
  getAllBanners, saveBanner, deleteBanner,
  getAllReels, saveReel, deleteReel,
  getAllTestimonials, saveTestimonial, deleteTestimonial,
  getAllReviews, saveReview, deleteReview,
  getAllTeamImages, saveTeamImage, deleteTeamImage,
  getAllCareerJobs, saveCareerJob, deleteCareerJob,
  getAllCareerApplications, deleteCareerApplication,
} from '../services/storage.js';

const r = Router();
const wrap = fn => (req, res, next) => fn(req, res).catch(next);
const itemLimit = (name, fallback) => Math.max(0, Number(process.env[name] || fallback));
const awardSectionLimit = itemLimit('AWARD_SECTION_MAX_COUNT', 20);
const contentLimits = { posts: itemLimit('BLOG_MAX_COUNT', 30), banners: itemLimit('BANNER_MAX_COUNT', 20), reels: itemLimit('REEL_MAX_COUNT', 20), testimonials: itemLimit('TESTIMONIAL_MAX_COUNT', 20), reviews: itemLimit('REVIEW_MAX_COUNT', 20), teamImages: itemLimit('TEAM_IMAGE_MAX_COUNT', 20) };

// Ensure uploads directory exists
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads',
    filename: (_q, f, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(f.originalname).toLowerCase()),
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_q, f, cb) => cb(null, /^image\//.test(f.mimetype)),
});

/* ========================================================================== */
/*  AUTH                                                                      */
/* ========================================================================== */
r.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  
  const user = await verifyAdmin(email, password);
  if (!user) return res.status(401).json({ message: 'Invalid email or password' });

  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET || 'secret_vfn_jwt_key', { expiresIn: '7d' });
  res.json({ token, email: user.email });
}));

// Protect all routes below with auth middleware
r.use(auth);

/* ========================================================================== */
/*  STATS                                                                     */
/* ========================================================================== */
r.get('/stats', wrap(async (_q, res) => {
  const inquiries = await getInquiries();
  const pages = await getAllPages();
  const posts = await getAllPostsAdmin();
  const seo = await getAllSEO();

  const countsByCategory = inquiries.reduce((acc, i) => {
    const cat = i.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const newInquiries = inquiries.filter(i => i.status === 'new').length;

  res.json({
    totalInquiries: inquiries.length,
    newInquiries,
    countsByCategory,
    pages: pages.length,
    posts: posts.length,
    seo: seo.length,
  });
}));

/* ========================================================================== */
/*  TAB 1: FORM INQUIRIES                                                     */
/* ========================================================================== */
    r.get('/inquiries', wrap(async (req, res) => {
      const { category, country, status, q, page = 1, limit } = req.query;
      const result = await getInquiries({ category, country, status, q, page, limit });
      res.json(result);
    }));

r.put('/inquiries/:id', wrap(async (req, res) => {
  const updated = await updateInquiry(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Inquiry not found' });
  res.json(updated);
}));

r.delete('/inquiries/:id', wrap(async (req, res) => {
  await deleteInquiry(req.params.id);
  res.json({ ok: true });
}));

/* ========================================================================== */
/*  TAB 2: WEBSITE CMS & PAGES                                                */
/* ========================================================================== */
// Page CMS Content
r.get('/cms/:page', wrap(async (req, res) => {
  const data = await getCMSContent(req.params.page);
  res.json(data);
}));

r.post('/cms/:page/:section', wrap(async (req, res) => {
  if (req.params.page === 'awards' && Array.isArray(req.body.images) && req.body.images.length > awardSectionLimit) return res.status(400).json({ message: 'Each award section can contain up to ' + awardSectionLimit + ' images.' });
  const result = await saveCMSSection(req.params.page, req.params.section, req.body);
  res.json(result);
}));

// All 63 Pages
r.get('/pages', wrap(async (_req, res) => {
  res.json(await getAllPages());
}));

r.post('/pages', wrap(async (req, res) => {
  res.status(201).json(await savePage(req.body));
}));

r.put('/pages/:id', wrap(async (req, res) => {
  res.json(await savePage({ ...req.body, _id: req.params.id }));
}));

r.delete('/pages/:id', wrap(async (req, res) => {
  await deletePage(req.params.id);
  res.json({ ok: true });
}));

// Blog Posts
r.get('/posts', wrap(async (_req, res) => {
  res.json(await getAllPostsAdmin());
}));

r.post('/posts', wrap(async (req, res) => {
  if (!req.body._id && (await getAllPostsAdmin()).length >= contentLimits.posts) return res.status(400).json({ message: 'You can add up to ' + contentLimits.posts + ' blogs.' });
  res.status(201).json(await savePost(req.body));
}));

r.put('/posts/:id', wrap(async (req, res) => {
  res.json(await savePost({ ...req.body, _id: req.params.id }));
}));

r.delete('/posts/:id', wrap(async (req, res) => {
  await deletePost(req.params.id);
  res.json({ ok: true });
}));

// Image Upload (Multer)
r.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Image file required' });
  res.json({ path: `uploads/${req.file.filename}` });
});

/* ========================================================================== */
/*  TAB 3: SEO SECTION & VALIDATOR                                            */
/* ========================================================================== */
r.get('/seo', wrap(async (_req, res) => {
  res.json(await getAllSEO());
}));

r.post('/seo', wrap(async (req, res) => {
  const saved = await saveSEO(req.body);
  res.status(200).json(saved);
}));

r.delete('/seo/:id', wrap(async (req, res) => {
  await deleteSEO(req.params.id);
  res.json({ ok: true });
}));

// SEO Metadata Validator
r.post('/seo/validate', wrap(async (req, res) => {
  const { metaTitle, metaDescription } = req.body;
  const errors = [];
  const warnings = [];

  // Title validation
  if (metaTitle) {
    if (metaTitle.length > 60) warnings.push(`Meta Title is ${metaTitle.length} characters (recommended: 50-60 characters).`);
    if (metaTitle.length < 30) warnings.push('Meta Title is relatively short (recommend at least 30 characters).');
  }

  // Description validation
  if (metaDescription) {
    if (metaDescription.length > 160) warnings.push(`Meta Description is ${metaDescription.length} characters (recommended: 140-160 characters).`);
    if (metaDescription.length < 70) warnings.push('Meta Description is relatively short (recommend at least 70 characters).');
  }

  res.json({
    isValid: errors.length === 0,
    errors,
    warnings,
  });
}));


/* ========================================================================== */
/*  TAB 4: CAREER & CONTENT MANAGEMENT                                        */
/* ========================================================================== */
// Banners
r.get('/banner', wrap(async (_req, res) => {
  res.json(await getAllBanners());
}));
r.post('/banner', wrap(async (req, res) => {
  if (!req.body._id && (await getAllBanners()).length >= contentLimits.banners) return res.status(400).json({ message: 'Banner limit reached (' + contentLimits.banners + ').' });
  res.json(await saveBanner(req.body));
}));
r.delete('/banner/:id', wrap(async (req, res) => {
  await deleteBanner(req.params.id);
  res.json({ ok: true });
}));

// Reels
r.get('/reel', wrap(async (_req, res) => {
  res.json(await getAllReels());
}));
r.post('/reel', wrap(async (req, res) => {
  if (!req.body._id && (await getAllReels()).length >= contentLimits.reels) return res.status(400).json({ message: 'Reel limit reached (' + contentLimits.reels + ').' });
  res.json(await saveReel(req.body));
}));
r.delete('/reel/:id', wrap(async (req, res) => {
  await deleteReel(req.params.id);
  res.json({ ok: true });
}));

// Testimonials
r.get('/testimonial', wrap(async (_req, res) => {
  res.json(await getAllTestimonials());
}));
r.post('/testimonial', wrap(async (req, res) => {
  if (!req.body._id && (await getAllTestimonials()).length >= contentLimits.testimonials) return res.status(400).json({ message: 'Testimonial limit reached (' + contentLimits.testimonials + ').' });
  res.json(await saveTestimonial(req.body));
}));
r.delete('/testimonial/:id', wrap(async (req, res) => {
  await deleteTestimonial(req.params.id);
  res.json({ ok: true });
}));

// Reviews
r.get('/review', wrap(async (_req, res) => {
  res.json(await getAllReviews());
}));
r.post('/review', wrap(async (req, res) => {
  if (!req.body._id && (await getAllReviews()).length >= contentLimits.reviews) return res.status(400).json({ message: 'Review limit reached (' + contentLimits.reviews + ').' });
  res.json(await saveReview(req.body));
}));
r.delete('/review/:id', wrap(async (req, res) => {
  await deleteReview(req.params.id);
  res.json({ ok: true });
}));

// Team Images
r.get('/team-image', wrap(async (_req, res) => {
  res.json(await getAllTeamImages());
}));
r.post('/team-image', wrap(async (req, res) => {
  if (!req.body._id && (await getAllTeamImages()).length >= contentLimits.teamImages) return res.status(400).json({ message: 'Team image limit reached (' + contentLimits.teamImages + ').' });
  res.json(await saveTeamImage(req.body));
}));
r.delete('/team-image/:id', wrap(async (req, res) => {
  await deleteTeamImage(req.params.id);
  res.json({ ok: true });
}));

// Career Jobs
r.get('/career/job', wrap(async (_req, res) => {
  res.json(await getAllCareerJobs());
}));
r.post('/career/job', wrap(async (req, res) => {
  res.json(await saveCareerJob(req.body));
}));
r.put('/career/job/:id', wrap(async (req, res) => {
  res.json(await saveCareerJob({ ...req.body, _id: req.params.id }));
}));
r.delete('/career/job/:id', wrap(async (req, res) => {
  await deleteCareerJob(req.params.id);
  res.json({ ok: true });
}));

// Career Applications
r.get('/career/application', wrap(async (_req, res) => {
  res.json(await getAllCareerApplications());
}));
r.post('/career/application', wrap(async (req, res) => {
  res.json(await saveCareerApplication(req.body));
}));
r.delete('/career/application/:id', wrap(async (req, res) => {
  await deleteCareerApplication(req.params.id);
  res.json({ ok: true });
}));
export default r;

