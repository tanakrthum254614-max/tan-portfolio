import { formidable } from 'formidable';
import {
  ALLOWED_CATEGORIES,
  MAX_FILES,
  fail,
  checkPasscode,
  cleanText,
  readGallery,
  writeGallery,
  saveImage,
  deleteImage,
  isSeedId
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
    action: get(fields, 'action') || '',
    id: get(fields, 'id') || '',
    title: get(fields, 'title') || '',
    subtitle: get(fields, 'subtitle') || '',
    photos: rawPhotos.filter((f) => f && f.size > 0)
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return fail(res, 405, 'Method not allowed');
  }

  let body;
  try {
    body = await parseForm(req);
  } catch (err) {
    return fail(res, 400, 'Could not read request: ' + err.message);
  }

  if (!checkPasscode(body.passcode)) {
    return fail(res, 403, 'Incorrect passcode');
  }
  if (!ALLOWED_CATEGORIES.includes(body.category)) {
    return fail(res, 400, 'Invalid category');
  }
  if (!body.id) {
    return fail(res, 400, 'Missing entry id');
  }
  if (!['edit', 'delete'].includes(body.action)) {
    return fail(res, 400, 'Invalid action');
  }

  const data = await readGallery();
  const list = data[body.category];
  const index = list.findIndex((item) => item.id === body.id);
  if (index === -1) {
    return fail(res, 404, 'Entry not found');
  }

  if (body.action === 'delete') {
    const entry = list[index];
    const urls = body.category === 'cert' ? [entry.image] : entry.images || [];
    await Promise.all(urls.filter(Boolean).map((u) => deleteImage(u)));
    list.splice(index, 1);
    if (isSeedId(body.category, body.id)) {
      data.removedSeedIds = [...(data.removedSeedIds || []), body.id];
    }
    try {
      await writeGallery(data);
    } catch (err) {
      return fail(res, 500, 'Failed to save gallery: ' + err.message);
    }
    return res.status(200).json({ success: true });
  }

  // action === 'edit'
  const title = cleanText(body.title, 150);
  if (!title) {
    return fail(res, 400, 'Title is required');
  }
  const subtitle = cleanText(body.subtitle, 150);

  const entry = list[index];
  entry.title = title;
  entry.subtitle = subtitle;

  if (body.photos.length > 0) {
    if (body.photos.length > MAX_FILES) {
      return fail(res, 400, 'Too many files (max ' + MAX_FILES + ')');
    }
    let newUrls;
    try {
      const fs = await import('node:fs/promises');
      newUrls = await Promise.all(
        body.photos.map(async (f) => {
          const buffer = await fs.readFile(f.filepath);
          return saveImage(buffer, f.mimetype, body.category);
        })
      );
    } catch (err) {
      return fail(res, err.statusCode || 500, err.message || 'Upload failed');
    }
    const oldUrls = body.category === 'cert' ? [entry.image] : entry.images || [];
    await Promise.all(oldUrls.filter(Boolean).map((u) => deleteImage(u)));
    if (body.category === 'cert') {
      entry.image = newUrls[0];
    } else {
      entry.images = newUrls;
    }
  }

  list[index] = entry;
  try {
    await writeGallery(data);
  } catch (err) {
    return fail(res, 500, 'Failed to save gallery: ' + err.message);
  }

  return res.status(200).json({ success: true, entry });
}
