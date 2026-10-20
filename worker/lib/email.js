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

export async function sendSmtpEmail(env, message) {
  const host = String(env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(env.SMTP_PORT || 465);
  const user = String(env.SMTP_USER || '').trim();
  const password = String(env.SMTP_APP_PASSWORD || '').replace(/\s+/g, '');
  const fromName = safeHeader(message.fromName || env.SMTP_FROM_NAME || 'Daymoment by Daysheet Group');
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

  return sendSmtpEmail(env, {
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

  return sendSmtpEmail(env, {
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

export async function sendAffiliateVerificationEmail(env, affiliate, verificationUrl) {
  const recipient = String(affiliate.email || '').trim();
  if (!recipient) return { skipped: true };

  const fullName = escapeHtml(affiliate.full_name);
  const safeVerificationUrl = escapeHtml(verificationUrl);
  return sendSmtpEmail(env, {
    to: recipient,
    fromName: env.AFFILIATE_SMTP_FROM_NAME || 'Daymoment Verifikasi',
    subject: 'Verifikasi akun Affiliate Daymoment',
    text: `Halo ${affiliate.full_name}, verifikasi email Affiliate Daymoment melalui tautan berikut: ${verificationUrl}. Setelah email terverifikasi, data identitasmu akan direview oleh admin. Tautan berlaku selama 24 jam. Jika kamu tidak merasa mendaftar, abaikan email ini.`,
    html: `<!doctype html>
      <html lang="id">
        <body style="margin:0;background:#f4f1e9;font-family:Arial,sans-serif;color:#17352f">
          <div style="padding:36px 16px">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e1ded4;border-radius:22px;overflow:hidden">
              <div style="padding:32px;background:#173f35;color:#ffffff;text-align:center">
                <div style="font-size:12px;letter-spacing:3px;color:#dfbf87">DAYMOMENT PARTNER</div>
                <h1 style="margin:12px 0 0;font-family:Georgia,serif;font-size:31px;font-weight:normal">Verifikasi akunmu</h1>
              </div>
              <div style="padding:34px 32px">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7">Halo <strong>${fullName}</strong>,</p>
                <p style="margin:0;color:#60716a;font-size:15px;line-height:1.8">Tekan tombol berikut untuk memverifikasi alamat emailmu. Setelah itu, nama lengkap, NIK, dan foto KTP akan direview oleh admin sebelum akun diaktifkan.</p>
                <div style="padding:30px 0 18px;text-align:center">
                  <a href="${safeVerificationUrl}" style="display:inline-block;padding:15px 27px;background:#17493d;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:bold">Verifikasi Akun Affiliate</a>
                </div>
                <p style="margin:15px 0 0;color:#87928e;font-size:12px;line-height:1.7;text-align:center">Tautan ini berlaku selama 24 jam dan hanya dapat digunakan satu kali.<br><br>Jika tombol tidak dapat dibuka, salin tautan berikut:<br><a href="${safeVerificationUrl}" style="color:#326858;word-break:break-all">${safeVerificationUrl}</a></p>
              </div>
            </div>
          </div>
        </body>
      </html>`,
  });
}

export async function sendAffiliatePasswordResetEmail(env, affiliate, resetUrl) {
  const recipient = String(affiliate.email || '').trim();
  if (!recipient) return { skipped: true };

  const fullName = escapeHtml(affiliate.full_name);
  const safeResetUrl = escapeHtml(resetUrl);
  return sendSmtpEmail(env, {
    to: recipient,
    fromName: env.AFFILIATE_SMTP_FROM_NAME || 'Daymoment Verifikasi',
    subject: 'Reset password Affiliate Daymoment',
    text: `Halo ${affiliate.full_name}, kami menerima permintaan reset password akun Affiliate Daymoment. Buat password baru melalui tautan berikut: ${resetUrl}. Tautan berlaku selama 1 jam dan hanya dapat digunakan satu kali. Jika kamu tidak meminta reset, abaikan email ini.`,
    html: `<!doctype html>
      <html lang="id">
        <body style="margin:0;background:#f4f1e9;font-family:Arial,sans-serif;color:#17352f">
          <div style="padding:36px 16px">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e1ded4;border-radius:22px;overflow:hidden">
              <div style="padding:32px;background:#173f35;color:#ffffff;text-align:center">
                <div style="font-size:12px;letter-spacing:3px;color:#dfbf87">DAYMOMENT PARTNER</div>
                <h1 style="margin:12px 0 0;font-family:Georgia,serif;font-size:31px;font-weight:normal">Buat password baru</h1>
              </div>
              <div style="padding:34px 32px">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7">Halo <strong>${fullName}</strong>,</p>
                <p style="margin:0;color:#60716a;font-size:15px;line-height:1.8">Kami menerima permintaan untuk mengganti password akun Affiliate Daymoment. Tekan tombol berikut untuk melanjutkan.</p>
                <div style="padding:30px 0 18px;text-align:center">
                  <a href="${safeResetUrl}" style="display:inline-block;padding:15px 27px;background:#17493d;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:bold">Reset Password Affiliate</a>
                </div>
                <p style="margin:15px 0 0;color:#87928e;font-size:12px;line-height:1.7;text-align:center">Tautan berlaku selama 1 jam dan hanya dapat digunakan satu kali. Jika kamu tidak meminta reset password, abaikan email ini.<br><br>Jika tombol tidak dapat dibuka, salin tautan berikut:<br><a href="${safeResetUrl}" style="color:#326858;word-break:break-all">${safeResetUrl}</a></p>
              </div>
            </div>
          </div>
        </body>
      </html>`,
  });
}

export async function sendAffiliatePasswordChangedEmail(env, affiliate) {
  const recipient = String(affiliate.email || '').trim();
  if (!recipient) return { skipped: true };

  const fullName = escapeHtml(affiliate.full_name);
  return sendSmtpEmail(env, {
    to: recipient,
    fromName: env.AFFILIATE_SMTP_FROM_NAME || 'Daymoment Verifikasi',
    subject: 'Password Affiliate Daymoment telah diubah',
    text: `Halo ${affiliate.full_name}, password akun Affiliate Daymoment kamu baru saja diubah. Seluruh sesi pada perangkat lain sudah dikeluarkan. Jika ini bukan kamu, segera gunakan fitur lupa password dan hubungi tim Daymoment.`,
    html: `<!doctype html>
      <html lang="id">
        <body style="margin:0;background:#f4f1e9;font-family:Arial,sans-serif;color:#17352f">
          <div style="padding:36px 16px">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e1ded4;border-radius:22px;overflow:hidden">
              <div style="padding:32px;background:#173f35;color:#ffffff;text-align:center">
                <div style="font-size:12px;letter-spacing:3px;color:#dfbf87">DAYMOMENT PARTNER</div>
                <h1 style="margin:12px 0 0;font-family:Georgia,serif;font-size:29px;font-weight:normal">Password telah diubah</h1>
              </div>
              <div style="padding:34px 32px">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7">Halo <strong>${fullName}</strong>,</p>
                <p style="margin:0;color:#60716a;font-size:15px;line-height:1.8">Password akun Affiliate Daymoment kamu baru saja diubah. Seluruh sesi pada perangkat lain sudah otomatis dikeluarkan.</p>
                <div style="margin-top:24px;padding:16px 18px;color:#7b4b38;background:#fff2ec;border:1px solid #efd8ce;border-radius:12px;font-size:13px;line-height:1.7">Jika kamu tidak melakukan perubahan ini, segera gunakan fitur lupa password dan hubungi tim Daymoment.</div>
              </div>
            </div>
          </div>
        </body>
      </html>`,
  });
}

export async function sendAffiliateAccountStatusEmail(env, affiliate, status) {
  const recipient = String(affiliate.email || '').trim();
  if (!recipient) return { skipped: true };

  const activated = status === 'active';
  const fullName = escapeHtml(affiliate.full_name);
  const appUrl = String(env.AFFILIATE_APP_URL || 'https://affiliate.daymoment.biz.id').replace(/\/$/, '');
  const loginUrl = `${appUrl}/login`;
  const safeLoginUrl = escapeHtml(loginUrl);
  const subject = activated
    ? 'Akun Affiliate Daymoment telah diaktifkan kembali'
    : 'Akun Affiliate Daymoment dinonaktifkan sementara';
  const title = activated ? 'Akunmu aktif kembali' : 'Akunmu sedang ditangguhkan';
  const copy = activated
    ? 'Akun Affiliate Daymoment milikmu telah diaktifkan kembali. Kamu sudah dapat login dan menggunakan link referral seperti biasa.'
    : 'Akun Affiliate Daymoment milikmu telah dinonaktifkan sementara. Selama penangguhan, kamu tidak dapat login dan link referral tidak dapat digunakan untuk membuat pesanan baru.';
  const detail = activated
    ? 'Produk dan link referral yang sebelumnya kamu atur akan kembali dapat digunakan.'
    : 'Pesanan dan komisi yang sudah tercatat sebelum penangguhan tetap tersimpan. Hubungi tim Daymoment apabila kamu memerlukan informasi lebih lanjut.';
  const text = activated
    ? `Halo ${affiliate.full_name}, akun Affiliate Daymoment kamu telah diaktifkan kembali. Kamu sudah dapat login dan menggunakan link referral seperti biasa: ${loginUrl}`
    : `Halo ${affiliate.full_name}, akun Affiliate Daymoment kamu sedang ditangguhkan. Kamu tidak dapat login dan link referral tidak dapat digunakan untuk pesanan baru. Pesanan serta komisi yang sudah tercatat tetap tersimpan. Hubungi tim Daymoment untuk informasi lebih lanjut.`;

  return sendSmtpEmail(env, {
    to: recipient,
    fromName: env.AFFILIATE_SMTP_FROM_NAME || 'Daymoment Verifikasi',
    subject,
    text,
    html: `<!doctype html>
      <html lang="id">
        <body style="margin:0;background:#f4f1e9;font-family:Arial,sans-serif;color:#17352f">
          <div style="padding:36px 16px">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e1ded4;border-radius:22px;overflow:hidden">
              <div style="padding:32px;background:${activated ? '#173f35' : '#6f3d36'};color:#ffffff;text-align:center">
                <div style="font-size:12px;letter-spacing:3px;color:#dfbf87">DAYMOMENT PARTNER</div>
                <h1 style="margin:12px 0 0;font-family:Georgia,serif;font-size:29px;font-weight:normal">${title}</h1>
              </div>
              <div style="padding:34px 32px">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7">Halo <strong>${fullName}</strong>,</p>
                <p style="margin:0;color:#60716a;font-size:15px;line-height:1.8">${copy}</p>
                <div style="margin-top:22px;padding:16px 18px;color:#5e5142;background:#faf4e8;border-left:4px solid #d2aa63;border-radius:0 12px 12px 0;font-size:13px;line-height:1.7">${detail}</div>
                ${activated ? `<div style="padding:28px 0 8px;text-align:center"><a href="${safeLoginUrl}" style="display:inline-block;padding:15px 27px;background:#17493d;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:bold">Login Affiliate Daymoment</a></div>` : ''}
              </div>
            </div>
          </div>
        </body>
      </html>`,
  });
}

export async function sendAffiliateReviewEmail(env, affiliate, decision, reviewNote = '', correctionUrl = '') {
  const recipient = String(affiliate.email || '').trim();
  if (!recipient) return { skipped: true };

  const approved = decision === 'approved';
  const fullName = escapeHtml(affiliate.full_name);
  const note = String(reviewNote || '').trim();
  const safeNote = escapeHtml(note);
  const loginUrl = `${String(env.AFFILIATE_APP_URL || 'https://affiliate.daymoment.biz.id').replace(/\/$/, '')}/login`;
  const safeLoginUrl = escapeHtml(loginUrl);
  const safeCorrectionUrl = escapeHtml(correctionUrl);
  const subject = approved ? 'Pendaftaran Affiliate Daymoment disetujui' : 'Hasil review pendaftaran Affiliate Daymoment';
  const statusTitle = approved ? 'Pendaftaran disetujui' : 'Pendaftaran belum disetujui';
  const statusCopy = approved
    ? 'Data identitasmu telah selesai direview dan akun Affiliate Daymoment sekarang sudah aktif. Kamu dapat login dan mulai menyiapkan produk referral.'
    : 'Setelah melakukan pemeriksaan, kami belum dapat menyetujui pendaftaran Affiliate Daymoment milikmu.';
  const text = approved
    ? `Halo ${affiliate.full_name}, pendaftaran Affiliate Daymoment kamu telah disetujui. Akunmu sekarang aktif dan dapat digunakan untuk login: ${loginUrl}${note ? ` Catatan admin: ${note}` : ''}`
    : `Halo ${affiliate.full_name}, pendaftaran Affiliate Daymoment kamu belum dapat disetujui. Alasan: ${note}. Perbarui dan kirim ulang datamu melalui tautan berikut: ${correctionUrl}. Tautan berlaku selama 7 hari dan hanya dapat digunakan satu kali.`;

  return sendSmtpEmail(env, {
    to: recipient,
    fromName: env.AFFILIATE_SMTP_FROM_NAME || 'Daymoment Verifikasi',
    subject,
    text,
    html: `<!doctype html>
      <html lang="id">
        <body style="margin:0;background:#f4f1e9;font-family:Arial,sans-serif;color:#17352f">
          <div style="padding:36px 16px">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e1ded4;border-radius:22px;overflow:hidden">
              <div style="padding:32px;background:${approved ? '#173f35' : '#6f3d36'};color:#ffffff;text-align:center">
                <div style="font-size:12px;letter-spacing:3px;color:#dfbf87">DAYMOMENT PARTNER</div>
                <h1 style="margin:12px 0 0;font-family:Georgia,serif;font-size:29px;font-weight:normal">${statusTitle}</h1>
              </div>
              <div style="padding:34px 32px">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7">Halo <strong>${fullName}</strong>,</p>
                <p style="margin:0;color:#60716a;font-size:15px;line-height:1.8">${statusCopy}</p>
                ${note ? `<div style="margin-top:22px;padding:16px 18px;color:#5e5142;background:#faf4e8;border-left:4px solid #d2aa63;border-radius:0 12px 12px 0;font-size:13px;line-height:1.7"><strong>Catatan admin</strong><br>${safeNote}</div>` : ''}
                ${approved
                  ? `<div style="padding:28px 0 12px;text-align:center"><a href="${safeLoginUrl}" style="display:inline-block;padding:15px 27px;background:#17493d;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:bold">Login Affiliate Daymoment</a></div>`
                  : `<p style="margin:22px 0 0;color:#60716a;font-size:13px;line-height:1.7">Silakan perbaiki data sesuai catatan admin, lalu kirim ulang agar pendaftaran masuk kembali ke antrean review.</p><div style="padding:26px 0 12px;text-align:center"><a href="${safeCorrectionUrl}" style="display:inline-block;padding:15px 27px;background:#6f3d36;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:bold">Perbarui Data Pendaftaran</a></div><p style="margin:13px 0 0;color:#87928e;font-size:12px;line-height:1.7;text-align:center">Tautan berlaku selama 7 hari dan hanya dapat digunakan satu kali.<br><br>Jika tombol tidak dapat dibuka, salin tautan berikut:<br><a href="${safeCorrectionUrl}" style="color:#6f3d36;word-break:break-all">${safeCorrectionUrl}</a></p>`}
              </div>
            </div>
          </div>
        </body>
      </html>`,
  });
}

export async function sendAffiliateProUpgradeReviewEmail(env, affiliate, decision, reviewNote = '') {
  const recipient = String(affiliate.email || '').trim();
  if (!recipient) return { skipped: true };

  const approved = decision === 'approved';
  const fullName = escapeHtml(affiliate.full_name);
  const note = String(reviewNote || '').trim();
  const safeNote = escapeHtml(note);
  const appUrl = String(env.AFFILIATE_APP_URL || 'https://affiliate.daymoment.biz.id').replace(/\/$/, '');
  const withdrawalUrl = `${appUrl}/withdrawals`;
  const safeWithdrawalUrl = escapeHtml(withdrawalUrl);
  const subject = approved
    ? 'Upgrade Affiliate Pro Daymoment disetujui'
    : 'Hasil review upgrade Affiliate Pro Daymoment';
  const title = approved ? 'Akunmu sekarang Pro' : 'Pengajuan Pro belum disetujui';
  const copy = approved
    ? 'Bukti media sosialmu telah disetujui. Fitur penarikan saldo sekarang sudah terbuka dan tidak perlu di-upgrade ulang.'
    : 'Bukti media sosialmu belum dapat disetujui. Kamu dapat memperbaiki bukti dan mengajukan kembali, atau memilih upgrade sekali bayar melalui Midtrans.';
  const text = approved
    ? `Halo ${affiliate.full_name}, pengajuan upgrade Affiliate Pro Daymoment telah disetujui. Fitur penarikan saldo sekarang sudah terbuka: ${withdrawalUrl}${note ? ` Catatan admin: ${note}` : ''}`
    : `Halo ${affiliate.full_name}, pengajuan upgrade Affiliate Pro Daymoment belum disetujui.${note ? ` Alasan: ${note}.` : ''} Silakan ajukan kembali atau pilih upgrade sekali bayar melalui: ${withdrawalUrl}`;

  return sendSmtpEmail(env, {
    to: recipient,
    fromName: env.AFFILIATE_SMTP_FROM_NAME || 'Daymoment Verifikasi',
    subject,
    text,
    html: `<!doctype html>
      <html lang="id">
        <body style="margin:0;background:#f4f1e9;font-family:Arial,sans-serif;color:#17352f">
          <div style="padding:36px 16px">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e1ded4;border-radius:22px;overflow:hidden">
              <div style="padding:32px;background:${approved ? '#173f35' : '#6f3d36'};color:#ffffff;text-align:center">
                <div style="font-size:12px;letter-spacing:3px;color:#dfbf87">DAYMOMENT PARTNER</div>
                <h1 style="margin:12px 0 0;font-family:Georgia,serif;font-size:29px;font-weight:normal">${title}</h1>
              </div>
              <div style="padding:34px 32px">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7">Halo <strong>${fullName}</strong>,</p>
                <p style="margin:0;color:#60716a;font-size:15px;line-height:1.8">${copy}</p>
                ${note ? `<div style="margin-top:22px;padding:16px 18px;color:#5e5142;background:#faf4e8;border-left:4px solid #d2aa63;border-radius:0 12px 12px 0;font-size:13px;line-height:1.7"><strong>Catatan admin</strong><br>${safeNote}</div>` : ''}
                <div style="padding:28px 0 8px;text-align:center"><a href="${safeWithdrawalUrl}" style="display:inline-block;padding:15px 27px;background:#17493d;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:bold">Buka Halaman Penarikan</a></div>
              </div>
            </div>
          </div>
        </body>
      </html>`,
  });
}
