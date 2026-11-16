const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

function isLocalHostname(hostname) {
  const host = String(hostname || '').toLowerCase();
  return LOCAL_HOSTNAMES.has(host) || host.endsWith('.local');
}

/**
 * Enforce HTTPS on public non-local hosts via permanent redirect.
 */
export function enforceHttpsRedirect(request) {
  const url = new URL(request.url);
  if (isLocalHostname(url.hostname)) return null;

  const cfVisitor = String(request.headers.get('cf-visitor') || '');
  const forwardedProto = String(request.headers.get('x-forwarded-proto') || '').toLowerCase();
  const isPlainHttp = url.protocol === 'http:' || forwardedProto === 'http' || cfVisitor.includes('"scheme":"http"');
  if (!isPlainHttp) return null;

  const targetUrl = `https://${url.host}${url.pathname}${url.search}`;
  const method = String(request.method || 'GET').toUpperCase();
  const status = method === 'GET' || method === 'HEAD' ? 301 : 308;
  return new Response(null, {
    status,
    headers: { Location: targetUrl },
  });
}

/**
 * Build a tailored Content-Security-Policy header covering scripts, styles,
 * fonts, R2/external media, Supabase Realtime, Midtrans Snap, and framing.
 */
export function buildContentSecurityPolicy({ isMedia = false, allowPaymentSnap = false, frameAncestors = "'self'" } = {}) {
  if (isMedia) {
    return [
      "default-src 'none'",
      "img-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
      `frame-ancestors ${frameAncestors}`,
    ].join('; ');
  }

  const scriptSrc = ["'self'", 'https://static.cloudflareinsights.com'];
  if (allowPaymentSnap) {
    // Midtrans snap.js internally uses new Function() when initializing its checkout modal.
    scriptSrc.push(
      "'unsafe-eval'",
      'https://app.midtrans.com',
      'https://app.sandbox.midtrans.com',
      'https://*.midtrans.com',
      'https://*.veritrans.co.id',
      'https://*.cloudfront.net',
    );
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://app.midtrans.com https://app.sandbox.midtrans.com https://api.midtrans.com https://api.sandbox.midtrans.com https://*.midtrans.com https://*.veritrans.co.id https://static.cloudflareinsights.com https://cloudflareinsights.com",
    "worker-src 'self' blob:",
    "frame-src 'self' https://app.midtrans.com https://app.sandbox.midtrans.com https://*.midtrans.com",
    `frame-ancestors ${frameAncestors}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

/**
 * Attach transport, framing, sniffing, and CSP headers to a Headers instance.
 */
export function applySecurityHeaders(headers, pathname, { allowPaymentSnap = false, frameAncestors = "'self'", xFrameOptions } = {}) {
  const isMedia = pathname.startsWith('/media/') || pathname.startsWith('/api/admin/media/');
  const resolvedFrameOption = xFrameOptions || (frameAncestors === "'none'" ? 'DENY' : 'SAMEORIGIN');

  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', resolvedFrameOption);
  headers.set('Content-Security-Policy', buildContentSecurityPolicy({ isMedia, allowPaymentSnap, frameAncestors }));
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self "https://app.midtrans.com" "https://app.sandbox.midtrans.com")');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
}

/**
 * Serve a static asset via env.ASSETS while preserving status codes and attaching security headers.
 */
export async function serveAssetWithSecurityHeaders(c, options = {}) {
  const assetRes = await c.env.ASSETS.fetch(c.req.raw);
  const hasEmptyBody = assetRes.status === 204 || assetRes.status === 304 || assetRes.status === 205;
  const response = new Response(hasEmptyBody ? null : assetRes.body, {
    status: assetRes.status,
    statusText: assetRes.statusText,
    headers: assetRes.headers,
  });

  const path = c.req.path;
  applySecurityHeaders(response.headers, path, {
    ...options,
    allowPaymentSnap: typeof options.allowPaymentSnap === 'function' ? options.allowPaymentSnap(path) : Boolean(options.allowPaymentSnap),
  });

  if (path === '/' || (!path.startsWith('/api') && !path.startsWith('/media') && !path.includes('.'))) {
    response.headers.set('Cache-Control', 'no-cache');
  }
  return response;
}

/**
 * Allow CORS only for the request's own origin, configured Daymoment origins, and local dev ports.
 */
export function resolveAllowedCorsOrigin(origin, requestUrl, env = {}, extraOrigins = []) {
  if (!origin) return undefined;
  const allowed = new Set([
    new URL(requestUrl).origin,
    'https://daymoment.id',
    'https://www.daymoment.id',
    'https://affiliate.daymoment.id',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://localhost:8082',
    'http://127.0.0.1:8082',
    'http://localhost:5179',
    'http://127.0.0.1:5179',
    ...extraOrigins,
  ]);

  for (const key of ['APP_URL', 'PUBLIC_APP_URL', 'AFFILIATE_APP_URL']) {
    const raw = String(env?.[key] || '').trim();
    if (!raw) continue;
    try {
      allowed.add(new URL(raw).origin);
    } catch {
      // Ignore malformed env URL values
    }
  }

  return allowed.has(origin) ? origin : undefined;
}
