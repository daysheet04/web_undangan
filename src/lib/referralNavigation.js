export function normalizeReferralCode(raw) {
  return String(raw || '').trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
}

export function buildReferralNavigation(referralCode, { scoped = false, showSecondary = true } = {}) {
  const code = normalizeReferralCode(referralCode);
  if (!code) return null;
  const referralPath = `/ref/${encodeURIComponent(code)}`;
  return {
    scoped,
    homeHref: referralPath,
    templateHref: `${referralPath}#affiliate-products`,
    templateTargetId: 'affiliate-products',
    templateLabel: 'Template',
    stepsHref: `${referralPath}#affiliate-order-steps`,
    stepsTargetId: 'affiliate-order-steps',
    stepsLabel: 'Langkah Pemesanan',
    showSecondary,
    showAffiliate: false,
  };
}

export function referralBackHref(referralCode, templateSlugValue = '') {
  const code = normalizeReferralCode(referralCode);
  const cleanSlug = String(templateSlugValue || '').trim();
  if (code) {
    const base = `/ref/${encodeURIComponent(code)}`;
    return cleanSlug ? `${base}#affiliate-template-${encodeURIComponent(cleanSlug)}` : `${base}#affiliate-products`;
  }
  return cleanSlug ? `/#template-card-${encodeURIComponent(cleanSlug)}` : '/';
}
