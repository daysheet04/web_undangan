import { Hono } from 'hono';
import { database, many } from '../lib/database.js';
import { absoluteUrl, cleanText, invitationActiveUntil, invitationDateLabel, invitationInput, normalizeSlug, randomHex, RESERVED_SLUGS } from '../lib/helpers.js';
import { hasRealSupabaseConfig, invitationByToken, invitationExtras } from '../lib/repositories.js';

const editor = new Hono();
const DEMO_STATE = globalThis.__daymoment_demo_state__ || { orders: new Map() };

function demoInvitationByToken(token) {
  const order = [...(DEMO_STATE.orders.values() || [])].find((item) => item.editor_token === token);
  if (!order) return null;
  return {
    id: `demo-${order.order_code}`,
    editor_token: order.editor_token,
    order_id: order.order_id || order.id,
    order_status: order.status || 'editing',
    payment_status: 'paid',
    template_id: order.template_id,
    template_code: order.template_code,
    template_name: order.template_name,
    template_category: order.template_category,
    package_id: order.package_id,
    package_code: order.package_code,
    package_name: order.package_name,
    package_price: order.package_price,
    has_music: Boolean(order.package_has_music || order.has_music),
    has_gift: Boolean(order.package_has_gift || order.has_gift),
    has_wishes: Boolean(order.package_has_wishes || order.has_wishes),
    gallery_limit: order.gallery_limit || 2,
    slug: order.slug || 'demo-undangan',
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    is_active: Boolean(order.is_active),
    active_until: order.active_until || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: order.published_at || null,
  };
}

async function ensurePublishedActiveUntil(env, invitation) {
  if (invitation.order_status !== 'published' || !invitation.published_at || invitation.active_until) return invitation;
  const activeUntil = invitationActiveUntil(new Date(invitation.published_at));
  if (!hasRealSupabaseConfig(env)) {
    const order = [...(DEMO_STATE.orders.values() || [])].find((item) => item.editor_token === invitation.editor_token);
    if (order) order.active_until = activeUntil;
  } else {
    const { error } = await database(env).from('invitations').update({ active_until: activeUntil }).eq('id', invitation.id);
    if (error) throw error;
  }
  return { ...invitation, active_until: activeUntil };
}

async function slugState(env, input, invitationId) {
  const slug = normalizeSlug(input);
  let message = null;
  if (!slug) message = 'URL undangan wajib diisi.';
  else if (RESERVED_SLUGS.has(slug)) message = 'URL tersebut dipakai oleh sistem.';
  else if (hasRealSupabaseConfig(env)) {
    const db = database(env);
    const { count, error } = await db.from('invitations').select('id', { count: 'exact', head: true }).eq('slug', slug).neq('id', invitationId);
    if (error) throw error;
    if (count) message = 'URL tersebut sudah digunakan.';
  }
  const suggestions = [];
  if (message && hasRealSupabaseConfig(env)) {
    const base = RESERVED_SLUGS.has(slug) ? `${slug}-kami` : (slug || 'undangan');
    const db = database(env);
    for (let number = 2; suggestions.length < 3 && number < 20; number += 1) {
      const candidate = `${base.slice(0, 115)}-${number}`;
      const { count } = await db.from('invitations').select('id', { count: 'exact', head: true }).eq('slug', candidate).neq('id', invitationId);
      if (!count) suggestions.push(candidate);
    }
  }
  return { slug, available: !message, message, suggestions };
}

editor.get('/editor/:token', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) {
    let invitation = demoInvitationByToken(c.req.param('token'));
    if (!invitation) return c.json({ ok: false, message: 'Akses editor tidak valid.' }, 404);
    invitation = await ensurePublishedActiveUntil(c.env, invitation);
    return c.json({
      ok: true,
      invitation,
      media: [],
      giftAccounts: [],
      greetings: [],
      invitees: [],
      inviteeCount: 0,
      appUrl: c.env.APP_URL,
    });
  }
  let invitation = await invitationByToken(c.env, c.req.param('token'));
  invitation = await ensurePublishedActiveUntil(c.env, invitation);
  const extras = await invitationExtras(c.env, invitation.id);
  return c.json({ ok: true, invitation, ...extras, appUrl: c.env.APP_URL });
});

editor.post('/invitation/autosave', async (c) => {
  const input = await c.req.json();
  const invitation = await invitationByToken(c.env, cleanText(input.editor_token, 128));
  const clean = invitationInput(input, false);
  let slug = null;
  if (Object.hasOwn(input, 'slug')) {
    const state = await slugState(c.env, input.slug, invitation.id);
    slug = state;
    if (!String(input.slug || '').trim()) clean.slug = null;
    else if (state.available) clean.slug = state.slug;
  }
  if (Object.keys(clean).length) {
    if (!hasRealSupabaseConfig(c.env)) {
      const order = [...(DEMO_STATE.orders.values() || [])].find((item) => item.editor_token === invitation.editor_token);
      if (order) Object.assign(order, clean);
    } else {
    const { error } = await database(c.env).from('invitations').update(clean).eq('id', invitation.id);
    if (error) throw error;
    }
  }
  return c.json({ ok: true, message: 'Tersimpan', saved: clean, slug: slug?.slug || '', slug_available: slug?.available || false, slug_message: slug?.message || null, slug_suggestions: slug?.suggestions || [] });
});

function uploadRules(kind) {
  if (kind === 'music') return { max: 12 * 1024 * 1024, types: ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav'] };
  return { max: 2 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp'] };
}

function extension(file) {
  const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/x-wav': 'wav' };
  return map[file.type] || 'bin';
}

editor.post('/invitation/upload', async (c) => {
  const form = await c.req.formData();
  const invitation = await invitationByToken(c.env, cleanText(form.get('editor_token'), 128));
  const kind = cleanText(form.get('kind'), 20);
  const file = form.get('file') || form.get('photo');
  if (!['cover', 'gallery', 'groom', 'bride', 'music'].includes(kind) || !(file instanceof File)) return c.json({ ok: false, message: 'Jenis berkas tidak valid.' }, 422);
  if (kind === 'music' && !invitation.has_music) return c.json({ ok: false, message: `Fitur musik tidak tersedia pada paket ${invitation.package_name}.` }, 403);
  const rules = uploadRules(kind);
  if (!rules.types.includes(file.type)) return c.json({ ok: false, message: kind === 'music' ? 'Format musik harus MP3, M4A, OGG, atau WAV.' : 'Format foto harus JPG, PNG, atau WEBP.' }, 422);
  if (file.size > rules.max) return c.json({ ok: false, message: `Ukuran ${kind === 'music' ? 'musik' : 'foto'} terlalu besar.` }, 422);
  const db = database(c.env);
  if (kind === 'gallery') {
    const { count, error } = await db.from('invitation_media').select('id', { count: 'exact', head: true }).eq('invitation_id', invitation.id);
    if (error) throw error;
    if (count >= invitation.gallery_limit) return c.json({ ok: false, message: `Paket ${invitation.package_name} maksimal ${invitation.gallery_limit} foto galeri.` }, 422);
  }
  const key = `invitations/${invitation.id}/${kind}-${crypto.randomUUID()}.${extension(file)}`;
  await c.env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' }, customMetadata: { originalName: file.name.slice(0, 150) } });
  const path = key;
  if (kind === 'gallery') {
    const { data: mediaRows } = await many(db.from('invitation_media').select('sort_order').eq('invitation_id', invitation.id).order('sort_order', { ascending: false }).limit(1));
    const { data: media, error } = await db.from('invitation_media').insert({ invitation_id: invitation.id, file_path: path, sort_order: (mediaRows[0]?.sort_order ?? -1) + 1 }).select('*').single();
    if (error) throw error;
    return c.json({ ok: true, message: 'Foto galeri ditambahkan.', media: { ...media, url: `/media/${path}` } });
  }
  const field = { cover: 'cover_image', groom: 'groom_photo', bride: 'bride_photo', music: 'music_file' }[kind];
  const oldPath = invitation[field];
  const update = { [field]: path };
  if (kind === 'music') update.music_title = cleanText(file.name, 150) || 'Musik undangan';
  const { error } = await db.from('invitations').update(update).eq('id', invitation.id);
  if (error) throw error;
  if (oldPath) await c.env.MEDIA.delete(oldPath);
  return c.json({ ok: true, message: kind === 'music' ? 'Musik undangan tersimpan.' : 'Foto tersimpan.', path: `/media/${path}`, title: update.music_title });
});

editor.post('/invitation/delete-photo', async (c) => {
  const input = await c.req.json();
  const invitation = await invitationByToken(c.env, cleanText(input.editor_token, 128));
  const db = database(c.env);
  const { data: media, error } = await db.from('invitation_media').select('*').eq('id', Number(input.media_id)).eq('invitation_id', invitation.id).maybeSingle();
  if (error) throw error;
  if (!media) return c.json({ ok: false, message: 'Foto tidak ditemukan.' }, 404);
  const { error: deleteError } = await db.from('invitation_media').delete().eq('id', media.id);
  if (deleteError) throw deleteError;
  await c.env.MEDIA.delete(media.file_path);
  return c.json({ ok: true, message: 'Foto dihapus.' });
});

editor.post('/invitation/gift-accounts', async (c) => {
  const input = await c.req.json();
  const invitation = await invitationByToken(c.env, cleanText(input.editor_token, 128));
  if (!invitation.has_gift) return c.json({ ok: false, message: 'Amplop digital hanya tersedia pada paket Prestige.' }, 403);
  const accounts = Array.isArray(input.accounts) ? input.accounts.slice(0, 10).map((item, index) => ({
    invitation_id: invitation.id, provider: cleanText(item.provider, 80), account_number: cleanText(item.account_number, 100),
    account_name: cleanText(item.account_name, 150), label: cleanText(item.label, 100) || null, sort_order: index,
  })) : [];
  if (accounts.some((item) => !item.provider || !item.account_number || !item.account_name)) return c.json({ ok: false, message: 'Lengkapi bank/e-wallet, nomor, dan nama pemilik rekening.' }, 422);
  const db = database(c.env);
  const { error: deleteError } = await db.from('gift_accounts').delete().eq('invitation_id', invitation.id);
  if (deleteError) throw deleteError;
  if (accounts.length) {
    const { error } = await db.from('gift_accounts').insert(accounts);
    if (error) throw error;
  }
  return c.json({ ok: true, message: 'Daftar rekening hadiah tersimpan.', accounts });
});

editor.post('/invitation/invitees', async (c) => {
  const input = await c.req.json();
  const invitation = await invitationByToken(c.env, cleanText(input.editor_token, 128));
  const guestName = cleanText(input.guest_name, 150);
  const salutation = cleanText(input.salutation, 80) || 'Bapak/Ibu/Saudara/i';
  if (!guestName) return c.json({ ok: false, message: 'Nama tamu wajib diisi.' }, 422);
  const { data: guest, error } = await database(c.env).from('invitation_guests').insert({ invitation_id: invitation.id, guest_name: guestName, salutation, guest_token: randomHex(20) }).select('*').single();
  if (error) throw error;
  const linkAvailable = Boolean(
    invitation.order_status === 'published'
    && invitation.published_at
    && invitation.is_active
    && invitation.active_until
    && new Date(invitation.active_until) >= new Date()
    && invitation.slug
  );
  return c.json({
    ok: true,
    message: linkAvailable ? 'Tamu ditambahkan. Link personal siap dibagikan.' : 'Tamu ditambahkan. Link personal tersedia setelah undangan dipublish dan aktif.',
    guest: {
      ...guest,
      link_available: linkAvailable,
      url: linkAvailable ? absoluteUrl(c.env, `${invitation.slug}?to=${encodeURIComponent(guestName)}`) : null,
    },
  }, 201);
});

editor.post('/invitation/invitees/delete', async (c) => {
  const input = await c.req.json();
  const invitation = await invitationByToken(c.env, cleanText(input.editor_token, 128));
  const { data, error } = await database(c.env).from('invitation_guests').delete().eq('id', Number(input.guest_id)).eq('invitation_id', invitation.id).select('id');
  if (error) throw error;
  if (!data.length) return c.json({ ok: false, message: 'Tamu tidak ditemukan.' }, 404);
  return c.json({ ok: true, message: 'Tamu dihapus dari daftar.' });
});

editor.post('/invitation/publish', async (c) => {
  const input = await c.req.json();
  const invitation = await invitationByToken(c.env, cleanText(input.editor_token, 128));
  const clean = invitationInput(input, true);
  const required = {
    groom_full_name: 'Nama lengkap mempelai pria', groom_nickname: 'Nama panggilan mempelai pria', groom_father: 'Nama ayah mempelai pria', groom_mother: 'Nama ibu mempelai pria',
    bride_full_name: 'Nama lengkap mempelai wanita', bride_nickname: 'Nama panggilan mempelai wanita', bride_father: 'Nama ayah mempelai wanita', bride_mother: 'Nama ibu mempelai wanita',
    akad_date: 'Tanggal akad', akad_start_time: 'Jam mulai akad', akad_end_time: 'Jam selesai akad', reception_date: 'Tanggal resepsi',
    reception_start_time: 'Jam mulai resepsi', reception_end_time: 'Jam selesai resepsi', venue_name: 'Nama lokasi', venue_address: 'Alamat lengkap', love_story: 'Cerita pasangan',
  };
  const errors = {};
  for (const [field, label] of Object.entries(required)) if (!clean[field]) errors[field] = `${label} wajib diisi.`;
  if (!/^https?:\/\//i.test(clean.maps_url || '')) errors.maps_url = 'Link Google Maps harus berupa URL http/https yang valid.';
  const slug = await slugState(c.env, input.slug, invitation.id);
  if (!slug.available) errors.slug = slug.message;
  else clean.slug = slug.slug;
  if (Object.keys(errors).length) return c.json({ ok: false, message: 'Lengkapi data yang masih belum valid.', errors, slug_suggestions: slug.suggestions }, 422);
  const firstPublish = invitation.order_status !== 'published' || !invitation.published_at;
  const publishedAt = firstPublish ? new Date().toISOString() : invitation.published_at;
  const activeUntil = firstPublish || !invitation.active_until ? invitationActiveUntil(new Date(publishedAt)) : invitation.active_until;
  if (!hasRealSupabaseConfig(c.env)) {
    const order = [...(DEMO_STATE.orders.values() || [])].find((item) => item.editor_token === invitation.editor_token);
    if (order) {
      Object.assign(order, clean, { slug: clean.slug, status: 'published' });
      if (firstPublish) Object.assign(order, { published_at: publishedAt, is_active: true, active_until: activeUntil });
      else if (!invitation.active_until) order.active_until = activeUntil;
    }
    return c.json({ ok: true, message: 'Undangan berhasil diterbitkan.', first_publish: firstPublish, active_until: activeUntil, active_until_label: invitationDateLabel(activeUntil), redirect: `/success/${invitation.editor_token}` });
  }
  const db = database(c.env);
  const invitationUpdate = { ...clean };
  if (firstPublish) Object.assign(invitationUpdate, { published_at: publishedAt, is_active: true, active_until: activeUntil });
  else if (!invitation.active_until) invitationUpdate.active_until = activeUntil;
  const { error: invitationError } = await db.from('invitations').update(invitationUpdate).eq('id', invitation.id);
  if (invitationError) throw invitationError;
  const { error: orderError } = await db.from('orders').update({ status: 'published' }).eq('id', invitation.order_id);
  if (orderError) throw orderError;
  return c.json({ ok: true, message: 'Undangan berhasil diterbitkan.', first_publish: firstPublish, active_until: activeUntil, active_until_label: invitationDateLabel(activeUntil), redirect: `/success/${invitation.editor_token}` });
});

editor.get('/success/:token', async (c) => {
  const invitation = await invitationByToken(c.env, c.req.param('token'));
  if (!invitation.published_at) return c.json({ ok: false, message: 'Undangan belum diterbitkan.' }, 404);
  const perPage = 10;
  const page = Math.max(1, Number(c.req.query('page')) || 1);
  const extras = await invitationExtras(c.env, invitation.id, { guestPage: page, guestLimit: perPage });
  const pages = Math.max(1, Math.ceil(extras.inviteeCount / perPage));
  return c.json({ ok: true, invitation, invitees: extras.invitees, guestTotal: extras.inviteeCount, guestPage: Math.min(page, pages), guestPages: pages, activeUntilLabel: invitationDateLabel(invitation.active_until), publicUrl: absoluteUrl(c.env, invitation.slug), editorUrl: absoluteUrl(c.env, `edit/${invitation.editor_token}`) });
});

export default editor;
