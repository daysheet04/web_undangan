import { Hono } from 'hono';
import { cors } from 'hono/cors';
import catalog from './routes/catalog.js';
import orders from './routes/orders.js';
import editor from './routes/editor.js';
import publicRoutes from './routes/public.js';
import {
  applySecurityHeaders,
  enforceHttpsRedirect,
  resolveAllowedCorsOrigin,
  serveAssetWithSecurityHeaders,
} from './lib/securityHeaders.js';
import { servePublicR2Media } from './lib/mediaValidation.js';
import { maskedErrorResponse, normalizeThrownError } from './lib/errors.js';

const app = new Hono();

app.use('*', async (c, next) => {
  const redirect = enforceHttpsRedirect(c.req.raw);
  if (redirect) return redirect;

  try {
    await next();
  } catch (error) {
    throw normalizeThrownError(error);
  }

  applySecurityHeaders(c.res.headers, c.req.path, {
    frameAncestors: "'self'",
    xFrameOptions: 'SAMEORIGIN',
    allowPaymentSnap: c.req.path.startsWith('/payment/'),
  });
});

app.use('/api/*', cors({
  origin: (origin, c) => resolveAllowedCorsOrigin(origin, c.req.url, c.env),
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
  if (/^\/(assets|favicon|apple-touch-icon|robots\.txt|sitemap\.xml)/.test(path) && !path.startsWith('/api')) {
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

app.get('/media/*', (c) => servePublicR2Media(c, /^\/media\//));

app.get('/api/admin/media/*', (c) => servePublicR2Media(c, /^\/api\/admin\/media\//));

app.all('*', async (c, next) => {
  const path = c.req.path;
  if (path === '/api' || path.startsWith('/api/') || path.startsWith('/media/') || !c.env?.ASSETS) {
    return next();
  }
  return serveAssetWithSecurityHeaders(c, {
    frameAncestors: "'self'",
    xFrameOptions: 'SAMEORIGIN',
    allowPaymentSnap: (assetPath) => assetPath.startsWith('/payment/'),
  });
});

app.notFound((c) => c.json({ ok: false, message: 'Endpoint tidak ditemukan.' }, 404));
app.onError((error, c) => maskedErrorResponse(error, c, 'Terjadi kesalahan pada server.'));

export default app;
