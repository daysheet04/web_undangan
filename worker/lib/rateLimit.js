/**
 * Lightweight per-IP rate limiter backed by Cloudflare Cache API with in-memory fallback.
 */

const MEMORY_BUCKETS = new Map();

function pruneExpiredBuckets(now) {
  if (MEMORY_BUCKETS.size <= 2000) return;
  for (const [key, bucket] of MEMORY_BUCKETS.entries()) {
    if (!bucket || bucket.resetAt <= now) MEMORY_BUCKETS.delete(key);
  }
}

export function clientIp(c) {
  const cfIp = c.req.header('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

export async function consumeIpRateLimit(c, { scope, limit = 10, windowSec = 600 } = {}) {
  const now = Date.now();
  const windowMs = Math.max(1, Number(windowSec)) * 1000;
  const maxRequests = Math.max(1, Number(limit));
  const bucketKey = `${String(scope || 'default')}:${clientIp(c)}`;
  const cacheUrl = `https://rate-limit.internal/${encodeURIComponent(String(scope || 'default'))}/${encodeURIComponent(clientIp(c))}`;

  pruneExpiredBuckets(now);

  let current = MEMORY_BUCKETS.get(bucketKey);
  if (current && current.resetAt <= now) current = null;

  const edgeCache = typeof caches !== 'undefined' && caches?.default ? caches.default : null;
  if (edgeCache) {
    try {
      const cached = await edgeCache.match(cacheUrl);
      if (cached) {
        const edgeBucket = await cached.json();
        if (edgeBucket && Number(edgeBucket.resetAt) > now) {
          if (!current || Number(edgeBucket.count) > current.count) {
            current = { count: Number(edgeBucket.count) || 0, resetAt: Number(edgeBucket.resetAt) };
          }
        }
      }
    } catch {
      // Ignore edge cache read failures and continue with in-memory bucket.
    }
  }

  const resetAt = current ? current.resetAt : now + windowMs;
  const count = current ? current.count : 0;
  if (count >= maxRequests) {
    const retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000));
    return { limited: true, remaining: 0, retryAfterSec };
  }

  const next = { count: count + 1, resetAt };
  MEMORY_BUCKETS.set(bucketKey, next);

  if (edgeCache) {
    try {
      const ttlSec = Math.max(1, Math.ceil((resetAt - now) / 1000));
      await edgeCache.put(
        cacheUrl,
        new Response(JSON.stringify(next), {
          headers: {
            'content-type': 'application/json',
            'cache-control': `public, max-age=${ttlSec}`,
          },
        }),
      );
    } catch {
      // Ignore edge cache write failures; in-memory counter remains active.
    }
  }

  return {
    limited: false,
    remaining: Math.max(0, maxRequests - next.count),
    retryAfterSec: 0,
  };
}
