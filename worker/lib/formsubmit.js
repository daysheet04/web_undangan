/**
 * FormSubmit.co Integration Helper
 * Mengirimkan data saran / kritik ke email pemilik (daymoment7@gmail.com)
 * menggunakan layanan FormSubmit.co secara aman melalui server worker.
 */

export async function sendFeedbackToFormSubmit(env, { name, message, ip, origin, referer } = {}) {
  const targetEmail = String(
    env?.FEEDBACK_NOTIF_EMAIL ||
    env?.ADMIN_NOTIFICATION_EMAIL ||
    env?.SMTP_USER ||
    'daymoment7@gmail.com'
  ).trim();

  // Tentukan origin dan referer untuk memenuhi verifikasi FormSubmit
  const siteOrigin = String(
    origin ||
    referer ||
    env?.PUBLIC_APP_URL ||
    env?.APP_URL ||
    'https://daymoment.biz.id'
  ).trim().replace(/\/+$/, '');

  const refererUrl = `${siteOrigin}/`;

  console.log(`[FormSubmit] Starting submission for "${name}" -> target: ${targetEmail}`);
  console.log(`[FormSubmit] siteOrigin: ${siteOrigin}, refererUrl: ${refererUrl}`);

  const nowFormatted = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(new Date());

  const payload = {
    _subject: `[Daymoment] Saran & Kritik Baru dari ${name}`,
    _template: 'table',
    _captcha: 'false',
    'Nama Pengirim': name,
    'Saran & Kritik': message,
    'Waktu Pengiriman (WIB)': nowFormatted,
  };

  const endpointUrl = `https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`;

  try {
    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': siteOrigin,
        'Referer': refererUrl,
        'User-Agent': 'Daymoment-Feedback/1.0',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    console.log(`[FormSubmit] HTTP Status: ${res.status}`);
    console.log(`[FormSubmit] Response Body: ${responseText}`);

    let data = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (!res.ok) {
      console.error(`[FormSubmit Error] HTTP ${res.status}:`, data);
      return { ok: false, status: res.status, data, message: `HTTP ${res.status}` };
    }

    if (data?.success === 'false' || data?.success === false) {
      console.warn('[FormSubmit Notice - Activation/Message]:', data?.message);
      return { ok: false, message: data?.message, data };
    }

    console.log(`[FormSubmit Success] Berhasil terkirim ke ${targetEmail}`);
    return { ok: true, data };
  } catch (err) {
    console.error('[FormSubmit Exception]:', err?.message || err);
    return { ok: false, error: err?.message || String(err), message: err?.message };
  }
}
