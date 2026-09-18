import { Hono } from 'hono';
import { database } from '../lib/database.js';
import { cleanText, normalizePhone, orderCode, randomHex, validEmail, validPhone } from '../lib/helpers.js';
import { sendOrderCreatedEmail, sendPaymentConfirmedEmail } from '../lib/email.js';
import { createSnapTransaction, normalizedPaymentStatus, transactionStatus, verifyNotificationSignature } from '../lib/midtrans.js';
import { hasRealSupabaseConfig, orderByCode, templateByCode } from '../lib/repositories.js';

const orders = new Hono();
const DEMO_ORDERS = new Map();
globalThis.__daymoment_demo_state__ = globalThis.__daymoment_demo_state__ || { orders: DEMO_ORDERS };
globalThis.__daymoment_demo_state__.orders = DEMO_ORDERS;

function publicOrder(order) {
  const { editor_token: editorToken, customer_phone: _customerPhone, customer_email: _customerEmail, ...safe } = order;
  return {
    ...safe,
    editor_url: order.payment_status === 'paid' && ['editing', 'published'].includes(order.status)
      ? `/edit/${editorToken}?payment=success`
      : null,
  };
}

async function paymentForOrder(env, orderId) {
  const { data, error } = await database(env).from('payments').select('*').eq('order_id', orderId).maybeSingle();
  if (error) throw error;
  if (!data) {
    const failure = new Error('Data pembayaran tidak ditemukan.');
    failure.status = 404;
    throw failure;
  }
  return data;
}

function queuePaymentConfirmedEmail(c, order, payment) {
  const appUrl = String(c.env.APP_URL || new URL(c.req.url).origin).replace(/\/$/, '');
  const editorUrl = `${appUrl}/edit/${encodeURIComponent(order.editor_token)}?payment=success`;

  c.executionCtx.waitUntil((async () => {
    const db = database(c.env);
    const claimedAt = new Date().toISOString();
    const { data: claimed, error: claimError } = await db
      .from('orders')
      .update({ editor_email_sent_at: claimedAt })
      .eq('id', order.id)
      .is('editor_email_sent_at', null)
      .select('id')
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) return;

    try {
      const sent = await sendPaymentConfirmedEmail(c.env, order, payment, editorUrl);
      if (sent?.skipped) throw new Error('SMTP belum dikonfigurasi untuk email konfirmasi pembayaran.');
    } catch (failure) {
      const { error: releaseError } = await db
        .from('orders')
        .update({ editor_email_sent_at: null })
        .eq('id', order.id)
        .eq('editor_email_sent_at', claimedAt);
      if (releaseError) console.error('Payment email claim release failed:', releaseError.message);
      throw failure;
    }
  })().catch((failure) => console.error('Payment confirmation email failed:', failure.message)));
}

async function applyPaymentStatus(env, order, payment, payload) {
  const status = normalizedPaymentStatus(payload);
  const amount = Number(payload.gross_amount || payment.amount);
  if (Math.round(amount) !== Math.round(Number(payment.amount))) {
    const failure = new Error('Nominal pembayaran Midtrans tidak sesuai dengan order.');
    failure.status = 422;
    throw failure;
  }
  const db = database(env);
  const paymentUpdate = {
    gateway: 'midtrans',
    status,
    transaction_id: cleanText(payload.transaction_id, 120) || payment.transaction_id || null,
    payment_type: cleanText(payload.payment_type, 50) || payment.payment_type || null,
  };
  if (status === 'paid') paymentUpdate.paid_at = payload.settlement_time || payload.transaction_time || new Date().toISOString();
  const { error: paymentError } = await db.from('payments').update(paymentUpdate).eq('id', payment.id);
  if (paymentError) throw paymentError;
  const orderUpdate = { payment_status: status };
  if (status === 'paid' && order.status === 'waiting_payment') orderUpdate.status = 'editing';
  const { error: orderError } = await db.from('orders').update(orderUpdate).eq('id', order.id);
  if (orderError) throw orderError;
  if (status === 'paid') {
    const activeUntil = new Date(paymentUpdate.paid_at);
    activeUntil.setMonth(activeUntil.getMonth() + 2);
    const { error: invitationError } = await db.from('invitations').update({ is_active: true, active_until: activeUntil.toISOString() }).eq('order_id', order.id);
    if (invitationError) throw invitationError;
  }
  return {
    status,
    redirect: status === 'paid' ? `/edit/${order.editor_token}?payment=success` : null,
    payment: { ...payment, ...paymentUpdate },
  };
}

orders.post('/orders', async (c) => {
  let input;
  try {
    input = await c.req.json();
  } catch (error) {
    return c.json({ ok: false, message: 'Request body harus berupa JSON valid.' }, 400);
  }
  const template = await templateByCode(c.env, cleanText(input.template_code, 50));
  const selectedPackage = template.packages.find((item) => item.code === cleanText(input.package_code, 30));
  const name = cleanText(input.customer_name, 120);
  const phone = cleanText(input.customer_phone, 24);
  const email = cleanText(input.customer_email, 254).toLowerCase();
  const errors = {};
  if (!selectedPackage) errors.package_code = 'Pilih salah satu paket undangan.';
  if (name.length < 3) errors.customer_name = 'Nama lengkap minimal 3 karakter.';
  if (!validPhone(phone)) errors.customer_phone = 'Gunakan nomor Indonesia yang diawali 08 atau +62.';
  if (!validEmail(email)) errors.customer_email = 'Masukkan alamat email yang valid.';
  if (input.agreement !== true && input.agreement !== '1') errors.agreement = 'Persetujuan data wajib dicentang.';
  if (Object.keys(errors).length) return c.json({ ok: false, message: 'Periksa kembali data pemesan.', errors }, 422);

  if (!hasRealSupabaseConfig(c.env)) {
    const code = orderCode();
    const editorToken = randomHex(32);
    const order = {
      id: `demo-${code}`,
      order_code: code,
      customer_name: name,
      customer_phone: normalizePhone(phone),
      customer_email: email,
      editor_token: editorToken,
      status: 'waiting_payment',
      payment_status: 'pending',
      template_id: template.id,
      template_code: template.code,
      template_name: template.name,
      template_category: template.category,
      package_id: selectedPackage.id,
      package_code: selectedPackage.code,
      package_name: selectedPackage.name,
      package_price: selectedPackage.price,
    };
    DEMO_ORDERS.set(code, order);
    return c.json({ ok: true, order: publicOrder(order), redirect: `/payment/${code}` }, 201);
  }

  const db = database(c.env);
  const code = orderCode();
  const editorToken = randomHex(32);
  const { error } = await db.rpc('create_daymoment_order', {
    p_order_code: code,
    p_template_id: template.id,
    p_package_id: selectedPackage.id,
    p_customer_name: name,
    p_customer_phone: normalizePhone(phone),
    p_customer_email: email,
    p_editor_token: editorToken,
    p_amount: selectedPackage.price,
  });
  if (error) throw error;
  const createdOrder = await orderByCode(c.env, code);
  const appUrl = String(c.env.APP_URL || new URL(c.req.url).origin).replace(/\/$/, '');
  const paymentUrl = `${appUrl}/payment/${encodeURIComponent(code)}`;
  c.executionCtx.waitUntil(
    sendOrderCreatedEmail(c.env, createdOrder, paymentUrl)
      .catch((failure) => console.error('Order email failed:', failure.message)),
  );
  return c.json({ ok: true, order: publicOrder(createdOrder), redirect: `/payment/${code}` }, 201);
});

orders.get('/orders/:code', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) {
    const order = DEMO_ORDERS.get(c.req.param('code'));
    if (!order) return c.json({ ok: false, message: 'Order demo tidak ditemukan.' }, 404);
    return c.json({ ok: true, order: publicOrder(order) });
  }
  const order = await orderByCode(c.env, c.req.param('code'));
  return c.json({ ok: true, order: publicOrder(order) });
});

orders.post('/orders/:code/payment-token', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) {
    const order = DEMO_ORDERS.get(c.req.param('code'));
    if (!order) return c.json({ ok: false, message: 'Order demo tidak ditemukan.' }, 404);
    if (order.payment_status === 'paid') return c.json({ ok: true, paid: true, redirect: `/edit/${order.editor_token}?payment=success` });
    if (order.snap_token) {
      return c.json({
        ok: true,
        token: order.snap_token,
        redirectUrl: order.snap_redirect_url,
        clientKey: c.env.MIDTRANS_CLIENT_KEY,
        scriptUrl: String(c.env.MIDTRANS_IS_PRODUCTION || '').toLowerCase() === 'true'
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js',
      });
    }
    const gatewayOrderId = `${order.order_code}-${Date.now().toString(36)}`.slice(0, 50);
    const appUrl = String(c.env.APP_URL || new URL(c.req.url).origin).replace(/\/$/, '');
    const snap = await createSnapTransaction(c.env, {
      transaction_details: { order_id: gatewayOrderId, gross_amount: Math.round(Number(order.package_price)) },
      item_details: [{
        id: order.package_code,
        price: Math.round(Number(order.package_price)),
        quantity: 1,
        name: `${order.template_name} - ${order.package_name}`.slice(0, 50),
      }],
      customer_details: { first_name: order.customer_name, email: order.customer_email, phone: order.customer_phone },
      callbacks: { finish: `${appUrl}/payment/${order.order_code}` },
      page_expiry: { duration: 24, unit: 'hour' },
    });
    Object.assign(order, {
      gateway_order_id: gatewayOrderId,
      snap_token: snap.token,
      snap_redirect_url: snap.redirectUrl,
    });
    return c.json({ ok: true, ...snap });
  }
  const order = await orderByCode(c.env, c.req.param('code'));
  if (order.payment_status === 'paid') return c.json({ ok: true, paid: true, redirect: `/edit/${order.editor_token}?payment=success` });
  const payment = await paymentForOrder(c.env, order.id);
  if (payment.status === 'pending' && payment.snap_token) {
    const isProduction = String(c.env.MIDTRANS_IS_PRODUCTION || '').toLowerCase() === 'true';
    return c.json({
      ok: true,
      token: payment.snap_token,
      redirectUrl: payment.snap_redirect_url,
      clientKey: c.env.MIDTRANS_CLIENT_KEY,
      scriptUrl: isProduction ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js',
    });
  }

  const gatewayOrderId = payment.gateway_order_id && payment.status === 'pending'
    ? payment.gateway_order_id
    : `${order.order_code}-${Date.now().toString(36)}`.slice(0, 50);
  const appUrl = String(c.env.APP_URL || new URL(c.req.url).origin).replace(/\/$/, '');
  const snap = await createSnapTransaction(c.env, {
    transaction_details: { order_id: gatewayOrderId, gross_amount: Math.round(Number(order.package_price)) },
    item_details: [{
      id: order.package_code,
      price: Math.round(Number(order.package_price)),
      quantity: 1,
      name: `${order.template_name} - ${order.package_name}`.slice(0, 50),
    }],
    customer_details: { first_name: order.customer_name, email: order.customer_email, phone: order.customer_phone },
    callbacks: { finish: `${appUrl}/payment/${order.order_code}` },
    page_expiry: { duration: 24, unit: 'hour' },
  }, `${appUrl}/api/payments/midtrans/notification`);

  const { error } = await database(c.env).from('payments').update({
    gateway: 'midtrans',
    gateway_order_id: gatewayOrderId,
    snap_token: snap.token,
    snap_redirect_url: snap.redirectUrl,
    status: 'pending',
    transaction_id: null,
    paid_at: null,
  }).eq('id', payment.id);
  if (error) throw error;
  return c.json({ ok: true, ...snap });
});

orders.post('/orders/:code/payment-status', async (c) => {
  if (!hasRealSupabaseConfig(c.env)) {
    const order = DEMO_ORDERS.get(c.req.param('code'));
    if (!order) return c.json({ ok: false, message: 'Order demo tidak ditemukan.' }, 404);
    if (order.payment_status === 'paid') return c.json({ ok: true, payment_status: 'paid', redirect: `/edit/${order.editor_token}?payment=success` });
    if (!order.gateway_order_id) return c.json({ ok: true, payment_status: 'pending', redirect: null });
    const payload = await transactionStatus(c.env, order.gateway_order_id);
    const status = normalizedPaymentStatus(payload);
    order.payment_status = status;
    if (status === 'paid') {
      order.status = 'editing';
      const activeUntil = new Date();
      activeUntil.setMonth(activeUntil.getMonth() + 2);
      order.active_until = activeUntil.toISOString();
    }
    return c.json({ ok: true, payment_status: status, redirect: status === 'paid' ? `/edit/${order.editor_token}?payment=success` : null });
  }
  const order = await orderByCode(c.env, c.req.param('code'));
  if (order.payment_status === 'paid') {
    const payment = await paymentForOrder(c.env, order.id);
    queuePaymentConfirmedEmail(c, order, payment);
    return c.json({ ok: true, payment_status: 'paid', redirect: `/edit/${order.editor_token}?payment=success` });
  }
  const payment = await paymentForOrder(c.env, order.id);
  if (!payment.gateway_order_id) return c.json({ ok: true, payment_status: payment.status || 'pending', redirect: null });
  const payload = await transactionStatus(c.env, payment.gateway_order_id);
  const result = await applyPaymentStatus(c.env, order, payment, payload);
  if (result.status === 'paid') queuePaymentConfirmedEmail(c, order, result.payment);
  return c.json({ ok: true, payment_status: result.status, redirect: result.redirect });
});

orders.post('/payments/midtrans/notification', async (c) => {
  const payload = await c.req.json();
  if (!(await verifyNotificationSignature(c.env, payload))) {
    return c.json({ ok: false, message: 'Signature Midtrans tidak valid.' }, 401);
  }
  const db = database(c.env);
  const { data: payment, error: paymentError } = await db.from('payments').select('*').eq('gateway_order_id', cleanText(payload.order_id, 64)).maybeSingle();
  if (paymentError) throw paymentError;
  if (!payment) return c.json({ ok: false, message: 'Transaksi tidak ditemukan.' }, 404);
  const { data: order, error: orderError } = await db.from('orders').select('*').eq('id', payment.order_id).single();
  if (orderError) throw orderError;
  const result = await applyPaymentStatus(c.env, order, payment, payload);
  if (result.status === 'paid') {
    const detailedOrder = await orderByCode(c.env, order.order_code);
    queuePaymentConfirmedEmail(c, detailedOrder, result.payment);
  }
  return c.json({ ok: true });
});

export default orders;
