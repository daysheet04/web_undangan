import { Hono } from 'hono';
import { database, many } from '../lib/database.js';
import { absoluteUrl, cleanText, invitationInput, normalizeSlug, randomHex, RESERVED_SLUGS } from '../lib/helpers.js';
import { activeTemplates, invitationByToken, invitationExtras, templateByCode } from '../lib/repositories.js';

const editor = new Hono();

async function slugState(env, input, invitationId) {
  const slug = normalizeSlug(input);
  let message = null;
  if (!slug) message = 'URL undangan wajib diisi.';
  else if (RESERVED_SLUGS.has(slug)) message = 'URL tersebut dipakai oleh sistem.';
  else {
    const db = database(env);
    const { count, error } = await db.from('invitations').select('id', { count: 'exact', head: true }).eq('slug', slug).neq('id', invitationId);
    if (error) throw error;
    if (count) message = 'URL tersebut sudah digunakan.';
  }
  const suggestions = [];
  if (message) {
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
  const invitation = await invitationByToken(c.env, c.req.param('token'));
  const extras = await invitationExtras(c.env, invitation.id);
  return c.json({ ok: true, invitation, ...extras, templates: await activeTemplates(c.env), appUrl: c.env.APP_URL });
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
    const { error } = await database(c.env).from('invitations').update(clean).eq('id', invitation.id);
    if (error) throw error;
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
  return c.json({ ok: true, message: 'Tamu ditambahkan.', guest: { ...guest, url: absoluteUrl(c.env, `${invitation.slug || 'preview-undangan'}?to=${encodeURIComponent(guestName)}`) } }, 201);
});

editor.post('/invitation/invitees/delete', async (c) => {
  const input = await c.req.json();
  const invitation = await invitationByToken(c.env, cleanText(input.editor_token, 128));
  const { data, error } = await database(c.env).from('invitation_guests').delete().eq('id', Number(input.guest_id)).eq('invitation_id', invitation.id).select('id');
  if (error) throw error;
  if (!data.length) return c.json({ ok: false, message: 'Tamu tidak ditemukan.' }, 404);
  return c.json({ ok: true, message: 'Tamu dihapus dari daftar.' });
});

editor.post('/invitation/change-template', async (c) => {
  const input = await c.req.json();
  const invitation = await invitationByToken(c.env, cleanText(input.editor_token, 128));
  const template = await templateByCode(c.env, cleanText(input.template_code, 50));
  const selectedPackage = template.packages.find((item) => item.code === invitation.package_code);
  if (!selectedPackage) return c.json({ ok: false, message: 'Paket yang sama belum tersedia pada template ini.' }, 422);
  const { error } = await database(c.env).from('orders').update({ template_id: template.id, package_id: selectedPackage.id }).eq('id', invitation.order_id);
  if (error) throw error;
  return c.json({ ok: true, message: 'Template berhasil diganti tanpa mengubah data.', template: { code: template.code, name: template.name } });
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
  const db = database(c.env);
  const { error: invitationError } = await db.from('invitations').update({ ...clean, published_at: new Date().toISOString() }).eq('id', invitation.id);
  if (invitationError) throw invitationError;
  const { error: orderError } = await db.from('orders').update({ status: 'published' }).eq('id', invitation.order_id);
  if (orderError) throw orderError;
  return c.json({ ok: true, message: 'Undangan berhasil diterbitkan.', redirect: `/success/${invitation.editor_token}` });
});

editor.get('/success/:token', async (c) => {
  const invitation = await invitationByToken(c.env, c.req.param('token'));
  if (!invitation.published_at) return c.json({ ok: false, message: 'Undangan belum diterbitkan.' }, 404);
  const perPage = 10;
  const page = Math.max(1, Number(c.req.query('page')) || 1);
  const extras = await invitationExtras(c.env, invitation.id, { guestPage: page, guestLimit: perPage });
  const pages = Math.max(1, Math.ceil(extras.inviteeCount / perPage));
  return c.json({ ok: true, invitation, invitees: extras.invitees, guestTotal: extras.inviteeCount, guestPage: Math.min(page, pages), guestPages: pages, publicUrl: absoluteUrl(c.env, invitation.slug), editorUrl: absoluteUrl(c.env, `edit/${invitation.editor_token}`) });
});

export default editor;
