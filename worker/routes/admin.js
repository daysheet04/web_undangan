import { Hono } from 'hono';
import { database } from '../lib/database.js';
import { activeTemplates, hasRealSupabaseConfig } from '../lib/repositories.js';

const admin = new Hono();
const DEMO_STATE = globalThis.__daymoment_demo_state__ || { orders: new Map() };
const ADMIN_COOKIE = 'daymoment_admin';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const encoder = new TextEncoder();

globalThis.__daymoment_demo_state__ = DEMO_STATE;

function base64Url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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

function demoOrders() {
  return [...(DEMO_STATE.orders.values?.() || [])].map((order) => ({
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
    website_active: order.payment_status === 'paid' && order.website_active !== false,
    active_until: order.active_until || null,
    slug: order.slug || null,
    published_at: order.published_at || null,
    editor_url: order.payment_status === 'paid' && order.editor_token ? `/edit/${order.editor_token}` : null,
    package_price: Number(order.package_price || 0),
    created_at: order.created_at || new Date().toISOString(),
  }));
}

async function adminOrders(env) {
  if (!hasRealSupabaseConfig(env)) return demoOrders();
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
      website_active: order.payment_status === 'paid' && invitation.is_active !== false && (!invitation.active_until || new Date(invitation.active_until) > new Date()),
      active_until: invitation.active_until || null,
      slug: invitation.slug || null,
      published_at: invitation.published_at || null,
      payment_amount: Number(payment.amount || packagePrice || 0),
      payment_record_status: payment.status || order.payment_record_status,
      paid_at: payment.paid_at || null,
      gateway: payment.gateway || null,
      transaction_id: payment.transaction_id || null,
      gateway_order_id: payment.gateway_order_id || null,
      editor_url: order.payment_status === 'paid' && order.editor_token ? `/edit/${order.editor_token}` : null,
    };
  });
}

admin.get('/admin/summary', async (c) => {
  const orders = await adminOrders(c.env);
  const templates = await activeTemplates(c.env);
  const db = hasRealSupabaseConfig(c.env) ? database(c.env) : null;
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
  return c.json({ ok: true, summary, orders, templates, revenue_by_date: revenueByDate, referral_summary: referralSummary, mode: hasRealSupabaseConfig(c.env) ? 'database' : 'demo' });
});

admin.get('/admin/orders', async (c) => {
  return c.json({ ok: true, orders: await adminOrders(c.env), mode: hasRealSupabaseConfig(c.env) ? 'database' : 'demo' });
});

admin.get('/admin/templates', async (c) => {
  const templates = await activeTemplates(c.env);
  return c.json({ ok: true, templates, mode: hasRealSupabaseConfig(c.env) ? 'database' : 'demo' });
});

admin.patch('/admin/templates/:templateCode/packages/:packageCode/price', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const price = Math.max(0, Number(input.price ?? 0));
  if (!Number.isFinite(price)) {
    return c.json({ ok: false, message: 'Harga paket tidak valid.' }, 400);
  }

  if (!hasRealSupabaseConfig(c.env)) {
    const state = globalThis.__daymoment_demo_state__ || { orders: new Map(), templates: null };
    const template = (state.templates || []).find((item) => item.code === c.req.param('templateCode'));
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

admin.patch('/admin/orders/:code/website', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const active = input.active === true;
  if (!hasRealSupabaseConfig(c.env)) {
    const order = DEMO_STATE.orders.get(c.req.param('code'));
    if (!order) return c.json({ ok: false, message: 'Order tidak ditemukan.' }, 404);
    order.website_active = active;
    return c.json({ ok: true, website_active: active, message: active ? 'Website customer diaktifkan.' : 'Website customer dinonaktifkan.' });
  }
  const db = database(c.env);
  const { data: order, error: orderError } = await db.from('orders').select('id').eq('order_code', c.req.param('code')).maybeSingle();
  if (orderError) throw orderError;
  if (!order) return c.json({ ok: false, message: 'Order tidak ditemukan.' }, 404);
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
