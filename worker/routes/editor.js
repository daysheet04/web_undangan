import { Hono } from 'hono';
import { database, many } from '../lib/database.js';
import { absoluteUrl, cleanText, invitationActiveUntil, invitationDateLabel, invitationInput, normalizeSlug, randomHex, RESERVED_SLUGS } from '../lib/helpers.js';
import { findActiveSlugConflict, hasRealSupabaseConfig, invitationByToken, invitationExtras, activeTemplates, canonicalTemplateCode } from '../lib/repositories.js';

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
    is_active: Boolean(order.is_active && order.website_enabled !== false),
    active_until: order.active_until || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: order.published_at || null,
  };
}

async function purgeInvitationCache(slug) {
  if (!slug) return;
  try {
    const edgeCache = globalThis.caches?.default;
    if (edgeCache) {
      const cacheRequest = new Request(`https://daymoment-cache.local/invitations/${encodeURIComponent(slug)}`);
      await edgeCache.delete(cacheRequest);
    }
  } catch (err) {
    console.warn('Failed to purge edge cache for slug', slug, err);
  }
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
  else {
    const conflict = await findActiveSlugConflict(env, slug, { excludeInvitationId: invitationId });
    if (conflict) {
      message = 'URL undangan ini sudah aktif digunakan oleh undangan lain. Silakan pilih URL lain.';
    }
  }
  const suggestions = [];
  if (message && slug) {
    const base = RESERVED_SLUGS.has(slug) ? `${slug}-kami` : (slug || 'undangan');
    for (let number = 2; suggestions.length < 3 && number < 20; number += 1) {
      const candidate = `${base.slice(0, 115)}-${number}`;
      const conflict = await findActiveSlugConflict(env, candidate, { excludeInvitationId: invitationId });
      if (!conflict && !RESERVED_SLUGS.has(candidate)) {
        suggestions.push(candidate);
      }
    }
  }
  return { slug, available: !message, message, suggestions };
}

editor.get('/editor/:token', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) {
    let invitation = demoInvitationByToken(c.req.param('token'));
    if (!invitation) return c.json({ ok: false, message: 'Akses editor tidak valid.' }, 404);
    if (invitation.order_status === 'cancelled') {
      return c.json({ ok: false, message: 'Pesanan ini telah dibatalkan.', code: 'ORDER_CANCELLED' }, 403);
    }
    invitation = await ensurePublishedActiveUntil(c.env, invitation);
    const allTpls = await activeTemplates(c.env);
    const currentPkgCode = String(invitation.package_code || 'signature').toLowerCase().trim();
    const availableTemplates = allTpls
      .filter((t) => t.is_active !== false)
      .map((t) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        category: t.category,
        description: t.description,
        thumbnail: t.thumbnail,
        is_current: t.code === invitation.template_code,
        supported: (t.packages || []).some((p) => String(p.code || '').toLowerCase().trim() === currentPkgCode),
      }));

    return c.json({
      ok: true,
      invitation,
      media: [],
      giftAccounts: [],
      greetings: [],
      invitees: [],
      inviteeCount: 0,
      availableTemplates,
      appUrl: c.env.APP_URL,
    });
  }
  let invitation = await invitationByToken(c.env, c.req.param('token'));
  invitation = await ensurePublishedActiveUntil(c.env, invitation);
  const extras = await invitationExtras(c.env, invitation.id);

  const allTpls = await activeTemplates(c.env);
  const currentPkgCode = String(invitation.package_code || 'signature').toLowerCase().trim();
  const availableTemplates = allTpls
    .filter((t) => t.is_active !== false)
    .map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      category: t.category,
      description: t.description,
      thumbnail: t.thumbnail,
      is_current: t.code === invitation.template_code,
      supported: (t.packages || []).some((p) => String(p.code || '').toLowerCase().trim() === currentPkgCode),
    }));

  return c.json({ ok: true, invitation, ...extras, availableTemplates, appUrl: c.env.APP_URL });
});

editor.post('/invitation/change-template', async (c) => {
  const input = await c.req.json();
  const token = cleanText(input.editor_token, 128);
  const targetCode = cleanText(input.template_code, 64);

  if (!token || !targetCode) {
    return c.json({ ok: false, message: 'Parameter tidak lengkap.' }, 400);
  }

  const invitation = await invitationByToken(c.env, token);
  const currentPkgCode = String(invitation.package_code || 'signature').toLowerCase().trim();

  const allTpls = await activeTemplates(c.env);
  const targetClean = canonicalTemplateCode(targetCode);
  const targetTemplate = allTpls.find(
    (t) => canonicalTemplateCode(t.code) === targetClean || t.code === targetCode
  );

  if (!targetTemplate) {
    return c.json({ ok: false, message: 'Tema yang dipilih tidak ditemukan.' }, 404);
  }

  // Find matching package tier on the target template matching current package code
  const matchingPkg = (targetTemplate.packages || targetTemplate.template_packages || []).find(
    (p) => String(p.code || '').toLowerCase().trim() === currentPkgCode
  );

  if (!matchingPkg) {
    return c.json({
      ok: false,
      message: `Tema ${targetTemplate.name} tidak mendukung paket ${invitation.package_name}.`,
    }, 400);
  }

  if (!hasRealSupabaseConfig(c.env)) {
    const order = [...(DEMO_STATE.orders.values() || [])].find((item) => item.editor_token === invitation.editor_token);
    if (order) {
      order.template_id = targetTemplate.id;
      order.template_code = targetTemplate.code;
      order.template_name = targetTemplate.name;
      order.template_category = targetTemplate.category;
      order.package_id = matchingPkg.id;
      order.package_code = matchingPkg.code;
      order.package_name = matchingPkg.name;
      order.gallery_limit = matchingPkg.gallery_limit || order.gallery_limit;
    }
  } else {
    const db = database(c.env);
    const { error: updateError } = await db
      .from('orders')
      .update({
        template_id: targetTemplate.id,
        package_id: matchingPkg.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.order_id);

    if (updateError) {
      console.error('Failed to change template on order:', updateError);
      return c.json({ ok: false, message: 'Gagal memperbarui tema di database.' }, 500);
    }
  }

  if (invitation.slug) {
    await purgeInvitationCache(invitation.slug);
  }

  return c.json({
    ok: true,
    message: `Tema berhasil diganti menjadi ${targetTemplate.name}.`,
    template_code: targetTemplate.code,
    template_name: targetTemplate.name,
    package_code: matchingPkg.code,
    package_name: matchingPkg.name,
  });
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
  await purgeInvitationCache(invitation.slug);
  return c.json({ ok: true, message: 'Tersimpan', saved: clean, slug: slug?.slug || '', slug_available: slug?.available || false, slug_message: slug?.message || null, slug_suggestions: slug?.suggestions || [] });
});

function uploadRules(kind) {
  if (kind === 'music') return { max: 12 * 1024 * 1024, types: ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav'] };
  if (kind === 'custom_couple') return { max: 15 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp'] };
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
  if (!['cover', 'gallery', 'groom', 'bride', 'music', 'custom_couple'].includes(kind) || !(file instanceof File)) return c.json({ ok: false, message: 'Jenis berkas tidak valid.' }, 422);
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
  const key = `invitations/${invitation.id}/${kind === 'custom_couple' ? 'custom-couple' : kind}-${crypto.randomUUID()}.${extension(file)}`;
  await c.env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' }, customMetadata: { originalName: file.name.slice(0, 150) } });
  const path = key;
  if (kind === 'custom_couple') {
    const { data: existingRows } = await many(db.from('invitation_media').select('*').eq('invitation_id', invitation.id).like('file_path', '%custom-couple%'));
    const { data: media, error } = await db.from('invitation_media').insert({ invitation_id: invitation.id, file_path: path, sort_order: 999 }).select('*').single();
    if (error) throw error;
    if (existingRows?.length) {
      for (const oldRow of existingRows) {
        await db.from('invitation_media').delete().eq('id', oldRow.id);
        await c.env.MEDIA.delete(oldRow.file_path);
      }
    }
    await purgeInvitationCache(invitation.slug);
    return c.json({ ok: true, message: 'Wajah pasangan 3D berhasil disimpan.', path: `/media/${path}`, media: { ...media, url: `/media/${path}` } });
  }
  if (kind === 'gallery') {
    const replaceMediaId = form.get('media_id');
    if (replaceMediaId) {
      const { data: existingMedia } = await db.from('invitation_media').select('*').eq('id', Number(replaceMediaId)).eq('invitation_id', invitation.id).maybeSingle();
      if (existingMedia) {
        await db.from('invitation_media').update({ file_path: path }).eq('id', existingMedia.id);
        if (existingMedia.file_path) {
          try { await c.env.MEDIA.delete(existingMedia.file_path); } catch {}
        }
        await purgeInvitationCache(invitation.slug);
        return c.json({ ok: true, message: 'Posisi foto galeri diperbarui.', path: `/media/${path}`, media: { ...existingMedia, file_path: path, url: `/media/${path}` } });
      }
    }
    const { count, error } = await db.from('invitation_media').select('id', { count: 'exact', head: true }).eq('invitation_id', invitation.id);
    if (error) throw error;
    if (count >= invitation.gallery_limit) return c.json({ ok: false, message: `Paket ${invitation.package_name} maksimal ${invitation.gallery_limit} foto galeri.` }, 422);
    const { data: mediaRows } = await many(db.from('invitation_media').select('sort_order').eq('invitation_id', invitation.id).order('sort_order', { ascending: false }).limit(1));
    const { data: media, error: insertError } = await db.from('invitation_media').insert({ invitation_id: invitation.id, file_path: path, sort_order: (mediaRows[0]?.sort_order ?? -1) + 1 }).select('*').single();
    if (insertError) throw insertError;
    await purgeInvitationCache(invitation.slug);
    return c.json({ ok: true, message: 'Foto galeri ditambahkan.', path: `/media/${path}`, media: { ...media, url: `/media/${path}` } });
  }
  const field = { cover: 'cover_image', groom: 'groom_photo', bride: 'bride_photo', music: 'music_file' }[kind];
  const oldPath = invitation[field];
  const update = { [field]: path };
  if (kind === 'music') update.music_title = cleanText(file.name, 150) || 'Musik undangan';
  const { error } = await db.from('invitations').update(update).eq('id', invitation.id);
  if (error) throw error;
  if (oldPath) await c.env.MEDIA.delete(oldPath);
  await purgeInvitationCache(invitation.slug);
  return c.json({ ok: true, message: kind === 'music' ? 'Musik undangan tersimpan.' : 'Foto tersimpan.', path: `/media/${path}`, title: update.music_title });
});

editor.post('/invitation/reset-custom-couple', async (c) => {
  const input = await c.req.json();
  const invitation = await invitationByToken(c.env, cleanText(input.editor_token, 128));
  const db = database(c.env);
  const { data: existingRows } = await many(db.from('invitation_media').select('*').eq('invitation_id', invitation.id).like('file_path', '%custom-couple%'));
  if (existingRows?.length) {
    for (const row of existingRows) {
      await db.from('invitation_media').delete().eq('id', row.id);
      await c.env.MEDIA.delete(row.file_path);
    }
  }
  await purgeInvitationCache(invitation.slug);
  return c.json({ ok: true, message: 'Karakter 3D dikembalikan ke setelan awal.' });
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
  await purgeInvitationCache(invitation.slug);
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

const normalizePhone = (input) => {
  if (!input) return '';
  let d = String(input).replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('6208')) d = '628' + d.slice(4);
  else if (d.startsWith('08')) d = '628' + d.slice(2);
  else if (d.startsWith('8')) d = '628' + d.slice(1);
  else if (d.startsWith('0')) d = '62' + d.slice(1);
  return d;
};

editor.post('/invitation/invitees', async (c) => {
  const input = await c.req.json();
  const invitation = await invitationByToken(c.env, cleanText(input.editor_token, 128));
  const guestName = cleanText(input.guest_name, 150);
  const salutation = cleanText(input.salutation, 80) || 'Bapak/Ibu/Saudara/i';
  const rawPhone = cleanText(input.phone || input.phone_number, 35);
  const cleanPhone = normalizePhone(rawPhone);
  if (!guestName) return c.json({ ok: false, message: 'Nama tamu wajib diisi.' }, 422);

  const db = database(c.env);
  const { data: existingRows } = await db
    .from('invitation_guests')
    .select('id, guest_name, guest_token')
    .eq('invitation_id', invitation.id);

  const nameKey = guestName.toLowerCase().trim();
  const nameExists = (existingRows || []).some(r => (r.guest_name || '').toLowerCase().trim() === nameKey);
  const phoneExists = cleanPhone && (existingRows || []).some(r => {
    if (r.guest_token?.startsWith('wa:')) {
      const p = r.guest_token.split(':')[1];
      return p === cleanPhone;
    }
    return false;
  });

  if (nameExists || phoneExists) {
    return c.json({
      ok: false,
      message: phoneExists
        ? 'Tamu dengan nomor WhatsApp ini sudah ada di daftar.'
        : `Tamu dengan nama "${guestName}" sudah ada di daftar.`
    }, 409);
  }

  const guestToken = cleanPhone ? `wa:${cleanPhone}:${randomHex(8)}` : randomHex(20);
  const { data: guest, error } = await db.from('invitation_guests').insert({ invitation_id: invitation.id, guest_name: guestName, salutation, guest_token: guestToken }).select('*').single();
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
      phone_number: cleanPhone,
      link_available: linkAvailable,
      url: linkAvailable ? absoluteUrl(c.env, `${invitation.slug}?to=${encodeURIComponent(guestName)}`) : null,
    },
  }, 201);
});

editor.post('/invitation/invitees/batch', async (c) => {
  const input = await c.req.json();
  const invitation = await invitationByToken(c.env, cleanText(input.editor_token, 128));
  const rawGuests = Array.isArray(input.guests) ? input.guests : [];
  if (!rawGuests.length) return c.json({ ok: false, message: 'Tidak ada data tamu yang dikirim.' }, 422);

  const linkAvailable = Boolean(
    invitation.order_status === 'published'
    && invitation.published_at
    && invitation.is_active
    && invitation.active_until
    && new Date(invitation.active_until) >= new Date()
    && invitation.slug
  );

  const defaultSalutation = cleanText(input.salutation, 80) || 'Bapak/Ibu/Saudara/i';
  const db = database(c.env);

  // Fetch all existing guests for this invitation to deduplicate
  const { data: existingRows } = await db
    .from('invitation_guests')
    .select('id, guest_name, guest_token')
    .eq('invitation_id', invitation.id);

  const existingNames = new Set((existingRows || []).map(r => (r.guest_name || '').toLowerCase().trim()));
  const existingPhones = new Set();
  (existingRows || []).forEach(r => {
    if (r.guest_token?.startsWith('wa:')) {
      const p = r.guest_token.split(':')[1];
      if (p) existingPhones.add(p);
    }
  });

  const batchSeenNames = new Set();
  const batchSeenPhones = new Set();
  const toInsert = [];
  let duplicateCount = 0;

  for (const g of rawGuests) {
    const name = cleanText(g.guest_name || g.name, 150);
    if (!name) continue;
    const nameKey = name.toLowerCase().trim();
    const rawP = cleanText(g.phone || g.phone_number, 35);
    const cleanP = normalizePhone(rawP);

    // If phone exists and already registered, skip duplicate
    if (cleanP && (existingPhones.has(cleanP) || batchSeenPhones.has(cleanP))) {
      duplicateCount++;
      continue;
    }

    // If name matches existing or already seen in batch, skip duplicate
    if (existingNames.has(nameKey) || batchSeenNames.has(nameKey)) {
      duplicateCount++;
      continue;
    }

    batchSeenNames.add(nameKey);
    if (cleanP) batchSeenPhones.add(cleanP);

    const salutation = cleanText(g.salutation, 80) || defaultSalutation;
    const token = cleanP ? `wa:${cleanP}:${randomHex(8)}` : randomHex(20);

    toInsert.push({
      invitation_id: invitation.id,
      guest_name: name,
      salutation,
      guest_token: token,
    });
  }

  if (!toInsert.length) {
    if (duplicateCount > 0) {
      return c.json({
        ok: true,
        message: `Semua tamu (${duplicateCount} orang) sudah ada di dalam daftar undangan. Tidak ada tamu baru yang ditambahkan.`,
        guests: [],
        skipped: duplicateCount,
      });
    }
    return c.json({ ok: false, message: 'Tidak ada nama tamu yang valid untuk disimpan.' }, 422);
  }

  const insertedGuests = [];
  const chunkSize = 50;

  for (let i = 0; i < toInsert.length; i += chunkSize) {
    const chunk = toInsert.slice(i, i + chunkSize);
    const { data, error } = await db.from('invitation_guests').insert(chunk).select('*');
    if (error) throw error;
    if (data) insertedGuests.push(...data);
  }

  const resultGuests = insertedGuests.map(guest => {
    const rawP = guest.phone_number || (guest.guest_token?.startsWith('wa:') ? guest.guest_token.split(':')[1] : '');
    const phone = normalizePhone(rawP);
    return {
      ...guest,
      phone_number: phone,
      link_available: linkAvailable,
      url: linkAvailable ? absoluteUrl(c.env, `${invitation.slug}?to=${encodeURIComponent(guest.guest_name)}`) : null,
    };
  });

  const message = duplicateCount > 0
    ? `Berhasil menambahkan ${resultGuests.length} tamu baru (${duplicateCount} tamu dilewati karena sudah ada).`
    : `Berhasil menambahkan ${resultGuests.length} tamu.`;

  return c.json({
    ok: true,
    message,
    guests: resultGuests,
    skipped: duplicateCount,
  }, 201);
});

editor.patch('/invitation/invitees/:id', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const invitation = await invitationByToken(c.env, cleanText(input.editor_token, 128));
  const guestId = Number(c.req.param('id'));
  const guestName = cleanText(input.guest_name, 150);
  const salutation = cleanText(input.salutation, 80) || 'Bapak/Ibu/Saudara/i';
  const cleanPhone = normalizePhone(cleanText(input.phone || input.phone_number, 35));
  if (!Number.isFinite(guestId) || guestId <= 0) return c.json({ ok: false, message: 'Data tamu tidak valid.' }, 422);
  if (!guestName) return c.json({ ok: false, message: 'Nama tamu wajib diisi.' }, 422);

  if (!hasRealSupabaseConfig(c.env)) {
    return c.json({
      ok: true,
      message: 'Data tamu berhasil diperbarui.',
      guest: {
        id: guestId,
        guest_name: guestName,
        salutation,
        phone_number: cleanPhone,
        guest_token: cleanPhone ? `wa:${cleanPhone}:demo` : 'demo-token',
      },
    });
  }

  const db = database(c.env);
  const { data: current, error: currentError } = await db
    .from('invitation_guests')
    .select('id,guest_name,salutation,guest_token')
    .eq('id', guestId)
    .eq('invitation_id', invitation.id)
    .maybeSingle();
  if (currentError) throw currentError;
  if (!current) return c.json({ ok: false, message: 'Tamu tidak ditemukan.' }, 404);

  const { data: otherGuests, error: listError } = await db
    .from('invitation_guests')
    .select('id,guest_name,guest_token')
    .eq('invitation_id', invitation.id)
    .neq('id', guestId);
  if (listError) throw listError;
  const nameKey = guestName.toLowerCase().trim();
  const duplicateName = (otherGuests || []).some((guest) => String(guest.guest_name || '').toLowerCase().trim() === nameKey);
  const duplicatePhone = cleanPhone && (otherGuests || []).some((guest) => guest.guest_token?.startsWith('wa:') && guest.guest_token.split(':')[1] === cleanPhone);
  if (duplicateName || duplicatePhone) {
    return c.json({ ok: false, message: duplicatePhone ? 'Nomor WhatsApp tersebut sudah dipakai tamu lain.' : `Tamu dengan nama "${guestName}" sudah ada di daftar.` }, 409);
  }

  const guestToken = cleanPhone
    ? `wa:${cleanPhone}:${randomHex(8)}`
    : current.guest_token?.startsWith('wa:') ? randomHex(20) : current.guest_token;
  const { data: guest, error } = await db
    .from('invitation_guests')
    .update({ guest_name: guestName, salutation, guest_token: guestToken })
    .eq('id', guestId)
    .eq('invitation_id', invitation.id)
    .select('*')
    .single();
  if (error) throw error;
  return c.json({ ok: true, message: 'Data tamu berhasil diperbarui.', guest: { ...guest, phone_number: cleanPhone } });
});

editor.post('/invitation/invitees/delete', async (c) => {
  const input = await c.req.json();
  const invitation = await invitationByToken(c.env, cleanText(input.editor_token, 128));

  let ids = [];
  if (Array.isArray(input.guest_ids)) {
    ids = input.guest_ids.map(Number).filter(n => Number.isFinite(n) && n > 0);
  } else if (input.guest_id) {
    const singleId = Number(input.guest_id);
    if (Number.isFinite(singleId) && singleId > 0) ids.push(singleId);
  }

  if (!ids.length) {
    return c.json({ ok: false, message: 'Tidak ada tamu yang dipilih untuk dihapus.' }, 422);
  }

  const { data, error } = await database(c.env)
    .from('invitation_guests')
    .delete()
    .in('id', ids)
    .eq('invitation_id', invitation.id)
    .select('id');

  if (error) throw error;
  if (!data || !data.length) {
    return c.json({ ok: false, message: 'Tamu tidak ditemukan atau sudah dihapus.' }, 404);
  }

  const count = data.length;
  const message = count === 1
    ? 'Tamu dihapus dari daftar.'
    : `Berhasil menghapus ${count} tamu dari daftar.`;

  return c.json({ ok: true, message, deleted_ids: data.map(d => d.id) });
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
