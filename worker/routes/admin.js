import { Hono } from 'hono';
import { database } from '../lib/database.js';
import { sendAffiliateAccountStatusEmail, sendAffiliateProUpgradeReviewEmail, sendAffiliateReviewEmail } from '../lib/email.js';
import { allTemplates, demoTemplates, hasRealSupabaseConfig } from '../lib/repositories.js';

const admin = new Hono();
const DEMO_STATE = globalThis.__daymoment_demo_state__ || { orders: new Map() };
const ADMIN_COOKIE = 'daymoment_admin';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const encoder = new TextEncoder();

globalThis.__daymoment_demo_state__ = DEMO_STATE;

function publicAppUrl(env, path = '/') {
  const base = String(env.PUBLIC_APP_URL || env.APP_URL || '').replace(/\/$/, '');
  const normalizedPath = String(path).startsWith('/') ? String(path) : `/${path}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
}

function templateCoverUrl(env, thumbnail) {
  const source = String(thumbnail || '').trim();
  if (!source) return null;
  if (/^https?:\/\//i.test(source)) return source;
  if (source.startsWith('/')) return publicAppUrl(env, source);
  // R2 preview uploads belong to the admin Worker's own binding while running
  // locally. Serving them through the authenticated admin API prevents a
  // local upload from accidentally being read from the production bucket.
  return `/api/admin/media/${source.replace(/^\/+/, '')}`;
}

function adminTemplate(env, template) {
  return { ...template, thumbnail_url: templateCoverUrl(env, template.thumbnail) };
}

async function homepageAdminSettings(db) {
  if (!db) return { hero_image_key: null, hero_image_url: null };
  const { data, error } = await db.from('site_settings')
    .select('value')
    .eq('key', 'homepage_hero_image')
    .maybeSingle();
  if (error) {
    if (['42P01', 'PGRST205'].includes(error.code)) return { hero_image_key: null, hero_image_url: null };
    throw error;
  }
  const objectKey = String(data?.value || '').trim();
  return {
    hero_image_key: objectKey || null,
    hero_image_url: objectKey ? `/api/admin/media/${objectKey.replace(/^\/+/, '')}` : null,
  };
}

function cleanTemplateField(value, maxLength) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function normalizeAffiliatePhone(value) {
  const raw = String(value || '').trim().replace(/[\s().-]/g, '');
  if (raw.startsWith('+')) return `+${raw.slice(1).replace(/\D/g, '')}`.slice(0, 24);
  return raw.replace(/\D/g, '').slice(0, 24);
}

function imageExtension(file) {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type] || 'bin';
}

function base64Url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomToken(bytes = 32) {
  return base64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function affiliateAppUrl(c, path = '/') {
  const requestUrl = new URL(c.req.url);
  const local = ['localhost', '127.0.0.1'].includes(requestUrl.hostname);
  const base = local
    ? `${requestUrl.protocol}//${requestUrl.hostname}:8082`
    : String(c.env.AFFILIATE_APP_URL || 'https://affiliate.daymoment.biz.id').replace(/\/$/, '');
  return `${base}${String(path).startsWith('/') ? path : `/${path}`}`;
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  return Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0));
}

async function signature(value, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  return { key, bytes: await crypto.subtle.sign('HMAC', key, encoder.encode(value)) };
}

async function createSession(secret) {
  const payload = `admin.${Date.now()}`;
  const { bytes } = await signature(payload, secret);
  return `${base64Url(encoder.encode(payload))}.${base64Url(bytes)}`;
}

async function validSession(request, secret) {
  if (!secret) return false;
  const cookie = request.headers.get('Cookie') || '';
  const value = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_COOKIE}=`))?.slice(ADMIN_COOKIE.length + 1);
  if (!value) return false;
  const [encodedPayload, encodedSignature] = value.split('.');
  if (!encodedPayload || !encodedSignature) return false;
  const payload = new TextDecoder().decode(decodeBase64Url(encodedPayload));
  const timestamp = Number(payload.split('.')[1]);
  if (!Number.isFinite(timestamp) || Date.now() - timestamp > SESSION_TTL) return false;
  const { key } = await signature(payload, secret);
  return crypto.subtle.verify('HMAC', key, decodeBase64Url(encodedSignature), encoder.encode(payload));
}

function cookieOptions(request, maxAge) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${ADMIN_COOKIE}=; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

admin.post('/admin/login', async (c) => {
  const configuredPassword = String(c.env.ADMIN_PASSWORD || '');
  if (!configuredPassword) return c.json({ ok: false, message: 'ADMIN_PASSWORD belum dikonfigurasi di environment server.' }, 503);
  const input = await c.req.json().catch(() => ({}));
  if (String(input.password || '') !== configuredPassword) return c.json({ ok: false, message: 'Password admin salah.' }, 401);
  const response = c.json({ ok: true, authenticated: true });
  response.headers.set('Set-Cookie', `${ADMIN_COOKIE}=${await createSession(configuredPassword)}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL}${new URL(c.req.url).protocol === 'https:' ? '; Secure' : ''}`);
  return response;
});

admin.post('/admin/logout', (c) => {
  const response = c.json({ ok: true, authenticated: false });
  response.headers.set('Set-Cookie', cookieOptions(c.req.raw, 0));
  return response;
});

admin.get('/admin/session', async (c) => c.json({ ok: true, authenticated: await validSession(c.req.raw, String(c.env.ADMIN_PASSWORD || '')) }));

admin.use('/admin/*', async (c, next) => {
  if (['/api/admin/login', '/api/admin/logout', '/api/admin/session'].includes(c.req.path) || c.req.method === 'OPTIONS') return next();
  if (!await validSession(c.req.raw, String(c.env.ADMIN_PASSWORD || ''))) return c.json({ ok: false, message: 'Login admin diperlukan.' }, 401);
  return next();
});

function demoOrders(env) {
  return [...(DEMO_STATE.orders.values?.() || [])].map((order) => {
    const activeUntil = order.active_until ? new Date(order.active_until) : null;
    const websiteActive = order.status === 'published' && Boolean(order.published_at) && Boolean(order.website_active ?? order.is_active) && Boolean(activeUntil) && activeUntil > new Date();
    return ({
    id: order.id,
    order_code: order.order_code,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    referral_name: order.referral_name || '',
    referral_amount: Number(order.referral_amount || 0),
    template_name: order.template_name,
    template_code: order.template_code,
    package_name: order.package_name,
    package_code: order.package_code,
    payment_status: order.payment_status,
    status: order.status,
    website_active: websiteActive,
    active_until: order.active_until || null,
    slug: order.slug || null,
    published_at: order.published_at || null,
    editor_url: order.payment_status === 'paid' && order.editor_token ? publicAppUrl(env, `/edit/${order.editor_token}`) : null,
    website_url: order.slug ? publicAppUrl(env, `/${order.slug}`) : null,
    package_price: Number(order.package_price || 0),
    created_at: order.created_at || new Date().toISOString(),
    });
  });
}

async function adminOrders(env) {
  if (!hasRealSupabaseConfig(env)) return demoOrders(env);
  const db = database(env);
  const [orderResult, invitationResult, paymentResult] = await Promise.all([
    db.from('orders').select('*').order('created_at', { ascending: false }),
    db.from('invitations').select('order_id,is_active,active_until,slug,published_at'),
    db.from('payments').select('order_id,amount,status,paid_at,gateway,transaction_id,gateway_order_id'),
  ]);
  if (orderResult.error) throw orderResult.error;
  if (invitationResult.error) throw invitationResult.error;
  if (paymentResult.error) throw paymentResult.error;

  const templateIds = [...new Set((orderResult.data || []).map((order) => order.template_id).filter(Boolean))];
  const packageIds = [...new Set((orderResult.data || []).map((order) => order.package_id).filter(Boolean))];
  const templateMap = new Map();
  const packageMap = new Map();

  if (templateIds.length) {
    const { data: templateData, error: templateError } = await db.from('templates').select('id,code,name,category').in('id', templateIds);
    if (templateError) throw templateError;
    (templateData || []).forEach((item) => templateMap.set(item.id, item));
  }

  if (packageIds.length) {
    const { data: packageData, error: packageError } = await db.from('template_packages').select('id,code,name,price,gallery_limit,has_music,has_gift,has_wishes').in('id', packageIds);
    if (packageError) throw packageError;
    (packageData || []).forEach((item) => packageMap.set(item.id, item));
  }

  const invitations = new Map((invitationResult.data || []).map((item) => [item.order_id, item]));
  const payments = new Map((paymentResult.data || []).map((item) => [item.order_id, item]));
  return (orderResult.data || []).map((order) => {
    const template = templateMap.get(order.template_id) || {};
    const packageInfo = packageMap.get(order.package_id) || {};
    const payment = payments.get(order.id) || {};
    const invitation = invitations.get(order.id) || {};
    const packagePrice = Number(packageInfo.price ?? order.package_price ?? 0);
    const activeUntil = invitation.active_until ? new Date(invitation.active_until) : null;
    return {
      ...order,
      template_code: template.code || null,
      template_name: template.name || null,
      template_category: template.category || null,
      package_code: packageInfo.code || null,
      package_name: packageInfo.name || null,
      package_price: packagePrice,
      gallery_limit: packageInfo.gallery_limit ?? null,
      has_music: Boolean(packageInfo.has_music),
      has_gift: Boolean(packageInfo.has_gift),
      has_wishes: Boolean(packageInfo.has_wishes),
      website_active: order.status === 'published' && Boolean(invitation.published_at) && invitation.is_active === true && Boolean(activeUntil) && activeUntil > new Date(),
      active_until: invitation.active_until || null,
      slug: invitation.slug || null,
      published_at: invitation.published_at || null,
      payment_amount: Number(payment.amount || packagePrice || 0),
      payment_record_status: payment.status || order.payment_record_status,
      paid_at: payment.paid_at || null,
      gateway: payment.gateway || null,
      transaction_id: payment.transaction_id || null,
      gateway_order_id: payment.gateway_order_id || null,
      editor_url: order.payment_status === 'paid' && order.editor_token ? publicAppUrl(env, `/edit/${order.editor_token}`) : null,
      website_url: invitation.slug ? publicAppUrl(env, `/${invitation.slug}`) : null,
    };
  });
}

admin.get('/admin/summary', async (c) => {
  const orders = await adminOrders(c.env);
  const templates = await allTemplates(c.env);
  const db = hasRealSupabaseConfig(c.env) ? database(c.env) : null;
  const homepage = await homepageAdminSettings(db);
  let templateCount = templates.length;
  if (db) {
    const { count, error } = await db.from('templates').select('id', { count: 'exact', head: true });
    if (error) throw error;
    templateCount = count || 0;
  }
  const paidOrders = orders.filter((order) => order.payment_status === 'paid');
  const summary = {
    total_orders: orders.length,
    total_paid: paidOrders.length,
    total_published: orders.filter((order) => order.status === 'published').length,
    total_templates: templateCount,
    total_revenue: paidOrders.reduce((total, order) => total + Number(order.payment_amount || order.package_price || 0), 0),
    total_pending: orders.filter((order) => order.payment_status === 'pending').length,
    total_inactive: orders.filter((order) => order.website_active === false).length,
  };
  const revenueByDate = paidOrders.reduce((items, order) => {
    const date = String(order.paid_at || order.created_at || '').slice(0, 10);
    if (!date) return items;
    items[date] = (items[date] || 0) + Number(order.payment_amount || order.package_price || 0);
    return items;
  }, {});
  const referralSummary = Object.values(orders.reduce((items, order) => {
    const name = String(order.referral_name || '').trim() || 'Tanpa referral';
    if (!items[name]) items[name] = { name, orders: 0, revenue: 0 };
    items[name].orders += 1;
    if (order.payment_status === 'paid') items[name].revenue += Number(order.payment_amount || order.package_price || 0);
    return items;
  }, {})).sort((a, b) => b.revenue - a.revenue || b.orders - a.orders);
  return c.json({ ok: true, summary, orders, templates: templates.map((template) => adminTemplate(c.env, template)), homepage, revenue_by_date: revenueByDate, referral_summary: referralSummary, mode: hasRealSupabaseConfig(c.env) ? 'database' : 'demo' });
});

admin.get('/admin/orders', async (c) => {
  return c.json({ ok: true, orders: await adminOrders(c.env), mode: hasRealSupabaseConfig(c.env) ? 'database' : 'demo' });
});

admin.get('/admin/templates', async (c) => {
  const templates = await allTemplates(c.env);
  return c.json({ ok: true, templates: templates.map((template) => adminTemplate(c.env, template)), mode: hasRealSupabaseConfig(c.env) ? 'database' : 'demo' });
});

function adminAffiliate(account) {
  return {
    id: account.id,
    email: account.email,
    full_name: account.full_name,
    phone: account.phone,
    nik: account.nik,
    referral_code: account.referral_code,
    status: account.status,
    account_tier: account.account_tier || 'basic',
    pro_source: account.pro_source || null,
    pro_activated_at: account.pro_activated_at || null,
    email_verified_at: account.email_verified_at,
    reviewed_at: account.reviewed_at,
    review_note: account.review_note,
    resubmitted_at: account.resubmitted_at,
    created_at: account.created_at,
    updated_at: account.updated_at,
    ktp_url: account.ktp_object_key ? `/api/admin/affiliates/${account.id}/ktp` : null,
  };
}

admin.get('/admin/affiliates', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) return c.json({ ok: true, affiliates: [], summary: { pending: 0, active: 0, rejected: 0 } });
  const db = database(c.env);
  const { data, error } = await db.from('affiliate_accounts')
    .select('id,email,full_name,phone,nik,referral_code,ktp_object_key,status,account_tier,pro_source,pro_activated_at,email_verified_at,reviewed_at,review_note,resubmitted_at,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  const affiliateIds = (data || []).map((account) => account.id);
  const historyResult = affiliateIds.length
    ? await db.from('affiliate_review_history')
      .select('id,affiliate_id,action,note,created_at')
      .in('affiliate_id', affiliateIds)
      .order('created_at', { ascending: true })
    : { data: [], error: null };
  if (historyResult.error) throw historyResult.error;
  const historyByAffiliate = (historyResult.data || []).reduce((items, entry) => {
    if (!items.has(entry.affiliate_id)) items.set(entry.affiliate_id, []);
    items.get(entry.affiliate_id).push({ id: entry.id, action: entry.action, note: entry.note, created_at: entry.created_at });
    return items;
  }, new Map());
  const affiliates = (data || []).map((account) => ({
    ...adminAffiliate(account),
    review_history: historyByAffiliate.get(account.id) || [],
  }));
  return c.json({
    ok: true,
    affiliates,
    summary: {
      pending: affiliates.filter((item) => item.status === 'pending').length,
      active: affiliates.filter((item) => item.status === 'active').length,
      rejected: affiliates.filter((item) => item.status === 'rejected').length,
    },
  });
});

async function issueAffiliateCorrection(c, db, account, reviewNote) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString();
  const { data: correction, error: correctionError } = await db.from('affiliate_review_corrections')
    .insert({ affiliate_id: account.id, token_hash: await sha256(token), expires_at: expiresAt })
    .select('id')
    .single();
  if (correctionError) throw correctionError;

  const correctionUrl = affiliateAppUrl(c, `/update-registration?token=${encodeURIComponent(token)}`);
  try {
    const sent = await sendAffiliateReviewEmail(c.env, account, 'rejected', reviewNote, correctionUrl);
    if (sent?.skipped) throw new Error('SMTP admin belum dikonfigurasi.');
  } catch (error) {
    await db.from('affiliate_review_corrections').delete().eq('id', correction.id);
    throw error;
  }

  const { error: invalidateError } = await db.from('affiliate_review_corrections')
    .update({ used_at: new Date().toISOString() })
    .eq('affiliate_id', account.id)
    .neq('id', correction.id)
    .is('used_at', null);
  if (invalidateError) console.error('Gagal menonaktifkan link perbaikan lama:', invalidateError);
  return correctionUrl;
}

admin.get('/admin/affiliates/:affiliateId/ktp', async (c) => {
  if (!c.env.MEDIA || !hasRealSupabaseConfig(c.env)) return c.json({ ok: false, message: 'Dokumen tidak ditemukan.' }, 404);
  const { data: account, error } = await database(c.env).from('affiliate_accounts')
    .select('ktp_object_key')
    .eq('id', c.req.param('affiliateId'))
    .maybeSingle();
  if (error) throw error;
  if (!account?.ktp_object_key) return c.json({ ok: false, message: 'Dokumen tidak ditemukan.' }, 404);
  const object = await c.env.MEDIA.get(account.ktp_object_key);
  if (!object) return c.json({ ok: false, message: 'Dokumen tidak ditemukan.' }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'private, no-store');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('content-disposition', 'inline; filename="identitas-affiliate"');
  return new Response(object.body, { headers });
});

admin.get('/admin/pro-upgrades', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) return c.json({ ok: true, requests: [], social_platforms: [{ id: 'demo-instagram', name: 'Instagram', is_active: true, sort_order: 10 }, { id: 'demo-facebook', name: 'Facebook', is_active: true, sort_order: 20 }], summary: { pending: 0, approved: 0, rejected: 0 } });
  const db = database(c.env);
  const [requestResult, platformResult] = await Promise.all([
    db.from('affiliate_pro_upgrade_requests')
      .select('id,affiliate_id,method,status,social_platform,social_handle,follower_count,payment_amount,gateway_order_id,transaction_id,review_note,reviewed_at,paid_at,created_at,updated_at,proof_object_key')
      .order('created_at', { ascending: false })
      .limit(500),
    db.from('affiliate_social_platforms')
      .select('id,name,is_active,sort_order,created_at,updated_at')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
  ]);
  if (requestResult.error) throw requestResult.error;
  if (platformResult.error) throw platformResult.error;
  const data = requestResult.data || [];
  const affiliateIds = [...new Set((data || []).map((item) => item.affiliate_id))];
  const accountResult = affiliateIds.length
    ? await db.from('affiliate_accounts').select('id,full_name,email,phone,referral_code,account_tier,pro_source,pro_activated_at').in('id', affiliateIds)
    : { data: [], error: null };
  if (accountResult.error) throw accountResult.error;
  const accounts = new Map((accountResult.data || []).map((account) => [account.id, account]));
  const requests = (data || []).map(({ proof_object_key: proofObjectKey, ...request }) => ({
    ...request,
    payment_amount: Number(request.payment_amount || 0),
    account: accounts.get(request.affiliate_id) || null,
    proof_url: proofObjectKey ? `/api/admin/pro-upgrades/${request.id}/proof` : null,
  }));
  return c.json({
    ok: true,
    requests,
    social_platforms: platformResult.data || [],
    summary: {
      pending: requests.filter((item) => item.method === 'social' && item.status === 'pending').length,
      approved: requests.filter((item) => ['approved', 'paid'].includes(item.status)).length,
      rejected: requests.filter((item) => item.status === 'rejected').length,
    },
  });
});

admin.post('/admin/pro-upgrade-platforms', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) return c.json({ ok: false, message: 'Pengaturan media sosial hanya tersedia pada database utama.' }, 422);
  const input = await c.req.json().catch(() => ({}));
  const name = cleanTemplateField(input.name, 40);
  if (name.length < 2) return c.json({ ok: false, message: 'Nama media sosial minimal 2 karakter.' }, 422);
  const db = database(c.env);
  const { data: lastPlatform, error: orderError } = await db.from('affiliate_social_platforms')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (orderError) throw orderError;
  const { data: platform, error } = await db.from('affiliate_social_platforms').insert({
    name,
    is_active: true,
    sort_order: Number(lastPlatform?.sort_order || 0) + 10,
  }).select('id,name,is_active,sort_order,created_at,updated_at').single();
  if (error) {
    if (error.code === '23505') return c.json({ ok: false, message: 'Media sosial tersebut sudah ada.' }, 409);
    throw error;
  }
  return c.json({ ok: true, platform, message: `${platform.name} berhasil ditambahkan ke pilihan affiliate.` }, 201);
});

admin.patch('/admin/pro-upgrade-platforms/:platformId', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) return c.json({ ok: false, message: 'Pengaturan media sosial hanya tersedia pada database utama.' }, 422);
  const input = await c.req.json().catch(() => ({}));
  if (typeof input.is_active !== 'boolean') return c.json({ ok: false, message: 'Status media sosial tidak valid.' }, 422);
  const db = database(c.env);
  const { data: current, error: readError } = await db.from('affiliate_social_platforms')
    .select('id,name,is_active')
    .eq('id', c.req.param('platformId'))
    .maybeSingle();
  if (readError) throw readError;
  if (!current) return c.json({ ok: false, message: 'Media sosial tidak ditemukan.' }, 404);
  if (current.is_active && input.is_active === false) {
    const { count, error: countError } = await db.from('affiliate_social_platforms')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
    if (countError) throw countError;
    if (Number(count || 0) <= 1) return c.json({ ok: false, message: 'Minimal satu media sosial harus tetap aktif.' }, 422);
  }
  const { data: platform, error } = await db.from('affiliate_social_platforms').update({
    is_active: input.is_active,
    updated_at: new Date().toISOString(),
  }).eq('id', current.id).select('id,name,is_active,sort_order,created_at,updated_at').single();
  if (error) throw error;
  return c.json({ ok: true, platform, message: platform.is_active ? `${platform.name} ditampilkan kembali.` : `${platform.name} disembunyikan dari pilihan affiliate.` });
});

admin.get('/admin/pro-upgrades/:requestId/proof', async (c) => {
  if (!c.env.MEDIA || !hasRealSupabaseConfig(c.env)) return c.json({ ok: false, message: 'Bukti tidak ditemukan.' }, 404);
  const { data: request, error } = await database(c.env).from('affiliate_pro_upgrade_requests')
    .select('proof_object_key')
    .eq('id', c.req.param('requestId'))
    .eq('method', 'social')
    .maybeSingle();
  if (error) throw error;
  if (!request?.proof_object_key) return c.json({ ok: false, message: 'Bukti tidak ditemukan.' }, 404);
  const object = await c.env.MEDIA.get(request.proof_object_key);
  if (!object) return c.json({ ok: false, message: 'Bukti tidak ditemukan.' }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'private, no-store');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('content-disposition', 'inline; filename="bukti-media-sosial"');
  return new Response(object.body, { headers });
});

admin.patch('/admin/pro-upgrades/:requestId/review', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) return c.json({ ok: false, message: 'Review upgrade Pro hanya tersedia pada database utama.' }, 422);
  const input = await c.req.json().catch(() => ({}));
  const decision = String(input.decision || '');
  const reviewNote = cleanTemplateField(input.review_note, 500);
  if (!['approved', 'rejected'].includes(decision)) return c.json({ ok: false, message: 'Keputusan review tidak valid.' }, 422);
  if (decision === 'rejected' && !reviewNote) return c.json({ ok: false, message: 'Alasan penolakan wajib diisi.' }, 422);
  const db = database(c.env);
  const { data: request, error: readError } = await db.from('affiliate_pro_upgrade_requests')
    .select('id,affiliate_id,method,status')
    .eq('id', c.req.param('requestId'))
    .maybeSingle();
  if (readError) throw readError;
  if (!request) return c.json({ ok: false, message: 'Pengajuan upgrade Pro tidak ditemukan.' }, 404);
  if (request.method !== 'social' || request.status !== 'pending') return c.json({ ok: false, message: 'Pengajuan ini sudah selesai atau tidak memerlukan review.' }, 409);
  const reviewedAt = new Date().toISOString();
  const { data: updated, error: updateError } = await db.from('affiliate_pro_upgrade_requests').update({
    status: decision,
    review_note: reviewNote || null,
    reviewed_at: reviewedAt,
    updated_at: reviewedAt,
  }).eq('id', request.id).select('id,affiliate_id,method,status,social_platform,social_handle,follower_count,review_note,reviewed_at,created_at').single();
  if (updateError) throw updateError;
  if (decision === 'approved') {
    const { error: accountError } = await db.from('affiliate_accounts').update({
      account_tier: 'pro',
      pro_source: 'social',
      pro_activated_at: reviewedAt,
      updated_at: reviewedAt,
    }).eq('id', request.affiliate_id);
    if (accountError) {
      await db.from('affiliate_pro_upgrade_requests').update({ status: 'pending', review_note: null, reviewed_at: null, updated_at: new Date().toISOString() }).eq('id', request.id);
      throw accountError;
    }
  }
  const { data: affiliateAccount, error: affiliateError } = await db.from('affiliate_accounts')
    .select('id,email,full_name')
    .eq('id', request.affiliate_id)
    .maybeSingle();
  if (affiliateError) console.error('Gagal membaca penerima email review upgrade Pro:', affiliateError);
  if (affiliateAccount) {
    try {
      const sent = await sendAffiliateProUpgradeReviewEmail(c.env, affiliateAccount, decision, reviewNote);
      if (sent?.skipped) console.warn('Email hasil review upgrade Pro dilewati karena SMTP belum dikonfigurasi.');
    } catch (emailError) {
      console.error('Email hasil review upgrade Pro gagal dikirim:', emailError);
    }
  }
  return c.json({
    ok: true,
    request: updated,
    message: decision === 'approved' ? 'Pengajuan disetujui. Akun affiliate sekarang sudah Pro.' : 'Pengajuan upgrade Pro ditolak.',
  });
});

admin.patch('/admin/affiliates/:affiliateId/account', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) return c.json({ ok: false, message: 'Pengelolaan affiliate hanya tersedia pada database utama.' }, 422);
  const input = await c.req.json().catch(() => ({}));
  const fullName = cleanTemplateField(input.full_name, 120);
  const email = String(input.email || '').trim().toLowerCase().slice(0, 254);
  const phone = normalizeAffiliatePhone(input.phone);
  const nik = String(input.nik || '').replace(/\D/g, '').slice(0, 16);
  const referralCode = String(input.referral_code || '').trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  if (fullName.length < 2) return c.json({ ok: false, message: 'Nama affiliate minimal 2 karakter.' }, 422);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ ok: false, message: 'Alamat email tidak valid.' }, 422);
  if (!/^\+?\d{9,15}$/.test(phone)) return c.json({ ok: false, message: 'Nomor WhatsApp tidak valid.' }, 422);
  if (!/^\d{16}$/.test(nik)) return c.json({ ok: false, message: 'NIK wajib terdiri dari 16 digit angka.' }, 422);
  if (!/^[a-zA-Z0-9]{3,32}$/.test(referralCode)) return c.json({ ok: false, message: 'Kode referral wajib 3–32 karakter berupa huruf atau angka.' }, 422);

  const db = database(c.env);
  const { data: current, error: readError } = await db.from('affiliate_accounts')
    .select('id,email,full_name,status')
    .eq('id', c.req.param('affiliateId'))
    .maybeSingle();
  if (readError) throw readError;
  if (!current) return c.json({ ok: false, message: 'Affiliate tidak ditemukan.' }, 404);
  if (!['active', 'suspended'].includes(current.status)) return c.json({ ok: false, message: 'Data ini belum menjadi akun affiliate yang disetujui.' }, 409);

  const { data: updated, error } = await db.from('affiliate_accounts')
    .update({ full_name: fullName, email, phone, nik, referral_code: referralCode, updated_at: new Date().toISOString() })
    .eq('id', current.id)
    .select('id,email,full_name,phone,nik,referral_code,ktp_object_key,status,account_tier,pro_source,pro_activated_at,email_verified_at,reviewed_at,review_note,resubmitted_at,created_at,updated_at')
    .single();
  if (error) {
    if (error.code === '23505' || /duplicate key/i.test(error.message || '')) {
      return c.json({ ok: false, message: 'Email, NIK, atau kode referral sudah digunakan affiliate lain.' }, 409);
    }
    throw error;
  }
  return c.json({ ok: true, affiliate: adminAffiliate(updated), message: 'Data affiliate berhasil diperbarui.' });
});

admin.patch('/admin/affiliates/:affiliateId/status', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) return c.json({ ok: false, message: 'Pengelolaan affiliate hanya tersedia pada database utama.' }, 422);
  const input = await c.req.json().catch(() => ({}));
  const nextStatus = String(input.status || '');
  if (!['active', 'suspended'].includes(nextStatus)) return c.json({ ok: false, message: 'Status affiliate tidak valid.' }, 422);
  const db = database(c.env);
  const { data: current, error: readError } = await db.from('affiliate_accounts')
    .select('id,status,updated_at')
    .eq('id', c.req.param('affiliateId'))
    .maybeSingle();
  if (readError) throw readError;
  if (!current) return c.json({ ok: false, message: 'Affiliate tidak ditemukan.' }, 404);
  if (!['active', 'suspended'].includes(current.status)) return c.json({ ok: false, message: 'Akun ini belum pernah disetujui sebagai affiliate.' }, 409);
  if (current.status === nextStatus) {
    return c.json({ ok: true, message: nextStatus === 'active' ? 'Akun affiliate sudah aktif.' : 'Akun affiliate sudah dinonaktifkan.' });
  }

  const { data: updated, error } = await db.from('affiliate_accounts')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', current.id)
    .select('id,email,full_name,phone,nik,referral_code,ktp_object_key,status,account_tier,pro_source,pro_activated_at,email_verified_at,reviewed_at,review_note,resubmitted_at,created_at,updated_at')
    .single();
  if (error) throw error;
  try {
    const sent = await sendAffiliateAccountStatusEmail(c.env, updated, nextStatus);
    if (sent?.skipped) throw new Error('SMTP admin belum dikonfigurasi.');
  } catch (sendError) {
    const { error: rollbackError } = await db.from('affiliate_accounts')
      .update({ status: current.status, updated_at: current.updated_at })
      .eq('id', current.id);
    if (rollbackError) console.error('Rollback status affiliate gagal:', rollbackError);
    console.error('Email status affiliate gagal:', sendError);
    return c.json({ ok: false, message: 'Email pemberitahuan gagal dikirim. Status akun belum diubah, silakan coba lagi.' }, 502);
  }
  if (nextStatus === 'suspended') {
    const { error: sessionError } = await db.from('affiliate_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('affiliate_id', current.id)
      .is('revoked_at', null);
    if (sessionError) console.error('Gagal mencabut sesi affiliate yang dinonaktifkan:', sessionError);
  }
  return c.json({
    ok: true,
    affiliate: adminAffiliate(updated),
    message: nextStatus === 'active'
      ? 'Akun affiliate berhasil diaktifkan kembali dan email pemberitahuan telah dikirim.'
      : 'Akun affiliate berhasil dinonaktifkan, seluruh sesi login dicabut, dan email pemberitahuan telah dikirim.',
  });
});

admin.patch('/admin/affiliates/:affiliateId/review', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) return c.json({ ok: false, message: 'Review affiliate hanya tersedia pada database utama.' }, 422);
  const input = await c.req.json().catch(() => ({}));
  const decision = String(input.decision || '');
  const reviewNote = cleanTemplateField(input.review_note, 500);
  if (!['approved', 'rejected'].includes(decision)) return c.json({ ok: false, message: 'Keputusan review tidak valid.' }, 422);
  if (decision === 'rejected' && !reviewNote) return c.json({ ok: false, message: 'Alasan penolakan wajib diisi agar dapat dikirim ke affiliate.' }, 422);

  const db = database(c.env);
  const { data: account, error: readError } = await db.from('affiliate_accounts')
    .select('id,email,full_name,email_verified_at,nik,ktp_object_key,status,reviewed_at,review_note,resubmitted_at')
    .eq('id', c.req.param('affiliateId'))
    .maybeSingle();
  if (readError) throw readError;
  if (!account) return c.json({ ok: false, message: 'Pendaftaran affiliate tidak ditemukan.' }, 404);
  if (account.status !== 'pending') return c.json({ ok: false, message: 'Pendaftaran ini sudah pernah direview.' }, 409);
  if (decision === 'approved' && !account.email_verified_at) return c.json({ ok: false, message: 'Email pendaftar belum diverifikasi.' }, 422);
  if (decision === 'approved' && (!account.nik || !account.ktp_object_key)) return c.json({ ok: false, message: 'Data NIK atau KTP belum lengkap.' }, 422);

  const nextStatus = decision === 'approved' ? 'active' : 'rejected';
  const reviewTimestamp = new Date().toISOString();
  const { data: updated, error: updateError } = await db.from('affiliate_accounts')
    .update({ status: nextStatus, reviewed_at: reviewTimestamp, review_note: reviewNote || null })
    .eq('id', account.id)
    .select('id,email,full_name,phone,nik,referral_code,ktp_object_key,status,account_tier,pro_source,pro_activated_at,email_verified_at,reviewed_at,review_note,resubmitted_at,created_at,updated_at')
    .single();
  if (updateError) throw updateError;
  const { data: historyEntry, error: historyError } = await db.from('affiliate_review_history')
    .insert({ affiliate_id: account.id, action: decision, note: reviewNote || null, created_at: reviewTimestamp })
    .select('id,action,note,created_at')
    .single();
  if (historyError) {
    await db.from('affiliate_accounts')
      .update({ status: account.status, reviewed_at: account.reviewed_at, review_note: account.review_note })
      .eq('id', account.id);
    console.error('Riwayat review affiliate gagal disimpan:', historyError);
    return c.json({ ok: false, message: 'Gagal memproses review. Silakan coba lagi.' }, 500);
  }
  try {
    if (decision === 'rejected') {
      await issueAffiliateCorrection(c, db, updated, reviewNote);
    } else {
      const sent = await sendAffiliateReviewEmail(c.env, updated, decision, reviewNote);
      if (sent?.skipped) throw new Error('SMTP admin belum dikonfigurasi.');
    }
  } catch (sendError) {
    await db.from('affiliate_review_history').delete().eq('id', historyEntry.id);
    const { error: rollbackError } = await db.from('affiliate_accounts')
      .update({ status: account.status, reviewed_at: account.reviewed_at, review_note: account.review_note })
      .eq('id', account.id);
    if (rollbackError) console.error('Rollback review affiliate gagal:', rollbackError);
    console.error('Email hasil review affiliate gagal:', sendError);
    return c.json({ ok: false, message: 'Email hasil review gagal dikirim. Status pendaftaran belum diubah, silakan coba lagi.' }, 502);
  }
  if (nextStatus !== 'active') {
    const { error: sessionError } = await db.from('affiliate_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('affiliate_id', account.id)
      .is('revoked_at', null);
    if (sessionError) throw sessionError;
  }
  const { data: reviewHistory, error: reviewHistoryError } = await db.from('affiliate_review_history')
    .select('id,action,note,created_at')
    .eq('affiliate_id', account.id)
    .order('created_at', { ascending: true });
  if (reviewHistoryError) console.error('Gagal memuat ulang riwayat review affiliate:', reviewHistoryError);
  return c.json({
    ok: true,
    affiliate: {
      ...adminAffiliate(updated),
      review_history: reviewHistoryError ? [historyEntry] : reviewHistory,
    },
    message: decision === 'approved' ? 'Pendaftaran disetujui dan hasilnya dikirim melalui email.' : 'Pendaftaran ditolak dan alasannya dikirim melalui email.',
  });
});

admin.post('/admin/affiliates/:affiliateId/resend-correction', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) return c.json({ ok: false, message: 'Fitur ini hanya tersedia pada database utama.' }, 422);
  const db = database(c.env);
  const { data: account, error } = await db.from('affiliate_accounts')
    .select('id,email,full_name,status,review_note')
    .eq('id', c.req.param('affiliateId'))
    .maybeSingle();
  if (error) throw error;
  if (!account) return c.json({ ok: false, message: 'Pendaftaran affiliate tidak ditemukan.' }, 404);
  if (account.status !== 'rejected') return c.json({ ok: false, message: 'Link perbaikan hanya dapat dikirim untuk pendaftaran yang ditolak.' }, 409);
  if (!account.review_note) return c.json({ ok: false, message: 'Alasan penolakan belum tersedia.' }, 422);

  try {
    await issueAffiliateCorrection(c, db, account, account.review_note);
  } catch (sendError) {
    console.error('Kirim ulang email perbaikan affiliate gagal:', sendError);
    return c.json({ ok: false, message: 'Email perbaikan gagal dikirim. Silakan coba lagi.' }, 502);
  }
  return c.json({ ok: true, message: 'Email berisi alasan dan link perbaikan berhasil dikirim ulang.' });
});

admin.get('/admin/media/*', async (c) => {
  if (!c.env.MEDIA) return c.json({ ok: false, message: 'Gambar tidak tersedia.' }, 404);
  const key = decodeURIComponent(c.req.path.replace(/^\/api\/admin\/media\//, ''));
  if (!key || key.includes('..')) return c.json({ ok: false, message: 'Gambar tidak tersedia.' }, 404);
  const object = await c.env.MEDIA.get(key);
  if (!object) return c.json({ ok: false, message: 'Gambar tidak tersedia.' }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', headers.get('cache-control') || 'private, max-age=3600');
  return new Response(object.body, { headers });
});

admin.post('/admin/homepage/hero-image', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) {
    return c.json({ ok: false, message: 'Pengaturan homepage hanya tersedia pada database utama.' }, 422);
  }

  const form = await c.req.formData();
  const file = form.get('file');
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!(file instanceof File)) return c.json({ ok: false, message: 'Pilih gambar hero terlebih dahulu.' }, 422);
  if (!allowedTypes.includes(file.type)) return c.json({ ok: false, message: 'Format gambar harus JPG, PNG, atau WEBP.' }, 422);
  if (file.size > 4 * 1024 * 1024) return c.json({ ok: false, message: 'Ukuran gambar maksimal 4 MB.' }, 422);
  if (!c.env.MEDIA) return c.json({ ok: false, message: 'Penyimpanan gambar belum tersedia.' }, 503);

  const db = database(c.env);
  const current = await homepageAdminSettings(db);
  const key = `homepage/hero/${crypto.randomUUID()}.${imageExtension(file)}`;
  await c.env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
    customMetadata: { originalName: String(file.name || 'homepage-hero').slice(0, 150) },
  });

  const { error } = await db.from('site_settings').upsert({
    key: 'homepage_hero_image',
    value: key,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });
  if (error) {
    await c.env.MEDIA.delete(key);
    if (['42P01', 'PGRST205'].includes(error.code)) {
      return c.json({ ok: false, message: 'Pengaturan homepage belum tersedia. Jalankan migration homepage terlebih dahulu.' }, 503);
    }
    throw error;
  }

  if (current.hero_image_key?.startsWith('homepage/hero/') && current.hero_image_key !== key) {
    await c.env.MEDIA.delete(current.hero_image_key);
  }
  return c.json({
    ok: true,
    hero_image_key: key,
    hero_image_url: `/api/admin/media/${key}`,
    message: 'Gambar hero homepage berhasil diganti.',
  });
});

admin.patch('/admin/templates/:templateCode', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const update = {
    name: cleanTemplateField(input.name, 100),
    category: cleanTemplateField(input.category, 50),
    description: cleanTemplateField(input.description, 255),
  };
  if (!update.name) return c.json({ ok: false, message: 'Nama template wajib diisi.' }, 422);
  if (!update.category) return c.json({ ok: false, message: 'Kategori template wajib diisi.' }, 422);
  if (!update.description) return c.json({ ok: false, message: 'Deskripsi template wajib diisi.' }, 422);

  if (!hasRealSupabaseConfig(c.env)) {
    const template = demoTemplates().find((item) => item.code === c.req.param('templateCode'));
    if (!template) return c.json({ ok: false, message: 'Template tidak ditemukan.' }, 404);
    Object.assign(template, update);
    return c.json({ ok: true, template: adminTemplate(c.env, template), message: 'Informasi template berhasil disimpan.' });
  }

  const { data: template, error } = await database(c.env).from('templates')
    .update(update)
    .eq('code', c.req.param('templateCode'))
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!template) return c.json({ ok: false, message: 'Template tidak ditemukan.' }, 404);
  return c.json({ ok: true, template: adminTemplate(c.env, template), message: 'Informasi template berhasil disimpan.' });
});

admin.patch('/admin/templates/:templateCode/visibility', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const isActive = input.is_active === true;
  const templateCode = c.req.param('templateCode');
  if (!hasRealSupabaseConfig(c.env)) {
    const template = demoTemplates().find((item) => item.code === templateCode);
    if (!template) return c.json({ ok: false, message: 'Template tidak ditemukan.' }, 404);
    template.is_active = isActive;
    return c.json({ ok: true, is_active: isActive, message: isActive ? 'Template ditampilkan kembali.' : 'Template disembunyikan dari katalog.' });
  }
  const { data: template, error } = await database(c.env).from('templates')
    .update({ is_active: isActive })
    .eq('code', templateCode)
    .select('id,is_active')
    .maybeSingle();
  if (error) throw error;
  if (!template) return c.json({ ok: false, message: 'Template tidak ditemukan.' }, 404);
  return c.json({ ok: true, is_active: template.is_active, message: isActive ? 'Template ditampilkan kembali.' : 'Template disembunyikan dari katalog.' });
});

admin.post('/admin/templates/:templateCode/cover', async (c) => {
  const form = await c.req.formData();
  const file = form.get('file');
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!(file instanceof File)) return c.json({ ok: false, message: 'Pilih gambar sampul terlebih dahulu.' }, 422);
  if (!allowedTypes.includes(file.type)) return c.json({ ok: false, message: 'Format sampul harus JPG, PNG, atau WEBP.' }, 422);
  if (file.size > 4 * 1024 * 1024) return c.json({ ok: false, message: 'Ukuran sampul maksimal 4 MB.' }, 422);
  if (!c.env.MEDIA) return c.json({ ok: false, message: 'Penyimpanan gambar belum tersedia.' }, 503);

  const templateCode = c.req.param('templateCode');
  let template;
  if (!hasRealSupabaseConfig(c.env)) {
    template = demoTemplates().find((item) => item.code === templateCode);
  } else {
    const { data, error } = await database(c.env).from('templates').select('*').eq('code', templateCode).maybeSingle();
    if (error) throw error;
    template = data;
  }
  if (!template) return c.json({ ok: false, message: 'Template tidak ditemukan.' }, 404);

  const safeCode = String(templateCode).replace(/[^a-z0-9_-]/gi, '').slice(0, 50) || 'template';
  const oldThumbnail = String(template.thumbnail || '');
  const key = `template-covers/${safeCode}/${crypto.randomUUID()}.${imageExtension(file)}`;
  await c.env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
    customMetadata: { originalName: String(file.name || 'cover').slice(0, 150) },
  });

  try {
    if (!hasRealSupabaseConfig(c.env)) template.thumbnail = key;
    else {
      const { error } = await database(c.env).from('templates').update({ thumbnail: key }).eq('id', template.id);
      if (error) throw error;
    }
  } catch (error) {
    await c.env.MEDIA.delete(key);
    throw error;
  }

  if (oldThumbnail.startsWith('template-covers/') && oldThumbnail !== key) await c.env.MEDIA.delete(oldThumbnail);
  return c.json({
    ok: true,
    thumbnail: key,
    thumbnail_url: templateCoverUrl(c.env, key),
    message: 'Gambar sampul berhasil diganti.',
  });
});

admin.patch('/admin/templates/:templateCode/packages/:packageCode/price', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const price = Math.max(0, Number(input.price ?? 0));
  if (!Number.isFinite(price)) {
    return c.json({ ok: false, message: 'Harga paket tidak valid.' }, 400);
  }

  if (!hasRealSupabaseConfig(c.env)) {
    const template = demoTemplates().find((item) => item.code === c.req.param('templateCode'));
    if (!template) return c.json({ ok: false, message: 'Template tidak ditemukan.' }, 404);
    const selectedPackage = template.template_packages?.find((item) => item.code === c.req.param('packageCode'));
    if (!selectedPackage) return c.json({ ok: false, message: 'Paket template tidak ditemukan.' }, 404);
    selectedPackage.price = Math.round(price);
    if (template.packages) {
      const packageMatch = template.packages.find((item) => item.code === c.req.param('packageCode'));
      if (packageMatch) packageMatch.price = Math.round(price);
    }
    return c.json({ ok: true, template_code: template.code, package_code: selectedPackage.code, price: Math.round(price) });
  }

  const db = database(c.env);
  const { data: template, error: templateError } = await db.from('templates').select('id').eq('code', c.req.param('templateCode')).maybeSingle();
  if (templateError) throw templateError;
  if (!template) return c.json({ ok: false, message: 'Template tidak ditemukan.' }, 404);
  const { data: selectedPackage, error: packageError } = await db.from('template_packages').select('id').eq('template_id', template.id).eq('code', c.req.param('packageCode')).maybeSingle();
  if (packageError) throw packageError;
  if (!selectedPackage) return c.json({ ok: false, message: 'Paket template tidak ditemukan.' }, 404);
  const { error } = await db.from('template_packages').update({ price: Math.round(price) }).eq('id', selectedPackage.id);
  if (error) throw error;
  return c.json({ ok: true, template_code: template.code, package_code: selectedPackage.code, price: Math.round(price) });
});

admin.patch('/admin/templates/:templateCode/packages/:packageCode/visibility', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const isActive = input.is_active === true;
  const templateCode = c.req.param('templateCode');
  const packageCode = c.req.param('packageCode');
  if (!hasRealSupabaseConfig(c.env)) {
    const template = demoTemplates().find((item) => item.code === templateCode);
    const selectedPackage = template?.template_packages?.find((item) => item.code === packageCode);
    if (!template || !selectedPackage) return c.json({ ok: false, message: 'Paket template tidak ditemukan.' }, 404);
    selectedPackage.is_active = isActive;
    return c.json({ ok: true, is_active: isActive, message: isActive ? 'Paket ditampilkan kembali.' : 'Paket disembunyikan dari katalog.' });
  }
  const db = database(c.env);
  const { data: template, error: templateError } = await db.from('templates').select('id').eq('code', templateCode).maybeSingle();
  if (templateError) throw templateError;
  if (!template) return c.json({ ok: false, message: 'Template tidak ditemukan.' }, 404);
  const { data: selectedPackage, error } = await db.from('template_packages')
    .update({ is_active: isActive })
    .eq('template_id', template.id)
    .eq('code', packageCode)
    .select('id,is_active')
    .maybeSingle();
  if (error) throw error;
  if (!selectedPackage) return c.json({ ok: false, message: 'Paket template tidak ditemukan.' }, 404);
  return c.json({ ok: true, is_active: selectedPackage.is_active, message: isActive ? 'Paket ditampilkan kembali.' : 'Paket disembunyikan dari katalog.' });
});

admin.patch('/admin/orders/:code/website', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const active = input.active === true;
  if (!hasRealSupabaseConfig(c.env)) {
    const order = DEMO_STATE.orders.get(c.req.param('code'));
    if (!order) return c.json({ ok: false, message: 'Order tidak ditemukan.' }, 404);
    if (active && (!order.published_at || order.status !== 'published')) return c.json({ ok: false, message: 'Undangan harus dipublish terlebih dahulu sebelum dapat diaktifkan.' }, 422);
    if (active && (!order.active_until || new Date(order.active_until) <= new Date())) return c.json({ ok: false, message: 'Masa aktif undangan sudah berakhir.' }, 422);
    order.website_active = active;
    return c.json({ ok: true, website_active: active, message: active ? 'Website customer diaktifkan.' : 'Website customer dinonaktifkan.' });
  }
  const db = database(c.env);
  const { data: order, error: orderError } = await db.from('orders').select('id,status').eq('order_code', c.req.param('code')).maybeSingle();
  if (orderError) throw orderError;
  if (!order) return c.json({ ok: false, message: 'Order tidak ditemukan.' }, 404);
  const { data: invitation, error: invitationReadError } = await db.from('invitations').select('published_at,active_until').eq('order_id', order.id).maybeSingle();
  if (invitationReadError) throw invitationReadError;
  if (!invitation) return c.json({ ok: false, message: 'Data undangan tidak ditemukan.' }, 404);
  if (active && (!invitation.published_at || order.status !== 'published')) return c.json({ ok: false, message: 'Undangan harus dipublish terlebih dahulu sebelum dapat diaktifkan.' }, 422);
  if (active && (!invitation.active_until || new Date(invitation.active_until) <= new Date())) return c.json({ ok: false, message: 'Masa aktif undangan sudah berakhir.' }, 422);
  const { error } = await db.from('invitations').update({ is_active: active }).eq('order_id', order.id);
  if (error) throw error;
  return c.json({ ok: true, website_active: active, message: active ? 'Website customer diaktifkan.' : 'Website customer dinonaktifkan.' });
});

admin.patch('/admin/orders/:code/referral', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const referralName = String(input.referral_name || '').trim().slice(0, 120);
  const referralAmount = Math.max(0, Math.round(Number(input.referral_amount) || 0));
  if (!hasRealSupabaseConfig(c.env)) {
    const order = DEMO_STATE.orders.get(c.req.param('code'));
    if (!order) return c.json({ ok: false, message: 'Order tidak ditemukan.' }, 404);
    order.referral_name = referralName;
    order.referral_amount = referralAmount;
    return c.json({ ok: true, referral_name: referralName, referral_amount: referralAmount });
  }
  const db = database(c.env);
  const { data: updated, error } = await db.from('orders')
    .update({ referral_name: referralName || null, referral_amount: referralAmount })
    .eq('order_code', c.req.param('code'))
    .select('order_code,referral_name,referral_amount')
    .maybeSingle();
  if (error) throw error;
  if (!updated) return c.json({ ok: false, message: 'Invoice tidak ditemukan di database.' }, 404);
  return c.json({ ok: true, order_code: updated.order_code, referral_name: updated.referral_name || '', referral_amount: Number(updated.referral_amount || 0) });
});

export default admin;
