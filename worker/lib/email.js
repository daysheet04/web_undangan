import { connect } from 'cloudflare:sockets';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function rupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function safeHeader(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

function base64(value) {
  const bytes = new TextEncoder().encode(String(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function smtpReader(socket) {
  const reader = socket.readable.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  return {
    async response() {
      const lines = [];
      while (true) {
        const lineEnd = buffer.indexOf('\n');
        if (lineEnd >= 0) {
          const line = buffer.slice(0, lineEnd + 1).replace(/\r?\n$/, '');
          buffer = buffer.slice(lineEnd + 1);
          lines.push(line);
          if (/^\d{3} /.test(line)) {
            return { code: Number(line.slice(0, 3)), message: lines.join('\n') };
          }
          continue;
        }
        const chunk = await reader.read();
        if (chunk.done) throw new Error('Koneksi SMTP ditutup sebelum respons selesai.');
        buffer += decoder.decode(chunk.value, { stream: true });
      }
    },
    release() {
      reader.releaseLock();
    },
  };
}

function expect(response, codes, stage) {
  if (!codes.includes(response.code)) {
    throw new Error(`SMTP ${stage} gagal (${response.code}): ${response.message}`);
  }
}

async function sendWithGmailSmtp(env, message) {
  const host = String(env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(env.SMTP_PORT || 465);
  const user = String(env.SMTP_USER || '').trim();
  const password = String(env.SMTP_APP_PASSWORD || '').replace(/\s+/g, '');
  const fromName = safeHeader(env.SMTP_FROM_NAME || 'Daymoment by Daysheet Group');
  if (!user || !password) return { skipped: true };
  if (port === 25) throw new Error('Cloudflare Worker tidak mengizinkan SMTP melalui port 25. Gunakan port 465.');

  const socket = connect({ hostname: host, port }, { secureTransport: 'on' });
  const replies = smtpReader(socket);
  const writer = socket.writable.getWriter();
  const encoder = new TextEncoder();
  const writeLine = (line) => writer.write(encoder.encode(`${line}\r\n`));

  try {
    await socket.opened;
    expect(await replies.response(), [220], 'connect');
    await writeLine('EHLO daymoment');
    expect(await replies.response(), [250], 'EHLO');
    await writeLine('AUTH LOGIN');
    expect(await replies.response(), [334], 'AUTH');
    await writeLine(base64(user));
    expect(await replies.response(), [334], 'username');
    await writeLine(base64(password));
    expect(await replies.response(), [235], 'login');
    await writeLine(`MAIL FROM:<${safeHeader(user)}>`);
    expect(await replies.response(), [250], 'MAIL FROM');
    await writeLine(`RCPT TO:<${safeHeader(message.to)}>`);
    expect(await replies.response(), [250, 251], 'RCPT TO');
    await writeLine('DATA');
    expect(await replies.response(), [354], 'DATA');

    const boundary = `daymoment-${crypto.randomUUID()}`;
    const subject = `=?UTF-8?B?${base64(message.subject)}?=`;
    const mail = [
      `From: ${fromName} <${safeHeader(user)}>`,
      `To: ${safeHeader(message.to)}`,
      `Subject: ${subject}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${crypto.randomUUID()}@daymoment>`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      message.text,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      message.html,
      '',
      `--${boundary}--`,
    ].join('\r\n').replace(/^\./gm, '..');

    await writer.write(encoder.encode(`${mail}\r\n.\r\n`));
    expect(await replies.response(), [250], 'send');
    await writeLine('QUIT');
    expect(await replies.response(), [221], 'QUIT');
    return { ok: true };
  } finally {
    try { writer.releaseLock(); } catch {}
    try { replies.release(); } catch {}
    try { await socket.close(); } catch {}
  }
}

export async function sendOrderCreatedEmail(env, order, paymentUrl) {
  const recipient = String(order.customer_email || '').trim();
  if (!recipient) return { skipped: true };

  const customerName = escapeHtml(order.customer_name);
  const orderCode = escapeHtml(order.order_code);
  const templateName = escapeHtml(order.template_name);
  const packageName = escapeHtml(order.package_name);
  const safePaymentUrl = escapeHtml(paymentUrl);
  const total = rupiah(order.package_price);

  return sendWithGmailSmtp(env, {
    to: recipient,
    subject: `Lanjutkan pembayaran pesanan ${order.order_code}`,
    text: `Halo ${order.customer_name}, pesanan ${order.order_code} sudah dibuat. Template: ${order.template_name}. Paket: ${order.package_name}. Total: ${total}. Lanjutkan pembayaran melalui ${paymentUrl}`,
    html: `<!doctype html>
      <html lang="id">
        <body style="margin:0;background:#f6f2ec;font-family:Arial,sans-serif;color:#17283d">
          <div style="padding:32px 16px">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e8e0d6;border-radius:20px;overflow:hidden">
              <div style="padding:30px 32px;background:#102d50;color:#ffffff;text-align:center">
                <div style="font-size:12px;letter-spacing:3px;color:#d6af66">DAYMOMENT</div>
                <h1 style="margin:10px 0 0;font-family:Georgia,serif;font-size:30px">Pesananmu sudah dibuat</h1>
              </div>
              <div style="padding:32px">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7">Halo <strong>${customerName}</strong>,</p>
                <p style="margin:0 0 24px;color:#536174;font-size:15px;line-height:1.7">Undanganmu sudah kami siapkan. Silakan lanjutkan pembayaran agar editor undangan dapat dibuka.</p>
                <div style="padding:18px 20px;background:#faf7f2;border-radius:14px;font-size:14px;line-height:1.9">
                  <div><span style="color:#718096">Kode order:</span> <strong>${orderCode}</strong></div>
                  <div><span style="color:#718096">Template:</span> <strong>${templateName}</strong></div>
                  <div><span style="color:#718096">Paket:</span> <strong>${packageName}</strong></div>
                  <div><span style="color:#718096">Total:</span> <strong>${escapeHtml(total)}</strong></div>
                </div>
                <div style="padding:28px 0 14px;text-align:center">
                  <a href="${safePaymentUrl}" style="display:inline-block;padding:15px 26px;background:#102d50;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:bold">Lanjutkan Pembayaran</a>
                </div>
                <p style="margin:16px 0 0;color:#7b8796;font-size:12px;line-height:1.6;text-align:center">Jika tombol tidak dapat dibuka, salin tautan berikut:<br><a href="${safePaymentUrl}" style="color:#315b86;word-break:break-all">${safePaymentUrl}</a></p>
              </div>
            </div>
          </div>
        </body>
      </html>`,
  });
}

export async function sendPaymentConfirmedEmail(env, order, payment, editorUrl) {
  const recipient = String(order.customer_email || '').trim();
  if (!recipient) return { skipped: true };

  const customerName = escapeHtml(order.customer_name);
  const orderCode = escapeHtml(order.order_code);
  const templateName = escapeHtml(order.template_name || 'Undangan Daymoment');
  const packageName = escapeHtml(order.package_name || 'Paket undangan');
  const safeEditorUrl = escapeHtml(editorUrl);
  const total = rupiah(order.package_price || payment?.amount);
  const transactionId = escapeHtml(payment?.transaction_id || '-');

  return sendWithGmailSmtp(env, {
    to: recipient,
    subject: `Pembayaran berhasil - editor ${order.order_code} sudah terbuka`,
    text: `Halo ${order.customer_name}, pembayaran pesanan ${order.order_code} sebesar ${total} sudah berhasil dikonfirmasi. Editor undanganmu dapat dibuka melalui ${editorUrl}. Tautan editor bersifat pribadi, jangan bagikan kepada orang lain.`,
    html: `<!doctype html>
      <html lang="id">
        <body style="margin:0;background:#f6f2ec;font-family:Arial,sans-serif;color:#17283d">
          <div style="padding:32px 16px">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e8e0d6;border-radius:20px;overflow:hidden">
              <div style="padding:30px 32px;background:#1f7a63;color:#ffffff;text-align:center">
                <div style="font-size:12px;letter-spacing:3px;color:#f2d79e">DAYMOMENT</div>
                <h1 style="margin:10px 0 0;font-family:Georgia,serif;font-size:30px">Pembayaran berhasil</h1>
              </div>
              <div style="padding:32px">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7">Halo <strong>${customerName}</strong>,</p>
                <p style="margin:0 0 24px;color:#536174;font-size:15px;line-height:1.7">Pembayaranmu sudah dikonfirmasi. Sekarang kamu dapat membuka editor dan mulai melengkapi undangan.</p>
                <div style="padding:18px 20px;background:#faf7f2;border-radius:14px;font-size:14px;line-height:1.9">
                  <div><span style="color:#718096">Kode order:</span> <strong>${orderCode}</strong></div>
                  <div><span style="color:#718096">Template:</span> <strong>${templateName}</strong></div>
                  <div><span style="color:#718096">Paket:</span> <strong>${packageName}</strong></div>
                  <div><span style="color:#718096">Total:</span> <strong>${escapeHtml(total)}</strong></div>
                  <div><span style="color:#718096">ID transaksi:</span> <strong>${transactionId}</strong></div>
                </div>
                <div style="padding:28px 0 14px;text-align:center">
                  <a href="${safeEditorUrl}" style="display:inline-block;padding:15px 26px;background:#102d50;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:bold">Buka Editor Undangan</a>
                </div>
                <p style="margin:16px 0 0;color:#7b8796;font-size:12px;line-height:1.6;text-align:center">Tautan editor ini bersifat pribadi. Jangan membagikannya kepada orang lain.<br><br>Jika tombol tidak dapat dibuka, salin tautan berikut:<br><a href="${safeEditorUrl}" style="color:#315b86;word-break:break-all">${safeEditorUrl}</a></p>
              </div>
            </div>
          </div>
        </body>
      </html>`,
  });
}
