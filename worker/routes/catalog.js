import { Hono } from 'hono';
import { database } from '../lib/database.js';
import { activeTemplates, hasRealSupabaseConfig, templateByCode } from '../lib/repositories.js';

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
    .select('id,full_name,referral_code,status')
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
    .select('package_id,commission_percent')
    .eq('affiliate_id', account.id)
    .eq('is_visible', true);
  if (settingError) throw settingError;

  const visiblePackageIds = new Set((settings || [])
    .filter((setting) => Number(setting.commission_percent) >= 1)
    .map((setting) => String(setting.package_id)));
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
    partner: { referral_code: account.referral_code, display_name: account.full_name },
    templates,
  });
});

catalog.get('/templates/:code', async (c) => {
  const referralCode = String(c.req.query('ref') || '').trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  const template = await templateByCode(c.env, c.req.param('code'));
  if (!referralCode || !hasRealSupabaseConfig(c.env)) {
    c.header('Cache-Control', 'no-cache, must-revalidate');
    return c.json({ ok: true, template });
  }
  const db = database(c.env);
  const { data: account, error: accountError } = await db.from('affiliate_accounts')
    .select('id,status')
    .ilike('referral_code', referralCode)
    .maybeSingle();
  if (accountError) throw accountError;
  if (!account) return c.json({ ok: true, template });
  if (account.status === 'suspended') {
    c.header('Cache-Control', 'private, no-store, max-age=0');
    return c.json({
      ok: false,
      code: 'AFFILIATE_SUSPENDED',
      message: 'Link referral ini sudah tidak aktif karena akun affiliate sedang ditangguhkan.',
    }, 403);
  }
  if (account.status !== 'active') return c.json({ ok: true, template });
  const packageIds = template.packages.map((item) => item.id);
  const { data: settings, error } = packageIds.length
    ? await db.from('affiliate_product_settings').select('package_id,is_visible,commission_percent').eq('affiliate_id', account.id).in('package_id', packageIds)
    : { data: [], error: null };
  if (error) throw error;
  const visibility = new Map((settings || []).map((item) => [String(item.package_id), item.is_visible === true && Number(item.commission_percent) >= 1]));
  const packages = template.packages.filter((item) => visibility.get(String(item.id)) === true);
  c.header('Cache-Control', 'private, no-store');
  return c.json({ ok: true, template: { ...template, packages, package_count: packages.length, starting_price: packages.length ? Math.min(...packages.map((item) => Number(item.price))) : null } });
});

export default catalog;
