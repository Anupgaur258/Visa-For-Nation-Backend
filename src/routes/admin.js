import { Router } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import auth from '../middleware/auth.js';
import {
  verifyAdmin,
  getInquiries,
  getInquiryStats,
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
  getAllPodcastsAdmin, savePodcast, deletePodcast,
  getChatAvailability, setChatAvailability, getChatSessions, getChatSession, saveChatSession, claimChatSession, releaseChatSession, markChatMessagesRead,
} from '../services/storage.js';

const r = Router();
const wrap = fn => (req, res, next) => fn(req, res).catch(next);
const itemLimit = (name, fallback) => Math.max(0, Number(process.env[name] || fallback));
const configuredPodcastLimit = Number(process.env.PODCAST_MAX_COUNT || 20);
const configuredBannerLimit = Number(process.env.BANNER_MAX_COUNT || 5);
const awardSectionLimit = itemLimit('AWARD_SECTION_MAX_COUNT', 20);
const galleryImageLimit = itemLimit('GALLERY_MAX_COUNT', itemLimit('MAX_GALLERY_IMAGES_PER_SECTION', 50));
const imageUploadMaxSizeMb = Math.max(1, Number(process.env.IMAGE_UPLOAD_MAX_SIZE_MB) || 10);
const contentLimits = { posts: itemLimit('BLOG_MAX_COUNT', 30), news: itemLimit('NEWS_MAX_COUNT', 30), podcasts: Number.isFinite(configuredPodcastLimit) ? Math.max(0, Math.floor(configuredPodcastLimit)) : 20, banners: Number.isFinite(configuredBannerLimit) ? Math.min(5, Math.max(0, Math.floor(configuredBannerLimit))) : 5, reels: itemLimit('REEL_MAX_COUNT', 20), testimonials: itemLimit('TESTIMONIAL_MAX_COUNT', 20), reviews: itemLimit('REVIEW_MAX_COUNT', 20), teamImages: itemLimit('TEAM_IMAGE_MAX_COUNT', 20) };
const isYouTubeVideoUrl = value => {
  try {
    const parsed = new URL(String(value || '').trim());
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    let id = '';
    if (host === 'youtu.be') id = parsed.pathname.split('/').filter(Boolean)[0] || '';
    else if (['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) id = parsed.searchParams.get('v') || parsed.pathname.match(/\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1] || '';
    return /^[A-Za-z0-9_-]{11}$/.test(id);
  } catch { return false; }
};
const isInstagramReelUrl = value => {
  try {
    const parsed = new URL(String(value || '').trim());
    return ['instagram.com', 'www.instagram.com', 'm.instagram.com'].includes(parsed.hostname.toLowerCase()) && /^\/reel\/[^/]+\/?$/i.test(parsed.pathname);
  } catch { return false; }
};

const uploadsDir = path.resolve('uploads');
const uploadCategories = new Set(['banner', 'blogs', 'news', 'team', 'goals', 'awards', 'gallery', 'general', 'podcast-thumbnails']);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const category = String(req.body.category || 'general').toLowerCase();
      if (!uploadCategories.has(category)) return cb(new Error('Invalid upload category.'));
      const categoryDir = path.join(uploadsDir, category);
      fs.mkdir(categoryDir, { recursive: true }, error => cb(error, categoryDir));
    },
    filename: (_q, f, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(f.originalname).toLowerCase()),
  }),
  limits: { fileSize: imageUploadMaxSizeMb * 1024 * 1024 },
  fileFilter: (_q, f, cb) => cb(null, /^image\//.test(f.mimetype)),
});
const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const categoryDir = path.join(uploadsDir, 'testimonials');
      fs.mkdir(categoryDir, { recursive: true }, error => cb(error, categoryDir));
    },
    filename: (_req, file, cb) => cb(null, `video-${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: Math.max(1, Number(process.env.TESTIMONIAL_MAX_SIZE_MB || 1)) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^video\/(mp4|webm|quicktime)$/.test(file.mimetype)),
});
const reelVideoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const categoryDir = path.join(uploadsDir, 'reels');
      fs.mkdir(categoryDir, { recursive: true }, error => cb(error, categoryDir));
    },
    filename: (_req, file, cb) => cb(null, `reel-${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: Math.max(1, Number(process.env.REEL_MAX_SIZE_MB || 1)) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^video\/(mp4|webm|quicktime)$/.test(file.mimetype)),
});
const uploadedVideoResponse = (category, durationEnv) => async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Choose an MP4, WebM, or MOV video.' });
  const maxDuration = Number(process.env[durationEnv]);
  const duration = Number(req.body.durationSeconds);
  const discardUpload = async () => { await fs.promises.unlink(req.file.path).catch(() => {}); };
  if (!Number.isFinite(maxDuration) || maxDuration <= 0) {
    await discardUpload();
    return res.status(503).json({ message: `${durationEnv} is not configured on the server.` });
  }
  if (!Number.isFinite(duration) || duration <= 0 || duration > maxDuration) {
    await discardUpload();
    return res.status(400).json({ message: `Video duration must be ${maxDuration} seconds or shorter.` });
  }
  res.json({ path: `/uploads/${category}/${req.file.filename}` });
};

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

r.get('/chatbot/status', wrap(async (_req, res) => res.json(await getChatAvailability())));
r.put('/chatbot/status', wrap(async (req, res) => res.json(await setChatAvailability(req.body?.online === true))));
r.get('/chatbot/sessions', wrap(async (_req, res) => res.json(await getChatSessions())));
r.post('/chatbot/sessions/:visitorId/read', wrap(async (req, res) => {
  if (!/^[a-zA-Z0-9-]{20,80}$/.test(req.params.visitorId)) return res.status(400).json({ message: 'Invalid chat session.' });
  await markChatMessagesRead(req.params.visitorId, 'user');
  res.json({ ok: true });
}));
r.post('/chatbot/sessions/:visitorId/messages', wrap(async (req, res) => {
  const cleanText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!/^[a-zA-Z0-9-]{20,80}$/.test(req.params.visitorId) || !cleanText || cleanText.length > 1000) return res.status(400).json({ message: 'Enter a message up to 1000 characters.' });
  const existing = await getChatSession(req.params.visitorId);
  if (!existing) return res.status(404).json({ message: 'Chat session not found.' });
  const status = await getChatAvailability();
  if (status.activeVisitorId !== req.params.visitorId) return res.status(409).json({ message: 'This conversation is no longer active. Select the current visitor.' });
  const messages = [...(existing.messages || []), { role: 'admin', text: cleanText, at: new Date().toISOString() }].slice(-200);
  const saved = await saveChatSession({ ...existing, messages });
  await claimChatSession(req.params.visitorId);
  res.json(saved);
}));
r.post('/chatbot/sessions/:visitorId/end', wrap(async (req, res) => {
  const ended = await releaseChatSession(req.params.visitorId);
  if (!ended) return res.status(409).json({ message: 'This is not the active conversation.' });
  res.json({ ok: true });
}));

/* ========================================================================== */
/*  STATS                                                                     */
/* ========================================================================== */
r.get('/stats', wrap(async (_q, res) => {
  const [inquiryStats, pages, posts, seo] = await Promise.all([
    getInquiryStats(),
    getAllPages(),
    getAllPostsAdmin(),
    getAllSEO(),
  ]);

  res.json({
    ...inquiryStats,
    pages: pages.length,
    posts: posts.length,
    seo: seo.length,
  });
}));

r.get('/inquiries', wrap(async (req, res) => {
      const { category, country, status, q, page = 1, limit, dateFrom, dateTo } = req.query;
      const isDate = value => { if (!value) return true; if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const date = new Date(`${value}T00:00:00.000Z`); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; };
      if (!isDate(dateFrom) || !isDate(dateTo) || (dateFrom && dateTo && dateFrom > dateTo)) return res.status(400).json({ message: 'Choose a valid date range.' });
      const result = await getInquiries({ category, country, status, q, page, limit, dateFrom, dateTo });
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
  if (req.params.page === 'gallery' && Array.isArray(req.body.images) && req.body.images.length > galleryImageLimit) return res.status(400).json({ message: 'Gallery supports up to ' + galleryImageLimit + ' images.' });
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

r.get('/news', wrap(async (_req, res) => {
  res.json(await getAllPostsAdmin('news'));
}));

r.post('/news', wrap(async (req, res) => {
  if (!req.body._id && (await getAllPostsAdmin('news')).length >= contentLimits.news) return res.status(400).json({ message: 'You can add up to ' + contentLimits.news + ' news articles.' });
  res.status(201).json(await savePost(req.body, 'news'));
}));

r.put('/news/:id', wrap(async (req, res) => {
  res.json(await savePost({ ...req.body, _id: req.params.id }, 'news'));
}));

r.delete('/news/:id', wrap(async (req, res) => {
  await deletePost(req.params.id, 'news');
  res.json({ ok: true });
}));

r.get('/podcasts', wrap(async (_req, res) => { res.json(await getAllPodcastsAdmin()); }));
r.post('/podcasts', wrap(async (req, res) => {
  if ((await getAllPodcastsAdmin()).length >= contentLimits.podcasts) return res.status(400).json({ message: 'You can add up to ' + contentLimits.podcasts + ' podcasts.' });
  res.status(201).json(await savePodcast(req.body));
}));
r.put('/podcasts/:id', wrap(async (req, res) => { res.json(await savePodcast({ ...req.body, _id: req.params.id })); }));
r.delete('/podcasts/:id', wrap(async (req, res) => { await deletePodcast(req.params.id); res.json({ ok: true }); }));

// Image Upload (Multer)
r.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Image file required' });
  const category = String(req.body.category || 'general').toLowerCase();
  res.json({ path: `uploads/${category}/${req.file.filename}` });
});

// Admin uploaded testimonial videos
r.post('/upload-video', videoUpload.single('file'), uploadedVideoResponse('testimonials', 'TESTIMONIAL_MAX_DURATION_SECONDS'));
r.post('/upload-reel-video', reelVideoUpload.single('file'), uploadedVideoResponse('reels', 'REEL_MAX_DURATION_SECONDS'));

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
  const saved = await saveBanner(req.body);
  if (!saved) return res.status(503).json({ message: 'Could not save the banner. Check the database connection and try again.' });
  res.json(saved);
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
  const urls = Array.isArray(req.body.urls) ? req.body.urls.map(url => String(url || '').trim()).filter(Boolean) : [];
  if (urls.length !== 1 || (!isInstagramReelUrl(urls[0]) && !/^\/uploads\/reels\/[^/]+$/.test(urls[0]))) return res.status(400).json({ message: 'Add one Instagram Reel link or upload one reel video.' });
  if (!req.body._id && (await getAllReels()).length >= contentLimits.reels) return res.status(400).json({ message: 'Reel limit reached (' + contentLimits.reels + ').' });
  res.json(await saveReel({ ...req.body, urls }));
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
  const videoUrl = String(req.body.videoUrl || '').trim();
  if (!isYouTubeVideoUrl(videoUrl) && !/^\/uploads\/testimonials\/[^/]+$/.test(videoUrl)) return res.status(400).json({ message: 'Use a YouTube video link or upload a testimonial video.' });
  if (!req.body._id && (await getAllTestimonials()).length >= contentLimits.testimonials) return res.status(400).json({ message: 'Testimonial limit reached (' + contentLimits.testimonials + ').' });
  res.json(await saveTestimonial({ ...req.body, videoUrl }));
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
