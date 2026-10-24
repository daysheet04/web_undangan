import React, { useMemo, useState } from 'react';
import { money } from '../lib/api.js';

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

export function DashboardPagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalItems <= pageSize) return null;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="subtable-pagination">
      <span className="pagination-info">Menampilkan {startItem}–{endItem} dari {totalItems} data</span>
      <div className="pagination-controls">
        <button
          type="button"
          className="pag-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Halaman sebelumnya"
        >
          ‹ Sebelumnya
        </button>
        {pages.map((p, idx) => p === '...' ? (
          <span key={`el-${idx}`} className="pag-ellipsis">…</span>
        ) : (
          <button
            key={p}
            type="button"
            className={`pag-btn ${p === currentPage ? 'is-active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="pag-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Halaman selanjutnya"
        >
          Selanjutnya ›
        </button>
      </div>
    </div>
  );
}

export function CardDetailModal({
  modal,
  query,
  onQueryChange,
  page,
  onPageChange,
  onClose,
  onView,
  onEdit,
  isAffiliateOrder,
  statusLabel,
  whatsappUrl,
}) {
  if (!modal) return null;

  const pageSize = 8;
  const items = Array.isArray(modal.items) ? modal.items : [];
  const q = String(query || '').toLowerCase().trim();

  const filteredItems = useMemo(() => {
    if (!q) return items;
    return items.filter((item) => {
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
        item.payout_method,
        item.account_name,
        item.account_number,
        item.status,
        item.payment_status,
        item.admin_note,
        item.complimentary_note,
      ].filter(Boolean).map(String);
      return texts.some((t) => t.toLowerCase().includes(q));
    });
  }, [items, q]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div
      className="admin-card-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={modal.title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-card-modal-card">
        <div className="modal-card-topbar">
          <div className="modal-card-title-wrap">
            <div className="modal-card-icon-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="modal-card-title-text">
              <h3>{modal.title}</h3>
              <p>{modal.subtitle}</p>
            </div>
          </div>
          <div className="modal-card-actions">
            <span className="modal-count-pill">{filteredItems.length} dari {items.length} Data</span>
            <button className="modal-close-btn" type="button" onClick={onClose} aria-label="Tutup popup">
              ✕
            </button>
          </div>
        </div>

        <div className="modal-filter-bar">
          <div className="modal-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="#647b70" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                onQueryChange(e.target.value);
                onPageChange(1);
              }}
              placeholder="Cari kode, nama pemesan, email, HP, rekening..."
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  onQueryChange('');
                  onPageChange(1);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '13px' }}
              >
                ✕
              </button>
            )}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#647b70', fontWeight: '500' }}>
            Halaman {currentPage} dari {totalPages}
          </span>
        </div>

        <div className="modal-body-scroller">
          {modal.type === 'orders' && (
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer / Pemesan</th>
                  <th>Template &amp; Paket</th>
                  <th>Nominal</th>
                  <th>Status Bayar</th>
                  <th>Website</th>
                  <th>Jalur</th>
                  <th>Dibuat</th>
                  <th style={{ textAlign: 'center' }}>Aksi Data</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.length ? pagedItems.map((order) => (
                  <tr key={order.id || order.order_code}>
                    <td>
                      <span className="detail-code-badge">{order.order_code}</span>
                    </td>
                    <td>
                      <strong>{order.customer_name}</strong>
                      <small style={{ display: 'block', color: '#657e72', fontSize: '0.7rem' }}>{order.customer_email || '-'}</small>
                    </td>
                    <td>
                      <strong>{order.template_name || order.template_code || '-'}</strong>
                      <small style={{ display: 'block', color: '#657e72', fontSize: '0.7rem' }}>{order.package_name || order.package_code || '-'}</small>
                    </td>
                    <td>
                      <b>{money(order.payment_amount ?? order.package_price ?? 0)}</b>
                    </td>
                    <td>
                      <span className={`admin-pill ${order.payment_status}`}>{statusLabel(order.payment_status)}</span>
                    </td>
                    <td>
                      <span className={`admin-pill ${order.website_active ? 'active' : 'inactive'}`}>
                        {order.website_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      {isAffiliateOrder?.(order) ? (
                        <div>
                          <span className="admin-stat-card-badge badge-blue">Affiliate</span>
                          <small style={{ display: 'block', color: '#165643', fontWeight: '700' }}>
                            {order.affiliate_name || order.referral_name}
                          </small>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#647b70', fontWeight: '600' }}>Direct DayMoment</span>
                      )}
                    </td>
                    <td>
                      <small style={{ color: '#657e72', fontSize: '0.7rem' }}>
                        {order.created_at ? dateFormat.format(new Date(order.created_at)) : '-'}
                      </small>
                    </td>
                    <td>
                      <div className="detail-actions-cluster" style={{ justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="detail-action-link view-btn"
                          onClick={() => onView('order', order)}
                          title="Lihat detail lengkap pesanan"
                        >
                          👁 Lihat
                        </button>
                        <button
                          type="button"
                          className="detail-action-link edit-btn"
                          onClick={() => onEdit('order', order)}
                          title="Edit status pembayaran, nominal, atau website"
                        >
                          ✏ Edit
                        </button>
                        {order.payment_status === 'pending' && whatsappUrl?.(order) && (
                          <a className="detail-action-link whatsapp" href={whatsappUrl(order)} target="_blank" rel="noreferrer">
                            WA
                          </a>
                        )}
                        {order.editor_url && (
                          <a className="detail-action-link outline" href={order.editor_url} target="_blank" rel="noreferrer">
                            Editor
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#647b70' }}>
                      Tidak ada data pesanan yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {modal.type === 'free_orders' && (
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Kode Order</th>
                  <th>Penerima Akses</th>
                  <th>Template &amp; Paket</th>
                  <th>Catatan Gratis</th>
                  <th>Website</th>
                  <th>Dibuat</th>
                  <th style={{ textAlign: 'center' }}>Aksi Data</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.length ? pagedItems.map((order) => (
                  <tr key={order.id || order.order_code}>
                    <td>
                      <span className="detail-code-badge">{order.order_code}</span>
                    </td>
                    <td>
                      <strong>{order.customer_name}</strong>
                      <small style={{ display: 'block', color: '#657e72', fontSize: '0.7rem' }}>
                        {order.customer_email} · {order.customer_phone || '-'}
                      </small>
                    </td>
                    <td>
                      <strong>{order.template_name || order.template_code || '-'}</strong>
                      <small style={{ display: 'block', color: '#657e72', fontSize: '0.7rem' }}>{order.package_name || order.package_code || '-'}</small>
                    </td>
                    <td>
                      <em style={{ color: '#4b6357', fontSize: '0.72rem' }}>{order.complimentary_note || 'Tidak ada catatan'}</em>
                    </td>
                    <td>
                      <span className={`admin-pill ${order.website_active ? 'active' : 'inactive'}`}>
                        {order.website_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <small style={{ color: '#657e72', fontSize: '0.7rem' }}>
                        {order.created_at ? dateFormat.format(new Date(order.created_at)) : '-'}
                      </small>
                    </td>
                    <td>
                      <div className="detail-actions-cluster" style={{ justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="detail-action-link view-btn"
                          onClick={() => onView('free_order', order)}
                        >
                          👁 Lihat
                        </button>
                        <button
                          type="button"
                          className="detail-action-link edit-btn"
                          onClick={() => onEdit('free_order', order)}
                        >
                          ✏ Edit
                        </button>
                        {order.editor_url && (
                          <a className="detail-action-link primary" href={order.editor_url} target="_blank" rel="noreferrer">
                            Editor
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#647b70' }}>
                      Belum ada data order gratis yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {modal.type === 'affiliate_sales' && (
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Mitra Affiliate</th>
                  <th>Template Terjual</th>
                  <th>Harga Jual (Omset)</th>
                  <th>Komisi Affiliate</th>
                  <th>Keuntungan Bersih</th>
                  <th>Status Bayar</th>
                  <th style={{ textAlign: 'center' }}>Aksi Data</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.length ? pagedItems.map((order) => {
                  const price = Number(order.payment_amount ?? order.package_price ?? 0);
                  const comm = Number(order.affiliate_commission_amount || order.referral_amount || 0);
                  const profit = Math.max(0, price - comm);
                  return (
                    <tr key={order.id || order.order_code}>
                      <td>
                        <span className="detail-code-badge">{order.order_code}</span>
                      </td>
                      <td>
                        <strong>{order.affiliate_name || order.referral_name || 'Mitra'}</strong>
                        <small style={{ display: 'block', color: '#657e72', fontSize: '0.7rem' }}>
                          Kode: {order.affiliate_referral_code || '-'}
                        </small>
                      </td>
                      <td>
                        <strong>{order.template_name || order.template_code || '-'}</strong>
                        <small style={{ display: 'block', color: '#657e72', fontSize: '0.7rem' }}>{order.package_name || order.package_code || '-'}</small>
                      </td>
                      <td>
                        <strong style={{ color: '#102e26' }}>{money(price)}</strong>
                      </td>
                      <td>
                        <span style={{ color: '#0369a1', fontWeight: '700' }}>{money(comm)}</span>
                        {order.affiliate_commission_percent > 0 && (
                          <small style={{ display: 'block', color: '#657e72', fontSize: '0.68rem' }}>({order.affiliate_commission_percent}%)</small>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: '#059669', fontSize: '0.86rem' }}>+{money(profit)}</strong>
                      </td>
                      <td>
                        <span className={`admin-pill ${order.payment_status}`}>{statusLabel(order.payment_status)}</span>
                      </td>
                      <td>
                        <div className="detail-actions-cluster" style={{ justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="detail-action-link view-btn"
                            onClick={() => onView('order', order)}
                          >
                            👁 Lihat
                          </button>
                          <button
                            type="button"
                            className="detail-action-link edit-btn"
                            onClick={() => onEdit('order', order)}
                          >
                            ✏ Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#647b70' }}>
                      Belum ada data transaksi affiliate yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {modal.type === 'withdrawals' && (
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Tgl Pengajuan</th>
                  <th>Mitra Affiliate</th>
                  <th>Metode &amp; Rekening</th>
                  <th>Diajukan</th>
                  <th>Fee</th>
                  <th>Nominal Bersih (Net)</th>
                  <th>Status Payout</th>
                  <th>Catatan Admin</th>
                  <th style={{ textAlign: 'center' }}>Aksi Data</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.length ? pagedItems.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <small style={{ color: '#657e72', fontSize: '0.72rem', fontWeight: '600' }}>
                        {w.requested_at ? dateFormat.format(new Date(w.requested_at)) : '-'}
                      </small>
                    </td>
                    <td>
                      <strong>{w.affiliate?.full_name || w.account_name || 'Mitra'}</strong>
                      <small style={{ display: 'block', color: '#657e72', fontSize: '0.7rem' }}>
                        {w.affiliate?.email || '-'}
                      </small>
                    </td>
                    <td>
                      <strong style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>{w.provider || w.payout_method || 'Bank'}</strong>
                      <small style={{ display: 'block', color: '#44584e', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {w.account_number} (a.n {w.account_name})
                      </small>
                    </td>
                    <td>
                      <strong>{money(w.amount)}</strong>
                    </td>
                    <td>
                      <small style={{ color: '#657e72' }}>{money(w.fee_amount || 0)}</small>
                    </td>
                    <td>
                      <strong style={{ color: '#165643', fontSize: '0.86rem' }}>{money(w.net_amount || w.amount)}</strong>
                    </td>
                    <td>
                      <span className={`admin-pill ${w.status === 'paid' ? 'paid' : w.status === 'pending' || w.status === 'processing' ? 'pending' : 'rejected'}`}>
                        {w.status === 'paid' ? 'Selesai' : w.status === 'processing' ? 'Diproses' : w.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                      </span>
                    </td>
                    <td>
                      <small style={{ color: '#647b70' }}>{w.admin_note || '-'}</small>
                    </td>
                    <td>
                      <div className="detail-actions-cluster" style={{ justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="detail-action-link view-btn"
                          onClick={() => onView('withdrawal', w)}
                        >
                          👁 Lihat
                        </button>
                        <button
                          type="button"
                          className="detail-action-link edit-btn"
                          onClick={() => onEdit('withdrawal', w)}
                        >
                          ✏ Edit &amp; Proses
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#647b70' }}>
                      Tidak ada riwayat penarikan pada filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {modal.type === 'affiliates' && (
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Nama Mitra</th>
                  <th>Kontak</th>
                  <th>NIK KTP</th>
                  <th>Tier</th>
                  <th>Status Akun</th>
                  <th>Tgl Bergabung</th>
                  <th style={{ textAlign: 'center' }}>Aksi Data</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.length ? pagedItems.map((aff) => (
                  <tr key={aff.id}>
                    <td>
                      <strong>{aff.full_name}</strong>
                      <small style={{ display: 'block', color: '#165643', fontWeight: '700', fontSize: '0.7rem' }}>
                        Ref: {aff.referral_code}
                      </small>
                    </td>
                    <td>
                      <span>{aff.email}</span>
                      <small style={{ display: 'block', color: '#657e72', fontSize: '0.7rem' }}>{aff.phone || '-'}</small>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#44584e' }}>{aff.nik || '-'}</span>
                    </td>
                    <td>
                      <span className="admin-stat-card-badge badge-blue" style={{ textTransform: 'uppercase' }}>
                        {aff.account_tier || 'regular'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-pill ${aff.status === 'active' ? 'paid' : aff.status === 'pending' ? 'pending' : 'rejected'}`}>
                        {aff.status === 'active' ? 'Aktif' : aff.status === 'pending' ? 'Perlu Review' : aff.status === 'suspended' ? 'Nonaktif' : aff.status === 'rejected' ? 'Ditolak' : aff.status}
                      </span>
                    </td>
                    <td>
                      <small style={{ color: '#657e72', fontSize: '0.7rem' }}>
                        {aff.created_at ? dateFormat.format(new Date(aff.created_at)) : '-'}
                      </small>
                    </td>
                    <td>
                      <div className="detail-actions-cluster" style={{ justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="detail-action-link view-btn"
                          onClick={() => onView('affiliate', aff)}
                        >
                          👁 Lihat
                        </button>
                        <button
                          type="button"
                          className="detail-action-link edit-btn"
                          onClick={() => onEdit('affiliate', aff)}
                        >
                          ✏ Edit Akun
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#647b70' }}>
                      Tidak ada data mitra affiliate yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {modal.type === 'websites' && (
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Website Undangan</th>
                  <th>Sumber Order</th>
                  <th>Pemesan</th>
                  <th>Template</th>
                  <th>Masa Aktif Sampai</th>
                  <th>Status Akses</th>
                  <th style={{ textAlign: 'center' }}>Aksi Data</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.length ? pagedItems.map((order) => {
                  const isAff = isAffiliateOrder?.(order);
                  const isFree = order.order_source === 'admin_free';
                  return (
                    <tr key={order.id || order.order_code}>
                      <td>
                        {order.slug ? (
                          <strong style={{ color: '#165643', fontFamily: 'monospace' }}>/{order.slug}</strong>
                        ) : (
                          <span style={{ color: '#999' }}>Belum diset slug</span>
                        )}
                        <small style={{ display: 'block', color: '#657e72', fontSize: '0.68rem' }}>Order: {order.order_code}</small>
                      </td>
                      <td>
                        {isFree ? (
                          <span className="admin-stat-card-badge badge-purple">Order Gratis</span>
                        ) : isAff ? (
                          <div>
                            <span className="admin-stat-card-badge badge-blue">Affiliate</span>
                            <small style={{ display: 'block', color: '#165643', fontWeight: '700', fontSize: '0.68rem' }}>
                              {order.affiliate_name || order.referral_name}
                            </small>
                          </div>
                        ) : (
                          <span className="admin-stat-card-badge badge-green">Direct DayMoment</span>
                        )}
                      </td>
                      <td>
                        <strong>{order.customer_name}</strong>
                        <small style={{ display: 'block', color: '#657e72', fontSize: '0.7rem' }}>{order.customer_email}</small>
                      </td>
                      <td>
                        <span>{order.template_name || order.template_code || '-'}</span>
                      </td>
                      <td>
                        <small style={{ color: '#102e26', fontWeight: '700' }}>
                          {order.active_until ? dateFormat.format(new Date(order.active_until)) : 'Tidak terbatas'}
                        </small>
                      </td>
                      <td>
                        <span className={`admin-pill ${order.website_active ? 'active' : 'inactive'}`}>
                          {order.website_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div className="detail-actions-cluster" style={{ justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="detail-action-link view-btn"
                            onClick={() => onView('website', order)}
                          >
                            👁 Lihat
                          </button>
                          <button
                            type="button"
                            className="detail-action-link edit-btn"
                            onClick={() => onEdit('website', order)}
                          >
                            ✏ Edit Akses
                          </button>
                          {order.website_url && order.website_active && (
                            <a className="detail-action-link primary" href={order.website_url} target="_blank" rel="noreferrer">
                              Kunjungi
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#647b70' }}>
                      Tidak ada website yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-card-footer">
          <DashboardPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredItems.length}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
          <button
            type="button"
            className="filter-preset-btn"
            onClick={onClose}
            style={{ marginLeft: 'auto' }}
          >
            Tutup Jendela
          </button>
        </div>
      </div>
    </div>
  );
}

export function ViewItemDetailModal({ viewModal, onClose, onEdit, statusLabel, orderStatusLabel, whatsappUrl }) {
  if (!viewModal || !viewModal.data) return null;
  const { type, data } = viewModal;

  return (
    <div
      className="admin-card-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Detail Data"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-view-modal-card">
        <div className="modal-card-topbar">
          <div className="modal-card-title-wrap">
            <div className="modal-card-icon-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div className="modal-card-title-text">
              <h3>
                {type === 'order' ? `Detail Pesanan: ${data.order_code}` :
                 type === 'free_order' ? `Detail Order Gratis: ${data.order_code}` :
                 type === 'withdrawal' ? `Detail Penarikan: Rp ${(Number(data.amount || 0)).toLocaleString('id-ID')}` :
                 type === 'affiliate' ? `Detail Mitra: ${data.full_name}` :
                 `Detail Website: /${data.slug || data.order_code}`}
              </h3>
              <p>Rincian lengkap data tersimpan pada database DayMoment</p>
            </div>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>

        <div className="view-modal-body">
          {(type === 'order' || type === 'free_order') && (
            <>
              <div className="view-modal-section">
                <span className="view-modal-section-title">Informasi Pemesan &amp; Kontak</span>
                <div className="view-modal-grid">
                  <div className="view-info-item">
                    <span className="view-info-label">Nama Pemesan</span>
                    <span className="view-info-val">{data.customer_name || '-'}</span>
                  </div>
                  <div className="view-info-item">
                    <span className="view-info-label">Email Pemesan</span>
                    <span className="view-info-val">{data.customer_email || '-'}</span>
                  </div>
                  <div className="view-info-item">
                    <span className="view-info-label">Nomor WhatsApp</span>
                    <span className="view-info-val">{data.customer_phone || '-'}</span>
                  </div>
                  <div className="view-info-item">
                    <span className="view-info-label">Tanggal Order</span>
                    <span className="view-info-val">{data.created_at ? dateFormat.format(new Date(data.created_at)) : '-'}</span>
                  </div>
                </div>
              </div>

              <div className="view-modal-section">
                <span className="view-modal-section-title">Produk &amp; Pembayaran</span>
                <div className="view-modal-grid">
                  <div className="view-info-item">
                    <span className="view-info-label">Template</span>
                    <span className="view-info-val">{data.template_name || data.template_code || '-'}</span>
                  </div>
                  <div className="view-info-item">
                    <span className="view-info-label">Paket</span>
                    <span className="view-info-val">{data.package_name || data.package_code || '-'}</span>
                  </div>
                  <div className="view-info-item">
                    <span className="view-info-label">Nominal Bayar</span>
                    <span className="view-info-val">{type === 'free_order' ? 'Gratis (Complimentary)' : money(data.payment_amount ?? data.package_price ?? 0)}</span>
                  </div>
                  <div className="view-info-item">
                    <span className="view-info-label">Status Bayar</span>
                    <span className="view-info-val">
                      <span className={`admin-pill ${data.payment_status}`}>{statusLabel?.(data.payment_status) || data.payment_status}</span>
                    </span>
                  </div>
                  {data.referral_name && (
                    <div className="view-info-item">
                      <span className="view-info-label">Mitra Referral / Pembawa</span>
                      <span className="view-info-val">{data.referral_name} ({money(data.referral_amount || 0)})</span>
                    </div>
                  )}
                  {data.affiliate_name && (
                    <div className="view-info-item">
                      <span className="view-info-label">Affiliate Terkait</span>
                      <span className="view-info-val">{data.affiliate_name} ({data.affiliate_referral_code || '-'})</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="view-modal-section">
                <span className="view-modal-section-title">Status Website &amp; Akses</span>
                <div className="view-modal-grid">
                  <div className="view-info-item">
                    <span className="view-info-label">Status Website</span>
                    <span className="view-info-val">
                      <span className={`admin-pill ${data.website_active ? 'active' : 'inactive'}`}>
                        {data.website_active ? 'Website Aktif' : 'Website Nonaktif'}
                      </span>
                    </span>
                  </div>
                  <div className="view-info-item">
                    <span className="view-info-label">Slug Undangan</span>
                    <span className="view-info-val">{data.slug ? `/${data.slug}` : 'Belum ditentukan'}</span>
                  </div>
                  <div className="view-info-item">
                    <span className="view-info-label">Masa Aktif Sampai</span>
                    <span className="view-info-val">{data.active_until ? dateFormat.format(new Date(data.active_until)) : 'Tidak terbatas'}</span>
                  </div>
                  <div className="view-info-item">
                    <span className="view-info-label">Status Alur Order</span>
                    <span className="view-info-val">{orderStatusLabel?.(data.status) || data.status}</span>
                  </div>
                </div>
              </div>

              {data.complimentary_note && (
                <div className="view-modal-section">
                  <span className="view-modal-section-title">Catatan Order Gratis</span>
                  <div className="view-note-box">{data.complimentary_note}</div>
                </div>
              )}
            </>
          )}

          {type === 'withdrawal' && (
            <>
              <div className="view-modal-section">
                <span className="view-modal-section-title">Data Pengajuan Penarikan</span>
                <div className="view-modal-grid">
                  <div className="view-info-item">
                    <span className="view-info-label">Mitra Affiliate</span>
                    <span className="view-info-val">{data.affiliate?.full_name || data.account_name}</span>
                  </div>
                  <div className="view-info-item">
                    <span className="view-info-label">Email Mitra</span>
                    <span className="view-info-val">{data.affiliate?.email || '-'}</span>
                  </div>
                  <div className="view-info-item">
                    <span className="view-info-label">Nominal Diajukan</span>
                    <span className="view-info-val">{money(data.amount)}</span>
                  </div>
                  <div className="view-info-item">
                    <span className="view-info-label">Biaya / Fee Admin</span>
                    <span className="view-info-val">{money(data.fee_amount || 0)}</span>
                  </div>
                  <div className="view-info-item">
                    <span className="view-info-label">Nominal Ditransfer (Net)</span>
                    <span className="view-info-val" style={{ color: '#165643', fontSize: '1rem' }}>
                      {money(data.net_amount || data.amount)}
                    </span>
                  </div>
                  <div className="view-info-item">
                    <span className="view-info-label">Status Payout</span>
                    <span className="view-info-val">
                      <span className={`admin-pill ${data.status === 'paid' ? 'paid' : data.status === 'pending' || data.status === 'processing' ? 'pending' : 'rejected'}`}>
                        {data.status === 'paid' ? 'Selesai' : data.status === 'processing' ? 'Diproses' : data.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                      </span>
                    </span>
                  </div>
                  <div className="view-info-item">
                    <span className="view-info-label">Metode / Bank</span>
                    <span className="view-info-val" style={{ textTransform: 'uppercase' }}>{data.provider || data.payout_method || 'Bank'}</span>
                  </div>
                  <div className="view-info-item">
                    <span className="view-info-label">Nomor Rekening &amp; Atas Nama</span>
                    <span className="view-info-val">{data.account_number} (a.n {data.account_name})</span>
                  </div>
                </div>
              </div>

              {data.admin_note && (
                <div className="view-modal-section">
                  <span className="view-modal-section-title">Catatan Admin</span>
                  <div className="view-note-box">{data.admin_note}</div>
                </div>
              )}
            </>
          )}

          {type === 'affiliate' && (
            <div className="view-modal-section">
              <span className="view-modal-section-title">Data Akun Mitra Affiliate</span>
              <div className="view-modal-grid">
                <div className="view-info-item">
                  <span className="view-info-label">Nama Lengkap</span>
                  <span className="view-info-val">{data.full_name}</span>
                </div>
                <div className="view-info-item">
                  <span className="view-info-label">Email Akun</span>
                  <span className="view-info-val">{data.email}</span>
                </div>
                <div className="view-info-item">
                  <span className="view-info-label">Nomor WhatsApp</span>
                  <span className="view-info-val">{data.phone || '-'}</span>
                </div>
                <div className="view-info-item">
                  <span className="view-info-label">NIK KTP</span>
                  <span className="view-info-val" style={{ fontFamily: 'monospace' }}>{data.nik || '-'}</span>
                </div>
                <div className="view-info-item">
                  <span className="view-info-label">Kode Referral</span>
                  <span className="view-info-val" style={{ color: '#165643', fontWeight: 800 }}>{data.referral_code}</span>
                </div>
                <div className="view-info-item">
                  <span className="view-info-label">Tier Akun</span>
                  <span className="view-info-val" style={{ textTransform: 'uppercase' }}>{data.account_tier || 'regular'}</span>
                </div>
                <div className="view-info-item">
                  <span className="view-info-label">Status Akun</span>
                  <span className="view-info-val">
                    <span className={`admin-pill ${data.status === 'active' ? 'paid' : data.status === 'pending' ? 'pending' : 'rejected'}`}>
                      {data.status === 'active' ? 'Aktif' : data.status === 'pending' ? 'Perlu Review' : data.status === 'suspended' ? 'Nonaktif' : data.status === 'rejected' ? 'Ditolak' : data.status}
                    </span>
                  </span>
                </div>
                <div className="view-info-item">
                  <span className="view-info-label">Rekening Payout</span>
                  <span className="view-info-val">{data.bank_name ? `${data.bank_name} - ${data.bank_account_number} (a.n ${data.bank_account_holder})` : 'Belum diisi'}</span>
                </div>
              </div>
            </div>
          )}

          {type === 'website' && (
            <div className="view-modal-section">
              <span className="view-modal-section-title">Detail Undangan &amp; Akses Publik</span>
              <div className="view-modal-grid">
                <div className="view-info-item">
                  <span className="view-info-label">Alamat Slug</span>
                  <span className="view-info-val" style={{ color: '#165643', fontFamily: 'monospace' }}>/{data.slug || '-'}</span>
                </div>
                <div className="view-info-item">
                  <span className="view-info-label">Status Akses</span>
                  <span className="view-info-val">
                    <span className={`admin-pill ${data.website_active ? 'active' : 'inactive'}`}>
                      {data.website_active ? 'Website Aktif' : 'Website Nonaktif'}
                    </span>
                  </span>
                </div>
                <div className="view-info-item">
                  <span className="view-info-label">Nama Pemesan</span>
                  <span className="view-info-val">{data.customer_name}</span>
                </div>
                <div className="view-info-item">
                  <span className="view-info-label">Email Pemesan</span>
                  <span className="view-info-val">{data.customer_email}</span>
                </div>
                <div className="view-info-item">
                  <span className="view-info-label">Template Digunakan</span>
                  <span className="view-info-val">{data.template_name || data.template_code}</span>
                </div>
                <div className="view-info-item">
                  <span className="view-info-label">Masa Aktif Sampai</span>
                  <span className="view-info-val">{data.active_until ? dateFormat.format(new Date(data.active_until)) : 'Tidak terbatas'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-card-footer">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="detail-action-link edit-btn"
              onClick={() => {
                onClose();
                onEdit(type, data);
              }}
            >
              ✏ Edit Data Ini
            </button>
            {data.website_url && data.website_active && (
              <a className="detail-action-link primary" href={data.website_url} target="_blank" rel="noreferrer">
                Kunjungi Web
              </a>
            )}
            {data.editor_url && (
              <a className="detail-action-link outline" href={data.editor_url} target="_blank" rel="noreferrer">
                Buka Editor
              </a>
            )}
            {data.payment_status === 'pending' && whatsappUrl?.(data) && (
              <a className="detail-action-link whatsapp" href={whatsappUrl(data)} target="_blank" rel="noreferrer">
                Follow-up WhatsApp
              </a>
            )}
          </div>
          <button type="button" className="filter-preset-btn" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditItemModal({ editModal, working, onClose, onSave }) {
  if (!editModal || !editModal.data) return null;
  const { type, data, draft: initialDraft } = editModal;
  const [draft, setDraft] = useState(() => ({ ...initialDraft }));

  const handleChange = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(type, data, draft);
  };

  const isSaving = Boolean(working);

  return (
    <div
      className="admin-card-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Edit Data"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div className="admin-edit-modal-card">
        <form onSubmit={handleSubmit}>
          <div className="modal-card-topbar">
            <div className="modal-card-title-wrap">
              <div className="modal-card-icon-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <div className="modal-card-title-text">
                <h3>
                  {type === 'order' ? `Edit Pesanan: ${data.order_code}` :
                   type === 'free_order' ? `Edit Order Gratis: ${data.order_code}` :
                   type === 'withdrawal' ? `Proses Penarikan: ${data.affiliate?.full_name || data.account_name}` :
                   type === 'affiliate' ? `Edit Mitra: ${data.full_name}` :
                   `Edit Akses Website: /${data.slug || data.order_code}`}
                </h3>
                <p>Ubah status dan informasi langsung pada sistem</p>
              </div>
            </div>
            <button className="modal-close-btn" type="button" onClick={onClose} disabled={isSaving} aria-label="Tutup">
              ✕
            </button>
          </div>

          <div className="edit-modal-body">
            {type === 'order' && (
              <>
                <div className="edit-form-field">
                  <label>Status Pembayaran</label>
                  <select
                    value={draft.payment_status}
                    onChange={(e) => handleChange('payment_status', e.target.value)}
                  >
                    <option value="pending">Menunggu Pembayaran (pending)</option>
                    <option value="paid">Sudah Lunas (paid)</option>
                    <option value="cancelled">Dibatalkan (cancelled)</option>
                    <option value="refunded">Dikembalikan (refunded)</option>
                  </select>
                </div>

                <div className="edit-form-field">
                  <label>Nominal Pembayaran (Rp)</label>
                  <input
                    type="number"
                    value={draft.payment_amount}
                    onChange={(e) => handleChange('payment_amount', e.target.value)}
                    min="0"
                  />
                </div>

                <div className="edit-form-field">
                  <label>Status Alur Pesanan</label>
                  <select
                    value={draft.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <option value="waiting_payment">Belum bayar (waiting_payment)</option>
                    <option value="editing">Customer mengedit (editing)</option>
                    <option value="published">Website terbit (published)</option>
                    <option value="cancelled">Dibatalkan (cancelled)</option>
                  </select>
                </div>

                <div className="edit-toggle-row">
                  <span>Akses Website Aktif</span>
                  <input
                    type="checkbox"
                    checked={draft.website_active}
                    onChange={(e) => handleChange('website_active', e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>

                <div className="edit-form-field">
                  <label>Slug Undangan</label>
                  <input
                    type="text"
                    value={draft.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="nama-mempelai"
                  />
                </div>

                <div className="edit-form-field">
                  <label>Masa Aktif Website Sampai</label>
                  <input
                    type="date"
                    value={draft.active_until}
                    onChange={(e) => handleChange('active_until', e.target.value)}
                  />
                </div>

                <div className="edit-form-field">
                  <label>Nama Pembawa / Referral</label>
                  <input
                    type="text"
                    value={draft.referral_name}
                    onChange={(e) => handleChange('referral_name', e.target.value)}
                    placeholder="Nama orang yang mereferensikan"
                  />
                </div>

                <div className="edit-form-field">
                  <label>Fee Pembawa (Rp)</label>
                  <input
                    type="number"
                    value={draft.referral_amount}
                    onChange={(e) => handleChange('referral_amount', e.target.value)}
                    min="0"
                  />
                </div>
              </>
            )}

            {type === 'free_order' && (
              <>
                <div className="edit-toggle-row">
                  <span>Akses Website Aktif</span>
                  <input
                    type="checkbox"
                    checked={draft.website_active}
                    onChange={(e) => handleChange('website_active', e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>

                <div className="edit-form-field">
                  <label>Slug Undangan</label>
                  <input
                    type="text"
                    value={draft.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="nama-mempelai"
                  />
                </div>

                <div className="edit-form-field">
                  <label>Masa Aktif Website Sampai</label>
                  <input
                    type="date"
                    value={draft.active_until}
                    onChange={(e) => handleChange('active_until', e.target.value)}
                  />
                </div>

                <div className="edit-form-field">
                  <label>Catatan Order Gratis</label>
                  <textarea
                    value={draft.complimentary_note}
                    onChange={(e) => handleChange('complimentary_note', e.target.value)}
                    placeholder="Misal: Complimentary untuk keluarga besar / relasi kantor"
                  />
                </div>
              </>
            )}

            {type === 'withdrawal' && (
              <>
                <div className="edit-form-field">
                  <label>Status Penarikan (Payout)</label>
                  <select
                    value={draft.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <option value="pending">Menunggu Transfer (pending)</option>
                    <option value="processing">Sedang Diproses (processing)</option>
                    <option value="paid">Ditransfer Selesai (paid)</option>
                    <option value="rejected">Ditolak (rejected)</option>
                    <option value="cancelled">Dibatalkan (cancelled)</option>
                  </select>
                </div>

                <div className="edit-form-field">
                  <label>Catatan Admin / Keterangan Transfer</label>
                  <textarea
                    value={draft.admin_note}
                    onChange={(e) => handleChange('admin_note', e.target.value)}
                    placeholder="Masukkan no referensi transfer, atau alasan jika ditolak..."
                  />
                </div>

                <div className="edit-form-field">
                  <label>Upload Bukti Transfer (Opsional)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleChange('proofFile', e.target.files?.[0] || null)}
                  />
                </div>
              </>
            )}

            {type === 'affiliate' && (
              <>
                <div className="edit-form-field">
                  <label>Status Akun Mitra</label>
                  <select
                    value={draft.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <option value="active">Disetujui &amp; Aktif</option>
                    <option value="suspended">Nonaktif / Ditangguhkan</option>
                    <option value="pending">Perlu Review</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>

                <div className="edit-form-field">
                  <label>Tier Akun</label>
                  <select
                    value={draft.account_tier}
                    onChange={(e) => handleChange('account_tier', e.target.value)}
                  >
                    <option value="regular">Regular</option>
                    <option value="pro">Pro Affiliate</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>

                <div className="edit-form-field">
                  <label>Nama Lengkap</label>
                  <input
                    type="text"
                    value={draft.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    required
                  />
                </div>

                <div className="edit-form-field">
                  <label>Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={draft.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>

                <div className="edit-form-field">
                  <label>NIK KTP</label>
                  <input
                    type="text"
                    value={draft.nik}
                    onChange={(e) => handleChange('nik', e.target.value)}
                    maxLength="16"
                  />
                </div>

                <div className="edit-form-field">
                  <label>Kode Referral</label>
                  <input
                    type="text"
                    value={draft.referral_code}
                    onChange={(e) => handleChange('referral_code', e.target.value)}
                    required
                  />
                </div>

                <div className="edit-form-field">
                  <label>Nama Bank / E-Wallet</label>
                  <input
                    type="text"
                    value={draft.bank_name}
                    onChange={(e) => handleChange('bank_name', e.target.value)}
                    placeholder="BCA / Mandiri / GoPay"
                  />
                </div>

                <div className="edit-form-field">
                  <label>Nomor Rekening</label>
                  <input
                    type="text"
                    value={draft.bank_account_number}
                    onChange={(e) => handleChange('bank_account_number', e.target.value)}
                  />
                </div>

                <div className="edit-form-field">
                  <label>Nama Pemilik Rekening</label>
                  <input
                    type="text"
                    value={draft.bank_account_holder}
                    onChange={(e) => handleChange('bank_account_holder', e.target.value)}
                  />
                </div>

                {draft.status === 'rejected' && (
                  <div className="edit-form-field">
                    <label>Alasan Penolakan Akun</label>
                    <textarea
                      value={draft.review_note}
                      onChange={(e) => handleChange('review_note', e.target.value)}
                      placeholder="Jelaskan alasan penolakan agar mitra dapat memperbaiki berkas..."
                      required
                    />
                  </div>
                )}
              </>
            )}

            {type === 'website' && (
              <>
                <div className="edit-toggle-row">
                  <span>Akses Website Aktif</span>
                  <input
                    type="checkbox"
                    checked={draft.website_active}
                    onChange={(e) => handleChange('website_active', e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>

                <div className="edit-form-field">
                  <label>Slug Undangan</label>
                  <input
                    type="text"
                    value={draft.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="nama-mempelai"
                  />
                </div>

                <div className="edit-form-field">
                  <label>Masa Aktif Website Sampai</label>
                  <input
                    type="date"
                    value={draft.active_until}
                    onChange={(e) => handleChange('active_until', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="modal-card-footer">
            <button
              type="button"
              className="filter-reset-btn"
              onClick={onClose}
              disabled={isSaving}
            >
              Batal
            </button>
            <button
              type="submit"
              className="detail-action-link primary"
              disabled={isSaving}
              style={{ padding: '8px 20px', fontSize: '0.8rem' }}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
