import React, { useCallback, useEffect, useState } from 'react';
import { Layout, Loading, ErrorState } from '../components/Layout.jsx';
import { money, post } from '../lib/api.js';
import { useRemote } from '../lib/hooks.js';
import { buildReferralNavigation, normalizeReferralCode } from '../lib/referralNavigation.js';

const SNAP_RETURN_STORAGE_PREFIX = 'daymoment:snap-return:';
const NOTICE_PAYMENT_PENDING = 'Instruksi pembayaran sudah dibuat. Setelah membayar, klik Cek Status Pembayaran.';
const NOTICE_PAYMENT_INCOMPLETE = 'Pembayaran belum diselesaikan. Kamu dapat membuka pembayaran kembali.';
const NOTICE_PAYMENT_ERROR = 'Pembayaran gagal diproses. Silakan coba kembali.';
const NOTICE_PAYMENT_VERIFYING = 'Memverifikasi pembayaran…';

function shouldUseSnapRedirect() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')) {
    return true;
  }
  return Boolean(
    window.matchMedia?.('(max-width: 900px) and (pointer: coarse)').matches
    || window.matchMedia?.('(max-width: 768px)').matches,
  );
}

function isSafeMidtransRedirectUrl(url) {
  return /^https:\/\/app(?:\.sandbox)?\.midtrans\.com\//i.test(String(url || '').trim());
}

function snapReturnStorageKey(code) {
  return `${SNAP_RETURN_STORAGE_PREFIX}${code}`;
}

function readSnapReturnFlag(code) {
  if (!code || typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(snapReturnStorageKey(code)) === '1';
  } catch {
    return false;
  }
}

function writeSnapReturnFlag(code) {
  if (!code || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(snapReturnStorageKey(code), '1');
  } catch {
    // Ignore storage restrictions in private browsing.
  }
}

function clearSnapReturnFlag(code) {
  if (!code || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(snapReturnStorageKey(code));
  } catch {
    // Ignore storage restrictions in private browsing.
  }
}

function loadSnap({ scriptUrl, clientKey }) {
  return new Promise((resolve, reject) => {
    if (window.snap) {
      resolve(window.snap);
      return;
    }
    const existing = document.querySelector(`script[src="${scriptUrl}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.snap), { once: true });
      existing.addEventListener('error', () => reject(new Error('Gagal memuat halaman pembayaran Midtrans.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.dataset.clientKey = clientKey;
    script.async = true;
    script.onload = () => resolve(window.snap);
    script.onerror = () => reject(new Error('Gagal memuat halaman pembayaran Midtrans.'));
    document.head.appendChild(script);
  });
}

export default function PaymentPage({ code }) {
  const { data, loading, error, reload } = useRemote(`/api/orders/${code}`, [code]);
  const [working, setWorking] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState('');
  const editorUrl = data?.order?.editor_url;
  const referralCode = normalizeReferralCode(
    new URLSearchParams(window.location.search).get('ref') || data?.order?.affiliate_referral_code || '',
  );
  const referralNav = buildReferralNavigation(referralCode);
  const referralHomeHref = referralNav?.homeHref || '/';

  useEffect(() => {
    if (editorUrl) window.location.replace(editorUrl);
  }, [editorUrl]);

  const hasLoadedOrder = Boolean(!loading && !error && data?.order);

  const checkStatus = useCallback(async (quiet = false, { pendingNotice = '' } = {}) => {
    setChecking(true);
    try {
      const result = await post(`/api/orders/${code}/payment-status`, {});
      if (result.redirect) {
        window.location.href = result.redirect;
        return;
      }
      setNotice(result.payment_status === 'pending'
        ? (pendingNotice || 'Pembayaran belum diterima. Selesaikan pembayaran, lalu cek kembali.')
        : `Status pembayaran: ${result.payment_status}.`);
      reload();
    } catch (failure) {
      if (!quiet) window.showToast?.(failure.message, 'error');
    } finally {
      setChecking(false);
    }
  }, [code, reload]);

  useEffect(() => {
    if (!hasLoadedOrder || editorUrl) return;
    const url = new URL(window.location.href);
    const hasSnapParams = url.searchParams.has('order_id')
      || url.searchParams.has('status_code')
      || url.searchParams.has('transaction_status');
    const hasReturnFlag = readSnapReturnFlag(code);
    if (!hasSnapParams && !hasReturnFlag) return;

    const txStatus = String(url.searchParams.get('transaction_status') || '').toLowerCase();
    if (hasSnapParams) {
      url.searchParams.delete('order_id');
      url.searchParams.delete('status_code');
      url.searchParams.delete('transaction_status');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }
    clearSnapReturnFlag(code);
    setWorking(false);

    let initialNotice = NOTICE_PAYMENT_INCOMPLETE;
    let pendingNotice = NOTICE_PAYMENT_INCOMPLETE;
    if (txStatus === 'settlement' || txStatus === 'capture') {
      initialNotice = NOTICE_PAYMENT_VERIFYING;
      pendingNotice = '';
    } else if (txStatus === 'pending') {
      initialNotice = NOTICE_PAYMENT_PENDING;
      pendingNotice = NOTICE_PAYMENT_PENDING;
    }
    setNotice(initialNotice);
    checkStatus(true, { pendingNotice });
  }, [code, hasLoadedOrder, editorUrl, checkStatus]);

  useEffect(() => {
    const handlePageShow = (event) => {
      setWorking(false);
      if (event.persisted && readSnapReturnFlag(code)) {
        clearSnapReturnFlag(code);
        setNotice(NOTICE_PAYMENT_INCOMPLETE);
        checkStatus(true, { pendingNotice: NOTICE_PAYMENT_INCOMPLETE });
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [code, checkStatus]);

  if (loading) return <Layout className="payment-page" navigation={referralNav}><Loading fullscreen /></Layout>;
  if (error) return <Layout className="payment-page" navigation={referralNav}><ErrorState error={error} homeHref={referralHomeHref} /></Layout>;
  const order = data.order;

  const pay = async () => {
    setWorking(true);
    setNotice('');
    let redirecting = false;
    try {
      const result = await post(`/api/orders/${code}/payment-token`, {});
      if (result.redirect) {
        redirecting = true;
        window.location.href = result.redirect;
        return;
      }
      if (shouldUseSnapRedirect() && isSafeMidtransRedirectUrl(result.redirectUrl)) {
        redirecting = true;
        writeSnapReturnFlag(code);
        window.location.assign(result.redirectUrl);
        return;
      }
      const snap = await loadSnap(result);
      snap.pay(result.token, {
        onSuccess: () => checkStatus(),
        onPending: () => {
          setNotice(NOTICE_PAYMENT_PENDING);
          checkStatus(true, { pendingNotice: NOTICE_PAYMENT_PENDING });
        },
        onError: () => setNotice(NOTICE_PAYMENT_ERROR),
        onClose: () => setNotice(NOTICE_PAYMENT_INCOMPLETE),
      });
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
    } finally {
      if (!redirecting) setWorking(false);
    }
  };

  return <Layout className="payment-page" title={`Pembayaran ${order.order_code} — Daymoment`} navigation={referralNav}>
    <section className="flow-page payment-flow">
      <a className="back-link" href={referralHomeHref}>← Kembali ke beranda</a>
      <div className="payment-card">
        <div className="payment-icon"><svg viewBox="0 0 64 64"><rect x="8" y="15" width="48" height="36" rx="8"/><path d="M8 26h48M18 40h12"/></svg></div>
        <span className={`status-badge ${order.payment_status}`}><i/> {order.payment_status === 'paid' ? 'Pembayaran Berhasil' : 'Menunggu Pembayaran'}</span>
        <h1>Selesaikan pembayaran</h1>
        <p>Editor undangan akan terbuka otomatis setelah pembayaran berhasil diverifikasi oleh Midtrans.</p>
        <dl className="order-details">
          <div><dt>Kode order</dt><dd>{order.order_code}</dd></div>
          <div><dt>Nama pemesan</dt><dd>{order.customer_name}</dd></div>
          <div><dt>Template</dt><dd>{order.template_name}</dd></div>
          <div><dt>Paket</dt><dd>{order.package_name}</dd></div>
          <div><dt>Total</dt><dd>{money(order.package_price)}</dd></div>
          <div><dt>Status pembayaran</dt><dd>{order.payment_status}</dd></div>
        </dl>
        {notice && <div className="payment-notice">{notice}</div>}
        <div className="payment-actions">
          <button className="button button-primary button-wide" type="button" onClick={pay} disabled={working || checking}>{working ? 'Membuka Midtrans…' : 'Bayar Sekarang'}</button>
          <button className="button button-secondary button-wide" type="button" onClick={() => checkStatus()} disabled={working || checking}>{checking ? 'Memeriksa…' : 'Cek Status Pembayaran'}</button>
        </div>
        <small className="secure-note">🔒 Pembayaran diproses melalui Midtrans. Editor tidak dapat diakses sebelum lunas.</small>
      </div>
    </section>
  </Layout>;
}
