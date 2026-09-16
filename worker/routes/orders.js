import { Hono } from 'hono';
import { database } from '../lib/database.js';
import { cleanText, normalizePhone, orderCode, randomHex, validPhone } from '../lib/helpers.js';
import { orderByCode, templateByCode } from '../lib/repositories.js';

const orders = new Hono();

orders.post('/orders', async (c) => {
  const input = await c.req.json();
  const template = await templateByCode(c.env, cleanText(input.template_code, 50));
  const selectedPackage = template.packages.find((item) => item.code === cleanText(input.package_code, 30));
  const name = cleanText(input.customer_name, 120);
  const phone = cleanText(input.customer_phone, 24);
  const errors = {};
  if (!selectedPackage) errors.package_code = 'Pilih salah satu paket undangan.';
  if (name.length < 3) errors.customer_name = 'Nama lengkap minimal 3 karakter.';
  if (!validPhone(phone)) errors.customer_phone = 'Gunakan nomor Indonesia yang diawali 08 atau +62.';
  if (input.agreement !== true && input.agreement !== '1') errors.agreement = 'Persetujuan data wajib dicentang.';
  if (Object.keys(errors).length) return c.json({ ok: false, message: 'Periksa kembali data pemesan.', errors }, 422);

  const db = database(c.env);
  const code = orderCode();
  const editorToken = randomHex(32);
  const { error } = await db.rpc('create_daymoment_order', {
    p_order_code: code, p_template_id: template.id, p_package_id: selectedPackage.id,
    p_customer_name: name, p_customer_phone: normalizePhone(phone), p_editor_token: editorToken,
    p_amount: selectedPackage.price,
  });
  if (error) throw error;
  return c.json({ ok: true, order: await orderByCode(c.env, code), redirect: `/payment/${code}` }, 201);
});

orders.get('/orders/:code', async (c) => c.json({ ok: true, order: await orderByCode(c.env, c.req.param('code')) }));

orders.post('/orders/:code/demo', async (c) => {
  const order = await orderByCode(c.env, c.req.param('code'));
  const db = database(c.env);
  if (order.status === 'waiting_payment') {
    const { error } = await db.from('orders').update({ status: 'editing' }).eq('id', order.id);
    if (error) throw error;
  }
  return c.json({ ok: true, redirect: `/edit/${order.editor_token}` });
});

export default orders;
