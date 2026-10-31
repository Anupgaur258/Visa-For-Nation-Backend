import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { dbState } from '../config/db.js';
import { Page, Post, Inquiry, ChatSession, ChatbotState, CMSContent, SEOMetadata, Admin, Banner, Reel, Testimonial, Review, TeamImage, CareerJob, CareerApplication, Podcast } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const readJSON = (filename, defaultVal = []) => {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error(`Error reading ${filename}:`, e.message);
  }
  return defaultVal;
};

const requireMongoForContent = () => {
  if (!dbState.isConnected) throw Object.assign(new Error('MongoDB is not connected. Data was not saved. Please try again when the database is available.'), { status: 503 });
};

/* ========================================================================== */
/*  PAGES                                                                     */
/* ========================================================================== */
export async function getPage(fullUrl) {
  const cleanUrl = String(fullUrl || '').replace(/^\/+|\/+$/g, '');
  if (dbState.isConnected) {
    return Page.findOne({ fullUrl: cleanUrl, status: 'published' });
  }
  const pages = readJSON('pages.json', []);
  return pages.find(p => p.fullUrl.replace(/^\/+|\/+$/g, '').toLowerCase() === cleanUrl.toLowerCase()) || null;
}

export async function getAllPages() {
  if (dbState.isConnected) {
    return Page.find().sort('heroTitle');
  }
  return readJSON('pages.json', []);
}

export async function savePage(pageData) {
  requireMongoForContent();
  const cleanUrl = String(pageData.fullUrl || '').replace(/^\/+|\/+$/g, '');
  pageData.fullUrl = cleanUrl;
  const saved = pageData._id && /^[a-f\d]{24}$/i.test(String(pageData._id))
    ? await Page.findByIdAndUpdate(pageData._id, pageData, { new: true, runValidators: true })
    : await Page.findOneAndUpdate({ fullUrl: cleanUrl }, pageData, { new: true, upsert: true, runValidators: true });
  if (!saved) throw Object.assign(new Error('Page was not found and could not be saved.'), { status: 404 });
  return saved;
}

export async function deletePage(id) {
  requireMongoForContent();
  return await Page.findByIdAndDelete(id);
}

/* ========================================================================== */
/*  INQUIRIES                                                                 */
/* ========================================================================== */
export async function createInquiry(data) {
  requireMongoForContent();
  return Inquiry.create(data);
}

export async function getInquiries({ category, country, status, q, page = 1, limit, dateFrom, dateTo } = {}) {
   requireMongoForContent();
   // parse limit from env or use default
   const configuredLimit = Number.parseInt(process.env.INQUIRY_PAGE_LIMIT, 10) || 10;
   const requestedLimit = Number.parseInt(limit, 10) || configuredLimit;
   const limitNum = Math.min(100, Math.max(1, requestedLimit));
   const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
   const skip = (pageNum - 1) * limitNum;

   let items = [];
   let total = 0;
   if (dbState.isConnected) {
     try {
       const filter = {};
       if (dateFrom || dateTo) {
         filter.createdAt = {};
         if (dateFrom) filter.createdAt.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
         if (dateTo) { const exclusiveEnd = new Date(`${dateTo}T00:00:00.000Z`); exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1); filter.createdAt.$lt = exclusiveEnd; }
       }
       if (category && category !== "All") filter.category = new RegExp(category, "i");
       if (country && country !== "All") filter.country = new RegExp(country, "i");
       if (status && status !== "All") filter.status = status;
       if (q) {
         filter.$or = [
           { name: new RegExp(q, "i") },
           { phone: new RegExp(q, "i") },
           { email: new RegExp(q, "i") },
           { country: new RegExp(q, "i") },
           { visaType: new RegExp(q, "i") },
         ];
       }
       // Get total count
       total = await Inquiry.countDocuments(filter);
       // Get paginated results
       items = await Inquiry.find(filter).sort("-createdAt").skip(skip).limit(limitNum);
       return { inquiries: items, total, page: pageNum, limit: limitNum };
     } catch (e) {
       console.warn("getInquiries DB error:", e.message);
       throw e;
     }
   }

   // Fallback to JSON
   items = readJSON("inquiries.json", []);
   if (dateFrom || dateTo) {
     const start = dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`) : null;
     const end = dateTo ? new Date(`${dateTo}T00:00:00.000Z`) : null;
     if (end) end.setUTCDate(end.getUTCDate() + 1);
     items = items.filter(item => {
       const createdAt = new Date(item.createdAt);
       return Number.isFinite(createdAt.getTime()) && (!start || createdAt >= start) && (!end || createdAt < end);
     });
   }
   if (category && category !== "All") {
     const catLow = category.toLowerCase();
     items = items.filter(i => (i.category || "").toLowerCase().includes(catLow));
   }
   if (country && country !== "All") {
     const cLow = country.toLowerCase();
     items = items.filter(i => (i.country || "").toLowerCase().includes(cLow));
   }
   if (status && status !== "All") {
     items = items.filter(i => i.status === status);
   }
   if (q) {
     const qLow = q.toLowerCase();
     items = items.filter(i => 
       (i.name || "").toLowerCase().includes(qLow) || 
       (i.phone || "").toLowerCase().includes(qLow) || 
       (i.email || "").toLowerCase().includes(qLow) || 
       (i.country || "").toLowerCase().includes(qLow) || 
       (i.visaType || "").toLowerCase().includes(qLow)
     );
   }
   total = items.length;
   // sort by createdAt descending (newest first)
   items = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
   // paginate
   const paginatedItems = items.slice(skip, skip + limitNum);
   return { inquiries: paginatedItems, total, page: pageNum, limit: limitNum };
   }


export async function getInquiryStats() {
  requireMongoForContent();
  if (dbState.isConnected) {
    try {
      const [totals, categories] = await Promise.all([
        Inquiry.aggregate([
          { $group: {
            _id: null,
            total: { $sum: 1 },
            newCount: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
          } },
        ]),
        Inquiry.aggregate([
          { $group: { _id: { $ifNull: ['$category', 'General'] }, count: { $sum: 1 } } },
        ]),
      ]);
      return {
        totalInquiries: totals[0]?.total || 0,
        newInquiries: totals[0]?.newCount || 0,
        countsByCategory: categories.reduce((counts, row) => {
          counts[row._id || 'General'] = row.count;
          return counts;
        }, {}),
      };
    } catch (e) {
      console.warn('getInquiryStats DB error:', e.message);
      throw e;
    }
  }

  const inquiries = readJSON('inquiries.json', []);
  const countsByCategory = inquiries.reduce((counts, inquiry) => {
    const category = inquiry.category || 'General';
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
  return {
    totalInquiries: inquiries.length,
    newInquiries: inquiries.filter(inquiry => inquiry.status === 'new').length,
    countsByCategory,
  };
}

const CHAT_ACTIVE_SESSION_TIMEOUT_MS = Math.max(60_000, Number(process.env.CHAT_ACTIVE_SESSION_TIMEOUT_MS) || 30 * 60 * 1000);

export async function getChatAvailability() {
  requireMongoForContent();
  let state = await ChatbotState.findOne({ key: 'global' }).lean();
  if (!state) return { online: false, activeVisitorId: '', busy: false, available: false };
  const activeAt = Date.parse(state.updatedAt || '');
  if (state.activeVisitorId && (!Number.isFinite(activeAt) || Date.now() - activeAt > CHAT_ACTIVE_SESSION_TIMEOUT_MS)) {
    state = await ChatbotState.findOneAndUpdate({ key: 'global' }, { $set: { activeVisitorId: '' } }, { new: true }).lean();
  }
  return { online: state.online === true, activeVisitorId: state.activeVisitorId || '', busy: Boolean(state.activeVisitorId), available: state.online === true && !state.activeVisitorId };
}

export async function setChatAvailability(online) {
  requireMongoForContent();
  const previous = await getChatAvailability();
  const state = await ChatbotState.findOneAndUpdate(
    { key: 'global' },
    { $set: { online: online === true, activeVisitorId: online ? previous.activeVisitorId : '', updatedAt: new Date() }, $setOnInsert: { key: 'global' } },
    { upsert: true, new: true, runValidators: true }
  ).lean();
  return { online: state.online, activeVisitorId: state.activeVisitorId || '', busy: Boolean(state.activeVisitorId), available: state.online && !state.activeVisitorId };
}

export async function claimChatSession(visitorId) {
  requireMongoForContent();
  const state = await ChatbotState.findOne({ key: 'global' }).lean();
  if (!state?.online) return { ok: false, reason: 'offline' };
  if (state.activeVisitorId && state.activeVisitorId !== visitorId) return { ok: false, reason: 'busy' };
  const claimed = await ChatbotState.findOneAndUpdate(
    { key: 'global', online: true, activeVisitorId: state.activeVisitorId || '' },
    { $set: { activeVisitorId: visitorId, updatedAt: new Date() } },
    { new: true }
  ).lean();
  return claimed ? { ok: true, activeVisitorId: visitorId } : { ok: false, reason: 'busy' };
}

export async function releaseChatSession(visitorId) {
  requireMongoForContent();
  const released = await ChatbotState.findOneAndUpdate(
    { key: 'global', activeVisitorId: visitorId },
    { $set: { activeVisitorId: '', updatedAt: new Date() } },
    { new: true }
  );
  return Boolean(released);
}

export async function getChatSessions({ page = 1, limit } = {}) {
  requireMongoForContent();
  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const configuredLimit = Math.max(1, Number.parseInt(process.env.CHAT_SESSION_PAGE_LIMIT, 10) || 25);
  const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || configuredLimit));
  const rows = await ChatSession.find().sort('-updatedAt').skip((pageNum - 1) * limitNum).limit(limitNum + 1).lean();
  const hasMore = rows.length > limitNum;
  return { sessions: hasMore ? rows.slice(0, limitNum) : rows, page: pageNum, limit: limitNum, hasMore };
}

export async function getChatSession(visitorId) {
  requireMongoForContent();
  return ChatSession.findOne({ visitorId }).lean();
}

export async function markChatMessagesRead(visitorId, senderRole) {
  requireMongoForContent();
  if (!['user', 'admin'].includes(senderRole)) throw Object.assign(new Error('Invalid chat message role.'), { status: 400 });
  const readAt = new Date();
  return ChatSession.updateOne(
    { visitorId, messages: { $elemMatch: { role: senderRole, readAt: null } } },
    { $set: { 'messages.$[message].readAt': readAt } },
    { arrayFilters: [{ 'message.role': senderRole, 'message.readAt': null }] }
  );
}

export async function saveChatSession(sessionData) {
  requireMongoForContent();
  const session = { ...sessionData, updatedAt: new Date().toISOString() };
  return ChatSession.findOneAndUpdate({ visitorId: session.visitorId }, session, { new: true, upsert: true, runValidators: true }).lean();
}

export async function updateInquiry(id, updateData) {
  requireMongoForContent();
  return Inquiry.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
}

export async function deleteInquiry(id) {
  requireMongoForContent();
  return Inquiry.findByIdAndDelete(id);
}

/* ========================================================================== */
/*  CMS CONTENT                                                               */
/* ========================================================================== */
export async function getCMSContent(pageName) {
  if (dbState.isConnected) {
    const records = await CMSContent.find({ page: pageName });
    return records.reduce((acc, r) => {
      acc[r.section] = r.data;
      return acc;
    }, {});
  }
  const allCMS = readJSON('cms.json', {});
  return allCMS[pageName] || {};
}

export async function saveCMSSection(pageName, sectionName, data) {
  requireMongoForContent();
  const saved = await CMSContent.findOneAndUpdate(
    { page: pageName, section: sectionName },
    { page: pageName, section: sectionName, data },
    { upsert: true, new: true, runValidators: true }
  );
  return { ok: true, data: saved.data };
}

/* ========================================================================== */
/*  SEO METADATA                                                              */
/* ========================================================================== */
export async function getSEO(pageUrl) {
  const cleanUrl = String(pageUrl || '').replace(/^\/+|\/+$/g, '') || '/';
  if (dbState.isConnected) {
    return SEOMetadata.findOne({ pageUrl: cleanUrl, status: 'active' });
  }
  const seos = readJSON('seo.json', []);
  return seos.find(s => s.pageUrl === cleanUrl || s.pageUrl === '/' + cleanUrl) || null;
}

export async function getAllSEO() {
  if (dbState.isConnected) {
    return SEOMetadata.find().sort('pageUrl');
  }
  return readJSON('seo.json', []);
}

export async function saveSEO(data) {
  requireMongoForContent();
  const cleanUrl = String(data.pageUrl || '').replace(/^\/+|\/+$/g, '') || '/';
  data.pageUrl = cleanUrl === '/' ? '/' : '/' + cleanUrl;
  return SEOMetadata.findOneAndUpdate({ pageUrl: data.pageUrl }, data, { upsert: true, new: true, runValidators: true });
}

export async function deleteSEO(id) {
  requireMongoForContent();
  return SEOMetadata.findByIdAndDelete(id);
}

/* ========================================================================== */
/*  POSTS (BLOG)                                                              */
/* ========================================================================== */
export async function getPosts(category, contentType = 'blog') {
  const isNews = contentType === 'news';
  if (dbState.isConnected) {
    const f = { status: 'published', ...(isNews ? { contentType: 'news' } : { contentType: { $ne: 'news' } }) };
    if (category) f.category = category;
    return Post.find(f).select('-content').sort('-createdAt').limit(Math.max(0, Number(process.env[isNews ? 'NEWS_MAX_COUNT' : 'BLOG_MAX_COUNT'] || 30)));
  }
  let posts = readJSON(isNews ? 'news.json' : 'posts.json', []);
  if (isNews) posts = posts.filter(post => (post.status || 'published') === 'published');
  if (category) posts = posts.filter(p => p.category === category);
  return posts.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, Math.max(0, Number(process.env[isNews ? 'NEWS_MAX_COUNT' : 'BLOG_MAX_COUNT'] || 30))).map(({ content, ...rest }) => rest);
}

export async function getPostBySlug(slug, contentType = 'blog') {
  const isNews = contentType === 'news';
  const typeFilter = isNews ? { contentType: 'news' } : { contentType: { $ne: 'news' } };
  if (dbState.isConnected) {
    const post = await Post.findOneAndUpdate({ slug, status: 'published', ...typeFilter }, { $inc: { views: 1 } }, { new: true });
    if (!post) return null;
    const related = await Post.find({ status: 'published', _id: { $ne: post._id }, ...typeFilter }).select('-content').sort('-createdAt').limit(3);
    return { post, related };
  }
  const posts = readJSON(isNews ? 'news.json' : 'posts.json', []);
  const post = posts.find(p => p.slug === slug && (!isNews || (p.status || 'published') === 'published'));
  if (!post) return null;
  post.views = (post.views || 0) + 1;
  const related = posts.filter(p => p.slug !== slug).slice(0, 3).map(({ content, ...rest }) => rest);
  return { post, related };
}

export async function getAllPostsAdmin(contentType = 'blog') {
  const isNews = contentType === 'news';
  const typeFilter = isNews ? { contentType: 'news' } : { contentType: { $ne: 'news' } };
  if (dbState.isConnected) {
    return Post.find(typeFilter).sort('-createdAt');
  }
  return readJSON(isNews ? 'news.json' : 'posts.json', []);
}

export async function savePost(data, contentType = 'blog') {
  requireMongoForContent();
  const isNews = contentType === 'news';
  data = { ...data, contentType: isNews ? 'news' : 'blog' };
  const maxChars = Math.max(1, Number(process.env[isNews ? 'NEWS_MAX_CONTENT_CHARS' : 'BLOG_MAX_CONTENT_CHARS'] || 3500));
  if (String(data.content || '').length > maxChars) throw Object.assign(new Error(`${isNews ? 'News' : 'Blog'} content cannot exceed ${maxChars} characters.`), { status: 400 });
  if (!data.slug && data.title) {
    data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  const typeFilter = isNews ? { contentType: 'news' } : { contentType: { $ne: 'news' } };
  return data._id && /^[a-f\d]{24}$/i.test(String(data._id))
    ? Post.findOneAndUpdate({ _id: data._id, ...typeFilter }, data, { new: true, runValidators: true })
    : Post.findOneAndUpdate({ slug: data.slug, contentType: data.contentType }, data, { upsert: true, new: true, runValidators: true });
}

export async function deletePost(id, contentType = 'blog') {
  requireMongoForContent();
  const isNews = contentType === 'news';
  return Post.findOneAndDelete({ _id: id, ...(isNews ? { contentType: 'news' } : { contentType: { $ne: 'news' } }) });
}

/* ========================================================================== */
/*  ADMIN AUTH                                                                */
/* ========================================================================== */
export async function verifyAdmin(email, password) {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@visafornation.com').toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin@12345';

  if (email.toLowerCase() === adminEmail && password === adminPass) {
    return { email: adminEmail };
  }

  if (dbState.isConnected) {
    try {
      const a = await Admin.findOne({ email: email.toLowerCase() });
      if (a && (await bcrypt.compare(password, a.password))) {
        return { email: a.email, id: a._id };
      }
    } catch (e) {}
  }
  return null;
}


// ==========================================================================
// CUSTOM MODEL FUNCTIONS
// ==========================================================================

export async function getAllBanners() {
  requireMongoForContent();
  return Banner.find().sort({ displayOrder: 1 });
}

export async function saveBanner(bannerData) {
  requireMongoForContent();
  if (bannerData._id && /^[a-f\d]{24}$/i.test(String(bannerData._id))) {
    return Banner.findByIdAndUpdate(bannerData._id, bannerData, { new: true, runValidators: true });
  }
  const { _id, ...content } = bannerData;
  return Banner.findOneAndUpdate({ imageUrl: content.imageUrl }, content, { new: true, upsert: true, runValidators: true });
}

export async function deleteBanner(id) {
  requireMongoForContent();
  if (!/^[a-f\d]{24}$/i.test(String(id))) throw Object.assign(new Error('This banner is not saved in MongoDB. Refresh the banner list and try again.'), { status: 404 });
  return Banner.findByIdAndDelete(id);
}

// Reel
export async function getAllReels() {
  requireMongoForContent();
  return Reel.find().sort({ displayOrder: 1 });
}

export async function saveReel(reelData) {
  requireMongoForContent();
  const saved = reelData._id
    ? await Reel.findByIdAndUpdate(reelData._id, reelData, { new: true, runValidators: true })
    : await Reel.create(reelData);
  if (!saved) throw Object.assign(new Error('Reel was not found and could not be updated.'), { status: 404 });
  return saved;
}

export async function deleteReel(id) {
  requireMongoForContent();
  return Reel.findByIdAndDelete(id);
}

// Testimonial
export async function getAllTestimonials() {
  requireMongoForContent();
  return Testimonial.find().sort({ _id: -1 });
}

export async function saveTestimonial(testimonialData) {
  requireMongoForContent();
  const saved = testimonialData._id
    ? await Testimonial.findByIdAndUpdate(testimonialData._id, testimonialData, { new: true, runValidators: true })
    : await Testimonial.create(testimonialData);
  if (!saved) throw Object.assign(new Error('Testimonial was not found and could not be updated.'), { status: 404 });
  return saved;
}

export async function likeTestimonial(id) {
  requireMongoForContent();
  return Testimonial.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });
}

export async function deleteTestimonial(id) {
  requireMongoForContent();
  return Testimonial.findByIdAndDelete(id);
}
// Review
export async function getAllReviews() {
  requireMongoForContent();
  return Review.find().sort({ _id: -1 });
}

export async function saveReview(reviewData) {
  requireMongoForContent();
  const maxCount = Math.max(1, Number(process.env.REVIEW_MAX_COUNT || 20));
  const maxChars = Math.max(1, Number(process.env.REVIEW_MAX_MESSAGE_CHARS || 500));
  if (String(reviewData.message || '').length > maxChars) throw Object.assign(new Error('Review message cannot exceed ' + maxChars + ' characters.'), { status: 400 });
  if (!reviewData._id && await Review.countDocuments() >= maxCount) throw Object.assign(new Error('You can add up to ' + maxCount + ' reviews.'), { status: 400 });
  const saved = reviewData._id
    ? await Review.findByIdAndUpdate(reviewData._id, reviewData, { new: true, runValidators: true })
    : await Review.create(reviewData);
  if (!saved) throw Object.assign(new Error('Review was not found and could not be updated.'), { status: 404 });
  return saved;
}

export async function deleteReview(id) {
  requireMongoForContent();
  return Review.findByIdAndDelete(id);
}

// TeamImage
export async function getAllTeamImages() {
  requireMongoForContent();
  return TeamImage.find().sort({ _id: -1 });
}

export async function saveTeamImage(teamImageData) {
  requireMongoForContent();
  const saved = teamImageData._id
    ? await TeamImage.findByIdAndUpdate(teamImageData._id, teamImageData, { new: true, runValidators: true })
    : await TeamImage.create(teamImageData);
  if (!saved) throw Object.assign(new Error('Team image was not found and could not be updated.'), { status: 404 });
  return saved;
}

export async function deleteTeamImage(id) {
  requireMongoForContent();
  return TeamImage.findByIdAndDelete(id);
}

// CareerJob
export async function getAllCareerJobs() {
  requireMongoForContent();
  return CareerJob.find().sort({ _id: -1 });
}

export async function saveCareerJob(jobData) {
  requireMongoForContent();
  const saved = jobData._id
    ? await CareerJob.findByIdAndUpdate(jobData._id, jobData, { new: true, runValidators: true })
    : await CareerJob.create(jobData);
  if (!saved) throw Object.assign(new Error('Job was not found and could not be updated.'), { status: 404 });
  return saved;
}

export async function deleteCareerJob(id) {
  requireMongoForContent();
  return CareerJob.findByIdAndDelete(id);
}

export async function getCareerApplicationCount(jobId) {
  requireMongoForContent();
  return CareerApplication.countDocuments({ job: jobId });
}
// CareerApplication
export async function getAllCareerApplications() {
  requireMongoForContent();
  return CareerApplication.find().populate('job').sort({ appliedAt: -1 });
}

export async function saveCareerApplication(appData) {
  requireMongoForContent();
  if (appData._id) return CareerApplication.findByIdAndUpdate(appData._id, appData, { new: true, runValidators: true });
  return CareerApplication.create({ status: 'received', ...appData });
}

export async function deleteCareerApplication(id) {
  requireMongoForContent();
  return CareerApplication.findByIdAndDelete(id);
}

const podcastLimit = () => { const value = Number(process.env.PODCAST_MAX_COUNT || 20); return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 20; };
const podcastUrlIsSupported = value => {
  try {
    const url = new URL(String(value || ''));
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (['youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) return Boolean(url.searchParams.get('v') || url.pathname.match(/\/(?:embed|shorts|live)\/[^/]+/) || (host === 'youtu.be' && url.pathname.length > 1));
    if (host === 'open.spotify.com') return /^\/episode\/[^/]+/.test(url.pathname);
    if (host === 'podcasts.apple.com') return /\/podcast\//.test(url.pathname);
    if (host === 'soundcloud.com') return url.pathname.split('/').filter(Boolean).length >= 2;
    return false;
  } catch { return false; }
};
const validatePodcast = data => {
  const title = String(data.title || '').trim();
  const url = String(data.url || '').trim();
  const thumbnailUrl = String(data.thumbnailUrl || '').trim();
  if (title.length < 3 || title.length > 120) throw Object.assign(new Error('Podcast title must be 3 to 120 characters.'), { status: 400 });
  if (url.length > 1000 || !podcastUrlIsSupported(url)) throw Object.assign(new Error('Enter a supported YouTube, Spotify episode, Apple Podcasts, or SoundCloud link.'), { status: 400 });
  if (thumbnailUrl.length > 500) throw Object.assign(new Error('Thumbnail path is too long.'), { status: 400 });
  return { title, url, thumbnailUrl };
};
export async function getPodcasts() {
  requireMongoForContent();
  const limit = podcastLimit();
  if (!limit) return [];
  return Podcast.find().sort('-createdAt').limit(limit);
}
export async function getAllPodcastsAdmin() {
  requireMongoForContent();
  return Podcast.find().sort('-createdAt');
}
export async function savePodcast(data) {
  requireMongoForContent();
  const clean = validatePodcast(data);
  if (data._id && /^[a-f\d]{24}$/i.test(String(data._id))) return Podcast.findByIdAndUpdate(data._id, clean, { new: true, runValidators: true });
  return Podcast.create(clean);
}
export async function deletePodcast(id) {
  requireMongoForContent();
  return Podcast.findByIdAndDelete(id);
}
