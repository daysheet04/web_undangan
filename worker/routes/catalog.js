import { Hono } from 'hono';
import { database } from '../lib/database.js';
import { cleanText } from '../lib/helpers.js';
import { activeTemplates, hasRealSupabaseConfig, templateByCode } from '../lib/repositories.js';
import { getTemplateDemoData } from '../lib/templateDemoStore.js';

const catalog = new Hono();
const TRAFFIC_EVENT_TYPES = new Set(['view', 'click']);
const TRAFFIC_PAGE_TYPES = new Set(['storefront', 'template']);
const TRAFFIC_TARGET_TYPES = new Set([
  'page_view',
  'hero_cta',
  'whatsapp',
  'package_order',
  'template_preview',
  'package_switch',
  'direct_preview',
]);
const CRAWLER_UA_PATTERN = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|linkedinbot|twitterbot|pinterest|google-inspectiontool|curl\/|wget\/|python-requests|go-http-client/i;

function jakartaDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value || '')));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function homepageSettings(env) {
  if (!hasRealSupabaseConfig(env)) return { hero_image_url: null };
  const { data, error } = await database(env).from('site_settings')
    .select('value')
    .eq('key', 'homepage_hero_image')
    .maybeSingle();
  if (error) {
    if (['42P01', 'PGRST205'].includes(error.code)) return { hero_image_url: null };
    throw error;
  }
  const objectKey = String(data?.value || '').trim();
  return { hero_image_url: objectKey ? `/media/${objectKey.replace(/^\/+/, '')}` : null };
}

catalog.get('/templates', async (c) => {
  c.header('Cache-Control', 'no-cache, must-revalidate');
  const [templates, homepage] = await Promise.all([activeTemplates(c.env), homepageSettings(c.env)]);
  return c.json({ ok: true, templates, homepage });
});

catalog.get('/affiliate-catalog/:referralCode', async (c) => {
  const referralCode = String(c.req.param('referralCode') || '').trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  if (!referralCode || !hasRealSupabaseConfig(c.env)) {
    return c.json({ ok: false, message: 'Etalase affiliate tidak ditemukan.' }, 404);
  }

  const db = database(c.env);
  const { data: account, error: accountError } = await db.from('affiliate_accounts')
    .select('id,full_name,phone,referral_code,status')
    .ilike('referral_code', referralCode)
    .maybeSingle();
  if (accountError) throw accountError;
  if (!account) return c.json({ ok: false, message: 'Etalase affiliate tidak ditemukan.' }, 404);
  if (account.status === 'suspended') {
    c.header('Cache-Control', 'private, no-store, max-age=0');
    return c.json({
      ok: false,
      code: 'AFFILIATE_SUSPENDED',
      message: 'Link referral ini sudah tidak aktif karena akun affiliate sedang ditangguhkan.',
    }, 403);
  }
  if (account.status !== 'active') return c.json({ ok: false, message: 'Etalase affiliate tidak ditemukan.' }, 404);

  const { data: settings, error: settingError } = await db.from('affiliate_product_settings')
    .select('package_id')
    .eq('affiliate_id', account.id)
    .eq('is_visible', true);
  if (settingError) throw settingError;

  const visiblePackageIds = new Set((settings || []).map((setting) => String(setting.package_id)));
  const templates = (await activeTemplates(c.env)).map((template) => {
    const packages = template.packages.filter((item) => visiblePackageIds.has(String(item.id)));
    return {
      ...template,
      packages,
      package_count: packages.length,
      starting_price: packages.length ? Math.min(...packages.map((item) => Number(item.price))) : null,
    };
  }).filter((template) => template.package_count > 0);

  c.header('Cache-Control', 'private, no-store, max-age=0');
  return c.json({
    ok: true,
    partner: { referral_code: account.referral_code, display_name: account.full_name, phone: account.phone },
    templates,
  });
});

catalog.get('/templates/:code', async (c) => {
  const referralCode = String(c.req.query('ref') || '').trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  const requestedPackage = String(c.req.query('package') || '').trim().toLowerCase();
  const template = await templateByCode(c.env, c.req.param('code'));
  const demoData = await getTemplateDemoData(c.env, template.code);
  const activePackageCode = requestedPackage || 'signature';
  const activePackagePhotos = Array.isArray(demoData.gallery?.[activePackageCode]) ? demoData.gallery[activePackageCode] : [];
  const currentPkg = (template.packages || []).find((p) => p.code === activePackageCode) || template.packages?.[0];
  const pkgHasMusic = Boolean(currentPkg?.has_music);
  const pkgHasGift = Boolean(currentPkg?.has_gift);
  const pkgHasWishes = Boolean(currentPkg?.has_wishes);

  const rawGifts = Array.isArray(demoData.invitation?.gift_accounts) ? demoData.invitation.gift_accounts : [];
  const activeGiftAccounts = pkgHasGift ? rawGifts : [];

  const rawGreetings = Array.isArray(demoData.invitation?.greetings) ? demoData.invitation.greetings : [];
  const activeGreetings = pkgHasWishes ? rawGreetings : [];

  const rawCovers = demoData.invitation?.covers || {};
  const activeCover = rawCovers[activePackageCode] || demoData.invitation?.[`cover_image_${activePackageCode}`] || demoData.invitation?.cover_image;

  const rawStagePhotos = demoData.invitation?.stage_photos || {};
  const activeStagePhoto = rawStagePhotos[activePackageCode] || demoData.invitation?.[`stage_photo_${activePackageCode}`] || demoData.invitation?.stage_photo || demoData.invitation?.custom_couple_image;

  const activeInvitation = {
    ...demoData.invitation,
    template_code: template.code,
    template_name: template.name,
    package_code: currentPkg?.code || activePackageCode,
    package_name: currentPkg?.name || '',
    gallery_limit: Number(currentPkg?.gallery_limit || 2),
    has_music: pkgHasMusic,
    has_gift: pkgHasGift,
    has_wishes: pkgHasWishes,
    cover_image: activeCover,
    stage_photo: activeStagePhoto,
    custom_couple_image: activeStagePhoto,
  };

  const baseResponse = {
    template: {
      ...template,
      demo_invitation: demoData.invitation,
      demo_gallery: demoData.gallery,
      demo_gift_accounts: rawGifts,
      demo_greetings: rawGreetings,
      demo_covers: rawCovers,
      demo_stage_photos: rawStagePhotos,
    },
    invitation: activeInvitation,
    demo_gallery: demoData.gallery,
    covers: rawCovers,
    stage_photos: rawStagePhotos,
    giftAccounts: activeGiftAccounts,
    greetings: activeGreetings,
    media: activePackagePhotos,
  };

  if (!referralCode || !hasRealSupabaseConfig(c.env)) {
    c.header('Cache-Control', 'no-cache, must-revalidate');
    return c.json({ ok: true, ...baseResponse });
  }
  const db = database(c.env);
  const { data: account, error: accountError } = await db.from('affiliate_accounts')
    .select('id,status')
    .ilike('referral_code', referralCode)
    .maybeSingle();
  if (accountError) throw accountError;
  if (!account) return c.json({ ok: true, ...baseResponse });
  if (account.status === 'suspended') {
    c.header('Cache-Control', 'private, no-store, max-age=0');
    return c.json({
      ok: false,
      code: 'AFFILIATE_SUSPENDED',
      message: 'Link referral ini sudah tidak aktif karena akun affiliate sedang ditangguhkan.',
    }, 403);
  }
  if (account.status !== 'active') return c.json({ ok: true, ...baseResponse });
  const packageIds = template.packages.map((item) => item.id);
  const { data: settings, error } = packageIds.length
    ? await db.from('affiliate_product_settings').select('package_id,is_visible').eq('affiliate_id', account.id).in('package_id', packageIds)
    : { data: [], error: null };
  if (error) throw error;
  const visibility = new Map((settings || []).map((item) => [String(item.package_id), item.is_visible === true]));
  const packages = template.packages.filter((item) => visibility.get(String(item.id)) === true);
  c.header('Cache-Control', 'private, no-store');
  return c.json({
    ok: true,
    ...baseResponse,
    referral_verified: true,
    template: {
      ...baseResponse.template,
      packages,
      package_count: packages.length,
      starting_price: packages.length ? Math.min(...packages.map((item) => Number(item.price))) : null,
    },
  });
});

catalog.post('/affiliate-traffic', async (c) => {
  const rawBody = await c.req.text().catch(() => '');
  let input = {};
  if (rawBody) {
    try {
      input = JSON.parse(rawBody);
    } catch {
      return c.json({ ok: false, message: 'Payload tidak valid.' }, 400);
    }
  }

  const referralCode = String(input.referral_code || '').trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  const eventType = String(input.event_type || '').trim().toLowerCase();
  const pageType = String(input.page_type || 'storefront').trim().toLowerCase();
  const rawTargetType = String(input.target_type || (eventType === 'view' ? 'page_view' : 'package_order')).trim().toLowerCase();
  const targetType = TRAFFIC_TARGET_TYPES.has(rawTargetType) ? rawTargetType : (eventType === 'view' ? 'page_view' : 'package_order');
  const templateCode = cleanText(input.template_code, 64).toLowerCase().replace(/[^a-z0-9_-]/g, '') || null;
  const packageCode = cleanText(input.package_code, 40).toLowerCase().replace(/[^a-z0-9_-]/g, '') || null;
  const targetLabel = cleanText(input.target_label, 160) || null;
  const visitorToken = cleanText(input.visitor_id, 80);

  if (!/^[a-zA-Z0-9]{3,32}$/.test(referralCode) || !TRAFFIC_EVENT_TYPES.has(eventType) || !TRAFFIC_PAGE_TYPES.has(pageType)) {
    return c.json({ ok: false, message: 'Parameter event tidak valid.' }, 422);
  }

  const userAgent = String(c.req.header('User-Agent') || '');
  if (userAgent && CRAWLER_UA_PATTERN.test(userAgent)) {
    return c.json({ ok: true, recorded: false, reason: 'crawler' });
  }

  if (!hasRealSupabaseConfig(c.env)) {
    return c.json({ ok: true, recorded: false, reason: 'demo_mode' });
  }

  const db = database(c.env);
  const { data: account, error: accountError } = await db.from('affiliate_accounts')
    .select('id,status')
    .ilike('referral_code', referralCode)
    .maybeSingle();
  if (accountError) throw accountError;
  if (!account || account.status !== 'active') {
    return c.json({ ok: true, recorded: false, reason: 'inactive_referral' });
  }

  const ip = cleanText(c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')?.split(',')[0] || '', 80);
  const eventDate = jakartaDateString();
  const visitorSeed = visitorToken
    ? `${account.id}|${visitorToken}`
    : `${account.id}|${ip || 'unknown'}|${userAgent.slice(0, 120)}|${eventDate}`;
  const visitorHash = await sha256Hex(visitorSeed);

  // Deduplicate accidental duplicate view events emitted within the same browser session and day
  // when a client triggers multiple parallel view payloads before sessionStorage settles.
  const edgeCache = globalThis.caches?.default;
  if (edgeCache && visitorToken && eventType === 'view') {
    const burstKey = `https://daymoment-rate.local/aff-view/${account.id}/${pageType}/${templateCode || 'all'}/${visitorHash}/${eventDate}`;
    const burstReq = new Request(burstKey);
    if (await edgeCache.match(burstReq)) {
      return c.json({ ok: true, recorded: false, reason: 'session_cached' });
    }
    if (c.executionCtx?.waitUntil) {
      c.executionCtx.waitUntil(edgeCache.put(burstReq, new Response('1', { headers: { 'Cache-Control': 'max-age=5' } })));
    }
  }

  const { error: insertError } = await db.from('affiliate_traffic_events').insert({
    affiliate_id: account.id,
    event_type: eventType,
    page_type: pageType,
    target_type: targetType,
    target_label: targetLabel,
    template_code: templateCode,
    package_code: packageCode,
    visitor_hash: visitorHash,
    event_date: eventDate,
  });

  if (insertError) {
    if (['42P01', 'PGRST205'].includes(insertError.code) || /affiliate_traffic_events|schema cache/i.test(insertError.message || '')) {
      console.warn('Tabel affiliate_traffic_events belum tersedia:', insertError.message);
      return c.json({ ok: true, recorded: false, reason: 'schema_pending' });
    }
    throw insertError;
  }

  return c.json({ ok: true, recorded: true }, 201);
});

export default catalog;
