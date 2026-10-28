import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { dbState } from '../config/db.js';
import { Page, Post, Inquiry, ChatSession, CMSContent, SEOMetadata, Admin, Banner, Reel, Testimonial, Review, TeamImage, CareerJob, CareerApplication, Podcast } from '../models/index.js';

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

const writeJSON = (filename, data) => {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`Error writing ${filename}:`, e.message);
  }
};

/* ========================================================================== */
/*  PAGES                                                                     */
/* ========================================================================== */
export async function getPage(fullUrl) {
  const cleanUrl = String(fullUrl || '').replace(/^\/+|\/+$/g, '');
  if (dbState.isConnected) {
    try {
      const page = await Page.findOne({ fullUrl: cleanUrl, status: 'published' });
      if (page) return page;
    } catch (e) {
      console.warn('Page findOne error:', e.message);
    }
  }
  const pages = readJSON('pages.json', []);
  return pages.find(p => p.fullUrl.replace(/^\/+|\/+$/g, '').toLowerCase() === cleanUrl.toLowerCase()) || null;
}

export async function getAllPages() {
  if (dbState.isConnected) {
    try {
      const pages = await Page.find().sort('heroTitle');
      if (pages.length > 0) return pages;
    } catch (e) {
      console.warn('getAllPages error:', e.message);
    }
  }
  return readJSON('pages.json', []);
}

export async function savePage(pageData) {
  const pages = readJSON('pages.json', []);
  const cleanUrl = String(pageData.fullUrl || '').replace(/^\/+|\/+$/g, '');
  pageData.fullUrl = cleanUrl;

  let saved = null;
  if (dbState.isConnected) {
    try {
      if (pageData._id && String(pageData._id).length === 24) {
        saved = await Page.findByIdAndUpdate(pageData._id, pageData, { new: true, runValidators: true });
      } else {
        saved = await Page.findOneAndUpdate({ fullUrl: cleanUrl }, pageData, { new: true, upsert: true });
      }
    } catch (e) {
      console.warn('savePage DB error:', e.message);
    }
  }

  // Update in JSON file
  const idx = pages.findIndex(p => p.fullUrl.toLowerCase() === cleanUrl.toLowerCase() || (pageData._id && String(p._id) === String(pageData._id)));
  if (idx >= 0) {
    pages[idx] = { ...pages[idx], ...pageData, updatedAt: new Date().toISOString() };
    saved = saved || pages[idx];
  } else {
    const newPage = { _id: pageData._id || 'page_' + Date.now(), ...pageData, createdAt: new Date().toISOString() };
    pages.push(newPage);
    saved = saved || newPage;
  }
  writeJSON('pages.json', pages);
  return saved;
}

export async function deletePage(id) {
  if (dbState.isConnected) {
    try {
      await Page.findByIdAndDelete(id);
    } catch (e) {}
  }
  let pages = readJSON('pages.json', []);
  pages = pages.filter(p => String(p._id) !== String(id) && p.fullUrl !== String(id));
  writeJSON('pages.json', pages);
  return { ok: true };
}

/* ========================================================================== */
/*  INQUIRIES                                                                 */
/* ========================================================================== */
export async function createInquiry(data) {
  let created = null;
  if (dbState.isConnected) {
    try {
      created = await Inquiry.create(data);
    } catch (e) {
      console.warn('createInquiry DB error:', e.message);
    }
  }
  const inquiries = readJSON('inquiries.json', []);
  const item = {
    _id: created?._id ? String(created._id) : 'inq_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    ...data,
    status: data.status || 'new',
    createdAt: new Date().toISOString(),
  };
  inquiries.unshift(item);
  writeJSON('inquiries.json', inquiries);
  return created || item;
}

export async function getInquiries({ category, country, status, q, page = 1, limit, dateFrom, dateTo } = {}) {
   // parse limit from env or use default
   const limitNum = limit ? parseInt(limit) : (process.env.INQUIRY_PAGE_LIMIT ? parseInt(process.env.INQUIRY_PAGE_LIMIT) : 10);
   const pageNum = parseInt(page);
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
       if (items.length > 0 || dateFrom || dateTo) {
         return { inquiries: items, total, page: pageNum, limit: limitNum };
       }
     } catch (e) {
       console.warn("getInquiries DB error:", e.message);
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
      if (totals[0]?.total > 0) {
        return {
          totalInquiries: totals[0].total,
          newInquiries: totals[0].newCount,
          countsByCategory: categories.reduce((counts, row) => {
            counts[row._id || 'General'] = row.count;
            return counts;
          }, {}),
        };
      }
    } catch (e) {
      console.warn('getInquiryStats DB error:', e.message);
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

export async function getChatAvailability() {
  const state = readJSON('chatbot-state.json', { online: false });
  return { online: state.online === true, activeVisitorId: state.activeVisitorId || '', busy: Boolean(state.activeVisitorId), available: state.online === true && !state.activeVisitorId };
}

export async function setChatAvailability(online) {
  const previous = readJSON('chatbot-state.json', { online: false });
  const state = { ...previous, online: online === true, ...(online ? {} : { activeVisitorId: '' }), updatedAt: new Date().toISOString() };
  writeJSON('chatbot-state.json', state);
  return { online: state.online, activeVisitorId: state.activeVisitorId || '', busy: Boolean(state.activeVisitorId), available: state.online && !state.activeVisitorId };
}

export async function claimChatSession(visitorId) {
  const state = readJSON('chatbot-state.json', { online: false });
  if (!state.online) return { ok: false, reason: 'offline' };
  if (state.activeVisitorId && state.activeVisitorId !== visitorId) return { ok: false, reason: 'busy' };
  state.activeVisitorId = visitorId;
  state.updatedAt = new Date().toISOString();
  writeJSON('chatbot-state.json', state);
  return { ok: true, activeVisitorId: visitorId };
}

export async function releaseChatSession(visitorId) {
  const state = readJSON('chatbot-state.json', { online: false });
  if (state.activeVisitorId !== visitorId) return false;
  state.activeVisitorId = '';
  state.updatedAt = new Date().toISOString();
  writeJSON('chatbot-state.json', state);
  return true;
}

export async function getChatSessions() {
  if (dbState.isConnected) {
    try { return await ChatSession.find().sort('-updatedAt').lean(); } catch (e) { console.warn('getChatSessions DB error:', e.message); }
  }
  return readJSON('chat-sessions.json', []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export async function getChatSession(visitorId) {
  if (dbState.isConnected) {
    try { const session = await ChatSession.findOne({ visitorId }).lean(); if (session) return session; } catch (e) { console.warn('getChatSession DB error:', e.message); }
  }
  return readJSON('chat-sessions.json', []).find(item => item.visitorId === visitorId) || null;
}

export async function saveChatSession(sessionData) {
  const session = { ...sessionData, updatedAt: new Date().toISOString() };
  if (dbState.isConnected) {
    try { return await ChatSession.findOneAndUpdate({ visitorId: session.visitorId }, session, { new: true, upsert: true, runValidators: true }).lean(); } catch (e) { console.warn('saveChatSession DB error:', e.message); }
  }
  const sessions = readJSON('chat-sessions.json', []);
  const index = sessions.findIndex(item => item.visitorId === session.visitorId);
  if (index >= 0) sessions[index] = { ...sessions[index], ...session };
  else sessions.unshift(session);
  writeJSON('chat-sessions.json', sessions);
  return index >= 0 ? sessions[index] : session;
}

export async function updateInquiry(id, updateData) {
  if (dbState.isConnected) {
    try {
      await Inquiry.findByIdAndUpdate(id, updateData, { new: true });
    } catch (e) {}
  }
  const inquiries = readJSON('inquiries.json', []);
  const idx = inquiries.findIndex(i => String(i._id) === String(id));
  if (idx >= 0) {
    inquiries[idx] = { ...inquiries[idx], ...updateData, updatedAt: new Date().toISOString() };
    writeJSON('inquiries.json', inquiries);
    return inquiries[idx];
  }
  return null;
}

export async function deleteInquiry(id) {
  if (dbState.isConnected) {
    try {
      await Inquiry.findByIdAndDelete(id);
    } catch (e) {}
  }
  let inquiries = readJSON('inquiries.json', []);
  inquiries = inquiries.filter(i => String(i._id) !== String(id));
  writeJSON('inquiries.json', inquiries);
  return { ok: true };
}

/* ========================================================================== */
/*  CMS CONTENT                                                               */
/* ========================================================================== */
export async function getCMSContent(pageName) {
  if (dbState.isConnected) {
    try {
      const records = await CMSContent.find({ page: pageName });
      if (records.length > 0) {
        return records.reduce((acc, r) => {
          acc[r.section] = r.data;
          return acc;
        }, {});
      }
    } catch (e) {}
  }
  const allCMS = readJSON('cms.json', {});
  return allCMS[pageName] || {};
}

export async function saveCMSSection(pageName, sectionName, data) {
  if (dbState.isConnected) {
    try {
      await CMSContent.findOneAndUpdate(
        { page: pageName, section: sectionName },
        { page: pageName, section: sectionName, data },
        { upsert: true, new: true }
      );
    } catch (e) {
      console.warn('saveCMSSection DB error:', e.message);
    }
  }
  const allCMS = readJSON('cms.json', {});
  if (!allCMS[pageName]) allCMS[pageName] = {};
  allCMS[pageName][sectionName] = data;
  writeJSON('cms.json', allCMS);
  return { ok: true, data };
}

/* ========================================================================== */
/*  SEO METADATA                                                              */
/* ========================================================================== */
export async function getSEO(pageUrl) {
  const cleanUrl = String(pageUrl || '').replace(/^\/+|\/+$/g, '') || '/';
  if (dbState.isConnected) {
    try {
      const seo = await SEOMetadata.findOne({ pageUrl: cleanUrl, status: 'active' });
      if (seo) return seo;
    } catch (e) {}
  }
  const seos = readJSON('seo.json', []);
  return seos.find(s => s.pageUrl === cleanUrl || s.pageUrl === '/' + cleanUrl) || null;
}

export async function getAllSEO() {
  if (dbState.isConnected) {
    try {
      const seos = await SEOMetadata.find().sort('pageUrl');
      if (seos.length > 0) return seos;
    } catch (e) {}
  }
  return readJSON('seo.json', []);
}

export async function saveSEO(data) {
  const cleanUrl = String(data.pageUrl || '').replace(/^\/+|\/+$/g, '') || '/';
  data.pageUrl = cleanUrl === '/' ? '/' : '/' + cleanUrl;

  let saved = null;
  if (dbState.isConnected) {
    try {
      saved = await SEOMetadata.findOneAndUpdate(
        { pageUrl: data.pageUrl },
        data,
        { upsert: true, new: true, runValidators: true }
      );
    } catch (e) {
      console.warn('saveSEO DB error:', e.message);
    }
  }

  const seos = readJSON('seo.json', []);
  const idx = seos.findIndex(s => s.pageUrl === data.pageUrl || (data._id && String(s._id) === String(data._id)));
  if (idx >= 0) {
    seos[idx] = { ...seos[idx], ...data, updatedAt: new Date().toISOString() };
    saved = saved || seos[idx];
  } else {
    const newItem = { _id: data._id || 'seo_' + Date.now(), ...data, createdAt: new Date().toISOString() };
    seos.push(newItem);
    saved = saved || newItem;
  }
  writeJSON('seo.json', seos);
  return saved;
}

export async function deleteSEO(id) {
  if (dbState.isConnected) {
    try {
      await SEOMetadata.findByIdAndDelete(id);
    } catch (e) {}
  }
  let seos = readJSON('seo.json', []);
  seos = seos.filter(s => String(s._id) !== String(id));
  writeJSON('seo.json', seos);
  return { ok: true };
}

/* ========================================================================== */
/*  POSTS (BLOG)                                                              */
/* ========================================================================== */
export async function getPosts(category, contentType = 'blog') {
  const isNews = contentType === 'news';
  if (dbState.isConnected) {
    try {
      const f = { status: 'published', ...(isNews ? { contentType: 'news' } : { contentType: { $ne: 'news' } }) };
      if (category) f.category = category;
      const posts = await Post.find(f).select('-content').sort('-createdAt').limit(Math.max(0, Number(process.env[isNews ? 'NEWS_MAX_COUNT' : 'BLOG_MAX_COUNT'] || 30)));
      if (posts.length > 0) return posts;
    } catch (e) {}
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
    try {
      const post = await Post.findOneAndUpdate({ slug, status: 'published', ...typeFilter }, { $inc: { views: 1 } }, { new: true });
      if (post) {
        const related = await Post.find({ status: 'published', _id: { $ne: post._id }, ...typeFilter }).select('-content').sort('-createdAt').limit(3);
        return { post, related };
      }
    } catch (e) {}
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
    try {
      const posts = await Post.find(typeFilter).sort('-createdAt');
      if (posts.length > 0) return posts;
    } catch (e) {}
  }
  return readJSON(isNews ? 'news.json' : 'posts.json', []);
}

export async function savePost(data, contentType = 'blog') {
  const isNews = contentType === 'news';
  data = { ...data, contentType: isNews ? 'news' : 'blog' };
  const maxChars = Math.max(1, Number(process.env[isNews ? 'NEWS_MAX_CONTENT_CHARS' : 'BLOG_MAX_CONTENT_CHARS'] || 800));
  if (String(data.content || '').length > maxChars) throw Object.assign(new Error(`${isNews ? 'News' : 'Blog'} content cannot exceed ${maxChars} characters.`), { status: 400 });
  let saved = null;
  if (!data.slug && data.title) {
    data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (dbState.isConnected) {
    try {
      if (data._id && String(data._id).length === 24) {
        saved = await Post.findOneAndUpdate({ _id: data._id, ...(isNews ? { contentType: 'news' } : { contentType: { $ne: 'news' } }) }, data, { new: true });
      } else {
        saved = await Post.findOneAndUpdate({ slug: data.slug, contentType: data.contentType }, data, { upsert: true, new: true });
      }
    } catch (e) {}
  }
  const filename = isNews ? 'news.json' : 'posts.json';
  const posts = readJSON(filename, []);
  const idx = posts.findIndex(p => p.slug === data.slug || (data._id && String(p._id) === String(data._id)));
  if (idx >= 0) {
    posts[idx] = { ...posts[idx], ...data, updatedAt: new Date().toISOString() };
    saved = saved || posts[idx];
  } else {
    const newItem = { _id: data._id || 'post_' + Date.now(), ...data, createdAt: new Date().toISOString() };
    posts.unshift(newItem);
    saved = saved || newItem;
  }
  writeJSON(filename, posts);
  return saved;
}

export async function deletePost(id, contentType = 'blog') {
  const isNews = contentType === 'news';
  if (dbState.isConnected) {
    try {
      await Post.findOneAndDelete({ _id: id, ...(isNews ? { contentType: 'news' } : { contentType: { $ne: 'news' } }) });
    } catch (e) {}
  }
  const filename = isNews ? 'news.json' : 'posts.json';
  let posts = readJSON(filename, []);
  posts = posts.filter(p => String(p._id) !== String(id) && p.slug !== String(id));
  writeJSON(filename, posts);
  return { ok: true };
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
  const localBanners = readJSON('banners.json', []);
  if (dbState.isConnected) {
    try {
      const databaseBanners = await Banner.find().sort({ displayOrder: 1 });
      const databaseIds = new Set(databaseBanners.map(item => String(item._id)));
      return [...databaseBanners, ...localBanners.filter(item => !databaseIds.has(String(item._id)))]
        .sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
    } catch (e) {
      console.warn('getAllBanners DB error:', e.message);
    }
  }
  return localBanners.slice().sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
}

export async function saveBanner(bannerData) {
  if (dbState.isConnected) {
    try {
      const saved = bannerData._id
        ? await Banner.findByIdAndUpdate(bannerData._id, bannerData, { new: true, runValidators: true })
        : await Banner.create(bannerData);
      if (saved) {
        const localBanners = readJSON('banners.json', []);
        const index = localBanners.findIndex(item => String(item._id) === String(saved._id));
        const serialized = saved.toObject ? saved.toObject() : saved;
        if (index >= 0) localBanners[index] = serialized;
        else localBanners.push(serialized);
        writeJSON('banners.json', localBanners);
        return saved;
      }
    } catch (e) {
      console.warn('saveBanner DB error:', e.message);
    }
  }
  const localBanners = readJSON('banners.json', []);
  const index = localBanners.findIndex(item => String(item._id) === String(bannerData._id));
  const now = new Date().toISOString();
  const saved = {
    ...(index >= 0 ? localBanners[index] : {}),
    ...bannerData,
    _id: bannerData._id || `banner_${Date.now()}`,
    updatedAt: now,
    createdAt: index >= 0 ? localBanners[index].createdAt : now,
  };
  if (index >= 0) localBanners[index] = saved;
  else localBanners.push(saved);
  writeJSON('banners.json', localBanners);
  return saved;
}

export async function deleteBanner(id) {
  let deleted = null;
  if (dbState.isConnected) {
    try {
      deleted = await Banner.findByIdAndDelete(id);
    } catch (e) {
      console.warn('deleteBanner DB error:', e.message);
    }
  }
  const localBanners = readJSON('banners.json', []);
  const remaining = localBanners.filter(item => String(item._id) !== String(id));
  if (remaining.length !== localBanners.length) writeJSON('banners.json', remaining);
  return deleted || (remaining.length !== localBanners.length ? { _id: id } : null);
}

// Reel
export async function getAllReels() {
  if (dbState.isConnected) {
    try {
      return await Reel.find().sort({ displayOrder: 1 });
    } catch (e) {
      console.warn('getAllReels DB error:', e.message);
    }
  }
  return [];
}

export async function saveReel(reelData) {
  if (dbState.isConnected) {
    try {
      if (reelData._id) {
        return await Reel.findByIdAndUpdate(reelData._id, reelData, { new: true, runValidators: true });
      } else {
        return await Reel.create(reelData);
      }
    } catch (e) {
      console.warn('saveReel DB error:', e.message);
    }
  }
  return null;
}

export async function deleteReel(id) {
  if (dbState.isConnected) {
    try {
      return await Reel.findByIdAndDelete(id);
    } catch (e) {
      console.warn('deleteReel DB error:', e.message);
    }
  }
  return null;
}

// Testimonial
export async function getAllTestimonials() {
  if (dbState.isConnected) {
    try {
      return await Testimonial.find().sort({ _id: -1 });
    } catch (e) {
      console.warn('getAllTestimonials DB error:', e.message);
    }
  }
  return [];
}

export async function saveTestimonial(testimonialData) {
  const maxCount = Math.max(1, Number(process.env.TESTIMONIAL_MAX_COUNT || 20));
  if (!testimonialData._id && dbState.isConnected && await Testimonial.countDocuments() >= maxCount) throw Object.assign(new Error('You can add up to ' + maxCount + ' testimonials.'), { status: 400 });
  if (dbState.isConnected) {
    try {
      if (testimonialData._id) {
        return await Testimonial.findByIdAndUpdate(testimonialData._id, testimonialData, { new: true, runValidators: true });
      } else {
        return await Testimonial.create(testimonialData);
      }
    } catch (e) {
      console.warn('saveTestimonial DB error:', e.message);
    }
  }
  return null;
}

export async function likeTestimonial(id) {
  if (!dbState.isConnected) return null;
  try {
    return await Testimonial.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });
  } catch (e) {
    console.warn('likeTestimonial DB error:', e.message);
    return null;
  }
}
export async function deleteTestimonial(id) {
  if (dbState.isConnected) {
    try {
      return await Testimonial.findByIdAndDelete(id);
    } catch (e) {
      console.warn('deleteTestimonial DB error:', e.message);
    }
  }
  return null;
}

// Review
export async function getAllReviews() {
  if (dbState.isConnected) {
    try {
      return await Review.find().sort({ _id: -1 });
    } catch (e) {
      console.warn('getAllReviews DB error:', e.message);
    }
  }
  return [];
}

export async function saveReview(reviewData) {
  const maxCount = Math.max(1, Number(process.env.REVIEW_MAX_COUNT || 20));
  const maxChars = Math.max(1, Number(process.env.REVIEW_MAX_MESSAGE_CHARS || 200));
  if (String(reviewData.message || '').length > maxChars) throw Object.assign(new Error('Review message cannot exceed ' + maxChars + ' characters.'), { status: 400 });
  if (!reviewData._id && dbState.isConnected && await Review.countDocuments() >= maxCount) throw Object.assign(new Error('You can add up to ' + maxCount + ' reviews.'), { status: 400 });
  if (dbState.isConnected) {
    try {
      if (reviewData._id) {
        return await Review.findByIdAndUpdate(reviewData._id, reviewData, { new: true, runValidators: true });
      } else {
        return await Review.create(reviewData);
      }
    } catch (e) {
      console.warn('saveReview DB error:', e.message);
    }
  }
  return null;
}

export async function deleteReview(id) {
  if (dbState.isConnected) {
    try {
      return await Review.findByIdAndDelete(id);
    } catch (e) {
      console.warn('deleteReview DB error:', e.message);
    }
  }
  return null;
}

// TeamImage
export async function getAllTeamImages() {
  if (dbState.isConnected) {
    try {
      return await TeamImage.find().sort({ _id: -1 });
    } catch (e) {
      console.warn('getAllTeamImages DB error:', e.message);
    }
  }
  return [];
}

export async function saveTeamImage(teamImageData) {
  if (dbState.isConnected) {
    try {
      if (teamImageData._id) {
        return await TeamImage.findByIdAndUpdate(teamImageData._id, teamImageData, { new: true, runValidators: true });
      } else {
        return await TeamImage.create(teamImageData);
      }
    } catch (e) {
      console.warn('saveTeamImage DB error:', e.message);
    }
  }
  return null;
}

export async function deleteTeamImage(id) {
  if (dbState.isConnected) {
    try {
      return await TeamImage.findByIdAndDelete(id);
    } catch (e) {
      console.warn('deleteTeamImage DB error:', e.message);
    }
  }
  return null;
}

// CareerJob
export async function getAllCareerJobs() {
  if (dbState.isConnected) {
    try {
      return await CareerJob.find().sort({ _id: -1 });
    } catch (e) {
      console.warn('getAllCareerJobs DB error:', e.message);
    }
  }
  return [];
}

export async function saveCareerJob(jobData) {
  if (dbState.isConnected) {
    try {
      if (jobData._id) {
        return await CareerJob.findByIdAndUpdate(jobData._id, jobData, { new: true, runValidators: true });
      } else {
        return await CareerJob.create(jobData);
      }
    } catch (e) {
      console.warn('saveCareerJob DB error:', e.message);
    }
  }
  return null;
}

export async function deleteCareerJob(id) {
  if (dbState.isConnected) {
    try {
      return await CareerJob.findByIdAndDelete(id);
    } catch (e) {
      console.warn('deleteCareerJob DB error:', e.message);
    }
  }
  return null;
}

export async function getCareerApplicationCount(jobId) {
  if (dbState.isConnected) {
    try { return await CareerApplication.countDocuments({ job: jobId }); }
    catch (e) { console.warn('getCareerApplicationCount DB error:', e.message); }
  }
  return readJSON('career-applications.json', []).filter(item => String(item.job?._id || item.job) === String(jobId)).length;
}
// CareerApplication
export async function getAllCareerApplications() {
  if (dbState.isConnected) {
    try { return await CareerApplication.find().populate('job').sort({ appliedAt: -1 }); }
    catch (e) { console.warn('getAllCareerApplications DB error:', e.message); }
  }
  const applications = readJSON('career-applications.json', []);
  const jobs = await getAllCareerJobs();
  return applications.map(application => ({ ...application, job: jobs.find(job => String(job._id) === String(application.job)) || null })).sort((a, b) => new Date(b.appliedAt || b.createdAt) - new Date(a.appliedAt || a.createdAt));
}

export async function saveCareerApplication(appData) {
  if (dbState.isConnected) {
    try {
      if (appData._id) return await CareerApplication.findByIdAndUpdate(appData._id, appData, { new: true, runValidators: true });
      return await CareerApplication.create({ status: 'received', ...appData });
    } catch (e) { console.warn('saveCareerApplication DB error:', e.message); }
  }
  const applications = readJSON('career-applications.json', []);
  const id = appData._id || `application_${Date.now()}`;
  const index = applications.findIndex(item => String(item._id) === String(id));
  const saved = { ...(index >= 0 ? applications[index] : {}), ...appData, _id: id, status: appData.status || applications[index]?.status || 'received', appliedAt: appData.appliedAt || applications[index]?.appliedAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (index >= 0) applications[index] = saved; else applications.push(saved);
  writeJSON('career-applications.json', applications);
  return saved;
}

export async function deleteCareerApplication(id) {
  if (dbState.isConnected) {
    try { return await CareerApplication.findByIdAndDelete(id); }
    catch (e) { console.warn('deleteCareerApplication DB error:', e.message); }
  }
  const applications = readJSON('career-applications.json', []).filter(item => String(item._id) !== String(id));
  writeJSON('career-applications.json', applications);
  return { _id: id };
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
  const limit = podcastLimit();
  if (!limit) return [];
  if (dbState.isConnected) {
    try { const podcasts = await Podcast.find().sort('-createdAt').limit(limit); if (podcasts.length) return podcasts; }
    catch (e) { console.warn('getPodcasts DB error:', e.message); }
  }
  return readJSON('podcasts.json', []).slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, limit);
}
export async function getAllPodcastsAdmin() {
  if (dbState.isConnected) {
    try { const podcasts = await Podcast.find().sort('-createdAt'); if (podcasts.length) return podcasts; }
    catch (e) { console.warn('getAllPodcastsAdmin DB error:', e.message); }
  }
  return readJSON('podcasts.json', []).slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}
export async function savePodcast(data) {
  const clean = validatePodcast(data);
  const podcasts = readJSON('podcasts.json', []);
  let saved = null;
  if (dbState.isConnected) {
    try {
      saved = data._id
        ? await Podcast.findByIdAndUpdate(data._id, clean, { new: true, runValidators: true })
        : await Podcast.create(clean);
    } catch (e) { console.warn('savePodcast DB error:', e.message); }
  }
  const idx = podcasts.findIndex(item => data._id && String(item._id) === String(data._id));
  const now = new Date().toISOString();
  const item = { ...(idx >= 0 ? podcasts[idx] : {}), ...clean, _id: data._id || `podcast_${Date.now()}`, updatedAt: now, createdAt: idx >= 0 ? podcasts[idx].createdAt : now };
  if (idx >= 0) podcasts[idx] = item; else podcasts.unshift(item);
  writeJSON('podcasts.json', podcasts);
  return saved || item;
}
export async function deletePodcast(id) {
  if (dbState.isConnected) {
    try { await Podcast.findByIdAndDelete(id); }
    catch (e) { console.warn('deletePodcast DB error:', e.message); }
  }
  writeJSON('podcasts.json', readJSON('podcasts.json', []).filter(item => String(item._id) !== String(id)));
  return { _id: id };
}
