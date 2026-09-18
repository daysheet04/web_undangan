import React, { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
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

function ReferralEditor({ order, working, onSave, invoiceOptions = [] }) {
  const [invoiceCode, setInvoiceCode] = useState(order.order_code);
  const [name, setName] = useState(order.referral_name || '');
  const [amount, setAmount] = useState(String(order.referral_amount || 0));
  useEffect(() => {
    setInvoiceCode(order.order_code);
    setName(order.referral_name || '');
    setAmount(String(order.referral_amount || 0));
  }, [order.order_code]);
  const selectedInvoice = invoiceOptions.find((item) => item.order_code === invoiceCode) || order;
  const selectInvoice = (event) => {
    const nextOrder = invoiceOptions.find((item) => item.order_code === event.target.value) || order;
    setInvoiceCode(nextOrder.order_code);
    setName(nextOrder.referral_name || '');
    setAmount(String(nextOrder.referral_amount || 0));
  };
  const save = (event) => {
    event.preventDefault();
    const target = selectedInvoice && selectedInvoice.order_code ? selectedInvoice : order && order.order_code ? order : { order_code: invoiceCode || null };
    onSave(target, name, amount);
  };
  return <form className="referral-editor" onSubmit={save}>{invoiceOptions.length > 0 && <select className="referral-input referral-invoice-select" value={invoiceCode} onChange={selectInvoice} disabled={working}>{invoiceOptions.map((item) => <option value={item.order_code} key={item.order_code}>{item.order_code}</option>)}</select>}<input className="referral-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama pembawa referral" aria-label="Nama pembawa referral" disabled={working} /><div className="referral-amount-field"><span>Rp</span><input className="referral-input" type="text" inputMode="numeric" value={formatRupiahInput(amount)} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))} placeholder="Jumlah fee" aria-label="Jumlah fee referral" disabled={working} /></div><button className="referral-save" type="submit" disabled={working}>{working ? 'Menyimpan...' : 'Simpan'}</button></form>;
}

function ReferralManagementPanel({ orders, working, onSave }) {
  const [selectedCode, setSelectedCode] = useState(orders[0]?.order_code || '');
  const [localOrders, setLocalOrders] = useState(orders);
  const [editingCode, setEditingCode] = useState('');
  useEffect(() => setLocalOrders(orders), [orders]);
  const availableOrders = localOrders.filter((order) => !order.referral_name && Number(order.referral_amount || 0) <= 0);
  const selectedOrder = availableOrders.find((order) => order.order_code === selectedCode) || availableOrders[0];
  const savedOrders = localOrders.filter((order) => order.referral_name || Number(order.referral_amount || 0) > 0);
  const saveReferral = async (sourceOrder, targetOrder, name, amount) => {
    const source = sourceOrder && sourceOrder.order_code ? sourceOrder : localOrders.find((item) => item.order_code === sourceOrder) || null;
    const destination = (targetOrder && targetOrder.order_code ? targetOrder : source) || null;
    if (!source || !destination || !source.order_code || !destination.order_code) {
      window.showToast?.('Order tidak valid untuk fee pembawa.', 'error');
      return null;
    }
    if (destination.order_code !== source.order_code) await onSave(source, '', 0);
    const result = await onSave(destination, name, amount);
    setLocalOrders((current) => current.map((item) => {
      if (item.order_code === source.order_code && item.order_code !== destination.order_code) return { ...item, referral_name: '', referral_amount: 0 };
      return item.order_code === destination.order_code ? { ...item, referral_name: result.referral_name, referral_amount: result.referral_amount } : item;
    }));
    return result;
  };
  const saveNewReferral = (order, name, amount) => saveReferral(order, order, name, amount);
  const clearReferral = (order) => saveReferral(order, order, '', 0);
  const saveInlineReferral = async (order, targetOrder, name, amount) => {
    await saveReferral(order, targetOrder, name, amount);
    setEditingCode('');
  };
  const newReferralOrder = selectedOrder ? { ...selectedOrder, referral_name: '', referral_amount: 0 } : null;
  return <section className="admin-fee-management-panel admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Kelola fee</span><h2>Fee pembawa</h2></div><span className="admin-panel-note">Input baru di atas, edit langsung di daftar</span></div>{availableOrders.length ? <div className="admin-fee-form-box"><label><span>Pilih invoice baru</span><select value={selectedOrder?.order_code || ''} onChange={(event) => setSelectedCode(event.target.value)}>{availableOrders.map((order) => <option value={order.order_code} key={order.order_code}>{order.order_code} · {order.customer_name}</option>)}</select></label>{newReferralOrder && <ReferralEditor key={`new-${selectedOrder.order_code}`} order={newReferralOrder} working={working === `referral:${selectedOrder.order_code}`} onSave={saveNewReferral} />}</div> : <div className="admin-fee-no-new">Semua invoice sudah memiliki data fee.</div>}<div className="admin-fee-saved-list"><span className="eyebrow">Fee tersimpan</span>{savedOrders.length ? savedOrders.map((order) => <div className="admin-fee-saved-row" key={order.order_code}><div><strong>{order.order_code}</strong><small>{order.customer_name} · {order.referral_name} · {money(order.referral_amount)}</small></div>{editingCode === order.order_code ? <div className="admin-fee-inline-edit"><ReferralEditor key={`edit-${order.order_code}`} order={order} invoiceOptions={[order, ...availableOrders]} working={working === `referral:${order.order_code}`} onSave={(targetOrder, name, amount) => saveInlineReferral(order, targetOrder, name, amount)} /><button className="admin-fee-delete" type="button" onClick={() => setEditingCode('')}>Batal</button></div> : <div className="admin-fee-card-actions"><button className="admin-fee-edit" type="button" onClick={() => setEditingCode(order.order_code)}>Edit</button><button className="admin-fee-delete" type="button" disabled={working === `referral:${order.order_code}`} onClick={() => clearReferral(order)}>Hapus</button></div>}</div>) : <small className="admin-fee-empty">Belum ada fee tersimpan.</small>}</div></section>;
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
  const [priceDrafts, setPriceDrafts] = useState({});
  const [activePanel, setActivePanel] = useState('');
  const [activeView, setActiveView] = useState('report');
  const [mobileTabOpen, setMobileTabOpen] = useState(false);
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
  const templateCatalog = data?.templates || [];
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
    const nextValues = {};
    templateCatalog.forEach((template) => {
      for (const packageItem of template.packages || []) {
        nextValues[`${template.code}:${packageItem.code}`] = String(packageItem.price || 0);
      }
    });
    setPriceDrafts((existing) => {
      const changed = Object.entries(nextValues).some(([key, value]) => existing[key] !== value);
      return changed ? { ...existing, ...nextValues } : existing;
    });
  }, [templateCatalog]);

  useEffect(() => {
    setShowNotifications(false);
  }, [activeView]);

  useEffect(() => {
    const closeNotifications = (event) => {
      if (!event.target.closest('.admin-notification-wrap')) setShowNotifications(false);
    };
    document.addEventListener('click', closeNotifications);
    return () => document.removeEventListener('click', closeNotifications);
  }, []);

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

  const resolveFeeOrder = (candidate, fallback = null) => {
    const options = [candidate, fallback].filter(Boolean);
    for (const item of options) {
      if (typeof item === 'object' && item && item.order_code) return item;
      if (typeof item === 'string' && item.trim()) {
        const match = orders.find((order) => order.order_code === item);
        if (match) return match;
      }
    }
    return null;
  };

  const saveReferral = async (targetOrder, referralNameValue, referralAmountValue) => {
    const target = resolveFeeOrder(targetOrder);
    const normalizedName = String(referralNameValue ?? '').trim();
    const referralAmount = Math.max(0, Math.round(Number(referralAmountValue ?? target?.referral_amount ?? 0) || 0));
    if (!target?.order_code) {
      window.showToast?.('Order tidak valid untuk fee pembawa.', 'error');
      return null;
    }
    if (normalizedName === (target.referral_name || '') && referralAmount === Number(target.referral_amount || 0)) return target;
    setWorking(`referral:${target.order_code}`);
    try {
      const saved = await patch(`/api/admin/orders/${encodeURIComponent(target.order_code)}/referral`, {
        referral_name: normalizedName,
        referral_amount: referralAmount,
      });
      await reload();
      window.showToast?.(normalizedName || referralAmount > 0 ? 'Nama dan fee pembawa berhasil disimpan.' : 'Data fee berhasil dihapus.');
      return saved;
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
      throw failure;
    } finally {
      setWorking('');
    }
  };

  const savePackagePrice = async (templateCode, packageCode) => {
    const key = `${templateCode}:${packageCode}`;
    const rawPrice = Number(priceDrafts[key] ?? 0);
    if (!Number.isFinite(rawPrice) || rawPrice < 0) {
      window.showToast?.('Harga paket tidak valid.', 'error');
      return;
    }
    setWorking(`price:${key}`);
    try {
      await patch(`/api/admin/templates/${encodeURIComponent(templateCode)}/packages/${encodeURIComponent(packageCode)}/price`, { price: Math.round(rawPrice) });
      window.showToast?.('Harga paket berhasil disimpan.');
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

  const printCarrierReport = () => {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const margin = 16;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const carrierLabel = reportCarrier === 'all' ? 'Semua pembawa' : reportCarrier;
    const fileCarrier = carrierLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'semua-pembawa';
    const formatPdfMoney = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
    const drawHeader = () => {
      pdf.setFillColor(16, 43, 74);
      pdf.rect(0, 0, pageWidth, 31, 'F');
      pdf.setFillColor(45, 139, 107);
      pdf.circle(pageWidth - 24, 9, 18, 'F');
      pdf.setFillColor(213, 178, 117);
      pdf.circle(pageWidth - 9, 23, 11, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DAYMOMENT ADMIN', margin, 9);
      pdf.setFontSize(19);
      pdf.text('Laporan Fee Pembawa', margin, 20);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(carrierLabel, pageWidth - margin, 27, { align: 'right' });
      pdf.setTextColor(35, 51, 45);
    };
    const drawTableHeader = (y) => {
      pdf.setFillColor(238, 246, 240);
      pdf.roundedRect(margin, y - 6, pageWidth - margin * 2, 10, 2, 2, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Atas nama tamu', margin + 4, y + 1);
      pdf.text('Fee', pageWidth - margin - 3, y + 1, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      return y + 11;
    };
    const drawFooter = () => {
      const pageNumber = pdf.getCurrentPageInfo().pageNumber;
      pdf.setDrawColor(225, 233, 227);
      pdf.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(130, 143, 136);
      pdf.text('Daymoment · Laporan fee pembawa', margin, pageHeight - 7);
      pdf.text(`Halaman ${pageNumber}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
      pdf.setTextColor(35, 51, 45);
    };

    drawHeader();
    pdf.setFontSize(9);
    pdf.text(`Periode: ${startDate || 'Awal'} - ${endDate || 'Sekarang'}`, margin, 39);
    pdf.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, pageWidth - margin, 39, { align: 'right' });
    pdf.setFillColor(248, 250, 247);
    pdf.roundedRect(margin, 45, 82, 25, 3, 3, 'F');
    pdf.setFillColor(239, 247, 242);
    pdf.roundedRect(margin + 88, 45, pageWidth - margin * 2 - 88, 25, 3, 3, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(92, 105, 98);
    pdf.text('Total order', margin + 5, 53);
    pdf.text('Total fee diterima', margin + 93, 53);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(16, 43, 74);
    pdf.text(String(reportOrders.length), margin + 5, 61);
    pdf.text(formatPdfMoney(reportPayout), margin + 93, 61);
    pdf.setTextColor(35, 51, 45);
    let y = drawTableHeader(80);
    reportOrders.forEach((order, index) => {
      if (y > pageHeight - 20) {
        drawFooter();
        pdf.addPage();
        drawHeader();
        y = drawTableHeader(39);
      }
      if (index % 2 === 1) {
        pdf.setFillColor(250, 252, 250);
        pdf.rect(margin, y - 5, pageWidth - margin * 2, 9, 'F');
      }
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(String(order.customer_name || '-').slice(0, 72), margin + 3, y);
      pdf.setFont('helvetica', 'bold');
      pdf.text(formatPdfMoney(order.referral_amount), pageWidth - margin - 3, y, { align: 'right' });
      pdf.setDrawColor(225, 233, 227);
      pdf.line(margin, y + 4, pageWidth - margin, y + 4);
      y += 10;
    });
    drawFooter();
    pdf.save(`laporan-fee-${fileCarrier}.pdf`);
  };
  const sidebarNavigation = <nav className="admin-sidebar-nav" aria-label="Menu admin" onClick={() => { setShowNotifications(false); setMobileTabOpen(false); }} onPointerUp={(event) => { const label = event.target.closest('button')?.textContent?.trim(); if (label === 'Kelola fee') setActiveView('fee'); if (label === 'Laporan fee') setActiveView('fee-report'); }}><button className={activeView === 'report' ? 'is-active' : ''} type="button" onClick={() => setActiveView('report')}>Laporan</button><button className={activeView === 'fee' ? 'is-active' : ''} type="button" onClick={() => setActiveView('fee')}>Kelola fee</button><button className={activeView === 'fee-report' ? 'is-active' : ''} type="button" onClick={() => setActiveView('fee-report')}>Laporan fee</button><button className={activeView === 'setting' ? 'is-active' : ''} type="button" onClick={() => setActiveView('setting')}>Setting harga</button><button className={activeView === 'editor' ? 'is-active' : ''} type="button" onClick={() => setActiveView('editor')}>Editor customer</button><button className="admin-sidebar-logout" type="button" onClick={logout}>Keluar</button></nav>;
  const mobileFeeMenuButton = <button className="admin-mobile-tab-toggle fee-mobile-menu-toggle" type="button" aria-label="Buka menu admin" onClick={() => document.body.classList.add('fee-mobile-menu-open')}><span /><span /><span /></button>;

  useEffect(() => {
    document.body.classList.remove('fee-mobile-menu-open');
  }, [activeView]);

  if (activeView === 'fee') {
    return <AdminTemplate sidebar={sidebarNavigation}>
      {mobileFeeMenuButton}
      <section className="admin-shell admin-view-fee">
        <div className="admin-heading"><div><span className="eyebrow">Pusat penjualan · selamat bekerja</span><h1>Kelola fee pembawa</h1><p>Fokus input dan edit fee pembawa tanpa menampilkan filter tanggal di bagian bawah.</p></div><div className="admin-heading-actions"><div className="admin-view-tabs is-open"><button className={activeView === 'report' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('report'); setMobileTabOpen(false); }}>Laporan</button><button className={activeView === 'fee' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('fee'); setMobileTabOpen(false); }}>Kelola fee</button><button className={activeView === 'fee-report' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('fee-report'); setMobileTabOpen(false); }}>Laporan fee</button><button className={activeView === 'setting' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('setting'); setMobileTabOpen(false); }}>Setting harga</button><button className={activeView === 'editor' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('editor'); setMobileTabOpen(false); }}>Editor customer</button></div></div></div>
        <ReferralManagementPanel orders={periodOrders} working={working} onSave={saveReferral} />
      </section>
    </AdminTemplate>;
  }

  if (activeView === 'fee-report') {
    return <AdminTemplate sidebar={sidebarNavigation}>
      {mobileFeeMenuButton}
      <section className="admin-shell admin-view-fee-report">
        <div className="admin-heading"><div><span className="eyebrow">Pusat penjualan · selamat bekerja</span><h1>Laporan fee pembawa</h1><p>Rekap fee berdasarkan data yang sudah disimpan di order untuk keperluan cetak dan laporan.</p></div><div className="admin-heading-actions"><div className="admin-view-tabs is-open"><button className={activeView === 'report' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('report'); setMobileTabOpen(false); }}>Laporan</button><button className={activeView === 'fee' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('fee'); setMobileTabOpen(false); }}>Kelola fee</button><button className={activeView === 'fee-report' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('fee-report'); setMobileTabOpen(false); }}>Laporan fee</button><button className={activeView === 'setting' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('setting'); setMobileTabOpen(false); }}>Setting harga</button><button className={activeView === 'editor' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('editor'); setMobileTabOpen(false); }}>Editor customer</button></div></div></div>
        <section className="admin-report-panel admin-print-sheet"><div className="admin-panel-heading"><div><span className="eyebrow">Laporan fee</span><h2>Rekap nama pembawa</h2></div><div className="report-actions"><select value={reportCarrier} onChange={(event) => setReportCarrier(event.target.value)}><option value="all">Semua nama pembawa</option>{referralSummary.map((referral) => <option value={referral.name} key={referral.name}>{referral.name}</option>)}</select><button className="editor-access-button print-button" type="button" onClick={printCarrierReport}>Cetak / PDF</button></div></div><div className="admin-fee-report-filter"><label className="admin-date"><span>Dari tanggal</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label className="admin-date"><span>Sampai tanggal</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label></div><div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(240px, 0.8fr)', gap: '1rem', alignItems: 'start' }}><div><div className="report-summary"><div><small>Periode</small><strong>{startDate || 'Awal'} - {endDate || 'Sekarang'}</strong></div><div><small>Order</small><strong>{reportOrders.length}</strong></div><div><small>Total fee</small><strong>{money(reportPayout)}</strong></div></div><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Nama pembawa</th><th>Order</th><th>Customer</th><th>Status</th><th>Fee</th></tr></thead><tbody>{reportOrders.length ? reportOrders.map((order) => <tr key={`report-${order.id || order.order_code}`}><td>{order.referral_name || 'Tanpa nama pembawa'}</td><td>{order.order_code}</td><td>{order.customer_name}</td><td>{statusLabel(order.payment_status)}</td><td>{money(order.referral_amount)}</td></tr>) : <tr><td colSpan="5" className="admin-empty">Belum ada order pada periode ini.</td></tr>}</tbody></table></div></div><aside style={{ display: 'grid', gap: '0.75rem' }}><div className="admin-panel-heading"><div><span className="eyebrow">Semua nama pembawa</span><h2>Daftar fee</h2></div></div><div className="referral-list">{referralSummary.length ? referralSummary.map((referral) => <div className="referral-row" key={referral.name}><div><strong>{referral.name}</strong><small>{referral.orders} order</small></div><b>{money(referral.payout)}</b></div>) : <div className="admin-empty">Belum ada nama pembawa.</div>}</div></aside></div></section>
      </section>
    </AdminTemplate>;
  }

  return <AdminTemplate sidebar={sidebarNavigation}>
    <section className={`admin-shell admin-view-${activeView}`}>
      {activeView === 'fee' && <ReferralManagementPanel orders={periodOrders} working={working} onSave={saveReferral} />}
      <div className="admin-heading"><div><span className="eyebrow">Pusat penjualan · selamat bekerja</span><h1>{activeView === 'report' ? 'Dashboard laporan' : activeView === 'fee' ? 'Kelola fee pembawa' : activeView === 'fee-report' ? 'Laporan fee pembawa' : activeView === 'setting' ? 'Setting harga template' : 'Editor customer'}</h1><p>{activeView === 'report' ? 'Angka rapi, order terpantau, kepala lebih tenang.' : activeView === 'fee' ? 'Kelola fee pembawa dan pastikan data fee tersimpan dengan benar.' : activeView === 'fee-report' ? 'Laporan fee berdasarkan data yang sudah disimpan di order.' : activeView === 'setting' ? 'Atur harga paket template tanpa mengacak dashboard.' : 'Buka dan ubah isi undangan customer yang sudah lunas.'}</p></div><div className="admin-heading-actions"><button className={`admin-mobile-tab-toggle ${mobileTabOpen ? 'is-open' : ''}`} type="button" aria-label="Buka menu tab admin" onClick={() => setMobileTabOpen((open) => !open)}><span /><span /><span /></button><div className={`admin-view-tabs ${mobileTabOpen ? 'is-open' : ''}`}><button className={activeView === 'report' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('report'); setMobileTabOpen(false); }}>Laporan</button><button className={activeView === 'fee' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('fee'); setMobileTabOpen(false); }}>Kelola fee</button><button className={activeView === 'fee-report' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('fee-report'); setMobileTabOpen(false); }}>Laporan fee</button><button className={activeView === 'setting' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('setting'); setMobileTabOpen(false); }}>Setting harga</button><button className={activeView === 'editor' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('editor'); setMobileTabOpen(false); }}>Editor customer</button></div><div className="admin-notification-wrap"><button className={`admin-notification-button ${showNotifications ? 'is-open' : ''}`} type="button" onClick={() => setShowNotifications(!showNotifications)} aria-label="Riwayat order" title="Riwayat order">🔔{summary.total_pending > 0 && <b>{summary.total_pending}</b>}</button>{showNotifications && <div className="admin-notification-menu"><strong>Riwayat order terbaru</strong>{latestOrders.length ? <div className="notification-history">{latestOrders.map((order) => <button type="button" key={order.id || order.order_code} onClick={() => { setActivePanel(order.payment_status === 'pending' ? 'pending' : 'orders'); setShowNotifications(false); }}><span><b>{order.customer_name}</b><small>{order.order_code} · {order.created_at ? dateFormat.format(new Date(order.created_at)) : '-'}</small></span><em className={`admin-pill ${order.payment_status}`}>{statusLabel(order.payment_status)}</em></button>)}</div> : <small>Belum ada riwayat order.</small>}{summary.total_pending > 0 && <button className="notification-pending-link" type="button" onClick={() => { setActivePanel('pending'); setShowNotifications(false); }}>Buka semua pembayaran pending</button>}</div>}</div><button className="button button-secondary" type="button" onClick={reload}>Muat ulang</button><button className="button button-secondary" type="button" onClick={logout}>Keluar</button></div></div>
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

      <section className="admin-settings-panel admin-panel">
        <div className="admin-panel-heading"><div><span className="eyebrow">Harga template</span><h2>Setting paket</h2></div><span className="admin-panel-note">Ubah harga yang ditampilkan untuk customer</span></div>
        <div className="admin-template-pricing-grid">{templateCatalog.map((template) => <div className="admin-template-pricing-card" key={template.code}><div className="admin-template-pricing-header"><div><strong>{template.name}</strong><small>{template.category}</small></div><span className="admin-pill active">{template.package_count || template.packages?.length || 0} paket</span></div><div className="admin-template-price-list">{(template.packages || []).map((packageItem) => { const key = `${template.code}:${packageItem.code}`; const currentValue = priceDrafts[key] ?? packageItem.price ?? 0; return <div className="admin-template-price-row" key={key}><div className="admin-package-meta"><strong>{packageItem.name}</strong><small>{packageItem.tagline}</small></div><div className="admin-price-editor"><span>Rp</span><input type="text" inputMode="numeric" value={formatRupiahInput(currentValue)} onChange={(event) => setPriceDrafts((current) => ({ ...current, [key]: event.target.value.replace(/\D/g, '') }))} /></div><button className="admin-save-price" type="button" disabled={working === `price:${key}`} onClick={() => savePackagePrice(template.code, packageItem.code)}>{working === `price:${key}` ? 'Menyimpan...' : 'Simpan'}</button></div>; })}</div></div>)}</div>
      </section>

      {activeView === 'fee-report' && <section className="admin-report-panel admin-print-sheet"><div className="admin-panel-heading"><div><span className="eyebrow">Laporan fee</span><h2>Rekap nama pembawa</h2></div><div className="report-actions"><select value={reportCarrier} onChange={(event) => setReportCarrier(event.target.value)}><option value="all">Semua nama pembawa</option>{referralSummary.map((referral) => <option value={referral.name} key={referral.name}>{referral.name}</option>)}</select><button className="editor-access-button print-button" type="button" onClick={printCarrierReport}>Cetak / PDF</button></div></div><div className="admin-fee-report-filter"><label className="admin-date"><span>Dari tanggal</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label className="admin-date"><span>Sampai tanggal</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label></div><div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(240px, 0.8fr)', gap: '1rem', alignItems: 'start' }}><div><div className="report-summary"><div><small>Periode</small><strong>{startDate || 'Awal'} - {endDate || 'Sekarang'}</strong></div><div><small>Order</small><strong>{reportOrders.length}</strong></div><div><small>Total fee</small><strong>{money(reportPayout)}</strong></div></div><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Nama pembawa</th><th>Order</th><th>Customer</th><th>Status</th><th>Fee</th></tr></thead><tbody>{reportOrders.length ? reportOrders.map((order) => <tr key={`report-${order.id || order.order_code}`}><td>{order.referral_name || 'Tanpa nama pembawa'}</td><td>{order.order_code}</td><td>{order.customer_name}</td><td>{statusLabel(order.payment_status)}</td><td>{money(order.referral_amount)}</td></tr>) : <tr><td colSpan="5" className="admin-empty">Belum ada order pada periode ini.</td></tr>}</tbody></table></div></div><aside style={{ display: 'grid', gap: '0.75rem' }}><div className="admin-panel-heading"><div><span className="eyebrow">Semua nama pembawa</span><h2>Daftar fee</h2></div></div><div className="referral-list">{referralSummary.length ? referralSummary.map((referral) => <div className="referral-row" key={referral.name}><div><strong>{referral.name}</strong><small>{referral.orders} order</small></div><b>{money(referral.payout)}</b></div>) : <div className="admin-empty">Belum ada nama pembawa.</div>}</div></aside></div></section>}

      <section className="admin-editor-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Akses customer</span><h2>Panel editor</h2></div><span className="admin-panel-note">Khusus order lunas</span></div><label className="editor-search"><span>Cari customer atau order</span><input value={editorQuery} onChange={(event) => setEditorQuery(event.target.value)} placeholder="Nama, email, kode order, template..." /></label><div className="admin-editor-grid">{editorOrders.slice(0, 8).map((order) => <div className="admin-editor-card" key={order.id || order.order_code}><div><strong>{order.customer_name}</strong><small>{order.order_code} · {order.template_name || order.template_code}</small></div><a className="editor-access-button" href={order.editor_url}>Buka editor</a></div>)}</div>{!editorOrders.length && <div className="admin-empty">Tidak ada editor yang cocok dengan pencarian.</div>}</section>

      {detail && <section className="admin-detail-panel"><div className="admin-section-heading"><div><span className="eyebrow">Detail pilihan · {detail.items.length} data</span><h2>{detail.title}</h2></div><button className="admin-close" type="button" onClick={() => setActivePanel('')}>Tutup</button></div><div className="admin-detail-list">{detail.items.length ? detail.items.map((order) => <div className="admin-detail-row" key={order.id || order.order_code}><div><strong>{order.order_code}</strong><small>{order.customer_name} · {order.customer_email}</small></div><span className={`admin-pill ${order.payment_status}`}>{statusLabel(order.payment_status)}</span><b>{order.payment_status === 'paid' ? money(order.payment_amount || order.package_price) : 'Belum lunas'}</b>{order.payment_status === 'pending' && whatsappUrl(order) && <a className="whatsapp-action" href={whatsappUrl(order)} target="_blank" rel="noreferrer">Follow-up WA</a>}</div>) : <div className="admin-empty">Tidak ada data untuk bagian ini.</div>}</div></section>}

      <div className="admin-section-heading"><div><span className="eyebrow">Operasional</span><h2>Order masuk</h2></div><span className="admin-count">{filteredOrders.length} order tersedia</span></div>
      <div className="admin-toolbar"><label className="admin-search"><span>Cari order atau nama pembawa</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kode, nama, email, nama pembawa..." /></label><label className="admin-date"><span>Dari tanggal</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label className="admin-date"><span>Sampai tanggal</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label><label className="admin-filter"><span>Filter</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Semua status</option><option value="paid">Sudah lunas</option><option value="pending">Menunggu pembayaran</option><option value="website">Website nonaktif</option></select></label><button className="admin-reset" type="button" onClick={() => { setStartDate(''); setEndDate(''); setFilter('all'); setQuery(''); }}>Reset</button></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Pemesan</th><th>Produk</th><th>Pembayaran</th><th>Website</th><th>Dibawa oleh</th><th>Dibuat</th></tr></thead><tbody>{filteredOrders.length ? filteredOrders.map((order) => <tr key={order.id || order.order_code}><td><strong>{order.order_code}</strong><small>{orderStatusLabel(order.status)}</small></td><td><strong>{order.customer_name}</strong><small>{order.customer_email}</small></td><td><strong>{order.template_name || order.template_code || '-'}</strong><small>{order.package_name || order.package_code || '-'} · {money(order.package_price)}</small></td><td><span className={`admin-pill ${order.payment_status}`}>{statusLabel(order.payment_status)}</span><small>{order.payment_status === 'paid' ? money(order.payment_amount || order.package_price) : 'Belum ada pemasukan'}</small>{order.payment_status === 'pending' && whatsappUrl(order) && <a className="whatsapp-action" href={whatsappUrl(order)} target="_blank" rel="noreferrer">Follow-up WA</a>}</td><td><div className="website-cell"><span className={`admin-pill ${order.website_active === false ? 'inactive' : 'active'}`}>{order.website_active === false ? 'Nonaktif' : 'Aktif'}</span>{order.active_until && <small className={order.website_active === false ? 'expiry-ended' : ''}>{order.website_active === false ? 'Berakhir ' : 'Aktif sampai '}{dateFormat.format(new Date(order.active_until))}</small>}{order.slug && order.website_active !== false && <a href={`/${order.slug}`} target="_blank" rel="noreferrer">Lihat web</a>}</div></td><td><ReferralEditor order={order} working={working === `referral:${order.order_code}`} onSave={saveReferral} /></td><td><small>{order.created_at ? dateFormat.format(new Date(order.created_at)) : '-'}</small></td></tr>) : <tr><td colSpan="7" className="admin-empty">Belum ada order yang cocok dengan filter ini.</td></tr>}</tbody></table></div>
    </section>
  </AdminTemplate>;
}

