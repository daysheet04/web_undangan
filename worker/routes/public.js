import { Hono } from 'hono';
import { database } from '../lib/database.js';
import { cleanText } from '../lib/helpers.js';
import { invitationExtras, publishedInvitation } from '../lib/repositories.js';
import { sendFeedbackToFormSubmit } from '../lib/formsubmit.js';

const publicRoutes = new Hono();

publicRoutes.get('/invitations/:slug', async (c) => {
  const slug = c.req.param('slug');
  const edgeCache = globalThis.caches?.default;
  const cacheRequest = new Request(`https://daymoment-cache.local/invitations/${encodeURIComponent(slug)}`);
  const bypassCache = c.req.query('fresh') === '1' || c.req.header('Cache-Control')?.includes('no-cache');
  const isLocalDev = Boolean(c.env.APP_URL && (c.env.APP_URL.includes('localhost') || c.env.APP_URL.includes('127.0.0.1')));
  const cached = (!bypassCache && !isLocalDev && edgeCache) ? await edgeCache.match(cacheRequest) : null;
  let core;
  if (cached) {
    core = await cached.json();
    if (core?.invitation?.is_active === false) {
      if (edgeCache) c.executionCtx.waitUntil(edgeCache.delete(cacheRequest));
      const error = new Error('Undangan ini sedang dinonaktifkan oleh pemilik atau admin.');
      error.status = 403;
      error.code = 'INVITATION_DEACTIVATED';
      throw error;
    }
  } else {
    const invitation = await publishedInvitation(c.env, slug);
    const extras = await invitationExtras(c.env, invitation.id);
    core = { invitation, ...extras };
    if (edgeCache && !isLocalDev && invitation.is_active !== false) {
      const response = new Response(JSON.stringify(core), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
      });
      c.executionCtx.waitUntil(edgeCache.put(cacheRequest, response));
    }
  }
  const guestName = cleanText(c.req.query('to'), 150) || 'Bapak/Ibu/Saudara/i';
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  return c.json({ ok: true, ...core, guestName, guestSalutation: 'Kepada Yth.', isPreview: false });
});

publicRoutes.post('/greetings', async (c) => {
  const input = await c.req.json();
  const invitation = await publishedInvitation(c.env, cleanText(input.slug, 120));
  if (!invitation.has_wishes) return c.json({ ok: false, message: 'Fitur ucapan tidak tersedia untuk undangan ini.' }, 403);
  const guestName = cleanText(input.guest_name, 120);
  const attendance = cleanText(input.attendance_status, 30);
  const guestCount = Math.max(1, Math.min(10, Number(input.guest_count) || 1));
  const message = cleanText(input.message, 500);
  const errors = {};
  if (!guestName) errors.guest_name = 'Nama wajib diisi.';
  if (!['attending', 'not_attending', 'unsure'].includes(attendance)) errors.attendance_status = 'Pilih status kehadiran.';
  if (!message) errors.message = 'Ucapan wajib diisi.';
  if (Object.keys(errors).length) return c.json({ ok: false, message: 'Periksa kembali form ucapan.', errors }, 422);
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'local';
  const rateRequest = new Request(`https://daymoment-rate.local/greeting/${invitation.id}/${encodeURIComponent(ip)}`);
  if (await caches.default.match(rateRequest)) return c.json({ ok: false, message: 'Tunggu beberapa detik sebelum mengirim ucapan lagi.' }, 429);
  const { data: greeting, error } = await database(c.env).from('guest_messages').insert({ invitation_id: invitation.id, guest_name: guestName, attendance_status: attendance, guest_count: guestCount, message }).select('id,guest_name,attendance_status,guest_count,message,created_at').single();
  if (error) throw error;
  c.executionCtx.waitUntil(caches.default.put(rateRequest, new Response('1', { headers: { 'Cache-Control': 'max-age=10' } })));
  return c.json({ ok: true, message: 'Terima kasih, ucapan Anda sudah terkirim.', greeting: { ...greeting, created_at: 'Baru saja' } }, 201);
});

publicRoutes.post('/feedback', async (c) => {
  let input;
  try {
    input = await c.req.json();
  } catch {
    return c.json({ ok: false, message: 'Data masukan tidak valid.' }, 400);
  }

  const name = cleanText(input?.name, 120);
  const message = cleanText(input?.message, 1000);

  const errors = {};
  if (!name) errors.name = 'Nama wajib diisi.';
  if (!message || message.length < 3) errors.message = 'Saran atau kritik minimal 3 karakter.';
  if (Object.keys(errors).length) {
    return c.json({ ok: false, message: errors.name || errors.message, errors }, 422);
  }

  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'local';
  const edgeCache = globalThis.caches?.default;
  if (edgeCache) {
    const rateRequest = new Request(`https://daymoment-rate.local/feedback/${encodeURIComponent(ip)}`);
    if (await edgeCache.match(rateRequest)) {
      return c.json({ ok: false, message: 'Tunggu beberapa detik sebelum mengirim saran lagi.' }, 429);
    }
    c.executionCtx.waitUntil(edgeCache.put(rateRequest, new Response('1', { headers: { 'Cache-Control': 'max-age=10' } })));
  }

  try {
    const db = database(c.env);
    if (db) {
      const { error } = await db.from('feedback_messages').insert({
        name,
        message,
      });
      if (error && !['42P01', 'PGRST205'].includes(error.code)) {
        console.warn('Feedback save warning:', error.message);
      }
    }
  } catch (err) {
    console.warn('Feedback db error:', err.message);
  }

  if (!globalThis.__daymoment_demo_feedbacks__) {
    globalThis.__daymoment_demo_feedbacks__ = [];
  }
  globalThis.__daymoment_demo_feedbacks__.unshift({
    id: Date.now(),
    name,
    message,
    created_at: new Date().toISOString(),
  });

  const formSubmitTask = sendFeedbackToFormSubmit(c.env, {
    name,
    message,
    ip,
    origin: c.req.header('Origin'),
    referer: c.req.header('Referer'),
  });

  if (c.executionCtx?.waitUntil) {
    c.executionCtx.waitUntil(formSubmitTask);
  } else {
    formSubmitTask.catch((err) => console.warn('[Feedback] FormSubmit notice:', err?.message || err));
  }

  return c.json({
    ok: true,
    message: 'Terima kasih atas saran dan masukan yang Anda berikan.',
  }, 201);
});

export default publicRoutes;

