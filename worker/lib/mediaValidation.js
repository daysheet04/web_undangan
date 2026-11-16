/**
 * Media upload magic-byte verification and strict public R2 serving helpers.
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav'];
export const ALLOWED_AUDIO_EXTENSIONS = ['mp3', 'm4a', 'ogg', 'wav'];

export const PUBLIC_MEDIA_PREFIXES = [
  'invitations/',
  'template-covers/',
  'template-phone-covers/',
  'template-photos/',
  'template-gallery/',
  'template-music/',
  'homepage/hero/',
];

function startsWithBytes(bytes, signature, offset = 0) {
  if (bytes.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i += 1) {
    if (bytes[offset + i] !== signature[i]) return false;
  }
  return true;
}

export function detectImageMimeFromBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 3) return null;
  // JPEG: FF D8 FF
  if (startsWithBytes(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  // WEBP: RIFF....WEBP
  if (
    bytes.length >= 12 &&
    startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46], 0) &&
    startsWithBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'image/webp';
  }
  return null;
}

export function detectAudioMimeFromBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 4) return null;
  // MP3 with binary ID3v2 header: "ID3" + version (2..4) + synchsafe size bytes
  if (
    bytes.length >= 10 &&
    startsWithBytes(bytes, [0x49, 0x44, 0x33]) &&
    bytes[3] >= 2 &&
    bytes[3] <= 4 &&
    (bytes[6] & 0x80) === 0 &&
    (bytes[7] & 0x80) === 0 &&
    (bytes[8] & 0x80) === 0 &&
    (bytes[9] & 0x80) === 0
  ) {
    return 'audio/mpeg';
  }
  // Raw MP3 MPEG frame sync: 11 set bits (FF Ex), version != 01, layer != 00
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0 && (bytes[1] & 0x18) !== 0x08 && (bytes[1] & 0x06) !== 0x00) {
    return 'audio/mpeg';
  }
  // OGG: "OggS" + stream structure version 0x00
  if (bytes.length >= 5 && startsWithBytes(bytes, [0x4f, 0x67, 0x67, 0x53]) && bytes[4] === 0x00) {
    return 'audio/ogg';
  }
  // WAV: RIFF....WAVE
  if (
    bytes.length >= 12 &&
    startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46], 0) &&
    startsWithBytes(bytes, [0x57, 0x41, 0x56, 0x45], 8)
  ) {
    return 'audio/wav';
  }
  // M4A / MP4 ISO BMFF: big-endian ftyp box size + "ftyp"
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x00 &&
    bytes[1] === 0x00 &&
    bytes[2] === 0x00 &&
    bytes[3] >= 0x08 &&
    startsWithBytes(bytes, [0x66, 0x74, 0x79, 0x70], 4)
  ) {
    return 'audio/mp4';
  }
  return null;
}

async function readMagicBytes(file, length = 16) {
  if (!(file instanceof File) || file.size <= 0) return null;
  const buf = await file.slice(0, length).arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Verifies both client MIME header and binary file magic bytes for uploaded images.
 */
export async function validImageFile(file, allowedTypes = ALLOWED_IMAGE_TYPES) {
  if (!(file instanceof File) || !allowedTypes.includes(file.type)) return false;
  const bytes = await readMagicBytes(file, 16);
  const detected = detectImageMimeFromBytes(bytes);
  return Boolean(detected && allowedTypes.includes(detected));
}

/**
 * Verifies metadata and binary audio container/frame magic bytes for uploaded music.
 */
export async function validAudioFile(file, allowedTypes = ALLOWED_AUDIO_TYPES, allowedExts = ALLOWED_AUDIO_EXTENSIONS) {
  if (!(file instanceof File)) return false;
  const ext = String(file.name || '').split('.').pop().toLowerCase();
  const type = String(file.type || '').toLowerCase();
  const extendedAudioTypes = new Set([...allowedTypes, 'audio/mp3', 'audio/x-m4a']);
  const hasAllowedType = extendedAudioTypes.has(type);
  const hasFallbackExt = (!type || type === 'application/octet-stream') && allowedExts.includes(ext);
  if (!hasAllowedType && !hasFallbackExt) return false;
  const bytes = await readMagicBytes(file, 16);
  return Boolean(detectAudioMimeFromBytes(bytes));
}

/**
 * Validates either image or audio upload depending on the allowed MIME set.
 */
export async function validUploadedMedia(file, allowedTypes) {
  const expectsAudio = Array.isArray(allowedTypes) && allowedTypes.some((t) => String(t).startsWith('audio/'));
  return expectsAudio ? validAudioFile(file, allowedTypes) : validImageFile(file, allowedTypes);
}

/**
 * Serves only strictly allowlisted public R2 object prefixes after path sanitization.
 */
export async function servePublicR2Media(c, stripPrefixRegex, { notFoundMessage = 'Berkas tidak ditemukan.' } = {}) {
  if (!c.env?.MEDIA) {
    return c.json({ ok: false, message: notFoundMessage }, 404);
  }
  const rawPath = c.req.path.replace(stripPrefixRegex, '');
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return c.json({ ok: false, message: 'Permintaan berkas tidak valid.' }, 400);
  }

  const key = decoded.replace(/^\/+/, '');
  if (
    !key ||
    key.includes('\0') ||
    key.includes('\\') ||
    key.split('/').some((seg) => !seg || seg === '.' || seg === '..') ||
    !PUBLIC_MEDIA_PREFIXES.some((prefix) => key.startsWith(prefix))
  ) {
    return c.json({ ok: false, message: notFoundMessage }, 404);
  }

  const object = await c.env.MEDIA.get(key);
  if (!object) return c.json({ ok: false, message: notFoundMessage }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  const contentType = String(headers.get('content-type') || '').toLowerCase();
  if (!contentType || contentType.includes('html') || contentType.includes('svg') || contentType.includes('javascript') || contentType.includes('xml')) {
    headers.set('content-type', 'application/octet-stream');
  }
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', headers.get('cache-control') || 'public, max-age=31536000, immutable');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('content-disposition', 'inline');
  headers.set('access-control-allow-origin', '*');
  headers.set('cross-origin-resource-policy', 'cross-origin');
  return new Response(object.body, { headers });
}
