import React, { useState } from 'react';
import { Layout, Loading, ErrorState } from '../components/Layout.jsx';
import { money, post } from '../lib/api.js';
import { useRemote } from '../lib/hooks.js';

export default function PaymentPage({ code }) {
  const { data, loading, error } = useRemote(`/api/orders/${code}`, [code]);
  const [working, setWorking] = useState(false);
  if (loading) return <Layout className="payment-page"><Loading /></Layout>;
  if (error) return <Layout className="payment-page"><ErrorState error={error} /></Layout>;
  const order = data.order;
  if (['editing','published'].includes(order.status)) window.location.replace(`/edit/${order.editor_token}`);
  const demo = async () => { setWorking(true); try { const result=await post(`/api/orders/${code}/demo`,{}); window.location.href=result.redirect; } catch(failure){ window.showToast?.(failure.message,'error'); setWorking(false); } };
  return <Layout className="payment-page" title={`Pembayaran ${order.order_code} — Daymoment`}><section className="flow-page payment-flow"><a className="back-link" href="/">← Kembali ke beranda</a><div className="payment-card"><div className="payment-icon"><svg viewBox="0 0 64 64"><rect x="8" y="15" width="48" height="36" rx="8"/><path d="M8 26h48M18 40h12"/></svg></div><span className="status-badge pending"><i/> Menunggu Pembayaran</span><h1>Ordermu sudah dibuat</h1><p>Payment gateway belum tersedia. Untuk mencoba seluruh alur, lanjutkan menggunakan Mode Demo.</p><dl className="order-details"><div><dt>Kode order</dt><dd>{order.order_code}</dd></div><div><dt>Nama pemesan</dt><dd>{order.customer_name}</dd></div><div><dt>Template</dt><dd>{order.template_name}</dd></div><div><dt>Paket</dt><dd>{order.package_name}</dd></div><div><dt>Total</dt><dd>{money(order.package_price)}</dd></div><div><dt>Status pembayaran</dt><dd>{order.payment_status}</dd></div></dl><div className="demo-note"><strong>Mode demonstrasi</strong><span>Tidak ada tagihan atau transaksi yang dibuat.</span></div><button className="button button-primary button-wide" type="button" onClick={demo} disabled={working}>{working?'Membuka editor…':'Lanjutkan ke Editor — Mode Demo'}</button><small className="secure-note">🔒 Token editor pribadi dibuat otomatis dan aman.</small></div></section></Layout>;
}
