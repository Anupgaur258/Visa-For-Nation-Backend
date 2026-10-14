import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { dbState } from '../config/db.js';
import { Page, Post, Inquiry, CMSContent, SEOMetadata, Admin } from '../models/index.js';

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

export async function getInquiries({ category, country, status, q, page = 1, limit } = {}) {
   // parse limit from env or use default
   const limitNum = limit ? parseInt(limit) : (process.env.INQUIRY_PAGE_LIMIT ? parseInt(process.env.INQUIRY_PAGE_LIMIT) : 10);
   const pageNum = parseInt(page);
   const skip = (pageNum - 1) * limitNum;

   let items = [];
   let total = 0;
   if (dbState.isConnected) {
     try {
       const filter = {};
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
       if (items.length > 0) {
         return { inquiries: items, total, page: pageNum, limit: limitNum };
       }
     } catch (e) {
       console.warn("getInquiries DB error:", e.message);
     }
   }

   // Fallback to JSON
   items = readJSON("inquiries.json", []);
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
export async function getPosts(category) {
  if (dbState.isConnected) {
    try {
      const f = { status: 'published' };
      if (category) f.category = category;
      const posts = await Post.find(f).select('-content').sort('-createdAt');
      if (posts.length > 0) return posts;
    } catch (e) {}
  }
  let posts = readJSON('posts.json', []);
  if (category) posts = posts.filter(p => p.category === category);
  return posts.map(({ content, ...rest }) => rest);
}

export async function getPostBySlug(slug) {
  if (dbState.isConnected) {
    try {
      const post = await Post.findOneAndUpdate({ slug, status: 'published' }, { $inc: { views: 1 } }, { new: true });
      if (post) {
        const related = await Post.find({ status: 'published', _id: { $ne: post._id } }).select('-content').sort('-createdAt').limit(3);
        return { post, related };
      }
    } catch (e) {}
  }
  const posts = readJSON('posts.json', []);
  const post = posts.find(p => p.slug === slug);
  if (!post) return null;
  post.views = (post.views || 0) + 1;
  const related = posts.filter(p => p.slug !== slug).slice(0, 3).map(({ content, ...rest }) => rest);
  return { post, related };
}

export async function getAllPostsAdmin() {
  if (dbState.isConnected) {
    try {
      const posts = await Post.find().sort('-createdAt');
      if (posts.length > 0) return posts;
    } catch (e) {}
  }
  return readJSON('posts.json', []);
}

export async function savePost(data) {
  let saved = null;
  if (!data.slug && data.title) {
    data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (dbState.isConnected) {
    try {
      if (data._id && String(data._id).length === 24) {
        saved = await Post.findByIdAndUpdate(data._id, data, { new: true });
      } else {
        saved = await Post.findOneAndUpdate({ slug: data.slug }, data, { upsert: true, new: true });
      }
    } catch (e) {}
  }
  const posts = readJSON('posts.json', []);
  const idx = posts.findIndex(p => p.slug === data.slug || (data._id && String(p._id) === String(data._id)));
  if (idx >= 0) {
    posts[idx] = { ...posts[idx], ...data, updatedAt: new Date().toISOString() };
    saved = saved || posts[idx];
  } else {
    const newItem = { _id: data._id || 'post_' + Date.now(), ...data, createdAt: new Date().toISOString() };
    posts.unshift(newItem);
    saved = saved || newItem;
  }
  writeJSON('posts.json', posts);
  return saved;
}

export async function deletePost(id) {
  if (dbState.isConnected) {
    try {
      await Post.findByIdAndDelete(id);
    } catch (e) {}
  }
  let posts = readJSON('posts.json', []);
  posts = posts.filter(p => String(p._id) !== String(id) && p.slug !== String(id));
  writeJSON('posts.json', posts);
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
