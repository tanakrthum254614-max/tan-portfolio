import { formidable } from 'formidable';
import {
  ALLOWED_CATEGORIES,
  MAX_FILES,
  fail,
  handleCors,
  checkPasscode,
  cleanText,
  readGallery,
  writeGallery,
  saveImage
} from './_lib/store.js';

// Vercel's Node.js runtime auto-parses request bodies by default, which
// consumes the raw stream before formidable can read the multipart file
// data. Disabling it here is required for file uploads to work.
export const config = {
  api: {
    bodyParser: false
  }
};

async function parseForm(req) {
  const form = formidable({ multiples: true, maxFileSize: 10 * 1024 * 1024 });
  const [fields, files] = await form.parse(req);
  const get = (obj, key) => (Array.isArray(obj[key]) ? obj[key][0] : obj[key]);
  const rawPhotos = files.photos ? (Array.isArray(files.photos) ? files.photos : [files.photos]) : [];
  return {
    passcode: get(fields, 'passcode') || '',
    category: get(fields, 'category') || '',
    title: get(fields, 'title') || '',
    subtitle: get(fields, 'subtitle') || '',
    photos: rawPhotos
  };
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    try {
      const data = await readGallery();
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(data);
    } catch (err) {
      return fail(res, 500, 'Failed to load gallery: ' + err.message);
    }
  }

  if (req.method !== 'POST') {
    return fail(res, 405, 'Method not allowed');
  }

  let body;
  try {
    body = await parseForm(req);
  } catch (err) {
    return fail(res, 400, 'Could not read upload: ' + err.message);
  }

  if (!checkPasscode(body.passcode)) {
    return fail(res, 403, 'Incorrect passcode');
  }
  if (!ALLOWED_CATEGORIES.includes(body.category)) {
    return fail(res, 400, 'Invalid category');
  }
  const title = cleanText(body.title, 150);
  if (!title) {
    return fail(res, 400, 'Title is required');
  }
  const subtitle = cleanText(body.subtitle, 150);

  const files = body.photos.filter((f) => f && f.size > 0);
  if (files.length === 0) {
    return fail(res, 400, 'No files uploaded');
  }
  if (files.length > MAX_FILES) {
    return fail(res, 400, 'Too many files (max ' + MAX_FILES + ')');
  }

  let savedUrls;
  try {
    const fs = await import('node:fs/promises');
    savedUrls = await Promise.all(
      files.map(async (f) => {
        const buffer = await fs.readFile(f.filepath);
        return saveImage(buffer, f.mimetype, body.category);
      })
    );
  } catch (err) {
    return fail(res, err.statusCode || 500, err.message || 'Upload failed');
  }

  const entryId = `${body.category}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const entry = body.category === 'cert'
    ? { id: entryId, image: savedUrls[0], title, subtitle }
    : { id: entryId, images: savedUrls, title, subtitle };

  try {
    const data = await readGallery();
    data[body.category].push(entry);
    await writeGallery(data);
  } catch (err) {
    return fail(res, 500, 'Failed to save gallery: ' + err.message);
  }

  return res.status(200).json({ success: true, entry });
}
