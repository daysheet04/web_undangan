import { Hono } from 'hono';
import { database } from '../lib/database.js';
import { sendAdminWithdrawalRequestedEmail, sendAffiliatePasswordChangedEmail, sendAffiliatePasswordResetEmail, sendAffiliateVerificationEmail, sendAffiliateWithdrawalRequestedEmail } from '../lib/email.js';
import { cleanText, normalizePhone, validEmail, validPhone } from '../lib/helpers.js';
import { createSnapTransaction, normalizedPaymentStatus, transactionStatus, verifyNotificationSignature } from '../lib/midtrans.js';

const affiliate = new Hono();
const SESSION_COOKIE = 'daymoment_affiliate';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_IDLE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;
const SENSITIVE_SESSION_MAX_AGE_MS = 30 * 60 * 1000;
const MAX_ACTIVE_SESSIONS = 5;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const PASSWORD_RESET_COOLDOWN_MS = 2 * 60 * 1000;
const MAX_FAILED_LOGINS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const PRO_UPGRADE_PRICE = 20000;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function clientIp(c) {
  return cleanText(c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')?.split(',')[0] || '', 80) || null;
}

function userAgent(c) {
  return cleanText(c.req.header('User-Agent') || '', 500) || null;
}

function randomToken(bytes = 32) {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...values)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function identityImageExtension(type) {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[type] || '';
}

async function validIdentityImage(file) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === 'image/png') return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (file.type === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return false;
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function consumeRateLimit(db, action, key, maxAttempts, windowSeconds, blockSeconds) {
  const keyHash = await sha256(`${action}|${String(key || 'unknown')}`);
  const { data, error } = await db.rpc('consume_affiliate_rate_limit', {
    p_action: action,
    p_key_hash: keyHash,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
    p_block_seconds: blockSeconds,
  });
  if (error) {
    if (error.code === 'PGRST202' || /consume_affiliate_rate_limit|schema cache/i.test(error.message || '')) {
      console.error('Proteksi rate-limit affiliate belum aktif. Jalankan migrasi 2026_10_18_affiliate_security_hardening.sql di Supabase.');
    }
    throw error;
  }
  const result = Array.isArray(data) ? data[0] : data;
  return {
    allowed: result?.allowed === true,
    retryAfter: Math.max(1, Number(result?.retry_after_seconds || blockSeconds)),
  };
}

function rateLimitResponse(c, result, prefix = 'Terlalu banyak percobaan.') {
  if (result.allowed) return null;
  const retryAfterSeconds = Math.max(1, Math.ceil(Number(result.retryAfter) || 1));
  const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  c.header('Retry-After', String(retryAfterSeconds));
  return c.json({
    ok: false,
    message: `${prefix} Coba lagi dalam ${retryAfterMinutes} menit.`,
    retry_after_seconds: retryAfterSeconds,
    retry_after_minutes: retryAfterMinutes,
  }, 429);
}

function readCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const part = cookie.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : '';
}

function sessionCookie(request, value, maxAge) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}; Priority=High${secure}`;
}

function affiliateAppUrl(c, path = '/') {
  const origin = String(c.req.header('Origin') || '');
  const localOrigin = /^http:\/\/(?:localhost|127\.0\.0\.1):8082$/.test(origin) ? origin : '';
  const base = (localOrigin || String(c.env.AFFILIATE_APP_URL || 'https://affiliate.daymoment.biz.id')).replace(/\/$/, '');
  return `${base}${String(path).startsWith('/') ? path : `/${path}`}`;
}

async function recordLogin(db, c, details) {
  const { error } = await db.from('affiliate_login_history').insert({
    affiliate_id: details.affiliateId || null,
    email: details.email,
    success: details.success,
    failure_reason: details.failureReason || null,
    ip_address: clientIp(c),
    user_agent: userAgent(c),
  });
  if (error) console.error('Gagal mencatat riwayat login affiliate:', error.message);
}

async function tooManyFailedLogins(db, email, ipAddress) {
  const since = new Date(Date.now() - LOGIN_WINDOW_MS).toISOString();
  const emailQuery = db.from('affiliate_login_history')
    .select('attempted_at')
    .eq('email', email)
    .eq('success', false)
    .gte('attempted_at', since)
    .order('attempted_at', { ascending: false })
    .limit(MAX_FAILED_LOGINS);
  const ipQuery = ipAddress
    ? db.from('affiliate_login_history')
      .select('attempted_at')
      .eq('ip_address', ipAddress)
      .eq('success', false)
      .gte('attempted_at', since)
      .order('attempted_at', { ascending: false })
      .limit(20)
    : Promise.resolve({ data: [], error: null });
  const [emailResult, ipResult] = await Promise.all([emailQuery, ipQuery]);
  if (emailResult.error) throw emailResult.error;
  if (ipResult.error) throw ipResult.error;

  const emailAttempts = emailResult.data || [];
  const ipAttempts = ipResult.data || [];
  const blockedUntil = [];
  if (emailAttempts.length >= MAX_FAILED_LOGINS) {
    blockedUntil.push(new Date(emailAttempts[MAX_FAILED_LOGINS - 1].attempted_at).getTime() + LOGIN_WINDOW_MS);
  }
  if (ipAttempts.length >= 20) {
    blockedUntil.push(new Date(ipAttempts[19].attempted_at).getTime() + LOGIN_WINDOW_MS);
  }
  if (!blockedUntil.length) return { blocked: false, retryAfter: 0 };
  return {
    blocked: true,
    retryAfter: Math.max(1, Math.ceil((Math.max(...blockedUntil) - Date.now()) / 1000)),
  };
}

async function activeSession(c) {
  const rawToken = readCookie(c.req.raw, SESSION_COOKIE);
  if (!rawToken) return null;
  const db = database(c.env);
  const tokenHash = await sha256(rawToken);
  const { data: session, error } = await db.from('affiliate_sessions')
    .select('id,affiliate_id,expires_at,revoked_at,last_seen_at,created_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (error) throw error;
  const now = Date.now();
  const idleExpired = session?.last_seen_at && now - new Date(session.last_seen_at).getTime() > SESSION_IDLE_TTL_MS;
  if (!session || session.revoked_at || new Date(session.expires_at).getTime() <= now || idleExpired) {
    if (session && !session.revoked_at) {
      await db.from('affiliate_sessions').update({ revoked_at: new Date().toISOString() }).eq('id', session.id);
    }
    return null;
  }
  const { data: account, error: accountError } = await db.from('affiliate_accounts')
    .select('id,email,full_name,phone,referral_code,status')
    .eq('id', session.affiliate_id)
    .maybeSingle();
  if (accountError) throw accountError;
  if (!account || account.status !== 'active') {
    await db.from('affiliate_sessions').update({ revoked_at: new Date().toISOString() }).eq('id', session.id);
    return null;
  }
  if (!session.last_seen_at || now - new Date(session.last_seen_at).getTime() >= SESSION_TOUCH_INTERVAL_MS) {
    c.executionCtx.waitUntil(Promise.resolve(db.from('affiliate_sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', session.id)));
  }
  return { db, session, account };
}

function publicAppUrl(c, path = '/') {
  const origin = String(c.req.header('Origin') || '');
  const localBase = /^http:\/\/(?:localhost|127\.0\.0\.1):8082$/.test(origin)
    ? origin.replace(/:8082$/, ':8080')
    : '';
  const base = (localBase || String(c.env.PUBLIC_APP_URL || 'https://daymoment.biz.id')).replace(/\/$/, '');
  return `${base}${String(path).startsWith('/') ? path : `/${path}`}`;
}

function maskedAccountNumber(value) {
  const normalized = String(value || '').replace(/\s+/g, '');
  if (normalized.length <= 4) return normalized;
  return `•••• ${normalized.slice(-4)}`;
}

function maskedIp(value) {
  const ip = String(value || '').trim();
  if (!ip) return 'Tidak tersedia';
  if (ip.includes(':')) {
    const blocks = ip.split(':').filter(Boolean);
    return `${blocks.slice(0, 2).join(':') || 'IPv6'}:••••`;
  }
  const blocks = ip.split('.');
  return blocks.length === 4 ? `${blocks[0]}.${blocks[1]}.•••.•••` : 'Tersamarkan';
}

function loginDevice(value) {
  const agent = String(value || '');
  const browser = /Edg\//i.test(agent) ? 'Edge'
    : /Firefox\//i.test(agent) ? 'Firefox'
      : /Chrome\//i.test(agent) ? 'Chrome'
        : /Safari\//i.test(agent) ? 'Safari'
          : 'Browser';
  const system = /Android/i.test(agent) ? 'Android'
    : /iPhone|iPad|iPod/i.test(agent) ? 'iOS'
      : /Windows/i.test(agent) ? 'Windows'
        : /Macintosh|Mac OS/i.test(agent) ? 'macOS'
          : /Linux/i.test(agent) ? 'Linux'
            : 'Perangkat tidak dikenal';
  return `${browser} · ${system}`;
}

async function affiliateProAccount(db, affiliateId) {
  const { data, error } = await db.from('affiliate_accounts')
    .select('id,email,full_name,account_tier,pro_source,pro_activated_at')
    .eq('id', affiliateId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function applyAffiliateProPayment(db, request, payload) {
  const paymentStatus = normalizedPaymentStatus(payload);
  const paidAmount = Number(payload.gross_amount || request.payment_amount || 0);
  if (Math.round(paidAmount) !== PRO_UPGRADE_PRICE) {
    const failure = new Error('Nominal pembayaran upgrade Pro tidak sesuai.');
    failure.status = 422;
    throw failure;
  }
  if (paymentStatus === 'paid') {
    const paidAt = payload.settlement_time || payload.transaction_time || new Date().toISOString();
    const { data: affiliateId, error } = await db.rpc('complete_affiliate_pro_payment', {
      p_gateway_order_id: request.gateway_order_id,
      p_transaction_id: cleanText(payload.transaction_id, 120) || null,
      p_paid_at: paidAt,
    });
    if (error) throw error;
    if (!affiliateId) throw new Error('Pembayaran upgrade Pro tidak ditemukan.');
    return 'paid';
  }
  const nextStatus = ['failed', 'expired'].includes(paymentStatus) ? paymentStatus : 'pending';
  const { error } = await db.from('affiliate_pro_upgrade_requests').update({
    status: nextStatus,
    transaction_id: cleanText(payload.transaction_id, 120) || request.transaction_id || null,
    updated_at: new Date().toISOString(),
  }).eq('id', request.id);
  if (error) throw error;
  return nextStatus;
}

affiliate.get('/affiliate/registration-options', async (c) => {
  const db = database(c.env);
  const { data, error } = await db.from('affiliate_social_platforms')
    .select('id,name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return c.json({ ok: true, social_platforms: data || [] });
});

affiliate.post('/affiliate/register', async (c) => {
  const input = await c.req.formData().catch(() => null);
  if (!input) return c.json({ ok: false, message: 'Data pendaftaran tidak valid.' }, 400);
  const fullName = cleanText(input.get('fullName'), 120);
  const nik = String(input.get('nik') || '').replace(/\D/g, '').slice(0, 16);
  const ktp = input.get('ktp');
  const socialPlatform = cleanText(input.get('socialPlatform'), 40);
  const socialHandle = cleanText(input.get('socialHandle'), 120);
  const socialFollowerCount = Number(String(input.get('socialFollowerCount') || '').replace(/\D/g, ''));
  const socialProof = input.get('socialProof');
  const phone = normalizePhone(input.get('phone'));
  const email = normalizeEmail(input.get('email'));
  const password = String(input.get('password') || '');
  const passwordBytes = new TextEncoder().encode(password).byteLength;

  if (fullName.length < 2) return c.json({ ok: false, message: 'Nama lengkap minimal 2 karakter.' }, 422);
  if (!/^\d{16}$/.test(nik)) return c.json({ ok: false, message: 'NIK wajib terdiri dari 16 digit angka.' }, 422);
  if (!(ktp instanceof File) || !ktp.size) return c.json({ ok: false, message: 'Foto KTP wajib diunggah.' }, 422);
  if (!identityImageExtension(ktp.type) || !await validIdentityImage(ktp)) return c.json({ ok: false, message: 'Format foto KTP harus JPG, PNG, atau WEBP yang valid.' }, 422);
  if (ktp.size > 4 * 1024 * 1024) return c.json({ ok: false, message: 'Ukuran foto KTP maksimal 4 MB.' }, 422);
  if (socialPlatform.length < 2) return c.json({ ok: false, message: 'Pilih media sosial yang digunakan.' }, 422);
  if (socialHandle.length < 2) return c.json({ ok: false, message: 'Username atau nama akun media sosial wajib diisi.' }, 422);
  if (!Number.isInteger(socialFollowerCount) || socialFollowerCount < 0) return c.json({ ok: false, message: 'Jumlah followers tidak valid.' }, 422);
  if (!(socialProof instanceof File) || !socialProof.size) return c.json({ ok: false, message: 'Screenshot akun media sosial wajib diunggah.' }, 422);
  if (!identityImageExtension(socialProof.type) || !await validIdentityImage(socialProof)) return c.json({ ok: false, message: 'Screenshot media sosial harus berupa JPG, PNG, atau WEBP yang valid.' }, 422);
  if (socialProof.size > 4 * 1024 * 1024) return c.json({ ok: false, message: 'Ukuran screenshot media sosial maksimal 4 MB.' }, 422);
  if (!validPhone(phone)) return c.json({ ok: false, message: 'Nomor WhatsApp tidak valid.' }, 422);
  if (!validEmail(email)) return c.json({ ok: false, message: 'Alamat email tidak valid.' }, 422);
  if (password.length < 8) return c.json({ ok: false, message: 'Password minimal 8 karakter.' }, 422);
  if (passwordBytes > 72) return c.json({ ok: false, message: 'Password terlalu panjang. Gunakan maksimal 72 byte.' }, 422);

  const db = database(c.env);
  const { data: selectedPlatform, error: platformError } = await db.from('affiliate_social_platforms')
    .select('name')
    .eq('name', socialPlatform)
    .eq('is_active', true)
    .maybeSingle();
  if (platformError) throw platformError;
  if (!selectedPlatform) return c.json({ ok: false, message: 'Pilihan media sosial sudah tidak tersedia. Muat ulang halaman lalu pilih kembali.' }, 422);
  const registrationLimit = await consumeRateLimit(db, 'register_ip', clientIp(c), 5, 3600, 3600);
  const registrationBlocked = rateLimitResponse(c, registrationLimit, 'Terlalu banyak pendaftaran dari perangkat ini.');
  if (registrationBlocked) return registrationBlocked;
  const verificationToken = randomToken(32);
  const verificationHash = await sha256(verificationToken);
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();
  if (!c.env.MEDIA) return c.json({ ok: false, message: 'Penyimpanan dokumen belum tersedia. Silakan coba lagi.' }, 503);
  const ktpObjectKey = `affiliate-ktp/${randomToken(24)}.${identityImageExtension(ktp.type)}`;
  const socialProofObjectKey = `affiliate-social/${randomToken(24)}.${identityImageExtension(socialProof.type)}`;
  await c.env.MEDIA.put(ktpObjectKey, ktp.stream(), {
    httpMetadata: { contentType: ktp.type, cacheControl: 'private, no-store' },
    customMetadata: { uploadedAt: new Date().toISOString() },
  });
  try {
    await c.env.MEDIA.put(socialProofObjectKey, socialProof.stream(), {
      httpMetadata: { contentType: socialProof.type, cacheControl: 'private, no-store' },
      customMetadata: { uploadedAt: new Date().toISOString() },
    });
  } catch (uploadError) {
    await c.env.MEDIA.delete(ktpObjectKey);
    throw uploadError;
  }
  const { data: account, error } = await db.rpc('register_affiliate_account', {
    p_full_name: fullName,
    p_phone: phone,
    p_email: email,
    p_password: password,
    p_nik: nik,
    p_ktp_object_key: ktpObjectKey,
    p_social_platform: selectedPlatform.name,
    p_social_handle: socialHandle,
    p_social_follower_count: socialFollowerCount,
    p_social_proof_object_key: socialProofObjectKey,
    p_verification_token_hash: verificationHash,
    p_verification_expires_at: expiresAt,
  }).single();

  if (error) {
    await Promise.all([c.env.MEDIA.delete(ktpObjectKey), c.env.MEDIA.delete(socialProofObjectKey)]);
    if (error.code === '23505' || /affiliate_email_or_nik_exists|duplicate key/i.test(error.message || '')) {
      return c.json({ ok: false, message: 'Email atau NIK ini sudah terdaftar. Silakan gunakan data lain.' }, 409);
    }
    throw error;
  }

  const verificationUrl = affiliateAppUrl(c, `/verify-email?token=${encodeURIComponent(verificationToken)}`);
  try {
    const sent = await sendAffiliateVerificationEmail(c.env, account, verificationUrl);
    if (sent?.skipped) throw new Error('SMTP affiliate belum dikonfigurasi.');
  } catch (sendError) {
    await db.from('affiliate_accounts').delete().eq('id', account.id);
    await Promise.all([c.env.MEDIA.delete(ktpObjectKey), c.env.MEDIA.delete(socialProofObjectKey)]);
    console.error('Email verifikasi affiliate gagal:', sendError);
    return c.json({ ok: false, message: 'Email verifikasi gagal dikirim. Periksa konfigurasi SMTP lalu coba daftar kembali.' }, 502);
  }

  return c.json({ ok: true, message: 'Pendaftaran berhasil. Verifikasi emailmu, lalu data akan direview oleh admin Daymoment.' }, 201);
});

affiliate.post('/affiliate/verify-email', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const token = String(input.token || '');
  if (token.length < 32 || token.length > 200) return c.json({ ok: false, message: 'Tautan verifikasi tidak valid.' }, 400);
  const db = database(c.env);
  const verificationLimit = await consumeRateLimit(db, 'verify_email_ip', clientIp(c), 20, 3600, 3600);
  const verificationBlocked = rateLimitResponse(c, verificationLimit);
  if (verificationBlocked) return verificationBlocked;
  const { data, error } = await db.rpc('activate_affiliate_account', { p_token_hash: await sha256(token) });
  if (error) throw error;
  if (data !== true) return c.json({ ok: false, message: 'Tautan verifikasi tidak valid, sudah digunakan, atau telah kedaluwarsa.' }, 410);
  return c.json({ ok: true, message: 'Email berhasil diverifikasi. Pendaftaranmu sedang menunggu review admin Daymoment.' });
});

async function readReviewCorrection(db, tokenHash) {
  const { data: correction, error: correctionError } = await db.from('affiliate_review_corrections')
    .select('affiliate_id,expires_at,used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (correctionError) throw correctionError;
  if (!correction || correction.used_at || new Date(correction.expires_at).getTime() <= Date.now()) return null;

  const { data: account, error: accountError } = await db.from('affiliate_accounts')
    .select('id,email,full_name,phone,nik,status,review_note,social_platform,social_handle,social_follower_count,social_proof_object_key')
    .eq('id', correction.affiliate_id)
    .maybeSingle();
  if (accountError) throw accountError;
  if (!account || account.status !== 'rejected') return null;
  return { correction, account };
}

affiliate.get('/affiliate/review-correction', async (c) => {
  const token = String(c.req.query('token') || '');
  if (token.length < 32 || token.length > 200) return c.json({ ok: false, message: 'Tautan perbaikan tidak valid.' }, 400);
  const db = database(c.env);
  const viewLimit = await consumeRateLimit(db, 'review_correction_view_ip', clientIp(c), 30, 3600, 3600);
  const blocked = rateLimitResponse(c, viewLimit, 'Terlalu banyak permintaan perbaikan data.');
  if (blocked) return blocked;
  const result = await readReviewCorrection(db, await sha256(token));
  if (!result) return c.json({ ok: false, message: 'Tautan perbaikan tidak valid, sudah digunakan, atau telah kedaluwarsa.' }, 410);
  return c.json({
    ok: true,
    registration: {
      email: result.account.email,
      full_name: result.account.full_name,
      phone: result.account.phone,
      nik: result.account.nik,
      social_platform: result.account.social_platform,
      social_handle: result.account.social_handle,
      social_follower_count: result.account.social_follower_count,
      has_social_proof: Boolean(result.account.social_proof_object_key),
      review_note: result.account.review_note,
      expires_at: result.correction.expires_at,
    },
  });
});

affiliate.post('/affiliate/review-correction', async (c) => {
  const input = await c.req.formData().catch(() => null);
  if (!input) return c.json({ ok: false, message: 'Data perbaikan tidak valid.' }, 400);
  const token = String(input.get('token') || '');
  const fullName = cleanText(input.get('fullName'), 120);
  const phone = normalizePhone(input.get('phone'));
  const nik = String(input.get('nik') || '').replace(/\D/g, '').slice(0, 16);
  const ktp = input.get('ktp');
  const hasNewKtp = ktp instanceof File && ktp.size > 0;
  const socialPlatform = cleanText(input.get('socialPlatform'), 40);
  const socialHandle = cleanText(input.get('socialHandle'), 120);
  const socialFollowerCount = Number(String(input.get('socialFollowerCount') || '').replace(/\D/g, ''));
  const socialProof = input.get('socialProof');
  const hasNewSocialProof = socialProof instanceof File && socialProof.size > 0;
  if (token.length < 32 || token.length > 200) return c.json({ ok: false, message: 'Tautan perbaikan tidak valid.' }, 400);
  if (fullName.length < 2) return c.json({ ok: false, message: 'Nama lengkap minimal 2 karakter.' }, 422);
  if (!/^\d{16}$/.test(nik)) return c.json({ ok: false, message: 'NIK wajib terdiri dari 16 digit angka.' }, 422);
  if (!validPhone(phone)) return c.json({ ok: false, message: 'Nomor WhatsApp tidak valid.' }, 422);
  if (socialPlatform.length < 2) return c.json({ ok: false, message: 'Pilih media sosial yang digunakan.' }, 422);
  if (socialHandle.length < 2) return c.json({ ok: false, message: 'Username atau nama akun media sosial wajib diisi.' }, 422);
  if (!Number.isInteger(socialFollowerCount) || socialFollowerCount < 0) return c.json({ ok: false, message: 'Jumlah followers tidak valid.' }, 422);
  if (hasNewKtp && (!identityImageExtension(ktp.type) || !await validIdentityImage(ktp))) return c.json({ ok: false, message: 'Format foto KTP harus JPG, PNG, atau WEBP yang valid.' }, 422);
  if (hasNewKtp && ktp.size > 4 * 1024 * 1024) return c.json({ ok: false, message: 'Ukuran foto KTP maksimal 4 MB.' }, 422);
  if (hasNewSocialProof && (!identityImageExtension(socialProof.type) || !await validIdentityImage(socialProof))) return c.json({ ok: false, message: 'Screenshot media sosial harus berupa JPG, PNG, atau WEBP yang valid.' }, 422);
  if (hasNewSocialProof && socialProof.size > 4 * 1024 * 1024) return c.json({ ok: false, message: 'Ukuran screenshot media sosial maksimal 4 MB.' }, 422);

  const db = database(c.env);
  const submitLimit = await consumeRateLimit(db, 'review_correction_submit_ip', clientIp(c), 10, 3600, 3600);
  const blocked = rateLimitResponse(c, submitLimit, 'Terlalu banyak pengiriman perbaikan data.');
  if (blocked) return blocked;
  const tokenHash = await sha256(token);
  const correctionData = await readReviewCorrection(db, tokenHash);
  if (!correctionData) return c.json({ ok: false, message: 'Tautan perbaikan tidak valid, sudah digunakan, atau telah kedaluwarsa.' }, 410);
  if (!correctionData.account.social_proof_object_key && !hasNewSocialProof) return c.json({ ok: false, message: 'Screenshot akun media sosial wajib diunggah.' }, 422);
  const { data: selectedPlatform, error: platformError } = await db.from('affiliate_social_platforms')
    .select('name')
    .eq('name', socialPlatform)
    .eq('is_active', true)
    .maybeSingle();
  if (platformError) throw platformError;
  if (!selectedPlatform) return c.json({ ok: false, message: 'Pilihan media sosial sudah tidak tersedia. Muat ulang halaman lalu pilih kembali.' }, 422);

  let newKtpObjectKey = null;
  let newSocialProofObjectKey = null;
  if (hasNewKtp) {
    if (!c.env.MEDIA) return c.json({ ok: false, message: 'Penyimpanan dokumen belum tersedia. Silakan coba lagi.' }, 503);
    newKtpObjectKey = `affiliate-ktp/${randomToken(24)}.${identityImageExtension(ktp.type)}`;
    await c.env.MEDIA.put(newKtpObjectKey, ktp.stream(), {
      httpMetadata: { contentType: ktp.type, cacheControl: 'private, no-store' },
      customMetadata: { uploadedAt: new Date().toISOString() },
    });
  }
  if (hasNewSocialProof) {
    if (!c.env.MEDIA) {
      if (newKtpObjectKey) await c.env.MEDIA?.delete(newKtpObjectKey);
      return c.json({ ok: false, message: 'Penyimpanan dokumen belum tersedia. Silakan coba lagi.' }, 503);
    }
    newSocialProofObjectKey = `affiliate-social/${randomToken(24)}.${identityImageExtension(socialProof.type)}`;
    try {
      await c.env.MEDIA.put(newSocialProofObjectKey, socialProof.stream(), {
        httpMetadata: { contentType: socialProof.type, cacheControl: 'private, no-store' },
        customMetadata: { uploadedAt: new Date().toISOString() },
      });
    } catch (uploadError) {
      if (newKtpObjectKey) await c.env.MEDIA.delete(newKtpObjectKey);
      throw uploadError;
    }
  }

  const { data: resubmitted, error } = await db.rpc('resubmit_affiliate_registration', {
    p_token_hash: tokenHash,
    p_full_name: fullName,
    p_phone: phone,
    p_nik: nik,
    p_ktp_object_key: newKtpObjectKey,
    p_social_platform: selectedPlatform.name,
    p_social_handle: socialHandle,
    p_social_follower_count: socialFollowerCount,
    p_social_proof_object_key: newSocialProofObjectKey,
  }).maybeSingle();
  if (error) {
    await Promise.all([newKtpObjectKey ? c.env.MEDIA.delete(newKtpObjectKey) : null, newSocialProofObjectKey ? c.env.MEDIA.delete(newSocialProofObjectKey) : null].filter(Boolean));
    if (error.code === '23505' || /affiliate_nik_exists|duplicate key/i.test(error.message || '')) {
      return c.json({ ok: false, message: 'NIK tersebut sudah digunakan oleh akun affiliate lain.' }, 409);
    }
    throw error;
  }
  if (!resubmitted) {
    await Promise.all([newKtpObjectKey ? c.env.MEDIA.delete(newKtpObjectKey) : null, newSocialProofObjectKey ? c.env.MEDIA.delete(newSocialProofObjectKey) : null].filter(Boolean));
    return c.json({ ok: false, message: 'Tautan perbaikan tidak valid, sudah digunakan, atau telah kedaluwarsa.' }, 410);
  }
  if (newKtpObjectKey && resubmitted.old_ktp_object_key && resubmitted.old_ktp_object_key !== newKtpObjectKey && String(resubmitted.old_ktp_object_key).startsWith('affiliate-ktp/')) {
    await c.env.MEDIA.delete(resubmitted.old_ktp_object_key).catch((deleteError) => console.error('Gagal menghapus KTP affiliate lama:', deleteError));
  }
  if (newSocialProofObjectKey && resubmitted.old_social_proof_object_key && resubmitted.old_social_proof_object_key !== newSocialProofObjectKey && String(resubmitted.old_social_proof_object_key).startsWith('affiliate-social/')) {
    await c.env.MEDIA.delete(resubmitted.old_social_proof_object_key).catch((deleteError) => console.error('Gagal menghapus bukti sosial affiliate lama:', deleteError));
  }
  return c.json({ ok: true, message: 'Data perbaikan berhasil dikirim dan sudah masuk kembali ke antrean review admin.' });
});

affiliate.post('/affiliate/login', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const email = normalizeEmail(input.email);
  const password = String(input.password || '');
  if (!validEmail(email) || !password) return c.json({ ok: false, message: 'Email atau password tidak sesuai.' }, 401);

  const db = database(c.env);
  const ipAddress = clientIp(c);
  const loginLimit = await consumeRateLimit(db, 'login_ip', ipAddress, 20, 900, 900);
  const loginBlocked = rateLimitResponse(c, loginLimit, 'Terlalu banyak percobaan login.');
  if (loginBlocked) return loginBlocked;
  const failedLoginLimit = await tooManyFailedLogins(db, email, ipAddress);
  if (failedLoginLimit.blocked) {
    await recordLogin(db, c, { email, success: false, failureReason: 'rate_limited' });
    return rateLimitResponse(c, { allowed: false, retryAfter: failedLoginLimit.retryAfter }, 'Terlalu banyak percobaan login.');
  }

  const { data: account, error } = await db.rpc('verify_affiliate_password', {
    p_email: email,
    p_password: password,
  }).maybeSingle();
  if (error) throw error;
  if (!account) {
    await recordLogin(db, c, { email, success: false, failureReason: 'invalid_credentials' });
    return c.json({ ok: false, message: 'Email atau password tidak sesuai.' }, 401);
  }
  if (account.status !== 'active') {
    await recordLogin(db, c, { affiliateId: account.id, email, success: false, failureReason: `status_${account.status}` });
    const message = account.status === 'pending'
      ? account.email_verified_at
        ? 'Pendaftaran sedang menunggu persetujuan admin Daymoment.'
        : 'Akun belum aktif. Buka email verifikasi Daymoment terlebih dahulu.'
      : 'Akun affiliate ini tidak dapat digunakan. Hubungi admin Daymoment.';
    return c.json({ ok: false, message, code: `ACCOUNT_${account.status.toUpperCase()}` }, 403);
  }

  const sessionToken = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const { error: sessionError } = await db.from('affiliate_sessions').insert({
    affiliate_id: account.id,
    token_hash: await sha256(sessionToken),
    ip_address: clientIp(c),
    user_agent: userAgent(c),
    expires_at: expiresAt,
  });
  if (sessionError) throw sessionError;
  const { data: activeSessions, error: activeSessionsError } = await db.from('affiliate_sessions')
    .select('id,created_at')
    .eq('affiliate_id', account.id)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (activeSessionsError) throw activeSessionsError;
  const expiredSessionIds = (activeSessions || []).slice(MAX_ACTIVE_SESSIONS).map((session) => session.id);
  if (expiredSessionIds.length) {
    const { error: revokeError } = await db.from('affiliate_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .in('id', expiredSessionIds);
    if (revokeError) throw revokeError;
  }
  await recordLogin(db, c, { affiliateId: account.id, email, success: true });

  const response = c.json({ ok: true, affiliate: account });
  response.headers.set('Set-Cookie', sessionCookie(c.req.raw, sessionToken, Math.floor(SESSION_TTL_MS / 1000)));
  return response;
});

affiliate.post('/affiliate/forgot-password', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const email = normalizeEmail(input.email);
  if (!validEmail(email)) return c.json({ ok: false, message: 'Alamat email tidak valid.' }, 422);

  const successMessage = 'Tautan reset password sudah dikirim. Silakan periksa emailmu.';
  const db = database(c.env);
  const [forgotIpLimit, forgotEmailLimit] = await Promise.all([
    consumeRateLimit(db, 'forgot_password_ip', clientIp(c), 10, 3600, 3600),
    consumeRateLimit(db, 'forgot_password_email', email, 3, 900, 900),
  ]);
  const forgotLimit = !forgotIpLimit.allowed && !forgotEmailLimit.allowed
    ? (forgotIpLimit.retryAfter >= forgotEmailLimit.retryAfter ? forgotIpLimit : forgotEmailLimit)
    : (forgotIpLimit.allowed ? forgotEmailLimit : forgotIpLimit);
  const forgotBlocked = rateLimitResponse(c, forgotLimit, 'Terlalu banyak permintaan reset.');
  if (forgotBlocked) return forgotBlocked;
  const { data: account, error: accountError } = await db.from('affiliate_accounts')
    .select('id,email,full_name,status,email_verified_at')
    .eq('email', email)
    .maybeSingle();
  if (accountError) throw accountError;
  if (!account) return c.json({ ok: false, message: 'Email belum terdaftar sebagai affiliate Daymoment.' }, 404);
  if (account.status === 'pending') {
    return c.json({ ok: false, message: account.email_verified_at ? 'Pendaftaran sedang menunggu persetujuan admin Daymoment.' : 'Akun belum aktif. Silakan verifikasi email pendaftaran terlebih dahulu.' }, 403);
  }
  if (account.status === 'suspended') {
    return c.json({ ok: false, message: 'Akun sedang ditangguhkan. Silakan hubungi tim Daymoment.' }, 403);
  }
  if (account.status === 'rejected') {
    return c.json({ ok: false, message: 'Akun tidak dapat digunakan. Silakan hubungi tim Daymoment.' }, 403);
  }
  if (account.status !== 'active') {
    return c.json({ ok: false, message: 'Status akun tidak memungkinkan reset password.' }, 403);
  }

  const { data: latestReset, error: latestError } = await db.from('affiliate_password_resets')
    .select('created_at')
    .eq('affiliate_id', account.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) {
    if (latestError.code === '42P01' || /affiliate_password_resets|schema cache/i.test(latestError.message || '')) {
      console.error('Tabel reset password affiliate belum tersedia:', latestError);
      return c.json({ ok: false, message: 'Gagal memproses permintaan. Silakan coba lagi.' }, 503);
    }
    throw latestError;
  }
  if (latestReset && Date.now() - new Date(latestReset.created_at).getTime() < PASSWORD_RESET_COOLDOWN_MS) {
    return c.json({ ok: true, message: 'Tautan reset baru saja dikirim. Silakan periksa emailmu sebelum meminta ulang.' });
  }

  const resetToken = randomToken(32);
  const tokenHash = await sha256(resetToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString();
  const { error: invalidateError } = await db.from('affiliate_password_resets')
    .update({ used_at: new Date().toISOString() })
    .eq('affiliate_id', account.id)
    .is('used_at', null);
  if (invalidateError) throw invalidateError;
  const { error: insertError } = await db.from('affiliate_password_resets').insert({
    affiliate_id: account.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
  if (insertError) throw insertError;

  const resetUrl = affiliateAppUrl(c, `/reset-password?token=${encodeURIComponent(resetToken)}`);
  try {
    const sent = await sendAffiliatePasswordResetEmail(c.env, account, resetUrl);
    if (sent?.skipped) throw new Error('SMTP affiliate belum dikonfigurasi.');
  } catch (sendError) {
    await db.from('affiliate_password_resets').delete().eq('token_hash', tokenHash);
    console.error('Email reset password affiliate gagal:', sendError);
    return c.json({ ok: false, message: 'Gagal memproses permintaan. Silakan coba lagi.' }, 502);
  }
  return c.json({ ok: true, message: successMessage });
});

affiliate.post('/affiliate/reset-password', async (c) => {
  const input = await c.req.json().catch(() => ({}));
  const token = String(input.token || '');
  const newPassword = String(input.newPassword || '');
  const confirmation = String(input.confirmation || '');
  if (token.length < 32 || token.length > 200) return c.json({ ok: false, message: 'Tautan reset password tidak valid.' }, 400);
  if (newPassword.length < 8) return c.json({ ok: false, message: 'Password baru minimal 8 karakter.' }, 422);
  if (new TextEncoder().encode(newPassword).byteLength > 72) return c.json({ ok: false, message: 'Password baru terlalu panjang. Gunakan maksimal 72 byte.' }, 422);
  if (newPassword !== confirmation) return c.json({ ok: false, message: 'Konfirmasi password baru belum sama.' }, 422);

  const db = database(c.env);
  const resetLimit = await consumeRateLimit(db, 'reset_password_ip', clientIp(c), 10, 900, 900);
  const resetBlocked = rateLimitResponse(c, resetLimit);
  if (resetBlocked) return resetBlocked;
  const { data: changed, error } = await db.rpc('reset_affiliate_password', {
    p_token_hash: await sha256(token),
    p_new_password: newPassword,
  });
  if (error) {
    if (error.code === 'PGRST202' || /reset_affiliate_password|schema cache/i.test(error.message || '')) {
      console.error('Fungsi reset password affiliate belum tersedia:', error);
      return c.json({ ok: false, message: 'Gagal memproses permintaan. Silakan coba lagi.' }, 503);
    }
    throw error;
  }
  if (!changed) return c.json({ ok: false, message: 'Tautan reset tidak valid, sudah digunakan, atau telah kedaluwarsa.' }, 410);
  return c.json({ ok: true, message: 'Password berhasil diperbarui. Silakan login menggunakan password baru.' });
});

affiliate.get('/affiliate/session', async (c) => {
  const current = await activeSession(c);
  if (!current) {
    const response = c.json({ ok: true, authenticated: false });
    response.headers.set('Set-Cookie', sessionCookie(c.req.raw, '', 0));
    return response;
  }
  return c.json({ ok: true, authenticated: true, affiliate: current.account });
});

affiliate.get('/affiliate/products', async (c) => {
  const current = await activeSession(c);
  if (!current) return c.json({ ok: false, message: 'Sesi login affiliate telah berakhir.' }, 401);
  const [templateResult, settingResult] = await Promise.all([
    current.db.from('templates')
      .select('id,code,name,category,description,thumbnail,template_packages(id,code,name,tagline,price,affiliate_commission_default_percent,sort_order,is_active)')
      .eq('is_active', true)
      .eq('template_packages.is_active', true)
      .order('id'),
    current.db.from('affiliate_product_settings')
      .select('package_id,is_visible')
      .eq('affiliate_id', current.account.id),
  ]);
  if (templateResult.error) throw templateResult.error;
  if (settingResult.error) throw settingResult.error;
  const settings = new Map((settingResult.data || []).map((item) => [String(item.package_id), item]));
  const templates = (templateResult.data || []).map((template) => {
    const products = (template.template_packages || [])
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map((product) => {
        const setting = settings.get(String(product.id));
        return {
          ...product,
          price: Number(product.price || 0),
          commission_percent: Number(product.affiliate_commission_default_percent || 0),
          commission_amount: Math.round(Number(product.price || 0) * Number(product.affiliate_commission_default_percent || 0) / 100),
          is_visible: setting?.is_visible === true,
        };
      });
    return {
      id: template.id,
      code: template.code,
      name: template.name,
      category: template.category,
      description: template.description,
      thumbnail: template.thumbnail,
      referral_url: publicAppUrl(c, `/template/${encodeURIComponent(template.code)}?ref=${encodeURIComponent(current.account.referral_code)}`),
      visible_products: products.filter((product) => product.is_visible).length,
      products,
    };
  });
  const visibleProductCount = templates.reduce((total, template) => total + template.visible_products, 0);
  return c.json({
    ok: true,
    referral_code: current.account.referral_code,
    storefront_url: publicAppUrl(c, `/ref/${encodeURIComponent(current.account.referral_code)}`),
    onboarding_required: visibleProductCount === 0,
    templates,
  });
});

affiliate.patch('/affiliate/products/:packageId', async (c) => {
  const current = await activeSession(c);
  if (!current) return c.json({ ok: false, message: 'Sesi login affiliate telah berakhir.' }, 401);
  const packageId = Number(c.req.param('packageId'));
  const input = await c.req.json().catch(() => ({}));
  if (!Number.isSafeInteger(packageId) || packageId <= 0) return c.json({ ok: false, message: 'Produk tidak valid.' }, 400);
  const { data: product, error: productError } = await current.db.from('template_packages')
    .select('id,template_id,is_active')
    .eq('id', packageId)
    .maybeSingle();
  if (productError) throw productError;
  if (!product) return c.json({ ok: false, message: 'Produk tidak ditemukan.' }, 404);
  const { data: parentTemplate, error: parentTemplateError } = await current.db.from('templates').select('is_active').eq('id', product.template_id).maybeSingle();
  if (parentTemplateError) throw parentTemplateError;
  if (product.is_active !== true || parentTemplate?.is_active !== true) {
    return c.json({ ok: false, message: 'Template atau paket ini sedang maintenance dan belum dapat diafiliasikan.' }, 409);
  }

  const isVisible = input.isVisible === true;
  const now = new Date().toISOString();
  const { data: setting, error } = await current.db.from('affiliate_product_settings').upsert({
    affiliate_id: current.account.id,
    package_id: packageId,
    is_visible: isVisible,
    updated_at: now,
  }, { onConflict: 'affiliate_id,package_id' }).select('package_id,is_visible').single();
  if (error) throw error;
  const { count: visibleCount, error: countError } = await current.db.from('affiliate_product_settings')
    .select('package_id', { count: 'exact', head: true })
    .eq('affiliate_id', current.account.id)
    .eq('is_visible', true);
  if (countError) throw countError;
  return c.json({ ok: true, onboarding_required: Number(visibleCount || 0) === 0, setting: {
    package_id: setting.package_id,
    is_visible: setting.is_visible,
  } });
});

affiliate.get('/affiliate/orders', async (c) => {
  const current = await activeSession(c);
  if (!current) return c.json({ ok: false, message: 'Sesi login affiliate telah berakhir.' }, 401);

  const fetchAll = c.req.query('all') === '1';
  const page = fetchAll ? 1 : Math.max(1, Number.parseInt(c.req.query('page') || '1', 10) || 1);
  const limit = fetchAll ? 1000 : 10;
  const search = cleanText(c.req.query('search'), 100).replace(/[,()%]/g, ' ').replace(/\s+/g, ' ').trim();
  const packageId = /^\d+$/.test(String(c.req.query('product') || ''))
    ? Number.parseInt(c.req.query('product'), 10)
    : null;
  const allowedPaymentStatuses = new Set(['paid', 'pending', 'failed', 'expired', 'cancelled']);
  const paymentStatus = allowedPaymentStatuses.has(c.req.query('status')) ? c.req.query('status') : '';
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const fromDate = datePattern.test(c.req.query('from') || '') ? c.req.query('from') : '';
  const toDate = datePattern.test(c.req.query('to') || '') ? c.req.query('to') : '';
  if (fromDate && toDate && fromDate > toDate) {
    return c.json({ ok: false, message: 'Tanggal awal tidak boleh melewati tanggal akhir.' }, 422);
  }
  const start = (page - 1) * limit;
  let orderQuery = current.db.from('orders')
    .select('id,order_code,template_id,package_id,customer_name,status,payment_status,affiliate_commission_percent,affiliate_commission_amount,editor_token,created_at', { count: 'exact' })
    .eq('affiliate_id', current.account.id);
  if (!fetchAll && search) orderQuery = orderQuery.or(`order_code.ilike.%${search}%,customer_name.ilike.%${search}%`);
  if (!fetchAll && packageId) orderQuery = orderQuery.eq('package_id', packageId);
  if (!fetchAll && paymentStatus) orderQuery = orderQuery.eq('payment_status', paymentStatus);
  if (!fetchAll && fromDate) orderQuery = orderQuery.gte('created_at', `${fromDate}T00:00:00+07:00`);
  if (!fetchAll && toDate) orderQuery = orderQuery.lte('created_at', `${toDate}T23:59:59.999+07:00`);

  const [orderResult, summaryResult] = await Promise.all([
    orderQuery
      .order('created_at', { ascending: false })
      .range(start, start + limit - 1),
    current.db.from('orders')
      .select('template_id,package_id,payment_status,affiliate_commission_amount')
      .eq('affiliate_id', current.account.id),
  ]);
  if (orderResult.error) throw orderResult.error;
  if (summaryResult.error) throw summaryResult.error;

  const rawOrders = orderResult.data || [];
  const allOrders = summaryResult.data || [];
  const metadataOrders = [...rawOrders, ...allOrders];
  const templateIds = [...new Set(metadataOrders.map((order) => order.template_id).filter(Boolean))];
  const packageIds = [...new Set(metadataOrders.map((order) => order.package_id).filter(Boolean))];
  const [templateResult, packageResult] = await Promise.all([
    templateIds.length
      ? current.db.from('templates').select('id,code,name').in('id', templateIds)
      : Promise.resolve({ data: [], error: null }),
    packageIds.length
      ? current.db.from('template_packages').select('id,code,name').in('id', packageIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (templateResult.error) throw templateResult.error;
  if (packageResult.error) throw packageResult.error;
  const templates = new Map((templateResult.data || []).map((template) => [String(template.id), template]));
  const packages = new Map((packageResult.data || []).map((product) => [String(product.id), product]));
  const orders = rawOrders.map(({ editor_token: editorToken, ...order }) => ({
    ...order,
    affiliate_commission_percent: Number(order.affiliate_commission_percent || 0),
    affiliate_commission_amount: Number(order.affiliate_commission_amount || 0),
    template: templates.get(String(order.template_id)) || null,
    product: packages.get(String(order.package_id)) || null,
    editor_url: order.payment_status === 'paid' && editorToken
      ? publicAppUrl(c, `/edit/${encodeURIComponent(editorToken)}`)
      : null,
  }));

  const productOptions = [...new Map(allOrders.filter((order) => order.package_id).map((order) => {
    const template = templates.get(String(order.template_id));
    const product = packages.get(String(order.package_id));
    return [String(order.package_id), {
      id: order.package_id,
      template_name: template?.name || 'Template',
      product_name: product?.name || 'Paket',
    }];
  })).values()].sort((left, right) => `${left.template_name} ${left.product_name}`.localeCompare(`${right.template_name} ${right.product_name}`, 'id'));
  const paidOrders = allOrders.filter((order) => order.payment_status === 'paid');
  const pendingOrders = allOrders.filter((order) => order.payment_status !== 'paid');
  return c.json({
    ok: true,
    summary: {
      total_orders: allOrders.length,
      paid_orders: paidOrders.length,
      pending_orders: pendingOrders.length,
      commission_earned: paidOrders.reduce((total, order) => total + Number(order.affiliate_commission_amount || 0), 0),
      commission_pending: pendingOrders.reduce((total, order) => total + Number(order.affiliate_commission_amount || 0), 0),
    },
    pagination: {
      page,
      limit,
      total: Number(orderResult.count || 0),
      total_pages: Math.max(1, Math.ceil(Number(orderResult.count || 0) / limit)),
    },
    filters: { products: productOptions },
    orders,
  });
});

affiliate.get('/affiliate/finance', async (c) => {
  const current = await activeSession(c);
  if (!current) return c.json({ ok: false, message: 'Sesi login affiliate telah berakhir.' }, 401);

  const [orderResult, withdrawalResult, settingsResult] = await Promise.all([
    current.db.from('orders')
      .select('id,order_code,template_id,package_id,payment_status,affiliate_commission_percent,affiliate_commission_amount,created_at')
      .eq('affiliate_id', current.account.id)
      .gt('affiliate_commission_amount', 0)
      .order('created_at', { ascending: false })
      .limit(1000),
    current.db.from('affiliate_withdrawals')
      .select('id,amount,fee_percent,fee_amount,net_amount,payout_method,provider,account_name,account_number,sender_bank_name,sender_account_name,sender_account_number,status,admin_note,requested_at,processed_at')
      .eq('affiliate_id', current.account.id)
      .order('requested_at', { ascending: false })
      .limit(100),
    current.db.from('affiliate_withdrawal_settings')
      .select('min_withdrawal_amount,fee_percent,sender_bank_name,sender_account_name,sender_account_number')
      .eq('singleton', true)
      .maybeSingle(),
  ]);
  if (orderResult.error) throw orderResult.error;
  if (withdrawalResult.error) throw withdrawalResult.error;
  if (settingsResult.error) throw settingsResult.error;

  const rawEarnings = orderResult.data || [];
  const templateIds = [...new Set(rawEarnings.map((order) => order.template_id).filter(Boolean))];
  const packageIds = [...new Set(rawEarnings.map((order) => order.package_id).filter(Boolean))];
  const [templateResult, packageResult] = await Promise.all([
    templateIds.length
      ? current.db.from('templates').select('id,name').in('id', templateIds)
      : Promise.resolve({ data: [], error: null }),
    packageIds.length
      ? current.db.from('template_packages').select('id,name').in('id', packageIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (templateResult.error) throw templateResult.error;
  if (packageResult.error) throw packageResult.error;
  const templates = new Map((templateResult.data || []).map((template) => [String(template.id), template.name]));
  const packages = new Map((packageResult.data || []).map((product) => [String(product.id), product.name]));

  const earnings = rawEarnings.map((order) => ({
    ...order,
    affiliate_commission_percent: Number(order.affiliate_commission_percent || 0),
    affiliate_commission_amount: Number(order.affiliate_commission_amount || 0),
    template_name: templates.get(String(order.template_id)) || 'Template',
    product_name: packages.get(String(order.package_id)) || 'Paket',
  }));
  const withdrawals = (withdrawalResult.data || []).map((withdrawal) => ({
    ...withdrawal,
    amount: Number(withdrawal.amount || 0),
    fee_percent: Number(withdrawal.fee_percent || 0),
    fee_amount: Number(withdrawal.fee_amount || 0),
    net_amount: Number(withdrawal.net_amount || withdrawal.amount || 0),
    account_number: maskedAccountNumber(withdrawal.account_number),
  }));
  const earned = earnings.filter((item) => item.payment_status === 'paid')
    .reduce((total, item) => total + item.affiliate_commission_amount, 0);
  const pendingEarnings = earnings.filter((item) => item.payment_status !== 'paid')
    .reduce((total, item) => total + item.affiliate_commission_amount, 0);
  const withdrawn = withdrawals.filter((item) => item.status === 'paid')
    .reduce((total, item) => total + item.amount, 0);
  const reserved = withdrawals.filter((item) => ['pending', 'processing'].includes(item.status))
    .reduce((total, item) => total + item.amount, 0);

  const minWithdrawal = Number(settingsResult.data?.min_withdrawal_amount || 50000);

  return c.json({
    ok: true,
    minimum_withdrawal: minWithdrawal,
    withdrawal_settings: {
      min_withdrawal_amount: minWithdrawal,
      fee_percent: Number(settingsResult.data?.fee_percent || 0),
      sender_bank_name: settingsResult.data?.sender_bank_name || null,
      sender_account_name: settingsResult.data?.sender_account_name || null,
      sender_account_number: settingsResult.data?.sender_account_number || null,
    },
    summary: {
      earned,
      pending_earnings: pendingEarnings,
      withdrawn,
      reserved,
      available: Math.max(0, earned - withdrawn - reserved),
    },
    earnings,
    withdrawals,
  });
});

affiliate.get('/affiliate/notifications', async (c) => {
  const current = await activeSession(c);
  if (!current) return c.json({ ok: false, message: 'Sesi login affiliate telah berakhir.' }, 401);

  const [orderRes, withdrawalRes, proRes] = await Promise.all([
    current.db.from('orders')
      .select('id,order_code,customer_name,payment_status,affiliate_commission_amount,created_at')
      .eq('affiliate_id', current.account.id)
      .order('created_at', { ascending: false })
      .limit(20),
    current.db.from('affiliate_withdrawals')
      .select('id,amount,net_amount,provider,account_number,status,admin_note,requested_at,processed_at')
      .eq('affiliate_id', current.account.id)
      .order('requested_at', { ascending: false })
      .limit(15),
    current.db.from('affiliate_pro_upgrade_requests')
      .select('id,method,status,social_platform,review_note,reviewed_at,created_at')
      .eq('affiliate_id', current.account.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const orders = (orderRes.data || []).map((o) => ({
    id: `order-${o.id}`,
    type: 'order',
    title: `Order ${o.order_code}`,
    snippet: `${o.customer_name || 'Customer'} · Komisi Rp ${Number(o.affiliate_commission_amount || 0).toLocaleString('id-ID')}`,
    status: o.payment_status,
    status_label: o.payment_status === 'paid' ? 'Lunas' : 'Menunggu',
    created_at: o.created_at,
    view: '/orders',
  }));

  const withdrawals = (withdrawalRes.data || []).map((w) => ({
    id: `withdrawal-${w.id}`,
    type: 'withdrawal',
    title: `Penarikan Rp ${Number(w.amount || 0).toLocaleString('id-ID')}`,
    snippet: `${w.provider || 'Rekening'} (${w.account_number ? String(w.account_number).slice(-4).padStart(String(w.account_number).length, '•') : '—'})${w.admin_note ? ` · ${w.admin_note}` : ''}`,
    status: w.status,
    status_label: w.status === 'paid' ? 'Selesai' : w.status === 'processing' ? 'Diproses' : w.status === 'rejected' ? 'Ditolak' : 'Menunggu',
    created_at: w.requested_at,
    view: '/withdrawals',
  }));

  const proUpgrades = (proRes.data || []).map((p) => ({
    id: `pro-${p.id}`,
    type: 'pro',
    title: p.method === 'social' ? 'Verifikasi Media Sosial' : 'Upgrade Pro',
    snippet: p.review_note || (p.status === 'approved' ? 'Pengajuan akun Pro disetujui!' : p.status === 'rejected' ? 'Pengajuan perlu perbaikan' : 'Sedang ditinjau admin'),
    status: p.status,
    status_label: p.status === 'approved' ? 'Disetujui' : p.status === 'rejected' ? 'Perlu Perbaikan' : 'Menunggu',
    created_at: p.reviewed_at || p.created_at,
    view: '/withdrawals',
  }));

  const all = [...orders, ...withdrawals, ...proUpgrades].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  return c.json({
    ok: true,
    notifications: {
      all,
      orders,
      withdrawals,
      pro: proUpgrades,
    },
    counts: {
      total: all.length,
      orders: orders.length,
      withdrawals: withdrawals.length,
      pro: proUpgrades.length,
    },
    refreshed_at: new Date().toISOString(),
  });
});

affiliate.get('/affiliate/pro-upgrades', async (c) => {
  const current = await activeSession(c);
  if (!current) return c.json({ ok: false, message: 'Sesi login affiliate telah berakhir.' }, 401);
  const { data, error } = await current.db.from('affiliate_pro_upgrade_requests')
    .select('id,method,status,social_platform,social_handle,follower_count,proof_object_key,payment_amount,snap_redirect_url,review_note,reviewed_at,paid_at,created_at,updated_at')
    .eq('affiliate_id', current.account.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  const requests = (data || []).map(({ proof_object_key: proofObjectKey, ...req }) => ({
    ...req,
    payment_amount: Number(req.payment_amount || 0),
    follower_count: req.follower_count != null ? Number(req.follower_count) : null,
    has_proof: Boolean(proofObjectKey),
    proof_url: proofObjectKey ? `/api/affiliate/pro-upgrades/${req.id}/proof` : null,
  }));
  return c.json({ ok: true, requests });
});

affiliate.get('/affiliate/pro-upgrades/:requestId/proof', async (c) => {
  const current = await activeSession(c);
  if (!current) return c.json({ ok: false, message: 'Sesi login affiliate telah berakhir.' }, 401);
  if (!c.env.MEDIA) return c.json({ ok: false, message: 'Bukti tidak ditemukan.' }, 404);
  const { data: request, error } = await current.db.from('affiliate_pro_upgrade_requests')
    .select('proof_object_key')
    .eq('id', c.req.param('requestId'))
    .eq('affiliate_id', current.account.id)
    .eq('method', 'social')
    .maybeSingle();
  if (error) throw error;
  if (!request?.proof_object_key) return c.json({ ok: false, message: 'Bukti tidak ditemukan.' }, 404);
  const object = await c.env.MEDIA.get(request.proof_object_key);
  if (!object) return c.json({ ok: false, message: 'Bukti tidak ditemukan.' }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'private, no-store');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('content-disposition', 'inline; filename="bukti-media-sosial"');
  return new Response(object.body, { headers });
});

affiliate.post('/affiliate/pro-upgrade/social', async (c) => {
  const current = await activeSession(c);
  if (!current) return c.json({ ok: false, message: 'Sesi login affiliate telah berakhir.' }, 401);
  const limit = await consumeRateLimit(current.db, 'pro_upgrade_social', current.account.id, 5, 86400, 86400);
  const blocked = rateLimitResponse(c, limit, 'Terlalu banyak pengajuan upgrade Pro.');
  if (blocked) return blocked;
  const input = await c.req.formData().catch(() => null);
  if (!input) return c.json({ ok: false, message: 'Data pengajuan tidak valid.' }, 400);
  const platform = cleanText(input.get('platform'), 40);
  const handle = cleanText(input.get('handle'), 120);
  const followerCount = Number(String(input.get('followerCount') || '').replace(/\D/g, ''));
  const proof = input.get('proof');
  if (platform.length < 2) return c.json({ ok: false, message: 'Pilih atau tuliskan nama media sosial.' }, 422);
  if (handle.length < 2) return c.json({ ok: false, message: 'Nama akun atau username media sosial wajib diisi.' }, 422);
  if (!Number.isInteger(followerCount) || followerCount < 1000) return c.json({ ok: false, message: 'Jumlah followers minimal 1.000.' }, 422);
  if (!(proof instanceof File) || !proof.size) return c.json({ ok: false, message: 'Screenshot akun media sosial wajib diunggah.' }, 422);
  if (!identityImageExtension(proof.type) || !await validIdentityImage(proof)) return c.json({ ok: false, message: 'Screenshot harus berupa JPG, PNG, atau WEBP yang valid.' }, 422);
  if (proof.size > 4 * 1024 * 1024) return c.json({ ok: false, message: 'Ukuran screenshot maksimal 4 MB.' }, 422);
  if (!c.env.MEDIA) return c.json({ ok: false, message: 'Penyimpanan bukti belum tersedia. Silakan coba lagi.' }, 503);

  const account = await affiliateProAccount(current.db, current.account.id);
  if (account?.account_tier === 'pro') return c.json({ ok: false, message: 'Akunmu sudah berstatus Pro.' }, 409);
  const { data: selectedPlatform, error: platformError } = await current.db.from('affiliate_social_platforms')
    .select('id,name')
    .eq('name', platform)
    .eq('is_active', true)
    .maybeSingle();
  if (platformError) throw platformError;
  if (!selectedPlatform) return c.json({ ok: false, message: 'Media sosial tidak tersedia. Pilih kembali dari daftar.' }, 422);
  const { data: pending, error: pendingError } = await current.db.from('affiliate_pro_upgrade_requests')
    .select('id,method')
    .eq('affiliate_id', current.account.id)
    .eq('status', 'pending')
    .maybeSingle();
  if (pendingError) throw pendingError;
  if (pending) return c.json({ ok: false, message: pending.method === 'payment' ? 'Pembayaran upgrade Pro masih menunggu diselesaikan.' : 'Pengajuan bukti sosialmu masih menunggu review admin.' }, 409);

  const proofObjectKey = `affiliate-proofs/${current.account.id}/${randomToken(24)}.${identityImageExtension(proof.type)}`;
  await c.env.MEDIA.put(proofObjectKey, proof.stream(), {
    httpMetadata: { contentType: proof.type, cacheControl: 'private, no-store' },
    customMetadata: { uploadedAt: new Date().toISOString() },
  });
  const { data: request, error } = await current.db.from('affiliate_pro_upgrade_requests').insert({
    affiliate_id: current.account.id,
    method: 'social',
    status: 'pending',
    social_platform: selectedPlatform.name,
    social_handle: handle,
    follower_count: followerCount,
    proof_object_key: proofObjectKey,
  }).select('id,method,status,social_platform,social_handle,follower_count,created_at').single();
  if (error) {
    await c.env.MEDIA.delete(proofObjectKey);
    if (error.code === '23505') return c.json({ ok: false, message: 'Masih ada proses upgrade Pro yang belum selesai.' }, 409);
    throw error;
  }
  return c.json({
    ok: true,
    request: {
      ...request,
      has_proof: true,
      proof_url: `/api/affiliate/pro-upgrades/${request.id}/proof`,
    },
    message: 'Bukti sosial berhasil dikirim dan sedang menunggu review admin.'
  }, 201);
});

affiliate.post('/affiliate/pro-upgrade/payment', async (c) => {
  const current = await activeSession(c);
  if (!current) return c.json({ ok: false, message: 'Sesi login affiliate telah berakhir.' }, 401);
  const limit = await consumeRateLimit(current.db, 'pro_upgrade_payment', current.account.id, 10, 3600, 3600);
  const blocked = rateLimitResponse(c, limit, 'Terlalu banyak permintaan pembayaran upgrade.');
  if (blocked) return blocked;
  const account = await affiliateProAccount(current.db, current.account.id);
  if (account?.account_tier === 'pro') return c.json({ ok: false, message: 'Akunmu sudah berstatus Pro.' }, 409);

  const { data: existing, error: existingError } = await current.db.from('affiliate_pro_upgrade_requests')
    .select('id,method,gateway_order_id,payment_amount,snap_token,snap_redirect_url,transaction_id,status,created_at')
    .eq('affiliate_id', current.account.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.method === 'social') {
    return c.json({ ok: false, message: 'Pengajuan bukti sosialmu masih menunggu review admin.' }, 409);
  }
  if (existing?.snap_redirect_url) {
    const requestAge = Date.now() - new Date(existing.created_at).getTime();
    if (Number.isFinite(requestAge) && requestAge < 24 * 60 * 60 * 1000) {
      return c.json({ ok: true, status: 'pending', redirect_url: existing.snap_redirect_url, request_id: existing.id, reused: true });
    }

    // Reconcile an old transaction before creating a replacement. This avoids
    // charging again when a successful webhook was delayed or missed.
    try {
      const payload = await transactionStatus(c.env, existing.gateway_order_id);
      const status = await applyAffiliateProPayment(current.db, existing, payload);
      if (status === 'paid') {
        return c.json({ ok: true, status: 'paid', request_id: existing.id, message: 'Pembayaran berhasil. Akunmu sekarang sudah Pro.' });
      }
      if (status === 'pending') {
        return c.json({ ok: true, status, redirect_url: existing.snap_redirect_url, request_id: existing.id, reused: true });
      }
    } catch (statusError) {
      console.error('Gagal memeriksa transaksi upgrade Pro lama:', statusError);
      await current.db.from('affiliate_pro_upgrade_requests').update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id).eq('status', 'pending');
    }
  }

  const { data: request, error: insertError } = await current.db.from('affiliate_pro_upgrade_requests').insert({
    affiliate_id: current.account.id,
    method: 'payment',
    status: 'pending',
    payment_amount: PRO_UPGRADE_PRICE,
  }).select('id').single();
  if (insertError) {
    if (insertError.code === '23505') return c.json({ ok: false, message: 'Masih ada proses upgrade Pro yang belum selesai.' }, 409);
    throw insertError;
  }
  const gatewayOrderId = `PRO-${String(request.id).replace(/-/g, '')}`;
  const finishUrl = affiliateAppUrl(c, '/withdrawals?upgrade=payment');
  const notificationUrl = `${new URL(c.req.url).origin}/api/affiliate/pro-upgrade/midtrans/notification`;
  try {
    const snap = await createSnapTransaction(c.env, {
      transaction_details: { order_id: gatewayOrderId, gross_amount: PRO_UPGRADE_PRICE },
      item_details: [{ id: 'affiliate-pro', price: PRO_UPGRADE_PRICE, quantity: 1, name: 'Upgrade Affiliate Pro Daymoment' }],
      customer_details: { first_name: account.full_name, email: account.email, phone: current.account.phone },
      callbacks: { finish: finishUrl },
      page_expiry: { duration: 24, unit: 'hour' },
    }, notificationUrl);
    const { error: updateError } = await current.db.from('affiliate_pro_upgrade_requests').update({
      gateway_order_id: gatewayOrderId,
      snap_token: snap.token,
      snap_redirect_url: snap.redirectUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', request.id);
    if (updateError) throw updateError;
    return c.json({ ok: true, redirect_url: snap.redirectUrl, request_id: request.id });
  } catch (failure) {
    await current.db.from('affiliate_pro_upgrade_requests').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', request.id);
    throw failure;
  }
});

affiliate.post('/affiliate/pro-upgrade/payment-status', async (c) => {
  const current = await activeSession(c);
  if (!current) return c.json({ ok: false, message: 'Sesi login affiliate telah berakhir.' }, 401);
  const account = await affiliateProAccount(current.db, current.account.id);
  if (account?.account_tier === 'pro') return c.json({ ok: true, status: 'paid', message: 'Pembayaran berhasil. Akunmu sekarang sudah Pro.' });
  const { data: request, error } = await current.db.from('affiliate_pro_upgrade_requests')
    .select('id,gateway_order_id,payment_amount,transaction_id,status')
    .eq('affiliate_id', current.account.id)
    .eq('method', 'payment')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!request?.gateway_order_id) return c.json({ ok: false, message: 'Pembayaran upgrade Pro belum ditemukan.' }, 404);
  const payload = await transactionStatus(c.env, request.gateway_order_id);
  const status = await applyAffiliateProPayment(current.db, request, payload);
  return c.json({ ok: true, status, message: status === 'paid' ? 'Pembayaran berhasil. Akunmu sekarang sudah Pro.' : 'Pembayaran belum selesai atau masih diproses.' });
});

affiliate.post('/affiliate/pro-upgrade/midtrans/notification', async (c) => {
  const payload = await c.req.json();
  if (!(await verifyNotificationSignature(c.env, payload))) return c.json({ ok: false, message: 'Signature Midtrans tidak valid.' }, 401);
  if (String(payload.order_id || '').startsWith('payment_notif_test_') || String(payload.order_id || '').startsWith('test-')) {
    return c.json({ ok: true, message: 'Test notification received.' });
  }
  const db = database(c.env);
  const { data: request, error } = await db.from('affiliate_pro_upgrade_requests')
    .select('id,gateway_order_id,payment_amount,transaction_id,status')
    .eq('gateway_order_id', cleanText(payload.order_id, 80))
    .maybeSingle();
  if (error) throw error;
  if (!request) return c.json({ ok: false, message: 'Pembayaran upgrade Pro tidak ditemukan.' }, 404);
  const status = await applyAffiliateProPayment(db, request, payload);
  return c.json({ ok: true, status });
});

affiliate.post('/affiliate/withdrawals', async (c) => {
  const current = await activeSession(c);
  if (!current) return c.json({ ok: false, message: 'Sesi login affiliate telah berakhir.' }, 401);
  const withdrawalLimit = await consumeRateLimit(current.db, 'withdrawal_account', current.account.id, 10, 3600, 3600);
  const withdrawalBlocked = rateLimitResponse(c, withdrawalLimit, 'Terlalu banyak permintaan penarikan.');
  if (withdrawalBlocked) return withdrawalBlocked;
  const input = await c.req.json().catch(() => ({}));
  const amount = Number(input.amount);
  const payoutMethod = input.payoutMethod === 'e_wallet' ? 'e_wallet' : input.payoutMethod === 'bank' ? 'bank' : '';
  const provider = cleanText(input.provider, 50);
  const accountName = cleanText(input.accountName, 120);
  const accountNumber = cleanText(input.accountNumber, 80).replace(/\s+/g, '');
  const { data: settingsData } = await current.db.from('affiliate_withdrawal_settings')
    .select('min_withdrawal_amount')
    .eq('singleton', true)
    .maybeSingle();
  const minWithdrawal = Number(settingsData?.min_withdrawal_amount || 50000);
  if (!Number.isFinite(amount) || amount < minWithdrawal || !Number.isInteger(amount)) {
    return c.json({ ok: false, message: `Nominal penarikan minimal Rp${minWithdrawal.toLocaleString('id-ID')} dan harus berupa angka bulat.` }, 422);
  }
  if (!payoutMethod) return c.json({ ok: false, message: 'Pilih metode penarikan bank atau e-wallet.' }, 422);
  if (provider.length < 2) return c.json({ ok: false, message: 'Nama bank atau e-wallet wajib diisi.' }, 422);
  if (accountName.length < 2) return c.json({ ok: false, message: 'Nama pemilik rekening wajib diisi.' }, 422);
  if (accountNumber.length < 5) return c.json({ ok: false, message: 'Nomor rekening atau e-wallet tidak valid.' }, 422);

  const { data: withdrawalId, error } = await current.db.rpc('request_affiliate_withdrawal', {
    p_affiliate_id: current.account.id,
    p_amount: amount,
    p_payout_method: payoutMethod,
    p_provider: provider,
    p_account_name: accountName,
    p_account_number: accountNumber,
  });
  if (error) {
    if (/withdrawal_minimum/i.test(error.message || '')) {
      return c.json({ ok: false, message: `Minimal penarikan adalah Rp${minWithdrawal.toLocaleString('id-ID')}.` }, 422);
    }
    if (/insufficient_affiliate_balance/i.test(error.message || '')) {
      return c.json({ ok: false, message: 'Saldo tersedia tidak mencukupi untuk penarikan ini.' }, 422);
    }
    if (/affiliate_not_active/i.test(error.message || '')) {
      return c.json({ ok: false, message: 'Akun affiliate tidak aktif.' }, 403);
    }
    throw error;
  }
  const { data: withdrawal, error: withdrawalReadError } = await current.db.from('affiliate_withdrawals')
    .select('id,amount,fee_percent,fee_amount,net_amount,payout_method,provider,account_name,account_number,status,requested_at')
    .eq('id', withdrawalId)
    .maybeSingle();
  if (withdrawalReadError) console.error('Withdrawal email data read failed:', withdrawalReadError.message);
  const emailWithdrawal = withdrawal || {
    id: withdrawalId,
    amount,
    fee_percent: 0,
    fee_amount: 0,
    net_amount: amount,
    payout_method: payoutMethod,
    provider,
    account_name: accountName,
    account_number: accountNumber,
    status: 'pending',
    requested_at: new Date().toISOString(),
  };
  const emailTask = Promise.allSettled([
    sendAffiliateWithdrawalRequestedEmail(c.env, current.account, emailWithdrawal),
    sendAdminWithdrawalRequestedEmail(c.env, current.account, emailWithdrawal),
  ]).then((results) => {
    results.forEach((result, index) => {
      if (result.status === 'rejected') console.error(index === 0 ? 'Affiliate withdrawal confirmation email failed:' : 'Admin withdrawal notification email failed:', result.reason?.message || result.reason);
    });
  });
  if (c.executionCtx?.waitUntil) {
    c.executionCtx.waitUntil(emailTask);
  }
  return c.json({ ok: true, withdrawal_id: withdrawalId, message: 'Permintaan penarikan berhasil dikirim. Konfirmasi juga dikirim ke emailmu dan notifikasi dikirim ke admin.' }, 201);
});

affiliate.get('/affiliate/profile', async (c) => {
  const current = await activeSession(c);
  if (!current) return c.json({ ok: false, message: 'Sesi login affiliate telah berakhir.' }, 401);

  const [profileResult, historyResult] = await Promise.all([
    current.db.from('affiliate_accounts')
      .select('email,full_name,phone,referral_code,status,email_verified_at,created_at,updated_at')
      .eq('id', current.account.id)
      .maybeSingle(),
    current.db.from('affiliate_login_history')
      .select('id,success,failure_reason,ip_address,user_agent,attempted_at')
      .eq('affiliate_id', current.account.id)
      .order('attempted_at', { ascending: false })
      .limit(10),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (historyResult.error) throw historyResult.error;
  if (!profileResult.data) return c.json({ ok: false, message: 'Profil affiliate tidak ditemukan.' }, 404);

  return c.json({
    ok: true,
    profile: profileResult.data,
    login_history: (historyResult.data || []).map((entry) => ({
      id: entry.id,
      success: entry.success,
      failure_reason: entry.failure_reason,
      attempted_at: entry.attempted_at,
      device: loginDevice(entry.user_agent),
      ip_address: maskedIp(entry.ip_address),
    })),
  });
});

affiliate.patch('/affiliate/profile', async (c) => {
  const current = await activeSession(c);
  if (!current) return c.json({ ok: false, message: 'Sesi login affiliate telah berakhir.' }, 401);
  const input = await c.req.json().catch(() => ({}));
  const fullName = cleanText(input.fullName ?? input.full_name, 120);
  const phone = normalizePhone(input.phone);
  const referralCode = String(input.referralCode ?? input.referral_code ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 32);

  if (fullName.length < 2) return c.json({ ok: false, message: 'Nama lengkap minimal 2 karakter.' }, 422);
  if (!validPhone(phone)) return c.json({ ok: false, message: 'Nomor WhatsApp tidak valid.' }, 422);
  if (!/^[a-zA-Z0-9]{3,32}$/.test(referralCode)) {
    return c.json({ ok: false, message: 'Kode referral wajib 3–32 karakter berupa huruf atau angka.' }, 422);
  }

  // Cek apakah kode referral sudah dipakai oleh affiliate lain
  const { data: existingAffiliate, error: checkError } = await current.db
    .from('affiliate_accounts')
    .select('id')
    .ilike('referral_code', referralCode)
    .neq('id', current.account.id)
    .maybeSingle();
  if (checkError) throw checkError;

  if (existingAffiliate) {
    return c.json({
      ok: false,
      message: 'Kode referral sudah ada yang pakai, harap gunakan nama kode referral lain.',
    }, 409);
  }

  const { data, error } = await current.db.from('affiliate_accounts')
    .update({
      full_name: fullName,
      phone,
      referral_code: referralCode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.account.id)
    .select('email,full_name,phone,referral_code,status,email_verified_at,created_at,updated_at')
    .single();

  if (error) {
    if (error.code === '23505' || /referral_code|duplicate key/i.test(error.message || '')) {
      return c.json({
        ok: false,
        message: 'Kode referral sudah ada yang pakai, harap gunakan nama kode referral lain.',
      }, 409);
    }
    throw error;
  }

  return c.json({ ok: true, profile: data, message: 'Data profil berhasil diperbarui.' });
});

affiliate.post('/affiliate/profile/password', async (c) => {
  const current = await activeSession(c);
  if (!current) return c.json({ ok: false, message: 'Sesi login affiliate telah berakhir.' }, 401);
  if (Date.now() - new Date(current.session.created_at).getTime() > SENSITIVE_SESSION_MAX_AGE_MS) {
    return c.json({ ok: false, message: 'Demi keamanan, silakan logout dan login kembali sebelum mengganti password.' }, 403);
  }
  const passwordLimit = await consumeRateLimit(current.db, 'profile_password_account', current.account.id, 5, 3600, 3600);
  const passwordBlocked = rateLimitResponse(c, passwordLimit, 'Terlalu banyak perubahan password.');
  if (passwordBlocked) return passwordBlocked;
  const input = await c.req.json().catch(() => ({}));
  const newPassword = String(input.newPassword || '');
  const confirmation = String(input.confirmation || '');
  if (newPassword.length < 8) return c.json({ ok: false, message: 'Password baru minimal 8 karakter.' }, 422);
  if (new TextEncoder().encode(newPassword).byteLength > 72) return c.json({ ok: false, message: 'Password baru terlalu panjang. Gunakan maksimal 72 byte.' }, 422);
  if (newPassword !== confirmation) return c.json({ ok: false, message: 'Konfirmasi password baru belum sama.' }, 422);

  const { data: changed, error } = await current.db.rpc('change_affiliate_password', {
    p_affiliate_id: current.account.id,
    p_new_password: newPassword,
  });
  if (error) {
    if (error.code === 'PGRST202' || /change_affiliate_password|schema cache/i.test(error.message || '')) {
      console.error('Fungsi perubahan password affiliate belum tersedia:', error);
      return c.json({ ok: false, message: 'Gagal memproses permintaan. Silakan coba lagi.' }, 503);
    }
    throw error;
  }
  if (!changed) return c.json({ ok: false, message: 'Password tidak dapat diperbarui karena akun tidak aktif.' }, 403);

  const { error: revokeError } = await current.db.from('affiliate_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('affiliate_id', current.account.id)
    .neq('id', current.session.id)
    .is('revoked_at', null);
  if (revokeError) console.error('Gagal mencabut sesi affiliate lain:', revokeError.message);

  c.executionCtx.waitUntil(sendAffiliatePasswordChangedEmail(c.env, current.account)
    .catch((notificationError) => console.error('Email notifikasi perubahan password gagal:', notificationError)));

  return c.json({ ok: true, message: 'Password berhasil diganti. Sesi di perangkat lain telah dikeluarkan.' });
});

affiliate.post('/affiliate/logout', async (c) => {
  const rawToken = readCookie(c.req.raw, SESSION_COOKIE);
  if (rawToken) {
    const db = database(c.env);
    await db.from('affiliate_sessions').update({ revoked_at: new Date().toISOString() }).eq('token_hash', await sha256(rawToken));
  }
  const response = c.json({ ok: true, authenticated: false });
  response.headers.set('Set-Cookie', sessionCookie(c.req.raw, '', 0));
  return response;
});

export default affiliate;
