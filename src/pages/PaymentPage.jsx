import React, { useEffect, useState } from 'react';
import { Layout, Loading, ErrorState } from '../components/Layout.jsx';
import { money, post } from '../lib/api.js';
import { useRemote } from '../lib/hooks.js';

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

  useEffect(() => {
    if (editorUrl) window.location.replace(editorUrl);
  }, [editorUrl]);

  if (loading) return <Layout className="payment-page"><Loading /></Layout>;
  if (error) return <Layout className="payment-page"><ErrorState error={error} /></Layout>;
  const order = data.order;

  const checkStatus = async (quiet = false) => {
    setChecking(true);
    try {
      const result = await post(`/api/orders/${code}/payment-status`, {});
      if (result.redirect) {
        window.location.href = result.redirect;
        return;
      }
      setNotice(result.payment_status === 'pending'
        ? 'Pembayaran belum diterima. Selesaikan pembayaran, lalu cek kembali.'
        : `Status pembayaran: ${result.payment_status}.`);
      reload();
    } catch (failure) {
      if (!quiet) window.showToast?.(failure.message, 'error');
    } finally {
      setChecking(false);
    }
  };

  const pay = async () => {
    setWorking(true);
    setNotice('');
    try {
      const result = await post(`/api/orders/${code}/payment-token`, {});
      if (result.redirect) {
        window.location.href = result.redirect;
        return;
      }
      const snap = await loadSnap(result);
      snap.pay(result.token, {
        onSuccess: () => checkStatus(),
        onPending: () => {
          setNotice('Instruksi pembayaran sudah dibuat. Setelah membayar, klik Cek Status Pembayaran.');
          checkStatus(true);
        },
        onError: () => setNotice('Pembayaran gagal diproses. Silakan coba kembali.'),
        onClose: () => setNotice('Pembayaran belum diselesaikan. Kamu dapat membuka pembayaran kembali.'),
      });
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
    } finally {
      setWorking(false);
    }
  };

  return <Layout className="payment-page" title={`Pembayaran ${order.order_code} — Daymoment`}>
    <section className="flow-page payment-flow">
      <a className="back-link" href="/">← Kembali ke beranda</a>
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
