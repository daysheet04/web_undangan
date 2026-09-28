export const RESERVED_SLUGS = new Set(['admin', 'api', 'assets', 'media', 'uploads', 'template', 'order', 'payment', 'edit', 'publish', 'success']);

export function cleanText(value, max = 255) {
  return String(value ?? '').replace(/<[^>]*>/g, '').trim().slice(0, max);
}

export function normalizeSlug(value) {
  return cleanText(value, 120).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function normalizePhone(value) {
  const phone = String(value ?? '').replace(/[\s().-]/g, '');
  return phone.startsWith('08') ? `+62${phone.slice(1)}` : phone;
}

export function validPhone(value) {
  return /^(?:\+62|62|0)8[1-9][0-9]{6,12}$/.test(String(value ?? '').replace(/[\s().-]/g, ''));
}

export function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim()) && String(value ?? '').trim().length <= 254;
}

export function randomHex(bytes = 24) {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return [...values].map((value) => value.toString(16).padStart(2, '0')).join('');
}

export function orderCode() {
  const now = new Date();
  const date = `${String(now.getUTCFullYear()).slice(-2)}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
  return `INV-${date}-${randomHex(4).toUpperCase()}`;
}

export const INVITATION_TIME_ZONE = 'Asia/Jakarta';

function datePartsInJakarta(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: INVITATION_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const number = (type) => Number(parts.find((part) => part.type === type)?.value);
  return { year: number('year'), month: number('month'), day: number('day') };
}

export function invitationActiveUntil(value = new Date()) {
  const current = datePartsInJakarta(value);
  const targetMonthIndex = current.month - 1 + 2;
  const year = current.year + Math.floor(targetMonthIndex / 12);
  const month = (targetMonthIndex % 12) + 1;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(current.day, lastDay);
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return new Date(`${date}T23:59:59.999+07:00`).toISOString();
}

export function invitationDateLabel(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: INVITATION_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export function jsonError(message, status = 400, details = {}) {
  return { ok: false, message, status, ...details };
}

export const EDITABLE_FIELDS = {
  groom_full_name: 150, groom_nickname: 80, groom_father: 150, groom_mother: 150,
  bride_full_name: 150, bride_nickname: 80, bride_father: 150, bride_mother: 150,
  akad_date: 10, akad_start_time: 8, akad_end_time: 8, reception_date: 10,
  reception_start_time: 8, reception_end_time: 8, venue_name: 180,
  venue_address: 1500, maps_url: 500, love_story: 3000, instagram: 100,
};

export function invitationInput(input, includeSlug = true) {
  const output = {};
  for (const [field, limit] of Object.entries(EDITABLE_FIELDS)) {
    if (Object.hasOwn(input, field)) output[field] = cleanText(input[field], limit) || null;
  }
  if (output.instagram) output.instagram = output.instagram.replace(/^@/, '');
  if (includeSlug && Object.hasOwn(input, 'slug')) output.slug = normalizeSlug(input.slug) || null;
  return output;
}

export function absoluteUrl(env, path = '') {
  return `${String(env.APP_URL || '').replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
}
