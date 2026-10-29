import { Hono } from 'hono';
import { database } from '../lib/database.js';
import { activeTemplates, hasRealSupabaseConfig, templateByCode } from '../lib/repositories.js';
import { getTemplateDemoData } from '../lib/templateDemoStore.js';

const catalog = new Hono();

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
    template: {
      ...baseResponse.template,
      packages,
      package_count: packages.length,
      starting_price: packages.length ? Math.min(...packages.map((item) => Number(item.price))) : null,
    },
  });
});

export default catalog;
