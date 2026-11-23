import { normalizeSlug } from './helpers.js';

export const ADMIN_DEMO_NOTE_MARKER = '__ADMIN_DEMO_LINK__';
export const DEMO_PLACEHOLDER_EMAIL = 'demo@daymoment.id';

export function hasRealDemoRecipientEmail(email) {
  const clean = String(email || '').trim().toLowerCase();
  return Boolean(clean && clean !== DEMO_PLACEHOLDER_EMAIL);
}

export function isAdminDemoOrder(order) {
  if (!order || typeof order !== 'object') return false;
  const code = String(order.order_code || '').trim().toUpperCase();
  const note = String(order.complimentary_note || '').trim();
  const gateway = String(order.gateway || '').trim().toLowerCase();
  return code.startsWith('DEMO-') || note === ADMIN_DEMO_NOTE_MARKER || gateway === 'admin_demo';
}

export function buildDemoSlugBase(template, pkg) {
  const templateLabel = String(template?.name || template?.code || 'template').trim();
  const packageLabel = String(pkg?.code || pkg?.name || 'paket').trim();
  const normalized = normalizeSlug(`demo-${templateLabel}-${packageLabel}`).slice(0, 80).replace(/-+$/g, '');
  return normalized || 'demo-undangan';
}

export function demoActiveUntilIso(fromDate = new Date()) {
  const base = fromDate instanceof Date ? new Date(fromDate.getTime()) : new Date(fromDate);
  const valid = Number.isNaN(base.getTime()) ? new Date() : base;
  valid.setUTCFullYear(valid.getUTCFullYear() + 10);
  return valid.toISOString();
}

export function buildDemoInitialInvitationFields(fromDate = new Date()) {
  const base = fromDate instanceof Date ? new Date(fromDate.getTime()) : new Date(fromDate);
  const target = Number.isNaN(base.getTime()) ? new Date() : base;
  target.setUTCDate(target.getUTCDate() + 60);
  const yyyy = target.getUTCFullYear();
  const mm = String(target.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(target.getUTCDate()).padStart(2, '0');
  const eventDate = `${yyyy}-${mm}-${dd}`;

  return {
    groom_full_name: 'Raka Mahendra Putra',
    groom_nickname: 'Raka',
    groom_father: 'Bapak Hendra Wijaya',
    groom_mother: 'Ibu Sari Kusuma',
    bride_full_name: 'Nadia Larasati Putri',
    bride_nickname: 'Nadia',
    bride_father: 'Bapak Bambang Pratama',
    bride_mother: 'Ibu Dewi Lestari',
    akad_date: eventDate,
    akad_start_time: '08:00',
    akad_end_time: '10:00',
    reception_date: eventDate,
    reception_start_time: '11:00',
    reception_end_time: '14:00',
    venue_name: 'Pendopo Agung Nusantara',
    venue_address: 'Jl. Kemang Raya No. 28, Jakarta Selatan, DKI Jakarta',
    maps_url: 'https://maps.google.com/?q=Jakarta+Selatan',
    love_story: 'Dipertemukan dalam langkah yang sederhana, kami berdua melangkah menuju hari bahagia dengan doa dan restu keluarga tercinta.',
  };
}

export function extractR2Key(value) {
  const raw = String(value || '').trim();
  if (!raw || raw.startsWith('data:')) return null;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (parsed.pathname.startsWith('/media/')) {
        return parsed.pathname.slice('/media/'.length).replace(/^\/+/, '') || null;
      }
      return null;
    } catch {
      return null;
    }
  }
  if (raw.startsWith('/media/')) {
    return raw.slice('/media/'.length).replace(/^\/+/, '') || null;
  }
  if (raw.startsWith('/')) return null;
  return raw.replace(/^\/+/, '') || null;
}

export async function collectInvitationR2Keys(env, db, invitation) {
  const keys = new Set();
  if (!invitation?.id) return keys;

  [
    invitation.cover_image,
    invitation.groom_photo,
    invitation.bride_photo,
    invitation.music_file,
  ]
    .map(extractR2Key)
    .filter(Boolean)
    .forEach((key) => keys.add(key));

  if (db) {
    try {
      const { data: mediaRows } = await db
        .from('invitation_media')
        .select('file_path')
        .eq('invitation_id', invitation.id);
      (mediaRows || [])
        .map((row) => extractR2Key(row?.file_path))
        .filter(Boolean)
        .forEach((key) => keys.add(key));
    } catch {}
  }

  if (env?.MEDIA && typeof env.MEDIA.list === 'function') {
    const prefix = `invitations/${invitation.id}/`;
    let cursor;
    try {
      do {
        const listed = await env.MEDIA.list({ prefix, cursor });
        for (const obj of listed?.objects || []) {
          if (obj?.key) keys.add(obj.key);
        }
        cursor = listed?.truncated ? listed.cursor : undefined;
      } while (cursor);
    } catch {}
  }

  return keys;
}

export async function deleteR2KeysAndCache(env, keys, slug) {
  if (slug) {
    try {
      const edgeCache = globalThis.caches?.default;
      if (edgeCache) {
        await edgeCache.delete(new Request(`https://daymoment-cache.local/invitations/${encodeURIComponent(slug)}`));
      }
    } catch {}
  }

  if (env?.MEDIA && keys && keys.size > 0) {
    await Promise.allSettled([...keys].map((key) => env.MEDIA.delete(key).catch(() => {})));
  }
}
