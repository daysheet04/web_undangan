import { Hono } from 'hono';
import { cors } from 'hono/cors';
import admin from './routes/admin.js';
import catalog from './routes/catalog.js';
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
  });
});

app.use('/api/*', cors({
  origin: (origin, c) => resolveAllowedCorsOrigin(origin, c.req.url, c.env),
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Accept'],
  credentials: true,
}));
app.route('/api', admin);
app.route('/api', catalog);

app.get('/media/*', (c) => servePublicR2Media(c, /^\/media\//));

app.get('/api/health', (c) => c.json({ ok: true, service: 'daymoment-admin', runtime: 'cloudflare-workers' }));

app.all('*', async (c, next) => {
  const path = c.req.path;
  if (path === '/api' || path.startsWith('/api/') || path.startsWith('/media/') || !c.env?.ASSETS) {
    return next();
  }
  return serveAssetWithSecurityHeaders(c, {
    frameAncestors: "'self'",
    xFrameOptions: 'SAMEORIGIN',
  });
});

app.notFound((c) => c.json({ ok: false, message: 'Endpoint admin tidak ditemukan.' }, 404));
app.onError((error, c) => maskedErrorResponse(error, c, 'Terjadi kesalahan pada server admin.'));

export default app;
