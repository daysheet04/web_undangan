import { database, many, one } from './database.js';

const FALLBACK_TEMPLATES = [
  {
    id: 1,
    code: 'puspa_jawi',
    name: 'Puspa Jawi',
    category: 'Javanese Botanical',
    description: 'Romansa Jawa kontemporer dengan lanskap gunung, gapura ukir, puspa watercolor, dan awan bergerak.',
    thumbnail: 'puspa-jawi',
    is_active: true,
    template_packages: [
      { id: 1, code: 'essential', name: 'Essential', tagline: 'Undangan inti yang cantik dan ringkas.', price: 99000, gallery_limit: 2, has_music: false, has_gift: false, has_wishes: false, sort_order: 1, is_active: true },
      { id: 2, code: 'signature', name: 'Signature', tagline: 'Lebih hidup dengan musik dan ucapan tamu.', price: 159000, gallery_limit: 3, has_music: true, has_gift: false, has_wishes: true, sort_order: 2, is_active: true },
      { id: 3, code: 'prestige', name: 'Prestige', tagline: 'Pengalaman lengkap dengan seluruh fitur premium.', price: 249000, gallery_limit: 5, has_music: true, has_gift: true, has_wishes: true, sort_order: 3, is_active: true },
    ],
  },
  {
    id: 2,
    code: 'lunara_azure',
    name: 'Lunara Azure',
    category: 'Porcelain Moon Garden',
    description: 'Romansa biru porselen dengan taman cahaya bulan, botanical watercolor, frame editorial, dan motion berlapis tiga dimensi.',
    thumbnail: 'lunara-azure',
    is_active: true,
    template_packages: [
      { id: 4, code: 'essential', name: 'Essential', tagline: 'Undangan inti yang cantik dan ringkas.', price: 99000, gallery_limit: 2, has_music: false, has_gift: false, has_wishes: false, sort_order: 1, is_active: true },
      { id: 5, code: 'signature', name: 'Signature', tagline: 'Lebih hidup dengan musik dan ucapan tamu.', price: 159000, gallery_limit: 3, has_music: true, has_gift: false, has_wishes: true, sort_order: 2, is_active: true },
      { id: 6, code: 'prestige', name: 'Prestige', tagline: 'Pengalaman lengkap dengan seluruh fitur premium.', price: 249000, gallery_limit: 5, has_music: true, has_gift: true, has_wishes: true, sort_order: 3, is_active: true },
    ],
  },
];

function normalizeTemplates(templates) {
  return templates.map((template) => {
    const packages = (template.template_packages || []).filter((item) => item.is_active).sort((a, b) => a.sort_order - b.sort_order);
    return {
      ...template,
      packages,
      package_count: packages.length,
      starting_price: packages.length ? Math.min(...packages.map((item) => Number(item.price))) : null,
    };
  });
}

export function hasRealSupabaseConfig(env) {
  const url = String(env?.SUPABASE_URL || '').trim();
  const key = String(env?.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) return false;
  if (/^https:\/\/YOUR_PROJECT|^YOUR_|^SERVICE_ROLE|^INSERT_|^REPLACE_/.test(url) || /^YOUR_|^SERVICE_ROLE|^INSERT_|^REPLACE_/.test(key)) return false;
  return true;
}

export async function activeTemplates(env) {
  if (!hasRealSupabaseConfig(env)) {
    return normalizeTemplates(FALLBACK_TEMPLATES);
  }

  try {
    const db = database(env);
    const { data } = await many(db.from('templates').select('*, template_packages(*)').eq('is_active', true).order('id'));
    return normalizeTemplates(data || []);
  } catch (error) {
    console.warn('Falling back to demo templates because Supabase is unavailable.', error.message);
    return normalizeTemplates(FALLBACK_TEMPLATES);
  }
}

export async function templateByCode(env, code) {
  const templates = await activeTemplates(env);
  const template = templates.find((item) => item.code === code);
  if (!template) {
    const error = new Error('Template tidak ditemukan.');
    error.status = 404;
    throw error;
  }
  return template;
}

function demoState() {
  globalThis.__daymoment_demo_state__ = globalThis.__daymoment_demo_state__ || { orders: new Map() };
  return globalThis.__daymoment_demo_state__;
}

export async function orderByCode(env, code) {
  const db = database(env);
  return one(db.from('order_details').select('*').eq('order_code', code), 'Order tidak ditemukan.');
}

export async function invitationByToken(env, token) {
  if (!hasRealSupabaseConfig(env)) {
    const order = [...(demoState().orders.values?.() || [])].find((item) => item.editor_token === token);
    if (!order) {
      const error = new Error('Akses editor tidak valid.');
      error.status = 404;
      throw error;
    }
    if (order.payment_status !== 'paid' || order.status === 'waiting_payment') {
      const error = new Error('Pembayaran harus diselesaikan sebelum membuka editor.');
      error.status = 402;
      throw error;
    }
    return {
      id: `demo-${order.order_code}`,
      order_id: order.id,
      editor_token: order.editor_token,
      order_status: order.status,
      payment_status: order.payment_status,
      template_id: order.template_id,
      template_code: order.template_code,
      template_name: order.template_name,
      template_category: order.template_category,
      package_id: order.package_id,
      package_code: order.package_code,
      package_name: order.package_name,
      package_price: order.package_price,
      gallery_limit: order.gallery_limit || 2,
      has_music: Boolean(order.has_music || order.package_has_music),
      has_gift: Boolean(order.has_gift || order.package_has_gift),
      has_wishes: Boolean(order.has_wishes || order.package_has_wishes),
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      slug: order.slug || 'demo-undangan',
      published_at: order.published_at || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const db = database(env);
  const invitation = await one(db.from('invitation_details').select('*').eq('editor_token', token), 'Akses editor tidak valid.');
  if (invitation.payment_status !== 'paid' || invitation.order_status === 'waiting_payment') {
    const error = new Error('Pembayaran harus diselesaikan sebelum membuka editor.');
    error.status = 402;
    throw error;
  }
  return invitation;
}

export async function publishedInvitation(env, slug) {
  if (!hasRealSupabaseConfig(env)) {
    const error = new Error('Undangan yang Anda cari belum tersedia.');
    error.status = 404;
    throw error;
  }
  const db = database(env);
  const invitation = await one(db.from('invitation_details').select('*').eq('slug', slug).eq('order_status', 'published').eq('is_active', true).not('published_at', 'is', null), 'Undangan yang Anda cari belum tersedia.');
  if (invitation.active_until && new Date(invitation.active_until) <= new Date()) {
    const error = new Error('Masa aktif undangan ini sudah berakhir.');
    error.status = 404;
    throw error;
  }
  return invitation;
}

export async function invitationExtras(env, invitationId, { guestPage, guestLimit } = {}) {
  if (!hasRealSupabaseConfig(env)) {
    return { media: [], giftAccounts: [], greetings: [], invitees: [], inviteeCount: 0 };
  }
  const db = database(env);
  const mediaQuery = db.from('invitation_media').select('*').eq('invitation_id', invitationId).order('sort_order').order('id');
  const giftQuery = db.from('gift_accounts').select('*').eq('invitation_id', invitationId).eq('is_active', true).order('sort_order').order('id');
  const greetingQuery = db.from('guest_messages').select('id,guest_name,attendance_status,guest_count,message,created_at').eq('invitation_id', invitationId).eq('is_approved', true).order('created_at', { ascending: false }).limit(20);
  let guestQuery = db.from('invitation_guests').select('*', { count: 'exact' }).eq('invitation_id', invitationId).order('created_at', { ascending: false }).order('id', { ascending: false });
  if (guestPage && guestLimit) guestQuery = guestQuery.range((guestPage - 1) * guestLimit, guestPage * guestLimit - 1);
  const [media, giftAccounts, greetings, invitees] = await Promise.all([many(mediaQuery), many(giftQuery), many(greetingQuery), many(guestQuery)]);
  return { media: media.data, giftAccounts: giftAccounts.data, greetings: greetings.data, invitees: invitees.data, inviteeCount: invitees.count };
}
