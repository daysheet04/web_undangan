const trimEnd = (value) => String(value || '').replace(/\/+$/, '');

export const MAIN_APP_URL = trimEnd(
  import.meta.env.VITE_MAIN_APP_URL
  || (typeof window !== 'undefined' && !window.location.hostname.startsWith('affiliate.') ? window.location.origin : '')
  || (import.meta.env.DEV ? 'http://localhost:8080' : 'https://daymoment.id')
);

export const AFFILIATE_APP_URL = trimEnd(
  import.meta.env.VITE_AFFILIATE_APP_URL
  || (typeof window !== 'undefined' && window.location.hostname.startsWith('affiliate.') ? window.location.origin : '')
  || (import.meta.env.DEV ? 'http://localhost:8082' : 'https://affiliate.daymoment.id')
);

export function affiliateUrl(path = '/') {
  const normalized = String(path || '/').startsWith('/') ? String(path || '/') : `/${path}`;
  return `${AFFILIATE_APP_URL}${normalized}`;
}

