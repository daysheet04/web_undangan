import { database, many, one } from './database.js';

export async function activeTemplates(env) {
  const db = database(env);
  const { data } = await many(db.from('templates').select('*, template_packages(*)').eq('is_active', true).order('id'));
  return data.map((template) => {
    const packages = (template.template_packages || []).filter((item) => item.is_active).sort((a, b) => a.sort_order - b.sort_order);
    return { ...template, packages, package_count: packages.length, starting_price: packages.length ? Math.min(...packages.map((item) => Number(item.price))) : null };
  });
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

export async function orderByCode(env, code) {
  const db = database(env);
  return one(db.from('order_details').select('*').eq('order_code', code), 'Order tidak ditemukan.');
}

export async function invitationByToken(env, token) {
  const db = database(env);
  return one(db.from('invitation_details').select('*').eq('editor_token', token), 'Akses editor tidak valid.');
}

export async function publishedInvitation(env, slug) {
  const db = database(env);
  return one(db.from('invitation_details').select('*').eq('slug', slug).eq('order_status', 'published').not('published_at', 'is', null), 'Undangan yang Anda cari belum tersedia.');
}

export async function invitationExtras(env, invitationId, { guestPage, guestLimit } = {}) {
  const db = database(env);
  const mediaQuery = db.from('invitation_media').select('*').eq('invitation_id', invitationId).order('sort_order').order('id');
  const giftQuery = db.from('gift_accounts').select('*').eq('invitation_id', invitationId).eq('is_active', true).order('sort_order').order('id');
  const greetingQuery = db.from('guest_messages').select('id,guest_name,attendance_status,guest_count,message,created_at').eq('invitation_id', invitationId).eq('is_approved', true).order('created_at', { ascending: false }).limit(20);
  let guestQuery = db.from('invitation_guests').select('*', { count: 'exact' }).eq('invitation_id', invitationId).order('created_at', { ascending: false }).order('id', { ascending: false });
  if (guestPage && guestLimit) guestQuery = guestQuery.range((guestPage - 1) * guestLimit, guestPage * guestLimit - 1);
  const [media, giftAccounts, greetings, invitees] = await Promise.all([many(mediaQuery), many(giftQuery), many(greetingQuery), many(guestQuery)]);
  return { media: media.data, giftAccounts: giftAccounts.data, greetings: greetings.data, invitees: invitees.data, inviteeCount: invitees.count };
}
