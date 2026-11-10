const configuredApiBase = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const pointsToLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredApiBase);
const API_BASE = import.meta.env.DEV || pointsToLocalhost ? '' : configuredApiBase;
const TRACK_ENDPOINT = `${API_BASE}/api/affiliate-traffic`;

const SESSION_ID_KEY = 'daymoment:affiliate:visitor_sid';
const inMemoryViewed = new Set();
const recentClickTimestamps = new Map();

function getVisitorSessionId() {
  if (typeof window === 'undefined') return '';
  try {
    let existing = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (!existing) {
      existing = window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      window.sessionStorage.setItem(SESSION_ID_KEY, existing);
    }
    return existing;
  } catch {
    return '';
  }
}

function sendTrafficEvent(payload) {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(payload);
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const queued = navigator.sendBeacon(
        TRACK_ENDPOINT,
        new Blob([serialized], { type: 'application/json' }),
      );
      if (queued) return;
    }
  } catch {
    // Fallback to keepalive fetch below.
  }

  fetch(TRACK_ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: serialized,
  }).catch(() => {});
}

export function trackAffiliateView({ referralCode, pageType = 'storefront', templateCode = '', templateName = '' }) {
  const code = String(referralCode || '').trim().replace(/[^a-zA-Z0-9]/g, '');
  if (!code || typeof window === 'undefined') return;

  const normalizedTemplate = String(templateCode || '').trim().toLowerCase();
  const dedupKey = `${code.toLowerCase()}:${pageType}:${normalizedTemplate || 'all'}`;
  if (inMemoryViewed.has(dedupKey)) return;

  const sessionStorageKey = `daymoment:affiliate:viewed:${dedupKey}`;
  try {
    if (window.sessionStorage.getItem(sessionStorageKey) === '1') {
      inMemoryViewed.add(dedupKey);
      return;
    }
    window.sessionStorage.setItem(sessionStorageKey, '1');
  } catch {
    // Proceed cleanly if sessionStorage is restricted.
  }
  inMemoryViewed.add(dedupKey);

  const label = pageType === 'template'
    ? `Halaman Template ${templateName || templateCode || ''}`.trim()
    : 'Etalase Utama Affiliate';

  sendTrafficEvent({
    referral_code: code,
    event_type: 'view',
    page_type: pageType,
    target_type: 'page_view',
    target_label: label,
    template_code: normalizedTemplate || null,
    visitor_id: getVisitorSessionId() || undefined,
  });
}

export function trackAffiliateClick({
  referralCode,
  pageType = 'storefront',
  targetType = 'package_order',
  targetLabel = '',
  templateCode = '',
  packageCode = '',
}) {
  const code = String(referralCode || '').trim().replace(/[^a-zA-Z0-9]/g, '');
  if (!code || typeof window === 'undefined') return;

  const normalizedTemplate = String(templateCode || '').trim().toLowerCase();
  const normalizedPackage = String(packageCode || '').trim().toLowerCase();
  const throttleKey = `${code.toLowerCase()}:${pageType}:${targetType}:${normalizedTemplate}:${normalizedPackage}:${targetLabel}`;
  const now = Date.now();
  const previous = recentClickTimestamps.get(throttleKey) || 0;
  if (now - previous < 600) return;
  recentClickTimestamps.set(throttleKey, now);

  sendTrafficEvent({
    referral_code: code,
    event_type: 'click',
    page_type: pageType,
    target_type: targetType,
    target_label: String(targetLabel || '').trim() || targetType,
    template_code: normalizedTemplate || null,
    package_code: normalizedPackage || null,
    visitor_id: getVisitorSessionId() || undefined,
  });
}

