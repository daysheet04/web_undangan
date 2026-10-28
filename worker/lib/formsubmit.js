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
    'https://daymoment.id'
  ).trim().replace(/\/+$/, '');

  const refererUrl = `${siteOrigin}/`;

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

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
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

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.warn(`[FormSubmit] HTTP ${res.status}:`, data);
      return { ok: false, status: res.status, data };
    }

    if (data?.success === 'false' || data?.success === false) {
      console.warn('[FormSubmit] Notice:', data?.message);
      return { ok: false, message: data?.message, data };
    }

    console.log(`[FormSubmit] Sukses mengirimkan saran dari "${name}" ke ${targetEmail}`);
    return { ok: true, data };
  } catch (err) {
    console.warn('[FormSubmit] Gagal mengirimkan saran via FormSubmit:', err?.message || err);
    return { ok: false, error: err?.message || String(err) };
  }
}
