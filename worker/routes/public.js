import { Hono } from 'hono';
import { database } from '../lib/database.js';
import { cleanText } from '../lib/helpers.js';
import { invitationExtras, publishedInvitation } from '../lib/repositories.js';

const publicRoutes = new Hono();

publicRoutes.get('/invitations/:slug', async (c) => {
  const invitation = await publishedInvitation(c.env, c.req.param('slug'));
  const extras = await invitationExtras(c.env, invitation.id);
  const guestName = cleanText(c.req.query('to'), 150) || 'Bapak/Ibu/Saudara/i';
  return c.json({ ok: true, invitation, ...extras, guestName, guestSalutation: 'Kepada Yth.', isPreview: false });
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

export default publicRoutes;
