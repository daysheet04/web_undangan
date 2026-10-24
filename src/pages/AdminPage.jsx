import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { Loading, ErrorState } from '../components/Layout.jsx';
import { get, money, patch, post } from '../lib/api.js';
import { useRemote } from '../lib/hooks.js';
import AdminLogin from '../components/AdminLogin.jsx';
import AdminTemplate from '../templates/AdminTemplate.jsx';
import TemplateCover, { templateCoverUrl } from '../components/TemplateCover.jsx';
import AdminCoverAdjusterModal from '../components/AdminCoverAdjusterModal.jsx';
import FeedbackManagementPanel from '../components/FeedbackManagementPanel.jsx';
import { CardDetailModal, ViewItemDetailModal, EditItemModal } from '../components/AdminDashboardModals.jsx';
import AdminBottomTables from '../components/AdminBottomTables.jsx';
import AdminCustomDropdown from '../components/AdminCustomDropdown.jsx';

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
const dayFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
const dateOnlyFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' });

function toIsoDateString(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

function dateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function WebsiteAccessEditor({ order, working, onSave }) {
  const [activeUntil, setActiveUntil] = useState(dateInputValue(order.active_until));
  useEffect(() => setActiveUntil(dateInputValue(order.active_until)), [order.active_until]);
  const published = order.status === 'published' && Boolean(order.published_at);
  const expired = Boolean(order.active_until && new Date(order.active_until) <= new Date());
  const enabled = order.website_enabled ?? order.website_active;
  const effectiveActive = published && enabled && !expired;
  const status = !published ? 'Belum terbit' : effectiveActive ? 'Aktif' : expired ? 'Kedaluwarsa' : 'Nonaktif';
  const statusClass = effectiveActive ? 'active' : expired ? 'expired' : 'inactive';
  const today = dateInputValue(new Date());
  const selectedDateValid = Boolean(activeUntil && activeUntil >= today);

  return <div className="website-access-editor">
    <div className="website-access-status"><span className={`admin-pill ${statusClass}`}>{status}</span>{order.website_url && effectiveActive && <a href={order.website_url} target="_blank" rel="noreferrer">Lihat web</a>}</div>
    {order.active_until && <small>{expired ? 'Berakhir ' : 'Aktif sampai '}{dateFormat.format(new Date(order.active_until))}</small>}
    {published ? <div className="website-access-controls">
      <label><span>Perpanjang sampai</span><input type="date" min={today} value={activeUntil} disabled={working} onChange={(event) => setActiveUntil(event.target.value)}/></label>
      <div><button type="button" className="extend" disabled={working || !selectedDateValid} onClick={() => onSave(order, { active: true, active_until: activeUntil })}>{working ? 'Memproses...' : 'Perpanjang & aktifkan'}</button><button type="button" className={effectiveActive ? 'disable' : 'enable'} disabled={working || (!effectiveActive && expired)} title={!effectiveActive && expired ? 'Pilih tanggal baru lalu klik Perpanjang & aktifkan.' : ''} onClick={() => onSave(order, { active: !effectiveActive })}>{effectiveActive ? 'Nonaktifkan' : expired ? 'Isi tanggal baru' : 'Aktifkan kembali'}</button></div>
    </div> : <small className="website-access-note">Kontrol tersedia setelah undangan dipublish.</small>}
  </div>;
}

function TemplateCatalogEditor({ template, priceDrafts, setPriceDrafts, commissionDrafts, setCommissionDrafts, working, onSavePackage, onReload }) {
  const [draft, setDraft] = useState({ name: template.name || '', category: template.category || '', description: template.description || '' });
  const [cover, setCover] = useState({ thumbnail: template.thumbnail, thumbnail_url: template.thumbnail_url });
  const [templateVisible, setTemplateVisible] = useState(template.is_active !== false);
  const [packageVisibility, setPackageVisibility] = useState(() => Object.fromEntries((template.packages || []).map((item) => [item.code, item.is_active !== false])));
  const [catalogWorking, setCatalogWorking] = useState('');
  const [adjusterOpen, setAdjusterOpen] = useState(false);
  const [adjusterImage, setAdjusterImage] = useState('');

  useEffect(() => {
    setDraft({ name: template.name || '', category: template.category || '', description: template.description || '' });
  }, [template.name, template.category, template.description]);

  useEffect(() => {
    setCover({ thumbnail: template.thumbnail, thumbnail_url: template.thumbnail_url });
  }, [template.thumbnail, template.thumbnail_url]);

  useEffect(() => {
    setTemplateVisible(template.is_active !== false);
    setPackageVisibility(Object.fromEntries((template.packages || []).map((item) => [item.code, item.is_active !== false])));
  }, [template.is_active, template.packages]);

  const saveDetails = async (event) => {
    event.preventDefault();
    setCatalogWorking('details');
    try {
      await patch(`/api/admin/templates/${encodeURIComponent(template.code)}`, draft);
      window.showToast?.('Informasi template berhasil disimpan.');
      onReload();
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
    } finally {
      setCatalogWorking('');
    }
  };

  const handleSelectCoverFile = (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setAdjusterImage(objectUrl);
    setAdjusterOpen(true);
    input.value = '';
  };

  const handleOpenAdjusterForCurrent = () => {
    const currentSrc = templateCoverUrl({ ...template, ...cover });
    setAdjusterImage(currentSrc);
    setAdjusterOpen(true);
  };

  const handleSaveCroppedCover = async (file) => {
    const form = new FormData();
    form.append('file', file);
    setCatalogWorking('cover');
    try {
      const result = await post(`/api/admin/templates/${encodeURIComponent(template.code)}/cover`, form);
      setCover({
        thumbnail: result.thumbnail,
        thumbnail_url: `${result.thumbnail_url}${result.thumbnail_url.includes('?') ? '&' : '?'}v=${Date.now()}`,
      });
      window.showToast?.('Gambar sampul berhasil disesuaikan dan disimpan.');
      onReload();
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
      throw failure;
    } finally {
      setCatalogWorking('');
    }
  };

  const toggleTemplateVisibility = async () => {
    const nextVisible = !templateVisible;
    setCatalogWorking('template-visibility');
    try {
      const result = await patch(`/api/admin/templates/${encodeURIComponent(template.code)}/visibility`, { is_active: nextVisible });
      setTemplateVisible(result.is_active === true);
      window.showToast?.(result.message);
      onReload();
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
    } finally {
      setCatalogWorking('');
    }
  };

  const togglePackageVisibility = async (packageItem) => {
    const nextVisible = !(packageVisibility[packageItem.code] !== false);
    setCatalogWorking(`package-visibility:${packageItem.code}`);
    try {
      const result = await patch(`/api/admin/templates/${encodeURIComponent(template.code)}/packages/${encodeURIComponent(packageItem.code)}/visibility`, { is_active: nextVisible });
      setPackageVisibility((current) => ({ ...current, [packageItem.code]: result.is_active === true }));
      window.showToast?.(result.message);
      onReload();
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
    } finally {
      setCatalogWorking('');
    }
  };

  return <article className={`admin-template-pricing-card admin-template-catalog-card ${templateVisible ? '' : 'is-catalog-hidden'}`.trim()}>
    <div className={`admin-catalog-visibility ${templateVisible ? 'is-visible' : 'is-hidden'}`}>
      <div><strong>{templateVisible ? 'Tampil di katalog' : 'Template maintenance'}</strong><small>{templateVisible ? 'Bisa dilihat dan dipilih oleh calon customer serta affiliate.' : 'Disembunyikan dari website utama dan seluruh affiliate. Order lama tetap aman.'}</small></div>
      <button type="button" disabled={Boolean(catalogWorking)} aria-pressed={templateVisible} onClick={toggleTemplateVisibility}>{catalogWorking === 'template-visibility' ? 'Menyimpan...' : templateVisible ? 'Sembunyikan' : 'Tampilkan'}</button>
    </div>
    <div className="admin-template-cover-editor">
      <TemplateCover template={{ ...template, ...cover }} eager />
      <div>
        <span className="eyebrow">Gambar sampul</span>
        <p>JPG, PNG, atau WEBP. Maksimal 4 MB. Frame kartu homepage rasio 4:3.</p>
        <div className="admin-cover-buttons">
          <label className={`admin-cover-upload ${catalogWorking === 'cover' ? 'is-loading' : ''}`}>
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={Boolean(catalogWorking)} onChange={handleSelectCoverFile} />
            {catalogWorking === 'cover' ? 'Mengunggah...' : 'Ganti sampul'}
          </label>
          <button
            type="button"
            className="admin-btn-adjust-cover"
            onClick={handleOpenAdjusterForCurrent}
            disabled={Boolean(catalogWorking)}
            title="Atur posisi geser dan zoom foto sampul yang aktif"
          >
            📐 Atur Posisi / Zoom
          </button>
        </div>
      </div>
    </div>
    <AdminCoverAdjusterModal
      isOpen={adjusterOpen}
      onClose={() => setAdjusterOpen(false)}
      template={template}
      initialImageUrl={adjusterImage}
      onSaveCover={handleSaveCroppedCover}
    />
    <form className="admin-template-meta-form" onSubmit={saveDetails}>
      <label><span>Nama template</span><input maxLength="100" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} required /></label>
      <label><span>Kategori</span><input maxLength="50" value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} required /></label>
      <label className="admin-template-description"><span>Deskripsi</span><textarea maxLength="255" rows="3" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} required /><small>{draft.description.length}/255</small></label>
      <button className="admin-save-template" type="submit" disabled={Boolean(catalogWorking)}>{catalogWorking === 'details' ? 'Menyimpan...' : 'Simpan informasi'}</button>
    </form>
    <div className="admin-template-pricing-header"><div><strong>Harga dan komisi affiliate</strong><small>Persentase berlaku global untuk order baru · {template.name}</small></div><span className="admin-pill active">{template.package_count || template.packages?.length || 0} paket</span></div>
    <div className="admin-template-price-list">{(template.packages || []).map((packageItem) => { const key = `${template.code}:${packageItem.code}`; const currentValue = priceDrafts[key] ?? packageItem.price ?? 0; const currentCommission = commissionDrafts[key] ?? packageItem.affiliate_commission_default_percent ?? 0; const packageVisible = packageVisibility[packageItem.code] !== false; const visibilityWorking = catalogWorking === `package-visibility:${packageItem.code}`; return <div className={`admin-template-price-row admin-template-package-settings ${packageVisible ? '' : 'is-package-hidden'}`.trim()} key={key}><div className="admin-package-meta"><strong>{packageItem.name}</strong><small>{packageItem.tagline}</small><em>{packageVisible ? 'Tampil di katalog' : 'Sedang maintenance'}</em></div><label className="admin-package-setting-field"><small>Harga</small><div className="admin-price-editor"><span>Rp</span><input type="text" inputMode="numeric" value={formatRupiahInput(currentValue)} onChange={(event) => setPriceDrafts((current) => ({ ...current, [key]: event.target.value.replace(/\D/g, '') }))}/></div></label><label className="admin-package-setting-field"><small>Komisi affiliate</small><div className="admin-commission-editor"><input type="number" inputMode="decimal" min="0" max="100" step="0.01" value={currentCommission} onChange={(event) => setCommissionDrafts((current) => ({ ...current, [key]: event.target.value }))}/><span>%</span></div></label><div className="admin-package-actions"><button className={`admin-package-visibility ${packageVisible ? 'is-visible' : 'is-hidden'}`} type="button" disabled={Boolean(catalogWorking)} onClick={() => togglePackageVisibility(packageItem)}>{visibilityWorking ? 'Menyimpan...' : packageVisible ? 'Hide' : 'Show'}</button><button className="admin-save-price" type="button" disabled={working === `package:${key}`} onClick={() => onSavePackage(template.code, packageItem.code)}>{working === `package:${key}` ? 'Menyimpan...' : 'Simpan'}</button></div></div>; })}</div>
  </article>;
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

function AdminFilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((option) => option.value === value) || options[0] || { value: '', label: 'Belum tersedia' };
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === 'keydown' && event.key === 'Escape') setOpen(false);
      if (event.type === 'mousedown' && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);
  return <div className={`admin-affiliate-dropdown ${open ? 'is-open' : ''}`} ref={rootRef}>
    <span>{label}</span>
    <button type="button" className="admin-affiliate-dropdown-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}><span>{selected.label}</span><i aria-hidden="true"/></button>
    {open && <div className="admin-affiliate-dropdown-menu" role="listbox" aria-label={label}>{options.map((option) => <button type="button" role="option" aria-selected={option.value === value} className={option.value === value ? 'is-selected' : ''} key={option.value} onClick={() => { onChange(option.value); setOpen(false); }}><span>{option.label}</span>{option.description && <small>{option.description}</small>}<i aria-hidden="true">✓</i></button>)}</div>}
  </div>;
}

function AdminStatusDropdown({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const options = [
    { value: 'pending', label: 'Menunggu', dotColor: '#d97706', desc: 'Dalam antrean verifikasi' },
    { value: 'processing', label: 'Sedang diproses', dotColor: '#0284c7', desc: 'Transfer sedang disiapkan' },
    { value: 'paid', label: 'Selesai / sudah ditransfer', dotColor: '#10b981', desc: 'Dana telah dikirim ke rekening' },
    { value: 'rejected', label: 'Ditolak', dotColor: '#ef4444', desc: 'Penarikan ditolak / perbaikan' },
    { value: 'cancelled', label: 'Dibatalkan', dotColor: '#6b7280', desc: 'Dibatalkan oleh sistem/admin' },
  ];

  const selected = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === 'keydown' && event.key === 'Escape') setOpen(false);
      if (event.type === 'mousedown' && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className={`admin-status-dropdown-wrap ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`admin-status-dropdown-trigger status-${selected.value}`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="status-trigger-left">
          <span className="status-dot" style={{ backgroundColor: selected.dotColor }} />
          <span className="status-label-text">{selected.label}</span>
        </div>
        <svg
          className={`status-chevron ${open ? 'is-open' : ''}`}
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="admin-status-dropdown-menu" role="listbox" aria-label="Status penarikan">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                type="button"
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={`admin-status-dropdown-item status-${option.value} ${isSelected ? 'is-selected' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <div className="status-item-info">
                  <div className="status-item-head">
                    <span className="status-dot" style={{ backgroundColor: option.dotColor }} />
                    <strong className="status-item-label">{option.label}</strong>
                  </div>
                  <small className="status-item-desc">{option.desc}</small>
                </div>
                {isSelected && (
                  <svg className="status-check-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function affiliatePaginationItems(page, pageCount) {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, index) => index + 1);
  if (page <= 3) return [1, 2, 3, 4, 'end-gap', pageCount];
  if (page >= pageCount - 2) return [1, 'start-gap', pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  return [1, 'start-gap', page - 1, page, page + 1, 'end-gap', pageCount];
}

function ExtendWebsiteModal({ order, working, onClose, onSave }) {
  const isExpired = !order.active_until || new Date(order.active_until) <= new Date();
  const currentExpiry = order.active_until ? new Date(order.active_until) : null;

  const baseTime = (currentExpiry && !Number.isNaN(currentExpiry.getTime()) && currentExpiry > new Date())
    ? currentExpiry.getTime()
    : Date.now();

  const getPresetIso = (days) => {
    const d = new Date(baseTime);
    d.setDate(d.getDate() + days);
    return toIsoDateString(d);
  };

  const todayIso = toIsoDateString(new Date());
  const [targetDate, setTargetDate] = useState(() => getPresetIso(90));

  const presets = [
    { label: '+1 Bulan', days: 30 },
    { label: '+3 Bulan', days: 90 },
    { label: '+6 Bulan', days: 180 },
    { label: '+1 Tahun', days: 365 },
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!targetDate) return;
    const ok = await onSave(order, { active: true, active_until: targetDate });
    if (ok) onClose();
  };

  const selectedDateObj = targetDate ? new Date(`${targetDate}T23:59:59`) : null;
  const daysFromNow = selectedDateObj ? Math.ceil((selectedDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div
      className="admin-order-modal admin-extend-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Perpanjang masa aktif website ${order.order_code}`}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <form className="admin-extend-modal-card" onSubmit={handleSubmit}>
        <header>
          <div>
            <span className="eyebrow">KONTROL AKSES WEBSITE</span>
            <h2>Perpanjang Masa Aktif</h2>
            <p>{order.customer_name} · <strong>{order.order_code}</strong></p>
          </div>
          <button type="button" className="close" onClick={onClose} aria-label="Tutup">×</button>
        </header>

        <div className="extend-modal-body">
          <div className="extend-current-info">
            <div className="current-info-item">
              <span className="info-label">Status Website Saat Ini</span>
              <div className="info-value">
                <span className={`status-indicator ${order.website_active ? 'active' : isExpired ? 'expired' : 'inactive'}`} />
                <strong>
                  {order.website_active ? 'Website Aktif' : isExpired ? 'Kadaluarsa / Berakhir' : 'Nonaktif'}
                </strong>
              </div>
            </div>
            <div className="current-info-item">
              <span className="info-label">Berakhir Pada</span>
              <span className="info-value date">
                {currentExpiry ? dateFormat.format(currentExpiry) : 'Belum ditentukan'}
              </span>
            </div>
          </div>

          <div className="extend-preset-section">
            <label className="section-label">PILIH CEPAT DURASI PERPANJANGAN</label>
            <div className="extend-preset-grid">
              {presets.map((preset) => {
                const presetDate = getPresetIso(preset.days);
                const isSelected = targetDate === presetDate;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    className={`preset-pill ${isSelected ? 'is-active' : ''}`}
                    onClick={() => setTargetDate(presetDate)}
                  >
                    <strong>{preset.label}</strong>
                    <small>+{preset.days} hari</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="extend-custom-date">
            <label htmlFor="custom-extend-date" className="section-label">ATAU PILIH TANGGAL BERAKHIR SPESIFIK</label>
            <input
              id="custom-extend-date"
              type="date"
              min={todayIso}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </div>

          <div className="extend-preview-box">
            <div className="preview-icon">📅</div>
            <div className="preview-text">
              <span>Website akan aktif sampai dengan:</span>
              <strong>{selectedDateObj ? dateOnlyFormat.format(selectedDateObj) : '-'}</strong>
              <small>({daysFromNow > 0 ? `${daysFromNow} hari ke depan` : 'Hari ini'}) &middot; Akses website otomatis aktif</small>
            </div>
          </div>
        </div>

        <footer>
          <button type="button" onClick={onClose}>Batal</button>
          <button
            type="submit"
            className="save-extend-btn"
            disabled={working === `website:${order.order_code}` || !targetDate}
          >
            {working === `website:${order.order_code}` ? 'Menyimpan...' : 'Simpan & Perpanjang'}
          </button>
        </footer>
      </form>
    </div>
  );
}

function ComplimentaryOrdersPanel({ orders, templates, working, onCreate, onResend, onReload, onSaveWebsite }) {
  const complimentaryOrders = useMemo(() => orders.filter((order) => order.order_source === 'admin_free'), [orders]);
  const firstTemplate = templates[0];
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    template_code: firstTemplate?.code || '',
    package_code: firstTemplate?.packages?.[0]?.code || '',
    complimentary_note: '',
  });
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [extendingOrder, setExtendingOrder] = useState(null);
  const pageSize = 10;

  useEffect(() => {
    if (!templates.length) return;
    const selectedTemplate = templates.find((item) => item.code === form.template_code) || templates[0];
    const selectedPackage = selectedTemplate.packages?.find((item) => item.code === form.package_code) || selectedTemplate.packages?.[0];
    if (selectedTemplate.code !== form.template_code || selectedPackage?.code !== form.package_code) {
      setForm((current) => ({ ...current, template_code: selectedTemplate.code, package_code: selectedPackage?.code || '' }));
    }
  }, [templates, form.template_code, form.package_code]);

  const selectedTemplate = templates.find((item) => item.code === form.template_code) || templates[0];
  const selectedPackages = selectedTemplate?.packages || [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return complimentaryOrders.filter((order) => {
      const createdDate = orderDateValue(order);
      const statusMatch = status === 'all' || order.status === status;
      const templateMatch = templateFilter === 'all' || order.template_code === templateFilter;
      const dateMatch = (!startDate || createdDate >= startDate) && (!endDate || createdDate <= endDate);
      const haystack = `${order.order_code} ${order.customer_name} ${order.customer_email} ${order.customer_phone} ${order.template_name} ${order.package_name} ${order.complimentary_note}`.toLowerCase();
      return statusMatch && templateMatch && dateMatch && (!needle || haystack.includes(needle));
    });
  }, [complimentaryOrders, query, status, templateFilter, startDate, endDate]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginationItems = affiliatePaginationItems(currentPage, pageCount);

  useEffect(() => setPage(1), [query, status, templateFilter, startDate, endDate]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const updateTemplate = (templateCode) => {
    const nextTemplate = templates.find((item) => item.code === templateCode);
    setForm((current) => ({ ...current, template_code: templateCode, package_code: nextTemplate?.packages?.[0]?.code || '' }));
  };
  const submit = async (event) => {
    event.preventDefault();
    const result = await onCreate(form);
    if (!result?.order) return;
    setForm((current) => ({ ...current, customer_name: '', customer_email: '', customer_phone: '', complimentary_note: '' }));
    setDetail(result.order);
  };
  const resetFilters = () => {
    setQuery(''); setStatus('all'); setTemplateFilter('all'); setStartDate(''); setEndDate('');
  };
  const statusOptions = [
    { value: 'all', label: 'Semua status', description: `${complimentaryOrders.length} order gratis` },
    { value: 'editing', label: 'Sedang diedit', description: 'Editor sudah dapat digunakan' },
    { value: 'published', label: 'Sudah diterbitkan' },
    { value: 'cancelled', label: 'Dibatalkan' },
  ];
  const templateOptions = [
    { value: 'all', label: 'Semua template' },
    ...templates.map((item) => ({ value: item.code, label: item.name, description: item.category || '' })),
  ];

  return <>
    <section className="admin-free-order-create">
      <div className="admin-free-order-intro"><span className="eyebrow">HADIAH DARI DAYMOMENT</span><h2>Buat akses undangan gratis</h2><p>Order langsung aktif tanpa payment gateway. Setelah disimpan, tautan editor otomatis dikirim ke email customer.</p><div><strong>Rp 0</strong><small>Tidak menghasilkan omzet atau komisi affiliate</small></div></div>
      <form className="admin-free-order-form" onSubmit={submit}>
        <label><span>Nama lengkap *</span><input required minLength="3" maxLength="120" value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} placeholder="Nama penerima undangan"/></label>
        <label><span>Email penerima *</span><input required type="email" maxLength="254" value={form.customer_email} onChange={(event) => setForm({ ...form, customer_email: event.target.value })} placeholder="nama@email.com"/></label>
        <label><span>Nomor WhatsApp *</span><input required type="tel" maxLength="24" value={form.customer_phone} onChange={(event) => setForm({ ...form, customer_phone: event.target.value })} placeholder="08xxxxxxxxxx"/></label>
        <AdminFilterDropdown label="Template *" value={form.template_code} options={templates.map((item) => ({ value: item.code, label: item.name, description: item.category || '' }))} onChange={updateTemplate}/>
        <AdminFilterDropdown label="Paket *" value={form.package_code} options={selectedPackages.map((item) => ({ value: item.code, label: item.name, description: `${item.tagline || ''} · harga normal ${money(item.price)}` }))} onChange={(value) => setForm({ ...form, package_code: value })}/>
        <label className="wide"><span>Catatan internal</span><textarea rows="3" maxLength="500" value={form.complimentary_note} onChange={(event) => setForm({ ...form, complimentary_note: event.target.value })} placeholder="Contoh: hadiah untuk partner atau customer khusus"/><small>{form.complimentary_note.length}/500 · hanya terlihat oleh admin</small></label>
        <div className="admin-free-order-submit"><p><strong>Email yang dikirim berisi tautan editor pribadi.</strong><span>Jika pengiriman gagal, order tetap tersimpan dan dapat dikirim ulang dari tabel.</span></p><button type="submit" disabled={working === 'complimentary:create' || !templates.length}>{working === 'complimentary:create' ? 'Membuat order...' : 'Buat & kirim ke email →'}</button></div>
      </form>
    </section>

    <section className="admin-order-history-summary admin-free-order-summary">
      <div><span>Total order gratis</span><strong>{complimentaryOrders.length}</strong><small>seluruh pemberian admin</small></div>
      <div><span>Sesuai filter</span><strong>{filtered.length}</strong><small>hasil pencarian saat ini</small></div>
      <div><span>Email terkirim</span><strong>{complimentaryOrders.filter((item) => item.editor_email_sent_at).length}</strong><small>akses editor pernah dikirim</small></div>
    </section>
    <section className="admin-order-history-filter admin-free-order-filter">
      <label className="admin-order-search"><span>Cari order gratis</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Invoice, nama, email, HP, atau catatan"/></label>
      <AdminFilterDropdown label="Status order" value={status} options={statusOptions} onChange={setStatus}/>
      <AdminFilterDropdown label="Template" value={templateFilter} options={templateOptions} onChange={setTemplateFilter}/>
      <label><span>Dari tanggal</span><input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)}/></label>
      <label><span>Sampai tanggal</span><input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)}/></label>
      <div className="admin-order-filter-footer"><small>{filtered.length} data disaring dari data tersimpan tanpa request baru</small><div><button type="button" className="reset" onClick={resetFilters}>Reset filter</button><button type="button" className="reload" onClick={onReload}>Muat ulang</button></div></div>
    </section>
    <section className="admin-order-history-list admin-free-order-list">
      <div className="admin-section-heading"><div><span className="eyebrow">ARSIP PEMBERIAN</span><h2>Riwayat order gratis</h2></div><span className="admin-count">Maksimal 10 data per halaman</span></div>
      <div className="admin-order-table-wrap"><table className="admin-order-history-table"><thead><tr><th>Invoice</th><th>Penerima</th><th>Template</th><th>Email akses</th><th>Status</th><th>Dibuat</th><th>Aksi</th></tr></thead><tbody>{pageItems.length ? pageItems.map((order) => <tr key={order.id || order.order_code}><td><strong>{order.order_code}</strong><small>Order gratis admin</small></td><td><strong>{order.customer_name}</strong><small>{order.customer_email}</small><small>{order.customer_phone}</small></td><td><strong>{order.template_name || '-'}</strong><small>{order.package_name || '-'}</small><small>Harga customer: Gratis</small></td><td><span className={`admin-free-email-state ${order.editor_email_sent_at ? 'sent' : 'waiting'}`}>{order.editor_email_sent_at ? 'Sudah terkirim' : 'Belum terkirim'}</span>{order.editor_email_sent_at && <small>{dateFormat.format(new Date(order.editor_email_sent_at))}</small>}</td><td><span className={`admin-pill ${order.status === 'cancelled' ? 'failed' : 'paid'}`}>{orderStatusLabel(order.status)}</span></td><td><strong>{order.created_at ? dateFormat.format(new Date(order.created_at)) : '-'}</strong></td><td><div className="admin-order-actions admin-free-order-actions"><button type="button" className="detail" onClick={() => setDetail(order)}>Detail</button>{order.editor_url && <a href={order.editor_url} target="_blank" rel="noreferrer">Editor</a>}<button type="button" className="email" disabled={working === `complimentary:email:${order.order_code}`} onClick={() => onResend(order.order_code)}>{working === `complimentary:email:${order.order_code}` ? 'Mengirim...' : 'Kirim email'}</button>{order.website_active ? <button type="button" className="web-btn-toggle deactivate" disabled={working === `website:${order.order_code}`} onClick={() => { if (window.confirm(`Nonaktifkan website undangan untuk ${order.customer_name} (${order.order_code})?`)) { onSaveWebsite?.(order, { active: false }); } }} title="Nonaktifkan website undangan">{working === `website:${order.order_code}` ? '...' : 'Nonaktifkan'}</button> : <button type="button" className="web-btn-toggle activate" disabled={working === `website:${order.order_code}`} onClick={() => onSaveWebsite?.(order, { active: true })} title="Aktifkan website undangan">{working === `website:${order.order_code}` ? '...' : 'Aktifkan'}</button>}<button type="button" className="web-btn-extend" disabled={working === `website:${order.order_code}`} onClick={() => setExtendingOrder(order)} title="Perpanjang masa aktif website">Perpanjang</button></div></td></tr>) : <tr><td className="admin-order-empty" colSpan="7">Belum ada order gratis yang cocok dengan filter.</td></tr>}</tbody></table></div>
      {filtered.length > 0 && <div className="admin-affiliate-pagination"><span>Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} dari {filtered.length} data</span><nav aria-label="Halaman order gratis"><button type="button" className="direction" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button>{paginationItems.map((item) => typeof item === 'number' ? <button type="button" className={item === currentPage ? 'is-active' : ''} aria-current={item === currentPage ? 'page' : undefined} key={item} onClick={() => setPage(item)}>{item}</button> : <span className="ellipsis" key={item}>…</span>)}<button type="button" className="direction" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>›</button></nav></div>}
    </section>
    {detail && <div className="admin-order-modal" role="dialog" aria-modal="true" aria-label={`Detail order gratis ${detail.order_code}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setDetail(null); }}><article className="admin-order-detail-card"><header><div><span className="eyebrow">ORDER GRATIS</span><h2>{detail.order_code}</h2><p>{detail.customer_name} · {detail.customer_email}</p></div><button type="button" className="close" onClick={() => setDetail(null)} aria-label="Tutup">×</button></header><div className="admin-order-detail-grid"><section><span>Penerima</span><dl><div><dt>Nama</dt><dd>{detail.customer_name}</dd></div><div><dt>Email</dt><dd>{detail.customer_email}</dd></div><div><dt>WhatsApp</dt><dd>{detail.customer_phone}</dd></div></dl></section><section><span>Produk</span><dl><div><dt>Template</dt><dd>{detail.template_name || '-'}</dd></div><div><dt>Paket</dt><dd>{detail.package_name || '-'}</dd></div><div><dt>Biaya</dt><dd>Gratis</dd></div></dl></section><section><span>Akses &amp; Website</span><dl><div><dt>Status order</dt><dd>{orderStatusLabel(detail.status)}</dd></div><div><dt>Status website</dt><dd><span className={`admin-pill ${detail.website_active ? 'paid' : (detail.active_until && new Date(detail.active_until) <= new Date()) ? 'expired' : 'waiting'}`}>{detail.website_active ? 'Aktif' : (detail.active_until && new Date(detail.active_until) <= new Date()) ? 'Kadaluarsa' : 'Nonaktif'}</span></dd></div><div><dt>Masa aktif</dt><dd>{detail.active_until ? dateFormat.format(new Date(detail.active_until)) : 'Belum diatur'}</dd></div><div><dt>Email editor</dt><dd>{detail.editor_email_sent_at ? `Terkirim ${dateFormat.format(new Date(detail.editor_email_sent_at))}` : 'Belum terkirim'}</dd></div><div><dt>Editor</dt><dd>{detail.editor_url ? <a href={detail.editor_url} target="_blank" rel="noreferrer">Buka editor</a> : '-'}</dd></div><div><dt>Website</dt><dd>{detail.website_url ? <a href={detail.website_url} target="_blank" rel="noreferrer">Buka website</a> : '-'}</dd></div></dl><div className="admin-order-modal-web-actions">{detail.website_active ? <button type="button" className="web-btn-toggle deactivate" disabled={working === `website:${detail.order_code}`} onClick={async () => { if (window.confirm(`Nonaktifkan website undangan untuk ${detail.customer_name} (${detail.order_code})?`)) { const ok = await onSaveWebsite?.(detail, { active: false }); if (ok) setDetail((prev) => ({ ...prev, website_active: false, website_enabled: false })); } }}>{working === `website:${detail.order_code}` ? 'Menyimpan...' : 'Nonaktifkan Website'}</button> : <button type="button" className="web-btn-toggle activate" disabled={working === `website:${detail.order_code}`} onClick={async () => { const ok = await onSaveWebsite?.(detail, { active: true }); if (ok) setDetail((prev) => ({ ...prev, website_active: true, website_enabled: true })); }}>{working === `website:${detail.order_code}` ? 'Menyimpan...' : 'Aktifkan Website'}</button>}<button type="button" className="web-btn-extend" disabled={working === `website:${detail.order_code}`} onClick={() => setExtendingOrder(detail)}>Perpanjang Masa Aktif</button></div></section><section><span>Catatan admin</span><p className="admin-free-order-note">{detail.complimentary_note || 'Tidak ada catatan internal.'}</p></section></div><footer><button type="button" onClick={() => setDetail(null)}>Tutup</button><button type="button" className="edit" disabled={working === `complimentary:email:${detail.order_code}`} onClick={() => onResend(detail.order_code)}>Kirim ulang email</button></footer></article></div>}
    {extendingOrder && (
      <ExtendWebsiteModal
        order={extendingOrder}
        working={working}
        onClose={() => setExtendingOrder(null)}
        onSave={async (ord, val) => {
          const ok = await onSaveWebsite?.(ord, val);
          if (ok && detail && detail.order_code === ord.order_code) {
            setDetail((prev) => ({ ...prev, website_active: true, website_enabled: true, active_until: val.active_until }));
          }
          return ok;
        }}
      />
    )}
  </>;
}

function CustomerEditorPanel({ orders, working, onSaveWebsite, onReload }) {
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'paid' | 'free'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [extendingOrder, setExtendingOrder] = useState(null);
  const pageSize = 12;

  // Filter only eligible customer orders:
  // Must have editor url or token AND be paid (regular customer) OR admin_free
  const eligibleOrders = useMemo(() => {
    return (orders || []).filter((order) => {
      const isPaid = order.payment_status === 'paid';
      const isFree = order.order_source === 'admin_free';
      if (!isPaid && !isFree) return false;
      return Boolean(order.editor_url || order.editor_token);
    });
  }, [orders]);

  const paidOrders = useMemo(() => eligibleOrders.filter((o) => o.order_source !== 'admin_free'), [eligibleOrders]);
  const freeOrders = useMemo(() => eligibleOrders.filter((o) => o.order_source === 'admin_free'), [eligibleOrders]);
  const totalCount = eligibleOrders.length;
  const paidCount = paidOrders.length;
  const freeCount = freeOrders.length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return eligibleOrders.filter((order) => {
      if (sourceFilter === 'paid' && order.order_source === 'admin_free') return false;
      if (sourceFilter === 'free' && order.order_source !== 'admin_free') return false;
      const orderDate = orderDateValue(order);
      if (startDate && orderDate < startDate) return false;
      if (endDate && orderDate > endDate) return false;
      if (!q) return true;
      const haystack = `${order.customer_name || ''} ${order.customer_email || ''} ${order.customer_phone || ''} ${order.order_code || ''} ${order.template_name || ''} ${order.template_code || ''} ${order.package_name || ''} ${order.complimentary_note || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [eligibleOrders, query, sourceFilter, startDate, endDate]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginationItems = affiliatePaginationItems(currentPage, pageCount);

  useEffect(() => setPage(1), [query, sourceFilter, startDate, endDate]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const copyEditorUrl = async (url) => {
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = fullUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      window.showToast?.('Link editor berhasil disalin!');
    } catch {
      window.prompt('Salin link editor berikut:', fullUrl);
    }
  };

  const resetFilters = () => {
    setQuery('');
    setSourceFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <section className="admin-editor-panel admin-editor-panel-dedicated">
      <div className="admin-editor-stats-grid">
        <div
          className={`admin-editor-stat-box ${sourceFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSourceFilter('all')}
          role="button"
          tabIndex={0}
        >
          <div className="editor-stat-icon all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <div className="editor-stat-info">
            <span className="editor-stat-label">Total Editor Aktif</span>
            <strong className="editor-stat-value">{totalCount}</strong>
            <small>Semua undangan siap edit</small>
          </div>
        </div>

        <div
          className={`admin-editor-stat-box ${sourceFilter === 'paid' ? 'active' : ''}`}
          onClick={() => setSourceFilter('paid')}
          role="button"
          tabIndex={0}
        >
          <div className="editor-stat-icon paid">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <div className="editor-stat-info">
            <span className="editor-stat-label">Riwayat Pesanan (Lunas)</span>
            <strong className="editor-stat-value">{paidCount}</strong>
            <small>Pesanan berbayar yang lunas</small>
          </div>
        </div>

        <div
          className={`admin-editor-stat-box ${sourceFilter === 'free' ? 'active' : ''}`}
          onClick={() => setSourceFilter('free')}
          role="button"
          tabIndex={0}
        >
          <div className="editor-stat-icon free">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
              <path d="M20 12v8H4v-8M2 7h20v5H2zM12 7v13M12 7H7.5A2.5 2.5 0 1 1 10 4.5L12 7zm0 0h4.5A2.5 2.5 0 1 0 14 4.5L12 7z"/>
            </svg>
          </div>
          <div className="editor-stat-info">
            <span className="editor-stat-label">Order Gratis Admin</span>
            <strong className="editor-stat-value">{freeCount}</strong>
            <small>Hadiah / pemberian admin</small>
          </div>
        </div>
      </div>

      <div className="admin-editor-filter-card">
        <div className="admin-editor-source-tabs">
          <button
            type="button"
            className={`admin-editor-tab-btn ${sourceFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setSourceFilter('all')}
          >
            Semua ({totalCount})
          </button>
          <button
            type="button"
            className={`admin-editor-tab-btn paid ${sourceFilter === 'paid' ? 'is-active' : ''}`}
            onClick={() => setSourceFilter('paid')}
          >
            <span className="dot paid" />
            Riwayat Pesanan Lunas ({paidCount})
          </button>
          <button
            type="button"
            className={`admin-editor-tab-btn free ${sourceFilter === 'free' ? 'is-active' : ''}`}
            onClick={() => setSourceFilter('free')}
          >
            <span className="dot free" />
            Order Gratis ({freeCount})
          </button>
        </div>

        <div className="admin-editor-filter-inputs">
          <label className="admin-editor-search-box">
            <span>CARI CUSTOMER ATAU ORDER</span>
            <div className="search-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nama, email, WhatsApp, invoice, template, catatan..."
              />
            </div>
          </label>

          <label className="admin-editor-date-box">
            <span>DARI TANGGAL</span>
            <input type="date" value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} />
          </label>

          <label className="admin-editor-date-box">
            <span>SAMPAI TANGGAL</span>
            <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
          </label>

          {(query || sourceFilter !== 'all' || startDate || endDate) && (
            <button type="button" className="admin-editor-reset-btn" onClick={resetFilters}>
              Reset filter
            </button>
          )}
        </div>

        <div className="admin-editor-filter-meta">
          <span>Menampilkan <strong>{filtered.length}</strong> customer yang memenuhi syarat</span>
          <span className="admin-editor-note-pill">Khusus order lunas &amp; gratis</span>
        </div>
      </div>

      <div className="admin-editor-grid-enhanced">
        {pageItems.length ? pageItems.map((order) => {
          const isFree = order.order_source === 'admin_free';
          const editorUrl = order.editor_url || (order.editor_token ? `/edit/${order.editor_token}` : null);
          const dateStr = order.paid_at || order.created_at;
          const displayDate = dateStr ? dateFormat.format(new Date(dateStr)) : '-';

          return (
            <div className={`admin-editor-card-enhanced ${isFree ? 'is-free' : 'is-paid'}`} key={order.id || order.order_code}>
              <div className="editor-card-header">
                <div className="editor-card-title-group">
                  <h3 className="editor-card-name" title={order.customer_name}>{order.customer_name}</h3>
                  <div className="editor-card-badges">
                    {isFree ? (
                      <span className="editor-source-tag free" title="Order gratis hadiah dari admin">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 12v8H4v-8M2 7h20v5H2zM12 7v13M12 7H7.5A2.5 2.5 0 1 1 10 4.5L12 7zm0 0h4.5A2.5 2.5 0 1 0 14 4.5L12 7z"/></svg>
                        Order Gratis
                      </span>
                    ) : (
                      <span className="editor-source-tag paid" title="Pesanan reguler dari website yang sudah lunas">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Pesanan Lunas
                      </span>
                    )}

                    {order.website_active ? (
                      <span className="editor-status-tag live">Live</span>
                    ) : (
                      <span className="editor-status-tag draft">Draft</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="editor-card-meta-list">
                <div className="editor-card-meta-item code">
                  <span className="meta-icon">#</span>
                  <strong>{order.order_code}</strong>
                </div>
                <div className="editor-card-meta-item template">
                  <span className="meta-icon">🎨</span>
                  <span>{order.template_name || order.template_code || '-'}</span>
                  {order.package_name && <small className="meta-package">({order.package_name})</small>}
                </div>
                <div className="editor-card-meta-item date">
                  <span className="meta-icon">📅</span>
                  <small>{displayDate}</small>
                </div>
              </div>

              <div className="editor-card-contacts">
                {order.customer_email && (
                  <a className="contact-link email" href={`mailto:${order.customer_email}`} title={order.customer_email}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <span>{order.customer_email}</span>
                  </a>
                )}
                {order.customer_phone && (
                  <a className="contact-link phone" href={`https://wa.me/${String(order.customer_phone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" title="Chat WhatsApp">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span>{order.customer_phone}</span>
                  </a>
                )}
              </div>

              {order.complimentary_note && (
                <div className="editor-card-admin-note">
                  <span className="note-label">Catatan Admin:</span>
                  <p>{order.complimentary_note}</p>
                </div>
              )}

              <div className="editor-card-website-control">
                <div className="website-control-meta">
                  <div className="website-control-status">
                    <span className={`status-indicator ${order.website_active ? 'active' : (order.active_until && new Date(order.active_until) <= new Date()) ? 'expired' : 'inactive'}`} />
                    <strong>
                      {order.website_active
                        ? 'Website Aktif'
                        : (order.active_until && new Date(order.active_until) <= new Date())
                          ? 'Masa Aktif Berakhir'
                          : 'Website Nonaktif'}
                    </strong>
                  </div>
                  <span className="website-control-expiry">
                    {order.active_until ? (
                      <>s/d {dateOnlyFormat.format(new Date(order.active_until))}</>
                    ) : (
                      <span className="text-muted">Masa aktif belum diatur</span>
                    )}
                  </span>
                </div>

                <div className="website-control-actions">
                  {order.website_active ? (
                    <button
                      type="button"
                      className="web-btn-toggle deactivate"
                      disabled={working === `website:${order.order_code}`}
                      onClick={() => {
                        if (window.confirm(`Nonaktifkan website undangan untuk ${order.customer_name} (${order.order_code})?`)) {
                          onSaveWebsite?.(order, { active: false });
                        }
                      }}
                      title="Nonaktifkan website undangan"
                    >
                      {working === `website:${order.order_code}` ? 'Menyimpan...' : 'Nonaktifkan'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="web-btn-toggle activate"
                      disabled={working === `website:${order.order_code}`}
                      onClick={() => onSaveWebsite?.(order, { active: true })}
                      title="Aktifkan website undangan"
                    >
                      {working === `website:${order.order_code}` ? 'Menyimpan...' : 'Aktifkan'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="web-btn-extend"
                    disabled={working === `website:${order.order_code}`}
                    onClick={() => setExtendingOrder(order)}
                    title="Perpanjang masa aktif website"
                  >
                    Perpanjang
                  </button>
                </div>
              </div>

              <div className="editor-card-footer">
                <div className="editor-card-action-group">
                  {editorUrl ? (
                    <>
                      <a className="editor-main-btn" href={editorUrl} target="_blank" rel="noreferrer">
                        Buka editor
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                      <button
                        type="button"
                        className="editor-copy-url-btn"
                        onClick={() => copyEditorUrl(editorUrl)}
                        title="Salin link editor untuk customer"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Salin link
                      </button>
                    </>
                  ) : (
                    <span className="editor-disabled-note">Link belum tersedia</span>
                  )}

                  {order.website_url && (
                    <a className="editor-web-btn" href={order.website_url} target="_blank" rel="noreferrer" title="Lihat website undangan terbit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="admin-editor-empty-state">
            <div className="empty-icon">🔍</div>
            <h3>Tidak ada customer yang cocok</h3>
            <p>Tidak ditemukan undangan dengan kata kunci atau filter saat ini. Hanya pesanan berstatus lunas dan order gratis yang ditampilkan di sini.</p>
            <button type="button" className="empty-reset-btn" onClick={resetFilters}>
              Tampilkan semua editor
            </button>
          </div>
        )}
      </div>

      {filtered.length > pageSize && (
        <div className="admin-affiliate-pagination">
          <span>Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} dari {filtered.length} customer</span>
          <nav aria-label="Halaman editor customer">
            <button type="button" className="direction" disabled={currentPage === 1} onClick={() => setPage((v) => Math.max(1, v - 1))}>‹</button>
            {paginationItems.map((item) => typeof item === 'number' ? (
              <button type="button" className={item === currentPage ? 'is-active' : ''} aria-current={item === currentPage ? 'page' : undefined} key={item} onClick={() => setPage(item)}>{item}</button>
            ) : (
              <span className="ellipsis" key={item}>…</span>
            ))}
            <button type="button" className="direction" disabled={currentPage === pageCount} onClick={() => setPage((v) => Math.min(pageCount, v + 1))}>›</button>
          </nav>
        </div>
      )}

      {extendingOrder && (
        <ExtendWebsiteModal
          order={extendingOrder}
          working={working}
          onClose={() => setExtendingOrder(null)}
          onSave={onSaveWebsite}
        />
      )}
    </section>
  );
}

function AffiliateCommissionBreakdownModal({
  open,
  onClose,
  commissionTotal,
  referralSalesTotal,
  paidOrdersCount,
  breakdown,
  onSelectAffiliate,
  onViewOrder,
}) {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  if (!open) return null;

  const needle = query.trim().toLowerCase();
  const list = needle
    ? breakdown.filter((item) =>
        `${item.name} ${item.email} ${item.code}`.toLowerCase().includes(needle)
      )
    : breakdown;

  const activeCount = breakdown.filter((item) => item.paidCommissionTotal > 0 || item.paidOrderCount > 0).length;

  return (
    <div
      className="admin-order-modal admin-commission-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Rincian Komisi Affiliate"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article className="admin-commission-modal-card">
        <header>
          <div>
            <span className="eyebrow">RINCIAN KOMISI AFFILIATE</span>
            <h2>Breakdown Komisi per Affiliate</h2>
            <p>Rincian total komisi dan performa transaksi per partner affiliate dari pesanan lunas</p>
          </div>
          <button type="button" className="close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </header>

        <div className="admin-commission-metrics">
          <div className="admin-commission-metrics-card highlight">
            <span>Total Komisi Lunas</span>
            <strong>{money(commissionTotal)}</strong>
            <small>hak komisi siap cair / lunas</small>
          </div>
          <div className="admin-commission-metrics-card">
            <span>Omset Referral Lunas</span>
            <strong>{money(referralSalesTotal)}</strong>
            <small>dari {paidOrdersCount} transaksi referral lunas</small>
          </div>
          <div className="admin-commission-metrics-card">
            <span>Partner Terlibat</span>
            <strong>{activeCount} affiliate</strong>
            <small>dari {breakdown.length} total mitra referral</small>
          </div>
        </div>

        {breakdown.length > 2 && (
          <div className="admin-commission-search-bar">
            <input
              type="search"
              placeholder="Cari partner (nama, email, atau kode referral)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}

        <div className="admin-commission-table-wrap">
          <table className="admin-commission-table">
            <thead>
              <tr>
                <th>Partner Affiliate</th>
                <th>Pesanan Lunas</th>
                <th>Total Penjualan</th>
                <th>Total Komisi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.length ? (
                list.map((item) => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr>
                        <td>
                          <div className="admin-commission-partner">
                            <strong>{item.name}</strong>
                            <div className="admin-commission-partner-meta">
                              {item.code && (
                                <span className="admin-commission-code-badge" title="Kode Referral">
                                  #{item.code}
                                </span>
                              )}
                              {item.email && <span className="admin-commission-email">{item.email}</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong>{item.paidOrderCount} pesanan</strong>
                          {item.pendingOrderCount > 0 && (
                            <small style={{ display: 'block', color: '#b27b2b', marginTop: '2px' }}>
                              +{item.pendingOrderCount} menunggu
                            </small>
                          )}
                        </td>
                        <td>
                          <strong>{money(item.paidSalesTotal)}</strong>
                        </td>
                        <td>
                          <strong className={`admin-commission-amount ${item.paidCommissionTotal > 0 ? '' : 'zero'}`}>
                            {money(item.paidCommissionTotal)}
                          </strong>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="admin-commission-btn-expand"
                              onClick={() => setExpandedId(isExpanded ? null : item.id)}
                              title="Lihat daftar invoice referral"
                            >
                              {isExpanded ? 'Tutup ▲' : `Daftar (${item.orders.length}) ▼`}
                            </button>
                            <button
                              type="button"
                              className="admin-commission-view-order-btn"
                              onClick={() => {
                                const val = item.email ? `email:${item.email.toLowerCase()}` : `id:${item.id}`;
                                onSelectAffiliate(val);
                                onClose();
                              }}
                              title="Filter riwayat pesanan dengan affiliate ini"
                            >
                              Filter
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="5" style={{ padding: '0 12px 14px' }}>
                            <div className="admin-commission-orders-subtable">
                              <div style={{ marginBottom: '8px', fontSize: '0.68rem', fontWeight: 800, color: '#315549' }}>
                                Transaksi Referral · {item.name} ({item.orders.length} pesanan)
                              </div>
                              <div className="admin-commission-orders-list">
                                {item.orders.map((ord) => (
                                  <div key={ord.id || ord.order_code} className="admin-commission-order-item">
                                    <div className="admin-commission-order-meta">
                                      <span className="admin-commission-order-code">{ord.order_code}</span>
                                      <span>· {ord.customer_name}</span>
                                      <span style={{ color: '#7b8a83' }}>({ord.template_name || '-'} / {ord.package_name || '-'})</span>
                                      <span className={`admin-pill ${ord.payment_status}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                                        {statusLabel(ord.payment_status)}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <span style={{ color: '#566a61' }}>{money(ord.payment_amount || ord.package_price)}</span>
                                      <span className="admin-commission-order-comm">
                                        Komisi: {money(ord.affiliate_commission_amount)}
                                      </span>
                                      <button
                                        type="button"
                                        className="admin-commission-view-order-btn"
                                        onClick={() => {
                                          onClose();
                                          onViewOrder(ord);
                                        }}
                                      >
                                        Detail
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="admin-order-empty">
                    {query
                      ? 'Tidak ada partner affiliate yang cocok dengan kata kunci pencarian.'
                      : 'Tidak ada transaksi referral affiliate pada pesanan dengan filter saat ini.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer>
          <small>
            * Total komisi dihitung dari seluruh pesanan referral yang berstatus lunas.
          </small>
          <button type="button" className="close-btn" onClick={onClose}>
            Tutup
          </button>
        </footer>
      </article>
    </div>
  );
}

function OrderHistoryPanel({ orders, templates, affiliateOptions, working, onSave, onSaveWebsite, onReload }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [affiliate, setAffiliate] = useState('all');
  const [template, setTemplate] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [extendingOrder, setExtendingOrder] = useState(null);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const pageSize = 10;

  const affiliateChoices = useMemo(() => {
    const values = new Map((affiliateOptions || []).map((item) => [String(item.id), item]));
    orders.forEach((order) => {
      if (!order.affiliate_id || values.has(String(order.affiliate_id))) return;
      values.set(String(order.affiliate_id), { id: order.affiliate_id, full_name: order.affiliate_name || order.referral_name || 'Affiliate', referral_code: order.affiliate_referral_code || '' });
    });
    return [...values.values()].sort((first, second) => String(first.full_name || '').localeCompare(String(second.full_name || ''), 'id'));
  }, [affiliateOptions, orders]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      const date = orderDateValue(order);
      const statusMatch = status === 'all' || (status.startsWith('payment:') ? order.payment_status === status.slice(8) : order.status === status.slice(6));
      const selectedAffiliateEmail = affiliate.startsWith('email:') ? affiliate.slice(6) : '';
      const selectedAffiliateId = affiliate.startsWith('id:') ? affiliate.slice(3) : '';
      const affiliateMatch = affiliate === 'all' || (affiliate === 'none'
        ? !order.affiliate_id
        : selectedAffiliateEmail
          ? String(order.affiliate_email || '').trim().toLowerCase() === selectedAffiliateEmail
          : String(order.affiliate_id || '') === selectedAffiliateId);
      const templateMatch = template === 'all' || order.template_code === template;
      const dateMatch = (!startDate || date >= startDate) && (!endDate || date <= endDate);
      const haystack = `${order.order_code} ${order.customer_name} ${order.customer_email} ${order.customer_phone} ${order.template_name} ${order.template_code} ${order.package_name} ${order.affiliate_name} ${order.affiliate_email} ${order.affiliate_referral_code} ${order.transaction_id}`.toLowerCase();
      return statusMatch && affiliateMatch && templateMatch && dateMatch && (!needle || haystack.includes(needle));
    });
  }, [orders, query, status, affiliate, template, startDate, endDate]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginationItems = affiliatePaginationItems(currentPage, pageCount);
  const paidTotal = filtered.filter((order) => order.payment_status === 'paid').reduce((sum, order) => sum + Number(order.payment_amount ?? order.package_price ?? 0), 0);

  const affiliatePaidOrders = useMemo(() => {
    return filtered.filter((order) => order.payment_status === 'paid' && (order.affiliate_id || Number(order.affiliate_commission_amount || 0) > 0));
  }, [filtered]);

  const affiliateCommissionTotal = useMemo(() => {
    return affiliatePaidOrders.reduce((sum, order) => sum + Number(order.affiliate_commission_amount || 0), 0);
  }, [affiliatePaidOrders]);

  const totalReferralSales = useMemo(() => {
    return affiliatePaidOrders.reduce((sum, order) => sum + Number(order.payment_amount ?? order.package_price ?? 0), 0);
  }, [affiliatePaidOrders]);

  const commissionBreakdown = useMemo(() => {
    const map = new Map();
    filtered.forEach((order) => {
      if (!order.affiliate_id && !order.affiliate_name && !Number(order.affiliate_commission_amount || 0)) return;
      const key = String(order.affiliate_id || order.affiliate_email || order.affiliate_name);
      const isPaid = order.payment_status === 'paid';
      const commAmount = Number(order.affiliate_commission_amount || 0);
      const saleAmount = Number(order.payment_amount ?? order.package_price ?? 0);

      const existing = map.get(key) || {
        id: order.affiliate_id || key,
        name: order.affiliate_name || order.referral_name || 'Affiliate',
        email: order.affiliate_email || '',
        code: order.affiliate_referral_code || '',
        paidOrderCount: 0,
        pendingOrderCount: 0,
        paidSalesTotal: 0,
        paidCommissionTotal: 0,
        pendingCommissionTotal: 0,
        orders: [],
      };

      if (isPaid) {
        existing.paidOrderCount += 1;
        existing.paidSalesTotal += saleAmount;
        existing.paidCommissionTotal += commAmount;
      } else {
        existing.pendingOrderCount += 1;
        existing.pendingCommissionTotal += commAmount;
      }
      existing.orders.push(order);
      map.set(key, existing);
    });

    return [...map.values()].sort((a, b) => b.paidCommissionTotal - a.paidCommissionTotal || b.paidSalesTotal - a.paidSalesTotal);
  }, [filtered]);

  const activeAffiliatesCount = commissionBreakdown.filter((item) => item.paidCommissionTotal > 0 || item.paidOrderCount > 0).length;

  useEffect(() => setPage(1), [query, status, affiliate, template, startDate, endDate]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const paymentStatusOptions = [
    { value: 'paid', label: 'Sudah lunas', description: 'Pembayaran berhasil diterima' },
    { value: 'pending', label: 'Menunggu pembayaran', description: 'Belum ada pembayaran masuk' },
    { value: 'failed', label: 'Pembayaran gagal' },
    { value: 'expired', label: 'Kedaluwarsa' },
    { value: 'refunded', label: 'Dikembalikan' },
  ];
  const statusOptions = [
    { value: 'all', label: 'Semua status', description: `${orders.length} pesanan` },
    ...paymentStatusOptions.map((item) => ({ ...item, value: `payment:${item.value}` })),
    { value: 'order:editing', label: 'Order sedang diedit', description: 'Customer sudah masuk editor' },
    { value: 'order:published', label: 'Website diterbitkan' },
    { value: 'order:cancelled', label: 'Order dibatalkan' },
  ];
  const affiliateFilterOptions = [
    { value: 'all', label: 'Semua affiliate', description: 'Termasuk pesanan langsung' },
    { value: 'none', label: 'Tanpa affiliate', description: 'Pesanan dari kanal langsung' },
    ...affiliateChoices.map((item) => {
      const email = String(item.email || '').trim().toLowerCase();
      return { value: email ? `email:${email}` : `id:${item.id}`, label: item.full_name || item.email || 'Affiliate', description: item.email || 'Email belum tersedia' };
    }),
  ];
  const templateFilterOptions = [
    { value: 'all', label: 'Semua template' },
    ...templates.map((item) => ({ value: item.code, label: item.name, description: item.category || `${item.packages?.length || 0} paket` })),
  ];

  const resetFilters = () => {
    setQuery(''); setStatus('all'); setAffiliate('all'); setTemplate('all'); setStartDate(''); setEndDate('');
  };
  const editOrder = (order) => setEditing({
    order_code: order.order_code,
    customer_name: order.customer_name || '',
    customer_email: order.customer_email || '',
    customer_phone: order.customer_phone || '',
    slug: order.slug || '',
    template_code: order.template_code || templates[0]?.code || '',
    package_code: order.package_code || templates.find((item) => item.code === order.template_code)?.packages?.[0]?.code || '',
    status: order.status || 'waiting_payment',
    payment_status: order.payment_status || 'pending',
    payment_amount: String(order.payment_amount ?? order.package_price ?? 0),
    affiliate_id: order.affiliate_id ? String(order.affiliate_id) : 'none',
    affiliate_commission_percent: String(order.affiliate_commission_percent || 0),
    affiliate_commission_amount: String(order.affiliate_commission_amount || 0),
  });
  const selectedTemplate = editing ? templates.find((item) => item.code === editing.template_code) : null;
  const selectedPackages = selectedTemplate?.packages || [];
  const updateProduct = (templateCode, packageCode) => {
    const nextTemplate = templates.find((item) => item.code === templateCode);
    const nextPackage = nextTemplate?.packages?.find((item) => item.code === packageCode) || nextTemplate?.packages?.[0];
    const percent = editing?.affiliate_id !== 'none' ? Number(nextPackage?.affiliate_commission_default_percent || 0) : 0;
    setEditing((current) => ({ ...current, template_code: nextTemplate?.code || '', package_code: nextPackage?.code || '', affiliate_commission_percent: String(percent), affiliate_commission_amount: String(Math.round(Number(nextPackage?.price || 0) * percent / 100)) }));
  };
  const updateAffiliate = (affiliateId) => {
    const packageInfo = selectedPackages.find((item) => item.code === editing.package_code);
    const percent = affiliateId === 'none' ? 0 : Number(packageInfo?.affiliate_commission_default_percent || editing.affiliate_commission_percent || 0);
    setEditing((current) => ({ ...current, affiliate_id: affiliateId, affiliate_commission_percent: String(percent), affiliate_commission_amount: String(affiliateId === 'none' ? 0 : Math.round(Number(packageInfo?.price || 0) * percent / 100)) }));
  };
  const submitEdit = async (event) => {
    event.preventDefault();
    if (await onSave(editing.order_code, { ...editing, affiliate_id: editing.affiliate_id === 'none' ? null : editing.affiliate_id })) {
      setEditing(null);
      setDetail(null);
    }
  };

  return <>
    <section className="admin-order-history-summary">
      <div><span>Pesanan ditemukan</span><strong>{filtered.length}</strong><small>dari {orders.length} seluruh data</small></div>
      <div><span>Pesanan lunas</span><strong>{filtered.filter((item) => item.payment_status === 'paid').length}</strong><small>sesuai filter aktif</small></div>
      <div><span>Nilai pembayaran</span><strong>{money(paidTotal)}</strong><small>total status lunas</small></div>
      <div
        className="is-clickable"
        role="button"
        tabIndex={0}
        onClick={() => setShowCommissionModal(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setShowCommissionModal(true);
          }
        }}
        title="Klik untuk melihat rincian total komisi per affiliate"
      >
        <div className="summary-title-row">
          <span>Total komisi affiliate</span>
          <span className="summary-badge-action">Rincian ↗</span>
        </div>
        <strong>{money(affiliateCommissionTotal)}</strong>
        <small>
          {activeAffiliatesCount > 0
            ? `${activeAffiliatesCount} affiliate · ${affiliatePaidOrders.length} order referral lunas`
            : 'Klik untuk rincian affiliate'}
        </small>
      </div>
    </section>
    <section className="admin-order-history-filter">
      <label className="admin-order-search"><span>Cari pesanan</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Invoice, customer, email, HP, atau ID transaksi"/></label>
      <AdminFilterDropdown label="Status pesanan" value={status} options={statusOptions} onChange={setStatus}/>
      <AdminFilterDropdown label="Nama affiliate" value={affiliate} options={affiliateFilterOptions} onChange={setAffiliate}/>
      <AdminFilterDropdown label="Template" value={template} options={templateFilterOptions} onChange={setTemplate}/>
      <label><span>Dari tanggal</span><input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)}/></label>
      <label><span>Sampai tanggal</span><input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)}/></label>
      <div className="admin-order-filter-footer"><small>{filtered.length} data ditampilkan tanpa request baru</small><div><button type="button" className="reset" onClick={resetFilters}>Reset filter</button><button type="button" className="reload" onClick={onReload}>Muat ulang</button></div></div>
    </section>
    <section className="admin-order-history-list">
      <div className="admin-section-heading"><div><span className="eyebrow">ARSIP TRANSAKSI</span><h2>Riwayat pesanan</h2></div><span className="admin-count">Maksimal 10 data per halaman</span></div>
      <div className="admin-order-table-wrap"><table className="admin-order-history-table"><thead><tr><th>Invoice</th><th>Customer</th><th>Template</th><th>Affiliate</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr></thead><tbody>{pageItems.length ? pageItems.map((order) => <tr key={order.id || order.order_code}><td><strong>{order.order_code}</strong><small>{orderStatusLabel(order.status)}</small></td><td><strong>{order.customer_name}</strong><small>{order.customer_email}</small><small>{order.customer_phone}</small></td><td><strong>{order.template_name || '-'}</strong><small>{order.package_name || '-'} · {money(order.package_price)}</small></td><td>{order.affiliate_id ? <><strong>{order.affiliate_name || order.referral_name || 'Affiliate'}</strong><small>Kode referral: {order.affiliate_referral_code || '-'}</small><small>{order.affiliate_email || '-'}</small><small>Komisi: {money(order.affiliate_commission_amount)}</small></> : <span className="admin-order-direct">Pesanan langsung</span>}</td><td><span className={`admin-pill ${order.payment_status}`}>{statusLabel(order.payment_status)}</span><small>{money(order.payment_amount || order.package_price)}</small></td><td><strong>{order.created_at ? dateFormat.format(new Date(order.created_at)) : '-'}</strong>{order.paid_at && <small>Lunas {dateFormat.format(new Date(order.paid_at))}</small>}</td><td><div className="admin-order-actions"><button type="button" className="detail" onClick={() => setDetail(order)}>Detail</button><button type="button" className="edit" onClick={() => editOrder(order)}>Edit</button>{order.website_active ? <button type="button" className="web-btn-toggle deactivate" disabled={working === `website:${order.order_code}`} onClick={() => { if (window.confirm(`Nonaktifkan website undangan untuk ${order.customer_name} (${order.order_code})?`)) { onSaveWebsite?.(order, { active: false }); } }} title="Nonaktifkan website undangan">{working === `website:${order.order_code}` ? '...' : 'Nonaktifkan'}</button> : <button type="button" className="web-btn-toggle activate" disabled={working === `website:${order.order_code}`} onClick={() => onSaveWebsite?.(order, { active: true })} title="Aktifkan website undangan">{working === `website:${order.order_code}` ? '...' : 'Aktifkan'}</button>}<button type="button" className="web-btn-extend" disabled={working === `website:${order.order_code}`} onClick={() => setExtendingOrder(order)} title="Perpanjang masa aktif website">Perpanjang</button></div></td></tr>) : <tr><td className="admin-order-empty" colSpan="7">Tidak ada pesanan yang cocok dengan filter.</td></tr>}</tbody></table></div>
      {filtered.length > 0 && <div className="admin-affiliate-pagination"><span>Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} dari {filtered.length} data</span><nav aria-label="Halaman riwayat pesanan"><button type="button" className="direction" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button>{paginationItems.map((item) => typeof item === 'number' ? <button type="button" className={item === currentPage ? 'is-active' : ''} aria-current={item === currentPage ? 'page' : undefined} key={item} onClick={() => setPage(item)}>{item}</button> : <span className="ellipsis" key={item}>…</span>)}<button type="button" className="direction" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>›</button></nav></div>}
    </section>
    {detail && <div className="admin-order-modal" role="dialog" aria-modal="true" aria-label={`Detail pesanan ${detail.order_code}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setDetail(null); }}><article className="admin-order-detail-card"><header><div><span className="eyebrow">DETAIL PESANAN</span><h2>{detail.order_code}</h2><p>{detail.customer_name} · {detail.customer_email}</p></div><button type="button" className="close" onClick={() => setDetail(null)} aria-label="Tutup">×</button></header><div className="admin-order-detail-grid"><section><span>Customer</span><dl><div><dt>Nama</dt><dd>{detail.customer_name}</dd></div><div><dt>Email</dt><dd>{detail.customer_email}</dd></div><div><dt>WhatsApp</dt><dd>{detail.customer_phone}</dd></div></dl></section><section><span>Produk</span><dl><div><dt>Template</dt><dd>{detail.template_name || '-'}</dd></div><div><dt>Paket</dt><dd>{detail.package_name || '-'}</dd></div><div><dt>Harga</dt><dd>{money(detail.package_price)}</dd></div></dl></section><section><span>Pembayaran</span><dl><div><dt>Status</dt><dd>{statusLabel(detail.payment_status)}</dd></div><div><dt>Nominal</dt><dd>{money(detail.payment_amount || detail.package_price)}</dd></div><div><dt>Gateway</dt><dd>{detail.gateway || '-'}</dd></div><div><dt>ID transaksi</dt><dd>{detail.transaction_id || detail.gateway_order_id || '-'}</dd></div></dl></section><section><span>Affiliate</span><dl><div><dt>Nama</dt><dd>{detail.affiliate_name || 'Pesanan langsung'}</dd></div><div><dt>Email</dt><dd>{detail.affiliate_email || '-'}</dd></div><div><dt>Kode referral</dt><dd>{detail.affiliate_referral_code || '-'}</dd></div><div><dt>Komisi</dt><dd>{Number(detail.affiliate_commission_percent || 0).toLocaleString('id-ID')}% · {money(detail.affiliate_commission_amount)}</dd></div></dl></section><section><span>Website &amp; Masa Aktif</span><dl><div><dt>Status order</dt><dd>{orderStatusLabel(detail.status)}</dd></div><div><dt>Status website</dt><dd><span className={`admin-pill ${detail.website_active ? 'paid' : (detail.active_until && new Date(detail.active_until) <= new Date()) ? 'expired' : 'waiting'}`}>{detail.website_active ? 'Aktif' : (detail.active_until && new Date(detail.active_until) <= new Date()) ? 'Kadaluarsa' : 'Nonaktif'}</span></dd></div><div><dt>Masa aktif</dt><dd>{detail.active_until ? dateFormat.format(new Date(detail.active_until)) : 'Belum diatur'}</dd></div><div><dt>URL Website</dt><dd>{detail.website_url ? <a href={detail.website_url} target="_blank" rel="noreferrer">Buka website</a> : '-'}</dd></div><div><dt>Editor</dt><dd>{detail.editor_url ? <a href={detail.editor_url} target="_blank" rel="noreferrer">Buka editor</a> : '-'}</dd></div></dl><div className="admin-order-modal-web-actions">{detail.website_active ? <button type="button" className="web-btn-toggle deactivate" disabled={working === `website:${detail.order_code}`} onClick={async () => { if (window.confirm(`Nonaktifkan website undangan untuk ${detail.customer_name} (${detail.order_code})?`)) { const ok = await onSaveWebsite?.(detail, { active: false }); if (ok) setDetail((prev) => ({ ...prev, website_active: false, website_enabled: false })); } }}>{working === `website:${detail.order_code}` ? 'Menyimpan...' : 'Nonaktifkan Website'}</button> : <button type="button" className="web-btn-toggle activate" disabled={working === `website:${detail.order_code}`} onClick={async () => { const ok = await onSaveWebsite?.(detail, { active: true }); if (ok) setDetail((prev) => ({ ...prev, website_active: true, website_enabled: true })); }}>{working === `website:${detail.order_code}` ? 'Menyimpan...' : 'Aktifkan Website'}</button>}<button type="button" className="web-btn-extend" disabled={working === `website:${detail.order_code}`} onClick={() => setExtendingOrder(detail)}>Perpanjang Masa Aktif</button></div></section><section><span>Waktu</span><dl><div><dt>Dibuat</dt><dd>{detail.created_at ? dateFormat.format(new Date(detail.created_at)) : '-'}</dd></div><div><dt>Lunas</dt><dd>{detail.paid_at ? dateFormat.format(new Date(detail.paid_at)) : '-'}</dd></div><div><dt>Diperbarui</dt><dd>{detail.updated_at ? dateFormat.format(new Date(detail.updated_at)) : '-'}</dd></div></dl></section></div><footer><button type="button" onClick={() => setDetail(null)}>Tutup</button><button type="button" className="edit" onClick={() => { editOrder(detail); setDetail(null); }}>Edit pesanan</button></footer></article></div>}
    {editing && <div className="admin-order-modal" role="dialog" aria-modal="true" aria-label={`Edit pesanan ${editing.order_code}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}><form className="admin-order-edit-card" onSubmit={submitEdit}><header><div><span className="eyebrow">KOREKSI DATA</span><h2>Edit {editing.order_code}</h2><p>Perubahan hanya berlaku pada pesanan ini.</p></div><button type="button" className="close" onClick={() => setEditing(null)} aria-label="Tutup">×</button></header><div className="admin-order-edit-fields"><label><span>Nama customer</span><input required minLength="2" maxLength="120" value={editing.customer_name} onChange={(event) => setEditing({ ...editing, customer_name: event.target.value })}/></label><label><span>Email</span><input required type="email" maxLength="254" value={editing.customer_email} onChange={(event) => setEditing({ ...editing, customer_email: event.target.value })}/></label><label><span>Nomor WhatsApp</span><input required type="tel" maxLength="24" value={editing.customer_phone} onChange={(event) => setEditing({ ...editing, customer_phone: event.target.value })}/></label><label><span>Slug URL undangan</span><input maxLength="120" placeholder="andi-nisa" value={editing.slug || ''} onChange={(event) => setEditing({ ...editing, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}/><small>Alamat publik website (contoh: daymoment.id/{editing.slug || 'slug'})</small></label><AdminFilterDropdown label="Template" value={editing.template_code} options={templates.map((item) => ({ value: item.code, label: item.name, description: item.category || '' }))} onChange={(value) => updateProduct(value, '')}/><AdminFilterDropdown label="Paket" value={editing.package_code} options={selectedPackages.map((item) => ({ value: item.code, label: item.name, description: money(item.price) }))} onChange={(value) => updateProduct(editing.template_code, value)}/><AdminFilterDropdown label="Status order" value={editing.status} options={[{ value: 'waiting_payment', label: 'Menunggu pembayaran' }, { value: 'editing', label: 'Sedang diedit' }, { value: 'published', label: 'Sudah diterbitkan' }, { value: 'cancelled', label: 'Dibatalkan' }]} onChange={(value) => setEditing({ ...editing, status: value })}/><AdminFilterDropdown label="Status pembayaran" value={editing.payment_status} options={paymentStatusOptions} onChange={(value) => setEditing({ ...editing, payment_status: value })}/><label><span>Nominal pembayaran</span><div className="admin-order-money"><b>Rp</b><input required inputMode="numeric" value={formatRupiahInput(editing.payment_amount)} onChange={(event) => setEditing({ ...editing, payment_amount: event.target.value.replace(/\D/g, '') })}/></div></label><AdminFilterDropdown label="Affiliate" value={editing.affiliate_id} options={[{ value: 'none', label: 'Tanpa affiliate', description: 'Pesanan langsung' }, ...affiliateChoices.map((item) => ({ value: String(item.id), label: item.full_name || item.email, description: `${item.email || 'Email belum tersedia'}${item.referral_code ? ` · ${item.referral_code}` : ''}` }))]} onChange={updateAffiliate}/><label><span>Komisi affiliate (%)</span><input type="number" min="0" max="100" step="0.01" disabled={editing.affiliate_id === 'none'} value={editing.affiliate_commission_percent} onChange={(event) => setEditing({ ...editing, affiliate_commission_percent: event.target.value })}/></label><label><span>Nominal komisi</span><div className="admin-order-money"><b>Rp</b><input inputMode="numeric" disabled={editing.affiliate_id === 'none'} value={formatRupiahInput(editing.affiliate_commission_amount)} onChange={(event) => setEditing({ ...editing, affiliate_commission_amount: event.target.value.replace(/\D/g, '') })}/></div></label></div><div className="admin-order-edit-warning"><strong>Periksa sebelum menyimpan.</strong><span>Mengganti template, paket, status, atau affiliate dapat memengaruhi akses dan laporan pesanan ini. Komisi lama tidak dihitung ulang kecuali nilainya diubah di formulir.</span></div><footer><button type="button" onClick={() => setEditing(null)}>Batal</button><button type="submit" className="save" disabled={working === `order:${editing.order_code}`}>{working === `order:${editing.order_code}` ? 'Menyimpan...' : 'Simpan perubahan'}</button></footer></form></div>}
    {extendingOrder && (
      <ExtendWebsiteModal
        order={extendingOrder}
        working={working}
        onClose={() => setExtendingOrder(null)}
        onSave={async (ord, val) => {
          const ok = await onSaveWebsite?.(ord, val);
          if (ok && detail && detail.order_code === ord.order_code) {
            setDetail((prev) => ({ ...prev, website_active: true, website_enabled: true, active_until: val.active_until }));
          }
          return ok;
        }}
      />
    )}
    <AffiliateCommissionBreakdownModal
      open={showCommissionModal}
      onClose={() => setShowCommissionModal(false)}
      commissionTotal={affiliateCommissionTotal}
      referralSalesTotal={totalReferralSales}
      paidOrdersCount={affiliatePaidOrders.length}
      breakdown={commissionBreakdown}
      onSelectAffiliate={setAffiliate}
      onViewOrder={setDetail}
    />
  </>;
}

const proUpgradeStatusLabel = (status) => ({
  pending: 'Menunggu review',
  approved: 'Disetujui',
  paid: 'Lunas',
  rejected: 'Ditolak',
  failed: 'Pembayaran gagal',
  expired: 'Kedaluwarsa',
  cancelled: 'Dibatalkan',
}[status] || status);

function ProUpgradeHistory({ entries, currentRequestId, open, onToggle, onPreview }) {
  if (!entries.length) return null;
  return <div className="admin-pro-history">
    <button type="button" className="admin-pro-history-toggle" aria-expanded={open} onClick={onToggle}><span><b>Riwayat pengajuan</b><small>Lihat data yang diperbarui dan catatan admin</small></span><em>{entries.length} pengajuan</em><i aria-hidden="true"/></button>
    {open && <ol>{entries.map((entry, index) => {
      const previous = entries[index - 1];
      const changes = [];
      if (!previous) changes.push('Pengajuan pertama');
      if (previous && previous.social_platform !== entry.social_platform) changes.push(`Media sosial: ${previous.social_platform || '-'} → ${entry.social_platform || '-'}`);
      if (previous && previous.social_handle !== entry.social_handle) changes.push(`Username: ${previous.social_handle || '-'} → ${entry.social_handle || '-'}`);
      if (previous && Number(previous.follower_count || 0) !== Number(entry.follower_count || 0)) changes.push(`Followers: ${Number(previous.follower_count || 0).toLocaleString('id-ID')} → ${Number(entry.follower_count || 0).toLocaleString('id-ID')}`);
      if (previous) changes.push('Screenshot bukti dikirim ulang');
      return <li className={`status-${entry.status} ${entry.id === currentRequestId ? 'is-current' : ''}`} key={entry.id}>
        <div className="admin-pro-history-head"><span><b>Pengajuan ke-{index + 1}</b>{entry.id === currentRequestId && <em>Sedang dilihat</em>}</span><span className={`admin-pro-badge status-${entry.status}`}>{proUpgradeStatusLabel(entry.status)}</span></div>
        <time dateTime={entry.created_at}>{entry.created_at ? dateFormat.format(new Date(entry.created_at)) : '-'}</time>
        <dl><div><dt>Platform</dt><dd>{entry.social_platform || '-'}</dd></div><div><dt>Username</dt><dd>{entry.social_handle || '-'}</dd></div><div><dt>Followers</dt><dd>{Number(entry.follower_count || 0).toLocaleString('id-ID')}</dd></div></dl>
        <div className="admin-pro-history-changes"><strong>{previous ? 'Yang diperbarui' : 'Awal pengajuan'}</strong><div>{changes.map((change) => <span key={change}>{change}</span>)}</div></div>
        {entry.review_note && <p className="admin-pro-history-note"><b>Catatan admin:</b> {entry.review_note}{entry.reviewed_at && <small>Direview {dateFormat.format(new Date(entry.reviewed_at))}</small>}</p>}
        {entry.proof_url && <button type="button" className="admin-pro-history-proof" onClick={() => onPreview({ url: entry.proof_url, name: `${entry.account?.full_name || 'Affiliate'} · Pengajuan ke-${index + 1}` })}>Lihat screenshot pengajuan ke-{index + 1}</button>}
      </li>;
    })}</ol>}
  </div>;
}

function AffiliateReviewPanel({ data, loading, error, working, platformWorking, onReload, onReview, onResendCorrection, onAddPlatform, onTogglePlatform }) {
  const [notes, setNotes] = useState({});
  const [preview, setPreview] = useState(null);
  const [openHistories, setOpenHistories] = useState({});
  const [platformName, setPlatformName] = useState('');
  const [filters, setFilters] = useState({ query: '', status: 'pending_verified', dateType: 'none', dateFrom: '', dateTo: '' });
  const [page, setPage] = useState(1);
  const affiliates = (data?.affiliates || []).filter((affiliate) => affiliate.status !== 'suspended');

  useEffect(() => {
    if (!preview) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setPreview(null); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [preview]);

  const filteredAffiliates = useMemo(() => affiliates.filter((affiliate) => {
    const query = filters.query.trim().toLowerCase();
    const matchesQuery = !query || `${affiliate.full_name || ''} ${affiliate.nik || ''} ${affiliate.email || ''} ${affiliate.phone || ''} ${affiliate.social_platform || ''} ${affiliate.social_handle || ''}`.toLowerCase().includes(query);
    let matchesStatus = false;
    if (filters.status === 'all') matchesStatus = true;
    else if (filters.status === 'pending_verified') matchesStatus = affiliate.status === 'pending' && Boolean(affiliate.email_verified_at);
    else if (filters.status === 'pending_unverified') matchesStatus = affiliate.status === 'pending' && !affiliate.email_verified_at;
    else matchesStatus = affiliate.status === filters.status;
    const selectedDate = filters.dateType === 'registered' ? affiliate.created_at
      : filters.dateType === 'verified' ? affiliate.email_verified_at : null;
    const date = selectedDate ? String(selectedDate).slice(0, 10) : '';
    const matchesDate = filters.dateType === 'none'
      || (Boolean(date) && (!filters.dateFrom || date >= filters.dateFrom) && (!filters.dateTo || date <= filters.dateTo));
    return matchesQuery && matchesStatus && matchesDate;
  }), [affiliates, filters]);

  const pageCount = Math.max(1, Math.ceil(filteredAffiliates.length / 10));
  const pageItems = filteredAffiliates.slice((page - 1) * 10, page * 10);
  const paginationItems = affiliatePaginationItems(page, pageCount);

  useEffect(() => { setPage(1); }, [filters.query, filters.status, filters.dateType, filters.dateFrom, filters.dateTo]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const resetFilters = () => setFilters({ query: '', status: 'pending_verified', dateType: 'none', dateFrom: '', dateTo: '' });
  const addPlatform = async (event) => {
    event.preventDefault();
    const saved = await onAddPlatform(platformName);
    if (saved) setPlatformName('');
  };
  const card = (affiliate) => {
    const reviewHistory = Array.isArray(affiliate.review_history) ? affiliate.review_history : [];
    const historyOpen = Boolean(openHistories[affiliate.id]);
    const historyLabel = { rejected: 'Pendaftaran ditolak', resubmitted: 'Mengajukan kembali', approved: 'Pendaftaran disetujui' };
    return <article className="admin-affiliate-review-card" key={affiliate.id}>
    <div className="admin-affiliate-identity-media">
      <div className="admin-affiliate-ktp">{affiliate.ktp_url ? <button type="button" onClick={() => setPreview({ src: affiliate.ktp_url, name: affiliate.full_name, label: 'Foto KTP' })} aria-label={`Perbesar foto KTP ${affiliate.full_name}`}><img src={affiliate.ktp_url} alt={`KTP ${affiliate.full_name}`} loading="lazy"/><span>Foto KTP · klik untuk memperbesar</span></button> : <span>Foto KTP tidak tersedia</span>}</div>
      <div className="admin-affiliate-ktp admin-affiliate-social-proof">{affiliate.social_proof_url ? <button type="button" onClick={() => setPreview({ src: affiliate.social_proof_url, name: affiliate.full_name, label: 'Bukti media sosial' })} aria-label={`Perbesar bukti media sosial ${affiliate.full_name}`}><img src={affiliate.social_proof_url} alt={`Media sosial ${affiliate.full_name}`} loading="lazy"/><span>Bukti media sosial · klik untuk memperbesar</span></button> : <span>Bukti media sosial tidak tersedia</span>}</div>
    </div>
    <div className="admin-affiliate-review-info">
      <div className="admin-affiliate-review-title"><div><span className="eyebrow">PENDAFTAR AFFILIATE</span><h2>{affiliate.full_name}</h2></div><span className={`admin-affiliate-status status-${affiliate.status}`}>{affiliate.status === 'pending' ? affiliate.resubmitted_at ? 'Dikirim ulang' : 'Menunggu review' : affiliate.status === 'active' ? 'Disetujui' : affiliate.status === 'rejected' ? 'Ditolak' : affiliate.status}</span></div>
      <dl><div><dt>NIK</dt><dd>{affiliate.nik || '-'}</dd></div><div><dt>Email</dt><dd>{affiliate.email}</dd></div><div><dt>WhatsApp</dt><dd>{affiliate.phone}</dd></div><div><dt>Email terverifikasi</dt><dd>{affiliate.email_verified_at ? dateFormat.format(new Date(affiliate.email_verified_at)) : 'Belum'}</dd></div><div><dt>Media sosial</dt><dd>{affiliate.social_platform || '-'}</dd></div><div><dt>Username</dt><dd>{affiliate.social_handle || '-'}</dd></div><div><dt>Followers</dt><dd>{affiliate.social_follower_count != null ? affiliate.social_follower_count.toLocaleString('id-ID') : '-'}</dd></div><div><dt>Daftar</dt><dd>{affiliate.created_at ? dateFormat.format(new Date(affiliate.created_at)) : '-'}</dd></div>{affiliate.resubmitted_at && <div><dt>Dikirim ulang</dt><dd>{dateFormat.format(new Date(affiliate.resubmitted_at))}</dd></div>}</dl>
      <p className="admin-affiliate-match-note"><b>Wajib diperiksa:</b> kesesuaian nama, NIK, foto KTP, username, followers, dan screenshot media sosial.</p>
      {reviewHistory.length > 0 && <div className="admin-affiliate-history">
        <button type="button" className="admin-affiliate-history-toggle" aria-expanded={historyOpen} onClick={() => setOpenHistories((current) => ({ ...current, [affiliate.id]: !current[affiliate.id] }))}><span>Riwayat penolakan & pengajuan</span><small>{reviewHistory.length} aktivitas</small><i aria-hidden="true"/></button>
        {historyOpen && <ol>{reviewHistory.map((entry) => <li className={`history-${entry.action}`} key={entry.id}><i aria-hidden="true"/><div><strong>{historyLabel[entry.action] || entry.action}</strong><time dateTime={entry.created_at}>{entry.created_at ? dateFormat.format(new Date(entry.created_at)) : '-'}</time>{entry.note && <p>Alasan/catatan: {entry.note}</p>}</div></li>)}</ol>}
      </div>}
      {affiliate.status === 'pending' ? <div className="admin-affiliate-review-actions"><label><span>Catatan review (wajib jika ditolak)</span><textarea rows="2" maxLength="500" value={notes[affiliate.id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [affiliate.id]: event.target.value }))} placeholder="Contoh: foto kurang jelas atau data tidak sesuai"/></label><div><button className="admin-affiliate-reject" type="button" disabled={working === affiliate.id || !(notes[affiliate.id] || '').trim()} title={!(notes[affiliate.id] || '').trim() ? 'Isi alasan penolakan terlebih dahulu' : ''} onClick={() => onReview(affiliate.id, 'rejected', notes[affiliate.id])}>{working === affiliate.id ? 'Memproses...' : 'Tolak'}</button><button className="admin-affiliate-approve" type="button" disabled={working === affiliate.id || !affiliate.email_verified_at} title={!affiliate.email_verified_at ? 'Email belum diverifikasi' : ''} onClick={() => onReview(affiliate.id, 'approved', notes[affiliate.id])}>{working === affiliate.id ? 'Memproses...' : 'Setujui akun'}</button></div></div> : <div className="admin-affiliate-review-history">{affiliate.review_note && <p className="admin-affiliate-review-note">Catatan admin: {affiliate.review_note}</p>}{affiliate.status === 'rejected' && <button className="admin-affiliate-resend" type="button" disabled={working === `resend:${affiliate.id}`} onClick={() => onResendCorrection(affiliate.id)}>{working === `resend:${affiliate.id}` ? 'Mengirim email…' : 'Kirim ulang link perbaikan'}</button>}</div>}
    </div>
  </article>;
  };
  if (loading) return <div className="admin-affiliate-review-state">Memuat pendaftaran affiliate...</div>;
  if (error) return <div className="admin-affiliate-review-state is-error"><span>{error}</span><button type="button" onClick={onReload}>Coba lagi</button></div>;
  return <>
    <div className="admin-affiliate-review-summary"><article><span>Menunggu review</span><strong>{data?.summary?.pending || 0}</strong></article><article><span>Affiliate aktif</span><strong>{data?.summary?.active || 0}</strong></article><article><span>Ditolak</span><strong>{data?.summary?.rejected || 0}</strong></article></div>
    <section className="admin-social-platform-settings admin-panel">
      <div><span className="eyebrow">PILIHAN REGISTRASI</span><h2>Kelola platform media sosial</h2><p>Tambah platform baru atau klik daftar di bawah untuk mengaktifkan dan menonaktifkannya pada form affiliate.</p></div>
      <form onSubmit={addPlatform} className="admin-social-platform-form"><input value={platformName} onChange={(event) => setPlatformName(event.target.value)} maxLength="40" placeholder="Contoh: LinkedIn, Threads, YouTube" aria-label="Nama platform media sosial baru"/><button type="submit" disabled={Boolean(platformWorking)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg><span>{platformWorking === 'platform:add' ? 'Menyimpan...' : 'Tambah platform'}</span></button></form>
      <div className="admin-social-platform-list">{(data?.social_platforms || []).map((platform) => <button type="button" className={platform.is_active ? 'is-active' : ''} disabled={Boolean(platformWorking)} key={platform.id} onClick={() => onTogglePlatform(platform)} title={`Klik untuk ${platform.is_active ? 'menonaktifkan' : 'mengaktifkan'} ${platform.name}`}><span>{platform.name}</span><small>{platform.is_active ? 'Aktif' : 'Nonaktif'}</small></button>)}</div>
    </section>
    <section className="admin-affiliate-filters" aria-label="Filter pendaftaran affiliate">
      <label className="admin-affiliate-search"><span>Cari pendaftar</span><input type="search" value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Nama, NIK, email, nomor HP, atau akun sosial"/></label>
      <AdminFilterDropdown label="Status" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={[{ value: 'pending_verified', label: 'Antrean terverifikasi', description: 'Email sudah terverifikasi' }, { value: 'pending_unverified', label: 'Menunggu verifikasi', description: 'Email belum diverifikasi' }, { value: 'active', label: 'Disetujui' }, { value: 'rejected', label: 'Ditolak' }, { value: 'all', label: 'Semua status' }]}/>
      <AdminFilterDropdown label="Jenis tanggal" value={filters.dateType} onChange={(value) => setFilters((current) => ({ ...current, dateType: value, dateFrom: value === 'none' ? '' : current.dateFrom, dateTo: value === 'none' ? '' : current.dateTo }))} options={[{ value: 'none', label: 'Tanpa filter tanggal' }, { value: 'registered', label: 'Tanggal daftar', description: 'Waktu pendaftaran dibuat' }, { value: 'verified', label: 'Tanggal verifikasi email', description: 'Waktu email dikonfirmasi' }]}/>
      <label><span>Dari tanggal</span><input type="date" disabled={filters.dateType === 'none'} value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}/></label>
      <label><span>Sampai tanggal</span><input type="date" disabled={filters.dateType === 'none'} value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}/></label>
      <div className="admin-affiliate-filter-footer"><span>{filteredAffiliates.length} dari {affiliates.length} pendaftaran ditampilkan</span><button type="button" onClick={resetFilters}>Reset filter</button></div>
    </section>
    <section className="admin-affiliate-review-list"><div className="admin-section-heading"><div><span className="eyebrow">VERIFIKASI IDENTITAS</span><h2>Data pendaftaran</h2></div><button className="button button-secondary" type="button" onClick={onReload}>Muat ulang</button></div>{pageItems.length ? pageItems.map(card) : <div className="admin-affiliate-review-state">Tidak ada pendaftaran yang cocok dengan filter.</div>}{filteredAffiliates.length > 0 && <div className="admin-affiliate-pagination"><span>Menampilkan {(page - 1) * 10 + 1}–{Math.min(page * 10, filteredAffiliates.length)} dari {filteredAffiliates.length} data</span><nav aria-label="Halaman pendaftaran affiliate"><button type="button" className="direction" aria-label="Halaman sebelumnya" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>‹</button>{paginationItems.map((item) => typeof item === 'number' ? <button type="button" className={item === page ? 'is-active' : ''} aria-current={item === page ? 'page' : undefined} key={item} onClick={() => setPage(item)}>{item}</button> : <span className="ellipsis" aria-hidden="true" key={item}>…</span>)}<button type="button" className="direction" aria-label="Halaman berikutnya" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>›</button></nav></div>}</section>
    {preview && <div className="admin-ktp-lightbox" role="dialog" aria-modal="true" aria-label={`${preview.label || 'Dokumen'} ${preview.name}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}><div><header><span>{preview.label || 'Dokumen'} · {preview.name}</span><button type="button" onClick={() => setPreview(null)} aria-label="Tutup preview">×</button></header><img src={preview.src} alt={`${preview.label || 'Dokumen'} ${preview.name}`}/></div></div>}
  </>;
}

function ProUpgradeReviewPanel({ data, loading, error, working, onReload, onReview, onAddPlatform, onTogglePlatform }) {
  const [status, setStatus] = useState('pending');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState({});
  const [openHistories, setOpenHistories] = useState({});
  const [preview, setPreview] = useState(null);
  const [platformName, setPlatformName] = useState('');
  const requests = data?.requests || [];
  const platforms = data?.social_platforms || [];
  const filtered = useMemo(() => requests.filter((item) => {
    const date = item.created_at ? String(item.created_at).slice(0, 10) : '';
    const matchesStatus = status === 'all' || item.status === status;
    const matchesDate = Boolean(date) && (!dateFrom || date >= dateFrom) && (!dateTo || date <= dateTo);
    return matchesStatus && matchesDate;
  }), [requests, status, dateFrom, dateTo]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const pageItems = filtered.slice((page - 1) * 10, page * 10);
  const paginationItems = affiliatePaginationItems(page, pageCount);
  const requestHistories = useMemo(() => {
    const histories = new Map();
    requests.filter((request) => request.method === 'social').forEach((request) => {
      const entries = histories.get(request.affiliate_id) || [];
      entries.push(request);
      histories.set(request.affiliate_id, entries);
    });
    histories.forEach((entries) => entries.sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime()));
    return histories;
  }, [requests]);
  const attemptNumbers = useMemo(() => {
    const attempts = new Map();
    requestHistories.forEach((entries) => {
      entries.forEach((request, index) => attempts.set(request.id, index + 1));
    });
    return attempts;
  }, [requestHistories]);
  const hasActiveFilters = status !== 'pending' || Boolean(dateFrom) || Boolean(dateTo);
  const submitPlatform = async (event) => {
    event.preventDefault();
    if (await onAddPlatform(platformName)) setPlatformName('');
  };
  useEffect(() => {
    if (!preview) return undefined;
    const close = (event) => { if (event.key === 'Escape') setPreview(null); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [preview]);
  useEffect(() => { setPage(1); }, [status, dateFrom, dateTo]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  const resetFilters = () => {
    setStatus('pending');
    setDateFrom('');
    setDateTo('');
  };
  if (loading) return <div className="admin-affiliate-review-state">Memuat pengajuan upgrade Pro...</div>;
  if (error) return <div className="admin-affiliate-review-state is-error"><span>{error}</span><button type="button" onClick={onReload}>Coba lagi</button></div>;
  return <>
    <section className="admin-pro-platform-settings">
      <header><div><span>PILIHAN VERIFIKASI</span><h2>Media sosial affiliate</h2><p>Platform aktif akan muncul pada dropdown pengajuan upgrade Pro.</p></div><b>{platforms.filter((item) => item.is_active).length} aktif</b></header>
      <form onSubmit={submitPlatform}><label><span>Tambah media sosial</span><input value={platformName} onChange={(event) => setPlatformName(event.target.value)} minLength="2" maxLength="40" placeholder="Contoh: Threads" required/></label><button type="submit" disabled={working === 'platform:add'}>{working === 'platform:add' ? 'Menambahkan...' : 'Tambah platform +'}</button></form>
      <div className="admin-pro-platform-list">{platforms.map((platform, index) => <article className={platform.is_active ? 'is-active' : ''} key={platform.id}><i>{String(index + 1).padStart(2, '0')}</i><span><b>{platform.name}</b><small>{platform.is_active ? 'Tampil di dropdown affiliate' : 'Disembunyikan sementara'}</small></span><button type="button" className={platform.is_active ? 'disable' : 'enable'} disabled={working === `platform:${platform.id}`} onClick={() => onTogglePlatform(platform)}>{working === `platform:${platform.id}` ? 'Menyimpan...' : platform.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button></article>)}</div>
    </section>
    <div className="admin-affiliate-data-summary"><article><span>Menunggu review</span><strong>{data?.summary?.pending || 0}</strong></article><article><span>Upgrade berhasil</span><strong>{data?.summary?.approved || 0}</strong></article><article><span>Ditolak</span><strong>{data?.summary?.rejected || 0}</strong></article></div>
    <section className="admin-pro-filter">
      <AdminFilterDropdown label="Status pengajuan" value={status} onChange={setStatus} options={[{ value: 'pending', label: 'Menunggu review' }, { value: 'approved', label: 'Disetujui via sosial' }, { value: 'paid', label: 'Berhasil via pembayaran' }, { value: 'rejected', label: 'Ditolak' }, { value: 'failed', label: 'Pembayaran gagal' }, { value: 'expired', label: 'Kedaluwarsa' }, { value: 'cancelled', label: 'Dibatalkan' }, { value: 'all', label: 'Semua status' }]}/>
      <label><span>Dari tanggal</span><input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)}/></label>
      <label><span>Sampai tanggal</span><input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)}/></label>
      <div className="admin-pro-filter-actions"><button className="reset" type="button" disabled={!hasActiveFilters} onClick={resetFilters}>Reset filter</button><button type="button" onClick={onReload}>Muat ulang</button></div>
      <small>{filtered.length} dari {requests.length} pengajuan ditampilkan · filter berjalan tanpa request baru</small>
    </section>
    <section className="admin-pro-list">
      {pageItems.length ? pageItems.map((request) => <article className="admin-pro-card" key={request.id}>
        {request.proof_url ? <button className="admin-pro-proof" type="button" onClick={() => setPreview({ url: request.proof_url, name: request.account?.full_name || 'Affiliate' })}><img src={request.proof_url} alt={`Bukti media sosial ${request.account?.full_name || ''}`}/><span>Klik untuk memperbesar</span></button> : <div className="admin-pro-payment-mark"><span>Rp</span><b>{money(request.payment_amount)}</b><small>Midtrans</small></div>}
        <div className="admin-pro-info"><header><div><small>{request.method === 'social' ? `VERIFIKASI MEDIA SOSIAL · PENGAJUAN KE-${attemptNumbers.get(request.id) || 1}` : 'UPGRADE BERBAYAR'}</small><h2>{request.account?.full_name || 'Affiliate'}</h2><p>{request.account?.email || '-'}</p></div><span className={`admin-pro-badge status-${request.status}`}>{request.status === 'pending' ? 'Menunggu' : request.status === 'approved' ? 'Disetujui' : request.status === 'paid' ? 'Lunas' : request.status === 'rejected' ? 'Ditolak' : request.status}</span></header>
          {request.method === 'social' ? <dl><div><dt>Platform</dt><dd>{request.social_platform}</dd></div><div><dt>Akun</dt><dd>{request.social_handle}</dd></div><div><dt>Followers</dt><dd>{Number(request.follower_count || 0).toLocaleString('id-ID')}</dd></div><div><dt>Diajukan</dt><dd>{dateFormat.format(new Date(request.created_at))}</dd></div></dl> : <dl><div><dt>Nominal</dt><dd>{money(request.payment_amount)}</dd></div><div><dt>Order Midtrans</dt><dd>{request.gateway_order_id || '-'}</dd></div><div><dt>Transaksi</dt><dd>{request.transaction_id || '-'}</dd></div><div><dt>Dibayar</dt><dd>{request.paid_at ? dateFormat.format(new Date(request.paid_at)) : '-'}</dd></div></dl>}
          {request.review_note && <div className="admin-pro-review-note"><b>Catatan admin</b><span>{request.review_note}</span></div>}
          {request.method === 'social' && <ProUpgradeHistory
            entries={requestHistories.get(request.affiliate_id) || []}
            currentRequestId={request.id}
            open={Boolean(openHistories[request.id])}
            onToggle={() => setOpenHistories((current) => ({ ...current, [request.id]: !current[request.id] }))}
            onPreview={setPreview}
          />}
          {request.method === 'social' && request.status === 'pending' && <div className="admin-pro-actions"><label><span>Catatan review</span><textarea value={notes[request.id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))} maxLength="500" placeholder="Wajib diisi jika pengajuan ditolak. Jelaskan data yang harus diperbaiki."/></label><div><button className="reject" type="button" disabled={Boolean(working) || !(notes[request.id] || '').trim()} title={!(notes[request.id] || '').trim() ? 'Isi alasan dan bagian yang harus diperbaiki terlebih dahulu' : ''} onClick={() => onReview(request.id, 'rejected', notes[request.id] || '')}>{working === request.id ? 'Memproses...' : 'Tolak'}</button><button className="approve" type="button" disabled={Boolean(working)} onClick={() => onReview(request.id, 'approved', notes[request.id] || '')}>{working === request.id ? 'Memproses...' : 'Setujui Pro'}</button></div></div>}
        </div>
      </article>) : <div className="admin-affiliate-review-state">Tidak ada pengajuan yang cocok dengan filter.</div>}
      {filtered.length > 0 && <div className="admin-affiliate-pagination"><span>Menampilkan {(page - 1) * 10 + 1}–{Math.min(page * 10, filtered.length)} dari {filtered.length} data</span><nav aria-label="Halaman pengajuan upgrade Pro"><button type="button" className="direction" aria-label="Halaman sebelumnya" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>‹</button>{paginationItems.map((item) => typeof item === 'number' ? <button type="button" className={item === page ? 'is-active' : ''} aria-current={item === page ? 'page' : undefined} key={item} onClick={() => setPage(item)}>{item}</button> : <span className="ellipsis" aria-hidden="true" key={item}>…</span>)}<button type="button" className="direction" aria-label="Halaman berikutnya" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>›</button></nav></div>}
    </section>
    {preview && <div className="admin-ktp-lightbox" role="dialog" aria-modal="true" aria-label={`Bukti sosial ${preview.name}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}><div><header><span>Bukti media sosial · {preview.name}</span><button type="button" aria-label="Tutup bukti sosial" onClick={() => setPreview(null)}>×</button></header><img src={preview.url} alt={`Bukti media sosial ${preview.name}`}/></div></div>}
  </>;
}

function WithdrawalManagementPanel({ data, loading, error, working, onReload, onSaveSettings, onProcess }) {
  const [filters, setFilters] = useState({ query: '', status: 'all', dateFrom: '', dateTo: '' });
  const [page, setPage] = useState(1);
  const [settings, setSettings] = useState({ min_withdrawal_amount: '50000', fee_percent: '', sender_bank_name: '', sender_account_name: '', sender_account_number: '' });
  const [drafts, setDrafts] = useState({});
  const [preview, setPreview] = useState(null);
  const withdrawals = data?.withdrawals || [];

  useEffect(() => {
    if (!data?.settings) return;
    setSettings({
      min_withdrawal_amount: String(data.settings.min_withdrawal_amount ?? 50000),
      fee_percent: String(data.settings.fee_percent ?? 0),
      sender_bank_name: data.settings.sender_bank_name || '',
      sender_account_name: data.settings.sender_account_name || '',
      sender_account_number: data.settings.sender_account_number || '',
    });
  }, [data?.settings]);

  const scopedWithdrawals = useMemo(() => withdrawals.filter((item) => {
    const query = filters.query.trim().toLowerCase();
    const haystack = `${item.affiliate?.full_name || ''} ${item.affiliate?.email || ''} ${item.affiliate?.referral_code || ''} ${item.provider || ''} ${item.account_name || ''} ${item.account_number || ''}`.toLowerCase();
    const date = item.requested_at ? (() => {
      const d = new Date(item.requested_at);
      if (isNaN(d.getTime())) return String(item.requested_at).slice(0, 10);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })() : '';
    const matchesQuery = !query || haystack.includes(query);
    const matchesDate = (!filters.dateFrom || date >= filters.dateFrom) && (!filters.dateTo || date <= filters.dateTo);
    return matchesQuery && matchesDate;
  }), [withdrawals, filters.query, filters.dateFrom, filters.dateTo]);

  const summary = useMemo(() => ({
    pending: scopedWithdrawals.filter((item) => item.status === 'pending').length,
    processing: scopedWithdrawals.filter((item) => item.status === 'processing').length,
    paid: scopedWithdrawals.filter((item) => item.status === 'paid').length,
    rejected: scopedWithdrawals.filter((item) => ['rejected', 'cancelled'].includes(item.status)).length,
    total: scopedWithdrawals.length,
  }), [scopedWithdrawals]);

  const filtered = useMemo(() => scopedWithdrawals.filter((item) => {
    if (filters.status === 'all') return true;
    if (filters.status === 'rejected_cancelled') return ['rejected', 'cancelled'].includes(item.status);
    return item.status === filters.status;
  }), [scopedWithdrawals, filters.status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const pageItems = filtered.slice((page - 1) * 10, page * 10);
  const paginationItems = affiliatePaginationItems(page, pageCount);
  useEffect(() => { setPage(1); }, [filters.query, filters.status, filters.dateFrom, filters.dateTo]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const toggleStatusCard = (targetStatus) => {
    setFilters((current) => {
      if (targetStatus === 'rejected_cancelled') {
        const isCurrentActive = ['rejected_cancelled', 'rejected', 'cancelled'].includes(current.status);
        return { ...current, status: isCurrentActive ? 'all' : 'rejected_cancelled' };
      }
      return { ...current, status: current.status === targetStatus ? 'all' : targetStatus };
    });
  };

  const draftFor = (item) => drafts[item.id] || { status: item.status, adminNote: item.admin_note || '', proof: null };
  const updateDraft = (id, values) => setDrafts((current) => ({ ...current, [id]: { ...(current[id] || {}), ...values } }));
  const submitSettings = async (event) => {
    event.preventDefault();
    await onSaveSettings(settings);
  };
  const submitWithdrawal = async (item) => {
    const draft = draftFor(item);
    const saved = await onProcess(item, draft);
    if (saved) setDrafts((current) => { const next = { ...current }; delete next[item.id]; return next; });
  };

  if (loading) return <div className="admin-affiliate-review-state">Memuat data penarikan...</div>;
  if (error) return <div className="admin-affiliate-review-state is-error"><span>{error}</span><button type="button" onClick={onReload}>Coba lagi</button></div>;
  return <>
    <section className="admin-withdrawal-settings admin-panel">
      <div className="admin-panel-heading"><div><span className="eyebrow">PENGATURAN PAYOUT</span><h2>Fee, batas minimal, dan rekening pengirim</h2></div><span className="admin-panel-note">Ditampilkan kepada affiliate pada halaman penarikan</span></div>
      <form onSubmit={submitSettings}>
        <label><span>Minimal penarikan (Rp)</span><input type="number" min="10000" step="1000" required value={settings.min_withdrawal_amount} onChange={(event) => setSettings({ ...settings, min_withdrawal_amount: event.target.value })} placeholder="50000"/></label>
        <label><span>Fee penarikan (%)</span><input type="number" min="0" max="100" step="0.01" required value={settings.fee_percent} onChange={(event) => setSettings({ ...settings, fee_percent: event.target.value })}/></label>
        <label><span>Bank pengirim</span><input required maxLength="80" value={settings.sender_bank_name} onChange={(event) => setSettings({ ...settings, sender_bank_name: event.target.value })} placeholder="Contoh: BCA"/></label>
        <label><span>Nama pemilik rekening</span><input required maxLength="120" value={settings.sender_account_name} onChange={(event) => setSettings({ ...settings, sender_account_name: event.target.value })} placeholder="Daymoment"/></label>
        <label><span>Nomor rekening</span><input required maxLength="80" value={settings.sender_account_number} onChange={(event) => setSettings({ ...settings, sender_account_number: event.target.value.replace(/\s/g, '') })} placeholder="Nomor rekening pengirim"/></label>
        <button type="submit" disabled={working === 'settings'}>{working === 'settings' ? 'Menyimpan...' : 'Simpan pengaturan'}</button>
      </form>
    </section>
    <div className="admin-affiliate-review-summary admin-withdrawal-summary">
      <button
        type="button"
        className={`admin-withdrawal-summary-card ${filters.status === 'pending' ? 'is-active' : ''}`}
        onClick={() => toggleStatusCard('pending')}
        title="Klik untuk memfilter status Menunggu"
      >
        <span>Menunggu</span>
        <strong>{summary.pending}</strong>
      </button>
      <button
        type="button"
        className={`admin-withdrawal-summary-card ${filters.status === 'processing' ? 'is-active' : ''}`}
        onClick={() => toggleStatusCard('processing')}
        title="Klik untuk memfilter status Diproses"
      >
        <span>Diproses</span>
        <strong>{summary.processing}</strong>
      </button>
      <button
        type="button"
        className={`admin-withdrawal-summary-card ${filters.status === 'paid' ? 'is-active' : ''}`}
        onClick={() => toggleStatusCard('paid')}
        title="Klik untuk memfilter status Selesai"
      >
        <span>Selesai</span>
        <strong>{summary.paid}</strong>
      </button>
      <button
        type="button"
        className={`admin-withdrawal-summary-card ${['rejected_cancelled', 'rejected', 'cancelled'].includes(filters.status) ? 'is-active' : ''}`}
        onClick={() => toggleStatusCard('rejected_cancelled')}
        title="Klik untuk memfilter status Ditolak atau Dibatalkan"
      >
        <span>Ditolak / dibatalkan</span>
        <strong>{summary.rejected}</strong>
      </button>
    </div>
    <section className="admin-withdrawal-filters admin-affiliate-filters">
      <label className="admin-affiliate-search">
        <span>Cari penarikan</span>
        <input
          type="search"
          value={filters.query}
          onChange={(event) => setFilters({ ...filters, query: event.target.value })}
          placeholder="Nama, email, kode referral, rekening..."
        />
      </label>
      <AdminFilterDropdown
        label="Status"
        value={filters.status}
        onChange={(status) => setFilters({ ...filters, status })}
        options={[
          { value: 'all', label: 'Semua status' },
          { value: 'pending', label: 'Menunggu' },
          { value: 'processing', label: 'Sedang diproses' },
          { value: 'paid', label: 'Selesai' },
          { value: 'rejected_cancelled', label: 'Ditolak / dibatalkan' },
          { value: 'rejected', label: 'Ditolak saja' },
          { value: 'cancelled', label: 'Dibatalkan saja' },
        ]}
      />
      <label>
        <span>Dari tanggal</span>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })}
        />
      </label>
      <label>
        <span>Sampai tanggal</span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })}
        />
      </label>
      <div className="admin-affiliate-filter-footer">
        <span>{filtered.length} dari {scopedWithdrawals.length} penarikan ditampilkan{scopedWithdrawals.length !== withdrawals.length ? ` (${withdrawals.length} total)` : ''}</span>
        <button type="button" onClick={() => setFilters({ query: '', status: 'all', dateFrom: '', dateTo: '' })}>Reset filter</button>
      </div>
    </section>
    <section className="admin-withdrawal-list"><div className="admin-section-heading"><div><span className="eyebrow">PROSES MANUAL</span><h2>Permintaan penarikan</h2></div><button className="button button-secondary" type="button" onClick={onReload}>Muat ulang</button></div>{pageItems.length ? pageItems.map((item) => { const draft = draftFor(item); return <article className="admin-withdrawal-card" key={item.id}><header><div><span className="eyebrow">{item.affiliate?.referral_code || 'AFFILIATE'}</span><h3>{item.affiliate?.full_name || 'Affiliate'}</h3><small>{item.affiliate?.email || '-'}</small></div><span className={`admin-withdrawal-status status-${item.status}`}>{item.status === 'pending' ? 'Menunggu' : item.status === 'processing' ? 'Diproses' : item.status === 'paid' ? 'Selesai' : item.status === 'rejected' ? 'Ditolak' : 'Dibatalkan'}</span></header><div className="admin-withdrawal-detail"><dl><div><dt>Diajukan</dt><dd>{money(item.amount)}</dd></div><div><dt>Fee ({item.fee_percent.toLocaleString('id-ID')}%)</dt><dd>{money(item.fee_amount)}</dd></div><div><dt>Transfer bersih</dt><dd><strong>{money(item.net_amount)}</strong></dd></div><div><dt>Tujuan</dt><dd>{item.provider} · {item.account_number}</dd></div><div><dt>Pemilik</dt><dd>{item.account_name}</dd></div><div><dt>Tanggal</dt><dd>{item.requested_at ? dateFormat.format(new Date(item.requested_at)) : '-'}</dd></div></dl></div><div className="admin-withdrawal-process"><label className="admin-withdrawal-status-field"><span>Status</span><AdminStatusDropdown value={draft.status ?? item.status} onChange={(status) => updateDraft(item.id, { status })} disabled={working === item.id}/></label><label className="wide"><span>Catatan admin</span><textarea rows="2" maxLength="500" value={draft.adminNote ?? item.admin_note ?? ''} onChange={(event) => updateDraft(item.id, { adminNote: event.target.value })} placeholder="Keterangan proses atau alasan penolakan"/></label><label className="admin-withdrawal-proof"><span>Bukti transfer (internal)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => updateDraft(item.id, { proof: event.target.files?.[0] || null })}/><em>{draft.proof?.name || (item.has_transfer_proof ? 'Bukti sudah tersimpan · pilih untuk mengganti' : 'Pilih gambar bukti transfer')}</em></label><div className="admin-withdrawal-actions">{item.transfer_proof_url && <button type="button" className="view" onClick={() => setPreview({ src: item.transfer_proof_url, name: item.affiliate?.full_name || 'Affiliate' })}>Lihat bukti internal</button>}<button type="button" className="save" disabled={working === item.id} onClick={() => submitWithdrawal(item)}>{working === item.id ? 'Menyimpan...' : 'Simpan status'}</button></div></div></article>; }) : <div className="admin-affiliate-review-state">Tidak ada penarikan yang cocok dengan filter.</div>}{filtered.length > 0 && <div className="admin-affiliate-pagination"><span>Menampilkan {(page - 1) * 10 + 1}–{Math.min(page * 10, filtered.length)} dari {filtered.length} data</span><nav aria-label="Halaman penarikan"><button type="button" className="direction" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>‹</button>{paginationItems.map((item) => typeof item === 'number' ? <button type="button" className={item === page ? 'is-active' : ''} key={item} onClick={() => setPage(item)}>{item}</button> : <span className="ellipsis" key={item}>…</span>)}<button type="button" className="direction" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>›</button></nav></div>}</section>
    {preview && <div className="admin-ktp-lightbox" role="dialog" aria-modal="true" aria-label="Bukti transfer internal" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}><div><header><span>Bukti transfer internal · {preview.name}</span><button type="button" onClick={() => setPreview(null)}>×</button></header><img src={preview.src} alt={`Bukti transfer ${preview.name}`}/></div></div>}
  </>;
}

function AffiliateDataPanel({ data, loading, error, working, onReload, onStatus, onSave }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const affiliates = (data?.affiliates || []).filter((affiliate) => ['active', 'suspended'].includes(affiliate.status));
  const filtered = useMemo(() => affiliates.filter((affiliate) => {
    const matchesStatus = status === 'all' || affiliate.status === status;
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || `${affiliate.full_name || ''} ${affiliate.email || ''} ${affiliate.phone || ''} ${affiliate.nik || ''} ${affiliate.referral_code || ''}`.toLowerCase().includes(needle);
    return matchesStatus && matchesQuery;
  }), [affiliates, query, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const pageItems = filtered.slice((page - 1) * 10, page * 10);
  const paginationItems = affiliatePaginationItems(page, pageCount);
  useEffect(() => { setPage(1); }, [query, status]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  useEffect(() => {
    if (!editing) return undefined;
    const close = (event) => { if (event.key === 'Escape') setEditing(null); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [editing]);

  const startEdit = (affiliate) => setEditing({
    id: affiliate.id,
    full_name: affiliate.full_name || '',
    email: affiliate.email || '',
    phone: affiliate.phone || '',
    nik: affiliate.nik || '',
    referral_code: affiliate.referral_code || '',
  });
  const submitEdit = async (event) => {
    event.preventDefault();
    if (await onSave(editing.id, editing)) setEditing(null);
  };
  const toggleStatus = (affiliate) => {
    const nextStatus = affiliate.status === 'active' ? 'suspended' : 'active';
    if (nextStatus === 'suspended' && !window.confirm(`Nonaktifkan akun affiliate ${affiliate.full_name}? Seluruh sesi loginnya akan dikeluarkan.`)) return;
    onStatus(affiliate.id, nextStatus);
  };

  if (loading) return <div className="admin-affiliate-review-state">Memuat data affiliate...</div>;
  if (error) return <div className="admin-affiliate-review-state is-error"><span>{error}</span><button type="button" onClick={onReload}>Coba lagi</button></div>;
  return <>
    <div className="admin-affiliate-data-summary"><article><span>Total affiliate</span><strong>{affiliates.length}</strong></article><article><span>Akun aktif</span><strong>{affiliates.filter((item) => item.status === 'active').length}</strong></article><article><span>Dinonaktifkan</span><strong>{affiliates.filter((item) => item.status === 'suspended').length}</strong></article></div>
    <section className="admin-affiliate-data-filter">
      <label><span>Cari affiliate</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nama, email, NIK, WhatsApp, atau kode referral"/></label>
      <AdminFilterDropdown label="Status akun" value={status} onChange={setStatus} options={[{ value: 'all', label: 'Semua status' }, { value: 'active', label: 'Aktif', description: 'Dapat login dan menggunakan dashboard' }, { value: 'suspended', label: 'Dinonaktifkan', description: 'Tidak dapat login ke akun' }]}/>
      <button type="button" onClick={() => { setQuery(''); setStatus('all'); }}>Reset filter</button>
      <small>{filtered.length} dari {affiliates.length} affiliate ditampilkan</small>
    </section>
    <section className="admin-affiliate-data-list">
      <div className="admin-section-heading"><div><span className="eyebrow">AKUN PARTNER</span><h2>Affiliate yang disetujui</h2></div><button className="button button-secondary" type="button" onClick={onReload}>Muat ulang</button></div>
      {pageItems.length ? pageItems.map((affiliate) => <article className="admin-affiliate-data-card" key={affiliate.id}>
        <div className="admin-affiliate-data-avatar">{String(affiliate.full_name || 'A').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div>
        <div className="admin-affiliate-data-identity"><div><h3>{affiliate.full_name}</h3><span className={`admin-affiliate-status status-${affiliate.status}`}>{affiliate.status === 'active' ? 'Aktif' : 'Dinonaktifkan'}</span><span className={`admin-affiliate-tier ${affiliate.account_tier === 'pro' ? 'is-pro' : ''}`}>{affiliate.account_tier === 'pro' ? 'PRO' : 'BASIC'}</span></div><p>{affiliate.email}</p><small>Kode referral: <b>{affiliate.referral_code || '-'}</b></small></div>
        <dl><div><dt>WhatsApp</dt><dd>{affiliate.phone || '-'}</dd></div><div><dt>NIK</dt><dd>{affiliate.nik || '-'}</dd></div><div><dt>Upgrade akun</dt><dd>{affiliate.account_tier === 'pro' ? `Pro · ${affiliate.pro_source === 'payment' ? 'Pembayaran' : affiliate.pro_source === 'social' ? 'Media sosial' : 'Admin'}` : 'Basic'}</dd></div><div><dt>Disetujui</dt><dd>{affiliate.reviewed_at ? dateFormat.format(new Date(affiliate.reviewed_at)) : '-'}</dd></div><div><dt>Terakhir diperbarui</dt><dd>{affiliate.updated_at ? dateFormat.format(new Date(affiliate.updated_at)) : '-'}</dd></div></dl>
        <div className="admin-affiliate-data-actions"><button className="edit" type="button" disabled={Boolean(working)} onClick={() => startEdit(affiliate)}>Edit data</button><button className={affiliate.status === 'active' ? 'disable' : 'enable'} type="button" disabled={working === `status:${affiliate.id}`} onClick={() => toggleStatus(affiliate)}>{working === `status:${affiliate.id}` ? 'Memproses...' : affiliate.status === 'active' ? 'Nonaktifkan akun' : 'Aktifkan akun'}</button></div>
      </article>) : <div className="admin-affiliate-review-state">Tidak ada affiliate yang cocok dengan filter.</div>}
      {filtered.length > 0 && <div className="admin-affiliate-pagination"><span>Menampilkan {(page - 1) * 10 + 1}–{Math.min(page * 10, filtered.length)} dari {filtered.length} data</span><nav aria-label="Halaman data affiliate"><button type="button" className="direction" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>‹</button>{paginationItems.map((item) => typeof item === 'number' ? <button type="button" className={item === page ? 'is-active' : ''} key={item} onClick={() => setPage(item)}>{item}</button> : <span className="ellipsis" key={item}>…</span>)}<button type="button" className="direction" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>›</button></nav></div>}
    </section>
    {editing && <div className="admin-affiliate-edit-modal" role="dialog" aria-modal="true" aria-label="Edit data affiliate" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}><form onSubmit={submitEdit}><header><div><span className="eyebrow">DATA AFFILIATE</span><h2>Edit affiliate</h2></div><button type="button" onClick={() => setEditing(null)} aria-label="Tutup">×</button></header><div className="admin-affiliate-edit-fields"><label><span>Nama lengkap</span><input required minLength="2" maxLength="120" value={editing.full_name} onChange={(event) => setEditing({ ...editing, full_name: event.target.value })}/></label><label><span>Email</span><input required type="email" maxLength="254" value={editing.email} onChange={(event) => setEditing({ ...editing, email: event.target.value })}/></label><label><span>Nomor WhatsApp</span><input required type="tel" maxLength="24" value={editing.phone} onChange={(event) => setEditing({ ...editing, phone: event.target.value })}/></label><label><span>NIK</span><input required inputMode="numeric" minLength="16" maxLength="16" pattern="[0-9]{16}" value={editing.nik} onChange={(event) => setEditing({ ...editing, nik: event.target.value.replace(/\D/g, '').slice(0, 16) })}/></label><label className="wide"><span>Kode referral</span><input required minLength="3" maxLength="32" pattern="[A-Za-z0-9]{3,32}" value={editing.referral_code} onChange={(event) => setEditing({ ...editing, referral_code: event.target.value.replace(/[^a-zA-Z0-9]/g, '') })}/><small>Hanya huruf dan angka. Perubahan kode membuat link referral lama tidak berlaku.</small></label></div><footer><button type="button" onClick={() => setEditing(null)}>Batal</button><button className="save" type="submit" disabled={working === `edit:${editing.id}`}>{working === `edit:${editing.id}` ? 'Menyimpan...' : 'Simpan perubahan'}</button></footer></form></div>}
  </>;
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
  const [commissionDrafts, setCommissionDrafts] = useState({});
  const [activePanel, setActivePanel] = useState('');
  const [detailQuery, setDetailQuery] = useState('');
  const [activeView, setActiveView] = useState('report');
  const [mobileTabOpen, setMobileTabOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [reportCarrier, setReportCarrier] = useState('all');
  const [editorQuery, setEditorQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterPreset, setFilterPreset] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [cardModal, setCardModal] = useState(null);
  const [cardModalQuery, setCardModalQuery] = useState('');
  const [cardModalPage, setCardModalPage] = useState(1);
  const [viewItemModal, setViewItemModal] = useState(null);
  const [editItemModal, setEditItemModal] = useState(null);
  const [affiliateReviews, setAffiliateReviews] = useState({ data: null, loading: false, error: '' });
  const [affiliateReviewWorking, setAffiliateReviewWorking] = useState('');
  const [proUpgrades, setProUpgrades] = useState({ data: null, loading: false, error: '' });
  const [proUpgradeWorking, setProUpgradeWorking] = useState('');
  const [withdrawalAdmin, setWithdrawalAdmin] = useState({ data: null, loading: false, error: '' });
  const [withdrawalWorking, setWithdrawalWorking] = useState('');
  const [notificationsData, setNotificationsData] = useState({
    counts: { total: 0, orders: 0, feedbacks: 0, withdrawals: 0, affiliates: 0 },
    notifications: { orders: [], feedbacks: [], withdrawals: [], affiliates: [] },
    refreshed_at: null,
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [globalNotifTab, setGlobalNotifTab] = useState('all');
  const [openHeadingNotif, setOpenHeadingNotif] = useState(null);
  const [headingRefreshing, setHeadingRefreshing] = useState('');
  const [feedbackRefreshSignal, setFeedbackRefreshSignal] = useState(0);
  const [readMarkers, setReadMarkers] = useState(() => {
    try {
      const saved = localStorage.getItem('daymoment_admin_read_markers');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [readItemIds, setReadItemIds] = useState(() => {
    try {
      const saved = localStorage.getItem('daymoment_admin_read_item_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isItemUnread = useCallback((item) => {
    if (!item || !item.id) return false;
    const uniqueKey = `${item.type}-${item.id}`;
    if (readItemIds.includes(uniqueKey) || readItemIds.includes(String(item.id))) {
      return false;
    }
    const cat = item.type === 'order' ? 'orders' : item.type === 'feedback' ? 'feedbacks' : item.type === 'withdrawal' ? 'withdrawals' : 'affiliates';
    const marker = readMarkers[cat];
    if (marker && new Date(item.created_at || 0).getTime() <= new Date(marker).getTime()) {
      return false;
    }
    return true;
  }, [readItemIds, readMarkers]);

  const getCategoryItems = useCallback((category) => {
    const list = notificationsData.notifications[category] || [];
    if (list.length > 0) return list;
    if (category === 'withdrawals' && withdrawalAdmin.data?.withdrawals?.length) {
      const statusLabels = {
        pending: 'Menunggu',
        processing: 'Diproses',
        paid: 'Selesai',
        rejected: 'Ditolak',
        cancelled: 'Dibatalkan',
      };
      return withdrawalAdmin.data.withdrawals.slice(0, 8).map((w) => {
        const affiliateName = w.affiliate?.full_name || w.account_name || 'Affiliate';
        const amountStr = `Rp ${(Number(w.amount || 0)).toLocaleString('id-ID')}`;
        const statusText = statusLabels[w.status] || w.status;
        return {
          id: String(w.id),
          title: `${affiliateName} — ${amountStr}`,
          snippet: `${w.provider || w.payout_method || 'Bank'} · a.n ${w.account_name || '-'} · ${statusText}`,
          status: w.status,
          status_label: statusText,
          created_at: w.requested_at || w.updated_at,
          view: 'withdrawals',
          type: 'withdrawal',
        };
      });
    }
    return [];
  }, [notificationsData.notifications, withdrawalAdmin.data?.withdrawals]);

  const getCategoryUnreadCount = useCallback((category) => {
    const items = getCategoryItems(category);
    return items.filter((item) => isItemUnread(item)).length;
  }, [getCategoryItems, isItemUnread]);

  const unreadCounts = useMemo(() => ({
    orders: getCategoryUnreadCount('orders'),
    feedbacks: getCategoryUnreadCount('feedbacks'),
    withdrawals: getCategoryUnreadCount('withdrawals'),
    affiliates: getCategoryUnreadCount('affiliates'),
  }), [getCategoryUnreadCount]);

  const totalUnreadCount = useMemo(() => (
    (unreadCounts.orders || 0) + (unreadCounts.feedbacks || 0) + (unreadCounts.withdrawals || 0) + (unreadCounts.affiliates || 0)
  ), [unreadCounts]);

  const markItemAsRead = useCallback((item) => {
    if (!item || !item.id) return;
    const uniqueKey = `${item.type}-${item.id}`;
    setReadItemIds((prev) => {
      if (prev.includes(uniqueKey)) return prev;
      const next = [...prev, uniqueKey];
      try {
        localStorage.setItem('daymoment_admin_read_item_ids', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save read item IDs:', e);
      }
      return next;
    });
  }, []);

  const markCategoryAsRead = useCallback((category) => {
    const nowIso = new Date().toISOString();
    const items = category === 'all'
      ? [
          ...(notificationsData.notifications.orders || []),
          ...(notificationsData.notifications.feedbacks || []),
          ...(notificationsData.notifications.withdrawals || []),
          ...(notificationsData.notifications.affiliates || []),
        ]
      : (notificationsData.notifications[category] || []);
    const keys = items.map((it) => `${it.type}-${it.id}`);

    setReadItemIds((prev) => {
      const next = [...new Set([...prev, ...keys])];
      try {
        localStorage.setItem('daymoment_admin_read_item_ids', JSON.stringify(next));
      } catch {}
      return next;
    });

    setReadMarkers((prev) => {
      const next = category === 'all'
        ? {
            ...prev,
            orders: nowIso,
            feedbacks: nowIso,
            withdrawals: nowIso,
            affiliates: nowIso,
            all: nowIso,
          }
        : {
            ...prev,
            [category]: nowIso,
          };
      try {
        localStorage.setItem('daymoment_admin_read_markers', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save read markers:', e);
      }
      return next;
    });
  }, [notificationsData.notifications]);

  const toggleHeadingNotif = (category) => {
    if (openHeadingNotif === category) {
      setOpenHeadingNotif(null);
    } else {
      setOpenHeadingNotif(category);
    }
  };

  const handleSelectGlobalNotifTab = (tab) => {
    setGlobalNotifTab(tab);
  };

  const handleGlobalNotifItemClick = (item) => {
    markItemAsRead(item);
    setActiveView(item.view);
    setShowNotifications(false);
    setMobileTabOpen(false);
  };

  const toggleGlobalNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  const handleHeadingRefresh = async (category, reloadFn) => {
    setHeadingRefreshing(category);
    try {
      await Promise.allSettled([
        loadNotifications(false),
        typeof reloadFn === 'function' ? reloadFn() : Promise.resolve(),
      ]);
      if (category === 'feedbacks') {
        setFeedbackRefreshSignal((prev) => prev + 1);
      }
      window.showToast?.('Data dan notifikasi berhasil diperbarui.');
    } catch (err) {
      window.showToast?.('Gagal memuat ulang data.', 'error');
    } finally {
      setHeadingRefreshing('');
    }
  };

  const loadNotifications = async (showFeedbackToast = false) => {
    setNotifLoading(true);
    try {
      const res = await get('/api/admin/notifications');
      if (res?.ok) {
        setNotificationsData({
          counts: res.counts || { total: 0, orders: 0, feedbacks: 0, withdrawals: 0, affiliates: 0 },
          notifications: res.notifications || { orders: [], feedbacks: [], withdrawals: [], affiliates: [] },
          refreshed_at: res.refreshed_at || new Date().toISOString(),
        });
        if (showFeedbackToast) {
          window.showToast?.('Notifikasi terbaru berhasil diperbarui.');
        }
      }
    } catch (err) {
      console.error('Gagal memuat notifikasi:', err);
      if (showFeedbackToast) {
        window.showToast?.('Gagal menyegarkan notifikasi.', 'error');
      }
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(() => loadNotifications(), 45000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest('.heading-notif-box')) {
        setOpenHeadingNotif(null);
      }
      if (!event.target.closest('.admin-notification-wrap')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return dayFormat.format(date);
  };

  const getFilteredGlobalNotifications = () => {
    if (globalNotifTab === 'orders') return notificationsData.notifications.orders || [];
    if (globalNotifTab === 'feedbacks') return notificationsData.notifications.feedbacks || [];
    if (globalNotifTab === 'withdrawals') return notificationsData.notifications.withdrawals || [];
    if (globalNotifTab === 'affiliates') return notificationsData.notifications.affiliates || [];
    const all = [
      ...(notificationsData.notifications.orders || []),
      ...(notificationsData.notifications.feedbacks || []),
      ...(notificationsData.notifications.withdrawals || []),
      ...(notificationsData.notifications.affiliates || []),
    ];
    return all.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  };

  const renderHeadingNotifDropdown = (category, title, viewName) => {
    if (openHeadingNotif !== category) return null;
    const items = getCategoryItems(category);

    return (
      <div
        className="heading-notif-dropdown"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Notifikasi ${title}`}
      >
        <div className="dropdown-head">
          <h4 className="dropdown-title">{title}</h4>
          <span className="dropdown-status-pill">
            {items.length} Notifikasi
          </span>
        </div>

        <div className="dropdown-body">
          {items.length === 0 ? (
            <div className="notif-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.6 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style={{ margin: 0 }}>Belum ada notifikasi pada kategori ini.</p>
            </div>
          ) : (
            items.map((item) => {
              const unread = isItemUnread(item);
              return (
                <div
                  key={item.id}
                  className={`notif-item ${unread ? 'is-unread' : 'is-read'}`}
                  onClick={() => {
                    markItemAsRead(item);
                    setActiveView(viewName);
                    setOpenHeadingNotif(null);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className={`notif-item-avatar ${category === 'orders' ? 'order' : category === 'feedbacks' ? 'feedback' : category === 'withdrawals' ? 'withdrawal' : 'affiliate'}`}>
                    {category === 'orders' ? '🛒' : category === 'feedbacks' ? '💬' : category === 'withdrawals' ? '💸' : '👤'}
                  </div>
                  <div className="notif-item-content">
                    <div className="notif-item-top">
                      <span className="notif-item-name">{item.title}</span>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {unread && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2.5px 8px',
                              backgroundColor: '#0f766e',
                              color: '#ffffff',
                              fontSize: '10px',
                              fontWeight: '800',
                              borderRadius: '999px',
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              boxShadow: '0 1px 4px rgba(15, 118, 110, 0.4)',
                              flexShrink: 0
                            }}
                          >
                            <span style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              backgroundColor: '#34d399',
                              display: 'inline-block'
                            }} />
                            Baru
                          </span>
                        )}
                        {item.status_label && (
                          <span className={`notif-item-status ${String(item.status || '').toLowerCase()}`}>
                            {item.status_label}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="notif-item-desc">{item.snippet}</p>
                    <span className="notif-item-time">{formatRelativeTime(item.created_at)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="dropdown-foot">
          <span style={{ fontSize: '11px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Sudah ditandai dibaca
          </span>
          <button
            type="button"
            className="dropdown-close-btn"
            onClick={() => setOpenHeadingNotif(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              backgroundColor: '#0f172a',
              border: '1px solid #0f172a',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    );
  };
  const orders = data?.orders || [];
  const regularOrders = useMemo(() => orders.filter((order) => order.order_source !== 'admin_free'), [orders]);
  const freeOrders = useMemo(() => orders.filter((order) => order.order_source === 'admin_free'), [orders]);

  const periodOrders = useMemo(() => regularOrders.filter((order) => {
    const date = orderDateValue(order);
    return (!startDate || date >= startDate) && (!endDate || date <= endDate);
  }), [regularOrders, startDate, endDate]);

  const periodFreeOrders = useMemo(() => freeOrders.filter((order) => {
    const date = orderDateValue(order);
    return (!startDate || date >= startDate) && (!endDate || date <= endDate);
  }), [freeOrders, startDate, endDate]);

  const isAffiliateOrder = useCallback((order) => {
    if (!order || order.order_source === 'admin_free') return false;
    if (order.affiliate_id) return true;
    const ref = String(order.referral_name || '').trim();
    if (ref && ref !== 'Tanpa referral' && ref !== 'Tanpa nama pembawa') return true;
    if (order.affiliate_referral_code) return true;
    if (Number(order.affiliate_commission_amount || 0) > 0) return true;
    return false;
  }, []);

  const periodAffiliateOrders = useMemo(() => periodOrders.filter(isAffiliateOrder), [periodOrders, isAffiliateOrder]);
  const periodDirectOrders = useMemo(() => periodOrders.filter((o) => !isAffiliateOrder(o)), [periodOrders, isAffiliateOrder]);
  const paidAffiliateOrders = useMemo(() => periodAffiliateOrders.filter((o) => o.payment_status === 'paid'), [periodAffiliateOrders]);
  const paidDirectOrders = useMemo(() => periodDirectOrders.filter((o) => o.payment_status === 'paid'), [periodDirectOrders]);

  const affiliateFinancials = useMemo(() => {
    const omset = paidAffiliateOrders.reduce((sum, o) => sum + Number(o.payment_amount ?? o.package_price ?? 0), 0);
    const commission = paidAffiliateOrders.reduce((sum, o) => sum + Number(o.affiliate_commission_amount || o.referral_amount || 0), 0);
    const netProfit = Math.max(0, omset - commission);
    return { omset, commission, netProfit };
  }, [paidAffiliateOrders]);

  const summary = useMemo(() => {
    const paidOrders = periodOrders.filter((order) => order.payment_status === 'paid');
    return {
      total_orders: periodOrders.length,
      total_paid: paidOrders.length,
      total_pending: periodOrders.filter((order) => order.payment_status === 'pending').length,
      total_published: periodOrders.filter((order) => order.status === 'published').length,
      total_inactive: periodOrders.filter((order) => order.website_active === false).length,
      total_revenue: paidOrders.reduce((total, order) => total + Number(order.payment_amount ?? order.package_price ?? 0), 0),
      total_referral_payout: periodOrders.reduce((total, order) => total + Number(order.referral_amount || 0), 0),
    };
  }, [periodOrders]);

  const rawWithdrawals = useMemo(() => {
    return withdrawalAdmin.data?.withdrawals || data?.withdrawals || [];
  }, [withdrawalAdmin.data?.withdrawals, data?.withdrawals]);

  const periodWithdrawals = useMemo(() => {
    return rawWithdrawals.filter((w) => {
      const d = String(w.requested_at || w.created_at || '').slice(0, 10);
      return (!startDate || d >= startDate) && (!endDate || d <= endDate);
    });
  }, [rawWithdrawals, startDate, endDate]);

  const withdrawalStats = useMemo(() => {
    const totalCount = periodWithdrawals.length;
    const totalAmount = periodWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);

    const paid = periodWithdrawals.filter((w) => w.status === 'paid');
    const paidCount = paid.length;
    const paidAmount = paid.reduce((sum, w) => sum + Number(w.amount || 0), 0);

    const pending = periodWithdrawals.filter((w) => ['pending', 'processing'].includes(w.status));
    const pendingCount = pending.length;
    const pendingAmount = pending.reduce((sum, w) => sum + Number(w.amount || 0), 0);

    const rejected = periodWithdrawals.filter((w) => ['rejected', 'cancelled'].includes(w.status));
    const rejectedCount = rejected.length;
    const rejectedAmount = rejected.reduce((sum, w) => sum + Number(w.amount || 0), 0);

    return {
      totalCount,
      totalAmount,
      paid,
      paidCount,
      paidAmount,
      pending,
      pendingCount,
      pendingAmount,
      rejected,
      rejectedCount,
      rejectedAmount,
    };
  }, [periodWithdrawals]);

  const rawAffiliates = useMemo(() => {
    return affiliateReviews.data?.affiliates || data?.affiliates || [];
  }, [affiliateReviews.data?.affiliates, data?.affiliates]);

  const periodAffiliates = useMemo(() => {
    return rawAffiliates.filter((a) => {
      const d = String(a.created_at || '').slice(0, 10);
      return (!startDate || d >= startDate) && (!endDate || d <= endDate);
    });
  }, [rawAffiliates, startDate, endDate]);

  const affiliateStats = useMemo(() => {
    const pending = periodAffiliates.filter((a) => a.status === 'pending');
    const active = periodAffiliates.filter((a) => a.status === 'active');
    const inactive = periodAffiliates.filter((a) => ['suspended', 'inactive'].includes(a.status));
    const rejected = periodAffiliates.filter((a) => a.status === 'rejected');
    const other = periodAffiliates.filter((a) => !['pending', 'active', 'suspended', 'inactive', 'rejected'].includes(a.status));

    return {
      totalCount: periodAffiliates.length,
      pending,
      pendingCount: pending.length,
      active,
      activeCount: active.length,
      inactive,
      inactiveCount: inactive.length,
      rejected,
      rejectedCount: rejected.length,
      other,
      otherCount: other.length,
    };
  }, [periodAffiliates]);

  const combinedPeriodOrders = useMemo(() => {
    return [...periodOrders, ...periodFreeOrders];
  }, [periodOrders, periodFreeOrders]);

  const isWebsiteActive = useCallback((order) => Boolean(order.website_active), []);

  const websiteStats = useMemo(() => {
    const allActive = combinedPeriodOrders.filter(isWebsiteActive);
    const directActive = periodDirectOrders.filter(isWebsiteActive);
    const affiliateActive = periodAffiliateOrders.filter(isWebsiteActive);
    const freeActive = periodFreeOrders.filter(isWebsiteActive);
    const rate = combinedPeriodOrders.length ? Math.round((allActive.length / combinedPeriodOrders.length) * 100) : 0;

    return {
      allActive,
      allActiveCount: allActive.length,
      directActive,
      directActiveCount: directActive.length,
      affiliateActive,
      affiliateActiveCount: affiliateActive.length,
      freeActive,
      freeActiveCount: freeActive.length,
      rate,
    };
  }, [combinedPeriodOrders, isWebsiteActive, periodDirectOrders, periodAffiliateOrders, periodFreeOrders]);

  const topAffiliates = useMemo(() => {
    const map = new Map();
    rawAffiliates.forEach((aff) => {
      map.set(aff.id, {
        id: aff.id,
        name: aff.full_name || 'Affiliate',
        code: aff.referral_code || '-',
        email: aff.email || '',
        phone: aff.phone || '',
        tier: aff.account_tier || 'regular',
        status: aff.status || 'active',
        ordersCount: 0,
        paidOrdersCount: 0,
        revenue: 0,
        commission: 0,
        netProfit: 0,
      });
    });

    periodOrders.forEach((order) => {
      if (!isAffiliateOrder(order)) return;
      const key = order.affiliate_id || order.referral_name || order.affiliate_referral_code;
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          id: order.affiliate_id || key,
          name: order.affiliate_name || order.referral_name || 'Affiliate',
          code: order.affiliate_referral_code || '-',
          email: order.affiliate_email || '',
          phone: '',
          tier: 'regular',
          status: order.affiliate_status || 'active',
          ordersCount: 0,
          paidOrdersCount: 0,
          revenue: 0,
          commission: 0,
          netProfit: 0,
        });
      }

      const item = map.get(key);
      item.ordersCount += 1;
      if (order.payment_status === 'paid') {
        item.paidOrdersCount += 1;
        const rev = Number(order.payment_amount ?? order.package_price ?? 0);
        const comm = Number(order.affiliate_commission_amount || order.referral_amount || 0);
        item.revenue += rev;
        item.commission += comm;
        item.netProfit += Math.max(0, rev - comm);
      }
    });

    return [...map.values()]
      .filter((item) => item.ordersCount > 0 || item.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue || b.paidOrdersCount - a.paidOrdersCount || b.ordersCount - a.ordersCount)
      .slice(0, 5);
  }, [rawAffiliates, periodOrders, isAffiliateOrder]);
  const filteredOrders = useMemo(() => periodOrders.filter((order) => {
    const matchesFilter = filter === 'all' || (filter === 'website' ? order.website_active === false : order.payment_status === filter);
    const haystack = `${order.order_code} ${order.customer_name} ${order.customer_email} ${order.template_name} ${order.package_name} ${order.referral_name}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase());
    }), [periodOrders, filter, query]);
  const revenueEntries = useMemo(() => {
    const entries = periodOrders.filter((order) => order.payment_status === 'paid').reduce((items, order) => {
      const date = String(order.paid_at || order.created_at || '').slice(0, 10);
      if (date) items[date] = (items[date] || 0) + Number(order.payment_amount ?? order.package_price ?? 0);
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
    if (order.payment_status === 'paid') items[name].revenue += Number(order.payment_amount ?? order.package_price ?? 0);
    return items;
  }, {})).sort((first, second) => second.payout - first.payout || second.orders - first.orders), [periodOrders]);
  const topCarrier = referralSummary[0];
  const latestOrders = regularOrders.slice(0, 4);
  const templateCatalog = data?.templates || [];
  const reportOrders = periodOrders.filter((order) => reportCarrier === 'all'
    || (String(order.referral_name || '').trim() || 'Tanpa nama pembawa') === reportCarrier);
  const reportPayout = reportOrders.reduce((total, order) => total + Number(order.referral_amount || 0), 0);
  const editorOrders = useMemo(() => orders.filter((order) => {
    if (order.payment_status !== 'paid' || !order.editor_url) return false;
    const date = orderDateValue(order);
    if ((startDate && date < startDate) || (endDate && date > endDate)) return false;
    const haystack = `${order.customer_name} ${order.customer_email} ${order.order_code} ${order.template_name} ${order.template_code}`.toLowerCase();
    return haystack.includes(editorQuery.toLowerCase());
  }), [orders, editorQuery, startDate, endDate]);

  const loadAffiliateReviews = async () => {
    setAffiliateReviews((current) => ({ ...current, loading: true, error: '' }));
    try {
      const result = await get('/api/admin/affiliates');
      setAffiliateReviews({ data: result, loading: false, error: '' });
    } catch (failure) {
      setAffiliateReviews((current) => ({ ...current, loading: false, error: failure.message || 'Pendaftaran affiliate gagal dimuat.' }));
    }
  };

  const loadProUpgrades = async () => {
    setProUpgrades((current) => ({ ...current, loading: true, error: '' }));
    try {
      const result = await get('/api/admin/pro-upgrades');
      setProUpgrades({ data: result, loading: false, error: '' });
    } catch (failure) {
      setProUpgrades((current) => ({ ...current, loading: false, error: failure.message || 'Pengajuan upgrade Pro gagal dimuat.' }));
    }
  };

  const loadWithdrawals = async () => {
    setWithdrawalAdmin((current) => ({ ...current, loading: true, error: '' }));
    try {
      const result = await get('/api/admin/withdrawals');
      setWithdrawalAdmin({ data: result, loading: false, error: '' });
    } catch (failure) {
      setWithdrawalAdmin((current) => ({ ...current, loading: false, error: failure.message || 'Data penarikan gagal dimuat.' }));
    }
  };

  useEffect(() => {
    if (!activePanel) return;
    window.requestAnimationFrame(() => document.querySelector('.admin-detail-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [activePanel]);

  useEffect(() => {
    const nextValues = {};
    const nextCommissions = {};
    templateCatalog.forEach((template) => {
      for (const packageItem of template.packages || []) {
        const key = `${template.code}:${packageItem.code}`;
        nextValues[key] = String(packageItem.price || 0);
        nextCommissions[key] = String(packageItem.affiliate_commission_default_percent ?? 0);
      }
    });
    setPriceDrafts((existing) => {
      const changed = Object.entries(nextValues).some(([key, value]) => existing[key] !== value);
      return changed ? { ...existing, ...nextValues } : existing;
    });
    setCommissionDrafts((existing) => {
      const changed = Object.entries(nextCommissions).some(([key, value]) => existing[key] !== value);
      return changed ? { ...existing, ...nextCommissions } : existing;
    });
  }, [templateCatalog]);

  useEffect(() => {
    setShowNotifications(false);
    const viewCategoryMap = {
      'order-history': 'orders',
      'feedback': 'feedbacks',
      'withdrawals': 'withdrawals',
      'affiliates': 'affiliates',
    };
    if (viewCategoryMap[activeView]) {
      markCategoryAsRead(viewCategoryMap[activeView]);
    }
  }, [activeView, markCategoryAsRead]);

  useEffect(() => {
    if (['report', 'affiliates', 'affiliate-data'].includes(activeView) && !affiliateReviews.data && !affiliateReviews.loading) {
      loadAffiliateReviews();
    }
  }, [activeView]);

  useEffect(() => {
    if (['report', 'withdrawals'].includes(activeView) && !withdrawalAdmin.data && !withdrawalAdmin.loading) {
      loadWithdrawals();
    }
  }, [activeView]);

  useEffect(() => {
    if (data?.withdrawals && !withdrawalAdmin.data) {
      setWithdrawalAdmin({
        data: {
          withdrawals: data.withdrawals,
          settings: { min_withdrawal_amount: 50000, fee_percent: 0 },
          summary: {
            pending: data.withdrawals.filter((w) => w.status === 'pending').length,
            processing: data.withdrawals.filter((w) => w.status === 'processing').length,
            paid: data.withdrawals.filter((w) => w.status === 'paid').length,
            rejected: data.withdrawals.filter((w) => ['rejected', 'cancelled'].includes(w.status)).length,
          }
        },
        loading: false,
        error: '',
      });
    }
    if (data?.affiliates && !affiliateReviews.data) {
      setAffiliateReviews({
        data: {
          affiliates: data.affiliates,
          summary: {
            pending: data.affiliates.filter((a) => a.status === 'pending').length,
            active: data.affiliates.filter((a) => a.status === 'active').length,
            rejected: data.affiliates.filter((a) => a.status === 'rejected').length,
          }
        },
        loading: false,
        error: '',
      });
    }
  }, [data?.withdrawals, data?.affiliates]);

  const activeDetail = useMemo(() => {
    if (!activePanel) return null;

    if (activePanel.startsWith('top_affiliate:')) {
      const affId = activePanel.replace('top_affiliate:', '');
      const matchAff = topAffiliates.find((a) => String(a.id) === affId || a.name === affId);
      const affName = matchAff?.name || affId;
      const affOrders = periodOrders.filter((o) => {
        return String(o.affiliate_id) === affId || o.referral_name === affId || o.affiliate_name === affId || o.affiliate_referral_code === affId;
      });
      return {
        type: 'orders',
        title: `Pesanan Template dari ${affName}`,
        subtitle: `Daftar seluruh pesanan template yang dihasilkan oleh mitra ${affName}`,
        badge: `${affOrders.length} order`,
        items: affOrders,
      };
    }

    switch (activePanel) {
      case 'orders':
        return {
          type: 'orders',
          title: 'Semua Order Masuk',
          subtitle: 'Daftar seluruh order masuk reguler pada periode yang dipilih',
          badge: `${periodOrders.length} order`,
          items: periodOrders,
        };
      case 'paid':
        return {
          type: 'orders',
          title: 'Order Sudah Lunas',
          subtitle: 'Pesanan yang telah sukses menyelesaikan pembayaran',
          badge: `${summary.total_paid} order lunas`,
          items: periodOrders.filter((o) => o.payment_status === 'paid'),
        };
      case 'pending':
        return {
          type: 'orders',
          title: 'Menunggu Pembayaran',
          subtitle: 'Pesanan yang belum lunas dan perlu tindak lanjut / follow-up via WhatsApp',
          badge: `${summary.total_pending} order menunggu`,
          items: periodOrders.filter((o) => o.payment_status === 'pending'),
        };
      case 'free_orders':
        return {
          type: 'free_orders',
          title: 'Data Order Gratis (Complimentary)',
          subtitle: 'Daftar undangan gratis yang dibuat khusus oleh admin tanpa alur bayar',
          badge: `${periodFreeOrders.length} order gratis`,
          items: periodFreeOrders,
        };
      case 'affiliate_commission':
        return {
          type: 'affiliate_sales',
          title: 'Rincian Komisi Mitra Affiliate',
          subtitle: 'Komisi yang diperoleh para mitra affiliate dari order template yang sudah lunas',
          badge: `${paidAffiliateOrders.length} transaksi komisi`,
          items: paidAffiliateOrders,
        };
      case 'affiliate_omset':
        return {
          type: 'affiliate_sales',
          title: 'Omzet Penjualan Template via Affiliate',
          subtitle: 'Nilai penjualan kotor dari paket undangan yang terjual melalui jalur affiliate',
          badge: `${paidAffiliateOrders.length} order lunas`,
          items: paidAffiliateOrders,
        };
      case 'affiliate_profit':
        return {
          type: 'affiliate_sales',
          title: 'Keuntungan Bersih DayMoment dari Penjualan Affiliate',
          subtitle: 'Omzet template terjual via affiliate dikurangi hak komisi mitra affiliate',
          badge: `${paidAffiliateOrders.length} order lunas`,
          items: paidAffiliateOrders,
        };
      case 'affiliate_orders':
        return {
          type: 'orders',
          title: 'Semua Order Jalur Affiliate',
          subtitle: 'Pesanan yang masuk melalui link atau kode referral mitra affiliate',
          badge: `${periodAffiliateOrders.length} order`,
          items: periodAffiliateOrders,
        };
      case 'withdrawals_all':
        return {
          type: 'withdrawals',
          title: 'Semua Pengajuan Penarikan Saldo Affiliate',
          subtitle: 'Seluruh riwayat permohonan penarikan saldo komisi para affiliate',
          badge: `${withdrawalStats.totalCount} pengajuan`,
          items: periodWithdrawals,
        };
      case 'withdrawals_paid':
        return {
          type: 'withdrawals',
          title: 'Penarikan Selesai (Sudah Ditransfer)',
          subtitle: 'Permintaan payout affiliate yang telah sukses ditransfer oleh admin',
          badge: `${withdrawalStats.paidCount} transfer selesai`,
          items: withdrawalStats.paid,
        };
      case 'withdrawals_pending':
        return {
          type: 'withdrawals',
          title: 'Penarikan Belum Selesai (Menunggu / Diproses)',
          subtitle: 'Permintaan penarikan yang masih menunggu transfer dan upload bukti bayar',
          badge: `${withdrawalStats.pendingCount} belum selesai`,
          items: withdrawalStats.pending,
        };
      case 'withdrawals_rejected':
        return {
          type: 'withdrawals',
          title: 'Penarikan Ditolak / Dibatalkan',
          subtitle: 'Permintaan penarikan yang ditolak atau dibatalkan karena kendala rekening atau data',
          badge: `${withdrawalStats.rejectedCount} ditolak`,
          items: withdrawalStats.rejected,
        };
      case 'affiliates_pending':
        return {
          type: 'affiliates',
          title: 'Pendaftaran Affiliate Menunggu Review',
          subtitle: 'Calon mitra affiliate yang membutuhkan verifikasi identitas (KTP & NIK)',
          badge: `${affiliateStats.pendingCount} perlu review`,
          items: affiliateStats.pending,
        };
      case 'affiliates_active':
        return {
          type: 'affiliates',
          title: 'Mitra Affiliate Disetujui & Aktif',
          subtitle: 'Mitra resmi yang aktif memiliki link, kode referral, dan siap berpromosi',
          badge: `${affiliateStats.activeCount} mitra aktif`,
          items: affiliateStats.active,
        };
      case 'affiliates_rejected':
        return {
          type: 'affiliates',
          title: 'Pendaftaran Affiliate Ditolak',
          subtitle: 'Pendaftaran mitra yang ditolak karena data tidak sesuai atau tidak lengkap',
          badge: `${affiliateStats.rejectedCount} ditolak`,
          items: affiliateStats.rejected,
        };
      case 'affiliates_all':
        return {
          type: 'affiliates',
          title: 'Semua Mitra Affiliate Terdaftar',
          subtitle: 'Database lengkap seluruh mitra affiliate yang terdaftar di sistem DayMoment',
          badge: `${affiliateStats.totalCount} affiliate`,
          items: periodAffiliates,
        };
      case 'active_websites_all':
        return {
          type: 'websites',
          title: 'Semua Website Undangan yang Aktif',
          subtitle: 'Seluruh website yang terbit, akses dibuka, dan belum kedaluwarsa',
          badge: `${websiteStats.allActiveCount} website aktif`,
          items: websiteStats.allActive,
        };
      case 'active_websites_direct':
        return {
          type: 'websites',
          title: 'Website Aktif: Order Berbayar Langsung DayMoment',
          subtitle: 'Website aktif dari pemesan langsung tanpa melalui perantara affiliate',
          badge: `${websiteStats.directActiveCount} website aktif`,
          items: websiteStats.directActive,
        };
      case 'active_websites_affiliate':
        return {
          type: 'websites',
          title: 'Website Aktif: Dari Penjualan Affiliate',
          subtitle: 'Website aktif dari pesanan customer yang dipromosikan oleh mitra affiliate',
          badge: `${websiteStats.affiliateActiveCount} website aktif`,
          items: websiteStats.affiliateActive,
        };
      case 'active_websites_free':
        return {
          type: 'websites',
          title: 'Website Aktif: Dari Order Gratis (Complimentary)',
          subtitle: 'Website aktif yang dibuat langsung dari alur order gratis admin',
          badge: `${websiteStats.freeActiveCount} website aktif`,
          items: websiteStats.freeActive,
        };
      default:
        return null;
    }
  }, [
    activePanel,
    topAffiliates,
    periodOrders,
    summary.total_paid,
    summary.total_pending,
    periodFreeOrders,
    paidAffiliateOrders,
    periodAffiliateOrders,
    periodDirectOrders,
    periodWithdrawals,
    withdrawalStats,
    periodAffiliates,
    affiliateStats,
    websiteStats,
  ]);

  const filteredDetailItems = useMemo(() => {
    if (!activeDetail || !Array.isArray(activeDetail.items)) return [];
    if (!detailQuery.trim()) return activeDetail.items;
    const q = detailQuery.toLowerCase().trim();
    return activeDetail.items.filter((item) => {
      const texts = [
        item.order_code,
        item.customer_name,
        item.customer_email,
        item.customer_phone,
        item.full_name,
        item.email,
        item.phone,
        item.nik,
        item.referral_code,
        item.referral_name,
        item.affiliate_name,
        item.template_name,
        item.template_code,
        item.package_name,
        item.package_code,
        item.slug,
        item.provider,
        item.account_name,
        item.account_number,
        item.admin_note,
        item.complimentary_note,
        item.status,
        item.payment_status,
      ].filter(Boolean).map(String);
      return texts.some((t) => t.toLowerCase().includes(q));
    });
  }, [activeDetail, detailQuery]);

  if (loading) return <AdminTemplate><Loading showLabel /></AdminTemplate>;
  if (error?.status === 401) return <AdminTemplate><AdminLogin onSuccess={reload} /></AdminTemplate>;
  if (error) return <AdminTemplate><ErrorState error={error} /></AdminTemplate>;
  const detail = activeDetail;

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

  const saveOrderHistory = async (orderCode, values) => {
    setWorking(`order:${orderCode}`);
    try {
      const result = await patch(`/api/admin/orders/${encodeURIComponent(orderCode)}`, values);
      await reload();
      window.showToast?.(result.message || 'Data pesanan berhasil diperbarui.');
      return true;
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
      return false;
    } finally {
      setWorking('');
    }
  };

  const saveWebsiteAccess = async (order, values) => {
    setWorking(`website:${order.order_code}`);
    try {
      const result = await patch(`/api/admin/orders/${encodeURIComponent(order.order_code)}/website`, values);
      await reload();
      window.showToast?.(result.message || 'Akses website customer berhasil diperbarui.');
      return true;
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
      return false;
    } finally {
      setWorking('');
    }
  };

  const createComplimentaryOrder = async (values) => {
    setWorking('complimentary:create');
    try {
      const result = await post('/api/admin/complimentary-orders', values);
      await reload();
      window.showToast?.(result.message, result.email_sent ? 'success' : 'error');
      return result;
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
      return null;
    } finally {
      setWorking('');
    }
  };

  const resendComplimentaryEmail = async (orderCode) => {
    setWorking(`complimentary:email:${orderCode}`);
    try {
      const result = await post(`/api/admin/complimentary-orders/${encodeURIComponent(orderCode)}/resend-email`, {});
      await reload();
      window.showToast?.(result.message);
      return true;
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
      return false;
    } finally {
      setWorking('');
    }
  };

  const savePackageSettings = async (templateCode, packageCode) => {
    const key = `${templateCode}:${packageCode}`;
    const rawPrice = Number(priceDrafts[key] ?? 0);
    const commissionPercent = Number(commissionDrafts[key] ?? 0);
    if (!Number.isFinite(rawPrice) || rawPrice < 0) {
      window.showToast?.('Harga paket tidak valid.', 'error');
      return;
    }
    if (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
      window.showToast?.('Komisi affiliate harus berada di antara 0% sampai 100%.', 'error');
      return;
    }
    setWorking(`package:${key}`);
    try {
      await patch(`/api/admin/templates/${encodeURIComponent(templateCode)}/packages/${encodeURIComponent(packageCode)}/price`, { price: Math.round(rawPrice), commission_percent: Math.round(commissionPercent * 100) / 100 });
      window.showToast?.('Harga dan komisi affiliate berhasil disimpan untuk order baru.');
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

  const reviewAffiliate = async (affiliateId, decision, reviewNote) => {
    if (decision === 'rejected' && !String(reviewNote || '').trim()) {
      window.showToast?.('Isi alasan penolakan agar dapat dikirim ke email affiliate.', 'error');
      return;
    }
    setAffiliateReviewWorking(affiliateId);
    try {
      const result = await patch(`/api/admin/affiliates/${encodeURIComponent(affiliateId)}/review`, { decision, review_note: reviewNote || '' });
      setAffiliateReviews((current) => {
        if (!current.data) return current;
        const affiliates = current.data.affiliates.map((item) => item.id === affiliateId ? result.affiliate : item);
        return { ...current, data: { ...current.data, affiliates, summary: { pending: affiliates.filter((item) => item.status === 'pending').length, active: affiliates.filter((item) => item.status === 'active').length, rejected: affiliates.filter((item) => item.status === 'rejected').length } } };
      });
      window.showToast?.(result.message);
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
    } finally {
      setAffiliateReviewWorking('');
    }
  };

  const resendAffiliateCorrection = async (affiliateId) => {
    setAffiliateReviewWorking(`resend:${affiliateId}`);
    try {
      const result = await post(`/api/admin/affiliates/${encodeURIComponent(affiliateId)}/resend-correction`, {});
      window.showToast?.(result.message);
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
    } finally {
      setAffiliateReviewWorking('');
    }
  };

  const updateAffiliateStatus = async (affiliateId, status) => {
    setAffiliateReviewWorking(`status:${affiliateId}`);
    try {
      const result = await patch(`/api/admin/affiliates/${encodeURIComponent(affiliateId)}/status`, { status });
      setAffiliateReviews((current) => {
        if (!current.data) return current;
        const affiliates = current.data.affiliates.map((item) => item.id === affiliateId ? { ...item, ...result.affiliate } : item);
        return { ...current, data: { ...current.data, affiliates, summary: { pending: affiliates.filter((item) => item.status === 'pending').length, active: affiliates.filter((item) => item.status === 'active').length, rejected: affiliates.filter((item) => item.status === 'rejected').length } } };
      });
      window.showToast?.(result.message);
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
    } finally {
      setAffiliateReviewWorking('');
    }
  };

  const saveAffiliateData = async (affiliateId, values) => {
    setAffiliateReviewWorking(`edit:${affiliateId}`);
    try {
      const result = await patch(`/api/admin/affiliates/${encodeURIComponent(affiliateId)}/account`, values);
      setAffiliateReviews((current) => {
        if (!current.data) return current;
        const affiliates = current.data.affiliates.map((item) => item.id === affiliateId ? { ...item, ...result.affiliate } : item);
        return { ...current, data: { ...current.data, affiliates } };
      });
      window.showToast?.(result.message);
      return true;
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
      return false;
    } finally {
      setAffiliateReviewWorking('');
    }
  };

  const reviewProUpgrade = async (requestId, decision, reviewNote) => {
    if (decision === 'rejected' && !String(reviewNote || '').trim()) {
      window.showToast?.('Isi alasan penolakan terlebih dahulu.', 'error');
      return;
    }
    if (decision === 'approved' && !window.confirm('Setujui pengajuan ini dan aktifkan akun Pro?')) return;
    setProUpgradeWorking(requestId);
    try {
      const result = await patch(`/api/admin/pro-upgrades/${encodeURIComponent(requestId)}/review`, { decision, review_note: reviewNote || '' });
      window.showToast?.(result.message);
      await loadProUpgrades();
      if (affiliateReviews.data) await loadAffiliateReviews();
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
    } finally {
      setProUpgradeWorking('');
    }
  };

  const addProPlatform = async (name) => {
    const cleanName = String(name || '').trim();
    if (cleanName.length < 2) {
      window.showToast?.('Nama media sosial minimal 2 karakter.', 'error');
      return false;
    }
    setProUpgradeWorking('platform:add');
    try {
      const result = await post('/api/admin/pro-upgrade-platforms', { name: cleanName });
      window.showToast?.(result.message);
      await Promise.all([loadAffiliateReviews(), proUpgrades.data ? loadProUpgrades() : Promise.resolve()]);
      return true;
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
      return false;
    } finally {
      setProUpgradeWorking('');
    }
  };

  const toggleProPlatform = async (platform) => {
    setProUpgradeWorking(`platform:${platform.id}`);
    try {
      const result = await patch(`/api/admin/pro-upgrade-platforms/${encodeURIComponent(platform.id)}`, { is_active: !platform.is_active });
      window.showToast?.(result.message);
      await Promise.all([loadAffiliateReviews(), proUpgrades.data ? loadProUpgrades() : Promise.resolve()]);
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
    } finally {
      setProUpgradeWorking('');
    }
  };

  const saveWithdrawalSettings = async (values) => {
    setWithdrawalWorking('settings');
    try {
      const result = await patch('/api/admin/withdrawal-settings', values);
      window.showToast?.(result.message);
      await loadWithdrawals();
      return true;
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
      return false;
    } finally {
      setWithdrawalWorking('');
    }
  };

  const processWithdrawal = async (withdrawal, draft) => {
    if (draft.status === 'paid' && !draft.proof && !withdrawal.has_transfer_proof) {
      window.showToast?.('Upload bukti transfer sebelum menandai penarikan selesai.', 'error');
      return false;
    }
    if (['rejected', 'cancelled'].includes(draft.status) && !String(draft.adminNote || '').trim()) {
      window.showToast?.('Isi catatan untuk penarikan yang ditolak atau dibatalkan.', 'error');
      return false;
    }
    setWithdrawalWorking(withdrawal.id);
    try {
      const form = new FormData();
      form.append('status', draft.status || withdrawal.status);
      form.append('adminNote', draft.adminNote || '');
      if (draft.proof) form.append('proof', draft.proof);
      const result = await post(`/api/admin/withdrawals/${encodeURIComponent(withdrawal.id)}/process`, form);
      window.showToast?.(result.message);
      await loadWithdrawals();
      return true;
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
      return false;
    } finally {
      setWithdrawalWorking('');
    }
  };

  const handleDatePreset = (preset) => {
    setFilterPreset(preset);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const formatYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      setSelectedYear('all');
    } else if (preset === 'today') {
      const ymd = formatYmd(now);
      setStartDate(ymd);
      setEndDate(ymd);
      setSelectedYear('all');
    } else if (preset === '7d') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(formatYmd(start));
      setEndDate(formatYmd(now));
      setSelectedYear('all');
    } else if (preset === '30d') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(formatYmd(start));
      setEndDate(formatYmd(now));
      setSelectedYear('all');
    } else if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(formatYmd(start));
      setEndDate(formatYmd(end));
      setSelectedYear('all');
    } else if (preset === 'this_year') {
      const yr = now.getFullYear();
      setStartDate(`${yr}-01-01`);
      setEndDate(`${yr}-12-31`);
      setSelectedYear(String(yr));
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    if (year === 'all') {
      setStartDate('');
      setEndDate('');
      setFilterPreset('all');
    } else {
      setStartDate(`${year}-01-01`);
      setEndDate(`${year}-12-31`);
      setFilterPreset('custom');
    }
  };

  const openCardModal = (cardConfig) => {
    setCardModalQuery('');
    setCardModalPage(1);
    setCardModal(cardConfig);
  };

  const openViewModal = (type, item) => {
    setViewItemModal({ type, data: item });
  };

  const openEditModal = (type, item) => {
    let draft = {};
    if (type === 'order') {
      draft = {
        status: item.status || 'waiting_payment',
        payment_status: item.payment_status || 'pending',
        payment_amount: Number(item.payment_amount ?? item.package_price ?? 0),
        website_active: Boolean(item.website_active),
        active_until: item.active_until ? String(item.active_until).slice(0, 10) : '',
        slug: item.slug || '',
        referral_name: item.referral_name || '',
        referral_amount: Number(item.referral_amount || 0),
      };
    } else if (type === 'free_order') {
      draft = {
        complimentary_note: item.complimentary_note || '',
        website_active: Boolean(item.website_active),
        active_until: item.active_until ? String(item.active_until).slice(0, 10) : '',
        slug: item.slug || '',
      };
    } else if (type === 'withdrawal') {
      draft = {
        status: item.status || 'pending',
        admin_note: item.admin_note || '',
        proofFile: null,
      };
    } else if (type === 'affiliate') {
      draft = {
        status: item.status || 'active',
        account_tier: item.account_tier || 'regular',
        full_name: item.full_name || '',
        phone: item.phone || '',
        nik: item.nik || '',
        referral_code: item.referral_code || '',
        bank_name: item.bank_name || '',
        bank_account_number: item.bank_account_number || '',
        bank_account_holder: item.bank_account_holder || '',
        review_note: item.review_note || '',
      };
    } else if (type === 'website') {
      draft = {
        website_active: Boolean(item.website_active),
        slug: item.slug || '',
        active_until: item.active_until ? String(item.active_until).slice(0, 10) : '',
      };
    }
    setEditItemModal({ type, data: item, draft });
  };

  const handleSaveModalEdit = async (type, item, draft) => {
    setWorking('modal-edit');
    try {
      if (type === 'order') {
        await saveOrderHistory(item.order_code, {
          status: draft.status,
          payment_status: draft.payment_status,
          payment_amount: Number(draft.payment_amount || 0),
        });
        await saveWebsiteAccess(item, {
          active: Boolean(draft.website_active),
          slug: draft.slug,
          active_until: draft.active_until || null,
        });
        if (draft.referral_name !== undefined || draft.referral_amount !== undefined) {
          await saveReferral(item, draft.referral_name, draft.referral_amount);
        }
      } else if (type === 'free_order') {
        await saveOrderHistory(item.order_code, {
          complimentary_note: draft.complimentary_note,
        });
        await saveWebsiteAccess(item, {
          active: Boolean(draft.website_active),
          slug: draft.slug,
          active_until: draft.active_until || null,
        });
      } else if (type === 'withdrawal') {
        await processWithdrawal(item, {
          status: draft.status,
          adminNote: draft.admin_note,
          proof: draft.proofFile,
        });
      } else if (type === 'affiliate') {
        if (draft.status !== item.status) {
          if (['active', 'suspended'].includes(draft.status)) {
            await updateAffiliateStatus(item.id, draft.status);
          } else if (['pending', 'rejected'].includes(draft.status)) {
            await reviewAffiliate(item.id, draft.status === 'rejected' ? 'rejected' : 'approved', draft.review_note || 'Pembaruan oleh admin');
          }
        }
        await saveAffiliateData(item.id, {
          full_name: draft.full_name,
          phone: draft.phone,
          nik: draft.nik,
          referral_code: draft.referral_code,
          account_tier: draft.account_tier,
          bank_name: draft.bank_name,
          bank_account_number: draft.bank_account_number,
          bank_account_holder: draft.bank_account_holder,
        });
      } else if (type === 'website') {
        await saveWebsiteAccess(item, {
          active: Boolean(draft.website_active),
          slug: draft.slug,
          active_until: draft.active_until || null,
        });
      }
      setEditItemModal(null);
      await reload();
      window.showToast?.('Perubahan berhasil disimpan.');
    } catch (err) {
      window.showToast?.(err.message || 'Gagal menyimpan perubahan.', 'error');
    } finally {
      setWorking('');
    }
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
  const sidebarNavigation = <>
    <div className="admin-mobile-header-tools">
      <div className="admin-notification-wrap">
        <button className={`admin-notification-button ${showNotifications ? 'is-open' : ''}`} type="button" onClick={toggleGlobalNotifications} aria-label="Pusat notifikasi" title="Pusat notifikasi">
          <svg viewBox="0 0 24 24" fill={totalUnreadCount > 0 ? '#f5b642' : 'none'} stroke={totalUnreadCount > 0 ? '#f5b642' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {totalUnreadCount > 0 && <b>{totalUnreadCount}</b>}
        </button>
        {showNotifications && (
          <div className="admin-notification-menu" onClick={(e) => e.stopPropagation()}>
            <div className="admin-global-notif-head">
              <div className="admin-global-notif-title-group">
                <strong>Pusat Notifikasi</strong>
                {totalUnreadCount > 0 ? (
                  <span className="notif-popover-count-pill has-count">
                    {totalUnreadCount} Baru
                  </span>
                ) : (
                  <span className="notif-popover-count-pill" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                    Semua terbaca
                  </span>
                )}
              </div>
              <button
                type="button"
                className={`notif-refresh-btn ${notifLoading ? 'is-refreshing' : ''}`}
                onClick={() => loadNotifications(true)}
                title="Segarkan notifikasi"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#ecfdf5',
                  border: '1.5px solid #10b981',
                  borderRadius: '7px',
                  color: '#064e3b',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  width: 'auto',
                  minHeight: 'auto',
                  height: 'auto',
                  opacity: 1,
                  visibility: 'visible',
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                  <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10"/>
                  <path d="M3 4v6h6"/>
                  <path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14"/>
                  <path d="M21 20v-6h-6"/>
                </svg>
                <span style={{ color: '#064e3b', fontWeight: '800' }}>{notifLoading ? 'Memuat...' : 'Refresh'}</span>
              </button>
            </div>

            <div className="admin-notif-tabs">
              <button
                type="button"
                className={`admin-notif-tab-btn ${globalNotifTab === 'all' ? 'is-active' : ''}`}
                onClick={() => setGlobalNotifTab('all')}
              >
                Semua {totalUnreadCount > 0 && <span className="admin-notif-tab-badge">{totalUnreadCount}</span>}
              </button>
              <button
                type="button"
                className={`admin-notif-tab-btn ${globalNotifTab === 'orders' ? 'is-active' : ''}`}
                onClick={() => handleSelectGlobalNotifTab('orders')}
              >
                🛒 Order {unreadCounts.orders > 0 && <span className="admin-notif-tab-badge">{unreadCounts.orders}</span>}
              </button>
              <button
                type="button"
                className={`admin-notif-tab-btn ${globalNotifTab === 'feedbacks' ? 'is-active' : ''}`}
                onClick={() => handleSelectGlobalNotifTab('feedbacks')}
              >
                💬 Saran {unreadCounts.feedbacks > 0 && <span className="admin-notif-tab-badge">{unreadCounts.feedbacks}</span>}
              </button>
              <button
                type="button"
                className={`admin-notif-tab-btn ${globalNotifTab === 'withdrawals' ? 'is-active' : ''}`}
                onClick={() => handleSelectGlobalNotifTab('withdrawals')}
              >
                💸 Tarik {unreadCounts.withdrawals > 0 && <span className="admin-notif-tab-badge">{unreadCounts.withdrawals}</span>}
              </button>
              <button
                type="button"
                className={`admin-notif-tab-btn ${globalNotifTab === 'affiliates' ? 'is-active' : ''}`}
                onClick={() => handleSelectGlobalNotifTab('affiliates')}
              >
                👤 Review {unreadCounts.affiliates > 0 && <span className="admin-notif-tab-badge">{unreadCounts.affiliates}</span>}
              </button>
            </div>

            <div className="admin-global-notif-feed">
              {getFilteredGlobalNotifications().length === 0 ? (
                <div className="notif-empty-state">
                  <p>Belum ada notifikasi pada kategori ini.</p>
                </div>
              ) : (
                getFilteredGlobalNotifications().map((item) => {
                  const unread = isItemUnread(item);
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className={`notif-item ${unread ? 'is-unread' : 'is-read'}`}
                      onClick={() => handleGlobalNotifItemClick(item)}
                      role="button"
                      tabIndex={0}
                      style={unread ? { background: '#f8fdfb' } : {}}
                    >
                      <div className={`notif-item-avatar ${item.type}`}>
                        {item.type === 'order' ? '🛒' : item.type === 'feedback' ? '💬' : item.type === 'withdrawal' ? '💸' : '👤'}
                      </div>
                      <div className="notif-item-content">
                        <div className="notif-item-top">
                          <span className="notif-item-name">{item.title}</span>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {unread && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '2.5px 8px',
                                  backgroundColor: '#0f766e',
                                  color: '#ffffff',
                                  fontSize: '10px',
                                  fontWeight: '800',
                                  borderRadius: '999px',
                                  letterSpacing: '0.04em',
                                  textTransform: 'uppercase',
                                  boxShadow: '0 1px 4px rgba(15, 118, 110, 0.4)',
                                  flexShrink: 0
                                }}
                              >
                                <span style={{
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: '50%',
                                  backgroundColor: '#34d399',
                                  display: 'inline-block'
                                }} />
                                Baru
                              </span>
                            )}
                            {item.status_label && (
                              <span className={`notif-item-status ${String(item.status || '').toLowerCase()}`}>
                                {item.status_label}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="notif-item-desc">{item.snippet}</p>
                        <span className="notif-item-time">{formatRelativeTime(item.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="dropdown-foot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => markCategoryAsRead('all')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#0f766e',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Tandai semua dibaca
              </button>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#475569',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
      <button className="admin-header-reload-btn" type="button" onClick={reload} title="Muat ulang data" aria-label="Muat ulang">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10"/><path d="M3 4v6h6"/><path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14"/><path d="M21 20v-6h-6"/></svg>
      </button>
      <button className={`admin-header-hamburger ${mobileTabOpen ? 'is-open' : ''}`} type="button" aria-label={mobileTabOpen ? 'Tutup menu admin' : 'Buka menu admin'} aria-expanded={mobileTabOpen} onClick={() => setMobileTabOpen((open) => !open)}>
        <span /><span /><span />
      </button>
    </div>
    {mobileTabOpen && <div className="admin-mobile-drawer-backdrop" onClick={() => setMobileTabOpen(false)} aria-hidden="true" />}
    <div className={`admin-sidebar-drawer ${mobileTabOpen ? 'is-open' : ''}`}>
      <div className="admin-drawer-head">
        <div className="admin-template-brand">
          <span className="admin-template-brand-logo" aria-hidden="true">
            <img className="admin-brand-logo-white" src="/assets/images/brand/daymoment-logo-white.webp" alt="Daymoment" />
          </span>
          <small className="admin-template-brand-label">Admin Panel</small>
        </div>
        <button className="admin-drawer-close" type="button" onClick={() => setMobileTabOpen(false)} aria-label="Tutup menu">✕</button>
      </div>
      <nav className="admin-sidebar-nav" aria-label="Menu admin" onClick={() => { setShowNotifications(false); setMobileTabOpen(false); }}>
        <button className={activeView === 'report' ? 'is-active' : ''} type="button" onClick={() => setActiveView('report')}>Laporan</button>
        <button className={activeView === 'fee' ? 'is-active' : ''} type="button" onClick={() => setActiveView('fee')}>Kelola fee</button>
        <button className={activeView === 'fee-report' ? 'is-active' : ''} type="button" onClick={() => setActiveView('fee-report')}>Laporan fee</button>
        <button className={activeView === 'setting' ? 'is-active' : ''} type="button" onClick={() => setActiveView('setting')}>Kelola template</button>
        <button className={activeView === 'editor' ? 'is-active' : ''} type="button" onClick={() => setActiveView('editor')}>Editor customer</button>
        <button className={activeView === 'affiliate-data' ? 'is-active' : ''} type="button" onClick={() => setActiveView('affiliate-data')}>Data affiliate</button>
        <button className={activeView === 'withdrawals' ? 'is-active' : ''} type="button" onClick={() => setActiveView('withdrawals')}>Penarikan affiliate</button>
        <button className={activeView === 'affiliates' ? 'is-active' : ''} type="button" onClick={() => setActiveView('affiliates')}>Review affiliate</button>
        <button className={activeView === 'order-history' ? 'is-active' : ''} type="button" onClick={() => setActiveView('order-history')}>Riwayat pesanan</button>
        <button className={`admin-nav-free-orders ${activeView === 'complimentary-orders' ? 'is-active' : ''}`.trim()} type="button" onClick={() => setActiveView('complimentary-orders')}>Order gratis</button>
        <button className={activeView === 'feedback' ? 'is-active' : ''} type="button" onClick={() => setActiveView('feedback')}>Feedback saran</button>
        <button className="admin-sidebar-logout" type="button" onClick={logout}>Keluar</button>
      </nav>
    </div>
  </>;
  const mobileStandaloneMenu = null;

  if (activeView === 'order-history') {
    return <AdminTemplate sidebar={sidebarNavigation}>
      <section className="admin-shell admin-view-order-history">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">OPERASIONAL PENJUALAN</span>
            <div className="admin-heading-title-line">
              <h1>Riwayat pesanan</h1>
              <div className="admin-heading-tools">
                <div className="heading-notif-box">
                  <button
                    type="button"
                    className={`heading-tool-btn heading-notif-btn ${unreadCounts.orders > 0 ? 'has-unread' : ''} ${openHeadingNotif === 'orders' ? 'is-open' : ''}`}
                    onClick={() => toggleHeadingNotif('orders')}
                    title={unreadCounts.orders > 0 ? `${unreadCounts.orders} pesanan baru (klik untuk tandai dibaca)` : 'Notifikasi riwayat pesanan'}
                    aria-label="Notifikasi pesanan"
                  >
                    <svg viewBox="0 0 24 24" fill={unreadCounts.orders > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {unreadCounts.orders > 0 && <span className="heading-notif-badge">{unreadCounts.orders}</span>}
                  </button>
                  {renderHeadingNotifDropdown('orders', 'Pesanan Terbaru', 'order-history')}
                </div>
                <button
                  type="button"
                  className={`heading-tool-btn heading-refresh-btn ${headingRefreshing === 'orders' ? 'is-spinning' : ''}`}
                  onClick={() => handleHeadingRefresh('orders', reload)}
                  title="Muat ulang riwayat pesanan & notifikasi"
                  aria-label="Muat ulang riwayat pesanan"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10"/><path d="M3 4v6h6"/><path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14"/><path d="M21 20v-6h-6"/>
                  </svg>
                </button>
              </div>
            </div>
            <p>Cari, filter, periksa detail, dan koreksi data transaksi dari satu halaman.</p>
          </div>
          {mobileStandaloneMenu}
        </div>
        <OrderHistoryPanel orders={regularOrders} templates={templateCatalog} affiliateOptions={data?.affiliate_options || []} working={working} onSave={saveOrderHistory} onSaveWebsite={saveWebsiteAccess} onReload={reload}/>
      </section>
    </AdminTemplate>;
  }

  if (activeView === 'editor') {
    return <AdminTemplate sidebar={sidebarNavigation}>
      <section className="admin-shell admin-view-editor">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">PUSAT PENJUALAN · AKSES CUSTOMER</span>
            <div className="admin-heading-title-line">
              <h1>Editor customer</h1>
              <div className="admin-heading-tools">
                <button
                  type="button"
                  className={`heading-tool-btn heading-refresh-btn ${headingRefreshing === 'editor' ? 'is-spinning' : ''}`}
                  onClick={() => handleHeadingRefresh('editor', reload)}
                  title="Muat ulang data editor customer"
                  aria-label="Muat ulang editor customer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10"/><path d="M3 4v6h6"/><path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14"/><path d="M21 20v-6h-6"/>
                  </svg>
                </button>
              </div>
            </div>
            <p>Buka dan ubah isi undangan customer yang sudah lunas (riwayat pesanan) dan order gratis dari admin.</p>
          </div>
          {mobileStandaloneMenu}
        </div>
        <CustomerEditorPanel orders={orders} working={working} onSaveWebsite={saveWebsiteAccess} onReload={reload} />
      </section>
    </AdminTemplate>;
  }

  if (activeView === 'complimentary-orders') {
    return <AdminTemplate sidebar={sidebarNavigation}>
      <section className="admin-shell admin-view-free-orders">
        <div className="admin-heading"><div><span className="eyebrow">AKSES KHUSUS CUSTOMER</span><h1>Order gratis</h1><p>Buat undangan tanpa pembayaran dan kirim akses editornya langsung ke email penerima.</p></div>{mobileStandaloneMenu}</div>
        <ComplimentaryOrdersPanel orders={orders} templates={templateCatalog} working={working} onCreate={createComplimentaryOrder} onResend={resendComplimentaryEmail} onSaveWebsite={saveWebsiteAccess} onReload={reload}/>
      </section>
    </AdminTemplate>;
  }

  if (activeView === 'feedback') {
    return <AdminTemplate sidebar={sidebarNavigation}>
      <section className="admin-shell admin-view-feedback">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">SUARA KLIEN &amp; PENGUNJUNG</span>
            <div className="admin-heading-title-line">
              <h1>Feedback &amp; saran</h1>
              <div className="admin-heading-tools">
                <div className="heading-notif-box">
                  <button
                    type="button"
                    className={`heading-tool-btn heading-notif-btn ${unreadCounts.feedbacks > 0 ? 'has-unread' : ''} ${openHeadingNotif === 'feedbacks' ? 'is-open' : ''}`}
                    onClick={() => toggleHeadingNotif('feedbacks')}
                    title={unreadCounts.feedbacks > 0 ? `${unreadCounts.feedbacks} saran baru (klik untuk tandai dibaca)` : 'Notifikasi feedback & saran'}
                    aria-label="Notifikasi feedback dan saran"
                  >
                    <svg viewBox="0 0 24 24" fill={unreadCounts.feedbacks > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {unreadCounts.feedbacks > 0 && <span className="heading-notif-badge">{unreadCounts.feedbacks}</span>}
                  </button>
                  {renderHeadingNotifDropdown('feedbacks', 'Feedback & Saran Terbaru', 'feedback')}
                </div>
                <button
                  type="button"
                  className={`heading-tool-btn heading-refresh-btn ${headingRefreshing === 'feedbacks' ? 'is-spinning' : ''}`}
                  onClick={() => handleHeadingRefresh('feedbacks', () => setFeedbackRefreshSignal((prev) => prev + 1))}
                  title="Muat ulang feedback & notifikasi"
                  aria-label="Muat ulang feedback & saran"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10"/><path d="M3 4v6h6"/><path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14"/><path d="M21 20v-6h-6"/>
                  </svg>
                </button>
              </div>
            </div>
            <p>Pantau kritik, saran, masukan perbaikan layanan, dan ide pengembangan website dari klien.</p>
          </div>
          {mobileStandaloneMenu}
        </div>
        <FeedbackManagementPanel refreshSignal={feedbackRefreshSignal} />
      </section>
    </AdminTemplate>;
  }

  if (activeView === 'fee') {
    return <AdminTemplate sidebar={sidebarNavigation}>
      <section className="admin-shell admin-view-fee">
        <div className="admin-heading"><div><span className="eyebrow">Pusat penjualan · selamat bekerja</span><h1>Kelola fee pembawa</h1><p>Fokus input dan edit fee pembawa tanpa menampilkan filter tanggal di bagian bawah.</p></div>{mobileStandaloneMenu}</div>
        <ReferralManagementPanel orders={periodOrders} working={working} onSave={saveReferral} />
      </section>
    </AdminTemplate>;
  }

  if (activeView === 'fee-report') {
    const carrierFilterOptions = [
      {
        value: 'all',
        label: 'Semua nama pembawa',
        description: `${periodOrders.length} order · ${money(periodOrders.reduce((sum, order) => sum + Number(order.referral_amount || 0), 0))}`
      },
      ...referralSummary.map((referral) => ({
        value: referral.name,
        label: referral.name,
        description: `${referral.orders} order · ${money(referral.payout)}`
      }))
    ];
    const isFilterActive = Boolean(startDate || endDate || reportCarrier !== 'all');

    return <AdminTemplate sidebar={sidebarNavigation}>
      <section className="admin-shell admin-view-fee-report">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">Pusat penjualan · komisi & fee</span>
            <h1>Laporan fee pembawa</h1>
            <p>Rekapitulasi fee pembawa berdasarkan order tersimpan untuk keperluan cetak, laporan, dan rekonsiliasi.</p>
          </div>
          <div className="admin-heading-actions">
            <button className="admin-fee-print-btn" type="button" onClick={printCarrierReport} title="Download Laporan PDF">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8" rx="1"/>
              </svg>
              <span>Cetak / PDF</span>
            </button>
          </div>
          {mobileStandaloneMenu}
        </div>

        <div className="admin-fee-report-toolbar">
          <div className="admin-fee-toolbar-select">
            <AdminFilterDropdown
              label="Nama pembawa"
              value={reportCarrier}
              options={carrierFilterOptions}
              onChange={(value) => setReportCarrier(value)}
            />
          </div>
          <div className="admin-fee-toolbar-dates">
            <label className="admin-fee-date-field">
              <span>Dari tanggal</span>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <label className="admin-fee-date-field">
              <span>Sampai tanggal</span>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </label>
          </div>
          {isFilterActive && (
            <button
              className="admin-fee-reset-btn"
              type="button"
              onClick={() => { setStartDate(''); setEndDate(''); setReportCarrier('all'); }}
              title="Reset semua filter ke default"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              <span>Reset filter</span>
            </button>
          )}
        </div>

        <div className="admin-fee-report-summary">
          <div className="fee-stat-card">
            <div className="fee-stat-icon fee-stat-icon-calendar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className="fee-stat-content">
              <span className="fee-stat-kicker">Periode Laporan</span>
              <strong className="fee-stat-value">{startDate || 'Awal'} — {endDate || 'Sekarang'}</strong>
              <small className="fee-stat-subtext">{startDate || endDate ? 'Rentang tanggal aktif' : 'Semua riwayat transaksi'}</small>
            </div>
          </div>

          <div className="fee-stat-card">
            <div className="fee-stat-icon fee-stat-icon-orders">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <div className="fee-stat-content">
              <span className="fee-stat-kicker">Jumlah Order</span>
              <strong className="fee-stat-value">{reportOrders.length} <span className="fee-stat-unit">order</span></strong>
              <small className="fee-stat-subtext">{reportCarrier === 'all' ? 'Seluruh nama pembawa' : `Pembawa: ${reportCarrier}`}</small>
            </div>
          </div>

          <div className="fee-stat-card fee-stat-card-highlight">
            <div className="fee-stat-icon fee-stat-icon-payout">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="20" height="14" x="2" y="5" rx="2"/>
                <line x1="2" x2="22" y1="10" y2="10"/>
              </svg>
            </div>
            <div className="fee-stat-content">
              <span className="fee-stat-kicker">Total Fee Pembawa</span>
              <strong className="fee-stat-value fee-stat-value-money">{money(reportPayout)}</strong>
              <small className="fee-stat-subtext">Akumulasi komisi periode ini</small>
            </div>
          </div>
        </div>

        <div className="admin-fee-report-grid">
          <div className="admin-fee-main-col">
            <section className="admin-panel admin-fee-table-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="eyebrow">Rincian data</span>
                  <h2>Daftar Transaksi Fee</h2>
                </div>
                <span className="admin-panel-note">{reportOrders.length} order tercatat</span>
              </div>

              <div className="report-table-wrap">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Nama pembawa</th>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Fee pembawa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportOrders.length ? reportOrders.map((order) => (
                      <tr key={`report-${order.id || order.order_code}`}>
                        <td>
                          <div className="carrier-cell-user">
                            <span className="carrier-avatar-pill">
                              {(order.referral_name || 'T')[0].toUpperCase()}
                            </span>
                            <span className="carrier-name-title">{order.referral_name || 'Tanpa nama pembawa'}</span>
                          </div>
                        </td>
                        <td>
                          <code className="order-code-badge">{order.order_code}</code>
                        </td>
                        <td>
                          <strong className="customer-name-row">{order.customer_name}</strong>
                        </td>
                        <td>
                          <span className={`admin-pill ${order.payment_status}`}>
                            {statusLabel(order.payment_status)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <b className="fee-amount-cell">{money(order.referral_amount)}</b>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="admin-empty">
                          <div className="fee-empty-container">
                            <span className="fee-empty-icon" aria-hidden="true">🧾</span>
                            <strong>Belum ada order pada filter ini</strong>
                            <p>Tidak ditemukan transaksi fee yang sesuai dengan nama pembawa atau periode tanggal yang dipilih.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="admin-fee-aside-col">
            <section className="admin-panel admin-carrier-sidebar-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="eyebrow">Atribusi pembawa</span>
                  <h2>Daftar Fee</h2>
                </div>
                <span className="admin-panel-badge">{referralSummary.length} pembawa</span>
              </div>

              <div className="referral-list-interactive">
                {referralSummary.length ? (
                  <>
                    <button
                      type="button"
                      className={`referral-row-btn ${reportCarrier === 'all' ? 'is-selected' : ''}`}
                      onClick={() => setReportCarrier('all')}
                    >
                      <div className="referral-row-content">
                        <strong>Semua nama pembawa</strong>
                        <small>{periodOrders.length} order · seluruh data</small>
                      </div>
                      <div className="referral-row-meta">
                        <b>{money(periodOrders.reduce((sum, order) => sum + Number(order.referral_amount || 0), 0))}</b>
                        {reportCarrier === 'all' && <span className="referral-active-badge">Aktif</span>}
                      </div>
                    </button>
                    {referralSummary.map((referral) => {
                      const isSelected = reportCarrier === referral.name;
                      return (
                        <button
                          type="button"
                          key={referral.name}
                          className={`referral-row-btn ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setReportCarrier(isSelected ? 'all' : referral.name)}
                          title={`Filter order: ${referral.name}`}
                        >
                          <div className="referral-row-content">
                            <strong>{referral.name}</strong>
                            <small>{referral.orders} order</small>
                          </div>
                          <div className="referral-row-meta">
                            <b>{money(referral.payout)}</b>
                            {isSelected && <span className="referral-active-badge">Aktif</span>}
                          </div>
                        </button>
                      );
                    })}
                  </>
                ) : (
                  <div className="admin-empty">Belum ada nama pembawa.</div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </AdminTemplate>;
  }


  if (activeView === 'affiliates') {
    return <AdminTemplate sidebar={sidebarNavigation}>
      <section className="admin-shell admin-view-affiliates">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">KEAMANAN PARTNER</span>
            <div className="admin-heading-title-line">
              <h1>Review affiliate</h1>
              <div className="admin-heading-tools">
                <div className="heading-notif-box">
                  <button
                    type="button"
                    className={`heading-tool-btn heading-notif-btn ${unreadCounts.affiliates > 0 ? 'has-unread' : ''} ${openHeadingNotif === 'affiliates' ? 'is-open' : ''}`}
                    onClick={() => toggleHeadingNotif('affiliates')}
                    title={unreadCounts.affiliates > 0 ? `${unreadCounts.affiliates} pendaftaran baru (klik untuk tandai dibaca)` : 'Notifikasi review affiliate'}
                    aria-label="Notifikasi review affiliate"
                  >
                    <svg viewBox="0 0 24 24" fill={unreadCounts.affiliates > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {unreadCounts.affiliates > 0 && <span className="heading-notif-badge">{unreadCounts.affiliates}</span>}
                  </button>
                  {renderHeadingNotifDropdown('affiliates', 'Pendaftaran Affiliate Terbaru', 'affiliates')}
                </div>
                <button
                  type="button"
                  className={`heading-tool-btn heading-refresh-btn ${headingRefreshing === 'affiliates' ? 'is-spinning' : ''}`}
                  onClick={() => handleHeadingRefresh('affiliates', loadAffiliateReviews)}
                  title="Muat ulang review affiliate & notifikasi"
                  aria-label="Muat ulang review affiliate"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10"/><path d="M3 4v6h6"/><path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14"/><path d="M21 20v-6h-6"/>
                  </svg>
                </button>
              </div>
            </div>
            <p>Periksa kesesuaian nama lengkap, NIK, dan foto KTP sebelum akun diaktifkan.</p>
          </div>
          {mobileStandaloneMenu}
        </div>
        <AffiliateReviewPanel data={affiliateReviews.data} loading={affiliateReviews.loading} error={affiliateReviews.error} working={affiliateReviewWorking} platformWorking={proUpgradeWorking} onReload={loadAffiliateReviews} onReview={reviewAffiliate} onResendCorrection={resendAffiliateCorrection} onAddPlatform={addProPlatform} onTogglePlatform={toggleProPlatform}/>
      </section>
    </AdminTemplate>;
  }

  if (activeView === 'affiliate-data') {
    return <AdminTemplate sidebar={sidebarNavigation}>
      <section className="admin-shell admin-view-affiliate-data">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">MANAJEMEN PARTNER</span>
            <div className="admin-heading-title-line">
              <h1>Data affiliate</h1>
              <div className="admin-heading-tools">
                <div className="heading-notif-box">
                  <button
                    type="button"
                    className={`heading-tool-btn heading-notif-btn ${unreadCounts.affiliates > 0 ? 'has-unread' : ''} ${openHeadingNotif === 'affiliates' ? 'is-open' : ''}`}
                    onClick={() => toggleHeadingNotif('affiliates')}
                    title={unreadCounts.affiliates > 0 ? `${unreadCounts.affiliates} pendaftaran baru (klik untuk tandai dibaca)` : 'Notifikasi data affiliate'}
                    aria-label="Notifikasi data affiliate"
                  >
                    <svg viewBox="0 0 24 24" fill={unreadCounts.affiliates > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {unreadCounts.affiliates > 0 && <span className="heading-notif-badge">{unreadCounts.affiliates}</span>}
                  </button>
                  {renderHeadingNotifDropdown('affiliates', 'Pendaftaran Affiliate Terbaru', 'affiliate-data')}
                </div>
                <button
                  type="button"
                  className={`heading-tool-btn heading-refresh-btn ${headingRefreshing === 'affiliates' ? 'is-spinning' : ''}`}
                  onClick={() => handleHeadingRefresh('affiliates', loadAffiliateReviews)}
                  title="Muat ulang data affiliate & notifikasi"
                  aria-label="Muat ulang data affiliate"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10"/><path d="M3 4v6h6"/><path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14"/><path d="M21 20v-6h-6"/>
                  </svg>
                </button>
              </div>
            </div>
            <p>Kelola data dan akses akun affiliate yang sudah disetujui.</p>
          </div>
          {mobileStandaloneMenu}
        </div>
        <AffiliateDataPanel data={affiliateReviews.data} loading={affiliateReviews.loading} error={affiliateReviews.error} working={affiliateReviewWorking} onReload={loadAffiliateReviews} onStatus={updateAffiliateStatus} onSave={saveAffiliateData}/>
      </section>
    </AdminTemplate>;
  }

  if (activeView === 'withdrawals') {
    return <AdminTemplate sidebar={sidebarNavigation}>
      <section className="admin-shell admin-view-withdrawals">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">PAYOUT MANUAL</span>
            <div className="admin-heading-title-line">
              <h1>Penarikan affiliate</h1>
              <div className="admin-heading-tools">
                <div className="heading-notif-box">
                  <button
                    type="button"
                    className={`heading-tool-btn heading-notif-btn ${unreadCounts.withdrawals > 0 ? 'has-unread' : ''} ${openHeadingNotif === 'withdrawals' ? 'is-open' : ''}`}
                    onClick={() => toggleHeadingNotif('withdrawals')}
                    title={unreadCounts.withdrawals > 0 ? `${unreadCounts.withdrawals} permintaan baru (klik untuk tandai dibaca)` : 'Notifikasi penarikan affiliate'}
                    aria-label="Notifikasi penarikan affiliate"
                  >
                    <svg viewBox="0 0 24 24" fill={unreadCounts.withdrawals > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {unreadCounts.withdrawals > 0 && <span className="heading-notif-badge">{unreadCounts.withdrawals}</span>}
                  </button>
                  {renderHeadingNotifDropdown('withdrawals', 'Permintaan Penarikan Terbaru', 'withdrawals')}
                </div>
                <button
                  type="button"
                  className={`heading-tool-btn heading-refresh-btn ${headingRefreshing === 'withdrawals' ? 'is-spinning' : ''}`}
                  onClick={() => handleHeadingRefresh('withdrawals', loadWithdrawals)}
                  title="Muat ulang data penarikan & notifikasi"
                  aria-label="Muat ulang penarikan affiliate"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10"/><path d="M3 4v6h6"/><path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14"/><path d="M21 20v-6h-6"/>
                  </svg>
                </button>
              </div>
            </div>
            <p>Atur fee, rekening pengirim, dan proses setiap permintaan transfer secara manual.</p>
          </div>
          {mobileStandaloneMenu}
        </div>
        <WithdrawalManagementPanel data={withdrawalAdmin.data} loading={withdrawalAdmin.loading} error={withdrawalAdmin.error} working={withdrawalWorking} onReload={loadWithdrawals} onSaveSettings={saveWithdrawalSettings} onProcess={processWithdrawal}/>
      </section>
    </AdminTemplate>;
  }

  return <AdminTemplate sidebar={sidebarNavigation}>
    <section className={`admin-shell admin-view-${activeView}`}>
      {activeView === 'fee' && <ReferralManagementPanel orders={periodOrders} working={working} onSave={saveReferral} />}
      <div className="admin-heading"><div><span className="eyebrow">Pusat penjualan · selamat bekerja</span><h1>{activeView === 'report' ? 'Dashboard laporan' : activeView === 'fee' ? 'Kelola fee pembawa' : activeView === 'fee-report' ? 'Laporan fee pembawa' : activeView === 'setting' ? 'Kelola katalog template' : 'Editor customer'}</h1><p>{activeView === 'report' ? 'Angka rapi, order terpantau, kepala lebih tenang.' : activeView === 'fee' ? 'Kelola fee pembawa dan pastikan data fee tersimpan dengan benar.' : activeView === 'fee-report' ? 'Laporan fee berdasarkan data yang sudah disimpan di order.' : activeView === 'setting' ? 'Atur sampul, nama, deskripsi, kategori, dan harga template.' : 'Buka dan ubah isi undangan customer yang sudah lunas.'}</p></div><div className="admin-heading-actions"><button className="button button-secondary" type="button" onClick={reload}>Muat ulang</button><button className="button button-secondary" type="button" onClick={logout}>Keluar</button></div></div>
      {data.mode === 'demo' && <div className="admin-demo-note">Mode demo aktif. Data akan muncul setelah ada order dari alur pemesanan.</div>}

      {/* Date & Year Filter Toolbar */}
      <div className="admin-report-filter-toolbar">
        <div className="report-filter-presets">
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#165643', textTransform: 'uppercase', marginRight: '4px' }}>Periode:</span>
          <button
            type="button"
            className={`filter-preset-btn ${filterPreset === 'all' && !startDate && !endDate ? 'is-active' : ''}`}
            onClick={() => handleDatePreset('all')}
          >
            Semua
          </button>
          <button
            type="button"
            className={`filter-preset-btn ${filterPreset === 'today' ? 'is-active' : ''}`}
            onClick={() => handleDatePreset('today')}
          >
            Hari Ini
          </button>
          <button
            type="button"
            className={`filter-preset-btn ${filterPreset === '7d' ? 'is-active' : ''}`}
            onClick={() => handleDatePreset('7d')}
          >
            7 Hari
          </button>
          <button
            type="button"
            className={`filter-preset-btn ${filterPreset === '30d' ? 'is-active' : ''}`}
            onClick={() => handleDatePreset('30d')}
          >
            30 Hari
          </button>
          <button
            type="button"
            className={`filter-preset-btn ${filterPreset === 'this_month' ? 'is-active' : ''}`}
            onClick={() => handleDatePreset('this_month')}
          >
            Bulan Ini
          </button>
          <button
            type="button"
            className={`filter-preset-btn ${filterPreset === 'this_year' ? 'is-active' : ''}`}
            onClick={() => handleDatePreset('this_year')}
          >
            Tahun Ini
          </button>
        </div>

        <div className="report-filter-custom">
          <div className="filter-input-wrap">
            <AdminCustomDropdown
              value={selectedYear}
              onChange={handleYearChange}
              options={[
                { value: 'all', label: 'Semua Tahun' },
                { value: '2026', label: '2026' },
                { value: '2025', label: '2025' },
                { value: '2024', label: '2024' },
                { value: '2023', label: '2023' },
              ]}
              prefix="Tahun:"
              minWidth="145px"
            />
          </div>

          <label className="filter-input-wrap">
            <span>Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setFilterPreset('custom');
                setSelectedYear('all');
              }}
            />
          </label>

          <label className="filter-input-wrap">
            <span>Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setFilterPreset('custom');
                setSelectedYear('all');
              }}
            />
          </label>

          {(startDate || endDate || selectedYear !== 'all') && (
            <button
              type="button"
              className="filter-reset-btn"
              onClick={() => handleDatePreset('all')}
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      <div className="admin-summary-container">
        {/* Section 1: Ringkasan Order & Penjualan */}
        <div className="admin-summary-section">
          <div className="admin-summary-header">
            <span className="admin-summary-kicker">Ringkasan Order &amp; Penjualan</span>
            <span className="admin-summary-hint">Klik card untuk membuka modal rincian data lengkap</span>
          </div>
          <div className="admin-stat-grid-4">
            <button
              className="admin-stat-card"
              type="button"
              onClick={() => openCardModal({
                type: 'orders',
                title: 'Semua Order Masuk',
                subtitle: 'Daftar seluruh order masuk reguler pada periode yang dipilih',
                items: periodOrders
              })}
            >
              <div className="admin-stat-card-label">
                <span>Total Order</span>
                <span className="admin-stat-card-badge badge-blue">Reguler</span>
              </div>
              <strong className="admin-stat-card-value">{summary.total_orders}</strong>
              <small className="admin-stat-card-meta">Lihat semua order masuk <b>→</b></small>
            </button>

            <button
              className="admin-stat-card admin-stat-card-accent"
              type="button"
              onClick={() => openCardModal({
                type: 'orders',
                title: 'Order Sudah Lunas',
                subtitle: 'Pesanan yang telah sukses menyelesaikan pembayaran',
                items: periodOrders.filter((o) => o.payment_status === 'paid')
              })}
            >
              <div className="admin-stat-card-label">
                <span>Omzet Lunas</span>
                <span className="admin-stat-card-badge badge-green">Lunas</span>
              </div>
              <strong className="admin-stat-card-value">{money(summary.total_revenue)}</strong>
              <small className="admin-stat-card-meta">{summary.total_paid} order lunas <b>→</b></small>
            </button>

            <button
              className="admin-stat-card admin-stat-card-pending"
              type="button"
              onClick={() => openCardModal({
                type: 'orders',
                title: 'Menunggu Pembayaran',
                subtitle: 'Pesanan yang belum lunas dan perlu follow-up via WhatsApp',
                items: periodOrders.filter((o) => o.payment_status === 'pending')
              })}
            >
              <div className="admin-stat-card-label">
                <span>Menunggu Bayar</span>
                <span className="admin-stat-card-badge badge-amber">Follow-up</span>
              </div>
              <strong className="admin-stat-card-value">{summary.total_pending || 0}</strong>
              <small className="admin-stat-card-meta">Perlu follow-up via WA <b>→</b></small>
            </button>

            <button
              className="admin-stat-card admin-stat-card-free"
              type="button"
              onClick={() => openCardModal({
                type: 'free_orders',
                title: 'Data Order Gratis (Complimentary)',
                subtitle: 'Daftar undangan gratis yang dibuat khusus oleh admin tanpa pembayaran',
                items: periodFreeOrders
              })}
            >
              <div className="admin-stat-card-label">
                <span>Total Order Gratis</span>
                <span className="admin-stat-card-badge badge-purple">Free</span>
              </div>
              <strong className="admin-stat-card-value">{periodFreeOrders.length}</strong>
              <small className="admin-stat-card-meta">{websiteStats.freeActiveCount} website aktif <b>→</b></small>
            </button>
          </div>
        </div>

        {/* Section 2: Finansial & Komisi Mitra Affiliate */}
        <div className="admin-summary-section">
          <div className="admin-summary-header">
            <span className="admin-summary-kicker">Kinerja &amp; Finansial Mitra Affiliate</span>
            <span className="admin-summary-hint">Perhitungan omset template &amp; bagi hasil komisi</span>
          </div>
          <div className="admin-stat-grid-4">
            <button
              className="admin-stat-card"
              type="button"
              onClick={() => openCardModal({
                type: 'affiliate_sales',
                title: 'Rincian Komisi Mitra Affiliate',
                subtitle: 'Komisi yang diperoleh para mitra affiliate dari order template yang sudah lunas',
                items: paidAffiliateOrders
              })}
            >
              <div className="admin-stat-card-label">
                <span>Total Komisi Affiliate</span>
                <span className="admin-stat-card-badge badge-blue">Mitra</span>
              </div>
              <strong className="admin-stat-card-value">{money(affiliateFinancials.commission)}</strong>
              <small className="admin-stat-card-meta">{paidAffiliateOrders.length} order lunas affiliate <b>→</b></small>
            </button>

            <button
              className="admin-stat-card"
              type="button"
              onClick={() => openCardModal({
                type: 'affiliate_sales',
                title: 'Omzet Penjualan Template via Affiliate',
                subtitle: 'Nilai penjualan kotor dari paket undangan yang terjual melalui jalur affiliate',
                items: paidAffiliateOrders
              })}
            >
              <div className="admin-stat-card-label">
                <span>Omzet via Affiliate</span>
                <span className="admin-stat-card-badge badge-green">Penjualan</span>
              </div>
              <strong className="admin-stat-card-value">{money(affiliateFinancials.omset)}</strong>
              <small className="admin-stat-card-meta">Total omset template terjual <b>→</b></small>
            </button>

            <button
              className="admin-stat-card admin-stat-card-profit"
              type="button"
              onClick={() => openCardModal({
                type: 'affiliate_sales',
                title: 'Keuntungan Bersih DayMoment dari Penjualan Affiliate',
                subtitle: 'Omzet template terjual via affiliate dikurangi hak komisi mitra affiliate',
                items: paidAffiliateOrders
              })}
            >
              <div className="admin-stat-card-label">
                <span>Keuntungan Bersih Kita</span>
                <span className="admin-stat-card-badge badge-green">Laba Bersih</span>
              </div>
              <strong className="admin-stat-card-value">{money(affiliateFinancials.netProfit)}</strong>
              <small className="admin-stat-card-meta">Omset dikurang komisi mitra <b>→</b></small>
            </button>

            <button
              className="admin-stat-card"
              type="button"
              onClick={() => openCardModal({
                type: 'orders',
                title: 'Semua Order Jalur Affiliate',
                subtitle: 'Pesanan yang masuk melalui link atau kode referral mitra affiliate',
                items: periodAffiliateOrders
              })}
            >
              <div className="admin-stat-card-label">
                <span>Order via Affiliate</span>
                <span className="admin-stat-card-badge badge-blue">Mitra</span>
              </div>
              <strong className="admin-stat-card-value">{periodAffiliateOrders.length}</strong>
              <small className="admin-stat-card-meta">{paidAffiliateOrders.length} lunas · {periodAffiliateOrders.length - paidAffiliateOrders.length} pending <b>→</b></small>
            </button>
          </div>
        </div>

        {/* Section 3: Penarikan Saldo Affiliate */}
        <div className="admin-summary-section">
          <div className="admin-summary-header">
            <span className="admin-summary-kicker">Penarikan Saldo Affiliate (Payout)</span>
            <span className="admin-summary-hint">Monitoring pencairan saldo komisi para affiliate</span>
          </div>
          <div className="admin-stat-grid-4">
            <button
              className="admin-stat-card"
              type="button"
              onClick={() => openCardModal({
                type: 'withdrawals',
                title: 'Semua Pengajuan Penarikan Saldo Affiliate',
                subtitle: 'Seluruh riwayat permohonan penarikan saldo komisi para affiliate',
                items: periodWithdrawals
              })}
            >
              <div className="admin-stat-card-label">
                <span>Total Pengajuan Penarikan</span>
                <span className="admin-stat-card-badge badge-blue">Semua</span>
              </div>
              <strong className="admin-stat-card-value">{withdrawalStats.totalCount}</strong>
              <small className="admin-stat-card-meta">Total {money(withdrawalStats.totalAmount)} diajukan <b>→</b></small>
            </button>

            <button
              className="admin-stat-card admin-stat-card-accent"
              type="button"
              onClick={() => openCardModal({
                type: 'withdrawals',
                title: 'Penarikan Selesai (Sudah Ditransfer)',
                subtitle: 'Permintaan payout affiliate yang telah sukses ditransfer oleh admin',
                items: withdrawalStats.paid
              })}
            >
              <div className="admin-stat-card-label">
                <span>Ditransfer Selesai</span>
                <span className="admin-stat-card-badge badge-green">Selesai</span>
              </div>
              <strong className="admin-stat-card-value">{withdrawalStats.paidCount}</strong>
              <small className="admin-stat-card-meta">{money(withdrawalStats.paidAmount)} berhasil ditransfer <b>→</b></small>
            </button>

            <button
              className="admin-stat-card admin-stat-card-pending"
              type="button"
              onClick={() => openCardModal({
                type: 'withdrawals',
                title: 'Penarikan Belum Selesai (Menunggu / Diproses)',
                subtitle: 'Permintaan penarikan yang masih menunggu transfer dan bukti transfer',
                items: withdrawalStats.pending
              })}
            >
              <div className="admin-stat-card-label">
                <span>Belum Selesai</span>
                <span className="admin-stat-card-badge badge-amber">Antrean</span>
              </div>
              <strong className="admin-stat-card-value">{withdrawalStats.pendingCount}</strong>
              <small className="admin-stat-card-meta">{money(withdrawalStats.pendingAmount)} menunggu transfer <b>→</b></small>
            </button>

            <button
              className="admin-stat-card admin-stat-card-rejected"
              type="button"
              onClick={() => openCardModal({
                type: 'withdrawals',
                title: 'Penarikan Ditolak / Dibatalkan',
                subtitle: 'Permintaan penarikan yang ditolak atau dibatalkan karena kendala rekening atau data',
                items: withdrawalStats.rejected
              })}
            >
              <div className="admin-stat-card-label">
                <span>Penarikan Ditolak</span>
                <span className="admin-stat-card-badge badge-red">Ditolak</span>
              </div>
              <strong className="admin-stat-card-value">{withdrawalStats.rejectedCount}</strong>
              <small className="admin-stat-card-meta">{money(withdrawalStats.rejectedAmount)} ditolak / batal <b>→</b></small>
            </button>
          </div>
        </div>

        {/* Section 4: Status Kemitraan & Review Affiliate */}
        <div className="admin-summary-section">
          <div className="admin-summary-header">
            <span className="admin-summary-kicker">Status Kemitraan &amp; Review Affiliate</span>
            <span className="admin-summary-hint">Manajemen status aktif/nonaktif dan verifikasi identitas KTP &amp; NIK</span>
          </div>
          <div className="admin-stat-grid-5">
            <button
              className="admin-stat-card"
              type="button"
              onClick={() => openCardModal({
                type: 'affiliates',
                title: 'Semua Mitra Affiliate Terdaftar',
                subtitle: 'Database lengkap seluruh mitra affiliate yang terdaftar di sistem DayMoment',
                items: periodAffiliates
              })}
            >
              <div className="admin-stat-card-label">
                <span>Total Affiliate</span>
                <span className="admin-stat-card-badge badge-blue">Database</span>
              </div>
              <strong className="admin-stat-card-value">{affiliateStats.totalCount}</strong>
              <small className="admin-stat-card-meta">Semua akun mitra <b>→</b></small>
            </button>

            <button
              className="admin-stat-card admin-stat-card-accent"
              type="button"
              onClick={() => openCardModal({
                type: 'affiliates',
                title: 'Mitra Affiliate Aktif & Disetujui',
                subtitle: 'Mitra resmi yang aktif memiliki link, kode referral, dan siap berpromosi',
                items: affiliateStats.active
              })}
            >
              <div className="admin-stat-card-label">
                <span>Mitra Aktif</span>
                <span className="admin-stat-card-badge badge-green">Aktif</span>
              </div>
              <strong className="admin-stat-card-value">{affiliateStats.activeCount}</strong>
              <small className="admin-stat-card-meta">Mitra resmi berpromosi <b>→</b></small>
            </button>

            <button
              className="admin-stat-card admin-stat-card-gray"
              type="button"
              onClick={() => openCardModal({
                type: 'affiliates',
                title: 'Mitra Affiliate Nonaktif / Ditangguhkan',
                subtitle: 'Akun mitra yang saat ini berstatus nonaktif atau ditangguhkan oleh admin',
                items: affiliateStats.inactive
              })}
            >
              <div className="admin-stat-card-label">
                <span>Mitra Nonaktif</span>
                <span className="admin-stat-card-badge badge-gray">Nonaktif</span>
              </div>
              <strong className="admin-stat-card-value">{affiliateStats.inactiveCount}</strong>
              <small className="admin-stat-card-meta">Akun dinonaktifkan <b>→</b></small>
            </button>

            <button
              className="admin-stat-card admin-stat-card-pending"
              type="button"
              onClick={() => openCardModal({
                type: 'affiliates',
                title: 'Pendaftaran Affiliate Menunggu Review',
                subtitle: 'Calon mitra affiliate yang membutuhkan verifikasi identitas (KTP & NIK)',
                items: affiliateStats.pending
              })}
            >
              <div className="admin-stat-card-label">
                <span>Perlu Direview</span>
                <span className="admin-stat-card-badge badge-amber">Pending</span>
              </div>
              <strong className="admin-stat-card-value">{affiliateStats.pendingCount}</strong>
              <small className="admin-stat-card-meta">Verifikasi KTP <b>→</b></small>
            </button>

            <button
              className="admin-stat-card admin-stat-card-rejected"
              type="button"
              onClick={() => openCardModal({
                type: 'affiliates',
                title: 'Pendaftaran Affiliate Ditolak',
                subtitle: 'Pendaftaran mitra yang ditolak karena data tidak sesuai atau tidak lengkap',
                items: affiliateStats.rejected
              })}
            >
              <div className="admin-stat-card-label">
                <span>Mitra Ditolak</span>
                <span className="admin-stat-card-badge badge-red">Ditolak</span>
              </div>
              <strong className="admin-stat-card-value">{affiliateStats.rejectedCount}</strong>
              <small className="admin-stat-card-meta">Pendaftaran ditolak <b>→</b></small>
            </button>
          </div>
        </div>

        {/* Section 5: Monitoring Website Aktif */}
        <div className="admin-summary-section">
          <div className="admin-summary-header">
            <span className="admin-summary-kicker">Monitoring Website Aktif</span>
            <span className="admin-summary-hint">{websiteStats.rate}% ({websiteStats.allActiveCount} dari {combinedPeriodOrders.length}) undangan sedang aktif</span>
          </div>
          <div className="admin-stat-grid-4">
            <button
              className="admin-stat-card"
              type="button"
              onClick={() => openCardModal({
                type: 'websites',
                title: 'Semua Website Undangan yang Aktif',
                subtitle: 'Seluruh website yang terbit, akses dibuka, dan belum kedaluwarsa',
                items: websiteStats.allActive
              })}
            >
              <div className="admin-stat-card-label">
                <span>Total Website Aktif</span>
                <span className="admin-stat-card-badge badge-green">{websiteStats.rate}%</span>
              </div>
              <strong className="admin-stat-card-value">{websiteStats.allActiveCount}</strong>
              <small className="admin-stat-card-meta">Seluruh website aktif <b>→</b></small>
            </button>

            <button
              className="admin-stat-card"
              type="button"
              onClick={() => openCardModal({
                type: 'websites',
                title: 'Website Aktif: Order Berbayar Langsung DayMoment',
                subtitle: 'Website aktif dari pemesan langsung tanpa melalui perantara affiliate',
                items: websiteStats.directActive
              })}
            >
              <div className="admin-stat-card-label">
                <span>Order Berbayar Langsung</span>
                <span className="admin-stat-card-badge badge-blue">Direct</span>
              </div>
              <strong className="admin-stat-card-value">{websiteStats.directActiveCount}</strong>
              <small className="admin-stat-card-meta">Langsung dari DayMoment <b>→</b></small>
            </button>

            <button
              className="admin-stat-card"
              type="button"
              onClick={() => openCardModal({
                type: 'websites',
                title: 'Website Aktif: Dari Penjualan Affiliate',
                subtitle: 'Website aktif dari pesanan customer yang dipromosikan oleh mitra affiliate',
                items: websiteStats.affiliateActive
              })}
            >
              <div className="admin-stat-card-label">
                <span>Dari Jalur Affiliate</span>
                <span className="admin-stat-card-badge badge-green">Affiliate</span>
              </div>
              <strong className="admin-stat-card-value">{websiteStats.affiliateActiveCount}</strong>
              <small className="admin-stat-card-meta">Hasil promosi mitra <b>→</b></small>
            </button>

            <button
              className="admin-stat-card admin-stat-card-free"
              type="button"
              onClick={() => openCardModal({
                type: 'websites',
                title: 'Website Aktif: Dari Order Gratis (Complimentary)',
                subtitle: 'Website aktif yang dibuat langsung dari alur order gratis admin',
                items: websiteStats.freeActive
              })}
            >
              <div className="admin-stat-card-label">
                <span>Dari Order Gratis</span>
                <span className="admin-stat-card-badge badge-purple">Free</span>
              </div>
              <strong className="admin-stat-card-value">{websiteStats.freeActiveCount}</strong>
              <small className="admin-stat-card-meta">Jalur complimentary <b>→</b></small>
            </button>
          </div>
        </div>
      </div>

      <div className="admin-insight-grid">
        <section className="admin-panel revenue-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">Pemasukan</span>
              <h2>Performa penjualan</h2>
            </div>
            <span className="admin-panel-note">14 hari terakhir</span>
          </div>
          {revenueEntries.length ? (
            <div className="revenue-chart-scroller">
              <div className="revenue-chart" aria-label="Grafik pemasukan harian">
                {revenueEntries.map(([date, value]) => (
                  <div className="revenue-column" key={date}>
                    <span className="revenue-value">{money(value)}</span>
                    <div className="revenue-bar-wrap">
                      <div className="revenue-bar" style={{ height: `${Math.max((Number(value) / maxRevenue) * 100, 5)}%` }} />
                    </div>
                    <small>{dayFormat.format(new Date(`${date}T00:00:00`))}</small>
                  </div>
                ))}
              </div>
              <small className="revenue-scroll-hint">Geser grafik ke kanan untuk melihat seluruh data →</small>
            </div>
          ) : (
            <div className="admin-empty admin-chart-empty">Belum ada pemasukan lunas untuk ditampilkan.</div>
          )}
        </section>

        <section className="admin-panel top-affiliates-card">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">Peringkat Penjualan</span>
              <h2>Top 5 Affiliate Teratas</h2>
            </div>
            <span className="admin-panel-note">Berdasarkan total penjualan template</span>
          </div>

          <div className="top-affiliates-list">
            {topAffiliates.length ? topAffiliates.map((item, index) => {
              const rankClass = index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : 'rank-default';
              const isSelected = activePanel === `top_affiliate:${item.id}`;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`top-affiliate-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => openCardModal({
                    type: 'orders',
                    title: `Pesanan Template dari ${item.name}`,
                    subtitle: `Daftar seluruh pesanan template yang dihasilkan mitra ${item.name} (Kode: ${item.code})`,
                    items: periodOrders.filter((o) => String(o.affiliate_id) === String(item.id) || o.referral_name === item.name || o.affiliate_name === item.name || o.affiliate_referral_code === item.code)
                  })}
                  title="Klik untuk melihat modal rincian pesanan affiliate ini"
                >
                  <div className="top-affiliate-left">
                    <span className={`top-affiliate-rank ${rankClass}`}>#{index + 1}</span>
                    <div className="top-affiliate-info">
                      <strong>{item.name}</strong>
                      <small>
                        Kode: <b>{item.code}</b> · {item.paidOrdersCount} order lunas ({item.ordersCount} total)
                      </small>
                    </div>
                  </div>
                  <div className="top-affiliate-right">
                    <span className="top-affiliate-rev">{money(item.revenue)}</span>
                    <span className="top-affiliate-profit">Komisi: {money(item.commission)} · Laba: +{money(item.netProfit)}</span>
                  </div>
                </button>
              );
            }) : (
              <div className="admin-empty" style={{ padding: '24px 12px' }}>
                Belum ada transaksi penjualan dari mitra affiliate.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="admin-settings-panel admin-panel">
        <div className="admin-panel-heading admin-catalog-heading"><div><span className="eyebrow">Katalog template</span><h2>Sampul dan informasi produk</h2></div><span className="admin-panel-note">Perubahan digunakan di website utama dan etalase affiliate</span></div>
        <div className="admin-template-pricing-grid">{templateCatalog.map((template) => <TemplateCatalogEditor key={template.code} template={template} priceDrafts={priceDrafts} setPriceDrafts={setPriceDrafts} commissionDrafts={commissionDrafts} setCommissionDrafts={setCommissionDrafts} working={working} onSavePackage={savePackageSettings} onReload={reload} />)}</div>
      </section>

      {/* Permanent Bottom Tables with Independent Sub-Table Pagination */}
      <AdminBottomTables
        orders={periodOrders}
        freeOrders={periodFreeOrders}
        withdrawals={periodWithdrawals}
        affiliates={periodAffiliates}
        activeWebsites={websiteStats.allActive}
        isAffiliateOrder={isAffiliateOrder}
        statusLabel={statusLabel}
        whatsappUrl={whatsappUrl}
        onView={openViewModal}
        onEdit={openEditModal}
      />

      {/* Pop-up Modal when clicking stat cards */}
      <CardDetailModal
        modal={cardModal}
        query={cardModalQuery}
        onQueryChange={setCardModalQuery}
        page={cardModalPage}
        onPageChange={setCardModalPage}
        onClose={() => setCardModal(null)}
        onView={openViewModal}
        onEdit={openEditModal}
        isAffiliateOrder={isAffiliateOrder}
        statusLabel={statusLabel}
        whatsappUrl={whatsappUrl}
      />

      {/* View Item Detail Modal */}
      <ViewItemDetailModal
        viewModal={viewItemModal}
        onClose={() => setViewItemModal(null)}
        onEdit={openEditModal}
        statusLabel={statusLabel}
        orderStatusLabel={orderStatusLabel}
        whatsappUrl={whatsappUrl}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        editModal={editItemModal}
        working={working === 'modal-edit'}
        onClose={() => setEditItemModal(null)}
        onSave={handleSaveModalEdit}
      />
    </section>
  </AdminTemplate>;
}

