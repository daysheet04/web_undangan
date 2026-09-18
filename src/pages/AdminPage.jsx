import React, { useEffect, useMemo, useState } from 'react';
import { Loading, ErrorState } from '../components/Layout.jsx';
import { money, patch, post } from '../lib/api.js';
import { useRemote } from '../lib/hooks.js';
import AdminLogin from '../components/AdminLogin.jsx';
import AdminTemplate from '../templates/AdminTemplate.jsx';

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
const dayFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });

function statusLabel(status) {
  return { paid: 'Lunas', pending: 'Menunggu', failed: 'Gagal', expired: 'Kedaluwarsa', refunded: 'Dikembalikan' }[status] || status || '-';
}

function orderStatusLabel(status) {
  return { published: 'Terbit', editing: 'Editing', waiting_payment: 'Belum bayar', cancelled: 'Dibatalkan' }[status] || status || '-';
}

function orderDateValue(order) {
  return String(order.created_at || '').slice(0, 10);
}

function formatRupiahInput(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('id-ID') : '';
}

function ReferralEditor({ order, working, onSave }) {
  const [name, setName] = useState(order.referral_name || '');
  const [amount, setAmount] = useState(String(order.referral_amount || 0));
  const save = () => onSave(order, name, amount);
  return <div className="referral-editor"><input className="referral-input" value={name} onChange={(event) => setName(event.target.value)} onBlur={save} placeholder="Nama pembawa" disabled={working} /><div className="referral-amount-field"><span>Rp</span><input className="referral-input" type="text" inputMode="numeric" value={formatRupiahInput(amount)} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))} onBlur={save} placeholder="0" disabled={working} /></div><small>{working ? 'Menyimpan...' : 'Fee tampil dalam rupiah'}</small></div>;
}

function whatsappUrl(order) {
  const rawPhone = String(order.customer_phone || '').replace(/\D/g, '');
  const phone = rawPhone.startsWith('0') ? `62${rawPhone.slice(1)}` : rawPhone;
  if (!phone) return null;
  const message = `Halo ${order.customer_name}, kami mengingatkan pembayaran order ${order.order_code} sebesar ${money(order.package_price)} masih menunggu. Silakan lanjutkan pembayaran agar website undangan bisa segera digunakan. Terima kasih.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function AdminPage() {
  const { data, loading, error, reload } = useRemote('/api/admin/summary');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [working, setWorking] = useState('');
  const [activePanel, setActivePanel] = useState('');
  const [activeView, setActiveView] = useState('report');
  const [showNotifications, setShowNotifications] = useState(false);
  const [reportCarrier, setReportCarrier] = useState('all');
  const [editorQuery, setEditorQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const orders = data?.orders || [];
  const periodOrders = useMemo(() => orders.filter((order) => {
    const date = orderDateValue(order);
    return (!startDate || date >= startDate) && (!endDate || date <= endDate);
  }), [orders, startDate, endDate]);
  const summary = useMemo(() => {
    const paidOrders = periodOrders.filter((order) => order.payment_status === 'paid');
    return {
      total_orders: periodOrders.length,
      total_paid: paidOrders.length,
      total_pending: periodOrders.filter((order) => order.payment_status === 'pending').length,
      total_published: periodOrders.filter((order) => order.status === 'published').length,
      total_inactive: periodOrders.filter((order) => order.website_active === false).length,
      total_revenue: paidOrders.reduce((total, order) => total + Number(order.payment_amount || order.package_price || 0), 0),
      total_referral_payout: periodOrders.reduce((total, order) => total + Number(order.referral_amount || 0), 0),
    };
  }, [periodOrders]);
  const filteredOrders = useMemo(() => periodOrders.filter((order) => {
    const matchesFilter = filter === 'all' || (filter === 'website' ? order.website_active === false : order.payment_status === filter);
    const haystack = `${order.order_code} ${order.customer_name} ${order.customer_email} ${order.template_name} ${order.package_name} ${order.referral_name}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase());
  }), [periodOrders, filter, query]);
  const revenueEntries = useMemo(() => {
    const entries = periodOrders.filter((order) => order.payment_status === 'paid').reduce((items, order) => {
      const date = String(order.paid_at || order.created_at || '').slice(0, 10);
      if (date) items[date] = (items[date] || 0) + Number(order.payment_amount || order.package_price || 0);
      return items;
    }, {});
    return Object.entries(entries).sort(([first], [second]) => first.localeCompare(second)).slice(-14);
  }, [periodOrders]);
  const maxRevenue = Math.max(...revenueEntries.map(([, value]) => Number(value)), 1);
  const activeWebsites = periodOrders.filter((order) => order.website_active !== false).length;
  const activeRate = periodOrders.length ? Math.round((activeWebsites / periodOrders.length) * 100) : 0;
  const referralSummary = useMemo(() => Object.values(periodOrders.reduce((items, order) => {
    const name = String(order.referral_name || '').trim() || 'Tanpa nama pembawa';
    if (!items[name]) items[name] = { name, orders: 0, revenue: 0, payout: 0 };
    items[name].orders += 1;
    items[name].payout += Number(order.referral_amount || 0);
    if (order.payment_status === 'paid') items[name].revenue += Number(order.payment_amount || order.package_price || 0);
    return items;
  }, {})).sort((first, second) => second.payout - first.payout || second.orders - first.orders), [periodOrders]);
  const topCarrier = referralSummary[0];
  const latestOrders = orders.slice(0, 4);
  const reportOrders = periodOrders.filter((order) => reportCarrier === 'all'
    || (String(order.referral_name || '').trim() || 'Tanpa nama pembawa') === reportCarrier);
  const reportPayout = reportOrders.reduce((total, order) => total + Number(order.referral_amount || 0), 0);
  const editorOrders = useMemo(() => periodOrders.filter((order) => {
    if (order.payment_status !== 'paid' || !order.editor_url) return false;
    const haystack = `${order.customer_name} ${order.customer_email} ${order.order_code} ${order.template_name} ${order.template_code}`.toLowerCase();
    return haystack.includes(editorQuery.toLowerCase());
  }), [periodOrders, editorQuery]);

  useEffect(() => {
    if (!activePanel) return;
    window.requestAnimationFrame(() => document.querySelector('.admin-detail-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [activePanel]);

  useEffect(() => {
    setShowNotifications(false);
  }, [activeView]);

  if (loading) return <AdminTemplate><Loading /></AdminTemplate>;
  if (error?.status === 401) return <AdminTemplate><AdminLogin onSuccess={reload} /></AdminTemplate>;
  if (error) return <AdminTemplate><ErrorState error={error} /></AdminTemplate>;
  const detailFilters = {
    orders: { title: 'Semua order masuk', items: periodOrders },
    paid: { title: 'Order sudah lunas', items: periodOrders.filter((order) => order.payment_status === 'paid') },
    published: { title: 'Website sudah terbit', items: periodOrders.filter((order) => order.status === 'published') },
    pending: { title: 'Menunggu pembayaran', items: periodOrders.filter((order) => order.payment_status === 'pending') },
  };
  const detail = detailFilters[activePanel];

  const saveReferral = async (order, value, amount) => {
    const referralName = value.trim();
    const referralAmount = amount === undefined ? Number(order.referral_amount || 0) : Math.max(0, Math.round(Number(amount) || 0));
    if (referralName === (order.referral_name || '') && referralAmount === Number(order.referral_amount || 0)) return;
    setWorking(`referral:${order.order_code}`);
    try {
      await patch(`/api/admin/orders/${encodeURIComponent(order.order_code)}/referral`, { referral_name: referralName, referral_amount: referralAmount });
      window.showToast?.('Nama dan fee pembawa berhasil disimpan.');
      reload();
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
    } finally {
      setWorking('');
    }
  };

  const logout = async () => {
    await post('/api/admin/logout', {});
    reload();
  };

  const printCarrierReport = () => window.print();

  return <AdminTemplate>
    <section className={`admin-shell admin-view-${activeView}`}>
      <div className="admin-heading"><div><span className="eyebrow">Pusat penjualan · selamat bekerja</span><h1>{activeView === 'report' ? 'Dashboard laporan' : activeView === 'fee' ? 'Rekap fee pembawa' : 'Editor customer'}</h1><p>{activeView === 'report' ? 'Angka rapi, order terpantau, kepala lebih tenang.' : activeView === 'fee' ? 'Hitung dan cetak fee berdasarkan nama pembawa.' : 'Buka dan ubah isi undangan customer yang sudah lunas.'}</p></div><div className="admin-heading-actions"><div className="admin-view-tabs"><button className={activeView === 'report' ? 'is-active' : ''} type="button" onClick={() => setActiveView('report')}>Laporan</button><button className={activeView === 'fee' ? 'is-active' : ''} type="button" onClick={() => setActiveView('fee')}>Rekap fee</button><button className={activeView === 'editor' ? 'is-active' : ''} type="button" onClick={() => setActiveView('editor')}>Editor customer</button></div><div className="admin-notification-wrap"><button className={`admin-notification-button ${showNotifications ? 'is-open' : ''}`} type="button" onClick={() => setShowNotifications(!showNotifications)} aria-label="Riwayat order" title="Riwayat order">🔔{summary.total_pending > 0 && <b>{summary.total_pending}</b>}</button>{showNotifications && <div className="admin-notification-menu"><strong>Riwayat order terbaru</strong>{latestOrders.length ? <div className="notification-history">{latestOrders.map((order) => <button type="button" key={order.id || order.order_code} onClick={() => { setActivePanel(order.payment_status === 'pending' ? 'pending' : 'orders'); setShowNotifications(false); }}><span><b>{order.customer_name}</b><small>{order.order_code} · {order.created_at ? dateFormat.format(new Date(order.created_at)) : '-'}</small></span><em className={`admin-pill ${order.payment_status}`}>{statusLabel(order.payment_status)}</em></button>)}</div> : <small>Belum ada riwayat order.</small>}{summary.total_pending > 0 && <button className="notification-pending-link" type="button" onClick={() => { setActivePanel('pending'); setShowNotifications(false); }}>Buka semua pembayaran pending</button>}</div>}</div><button className="button button-secondary" type="button" onClick={reload}>Muat ulang</button><button className="button button-secondary" type="button" onClick={logout}>Keluar</button></div></div>
      {data.mode === 'demo' && <div className="admin-demo-note">Mode demo aktif. Data akan muncul setelah ada order dari alur pemesanan.</div>}

      <div className="admin-stat-grid">
        <button className={`admin-stat ${activePanel === 'orders' ? 'selected' : ''}`} type="button" onClick={() => setActivePanel(activePanel === 'orders' ? '' : 'orders')}><span>Total order</span><strong>{summary.total_orders}</strong><small>Klik untuk melihat semua order <b>→</b></small></button>
        <button className={`admin-stat admin-stat-accent ${activePanel === 'paid' ? 'selected' : ''}`} type="button" onClick={() => setActivePanel(activePanel === 'paid' ? '' : 'paid')}><span>Omzet lunas</span><strong>{money(summary.total_revenue)}</strong><small>{summary.total_paid} order lunas <b>→</b></small></button>
        <button className={`admin-stat ${activePanel === 'published' ? 'selected' : ''}`} type="button" onClick={() => setActivePanel(activePanel === 'published' ? '' : 'published')}><span>Website terbit</span><strong>{summary.total_published}</strong><small>{summary.total_inactive || 0} website nonaktif <b>→</b></small></button>
        <button className={`admin-stat admin-stat-pending ${activePanel === 'pending' ? 'selected' : ''}`} type="button" onClick={() => setActivePanel(activePanel === 'pending' ? '' : 'pending')}><span>Menunggu bayar</span><strong>{summary.total_pending || 0}</strong><small>Klik untuk melihat detail <b>→</b></small></button>
        <div className="admin-stat admin-stat-payout"><span>Total untuk pembawa</span><strong>{money(summary.total_referral_payout)}</strong><small>Fee semua order di periode</small></div>
      </div>

      <div className="admin-pulse-grid"><section className="admin-pulse-card admin-pulse-warm"><span className="pulse-kicker">Status hari ini</span><strong>{summary.total_pending ? `${summary.total_pending} order perlu disapa` : 'Semua order aman'}</strong><small>{summary.total_pending ? 'Cek pembayaran yang masih menunggu.' : 'Tidak ada antrean follow-up.'}</small></section><section className="admin-pulse-card"><div className="pulse-heading"><span className="pulse-kicker">Website aktif</span><strong>{activeRate}%</strong></div><div className="pulse-progress"><span style={{ width: `${activeRate}%` }} /></div><small>{activeWebsites} dari {periodOrders.length} order punya website aktif</small></section><section className="admin-pulse-card admin-pulse-green"><span className="pulse-kicker">Pembawa teratas</span><strong>{topCarrier?.name || 'Belum ada nama'}</strong><small>{topCarrier ? `${topCarrier.orders} order · ${money(topCarrier.payout)} fee` : 'Isi nama pembawa di tabel order.'}</small></section></div>

      <div className="admin-insight-grid">
        <section className="admin-panel revenue-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Pemasukan</span><h2>Performa penjualan</h2></div><span className="admin-panel-note">14 hari terakhir</span></div>{revenueEntries.length ? <div className="revenue-chart" aria-label="Grafik pemasukan harian">{revenueEntries.map(([date, value]) => <div className="revenue-column" key={date}><span className="revenue-value">{money(value)}</span><div className="revenue-bar-wrap"><div className="revenue-bar" style={{ height: `${Math.max((Number(value) / maxRevenue) * 100, 5)}%` }} /></div><small>{dayFormat.format(new Date(`${date}T00:00:00`))}</small></div>)}</div> : <div className="admin-empty admin-chart-empty">Belum ada pemasukan lunas untuk ditampilkan.</div>}</section>
        <section className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Atribusi</span><h2>Nama pembawa</h2></div><span className="admin-panel-note">Berdasarkan order</span></div><div className="referral-list">{referralSummary.slice(0, 5).map((referral) => <div className="referral-row" key={referral.name}><div><strong>{referral.name}</strong><small>{referral.orders} order · omzet {money(referral.revenue)}</small></div><b>{money(referral.payout)}</b></div>)}</div>{!referralSummary.length && <div className="admin-empty">Belum ada nama pembawa.</div>}</section>
      </div>

      <section className="admin-report-panel admin-print-sheet"><div className="admin-panel-heading"><div><span className="eyebrow">Laporan fee</span><h2>Rekap nama pembawa</h2></div><div className="report-actions"><select value={reportCarrier} onChange={(event) => setReportCarrier(event.target.value)}><option value="all">Semua nama pembawa</option>{referralSummary.map((referral) => <option value={referral.name} key={referral.name}>{referral.name}</option>)}</select><button className="editor-access-button print-button" type="button" onClick={printCarrierReport}>Cetak / PDF</button></div></div><div className="report-summary"><div><small>Periode</small><strong>{startDate || 'Awal'} - {endDate || 'Sekarang'}</strong></div><div><small>Order</small><strong>{reportOrders.length}</strong></div><div><small>Total fee</small><strong>{money(reportPayout)}</strong></div></div><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Nama pembawa</th><th>Order</th><th>Customer</th><th>Status</th><th>Fee</th></tr></thead><tbody>{reportOrders.length ? reportOrders.map((order) => <tr key={`report-${order.id || order.order_code}`}><td>{order.referral_name || 'Tanpa nama pembawa'}</td><td>{order.order_code}</td><td>{order.customer_name}</td><td>{statusLabel(order.payment_status)}</td><td>{money(order.referral_amount)}</td></tr>) : <tr><td colSpan="5" className="admin-empty">Belum ada order pada periode ini.</td></tr>}</tbody></table></div></section>

      <section className="admin-editor-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Akses customer</span><h2>Panel editor</h2></div><span className="admin-panel-note">Khusus order lunas</span></div><label className="editor-search"><span>Cari customer atau order</span><input value={editorQuery} onChange={(event) => setEditorQuery(event.target.value)} placeholder="Nama, email, kode order, template..." /></label><div className="admin-editor-grid">{editorOrders.slice(0, 8).map((order) => <div className="admin-editor-card" key={order.id || order.order_code}><div><strong>{order.customer_name}</strong><small>{order.order_code} · {order.template_name || order.template_code}</small></div><a className="editor-access-button" href={order.editor_url}>Buka editor</a></div>)}</div>{!editorOrders.length && <div className="admin-empty">Tidak ada editor yang cocok dengan pencarian.</div>}</section>

      {detail && <section className="admin-detail-panel"><div className="admin-section-heading"><div><span className="eyebrow">Detail pilihan · {detail.items.length} data</span><h2>{detail.title}</h2></div><button className="admin-close" type="button" onClick={() => setActivePanel('')}>Tutup</button></div><div className="admin-detail-list">{detail.items.length ? detail.items.map((order) => <div className="admin-detail-row" key={order.id || order.order_code}><div><strong>{order.order_code}</strong><small>{order.customer_name} · {order.customer_email}</small></div><span className={`admin-pill ${order.payment_status}`}>{statusLabel(order.payment_status)}</span><b>{order.payment_status === 'paid' ? money(order.payment_amount || order.package_price) : 'Belum lunas'}</b>{order.payment_status === 'pending' && whatsappUrl(order) && <a className="whatsapp-action" href={whatsappUrl(order)} target="_blank" rel="noreferrer">Follow-up WA</a>}</div>) : <div className="admin-empty">Tidak ada data untuk bagian ini.</div>}</div></section>}

      <div className="admin-section-heading"><div><span className="eyebrow">Operasional</span><h2>Order masuk</h2></div><span className="admin-count">{filteredOrders.length} order tersedia</span></div>
      <div className="admin-toolbar"><label className="admin-search"><span>Cari order atau nama pembawa</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kode, nama, email, nama pembawa..." /></label><label className="admin-date"><span>Dari tanggal</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label className="admin-date"><span>Sampai tanggal</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label><label className="admin-filter"><span>Filter</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Semua status</option><option value="paid">Sudah lunas</option><option value="pending">Menunggu pembayaran</option><option value="website">Website nonaktif</option></select></label><button className="admin-reset" type="button" onClick={() => { setStartDate(''); setEndDate(''); setFilter('all'); setQuery(''); }}>Reset</button></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Pemesan</th><th>Produk</th><th>Pembayaran</th><th>Website</th><th>Dibawa oleh</th><th>Dibuat</th></tr></thead><tbody>{filteredOrders.length ? filteredOrders.map((order) => <tr key={order.id || order.order_code}><td><strong>{order.order_code}</strong><small>{orderStatusLabel(order.status)}</small></td><td><strong>{order.customer_name}</strong><small>{order.customer_email}</small></td><td><strong>{order.template_name || order.template_code || '-'}</strong><small>{order.package_name || order.package_code || '-'} · {money(order.package_price)}</small></td><td><span className={`admin-pill ${order.payment_status}`}>{statusLabel(order.payment_status)}</span><small>{order.payment_status === 'paid' ? money(order.payment_amount || order.package_price) : 'Belum ada pemasukan'}</small>{order.payment_status === 'pending' && whatsappUrl(order) && <a className="whatsapp-action" href={whatsappUrl(order)} target="_blank" rel="noreferrer">Follow-up WA</a>}</td><td><div className="website-cell"><span className={`admin-pill ${order.website_active === false ? 'inactive' : 'active'}`}>{order.website_active === false ? 'Nonaktif' : 'Aktif'}</span>{order.active_until && <small className={order.website_active === false ? 'expiry-ended' : ''}>{order.website_active === false ? 'Berakhir ' : 'Aktif sampai '}{dateFormat.format(new Date(order.active_until))}</small>}{order.slug && order.website_active !== false && <a href={`/${order.slug}`} target="_blank" rel="noreferrer">Lihat web</a>}</div></td><td><ReferralEditor order={order} working={working === `referral:${order.order_code}`} onSave={saveReferral} /></td><td><small>{order.created_at ? dateFormat.format(new Date(order.created_at)) : '-'}</small></td></tr>) : <tr><td colSpan="7" className="admin-empty">Belum ada order yang cocok dengan filter ini.</td></tr>}</tbody></table></div>
    </section>
  </AdminTemplate>;
}

