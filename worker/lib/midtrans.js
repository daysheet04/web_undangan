function production(env) {
  return String(env.MIDTRANS_IS_PRODUCTION || '').toLowerCase() === 'true';
}

function credentials(env) {
  const serverKey = String(env.MIDTRANS_SERVER_KEY || '').trim();
  const clientKey = String(env.MIDTRANS_CLIENT_KEY || '').trim();
  if (!serverKey || !clientKey) {
    const error = new Error('Midtrans belum dikonfigurasi. Lengkapi Client Key dan Server Key.');
    error.status = 503;
    throw error;
  }
  return { serverKey, clientKey };
}

function authorization(serverKey) {
  return `Basic ${btoa(`${serverKey}:`)}`;
}

async function midtransFetch(url, serverKey, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authorization(serverKey),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(result.error_messages)
      ? result.error_messages.join(' ')
      : result.status_message || 'Midtrans gagal memproses transaksi.';
    const error = new Error(message);
    error.status = response.status >= 500 ? 502 : 422;
    error.midtrans = result;
    throw error;
  }
  return result;
}

export async function createSnapTransaction(env, payload, notificationUrl = '') {
  const { serverKey, clientKey } = credentials(env);
  const base = production(env) ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
  const headers = {};
  if (/^https:\/\//i.test(notificationUrl) && !/localhost|127\.0\.0\.1/i.test(notificationUrl)) {
    headers['X-Override-Notification'] = notificationUrl;
  }
  const result = await midtransFetch(`${base}/snap/v1/transactions`, serverKey, {
    method: 'POST', headers, body: JSON.stringify(payload),
  });
  return {
    token: result.token,
    redirectUrl: result.redirect_url,
    clientKey,
    scriptUrl: `${base}/snap/snap.js`,
  };
}

export async function transactionStatus(env, gatewayOrderId) {
  const { serverKey } = credentials(env);
  const base = production(env) ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
  return midtransFetch(`${base}/v2/${encodeURIComponent(gatewayOrderId)}/status`, serverKey);
}

export function normalizedPaymentStatus(payload) {
  const status = String(payload.transaction_status || '').toLowerCase();
  const fraud = String(payload.fraud_status || '').toLowerCase();
  if (status === 'settlement' || (status === 'capture' && fraud === 'accept')) return 'paid';
  if (['deny', 'cancel', 'failure'].includes(status)) return 'failed';
  if (status === 'expire') return 'expired';
  if (['refund', 'partial_refund'].includes(status)) return 'refunded';
  return 'pending';
}

export async function verifyNotificationSignature(env, payload) {
  const { serverKey } = credentials(env);
  const input = `${payload.order_id || ''}${payload.status_code || ''}${payload.gross_amount || ''}${serverKey}`;
  const digest = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(input));
  const expected = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
  const actual = String(payload.signature_key || '').toLowerCase();
  if (expected.length !== actual.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) mismatch |= expected.charCodeAt(index) ^ actual.charCodeAt(index);
  return mismatch === 0;
}
