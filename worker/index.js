import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import catalog from './routes/catalog.js';
import orders from './routes/orders.js';
import editor from './routes/editor.js';
import admin from './routes/admin.js';
import publicRoutes from './routes/public.js';

const app = new Hono();

app.use('*', secureHeaders());
app.use('*', async (c, next) => {
  if (c.env.ADMIN_HOST_MODE === 'true' && c.req.path === '/') return c.redirect('/admin');
  return next();
});
app.use('/api/*', cors({
  origin: (origin) => origin || 'http://localhost:8080',
  allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Accept'],
  credentials: true,
}));
app.route('/api', catalog);
app.route('/api', orders);
app.route('/api', editor);
app.route('/api', admin);
app.route('/api', publicRoutes);

app.get('/api/health', (c) => c.json({ ok: true, service: 'daymoment', runtime: 'cloudflare-workers' }));

app.get('/admin', async (c) => {
  const response = await c.env.ASSETS.fetch(c.req.raw);
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-store, max-age=0, must-revalidate');
  return new Response(response.body, { status: response.status, headers });
});

app.get('/media/*', async (c) => {
  const key = decodeURIComponent(c.req.path.replace(/^\/media\//, ''));
  const object = await c.env.MEDIA.get(key);
  if (!object) return c.json({ ok: false, message: 'Berkas tidak ditemukan.' }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', headers.get('cache-control') || 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
});

app.notFound((c) => c.json({ ok: false, message: 'Endpoint tidak ditemukan.' }, 404));
app.onError((error, c) => {
  console.error(error);
  return c.json({ ok: false, message: error.message || 'Terjadi kesalahan pada server.' }, error.status || 500);
});

export default app;
