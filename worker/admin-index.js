import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import admin from './routes/admin.js';
import catalog from './routes/catalog.js';

const app = new Hono();

app.use('*', secureHeaders());
app.use('/api/*', cors({
  origin: (origin) => origin || 'http://localhost:8081',
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Accept'],
  credentials: true,
}));
app.route('/api', admin);
app.route('/api', catalog);

app.get('/media/*', async (c) => {
  const key = decodeURIComponent(c.req.path.replace(/^\/media\//, ''));
  if (key.startsWith('affiliate-ktp/') || key.startsWith('affiliate-proofs/')) {
    return c.json({ ok: false, message: 'Berkas tidak ditemukan.' }, 404);
  }
  if (!c.env?.MEDIA) return c.json({ ok: false, message: 'Storage tidak tersedia.' }, 404);
  const object = await c.env.MEDIA.get(key);
  if (!object) return c.json({ ok: false, message: 'Berkas tidak ditemukan.' }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', headers.get('cache-control') || 'public, max-age=31536000, immutable');
  headers.set('access-control-allow-origin', '*');
  return new Response(object.body, { headers });
});

app.get('/api/health', (c) => c.json({ ok: true, service: 'daymoment-admin', runtime: 'cloudflare-workers' }));

app.notFound((c) => c.json({ ok: false, message: 'Endpoint admin tidak ditemukan.' }, 404));
app.onError((error, c) => {
  console.error(error);
  return c.json({ ok: false, message: error.message || 'Terjadi kesalahan pada server admin.' }, error.status || 500);
});

export default app;
