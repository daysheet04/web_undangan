import React, { useEffect, useMemo, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { Loading, ErrorState } from '../components/Layout.jsx';
import { get, money, patch, post } from '../lib/api.js';
import { useRemote } from '../lib/hooks.js';
import AdminLogin from '../components/AdminLogin.jsx';
import AdminTemplate from '../templates/AdminTemplate.jsx';
import TemplateCover from '../components/TemplateCover.jsx';

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

function TemplateCatalogEditor({ template, priceDrafts, setPriceDrafts, working, onSavePrice, onReload }) {
  const [draft, setDraft] = useState({ name: template.name || '', category: template.category || '', description: template.description || '' });
  const [cover, setCover] = useState({ thumbnail: template.thumbnail, thumbnail_url: template.thumbnail_url });
  const [templateVisible, setTemplateVisible] = useState(template.is_active !== false);
  const [packageVisibility, setPackageVisibility] = useState(() => Object.fromEntries((template.packages || []).map((item) => [item.code, item.is_active !== false])));
  const [catalogWorking, setCatalogWorking] = useState('');

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

  const uploadCover = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    setCatalogWorking('cover');
    try {
      const result = await post(`/api/admin/templates/${encodeURIComponent(template.code)}/cover`, form);
      setCover({
        thumbnail: result.thumbnail,
        thumbnail_url: `${result.thumbnail_url}${result.thumbnail_url.includes('?') ? '&' : '?'}v=${Date.now()}`,
      });
      window.showToast?.('Gambar sampul berhasil diganti.');
      onReload();
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
    } finally {
      input.value = '';
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
        <p>JPG, PNG, atau WEBP. Maksimal 4 MB.</p>
        <label className={`admin-cover-upload ${catalogWorking === 'cover' ? 'is-loading' : ''}`}>
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={Boolean(catalogWorking)} onChange={uploadCover} />
          {catalogWorking === 'cover' ? 'Mengunggah...' : 'Ganti sampul'}
        </label>
      </div>
    </div>
    <form className="admin-template-meta-form" onSubmit={saveDetails}>
      <label><span>Nama template</span><input maxLength="100" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} required /></label>
      <label><span>Kategori</span><input maxLength="50" value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} required /></label>
      <label className="admin-template-description"><span>Deskripsi</span><textarea maxLength="255" rows="3" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} required /><small>{draft.description.length}/255</small></label>
      <button className="admin-save-template" type="submit" disabled={Boolean(catalogWorking)}>{catalogWorking === 'details' ? 'Menyimpan...' : 'Simpan informasi'}</button>
    </form>
    <div className="admin-template-pricing-header"><div><strong>Harga paket</strong><small>{template.name}</small></div><span className="admin-pill active">{template.package_count || template.packages?.length || 0} paket</span></div>
    <div className="admin-template-price-list">{(template.packages || []).map((packageItem) => { const key = `${template.code}:${packageItem.code}`; const currentValue = priceDrafts[key] ?? packageItem.price ?? 0; const packageVisible = packageVisibility[packageItem.code] !== false; const visibilityWorking = catalogWorking === `package-visibility:${packageItem.code}`; return <div className={`admin-template-price-row ${packageVisible ? '' : 'is-package-hidden'}`.trim()} key={key}><div className="admin-package-meta"><strong>{packageItem.name}</strong><small>{packageItem.tagline}</small><em>{packageVisible ? 'Tampil di katalog' : 'Sedang maintenance'}</em></div><div className="admin-price-editor"><span>Rp</span><input type="text" inputMode="numeric" value={formatRupiahInput(currentValue)} onChange={(event) => setPriceDrafts((current) => ({ ...current, [key]: event.target.value.replace(/\D/g, '') }))} /></div><div className="admin-package-actions"><button className={`admin-package-visibility ${packageVisible ? 'is-visible' : 'is-hidden'}`} type="button" disabled={Boolean(catalogWorking)} onClick={() => togglePackageVisibility(packageItem)}>{visibilityWorking ? 'Menyimpan...' : packageVisible ? 'Hide' : 'Show'}</button><button className="admin-save-price" type="button" disabled={working === `price:${key}`} onClick={() => onSavePrice(template.code, packageItem.code)}>{working === `price:${key}` ? 'Menyimpan...' : 'Simpan'}</button></div></div>; })}</div>
  </article>;
}

function HomepageHeroEditor({ homepage, onReload }) {
  const [preview, setPreview] = useState(homepage?.hero_image_url || '');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    setPreview(homepage?.hero_image_url || '');
  }, [homepage?.hero_image_url]);

  const uploadHero = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      window.showToast?.('Format gambar harus JPG, PNG, atau WEBP.', 'error');
      input.value = '';
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      window.showToast?.('Ukuran gambar maksimal 4 MB.', 'error');
      input.value = '';
      return;
    }

    const form = new FormData();
    form.append('file', file);
    setWorking(true);
    try {
      const result = await post('/api/admin/homepage/hero-image', form);
      setPreview(`${result.hero_image_url}?v=${Date.now()}`);
      window.showToast?.(result.message);
      await onReload();
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
    } finally {
      input.value = '';
      setWorking(false);
    }
  };

  return <section className="admin-homepage-hero-editor">
    <div className="admin-homepage-preview" aria-label="Preview gambar dalam ponsel">
      <div className="admin-homepage-phone">
        <span />
        {preview ? <img src={preview} alt="Preview visual hero homepage" /> : <div className="admin-homepage-placeholder"><small>THE WEDDING OF</small><strong>A <i>&amp;</i> N</strong><em>Hari yang baik</em></div>}
      </div>
    </div>
    <div className="admin-homepage-copy">
      <span className="eyebrow">Tampilan beranda</span>
      <h3>Visual di dalam ponsel</h3>
      <p>Gambar ini tampil di mockup ponsel pada bagian paling atas homepage. Gunakan gambar potret agar komposisinya tetap cantik di desktop maupun mobile.</p>
      <ul><li>Rasio yang disarankan 9:16</li><li>JPG, PNG, atau WEBP</li><li>Maksimal 4 MB</li></ul>
      <label className={`admin-homepage-upload ${working ? 'is-loading' : ''}`}>
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={working} onChange={uploadHero} />
        <span>{working ? 'Mengunggah gambar...' : preview ? 'Ganti gambar hero' : 'Pilih gambar hero'}</span>
        <small>{working ? 'Mohon tunggu' : 'Pilih file'}</small>
      </label>
    </div>
  </section>;
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
  const selected = options.find((option) => option.value === value) || options[0];
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

function affiliatePaginationItems(page, pageCount) {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, index) => index + 1);
  if (page <= 3) return [1, 2, 3, 4, 'end-gap', pageCount];
  if (page >= pageCount - 2) return [1, 'start-gap', pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  return [1, 'start-gap', page - 1, page, page + 1, 'end-gap', pageCount];
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

function AffiliateReviewPanel({ data, loading, error, working, onReload, onReview, onResendCorrection }) {
  const [notes, setNotes] = useState({});
  const [preview, setPreview] = useState(null);
  const [openHistories, setOpenHistories] = useState({});
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
    const matchesQuery = !query || `${affiliate.full_name || ''} ${affiliate.nik || ''} ${affiliate.email || ''} ${affiliate.phone || ''}`.toLowerCase().includes(query);
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
  const card = (affiliate) => {
    const reviewHistory = Array.isArray(affiliate.review_history) ? affiliate.review_history : [];
    const historyOpen = Boolean(openHistories[affiliate.id]);
    const historyLabel = { rejected: 'Pendaftaran ditolak', resubmitted: 'Mengajukan kembali', approved: 'Pendaftaran disetujui' };
    return <article className="admin-affiliate-review-card" key={affiliate.id}>
    <div className="admin-affiliate-ktp">
      {affiliate.ktp_url ? <button type="button" onClick={() => setPreview({ src: affiliate.ktp_url, name: affiliate.full_name })} aria-label={`Perbesar foto KTP ${affiliate.full_name}`}><img src={affiliate.ktp_url} alt={`KTP ${affiliate.full_name}`} loading="lazy"/><span>Klik untuk memperbesar</span></button> : <span>Foto KTP tidak tersedia</span>}
    </div>
    <div className="admin-affiliate-review-info">
      <div className="admin-affiliate-review-title"><div><span className="eyebrow">PENDAFTAR AFFILIATE</span><h2>{affiliate.full_name}</h2></div><span className={`admin-affiliate-status status-${affiliate.status}`}>{affiliate.status === 'pending' ? affiliate.resubmitted_at ? 'Dikirim ulang' : 'Menunggu review' : affiliate.status === 'active' ? 'Disetujui' : affiliate.status === 'rejected' ? 'Ditolak' : affiliate.status}</span></div>
      <dl><div><dt>NIK</dt><dd>{affiliate.nik || '-'}</dd></div><div><dt>Email</dt><dd>{affiliate.email}</dd></div><div><dt>WhatsApp</dt><dd>{affiliate.phone}</dd></div><div><dt>Email terverifikasi</dt><dd>{affiliate.email_verified_at ? dateFormat.format(new Date(affiliate.email_verified_at)) : 'Belum'}</dd></div><div><dt>Daftar</dt><dd>{affiliate.created_at ? dateFormat.format(new Date(affiliate.created_at)) : '-'}</dd></div>{affiliate.resubmitted_at && <div><dt>Dikirim ulang</dt><dd>{dateFormat.format(new Date(affiliate.resubmitted_at))}</dd></div>}</dl>
      <p className="admin-affiliate-match-note"><b>Wajib diperiksa:</b> nama lengkap, NIK, dan identitas pada foto KTP harus sama.</p>
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
    <section className="admin-affiliate-filters" aria-label="Filter pendaftaran affiliate">
      <label className="admin-affiliate-search"><span>Cari pendaftar</span><input type="search" value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Nama, NIK, email, atau nomor HP"/></label>
      <AdminFilterDropdown label="Status" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={[{ value: 'pending_verified', label: 'Antrean terverifikasi', description: 'Email sudah terverifikasi' }, { value: 'pending_unverified', label: 'Menunggu verifikasi', description: 'Email belum diverifikasi' }, { value: 'active', label: 'Disetujui' }, { value: 'rejected', label: 'Ditolak' }, { value: 'all', label: 'Semua status' }]}/>
      <AdminFilterDropdown label="Jenis tanggal" value={filters.dateType} onChange={(value) => setFilters((current) => ({ ...current, dateType: value, dateFrom: value === 'none' ? '' : current.dateFrom, dateTo: value === 'none' ? '' : current.dateTo }))} options={[{ value: 'none', label: 'Tanpa filter tanggal' }, { value: 'registered', label: 'Tanggal daftar', description: 'Waktu pendaftaran dibuat' }, { value: 'verified', label: 'Tanggal verifikasi email', description: 'Waktu email dikonfirmasi' }]}/>
      <label><span>Dari tanggal</span><input type="date" disabled={filters.dateType === 'none'} value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}/></label>
      <label><span>Sampai tanggal</span><input type="date" disabled={filters.dateType === 'none'} value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}/></label>
      <div className="admin-affiliate-filter-footer"><span>{filteredAffiliates.length} dari {affiliates.length} pendaftaran ditampilkan</span><button type="button" onClick={resetFilters}>Reset filter</button></div>
    </section>
    <section className="admin-affiliate-review-list"><div className="admin-section-heading"><div><span className="eyebrow">VERIFIKASI IDENTITAS</span><h2>Data pendaftaran</h2></div><button className="button button-secondary" type="button" onClick={onReload}>Muat ulang</button></div>{pageItems.length ? pageItems.map(card) : <div className="admin-affiliate-review-state">Tidak ada pendaftaran yang cocok dengan filter.</div>}{filteredAffiliates.length > 0 && <div className="admin-affiliate-pagination"><span>Menampilkan {(page - 1) * 10 + 1}–{Math.min(page * 10, filteredAffiliates.length)} dari {filteredAffiliates.length} data</span><nav aria-label="Halaman pendaftaran affiliate"><button type="button" className="direction" aria-label="Halaman sebelumnya" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>‹</button>{paginationItems.map((item) => typeof item === 'number' ? <button type="button" className={item === page ? 'is-active' : ''} aria-current={item === page ? 'page' : undefined} key={item} onClick={() => setPage(item)}>{item}</button> : <span className="ellipsis" aria-hidden="true" key={item}>…</span>)}<button type="button" className="direction" aria-label="Halaman berikutnya" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>›</button></nav></div>}</section>
    {preview && <div className="admin-ktp-lightbox" role="dialog" aria-modal="true" aria-label={`Foto KTP ${preview.name}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}><div><header><span>Foto KTP · {preview.name}</span><button type="button" onClick={() => setPreview(null)} aria-label="Tutup foto KTP">×</button></header><img src={preview.src} alt={`KTP ${preview.name}`}/></div></div>}
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
  const [activePanel, setActivePanel] = useState('');
  const [activeView, setActiveView] = useState('report');
  const [mobileTabOpen, setMobileTabOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [reportCarrier, setReportCarrier] = useState('all');
  const [editorQuery, setEditorQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [affiliateReviews, setAffiliateReviews] = useState({ data: null, loading: false, error: '' });
  const [affiliateReviewWorking, setAffiliateReviewWorking] = useState('');
  const [proUpgrades, setProUpgrades] = useState({ data: null, loading: false, error: '' });
  const [proUpgradeWorking, setProUpgradeWorking] = useState('');
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
    if (['affiliates', 'affiliate-data'].includes(activeView) && !affiliateReviews.data && !affiliateReviews.loading) loadAffiliateReviews();
  }, [activeView]);

  useEffect(() => {
    if (activeView === 'pro-upgrades' && !proUpgrades.data && !proUpgrades.loading) loadProUpgrades();
  }, [activeView]);

  useEffect(() => {
    const closeNotifications = (event) => {
      if (!event.target.closest('.admin-notification-wrap')) setShowNotifications(false);
    };
    document.addEventListener('click', closeNotifications);
    return () => document.removeEventListener('click', closeNotifications);
  }, []);

  if (loading) return <AdminTemplate><Loading showLabel /></AdminTemplate>;
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
      await loadProUpgrades();
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
      await loadProUpgrades();
    } catch (failure) {
      window.showToast?.(failure.message, 'error');
    } finally {
      setProUpgradeWorking('');
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
  const sidebarNavigation = <nav className="admin-sidebar-nav" aria-label="Menu admin" onClick={() => { setShowNotifications(false); setMobileTabOpen(false); document.body.classList.remove('fee-mobile-menu-open'); }}><button className={activeView === 'report' ? 'is-active' : ''} type="button" onClick={() => setActiveView('report')}>Laporan</button><button className={activeView === 'fee' ? 'is-active' : ''} type="button" onClick={() => setActiveView('fee')}>Kelola fee</button><button className={activeView === 'fee-report' ? 'is-active' : ''} type="button" onClick={() => setActiveView('fee-report')}>Laporan fee</button><button className={activeView === 'setting' ? 'is-active' : ''} type="button" onClick={() => setActiveView('setting')}>Kelola template</button><button className={activeView === 'editor' ? 'is-active' : ''} type="button" onClick={() => setActiveView('editor')}>Editor customer</button><button className={activeView === 'affiliate-data' ? 'is-active' : ''} type="button" onClick={() => setActiveView('affiliate-data')}>Data affiliate</button><button className={`admin-nav-pro ${activeView === 'pro-upgrades' ? 'is-active' : ''}`.trim()} type="button" onClick={() => setActiveView('pro-upgrades')}>Upgrade Pro</button><button className={`admin-nav-review ${activeView === 'affiliates' ? 'is-active' : ''}`.trim()} type="button" onClick={() => setActiveView('affiliates')}>Review affiliate</button><button className="admin-sidebar-logout" type="button" onClick={logout}>Keluar</button></nav>;
  const mobileStandaloneMenu = <div className="admin-heading-actions admin-standalone-menu"><button className={`admin-mobile-tab-toggle ${mobileTabOpen ? 'is-open' : ''}`} type="button" aria-label={mobileTabOpen ? 'Tutup menu admin' : 'Buka menu admin'} aria-expanded={mobileTabOpen} onClick={() => setMobileTabOpen((open) => !open)}><span /><span /><span /></button><div className={`admin-view-tabs ${mobileTabOpen ? 'is-open' : ''}`} aria-hidden="true" /></div>;

  if (activeView === 'fee') {
    return <AdminTemplate sidebar={sidebarNavigation}>
      <section className="admin-shell admin-view-fee">
        <div className="admin-heading"><div><span className="eyebrow">Pusat penjualan · selamat bekerja</span><h1>Kelola fee pembawa</h1><p>Fokus input dan edit fee pembawa tanpa menampilkan filter tanggal di bagian bawah.</p></div>{mobileStandaloneMenu}</div>
        <ReferralManagementPanel orders={periodOrders} working={working} onSave={saveReferral} />
      </section>
    </AdminTemplate>;
  }

  if (activeView === 'fee-report') {
    return <AdminTemplate sidebar={sidebarNavigation}>
      <section className="admin-shell admin-view-fee-report">
        <div className="admin-heading"><div><span className="eyebrow">Pusat penjualan · selamat bekerja</span><h1>Laporan fee pembawa</h1><p>Rekap fee berdasarkan data yang sudah disimpan di order untuk keperluan cetak dan laporan.</p></div>{mobileStandaloneMenu}</div>
        <section className="admin-report-panel admin-print-sheet"><div className="admin-panel-heading"><div><span className="eyebrow">Laporan fee</span><h2>Rekap nama pembawa</h2></div><div className="report-actions"><select value={reportCarrier} onChange={(event) => setReportCarrier(event.target.value)}><option value="all">Semua nama pembawa</option>{referralSummary.map((referral) => <option value={referral.name} key={referral.name}>{referral.name}</option>)}</select><button className="editor-access-button print-button" type="button" onClick={printCarrierReport}>Cetak / PDF</button></div></div><div className="admin-fee-report-filter"><label className="admin-date"><span>Dari tanggal</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label className="admin-date"><span>Sampai tanggal</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label></div><div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(240px, 0.8fr)', gap: '1rem', alignItems: 'start' }}><div><div className="report-summary"><div><small>Periode</small><strong>{startDate || 'Awal'} - {endDate || 'Sekarang'}</strong></div><div><small>Order</small><strong>{reportOrders.length}</strong></div><div><small>Total fee</small><strong>{money(reportPayout)}</strong></div></div><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Nama pembawa</th><th>Order</th><th>Customer</th><th>Status</th><th>Fee</th></tr></thead><tbody>{reportOrders.length ? reportOrders.map((order) => <tr key={`report-${order.id || order.order_code}`}><td>{order.referral_name || 'Tanpa nama pembawa'}</td><td>{order.order_code}</td><td>{order.customer_name}</td><td>{statusLabel(order.payment_status)}</td><td>{money(order.referral_amount)}</td></tr>) : <tr><td colSpan="5" className="admin-empty">Belum ada order pada periode ini.</td></tr>}</tbody></table></div></div><aside style={{ display: 'grid', gap: '0.75rem' }}><div className="admin-panel-heading"><div><span className="eyebrow">Semua nama pembawa</span><h2>Daftar fee</h2></div></div><div className="referral-list">{referralSummary.length ? referralSummary.map((referral) => <div className="referral-row" key={referral.name}><div><strong>{referral.name}</strong><small>{referral.orders} order</small></div><b>{money(referral.payout)}</b></div>) : <div className="admin-empty">Belum ada nama pembawa.</div>}</div></aside></div></section>
      </section>
    </AdminTemplate>;
  }

  if (activeView === 'affiliates') {
    return <AdminTemplate sidebar={sidebarNavigation}>
      <section className="admin-shell admin-view-affiliates">
        <div className="admin-heading"><div><span className="eyebrow">KEAMANAN PARTNER</span><h1>Review affiliate</h1><p>Periksa kesesuaian nama lengkap, NIK, dan foto KTP sebelum akun diaktifkan.</p></div>{mobileStandaloneMenu}</div>
        <AffiliateReviewPanel data={affiliateReviews.data} loading={affiliateReviews.loading} error={affiliateReviews.error} working={affiliateReviewWorking} onReload={loadAffiliateReviews} onReview={reviewAffiliate} onResendCorrection={resendAffiliateCorrection}/>
      </section>
    </AdminTemplate>;
  }

  if (activeView === 'affiliate-data') {
    return <AdminTemplate sidebar={sidebarNavigation}>
      <section className="admin-shell admin-view-affiliate-data">
        <div className="admin-heading"><div><span className="eyebrow">MANAJEMEN PARTNER</span><h1>Data affiliate</h1><p>Kelola data dan akses akun affiliate yang sudah disetujui.</p></div>{mobileStandaloneMenu}</div>
        <AffiliateDataPanel data={affiliateReviews.data} loading={affiliateReviews.loading} error={affiliateReviews.error} working={affiliateReviewWorking} onReload={loadAffiliateReviews} onStatus={updateAffiliateStatus} onSave={saveAffiliateData}/>
      </section>
    </AdminTemplate>;
  }

  if (activeView === 'pro-upgrades') {
    return <AdminTemplate sidebar={sidebarNavigation}>
      <section className="admin-shell admin-view-pro-upgrades">
        <div className="admin-heading"><div><span className="eyebrow">AKSES PENARIKAN</span><h1>Upgrade Affiliate Pro</h1><p>Review bukti media sosial dan pantau upgrade berbayar affiliate.</p></div>{mobileStandaloneMenu}</div>
        <ProUpgradeReviewPanel data={proUpgrades.data} loading={proUpgrades.loading} error={proUpgrades.error} working={proUpgradeWorking} onReload={loadProUpgrades} onReview={reviewProUpgrade} onAddPlatform={addProPlatform} onTogglePlatform={toggleProPlatform}/>
      </section>
    </AdminTemplate>;
  }

  return <AdminTemplate sidebar={sidebarNavigation}>
    <section className={`admin-shell admin-view-${activeView}`}>
      {activeView === 'fee' && <ReferralManagementPanel orders={periodOrders} working={working} onSave={saveReferral} />}
      <div className="admin-heading"><div><span className="eyebrow">Pusat penjualan · selamat bekerja</span><h1>{activeView === 'report' ? 'Dashboard laporan' : activeView === 'fee' ? 'Kelola fee pembawa' : activeView === 'fee-report' ? 'Laporan fee pembawa' : activeView === 'setting' ? 'Kelola katalog template' : 'Editor customer'}</h1><p>{activeView === 'report' ? 'Angka rapi, order terpantau, kepala lebih tenang.' : activeView === 'fee' ? 'Kelola fee pembawa dan pastikan data fee tersimpan dengan benar.' : activeView === 'fee-report' ? 'Laporan fee berdasarkan data yang sudah disimpan di order.' : activeView === 'setting' ? 'Atur sampul, nama, deskripsi, kategori, dan harga template.' : 'Buka dan ubah isi undangan customer yang sudah lunas.'}</p></div><div className="admin-heading-actions"><button className={`admin-mobile-tab-toggle ${mobileTabOpen ? 'is-open' : ''}`} type="button" aria-label="Buka menu tab admin" onClick={() => setMobileTabOpen((open) => !open)}><span /><span /><span /></button><div className={`admin-view-tabs ${mobileTabOpen ? 'is-open' : ''}`}><button className={activeView === 'report' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('report'); setMobileTabOpen(false); }}>Laporan</button><button className={activeView === 'fee' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('fee'); setMobileTabOpen(false); }}>Kelola fee</button><button className={activeView === 'fee-report' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('fee-report'); setMobileTabOpen(false); }}>Laporan fee</button><button className={activeView === 'setting' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('setting'); setMobileTabOpen(false); }}>Kelola template</button><button className={activeView === 'editor' ? 'is-active' : ''} type="button" onClick={() => { setActiveView('editor'); setMobileTabOpen(false); }}>Editor customer</button></div><div className="admin-notification-wrap"><button className={`admin-notification-button ${showNotifications ? 'is-open' : ''}`} type="button" onClick={() => setShowNotifications(!showNotifications)} aria-label="Riwayat order" title="Riwayat order">🔔{summary.total_pending > 0 && <b>{summary.total_pending}</b>}</button>{showNotifications && <div className="admin-notification-menu"><strong>Riwayat order terbaru</strong>{latestOrders.length ? <div className="notification-history">{latestOrders.map((order) => <button type="button" key={order.id || order.order_code} onClick={() => { setActivePanel(order.payment_status === 'pending' ? 'pending' : 'orders'); setShowNotifications(false); }}><span><b>{order.customer_name}</b><small>{order.order_code} · {order.created_at ? dateFormat.format(new Date(order.created_at)) : '-'}</small></span><em className={`admin-pill ${order.payment_status}`}>{statusLabel(order.payment_status)}</em></button>)}</div> : <small>Belum ada riwayat order.</small>}{summary.total_pending > 0 && <button className="notification-pending-link" type="button" onClick={() => { setActivePanel('pending'); setShowNotifications(false); }}>Buka semua pembayaran pending</button>}</div>}</div><button className="button button-secondary" type="button" onClick={reload}>Muat ulang</button><button className="button button-secondary" type="button" onClick={logout}>Keluar</button></div></div>
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
        <div className="admin-panel-heading"><div><span className="eyebrow">Tampilan homepage</span><h2>Visual utama beranda</h2></div><span className="admin-panel-note">Perubahan akan langsung dipakai di website utama</span></div>
        <HomepageHeroEditor homepage={data.homepage} onReload={reload} />
        <div className="admin-panel-heading admin-catalog-heading"><div><span className="eyebrow">Katalog template</span><h2>Sampul dan informasi produk</h2></div><span className="admin-panel-note">Perubahan digunakan di website utama dan etalase affiliate</span></div>
        <div className="admin-template-pricing-grid">{templateCatalog.map((template) => <TemplateCatalogEditor key={template.code} template={template} priceDrafts={priceDrafts} setPriceDrafts={setPriceDrafts} working={working} onSavePrice={savePackagePrice} onReload={reload} />)}</div>
      </section>

      {activeView === 'fee-report' && <section className="admin-report-panel admin-print-sheet"><div className="admin-panel-heading"><div><span className="eyebrow">Laporan fee</span><h2>Rekap nama pembawa</h2></div><div className="report-actions"><select value={reportCarrier} onChange={(event) => setReportCarrier(event.target.value)}><option value="all">Semua nama pembawa</option>{referralSummary.map((referral) => <option value={referral.name} key={referral.name}>{referral.name}</option>)}</select><button className="editor-access-button print-button" type="button" onClick={printCarrierReport}>Cetak / PDF</button></div></div><div className="admin-fee-report-filter"><label className="admin-date"><span>Dari tanggal</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label className="admin-date"><span>Sampai tanggal</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label></div><div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(240px, 0.8fr)', gap: '1rem', alignItems: 'start' }}><div><div className="report-summary"><div><small>Periode</small><strong>{startDate || 'Awal'} - {endDate || 'Sekarang'}</strong></div><div><small>Order</small><strong>{reportOrders.length}</strong></div><div><small>Total fee</small><strong>{money(reportPayout)}</strong></div></div><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Nama pembawa</th><th>Order</th><th>Customer</th><th>Status</th><th>Fee</th></tr></thead><tbody>{reportOrders.length ? reportOrders.map((order) => <tr key={`report-${order.id || order.order_code}`}><td>{order.referral_name || 'Tanpa nama pembawa'}</td><td>{order.order_code}</td><td>{order.customer_name}</td><td>{statusLabel(order.payment_status)}</td><td>{money(order.referral_amount)}</td></tr>) : <tr><td colSpan="5" className="admin-empty">Belum ada order pada periode ini.</td></tr>}</tbody></table></div></div><aside style={{ display: 'grid', gap: '0.75rem' }}><div className="admin-panel-heading"><div><span className="eyebrow">Semua nama pembawa</span><h2>Daftar fee</h2></div></div><div className="referral-list">{referralSummary.length ? referralSummary.map((referral) => <div className="referral-row" key={referral.name}><div><strong>{referral.name}</strong><small>{referral.orders} order</small></div><b>{money(referral.payout)}</b></div>) : <div className="admin-empty">Belum ada nama pembawa.</div>}</div></aside></div></section>}

      <section className="admin-editor-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Akses customer</span><h2>Panel editor</h2></div><span className="admin-panel-note">Khusus order lunas</span></div><label className="editor-search"><span>Cari customer atau order</span><input value={editorQuery} onChange={(event) => setEditorQuery(event.target.value)} placeholder="Nama, email, kode order, template..." /></label><div className="admin-editor-grid">{editorOrders.slice(0, 8).map((order) => <div className="admin-editor-card" key={order.id || order.order_code}><div><strong>{order.customer_name}</strong><small>{order.order_code} · {order.template_name || order.template_code}</small></div><a className="editor-access-button" href={order.editor_url} target="_blank" rel="noreferrer">Buka editor</a></div>)}</div>{!editorOrders.length && <div className="admin-empty">Tidak ada editor yang cocok dengan pencarian.</div>}</section>

      {detail && <section className="admin-detail-panel"><div className="admin-section-heading"><div><span className="eyebrow">Detail pilihan · {detail.items.length} data</span><h2>{detail.title}</h2></div><button className="admin-close" type="button" onClick={() => setActivePanel('')}>Tutup</button></div><div className="admin-detail-list">{detail.items.length ? detail.items.map((order) => <div className="admin-detail-row" key={order.id || order.order_code}><div><strong>{order.order_code}</strong><small>{order.customer_name} · {order.customer_email}</small></div><span className={`admin-pill ${order.payment_status}`}>{statusLabel(order.payment_status)}</span><b>{order.payment_status === 'paid' ? money(order.payment_amount || order.package_price) : 'Belum lunas'}</b>{order.payment_status === 'pending' && whatsappUrl(order) && <a className="whatsapp-action" href={whatsappUrl(order)} target="_blank" rel="noreferrer">Follow-up WA</a>}</div>) : <div className="admin-empty">Tidak ada data untuk bagian ini.</div>}</div></section>}

      <div className="admin-section-heading"><div><span className="eyebrow">Operasional</span><h2>Order masuk</h2></div><span className="admin-count">{filteredOrders.length} order tersedia</span></div>
      <div className="admin-toolbar"><label className="admin-search"><span>Cari order atau nama pembawa</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kode, nama, email, nama pembawa..." /></label><label className="admin-date"><span>Dari tanggal</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label className="admin-date"><span>Sampai tanggal</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label><label className="admin-filter"><span>Filter</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Semua status</option><option value="paid">Sudah lunas</option><option value="pending">Menunggu pembayaran</option><option value="website">Website nonaktif</option></select></label><button className="admin-reset" type="button" onClick={() => { setStartDate(''); setEndDate(''); setFilter('all'); setQuery(''); }}>Reset</button></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Pemesan</th><th>Produk</th><th>Pembayaran</th><th>Website</th><th>Dibawa oleh</th><th>Dibuat</th></tr></thead><tbody>{filteredOrders.length ? filteredOrders.map((order) => <tr key={order.id || order.order_code}><td><strong>{order.order_code}</strong><small>{orderStatusLabel(order.status)}</small></td><td><strong>{order.customer_name}</strong><small>{order.customer_email}</small></td><td><strong>{order.template_name || order.template_code || '-'}</strong><small>{order.package_name || order.package_code || '-'} · {money(order.package_price)}</small></td><td><span className={`admin-pill ${order.payment_status}`}>{statusLabel(order.payment_status)}</span><small>{order.payment_status === 'paid' ? money(order.payment_amount || order.package_price) : 'Belum ada pemasukan'}</small>{order.payment_status === 'pending' && whatsappUrl(order) && <a className="whatsapp-action" href={whatsappUrl(order)} target="_blank" rel="noreferrer">Follow-up WA</a>}</td><td><div className="website-cell"><span className={`admin-pill ${order.website_active === false ? 'inactive' : 'active'}`}>{order.website_active === false ? 'Nonaktif' : 'Aktif'}</span>{order.active_until && <small className={order.website_active === false ? 'expiry-ended' : ''}>{order.website_active === false ? 'Berakhir ' : 'Aktif sampai '}{dateFormat.format(new Date(order.active_until))}</small>}{order.website_url && order.website_active !== false && <a href={order.website_url} target="_blank" rel="noreferrer">Lihat web</a>}</div></td><td><ReferralEditor order={order} working={working === `referral:${order.order_code}`} onSave={saveReferral} /></td><td><small>{order.created_at ? dateFormat.format(new Date(order.created_at)) : '-'}</small></td></tr>) : <tr><td colSpan="7" className="admin-empty">Belum ada order yang cocok dengan filter ini.</td></tr>}</tbody></table></div>
    </section>
  </AdminTemplate>;
}

