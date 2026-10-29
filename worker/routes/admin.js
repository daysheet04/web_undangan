import { Hono } from 'hono';
import { database } from '../lib/database.js';
import { sendAffiliateAccountStatusEmail, sendAffiliateProUpgradeReviewEmail, sendAffiliateReviewEmail, sendAffiliateWithdrawalStatusEmail, sendComplimentaryOrderEmail } from '../lib/email.js';
import { cleanText, normalizePhone, orderCode, randomHex, validEmail, validPhone } from '../lib/helpers.js';
import { allTemplates, canonicalTemplateCode, demoTemplates, findActiveSlugConflict, hasRealSupabaseConfig } from '../lib/repositories.js';
import {
  deleteTemplateGalleryPhoto,
  deleteTemplateMusic,
  deleteTemplatePackagePhoto,
  getTemplateDemoData,
  saveTemplateDemoData,
  uploadTemplateCouplePhoto,
  uploadTemplateGalleryPhoto,
  uploadTemplateMusic,
  uploadTemplatePackagePhoto,
} from '../lib/templateDemoStore.js';

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
  return {
    ...template,
    thumbnail_url: templateCoverUrl(env, template.thumbnail),
    phone_cover_url: templateCoverUrl(env, template.phone_cover),
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
  if (['/api/admin/login', '/api/admin/logout', '/api/admin/session'].includes(c.req.path) || c.req.path.startsWith('/api/admin/media/') || c.req.method === 'OPTIONS') return next();
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
    affiliate_id: order.affiliate_id || null,
    affiliate_name: order.affiliate_name || order.affiliate?.full_name || null,
    affiliate_email: order.affiliate_email || order.affiliate?.email || null,
    affiliate_referral_code: order.affiliate_referral_code || order.affiliate?.referral_code || null,
    affiliate_status: order.affiliate_status || order.affiliate?.status || null,
    affiliate_commission_percent: Number(order.affiliate_commission_percent || 0),
    affiliate_commission_amount: Number(order.affiliate_commission_amount || order.referral_amount || 0),
    order_source: order.order_source || 'customer',
    complimentary_note: order.complimentary_note || '',
    template_name: order.template_name,
    template_code: order.template_code,
    package_name: order.package_name,
    package_code: order.package_code,
    payment_status: order.payment_status,
    paid_at: order.paid_at || null,
    gateway: order.gateway || null,
    transaction_id: order.transaction_id || null,
    gateway_order_id: order.gateway_order_id || null,
    status: order.status,
    website_active: websiteActive,
    website_enabled: Boolean(order.website_enabled ?? order.is_active ?? order.website_active),
    active_until: order.active_until || null,
    slug: order.slug || null,
    published_at: order.published_at || null,
    editor_url: order.payment_status === 'paid' && order.editor_token ? publicAppUrl(env, `/edit/${order.editor_token}`) : null,
    website_url: order.slug ? publicAppUrl(env, `/${order.slug}`) : null,
    package_price: Number(order.package_price || 0),
    payment_amount: Number(order.payment_amount ?? (order.order_source === 'admin_free' ? 0 : order.package_price) ?? 0),
    editor_email_sent_at: order.editor_email_sent_at || null,
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
  const affiliateMap = new Map();

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

  const affiliateIds = [...new Set((orderResult.data || []).map((order) => order.affiliate_id).filter(Boolean))];
  if (affiliateIds.length) {
    const { data: affiliateData, error: affiliateError } = await db.from('affiliate_accounts')
      .select('id,full_name,email,referral_code,status')
      .in('id', affiliateIds);
    if (affiliateError) throw affiliateError;
    (affiliateData || []).forEach((item) => affiliateMap.set(item.id, item));
  }

  const invitations = new Map((invitationResult.data || []).map((item) => [item.order_id, item]));
  const payments = new Map((paymentResult.data || []).map((item) => [item.order_id, item]));
  return (orderResult.data || []).map((order) => {
    const template = templateMap.get(order.template_id) || {};
    const packageInfo = packageMap.get(order.package_id) || {};
    const payment = payments.get(order.id) || {};
    const invitation = invitations.get(order.id) || {};
    const affiliate = affiliateMap.get(order.affiliate_id) || null;
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
      affiliate_name: affiliate?.full_name || null,
      affiliate_email: affiliate?.email || null,
      affiliate_referral_code: affiliate?.referral_code || null,
      affiliate_status: affiliate?.status || null,
      affiliate_commission_percent: Number(order.affiliate_commission_percent || 0),
      affiliate_commission_amount: Number(order.affiliate_commission_amount || 0),
      gallery_limit: packageInfo.gallery_limit ?? null,
      has_music: Boolean(packageInfo.has_music),
      has_gift: Boolean(packageInfo.has_gift),
      has_wishes: Boolean(packageInfo.has_wishes),
      website_active: order.status === 'published' && Boolean(invitation.published_at) && invitation.is_active === true && Boolean(activeUntil) && activeUntil > new Date(),
      website_enabled: invitation.is_active === true,
      active_until: invitation.active_until || null,
      slug: invitation.slug || null,
      published_at: invitation.published_at || null,
      payment_amount: Number(payment.amount ?? packagePrice ?? 0),
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

async function adminAffiliateOptions(env) {
  if (!hasRealSupabaseConfig(env)) {
    const unique = new Map();
    for (const order of demoOrders(env)) {
      if (!order.affiliate_id || unique.has(order.affiliate_id)) continue;
      unique.set(order.affiliate_id, {
        id: order.affiliate_id,
        full_name: order.affiliate_name || order.referral_name || 'Affiliate',
        email: order.affiliate_email || '',
        referral_code: order.affiliate_referral_code || '',
        status: order.affiliate_status || 'active',
      });
    }
    return [...unique.values()];
  }
  const { data, error } = await database(env).from('affiliate_accounts')
    .select('id,full_name,email,referral_code,status')
    .in('status', ['active', 'suspended'])
    .order('full_name', { ascending: true });
  if (error) throw error;
  return data || [];
}

admin.get('/admin/summary', async (c) => {
  const orders = await adminOrders(c.env);
  const salesOrders = orders.filter((order) => order.order_source !== 'admin_free');
  const templates = await allTemplates(c.env);
  const affiliateOptions = await adminAffiliateOptions(c.env);
  const db = hasRealSupabaseConfig(c.env) ? database(c.env) : null;
  let templateCount = templates.length;
  if (db) {
    const { count, error } = await db.from('templates').select('id', { count: 'exact', head: true });
    if (error) throw error;
    templateCount = count || 0;
  }
  const paidOrders = salesOrders.filter((order) => order.payment_status === 'paid');
  const summary = {
    total_orders: salesOrders.length,
    total_paid: paidOrders.length,
    total_published: salesOrders.filter((order) => order.status === 'published').length,
    total_templates: templateCount,
    total_revenue: paidOrders.reduce((total, order) => total + Number(order.payment_amount ?? order.package_price ?? 0), 0),
    total_pending: salesOrders.filter((order) => order.payment_status === 'pending').length,
    total_inactive: salesOrders.filter((order) => order.website_active === false).length,
  };
  const revenueByDate = paidOrders.reduce((items, order) => {
    const date = String(order.paid_at || order.created_at || '').slice(0, 10);
    if (!date) return items;
    items[date] = (items[date] || 0) + Number(order.payment_amount ?? order.package_price ?? 0);
    return items;
  }, {});
  const referralSummary = Object.values(salesOrders.reduce((items, order) => {
    const name = String(order.referral_name || '').trim() || 'Tanpa referral';
    if (!items[name]) items[name] = { name, orders: 0, revenue: 0 };
    items[name].orders += 1;
    if (order.payment_status === 'paid') items[name].revenue += Number(order.payment_amount ?? order.package_price ?? 0);
    return items;
  }, {})).sort((a, b) => b.revenue - a.revenue || b.orders - a.orders);

  let withdrawals = [];
  let affiliates = [];
  if (db) {
    try {
      const [withdrawalRes, affiliateRes] = await Promise.all([
        db.from('affiliate_withdrawals')
          .select('id,affiliate_id,amount,fee_percent,fee_amount,net_amount,payout_method,provider,account_name,account_number,status,admin_note,requested_at,processed_at,updated_at')
          .order('requested_at', { ascending: false })
          .limit(1000),
        db.from('affiliate_accounts')
          .select('id,email,full_name,phone,nik,referral_code,status,account_tier,pro_source,created_at,updated_at')
          .order('created_at', { ascending: false })
          .limit(1000),
      ]);
      const affMap = new Map((affiliateRes.data || []).map((a) => [a.id, a]));
      withdrawals = (withdrawalRes.data || []).map((w) => ({
        ...w,
        amount: Number(w.amount || 0),
        fee_percent: Number(w.fee_percent || 0),
        fee_amount: Number(w.fee_amount || 0),
        net_amount: Number(w.net_amount || w.amount || 0),
        affiliate: affMap.get(w.affiliate_id) || null,
      }));
      affiliates = affiliateRes.data || [];
    } catch (extraErr) {
      console.warn('Non-fatal: failed to fetch admin summary withdrawals/affiliates', extraErr);
    }
  }

  return c.json({
    ok: true,
    summary,
    orders,
    withdrawals,
    affiliates,
    templates: templates.map((template) => adminTemplate(c.env, template)),
    affiliate_options: affiliateOptions,
    revenue_by_date: revenueByDate,
    referral_summary: referralSummary,
    mode: hasRealSupabaseConfig(c.env) ? 'database' : 'demo'
  });
});

admin.get('/admin/orders', async (c) => {
  return c.json({ ok: true, orders: await adminOrders(c.env), mode: hasRealSupabaseConfig(c.env) ? 'database' : 'demo' });
});

admin.post('/admin/complimentary-orders', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const customerName = cleanText(input.customer_name, 120);
  const customerEmail = cleanText(input.customer_email, 254).toLowerCase();
  const customerPhone = cleanText(input.customer_phone, 24);
  const templateCode = cleanText(input.template_code, 50);
  const packageCode = cleanText(input.package_code, 30);
  const complimentaryNote = cleanText(input.complimentary_note, 500);
  const errors = {};

  if (customerName.length < 3) errors.customer_name = 'Nama lengkap minimal 3 karakter.';
  if (!validEmail(customerEmail)) errors.customer_email = 'Masukkan alamat email yang valid.';
  if (!validPhone(customerPhone)) errors.customer_phone = 'Gunakan nomor Indonesia yang diawali 08 atau +62.';

  const templates = await allTemplates(c.env);
  const template = templates.find((item) => item.code === templateCode || canonicalTemplateCode(item.code) === canonicalTemplateCode(templateCode));
  const selectedPackage = template?.packages?.find((item) => item.code === packageCode);
  if (!template) errors.template_code = 'Pilih template yang tersedia.';
  if (!selectedPackage) errors.package_code = 'Pilih paket yang tersedia untuk template tersebut.';
  if (Object.keys(errors).length) return c.json({ ok: false, message: 'Periksa kembali data order gratis.', errors }, 422);

  const code = orderCode();
  const editorToken = randomHex(32);
  const now = new Date().toISOString();
  if (!hasRealSupabaseConfig(c.env)) {
    DEMO_STATE.orders.set(code, {
      id: `demo-${code}`,
      order_code: code,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: normalizePhone(customerPhone),
      template_id: template.id,
      template_code: template.code,
      template_name: template.name,
      template_category: template.category,
      package_id: selectedPackage.id,
      package_code: selectedPackage.code,
      package_name: selectedPackage.name,
      package_price: Number(selectedPackage.price || 0),
      editor_token: editorToken,
      status: 'editing',
      payment_status: 'paid',
      payment_amount: 0,
      paid_at: now,
      gateway: 'admin_complimentary',
      transaction_id: `FREE-${code}`,
      order_source: 'admin_free',
      complimentary_note: complimentaryNote,
      referral_name: null,
      referral_amount: 0,
      website_active: false,
      active_until: null,
      created_at: now,
      updated_at: now,
    });
  } else {
    const db = database(c.env);
    const { error } = await db.rpc('create_daymoment_admin_free_order', {
      p_order_code: code,
      p_template_id: template.id,
      p_package_id: selectedPackage.id,
      p_customer_name: customerName,
      p_customer_phone: normalizePhone(customerPhone),
      p_customer_email: customerEmail,
      p_editor_token: editorToken,
      p_complimentary_note: complimentaryNote || null,
    });
    if (error) throw error;
  }

  let createdOrder = (await adminOrders(c.env)).find((item) => item.order_code === code);
  const editorUrl = publicAppUrl(c.env, `/edit/${encodeURIComponent(editorToken)}`);
  let emailSent = false;
  let emailWarning = '';
  try {
    const sent = await sendComplimentaryOrderEmail(c.env, createdOrder || {
      order_code: code,
      customer_name: customerName,
      customer_email: customerEmail,
      template_name: template.name,
      package_name: selectedPackage.name,
    }, editorUrl);
    emailSent = sent?.skipped !== true;
    if (!emailSent) emailWarning = 'SMTP belum dikonfigurasi, jadi email belum terkirim.';
  } catch (emailError) {
    console.error('Complimentary order email failed:', emailError.message);
    emailWarning = 'Order berhasil dibuat, tetapi email gagal dikirim. Gunakan tombol kirim ulang.';
  }

  if (emailSent) {
    if (!hasRealSupabaseConfig(c.env)) {
      const stored = DEMO_STATE.orders.get(code);
      if (stored) stored.editor_email_sent_at = now;
    } else {
      const db = database(c.env);
      const { error: emailStampError } = await db.from('orders').update({ editor_email_sent_at: now }).eq('order_code', code);
      if (emailStampError) console.error('Complimentary email timestamp failed:', emailStampError.message);
    }
    createdOrder = { ...createdOrder, editor_email_sent_at: now };
  }

  return c.json({
    ok: true,
    order: { ...createdOrder, editor_url: editorUrl },
    email_sent: emailSent,
    message: emailSent ? 'Order gratis berhasil dibuat dan akses editor sudah dikirim ke email customer.' : emailWarning,
  }, 201);
});

admin.post('/admin/complimentary-orders/:code/resend-email', async (c) => {
  const code = c.req.param('code');
  const order = (await adminOrders(c.env)).find((item) => item.order_code === code);
  if (!order || order.order_source !== 'admin_free') return c.json({ ok: false, message: 'Order gratis tidak ditemukan.' }, 404);
  if (!order.editor_url) return c.json({ ok: false, message: 'Akses editor untuk order ini belum tersedia.' }, 422);

  try {
    const sent = await sendComplimentaryOrderEmail(c.env, order, order.editor_url);
    if (sent?.skipped) return c.json({ ok: false, message: 'SMTP belum dikonfigurasi sehingga email belum dapat dikirim.' }, 503);
  } catch (emailError) {
    console.error('Complimentary order resend failed:', emailError.message);
    return c.json({ ok: false, message: 'Email gagal dikirim. Periksa konfigurasi SMTP lalu coba lagi.' }, 502);
  }

  const sentAt = new Date().toISOString();
  if (!hasRealSupabaseConfig(c.env)) {
    const stored = DEMO_STATE.orders.get(code);
    if (stored) stored.editor_email_sent_at = sentAt;
  } else {
    const db = database(c.env);
    const { error } = await db.from('orders').update({ editor_email_sent_at: sentAt }).eq('order_code', code);
    if (error) throw error;
  }
  return c.json({ ok: true, email_sent_at: sentAt, message: `Akses editor berhasil dikirim ulang ke ${order.customer_email}.` });
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
    social_platform: account.social_platform,
    social_handle: account.social_handle,
    social_follower_count: account.social_follower_count != null ? Number(account.social_follower_count) : null,
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
    social_proof_url: account.social_proof_object_key ? `/api/admin/affiliates/${account.id}/social-proof` : null,
  };
}

admin.get('/admin/affiliates', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) return c.json({ ok: true, affiliates: [], social_platforms: [], summary: { pending: 0, active: 0, rejected: 0 } });
  const db = database(c.env);
  const [accountResult, platformResult] = await Promise.all([
    db.from('affiliate_accounts')
      .select('id,email,full_name,phone,nik,referral_code,ktp_object_key,social_platform,social_handle,social_follower_count,social_proof_object_key,status,account_tier,pro_source,pro_activated_at,email_verified_at,reviewed_at,review_note,resubmitted_at,created_at,updated_at')
      .order('updated_at', { ascending: false })
      .limit(500),
    db.from('affiliate_social_platforms')
      .select('id,name,is_active,sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
  ]);
  if (accountResult.error) throw accountResult.error;
  if (platformResult.error) throw platformResult.error;
  const data = accountResult.data;
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
    social_platforms: platformResult.data || [],
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

admin.get('/admin/affiliates/:affiliateId/social-proof', async (c) => {
  if (!c.env.MEDIA || !hasRealSupabaseConfig(c.env)) return c.json({ ok: false, message: 'Bukti media sosial tidak ditemukan.' }, 404);
  const { data: account, error } = await database(c.env).from('affiliate_accounts')
    .select('social_proof_object_key')
    .eq('id', c.req.param('affiliateId'))
    .maybeSingle();
  if (error) throw error;
  if (!account?.social_proof_object_key) return c.json({ ok: false, message: 'Bukti media sosial tidak ditemukan.' }, 404);
  const object = await c.env.MEDIA.get(account.social_proof_object_key);
  if (!object) return c.json({ ok: false, message: 'Bukti media sosial tidak ditemukan.' }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'private, no-store');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('content-disposition', 'inline; filename="media-sosial-affiliate"');
  return new Response(object.body, { headers });
});

admin.get('/admin/withdrawals', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) return c.json({ ok: true, withdrawals: [], settings: { min_withdrawal_amount: 50000, fee_percent: 0, sender_bank_name: '', sender_account_name: '', sender_account_number: '' }, summary: { pending: 0, processing: 0, paid: 0, rejected: 0 } });
  const db = database(c.env);
  const [withdrawalResult, settingsResult] = await Promise.all([
    db.from('affiliate_withdrawals')
      .select('id,affiliate_id,amount,fee_percent,fee_amount,net_amount,payout_method,provider,account_name,account_number,sender_bank_name,sender_account_name,sender_account_number,status,admin_note,transfer_proof_object_key,requested_at,processed_at,updated_at')
      .order('requested_at', { ascending: false })
      .limit(1000),
    db.from('affiliate_withdrawal_settings')
      .select('min_withdrawal_amount,fee_percent,sender_bank_name,sender_account_name,sender_account_number,updated_at')
      .eq('singleton', true)
      .maybeSingle(),
  ]);
  if (withdrawalResult.error) throw withdrawalResult.error;
  if (settingsResult.error) throw settingsResult.error;
  const affiliateIds = [...new Set((withdrawalResult.data || []).map((item) => item.affiliate_id).filter(Boolean))];
  const affiliateResult = affiliateIds.length
    ? await db.from('affiliate_accounts').select('id,email,full_name,phone,referral_code').in('id', affiliateIds)
    : { data: [], error: null };
  if (affiliateResult.error) throw affiliateResult.error;
  const accountMap = new Map((affiliateResult.data || []).map((account) => [account.id, account]));
  const withdrawals = (withdrawalResult.data || []).map(({ transfer_proof_object_key: proofKey, ...item }) => ({
    ...item,
    amount: Number(item.amount || 0),
    fee_percent: Number(item.fee_percent || 0),
    fee_amount: Number(item.fee_amount || 0),
    net_amount: Number(item.net_amount || item.amount || 0),
    affiliate: accountMap.get(item.affiliate_id) || null,
    has_transfer_proof: Boolean(proofKey),
    transfer_proof_url: proofKey ? `/api/admin/withdrawals/${item.id}/proof` : null,
  }));
  return c.json({
    ok: true,
    withdrawals,
    settings: {
      min_withdrawal_amount: Number(settingsResult.data?.min_withdrawal_amount || 50000),
      fee_percent: Number(settingsResult.data?.fee_percent || 0),
      sender_bank_name: settingsResult.data?.sender_bank_name || '',
      sender_account_name: settingsResult.data?.sender_account_name || '',
      sender_account_number: settingsResult.data?.sender_account_number || '',
      updated_at: settingsResult.data?.updated_at || null,
    },
    summary: {
      pending: withdrawals.filter((item) => item.status === 'pending').length,
      processing: withdrawals.filter((item) => item.status === 'processing').length,
      paid: withdrawals.filter((item) => item.status === 'paid').length,
      rejected: withdrawals.filter((item) => ['rejected', 'cancelled'].includes(item.status)).length,
    },
  });
});

admin.patch('/admin/withdrawal-settings', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) return c.json({ ok: false, message: 'Pengaturan penarikan hanya tersedia pada database utama.' }, 422);
  const input = await c.req.json().catch(() => ({}));
  const feePercent = Number(input.fee_percent);
  const minWithdrawalAmount = Number(input.min_withdrawal_amount || 50000);
  const senderBankName = cleanTemplateField(input.sender_bank_name, 80);
  const senderAccountName = cleanTemplateField(input.sender_account_name, 120);
  const senderAccountNumber = String(input.sender_account_number || '').trim().replace(/\s+/g, '').slice(0, 80);
  if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > 100) return c.json({ ok: false, message: 'Fee penarikan harus berada di antara 0% sampai 100%.' }, 422);
  if (!Number.isFinite(minWithdrawalAmount) || minWithdrawalAmount < 10000) return c.json({ ok: false, message: 'Minimal penarikan harus berupa angka minimal Rp10.000.' }, 422);
  if (!senderBankName || !senderAccountName || senderAccountNumber.length < 5) return c.json({ ok: false, message: 'Lengkapi informasi rekening pengirim Daymoment.' }, 422);
  const { data, error } = await database(c.env).from('affiliate_withdrawal_settings').upsert({
    singleton: true,
    min_withdrawal_amount: Math.round(minWithdrawalAmount),
    fee_percent: Math.round(feePercent * 100) / 100,
    sender_bank_name: senderBankName,
    sender_account_name: senderAccountName,
    sender_account_number: senderAccountNumber,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'singleton' }).select('min_withdrawal_amount,fee_percent,sender_bank_name,sender_account_name,sender_account_number,updated_at').single();
  if (error) throw error;
  return c.json({ ok: true, settings: { ...data, min_withdrawal_amount: Number(data.min_withdrawal_amount || 50000), fee_percent: Number(data.fee_percent || 0) }, message: 'Pengaturan penarikan berhasil disimpan.' });
});

admin.post('/admin/withdrawals/:withdrawalId/process', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) return c.json({ ok: false, message: 'Penarikan hanya tersedia pada database utama.' }, 422);
  const input = await c.req.formData().catch(() => null);
  if (!input) return c.json({ ok: false, message: 'Data proses penarikan tidak valid.' }, 400);
  const status = String(input.get('status') || '');
  const adminNote = cleanTemplateField(input.get('adminNote'), 500) || null;
  const proof = input.get('proof');
  const hasNewProof = proof instanceof File && proof.size > 0;
  if (!['pending', 'processing', 'paid', 'rejected', 'cancelled'].includes(status)) return c.json({ ok: false, message: 'Status penarikan tidak valid.' }, 422);
  if (['rejected', 'cancelled'].includes(status) && !adminNote) return c.json({ ok: false, message: 'Catatan wajib diisi untuk penarikan yang ditolak atau dibatalkan.' }, 422);
  if (hasNewProof && !['image/jpeg', 'image/png', 'image/webp'].includes(proof.type)) return c.json({ ok: false, message: 'Bukti transfer harus berupa JPG, PNG, atau WEBP.' }, 422);
  if (hasNewProof && proof.size > 4 * 1024 * 1024) return c.json({ ok: false, message: 'Ukuran bukti transfer maksimal 4 MB.' }, 422);
  if (hasNewProof && !c.env.MEDIA) return c.json({ ok: false, message: 'Penyimpanan bukti transfer belum tersedia.' }, 503);

  const db = database(c.env);
  const { data: current, error: currentError } = await db.from('affiliate_withdrawals')
    .select('id,affiliate_id,amount,fee_percent,fee_amount,net_amount,payout_method,provider,account_name,account_number,sender_bank_name,sender_account_name,sender_account_number,status,admin_note,requested_at,processed_at,transfer_proof_object_key')
    .eq('id', c.req.param('withdrawalId'))
    .maybeSingle();
  if (currentError) throw currentError;
  if (!current) return c.json({ ok: false, message: 'Permintaan penarikan tidak ditemukan.' }, 404);
  if (status === 'paid' && !hasNewProof && !current.transfer_proof_object_key) return c.json({ ok: false, message: 'Upload bukti transfer sebelum menandai penarikan sebagai selesai.' }, 422);

  let newProofKey = null;
  if (hasNewProof) {
    newProofKey = `withdrawal-proofs/${current.id}/${crypto.randomUUID()}.${imageExtension(proof)}`;
    await c.env.MEDIA.put(newProofKey, proof.stream(), {
      httpMetadata: { contentType: proof.type, cacheControl: 'private, no-store' },
      customMetadata: { uploadedAt: new Date().toISOString(), originalName: String(proof.name || 'bukti-transfer').slice(0, 150) },
    });
  }

  const terminal = ['paid', 'rejected', 'cancelled'].includes(status);
  const update = {
    status,
    admin_note: adminNote,
    processed_at: terminal ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
    ...(newProofKey ? { transfer_proof_object_key: newProofKey } : {}),
  };

  if (status === 'paid' && !current.sender_bank_name) {
    const { data: settings } = await db.from('affiliate_withdrawal_settings')
      .select('sender_bank_name,sender_account_name,sender_account_number')
      .eq('singleton', true)
      .maybeSingle();
    if (settings) {
      if (settings.sender_bank_name) update.sender_bank_name = settings.sender_bank_name;
      if (settings.sender_account_name) update.sender_account_name = settings.sender_account_name;
      if (settings.sender_account_number) update.sender_account_number = settings.sender_account_number;
    }
  }

  const { data: updated, error } = await db.from('affiliate_withdrawals').update(update).eq('id', current.id)
    .select('id,status,admin_note,sender_bank_name,sender_account_name,sender_account_number,processed_at,transfer_proof_object_key,updated_at').single();
  if (error) {
    if (newProofKey) await c.env.MEDIA.delete(newProofKey);
    throw error;
  }
  if (newProofKey && current.transfer_proof_object_key && current.transfer_proof_object_key !== newProofKey && current.transfer_proof_object_key.startsWith('withdrawal-proofs/')) {
    await c.env.MEDIA.delete(current.transfer_proof_object_key).catch((deleteError) => console.error('Gagal menghapus bukti transfer lama:', deleteError));
  }
  const statusChanged = current.status !== updated.status;
  const noteChanged = (current.admin_note || '') !== (updated.admin_note || '');
  const shouldNotify = statusChanged || (noteChanged && Boolean(updated.admin_note)) || (hasNewProof && status === 'paid');

  if (shouldNotify) {
    const notifyPromise = (async () => {
      const { data: affiliateAccount, error: affiliateError } = await db.from('affiliate_accounts')
        .select('id,email,full_name,referral_code')
        .eq('id', current.affiliate_id)
        .maybeSingle();
      if (affiliateError) throw affiliateError;
      if (!affiliateAccount) throw new Error('Affiliate penerima email status penarikan tidak ditemukan.');

      let senderInfo = {
        sender_bank_name: updated.sender_bank_name || current.sender_bank_name,
        sender_account_name: updated.sender_account_name || current.sender_account_name,
        sender_account_number: updated.sender_account_number || current.sender_account_number,
      };
      if (!senderInfo.sender_bank_name) {
        const { data: settings } = await db.from('affiliate_withdrawal_settings')
          .select('sender_bank_name,sender_account_name,sender_account_number')
          .eq('singleton', true)
          .maybeSingle();
        if (settings) {
          senderInfo = {
            sender_bank_name: settings.sender_bank_name,
            sender_account_name: settings.sender_account_name,
            sender_account_number: settings.sender_account_number,
          };
        }
      }

      const mergedWithdrawal = {
        ...current,
        ...senderInfo,
        ...updated,
      };

      const sent = await sendAffiliateWithdrawalStatusEmail(c.env, affiliateAccount, mergedWithdrawal);
      if (sent?.skipped) {
        console.log(`[Email Info] Email status penarikan untuk ${affiliateAccount.email} dilewati (SMTP belum aktif/kredensial kosong).`);
      } else {
        console.log(`[Email Success] Email status penarikan (${updated.status}) berhasil dikirim ke ${affiliateAccount.email}.`);
      }
    })().catch((emailError) => console.error('Withdrawal status email failed:', emailError.message));

    if (c.executionCtx?.waitUntil) {
      c.executionCtx.waitUntil(notifyPromise);
    }
  }

  return c.json({
    ok: true,
    withdrawal: {
      ...updated,
      has_transfer_proof: Boolean(updated.transfer_proof_object_key),
      transfer_proof_url: updated.transfer_proof_object_key ? `/api/admin/withdrawals/${updated.id}/proof` : null,
    },
    message: statusChanged
      ? status === 'paid'
        ? 'Penarikan ditandai selesai, bukti tersimpan, dan email status dikirim ke affiliate.'
        : 'Status penarikan berhasil diperbarui dan email pemberitahuan dikirim ke affiliate.'
      : shouldNotify
        ? 'Pembaruan penarikan berhasil disimpan dan email pemberitahuan dikirim ke affiliate.'
        : 'Data penarikan berhasil disimpan.',
  });
});

admin.get('/admin/withdrawals/:withdrawalId/proof', async (c) => {
  if (!c.env.MEDIA || !hasRealSupabaseConfig(c.env)) return c.json({ ok: false, message: 'Bukti transfer tidak ditemukan.' }, 404);
  const { data, error } = await database(c.env).from('affiliate_withdrawals')
    .select('transfer_proof_object_key')
    .eq('id', c.req.param('withdrawalId'))
    .maybeSingle();
  if (error) throw error;
  if (!data?.transfer_proof_object_key) return c.json({ ok: false, message: 'Bukti transfer tidak ditemukan.' }, 404);
  const object = await c.env.MEDIA.get(data.transfer_proof_object_key);
  if (!object) return c.json({ ok: false, message: 'Bukti transfer tidak ditemukan.' }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'private, no-store');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('content-disposition', 'inline; filename="bukti-transfer-penarikan"');
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
    .select('id,email,full_name,email_verified_at,nik,ktp_object_key,social_platform,social_handle,social_follower_count,social_proof_object_key,status,reviewed_at,review_note,resubmitted_at')
    .eq('id', c.req.param('affiliateId'))
    .maybeSingle();
  if (readError) throw readError;
  if (!account) return c.json({ ok: false, message: 'Pendaftaran affiliate tidak ditemukan.' }, 404);
  if (account.status !== 'pending') return c.json({ ok: false, message: 'Pendaftaran ini sudah pernah direview.' }, 409);
  if (decision === 'approved' && !account.email_verified_at) return c.json({ ok: false, message: 'Email pendaftar belum diverifikasi.' }, 422);
  if (decision === 'approved' && (!account.nik || !account.ktp_object_key)) return c.json({ ok: false, message: 'Data NIK atau KTP belum lengkap.' }, 422);
  if (decision === 'approved' && (!account.social_platform || !account.social_handle || account.social_follower_count == null || !account.social_proof_object_key)) return c.json({ ok: false, message: 'Data media sosial affiliate belum lengkap.' }, 422);

  const nextStatus = decision === 'approved' ? 'active' : 'rejected';
  const reviewTimestamp = new Date().toISOString();
  const { data: updated, error: updateError } = await db.from('affiliate_accounts')
    .update({ status: nextStatus, reviewed_at: reviewTimestamp, review_note: reviewNote || null })
    .eq('id', account.id)
    .select('id,email,full_name,phone,nik,referral_code,ktp_object_key,social_platform,social_handle,social_follower_count,social_proof_object_key,status,account_tier,pro_source,pro_activated_at,email_verified_at,reviewed_at,review_note,resubmitted_at,created_at,updated_at')
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
  headers.set('cache-control', headers.get('cache-control') || 'public, max-age=31536000, immutable');
  headers.set('access-control-allow-origin', '*');
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
    const codesToTry = Array.from(new Set([templateCode, canonicalTemplateCode(templateCode)].filter(Boolean)));
    const { data, error } = await database(c.env).from('templates').select('*').in('code', codesToTry).limit(1).maybeSingle();
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

admin.post('/admin/templates/:templateCode/phone-cover', async (c) => {
  const form = await c.req.formData();
  const file = form.get('file');
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!(file instanceof File)) return c.json({ ok: false, message: 'Pilih gambar sampul HP terlebih dahulu.' }, 422);
  if (!allowedTypes.includes(file.type)) return c.json({ ok: false, message: 'Format sampul HP harus JPG, PNG, atau WEBP.' }, 422);
  if (file.size > 4 * 1024 * 1024) return c.json({ ok: false, message: 'Ukuran sampul HP maksimal 4 MB.' }, 422);
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
  const oldPhoneCover = String(template.phone_cover || '');
  const key = `template-phone-covers/${safeCode}/${crypto.randomUUID()}.${imageExtension(file)}`;
  await c.env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
    customMetadata: { originalName: String(file.name || 'phone-cover').slice(0, 150) },
  });

  try {
    if (!hasRealSupabaseConfig(c.env)) template.phone_cover = key;
    else {
      const { error } = await database(c.env).from('templates').update({ phone_cover: key }).eq('id', template.id);
      if (error) throw error;
    }
  } catch (error) {
    await c.env.MEDIA.delete(key);
    throw error;
  }

  if (oldPhoneCover.startsWith('template-phone-covers/') && oldPhoneCover !== key) {
    await c.env.MEDIA.delete(oldPhoneCover).catch(() => {});
  }

  return c.json({
    ok: true,
    phone_cover: key,
    phone_cover_url: templateCoverUrl(c.env, key),
    message: 'Sampul HP berhasil diperbarui.',
  });
});

admin.delete('/admin/templates/:templateCode/phone-cover', async (c) => {
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

  const oldPhoneCover = String(template.phone_cover || '');
  if (oldPhoneCover.startsWith('template-phone-covers/')) {
    await c.env.MEDIA.delete(oldPhoneCover).catch(() => {});
  }

  if (!hasRealSupabaseConfig(c.env)) {
    template.phone_cover = null;
  } else {
    const { error } = await database(c.env).from('templates').update({ phone_cover: null }).eq('id', template.id);
    if (error) throw error;
  }

  return c.json({
    ok: true,
    phone_cover: null,
    phone_cover_url: null,
    message: 'Sampul HP berhasil direset ke sampul bawaan.',
  });
});

admin.patch('/admin/templates/:templateCode/packages/:packageCode/price', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const price = Math.max(0, Number(input.price ?? 0));
  const hasCommission = input.commission_percent !== undefined && input.commission_percent !== null;
  const commissionPercent = Number(input.commission_percent ?? 0);
  if (!Number.isFinite(price)) {
    return c.json({ ok: false, message: 'Harga paket tidak valid.' }, 400);
  }
  if (hasCommission && (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100)) {
    return c.json({ ok: false, message: 'Komisi affiliate harus berada di antara 0% sampai 100%.' }, 422);
  }

  if (!hasRealSupabaseConfig(c.env)) {
    const template = demoTemplates().find((item) => item.code === c.req.param('templateCode'));
    if (!template) return c.json({ ok: false, message: 'Template tidak ditemukan.' }, 404);
    const selectedPackage = template.template_packages?.find((item) => item.code === c.req.param('packageCode'));
    if (!selectedPackage) return c.json({ ok: false, message: 'Paket template tidak ditemukan.' }, 404);
    selectedPackage.price = Math.round(price);
    if (hasCommission) selectedPackage.affiliate_commission_default_percent = Math.round(commissionPercent * 100) / 100;
    if (template.packages) {
      const packageMatch = template.packages.find((item) => item.code === c.req.param('packageCode'));
      if (packageMatch) {
        packageMatch.price = Math.round(price);
        if (hasCommission) packageMatch.affiliate_commission_default_percent = Math.round(commissionPercent * 100) / 100;
      }
    }
    return c.json({ ok: true, template_code: template.code, package_code: selectedPackage.code, price: Math.round(price), commission_percent: Number(selectedPackage.affiliate_commission_default_percent || 0) });
  }

  const db = database(c.env);
  const { data: template, error: templateError } = await db.from('templates').select('id').eq('code', c.req.param('templateCode')).maybeSingle();
  if (templateError) throw templateError;
  if (!template) return c.json({ ok: false, message: 'Template tidak ditemukan.' }, 404);
  const { data: selectedPackage, error: packageError } = await db.from('template_packages').select('id,affiliate_commission_default_percent').eq('template_id', template.id).eq('code', c.req.param('packageCode')).maybeSingle();
  if (packageError) throw packageError;
  if (!selectedPackage) return c.json({ ok: false, message: 'Paket template tidak ditemukan.' }, 404);
  const nextCommission = hasCommission ? Math.round(commissionPercent * 100) / 100 : Number(selectedPackage.affiliate_commission_default_percent || 0);
  const { error } = await db.from('template_packages').update({ price: Math.round(price), affiliate_commission_default_percent: nextCommission }).eq('id', selectedPackage.id);
  if (error) throw error;
  return c.json({ ok: true, template_code: template.code, package_code: c.req.param('packageCode'), price: Math.round(price), commission_percent: nextCommission });
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

admin.get('/admin/templates/:templateCode/editor-demo', async (c) => {
  const templateCode = c.req.param('templateCode');
  const templates = await allTemplates(c.env);
  const template = templates.find((item) => item.code === templateCode || canonicalTemplateCode(item.code) === canonicalTemplateCode(templateCode));
  if (!template) return c.json({ ok: false, message: 'Template tidak ditemukan.' }, 404);

  const demoData = await getTemplateDemoData(c.env, templateCode);
  return c.json({
    ok: true,
    template: adminTemplate(c.env, template),
    packages: template.packages || [],
    invitation: demoData.invitation,
    gallery: demoData.gallery,
  });
});

admin.put('/admin/templates/:templateCode/editor-demo', async (c) => {
  const templateCode = c.req.param('templateCode');
  const input = await c.req.json().catch(() => ({}));
  const invitation = input.invitation || {};

  const cleanInvitation = {
    groom_full_name: cleanTemplateField(invitation.groom_full_name, 150),
    groom_nickname: cleanTemplateField(invitation.groom_nickname, 80),
    groom_father: cleanTemplateField(invitation.groom_father, 150),
    groom_mother: cleanTemplateField(invitation.groom_mother, 150),
    bride_full_name: cleanTemplateField(invitation.bride_full_name, 150),
    bride_nickname: cleanTemplateField(invitation.bride_nickname, 80),
    bride_father: cleanTemplateField(invitation.bride_father, 150),
    bride_mother: cleanTemplateField(invitation.bride_mother, 150),
    akad_date: cleanTemplateField(invitation.akad_date, 20),
    akad_start_time: cleanTemplateField(invitation.akad_start_time, 10),
    akad_end_time: cleanTemplateField(invitation.akad_end_time, 10),
    reception_date: cleanTemplateField(invitation.reception_date, 20),
    reception_start_time: cleanTemplateField(invitation.reception_start_time, 10),
    reception_end_time: cleanTemplateField(invitation.reception_end_time, 10),
    venue_name: cleanTemplateField(invitation.venue_name, 180),
    venue_address: cleanTemplateField(invitation.venue_address, 1000),
    maps_url: cleanTemplateField(invitation.maps_url, 500),
    nearest_landmark: cleanTemplateField(invitation.nearest_landmark, 240),
    route_directions: cleanTemplateField(invitation.route_directions, 1200),
    transportation_guide: cleanTemplateField(invitation.transportation_guide, 1000),
    love_story: cleanTemplateField(invitation.love_story, 3000),
    instagram: cleanTemplateField(invitation.instagram, 100),
    music_title: cleanTemplateField(invitation.music_title, 150),
    guest_name: cleanTemplateField(invitation.guest_name, 100) || 'Bapak/Ibu/Saudara/i',
    guest_salutation: cleanTemplateField(invitation.guest_salutation, 60) || 'Kepada Yth.',
    guest_list: Array.isArray(invitation.guest_list)
      ? invitation.guest_list.map((g, idx) => ({
          id: g.id || `guest-${idx + 1}`,
          name: cleanTemplateField(g.name, 100),
          salutation: cleanTemplateField(g.salutation, 60) || 'Kepada Yth.',
        })).filter((g) => g.name)
      : [],
    gift_accounts: Array.isArray(invitation.gift_accounts)
      ? invitation.gift_accounts.map((acc, idx) => ({
          id: acc.id || `gift-${idx + 1}`,
          provider: cleanTemplateField(acc.provider, 50) || 'Bank',
          account_number: cleanTemplateField(acc.account_number, 50),
          account_name: cleanTemplateField(acc.account_name, 100),
          label: cleanTemplateField(acc.label, 80),
        })).filter((acc) => acc.account_number)
      : [],
    greetings: Array.isArray(invitation.greetings)
      ? invitation.greetings.map((g, idx) => ({
          id: g.id || `greet-${idx + 1}`,
          guest_name: cleanTemplateField(g.guest_name, 120),
          attendance_status: ['attending', 'not_attending', 'unsure'].includes(g.attendance_status) ? g.attendance_status : 'attending',
          message: cleanTemplateField(g.message, 500),
          created_at: g.created_at || new Date().toISOString(),
        })).filter((g) => g.guest_name && g.message)
      : [],
  };

  const updated = await saveTemplateDemoData(c.env, templateCode, { invitation: cleanInvitation });
  return c.json({
    ok: true,
    message: 'Data editor demo berhasil disimpan.',
    invitation: updated.invitation,
    gallery: updated.gallery,
  });
});

admin.post('/admin/templates/:templateCode/editor-demo/music', async (c) => {
  const templateCode = c.req.param('templateCode');
  const form = await c.req.formData();
  const file = form.get('file') || form.get('music');
  const title = String(form.get('title') || '').trim();

  if (!(file instanceof File)) {
    return c.json({ ok: false, message: 'Pilih berkas musik terlebih dahulu.' }, 422);
  }

  try {
    const result = await uploadTemplateMusic(c.env, templateCode, file, title);
    return c.json({
      ok: true,
      message: 'Musik latar berhasil diunggah.',
      url: result.url,
      title: result.title,
      invitation: result.invitation,
    });
  } catch (err) {
    return c.json({ ok: false, message: err.message || 'Gagal mengunggah musik.' }, 422);
  }
});

admin.delete('/admin/templates/:templateCode/editor-demo/music', async (c) => {
  const templateCode = c.req.param('templateCode');

  try {
    const result = await deleteTemplateMusic(c.env, templateCode);
    return c.json({
      ok: true,
      message: 'Musik latar berhasil dihapus.',
      invitation: result.invitation,
    });
  } catch (err) {
    return c.json({ ok: false, message: err.message || 'Gagal menghapus musik.' }, 422);
  }
});

admin.post('/admin/templates/:templateCode/editor-demo/gallery', async (c) => {
  const templateCode = c.req.param('templateCode');
  const form = await c.req.formData();
  const packageCode = String(form.get('package_code') || 'essential').toLowerCase();
  const slotIndex = parseInt(form.get('slot_index'), 10) || 0;
  const file = form.get('file') || form.get('photo');

  if (!(file instanceof File)) {
    return c.json({ ok: false, message: 'Pilih foto terlebih dahulu.' }, 422);
  }

  try {
    const result = await uploadTemplateGalleryPhoto(c.env, templateCode, packageCode, slotIndex, file);
    return c.json({
      ok: true,
      message: `Foto berhasil disimpan ke slot ${slotIndex + 1} (${packageCode}).`,
      media: result.media,
      gallery: result.gallery,
    });
  } catch (err) {
    return c.json({ ok: false, message: err.message || 'Gagal mengunggah foto galeri.' }, 422);
  }
});

admin.delete('/admin/templates/:templateCode/editor-demo/gallery', async (c) => {
  const templateCode = c.req.param('templateCode');
  const input = await c.req.json().catch(() => ({}));
  const packageCode = String(input.package_code || 'essential').toLowerCase();
  const slotIndex = parseInt(input.slot_index, 10) || 0;

  try {
    const result = await deleteTemplateGalleryPhoto(c.env, templateCode, packageCode, slotIndex);
    return c.json({
      ok: true,
      message: `Foto slot ${slotIndex + 1} (${packageCode}) berhasil dihapus.`,
      gallery: result.gallery,
    });
  } catch (err) {
    return c.json({ ok: false, message: err.message || 'Gagal menghapus foto galeri.' }, 422);
  }
});

admin.post('/admin/templates/:templateCode/editor-demo/photo', async (c) => {
  const templateCode = c.req.param('templateCode');
  const form = await c.req.formData();
  const kind = String(form.get('kind') || 'cover_image');
  const file = form.get('file') || form.get('photo');

  if (!(file instanceof File)) {
    return c.json({ ok: false, message: 'Pilih foto terlebih dahulu.' }, 422);
  }

  try {
    const result = await uploadTemplateCouplePhoto(c.env, templateCode, kind, file);
    return c.json({
      ok: true,
      message: 'Foto berhasil disimpan.',
      path: result.path,
      url: result.url,
      invitation: result.invitation,
    });
  } catch (err) {
    return c.json({ ok: false, message: err.message || 'Gagal mengunggah foto.' }, 422);
  }
});

admin.post('/admin/templates/:templateCode/editor-demo/package-photo', async (c) => {
  const templateCode = c.req.param('templateCode');
  const form = await c.req.formData();
  const kind = String(form.get('kind') || 'cover_image');
  const packageCode = String(form.get('package_code') || 'essential').toLowerCase();
  const file = form.get('file') || form.get('photo');

  if (!(file instanceof File)) {
    return c.json({ ok: false, message: 'Pilih berkas foto terlebih dahulu.' }, 422);
  }

  try {
    const result = await uploadTemplatePackagePhoto(c.env, templateCode, kind, packageCode, file);
    return c.json({
      ok: true,
      message: `Foto ${kind === 'cover_image' ? 'cover' : 'panggung'} (${packageCode}) berhasil disimpan.`,
      path: result.path,
      url: result.url,
      invitation: result.invitation,
    });
  } catch (err) {
    return c.json({ ok: false, message: err.message || 'Gagal mengunggah foto paket.' }, 422);
  }
});

admin.delete('/admin/templates/:templateCode/editor-demo/package-photo', async (c) => {
  const templateCode = c.req.param('templateCode');
  const input = await c.req.json().catch(() => ({}));
  const kind = String(input.kind || 'cover_image');
  const packageCode = String(input.package_code || 'essential').toLowerCase();

  try {
    const result = await deleteTemplatePackagePhoto(c.env, templateCode, kind, packageCode);
    return c.json({
      ok: true,
      message: `Foto ${kind === 'cover_image' ? 'cover' : 'panggung'} (${packageCode}) berhasil dihapus.`,
      invitation: result.invitation,
    });
  } catch (err) {
    return c.json({ ok: false, message: err.message || 'Gagal menghapus foto paket.' }, 422);
  }
});

admin.patch('/admin/orders/:code', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const customerName = String(input.customer_name || '').trim().replace(/\s+/g, ' ').slice(0, 120);
  const customerEmail = String(input.customer_email || '').trim().toLowerCase().slice(0, 254);
  const customerPhone = normalizeAffiliatePhone(input.customer_phone);
  const orderStatus = String(input.status || 'waiting_payment');
  const paymentStatus = String(input.payment_status || 'pending');
  const templateCode = String(input.template_code || '').trim();
  const packageCode = String(input.package_code || '').trim();
  const affiliateId = String(input.affiliate_id || '').trim() || null;
  const commissionPercent = Number(input.affiliate_commission_percent || 0);
  const commissionAmount = Math.round(Number(input.affiliate_commission_amount || 0));
  const paymentAmount = Math.round(Number(input.payment_amount || 0));
  const allowedOrderStatuses = ['waiting_payment', 'editing', 'published', 'cancelled'];
  const allowedPaymentStatuses = ['pending', 'paid', 'failed', 'expired', 'refunded'];

  if (customerName.length < 2) return c.json({ ok: false, message: 'Nama customer minimal 2 karakter.' }, 422);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) return c.json({ ok: false, message: 'Alamat email customer tidak valid.' }, 422);
  if (customerPhone.length < 8) return c.json({ ok: false, message: 'Nomor WhatsApp customer tidak valid.' }, 422);
  if (!allowedOrderStatuses.includes(orderStatus)) return c.json({ ok: false, message: 'Status order tidak valid.' }, 422);
  if (!allowedPaymentStatuses.includes(paymentStatus)) return c.json({ ok: false, message: 'Status pembayaran tidak valid.' }, 422);
  if (!templateCode || !packageCode) return c.json({ ok: false, message: 'Template dan paket wajib dipilih.' }, 422);
  if (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) return c.json({ ok: false, message: 'Persentase komisi harus 0% sampai 100%.' }, 422);
  if (!Number.isFinite(commissionAmount) || commissionAmount < 0) return c.json({ ok: false, message: 'Nominal komisi tidak valid.' }, 422);
  if (!Number.isFinite(paymentAmount) || paymentAmount < 0) return c.json({ ok: false, message: 'Nominal pembayaran tidak valid.' }, 422);

  if (!hasRealSupabaseConfig(c.env)) {
    const order = DEMO_STATE.orders.get(c.req.param('code'));
    if (!order) return c.json({ ok: false, message: 'Order tidak ditemukan.' }, 404);
    const template = demoTemplates().find((item) => item.code === templateCode);
    const packageInfo = template?.template_packages?.find((item) => item.code === packageCode);
    if (!template || !packageInfo) return c.json({ ok: false, message: 'Template atau paket tidak ditemukan.' }, 404);
    const affiliate = affiliateId ? (await adminAffiliateOptions(c.env)).find((item) => item.id === affiliateId) : null;
    Object.assign(order, {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      status: orderStatus,
      payment_status: paymentStatus,
      template_code: template.code,
      template_name: template.name,
      package_code: packageInfo.code,
      package_name: packageInfo.name,
      package_price: Number(packageInfo.price || 0),
      payment_amount: paymentAmount,
      affiliate_id: affiliate?.id || null,
      affiliate_name: affiliate?.full_name || null,
      affiliate_email: affiliate?.email || null,
      affiliate_referral_code: affiliate?.referral_code || null,
      referral_name: affiliate?.full_name || '',
      referral_amount: affiliate ? commissionAmount : 0,
      affiliate_commission_percent: affiliate ? Math.round(commissionPercent * 100) / 100 : 0,
      affiliate_commission_amount: affiliate ? commissionAmount : 0,
      updated_at: new Date().toISOString(),
    });
    if (input.slug !== undefined) {
      const cleanSlug = cleanText(input.slug, 120).toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
      if (cleanSlug) {
        if (order.status === 'published' && (order.is_active || order.website_active)) {
          const conflict = await findActiveSlugConflict(c.env, cleanSlug, { excludeOrderId: order.id });
          if (conflict) {
            return c.json({ ok: false, message: `Slug "${cleanSlug}" sudah aktif digunakan oleh pesanan lain (${conflict.order_code} - ${conflict.customer_name}).` }, 422);
          }
        }
        order.slug = cleanSlug;
        order.website_url = publicAppUrl(c.env, `/${cleanSlug}`);
      }
    }
    return c.json({ ok: true, order: demoOrders(c.env).find((item) => item.order_code === order.order_code), message: 'Data pesanan berhasil diperbarui.' });
  }

  const db = database(c.env);
  const { data: currentOrder, error: currentError } = await db.from('orders').select('id,order_code').eq('order_code', c.req.param('code')).maybeSingle();
  if (currentError) throw currentError;
  if (!currentOrder) return c.json({ ok: false, message: 'Order tidak ditemukan.' }, 404);

  const { data: template, error: templateError } = await db.from('templates').select('id,code,name').eq('code', templateCode).maybeSingle();
  if (templateError) throw templateError;
  if (!template) return c.json({ ok: false, message: 'Template tidak ditemukan.' }, 404);
  const { data: packageInfo, error: packageError } = await db.from('template_packages').select('id,code,name,price').eq('template_id', template.id).eq('code', packageCode).maybeSingle();
  if (packageError) throw packageError;
  if (!packageInfo) return c.json({ ok: false, message: 'Paket tidak tersedia untuk template tersebut.' }, 422);

  let affiliate = null;
  if (affiliateId) {
    const { data: account, error: affiliateError } = await db.from('affiliate_accounts').select('id,full_name,email,referral_code,status').eq('id', affiliateId).maybeSingle();
    if (affiliateError) throw affiliateError;
    if (!account) return c.json({ ok: false, message: 'Affiliate tidak ditemukan.' }, 404);
    affiliate = account;
  }

  const { data: payment, error: paymentReadError } = await db.from('payments').select('paid_at').eq('order_id', currentOrder.id).maybeSingle();
  if (paymentReadError) throw paymentReadError;
  const paymentUpdate = { status: paymentStatus, amount: paymentAmount };
  if (paymentStatus === 'paid' && !payment?.paid_at) paymentUpdate.paid_at = new Date().toISOString();
  const { error: paymentError } = await db.from('payments').update(paymentUpdate).eq('order_id', currentOrder.id);
  if (paymentError) throw paymentError;

  const effectiveCommissionPercent = affiliate ? Math.round(commissionPercent * 100) / 100 : 0;
  const effectiveCommissionAmount = affiliate ? commissionAmount : 0;
  const { error: updateError } = await db.from('orders').update({
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    template_id: template.id,
    package_id: packageInfo.id,
    status: orderStatus,
    payment_status: paymentStatus,
    affiliate_id: affiliate?.id || null,
    referral_name: affiliate?.full_name || null,
    referral_amount: effectiveCommissionAmount,
    affiliate_commission_percent: effectiveCommissionPercent,
    affiliate_commission_amount: effectiveCommissionAmount,
  }).eq('id', currentOrder.id);
  if (updateError) throw updateError;

  if (input.slug !== undefined) {
    const cleanSlug = cleanText(input.slug, 120).toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
    if (cleanSlug) {
      const { data: currentInv } = await db.from('invitations').select('id,is_active,published_at').eq('order_id', currentOrder.id).maybeSingle();
      if (currentInv && currentInv.is_active && currentInv.published_at) {
        const conflict = await findActiveSlugConflict(c.env, cleanSlug, { excludeInvitationId: currentInv.id, excludeOrderId: currentOrder.id });
        if (conflict) {
          return c.json({ ok: false, message: `Slug "${cleanSlug}" sudah aktif digunakan oleh pesanan lain (${conflict.order_code} - ${conflict.customer_name}).` }, 422);
        }
      }
      await db.from('invitations').update({ slug: cleanSlug }).eq('order_id', currentOrder.id);
    }
  }

  const updatedOrder = (await adminOrders(c.env)).find((item) => item.order_code === currentOrder.order_code);
  return c.json({ ok: true, order: updatedOrder, message: 'Data pesanan berhasil diperbarui.' });
});

admin.patch('/admin/orders/:code/website', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const hasActiveChange = typeof input.active === 'boolean';
  const requestedDate = String(input.active_until || '').trim();
  let requestedActiveUntil = null;
  if (requestedDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) return c.json({ ok: false, message: 'Tanggal masa aktif tidak valid.' }, 422);
    requestedActiveUntil = new Date(`${requestedDate}T23:59:59.999+07:00`);
    if (Number.isNaN(requestedActiveUntil.getTime()) || requestedActiveUntil <= new Date()) return c.json({ ok: false, message: 'Masa aktif baru harus berakhir setelah hari ini.' }, 422);
  }
  if (!hasRealSupabaseConfig(c.env)) {
    const order = DEMO_STATE.orders.get(c.req.param('code'));
    if (!order) return c.json({ ok: false, message: 'Order tidak ditemukan.' }, 404);
    const currentEnabled = Boolean(order.website_enabled ?? order.is_active ?? order.website_active);
    const active = hasActiveChange ? input.active : currentEnabled;
    if (active && order.slug) {
      const conflict = await findActiveSlugConflict(c.env, order.slug, { excludeOrderId: order.id });
      if (conflict) {
        return c.json({
          ok: false,
          code: 'SLUG_IN_USE',
          message: `Tidak dapat mengaktifkan website karena slug "${order.slug}" saat ini sedang aktif digunakan oleh pesanan lain (${conflict.order_code} - ${conflict.customer_name}). Silakan ubah slug undangan ini terlebih dahulu sebelum mengaktifkannya.`
        }, 409);
      }
    }
    const currentActiveUntil = order.active_until ? new Date(order.active_until) : null;
    const isCurrentExpired = !currentActiveUntil || currentActiveUntil <= new Date();
    const nextActiveUntil = requestedActiveUntil?.toISOString()
      || (!isCurrentExpired ? order.active_until : null)
      || (active ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() : null);
    if (active && (!order.published_at || order.status !== 'published')) {
      order.status = 'published';
      order.published_at = new Date().toISOString();
      order.slug = order.slug || (cleanText(order.customer_name || 'undangan').toLowerCase().replace(/[^a-z0-9]/g, '') || 'undangan') + '-' + randomHex(3);
      order.website_url = publicAppUrl(c.env, `/${order.slug}`);
    }
    if (active && (!nextActiveUntil || new Date(nextActiveUntil) <= new Date())) return c.json({ ok: false, message: 'Pilih tanggal masa aktif baru terlebih dahulu.' }, 422);
    order.active_until = nextActiveUntil;
    order.website_enabled = active;
    order.is_active = active;
    order.website_active = active && new Date(nextActiveUntil) > new Date();
    return c.json({ ok: true, website_active: order.website_active, website_enabled: active, active_until: nextActiveUntil, message: requestedActiveUntil ? 'Masa aktif website customer berhasil diperpanjang.' : active ? 'Website customer diaktifkan.' : 'Website customer dinonaktifkan.' });
  }
  const db = database(c.env);
  const { data: order, error: orderError } = await db.from('orders').select('id,status,customer_name').eq('order_code', c.req.param('code')).maybeSingle();
  if (orderError) throw orderError;
  if (!order) return c.json({ ok: false, message: 'Order tidak ditemukan.' }, 404);
  const { data: invitation, error: invitationReadError } = await db.from('invitations').select('id,published_at,active_until,is_active,slug').eq('order_id', order.id).maybeSingle();
  if (invitationReadError) throw invitationReadError;
  if (!invitation) return c.json({ ok: false, message: 'Data undangan tidak ditemukan.' }, 404);
  const currentEnabled = invitation.is_active === true;
  const active = hasActiveChange ? input.active : currentEnabled;
  if (active && invitation.slug) {
    const conflict = await findActiveSlugConflict(c.env, invitation.slug, {
      excludeInvitationId: invitation.id,
      excludeOrderId: order.id,
    });
    if (conflict) {
      return c.json({
        ok: false,
        code: 'SLUG_IN_USE',
        message: `Tidak dapat mengaktifkan website karena slug "${invitation.slug}" saat ini sedang aktif digunakan oleh pesanan lain (${conflict.order_code} - ${conflict.customer_name}). Silakan ubah slug undangan ini terlebih dahulu sebelum mengaktifkannya.`
      }, 409);
    }
  }
  const currentActiveUntil = invitation.active_until ? new Date(invitation.active_until) : null;
  const isCurrentExpired = !currentActiveUntil || currentActiveUntil <= new Date();
  const nextActiveUntil = requestedActiveUntil?.toISOString()
    || (!isCurrentExpired ? invitation.active_until : null)
    || (active ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() : null);

  if (active && (!invitation.published_at || order.status !== 'published')) {
    const slugToUse = invitation.slug || ((cleanText(order.customer_name || 'undangan').toLowerCase().replace(/[^a-z0-9]/g, '') || 'undangan') + '-' + randomHex(3));
    const conflict = await findActiveSlugConflict(c.env, slugToUse, {
      excludeInvitationId: invitation.id,
      excludeOrderId: order.id,
    });
    if (conflict) {
      return c.json({
        ok: false,
        code: 'SLUG_IN_USE',
        message: `Tidak dapat mengaktifkan website karena slug "${slugToUse}" saat ini sedang aktif digunakan oleh pesanan lain (${conflict.order_code} - ${conflict.customer_name}). Silakan ubah slug undangan ini terlebih dahulu sebelum mengaktifkannya.`
      }, 409);
    }
    const publishedAt = new Date().toISOString();
    await db.from('orders').update({ status: 'published' }).eq('id', order.id);
    const update = {
      is_active: true,
      published_at: publishedAt,
      active_until: nextActiveUntil,
      slug: slugToUse,
    };
    const { error: pubError } = await db.from('invitations').update(update).eq('order_id', order.id);
    if (pubError) throw pubError;
    return c.json({ ok: true, website_active: true, website_enabled: true, active_until: nextActiveUntil, message: 'Website customer berhasil diterbitkan & diaktifkan.' });
  }

  if (active && (!nextActiveUntil || new Date(nextActiveUntil) <= new Date())) return c.json({ ok: false, message: 'Pilih tanggal masa aktif baru terlebih dahulu.' }, 422);
  const update = { is_active: active };
  if (requestedActiveUntil) update.active_until = nextActiveUntil;
  const { error } = await db.from('invitations').update(update).eq('order_id', order.id);
  if (error) throw error;
  if (invitation.slug) {
    try {
      const edgeCache = globalThis.caches?.default;
      if (edgeCache) {
        await edgeCache.delete(new Request(`https://daymoment-cache.local/invitations/${encodeURIComponent(invitation.slug)}`));
      }
    } catch {}
  }
  return c.json({ ok: true, website_active: active && new Date(nextActiveUntil) > new Date(), website_enabled: active, active_until: nextActiveUntil, message: requestedActiveUntil ? 'Masa aktif website customer berhasil diperpanjang.' : active ? 'Website customer diaktifkan.' : 'Website customer dinonaktifkan.' });
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


admin.get('/admin/feedbacks', async (c) => {
  const db = database(c.env);
  if (!hasRealSupabaseConfig(c.env) || !db) {
    return c.json({ ok: true, feedbacks: globalThis.__daymoment_demo_feedbacks__ || [] });
  }
  try {
    const { data, error } = await db.from('feedback_messages')
      .select('id,name,message,created_at')
      .order('created_at', { ascending: false })
      .limit(300);
    if (error) {
      if (['42P01', 'PGRST205'].includes(error.code)) {
        return c.json({ ok: true, feedbacks: globalThis.__daymoment_demo_feedbacks__ || [] });
      }
      throw error;
    }
    return c.json({ ok: true, feedbacks: data || [] });
  } catch (err) {
    return c.json({ ok: true, feedbacks: globalThis.__daymoment_demo_feedbacks__ || [] });
  }
});

admin.delete('/admin/feedbacks/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!id) return c.json({ ok: false, message: 'ID feedback tidak valid.' }, 400);

  if (globalThis.__daymoment_demo_feedbacks__) {
    globalThis.__daymoment_demo_feedbacks__ = globalThis.__daymoment_demo_feedbacks__.filter((item) => Number(item.id) !== id);
  }

  const db = database(c.env);
  if (!hasRealSupabaseConfig(c.env) || !db) {
    return c.json({ ok: true, message: 'Feedback berhasil dihapus.' });
  }
  try {
    const { error } = await db.from('feedback_messages').delete().eq('id', id);
    if (error && !['42P01', 'PGRST205'].includes(error.code)) throw error;
    return c.json({ ok: true, message: 'Feedback berhasil dihapus.' });
  } catch (err) {
    return c.json({ ok: false, message: err.message || 'Gagal menghapus feedback.' }, 500);
  }
});

admin.get('/admin/notifications', async (c) => {
  const env = c.env;
  const isRealDb = hasRealSupabaseConfig(env);
  const db = isRealDb ? database(env) : null;

  // 1. Orders
  let ordersList = [];
  try {
    ordersList = await adminOrders(env);
  } catch (err) {
    ordersList = [];
  }
  const pendingOrders = ordersList.filter((o) => o.payment_status === 'pending');
  const recentOrders = [...ordersList]
    .sort((a, b) => {
      if (a.payment_status === 'pending' && b.payment_status !== 'pending') return -1;
      if (b.payment_status === 'pending' && a.payment_status !== 'pending') return 1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    })
    .slice(0, 6)
    .map((o) => ({
      id: String(o.id || o.order_code),
      order_code: o.order_code,
      title: o.customer_name || 'Pelanggan',
      snippet: `${o.order_code} · ${o.package_name || 'Paket'} (Rp ${(Number(o.payment_amount ?? o.package_price ?? 0)).toLocaleString('id-ID')})`,
      status: o.payment_status,
      status_label: o.payment_status === 'paid' ? 'Lunas' : o.payment_status === 'pending' ? 'Menunggu' : o.payment_status,
      created_at: o.created_at,
      view: 'order-history',
      type: 'order'
    }));

  // 2. Feedbacks
  let feedbacksList = [];
  if (isRealDb && db) {
    try {
      const { data, error } = await db.from('feedback_messages')
        .select('id,name,message,created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) feedbacksList = data;
      else feedbacksList = globalThis.__daymoment_demo_feedbacks__ || [];
    } catch {
      feedbacksList = globalThis.__daymoment_demo_feedbacks__ || [];
    }
  } else {
    feedbacksList = globalThis.__daymoment_demo_feedbacks__ || [];
  }
  const recentFeedbacks = (feedbacksList || []).slice(0, 6).map((f) => ({
    id: String(f.id),
    title: f.name || 'Pengunjung',
    snippet: String(f.message || '').slice(0, 85) + (String(f.message || '').length > 85 ? '...' : ''),
    status: 'new',
    status_label: 'Saran Klien',
    created_at: f.created_at,
    view: 'feedback',
    type: 'feedback'
  }));

  // 3. Withdrawals
  let withdrawalsList = [];
  let withdrawalAffiliateMap = new Map();
  if (isRealDb && db) {
    try {
      const { data, error } = await db.from('affiliate_withdrawals')
        .select('id,affiliate_id,amount,fee_percent,fee_amount,net_amount,status,payout_method,provider,account_name,account_number,admin_note,requested_at,updated_at')
        .order('requested_at', { ascending: false })
        .limit(15);
      if (!error && data) {
        withdrawalsList = data;
        const affiliateIds = [...new Set(data.map((w) => w.affiliate_id).filter(Boolean))];
        if (affiliateIds.length > 0) {
          const { data: accounts } = await db.from('affiliate_accounts').select('id,full_name,email').in('id', affiliateIds);
          if (accounts) accounts.forEach((acc) => withdrawalAffiliateMap.set(acc.id, acc));
        }
      } else if (error) {
        console.error('Failed to query affiliate_withdrawals for notifications:', error.message);
      }
    } catch (err) {
      console.error('Exception querying affiliate_withdrawals for notifications:', err.message);
    }
  }
  const pendingWithdrawals = withdrawalsList.filter((w) => w.status === 'pending');
  const statusLabels = {
    pending: 'Menunggu',
    processing: 'Diproses',
    paid: 'Selesai',
    rejected: 'Ditolak',
    cancelled: 'Dibatalkan',
  };
  const recentWithdrawals = withdrawalsList.slice(0, 8).map((w) => {
    const affiliate = withdrawalAffiliateMap.get(w.affiliate_id);
    const affiliateName = affiliate?.full_name || w.account_name || 'Affiliate';
    const amountStr = `Rp ${(Number(w.amount || 0)).toLocaleString('id-ID')}`;
    const statusText = statusLabels[w.status] || w.status;
    return {
      id: String(w.id),
      title: `${affiliateName} — ${amountStr}`,
      snippet: `${w.provider || w.payout_method || 'Bank'} · a.n ${w.account_name || '-'} · ${statusText}`,
      status: w.status,
      status_label: statusText,
      created_at: w.requested_at || w.updated_at,
      view: 'withdrawals',
      type: 'withdrawal',
    };
  });

  // 4. Affiliate Reviews
  let pendingAffiliatesList = [];
  if (isRealDb && db) {
    try {
      const { data, error } = await db.from('affiliate_accounts')
        .select('id,full_name,email,status,created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) pendingAffiliatesList = data;
    } catch {}
  }
  const recentAffiliates = pendingAffiliatesList.slice(0, 6).map((a) => ({
    id: String(a.id),
    title: a.full_name || 'Affiliate Baru',
    snippet: `${a.email || '-'} · Menunggu verifikasi pendaftaran`,
    status: 'pending',
    status_label: 'Perlu Review',
    created_at: a.created_at,
    view: 'affiliates',
    type: 'affiliate'
  }));

  const counts = {
    orders: pendingOrders.length,
    feedbacks: feedbacksList.length,
    withdrawals: pendingWithdrawals.length,
    affiliates: pendingAffiliatesList.length,
    total: pendingOrders.length + feedbacksList.length + pendingWithdrawals.length + pendingAffiliatesList.length,
  };

  return c.json({
    ok: true,
    counts,
    refreshed_at: new Date().toISOString(),
    notifications: {
      orders: recentOrders,
      feedbacks: recentFeedbacks,
      withdrawals: recentWithdrawals,
      affiliates: recentAffiliates,
    }
  });
});

export default admin;
