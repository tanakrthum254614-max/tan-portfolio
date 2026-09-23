import { put, del, list } from '@vercel/blob';
import sharp from 'sharp';

export const ALLOWED_CATEGORIES = ['cert', 'training'];
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB per upload
export const MAX_FILES = 5;
export const MAX_DIMENSION = 1600; // longest side after resize

const GALLERY_PATHNAME = 'data/gallery.json';

// Point-in-time seed so the gallery works the moment the site is deployed,
// before anyone has added/edited anything through the live Blob store.
// These reference the static /images files that ship in the deployment itself
// (not Blob) — real uploads made later via the Add/Edit UI get stored in Blob
// and get full https:// URLs instead.
const SEED_GALLERY = {
  cert: [
    { id: 'cert-internal-audit', image: '/images/cert-internal-audit.jpg', title: 'Internal Audit — ISO 19011:2018 for ISO 9001:2015', subtitle: 'Worldwide Training · May 15, 2026' },
    { id: 'cert-iso9001', image: '/images/cert-iso9001.jpg', title: 'ISO 9001:2015 — Awareness and Requirements Training', subtitle: 'Worldwide Training · May 14, 2026' },
    { id: 'cert-pdpa', image: '/images/cert-pdpa.jpg', title: 'PDPA & Data Cybersecurity', subtitle: 'PDPA Consultant and Training Co., Ltd. · August 24, 2026' },
    { id: 'cert-google-apps-script', image: '/images/cert-google-apps-script.jpg', title: 'Google Apps Script (GAS) Fundamentals — From Zero to a Working Web App', subtitle: 'พงศ์ศิริ ทองสอาดศรี · September 20, 2026' }
  ],
  training: [
    { id: 'training-csr-mangrove', images: ['/images/training-csr-mangrove-1.jpg', '/images/training-csr-mangrove-2.jpg'], title: 'กิจกรรมเพื่อสังคม CSR — ปลูกป่าชายเลนฟื้นฟูระบบนิเวศทรัพยากรธรรมชาติ', subtitle: 'Viserve Enterprise · August 22, 2026' },
    { id: 'training-iso-audit-2026', images: ['/images/training-iso-audit-2026-1.jpg', '/images/training-iso-audit-2026-2.jpg'], title: 'ตรวจ ISO 9001:2015 ประจำปี 2569', subtitle: 'Viserve Enterprise · Annual Audit 2026' },
    { id: 'training-pdpa-session', images: ['/images/training-pdpa-session.jpg'], title: 'PDPA & Data Cybersecurity', subtitle: 'Viserve Enterprise · Team Training' },
    { id: 'training-fire-drill-2026', images: ['/images/training-fire-drill-2026.jpg'], title: 'การอบรมอพยพหนีไฟ ประจำปี 2569', subtitle: 'Fire Drill and Evacuation Training · September 15, 2026' }
  ]
};

const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': { ext: 'jpg', sharpFormat: 'jpeg' },
  'image/png': { ext: 'png', sharpFormat: 'png' },
  'image/webp': { ext: 'webp', sharpFormat: 'webp' }
};

export function fail(res, status, message) {
  res.status(status).json({ success: false, error: message });
}

export function checkPasscode(provided) {
  const expected = process.env.GALLERY_PASSCODE;
  if (!expected) return false; // never allow writes if the env var isn't configured
  return typeof provided === 'string' && provided.length > 0 && provided === expected;
}

export function cleanText(value, maxLen) {
  const v = String(value ?? '').trim().replace(/[\x00-\x1F\x7F]/g, '');
  return v.length > maxLen ? v.slice(0, maxLen) : v;
}

/** Find the current gallery.json blob (if any already exists) via its stable pathname. */
async function findGalleryBlob() {
  const { blobs } = await list({ prefix: GALLERY_PATHNAME, limit: 1 });
  return blobs.find((b) => b.pathname === GALLERY_PATHNAME) || null;
}

export async function readGallery() {
  let blob;
  try {
    blob = await findGalleryBlob();
  } catch {
    // Blob store not reachable/configured yet (e.g. BLOB_READ_WRITE_TOKEN
    // missing) — show the seed content instead of a broken page.
    return structuredClone(SEED_GALLERY);
  }
  if (!blob) {
    return structuredClone(SEED_GALLERY);
  }
  // Vercel Blob's public CDN can serve a cached copy of the file for a short
  // window after an overwrite; a cache-busting query param plus no-store
  // forces a fresh read so add/edit/delete never operate on stale data.
  const freshUrl = blob.url + (blob.url.includes('?') ? '&' : '?') + '_=' + Date.now();
  const res = await fetch(freshUrl, { cache: 'no-store' });
  if (!res.ok) return structuredClone(SEED_GALLERY);
  const data = await res.json().catch(() => null);
  if (!data || typeof data !== 'object') return structuredClone(SEED_GALLERY);
  for (const cat of ALLOWED_CATEGORIES) {
    if (!Array.isArray(data[cat])) data[cat] = [];
  }
  return data;
}

export async function writeGallery(data) {
  await put(GALLERY_PATHNAME, JSON.stringify(data, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

/**
 * Resize (downscale only) an uploaded image buffer and store it in Blob.
 * Returns the public URL to save into gallery.json.
 */
export async function saveImage(buffer, mimeType, category) {
  const type = ALLOWED_IMAGE_TYPES[mimeType];
  if (!type) {
    throw Object.assign(new Error('Only JPG, PNG or WEBP images are allowed'), { statusCode: 400 });
  }

  let outBuffer = buffer;
  try {
    const img = sharp(buffer, { limitInputPixels: 268402689 });
    const meta = await img.metadata();
    const longest = Math.max(meta.width || 0, meta.height || 0);
    const pipeline = longest > MAX_DIMENSION
      ? img.resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      : img;
    outBuffer = await pipeline.toFormat(type.sharpFormat, { quality: 85 }).toBuffer();
  } catch (err) {
    // If sharp can't process it for any reason, fall back to the original bytes
    // rather than failing the whole upload.
    outBuffer = buffer;
  }

  const safeName = `${category}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}.${type.ext}`;
  const blob = await put(`images/${safeName}`, outBuffer, {
    access: 'public',
    contentType: mimeType,
    addRandomSuffix: false
  });
  return blob.url;
}

export async function deleteImage(url) {
  try {
    await del(url);
  } catch {
    // best-effort — a missing/already-deleted blob shouldn't fail the request
  }
}
