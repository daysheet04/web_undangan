import { Hono } from 'hono';
import { cors } from 'hono/cors';
import affiliate from './routes/affiliate.js';
import {
  applySecurityHeaders,
  enforceHttpsRedirect,
  serveAssetWithSecurityHeaders,
} from './lib/securityHeaders.js';

const app = new Hono();

app.use('*', async (c, next) => {
  const redirect = enforceHttpsRedirect(c.req.raw);
  if (redirect) return redirect;

  await next();

  applySecurityHeaders(c.res.headers, c.req.path, {
    frameAncestors: "'none'",
    xFrameOptions: 'DENY',
    allowPaymentSnap: true,
  });
});

const allowedAffiliateOrigins = new Set([
  'http://localhost:8082',
  'http://127.0.0.1:8082',
  'https://affiliate.daymoment.id',
]);

const allowedSessionReadOrigins = new Set([
  ...allowedAffiliateOrigins,
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'https://daymoment.id',
  'https://www.daymoment.id',
]);

app.use('/api/*', cors({
  origin: (origin, c) => {
    if (!origin) return undefined;
    if (origin === new URL(c.req.url).origin || allowedAffiliateOrigins.has(origin)) return origin;
    if (c.req.path === '/api/affiliate/session' && ['GET', 'OPTIONS'].includes(c.req.method.toUpperCase()) && allowedSessionReadOrigins.has(origin)) {
      return origin;
    }
    return undefined;
  },
  allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Accept'],
  credentials: true,
}));
app.use('/api/affiliate/*', async (c, next) => {
  const method = c.req.method.toUpperCase();
  const unsafe = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const origin = String(c.req.header('Origin') || '');
  const fetchSite = String(c.req.header('Sec-Fetch-Site') || '').toLowerCase();
  const contentLength = Number(c.req.header('Content-Length') || 0);
  const contentType = String(c.req.header('Content-Type') || '').toLowerCase();
  const isIdentityRegistration = method === 'POST'
    && ['/api/affiliate/register', '/api/affiliate/review-correction', '/api/affiliate/pro-upgrade/social'].includes(c.req.path)
    && contentType.startsWith('multipart/form-data');
  // KTP is validated again as a real image and capped at 4 MiB in the route.
  // Leave a small allowance here for multipart boundaries and text fields.
  const requestLimit = isIdentityRegistration ? (4 * 1024 * 1024) + (128 * 1024) : 32768;

  c.header('Cache-Control', 'no-store, max-age=0');
  c.header('Pragma', 'no-cache');
  c.header('Vary', 'Origin');

  if (unsafe && origin && origin !== new URL(c.req.url).origin && !allowedAffiliateOrigins.has(origin)) {
    return c.json({ ok: false, message: 'Permintaan tidak diizinkan.' }, 403);
  }
  if (unsafe && fetchSite === 'cross-site') {
    return c.json({ ok: false, message: 'Permintaan tidak diizinkan.' }, 403);
  }
  if (unsafe && Number.isFinite(contentLength) && contentLength > requestLimit) {
    return c.json({ ok: false, message: 'Data yang dikirim terlalu besar.' }, 413);
  }

  await next();
});
app.route('/api', affiliate);

app.get('/api/health', (c) => c.json({ ok: true, service: 'daymoment-affiliate', runtime: 'cloudflare-workers' }));

app.all('*', async (c, next) => {
  const path = c.req.path;
  if (path === '/api' || path.startsWith('/api/') || !c.env?.ASSETS) {
    return next();
  }
  return serveAssetWithSecurityHeaders(c, {
    frameAncestors: "'none'",
    xFrameOptions: 'DENY',
    allowPaymentSnap: true,
  });
});

app.notFound((c) => c.json({ ok: false, message: 'Endpoint affiliate tidak ditemukan.' }, 404));
app.onError((error, c) => {
  console.error(error);
  const status = Number(error.status) >= 400 && Number(error.status) < 600 ? Number(error.status) : 500;
  const message = status >= 500
    ? 'Gagal memproses permintaan. Silakan coba lagi.'
    : error.message || 'Permintaan belum dapat diproses.';
  return c.json({ ok: false, message }, status);
});

export default app;
