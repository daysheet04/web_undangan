import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import catalog from './routes/catalog.js';
import orders from './routes/orders.js';
import editor from './routes/editor.js';
import publicRoutes from './routes/public.js';

const app = new Hono();

app.use('*', secureHeaders());
app.use('/api/*', cors({
  origin: (origin) => origin || 'http://localhost:8080',
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Accept'],
  credentials: true,
}));

// ─── Cache headers middleware ────────────────────────────────────────────────
// Vite build assets have content-hashed filenames → safe to cache immutably for 1 year.
// HTML pages and API responses must not be cached.
app.use('*', async (c, next) => {
  await next();
  const path = c.req.path;
  const res = c.res;

  // Vite-emitted assets: /assets/xxx-[hash].js / .css / images etc.
  // These filenames change on every build → immutable cache is safe.
  if (/^\/assets\/[^/]+-[a-f0-9]{8,}\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|webp|avif|svg|gif|ico)$/i.test(path)) {
    res.headers.set('cache-control', 'public, max-age=31536000, immutable');
    return;
  }

  // Public static assets that don't have hashes (images, fonts in /assets/images, /assets/css, /assets/js)
  // Use a shorter TTL + stale-while-revalidate for safer updates.
  if (/^\/(assets|favicon\.svg|robots\.txt|sitemap\.xml)/.test(path) && !path.startsWith('/api')) {
    const isImmutableExt = /\.(webp|avif|woff2?|ttf|otf|png|jpg|jpeg|gif)$/i.test(path);
    if (isImmutableExt) {
      res.headers.set('cache-control', 'public, max-age=2592000, stale-while-revalidate=86400'); // 30d + 1d SWR
    } else {
      res.headers.set('cache-control', 'public, max-age=3600, stale-while-revalidate=300'); // 1h + 5min SWR
    }
    return;
  }

  // HTML / SPA shell: no store (always re-fetch), but allow revalidation.
  if (path === '/' || (!path.startsWith('/api') && !path.startsWith('/media') && !path.includes('.'))) {
    res.headers.set('cache-control', 'no-cache');
    return;
  }
});

app.route('/api', catalog);
app.route('/api', orders);
app.route('/api', editor);
app.route('/api', publicRoutes);

app.get('/api/health', (c) => c.json({ ok: true, service: 'daymoment', runtime: 'cloudflare-workers' }));

app.get('/media/*', async (c) => {
  const key = decodeURIComponent(c.req.path.replace(/^\/media\//, ''));
  if (key.startsWith('affiliate-ktp/') || key.startsWith('affiliate-proofs/')) {
    return c.json({ ok: false, message: 'Berkas tidak ditemukan.' }, 404);
  }
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
  return c.json({ ok: false, message: error.message || 'Terjadi kesalahan pada server.', code: error.code || null }, error.status || 500);
});

export default app;
