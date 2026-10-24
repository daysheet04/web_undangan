import React, { useMemo, useState } from 'react';
import { money } from '../lib/api.js';
import { DashboardPagination } from './AdminDashboardModals.jsx';
import AdminCustomDropdown from './AdminCustomDropdown.jsx';

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

export default function AdminBottomTables({
  orders,
  freeOrders,
  withdrawals,
  affiliates,
  activeWebsites,
  isAffiliateOrder,
  statusLabel,
  whatsappUrl,
  onView,
  onEdit,
}) {
  // Sub-table 1: Orders
  const [ordersQuery, setOrdersQuery] = useState('');
  const [ordersStatus, setOrdersStatus] = useState('all');
  const [ordersPage, setOrdersPage] = useState(1);
  const ordersPageSize = 10;

  const filteredOrders = useMemo(() => {
    const q = ordersQuery.toLowerCase().trim();
    return (orders || []).filter((order) => {
      const matchStatus = ordersStatus === 'all' || order.payment_status === ordersStatus;
      if (!matchStatus) return false;
      if (!q) return true;
      const haystack = `${order.order_code} ${order.customer_name} ${order.customer_email} ${order.template_name} ${order.package_name} ${order.referral_name} ${order.affiliate_name}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, ordersQuery, ordersStatus]);

  const ordersTotalPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPageSize));
  const pagedOrders = filteredOrders.slice((ordersPage - 1) * ordersPageSize, ordersPage * ordersPageSize);

  // Sub-table 2: Free Orders
  const [freeQuery, setFreeQuery] = useState('');
  const [freePage, setFreePage] = useState(1);
  const freePageSize = 8;

  const filteredFree = useMemo(() => {
    const q = freeQuery.toLowerCase().trim();
    return (freeOrders || []).filter((order) => {
      if (!q) return true;
      const haystack = `${order.order_code} ${order.customer_name} ${order.customer_email} ${order.customer_phone} ${order.template_name} ${order.complimentary_note}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [freeOrders, freeQuery]);

  const freeTotalPages = Math.max(1, Math.ceil(filteredFree.length / freePageSize));
  const pagedFree = filteredFree.slice((freePage - 1) * freePageSize, freePage * freePageSize);

  // Sub-table 3: Withdrawals
  const [withdrawalsQuery, setWithdrawalsQuery] = useState('');
  const [withdrawalsStatus, setWithdrawalsStatus] = useState('all');
  const [withdrawalsPage, setWithdrawalsPage] = useState(1);
  const withdrawalsPageSize = 8;

  const filteredWithdrawals = useMemo(() => {
    const q = withdrawalsQuery.toLowerCase().trim();
    return (withdrawals || []).filter((w) => {
      const matchStatus = withdrawalsStatus === 'all'
        || (withdrawalsStatus === 'pending' && ['pending', 'processing'].includes(w.status))
        || (withdrawalsStatus === 'rejected' && ['rejected', 'cancelled'].includes(w.status))
        || w.status === withdrawalsStatus;
      if (!matchStatus) return false;
      if (!q) return true;
      const haystack = `${w.affiliate?.full_name || ''} ${w.affiliate?.email || ''} ${w.account_name || ''} ${w.account_number || ''} ${w.provider || ''} ${w.admin_note || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [withdrawals, withdrawalsQuery, withdrawalsStatus]);

  const withdrawalsTotalPages = Math.max(1, Math.ceil(filteredWithdrawals.length / withdrawalsPageSize));
  const pagedWithdrawals = filteredWithdrawals.slice((withdrawalsPage - 1) * withdrawalsPageSize, withdrawalsPage * withdrawalsPageSize);

  // Sub-table 4: Affiliates
  const [affiliatesQuery, setAffiliatesQuery] = useState('');
  const [affiliatesStatus, setAffiliatesStatus] = useState('all');
  const [affiliatesPage, setAffiliatesPage] = useState(1);
  const affiliatesPageSize = 8;

  const filteredAffiliates = useMemo(() => {
    const q = affiliatesQuery.toLowerCase().trim();
    return (affiliates || []).filter((a) => {
      const matchStatus = affiliatesStatus === 'all' || a.status === affiliatesStatus;
      if (!matchStatus) return false;
      if (!q) return true;
      const haystack = `${a.full_name || ''} ${a.email || ''} ${a.phone || ''} ${a.nik || ''} ${a.referral_code || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [affiliates, affiliatesQuery, affiliatesStatus]);

  const affiliatesTotalPages = Math.max(1, Math.ceil(filteredAffiliates.length / affiliatesPageSize));
  const pagedAffiliates = filteredAffiliates.slice((affiliatesPage - 1) * affiliatesPageSize, affiliatesPage * affiliatesPageSize);

  // Sub-table 5: Active Websites
  const [websitesQuery, setWebsitesQuery] = useState('');
  const [websitesSource, setWebsitesSource] = useState('all');
  const [websitesPage, setWebsitesPage] = useState(1);
  const websitesPageSize = 8;

  const filteredWebsites = useMemo(() => {
    const q = websitesQuery.toLowerCase().trim();
    return (activeWebsites || []).filter((order) => {
      const isAff = isAffiliateOrder(order);
      const isFree = order.order_source === 'admin_free';
      const matchSource = websitesSource === 'all'
        || (websitesSource === 'direct' && !isAff && !isFree)
        || (websitesSource === 'affiliate' && isAff)
        || (websitesSource === 'free' && isFree);
      if (!matchSource) return false;
      if (!q) return true;
      const haystack = `${order.order_code} ${order.slug || ''} ${order.customer_name} ${order.customer_email} ${order.template_name}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [activeWebsites, websitesQuery, websitesSource, isAffiliateOrder]);

  const websitesTotalPages = Math.max(1, Math.ceil(filteredWebsites.length / websitesPageSize));
  const pagedWebsites = filteredWebsites.slice((websitesPage - 1) * websitesPageSize, websitesPage * websitesPageSize);

  return (
    <div className="admin-bottom-tables-section" id="admin-bottom-hub">
      <div className="admin-bottom-section-head">
        <div>
          <span className="admin-summary-kicker">DATABASE &amp; OPERASIONAL LENGKAP</span>
          <h2>Tabel Data Terintegrasi</h2>
          <p>Seluruh riwayat pesanan, komisi, payout, database mitra, dan monitoring website aktif dapat diakses dan diedit langsung.</p>
        </div>
        <div className="bottom-jump-nav">
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#587164', textTransform: 'uppercase' }}>Lompat:</span>
          <a href="#subtable-orders" className="bottom-jump-btn">🛒 Order Masuk</a>
          <a href="#subtable-free" className="bottom-jump-btn">🎁 Order Gratis</a>
          <a href="#subtable-withdrawals" className="bottom-jump-btn">💸 Penarikan Saldo</a>
          <a href="#subtable-affiliates" className="bottom-jump-btn">👥 Mitra Affiliate</a>
          <a href="#subtable-websites" className="bottom-jump-btn">🌐 Website Aktif</a>
        </div>
      </div>

      {/* Sub-Table 1: Order Masuk */}
      <section className="admin-subtable-card" id="subtable-orders">
        <div className="admin-subtable-head">
          <div className="subtable-head-left">
            <h3>Riwayat Order Masuk &amp; Penjualan</h3>
            <p>Daftar transaksi pesanan customer reguler dari alur pemesanan DayMoment</p>
          </div>
          <span className="admin-stat-card-badge badge-blue">{filteredOrders.length} Pesanan</span>
        </div>

        <div className="admin-subtable-toolbar">
          <div className="subtable-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="#647b70" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={ordersQuery}
              onChange={(e) => {
                setOrdersQuery(e.target.value);
                setOrdersPage(1);
              }}
              placeholder="Cari order, nama pemesan, email, template, affiliate..."
            />
            {ordersQuery && (
              <button
                type="button"
                onClick={() => {
                  setOrdersQuery('');
                  setOrdersPage(1);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '13px' }}
              >
                ✕
              </button>
            )}
          </div>

          <div className="subtable-filter-group">
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4b6357' }}>Filter Status:</label>
            <AdminCustomDropdown
              value={ordersStatus}
              onChange={(val) => {
                setOrdersStatus(val);
                setOrdersPage(1);
              }}
              options={[
                { value: 'all', label: 'Semua Status' },
                { value: 'paid', label: 'Sudah Lunas', dotColor: '#10b981' },
                { value: 'pending', label: 'Menunggu Pembayaran', dotColor: '#f59e0b' },
                { value: 'cancelled', label: 'Dibatalkan', dotColor: '#ef4444' },
              ]}
              minWidth="175px"
            />
          </div>
        </div>

        <div className="detail-table-wrap">
          <table className="detail-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Pemesan</th>
                <th>Template &amp; Paket</th>
                <th>Nominal</th>
                <th>Status Bayar</th>
                <th>Website</th>
                <th>Jalur / Pembawa</th>
                <th>Dibuat</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.length ? pagedOrders.map((order) => (
                <tr key={order.id || order.order_code}>
                  <td>
                    <span className="detail-code-badge">{order.order_code}</span>
                  </td>
                  <td>
                    <strong>{order.customer_name}</strong>
                    <small style={{ display: 'block', color: '#657e72', fontSize: '0.7rem' }}>{order.customer_email}</small>
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
                    {isAffiliateOrder(order) ? (
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
                        title="Lihat detail lengkap"
                      >
                        👁 Lihat
                      </button>
                      <button
                        type="button"
                        className="detail-action-link edit-btn"
                        onClick={() => onEdit('order', order)}
                        title="Edit data & status order"
                      >
                        ✏ Edit
                      </button>
                      {order.payment_status === 'pending' && whatsappUrl(order) && (
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
                    Belum ada order yang cocok dengan filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <DashboardPagination
          currentPage={ordersPage}
          totalPages={ordersTotalPages}
          totalItems={filteredOrders.length}
          pageSize={ordersPageSize}
          onPageChange={setOrdersPage}
        />
      </section>

      {/* Sub-Table 2: Order Gratis */}
      <section className="admin-subtable-card" id="subtable-free">
        <div className="admin-subtable-head">
          <div className="subtable-head-left">
            <h3>Data Order Gratis (Complimentary)</h3>
            <p>Daftar undangan yang dibuat langsung oleh admin secara gratis tanpa pembayaran</p>
          </div>
          <span className="admin-stat-card-badge badge-purple">{filteredFree.length} Order Gratis</span>
        </div>

        <div className="admin-subtable-toolbar">
          <div className="subtable-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="#647b70" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={freeQuery}
              onChange={(e) => {
                setFreeQuery(e.target.value);
                setFreePage(1);
              }}
              placeholder="Cari nama penerima, email, kode order..."
            />
            {freeQuery && (
              <button
                type="button"
                onClick={() => {
                  setFreeQuery('');
                  setFreePage(1);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '13px' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="detail-table-wrap">
          <table className="detail-table">
            <thead>
              <tr>
                <th>Kode Order</th>
                <th>Penerima Akses</th>
                <th>Template &amp; Paket</th>
                <th>Catatan Khusus</th>
                <th>Status Website</th>
                <th>Dibuat</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedFree.length ? pagedFree.map((order) => (
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
                          Buka Editor
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#647b70' }}>
                    Belum ada order gratis pada filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <DashboardPagination
          currentPage={freePage}
          totalPages={freeTotalPages}
          totalItems={filteredFree.length}
          pageSize={freePageSize}
          onPageChange={setFreePage}
        />
      </section>

      {/* Sub-Table 3: Penarikan Saldo Affiliate */}
      <section className="admin-subtable-card" id="subtable-withdrawals">
        <div className="admin-subtable-head">
          <div className="subtable-head-left">
            <h3>Penarikan Saldo Affiliate (Payout)</h3>
            <p>Pengajuan transfer pencairan saldo komisi para affiliate</p>
          </div>
          <span className="admin-stat-card-badge badge-green">{filteredWithdrawals.length} Pengajuan</span>
        </div>

        <div className="admin-subtable-toolbar">
          <div className="subtable-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="#647b70" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={withdrawalsQuery}
              onChange={(e) => {
                setWithdrawalsQuery(e.target.value);
                setWithdrawalsPage(1);
              }}
              placeholder="Cari nama affiliate, bank, rekening, keterangan..."
            />
            {withdrawalsQuery && (
              <button
                type="button"
                onClick={() => {
                  setWithdrawalsQuery('');
                  setWithdrawalsPage(1);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '13px' }}
              >
                ✕
              </button>
            )}
          </div>

          <div className="subtable-filter-group">
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4b6357' }}>Status:</label>
            <AdminCustomDropdown
              value={withdrawalsStatus}
              onChange={(val) => {
                setWithdrawalsStatus(val);
                setWithdrawalsPage(1);
              }}
              options={[
                { value: 'all', label: 'Semua Status' },
                { value: 'paid', label: 'Selesai (Sudah Ditransfer)', dotColor: '#10b981' },
                { value: 'pending', label: 'Menunggu / Diproses', dotColor: '#f59e0b' },
                { value: 'rejected', label: 'Ditolak / Batal', dotColor: '#ef4444' },
              ]}
              minWidth="185px"
            />
          </div>
        </div>

        <div className="detail-table-wrap">
          <table className="detail-table">
            <thead>
              <tr>
                <th>Tgl Pengajuan</th>
                <th>Mitra Affiliate</th>
                <th>Metode &amp; Rekening</th>
                <th>Diajukan</th>
                <th>Fee Admin</th>
                <th>Nominal Bersih (Net)</th>
                <th>Status Payout</th>
                <th>Catatan Admin</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedWithdrawals.length ? pagedWithdrawals.map((w) => (
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
        </div>

        <DashboardPagination
          currentPage={withdrawalsPage}
          totalPages={withdrawalsTotalPages}
          totalItems={filteredWithdrawals.length}
          pageSize={withdrawalsPageSize}
          onPageChange={setWithdrawalsPage}
        />
      </section>

      {/* Sub-Table 4: Mitra Affiliate */}
      <section className="admin-subtable-card" id="subtable-affiliates">
        <div className="admin-subtable-head">
          <div className="subtable-head-left">
            <h3>Database Mitra Affiliate &amp; Review Pendaftaran</h3>
            <p>Manajemen data akun mitra affiliate, status aktif/nonaktif, dan verifikasi berkas KTP</p>
          </div>
          <span className="admin-stat-card-badge badge-blue">{filteredAffiliates.length} Mitra</span>
        </div>

        <div className="admin-subtable-toolbar">
          <div className="subtable-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="#647b70" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={affiliatesQuery}
              onChange={(e) => {
                setAffiliatesQuery(e.target.value);
                setAffiliatesPage(1);
              }}
              placeholder="Cari nama, email, NIK, kode referral..."
            />
            {affiliatesQuery && (
              <button
                type="button"
                onClick={() => {
                  setAffiliatesQuery('');
                  setAffiliatesPage(1);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '13px' }}
              >
                ✕
              </button>
            )}
          </div>

          <div className="subtable-filter-group">
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4b6357' }}>Status Akun:</label>
            <AdminCustomDropdown
              value={affiliatesStatus}
              onChange={(val) => {
                setAffiliatesStatus(val);
                setAffiliatesPage(1);
              }}
              options={[
                { value: 'all', label: 'Semua Status' },
                { value: 'active', label: 'Mitra Aktif', dotColor: '#10b981' },
                { value: 'suspended', label: 'Mitra Nonaktif', dotColor: '#64748b' },
                { value: 'pending', label: 'Perlu Review (Pending)', dotColor: '#f59e0b' },
                { value: 'rejected', label: 'Ditolak', dotColor: '#ef4444' },
              ]}
              minWidth="190px"
            />
          </div>
        </div>

        <div className="detail-table-wrap">
          <table className="detail-table">
            <thead>
              <tr>
                <th>Nama Mitra</th>
                <th>Kontak</th>
                <th>NIK KTP</th>
                <th>Tier</th>
                <th>Status Akun</th>
                <th>Tgl Bergabung</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedAffiliates.length ? pagedAffiliates.map((aff) => (
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
                    Tidak ada data mitra yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <DashboardPagination
          currentPage={affiliatesPage}
          totalPages={affiliatesTotalPages}
          totalItems={filteredAffiliates.length}
          pageSize={affiliatesPageSize}
          onPageChange={setAffiliatesPage}
        />
      </section>

      {/* Sub-Table 5: Website Undangan Aktif */}
      <section className="admin-subtable-card" id="subtable-websites">
        <div className="admin-subtable-head">
          <div className="subtable-head-left">
            <h3>Monitoring Website Undangan Aktif</h3>
            <p>Seluruh website undangan yang saat ini aktif, terbit, dan dapat diakses tamu</p>
          </div>
          <span className="admin-stat-card-badge badge-green">{filteredWebsites.length} Website Aktif</span>
        </div>

        <div className="admin-subtable-toolbar">
          <div className="subtable-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="#647b70" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={websitesQuery}
              onChange={(e) => {
                setWebsitesQuery(e.target.value);
                setWebsitesPage(1);
              }}
              placeholder="Cari slug website, nama pemesan, email..."
            />
            {websitesQuery && (
              <button
                type="button"
                onClick={() => {
                  setWebsitesQuery('');
                  setWebsitesPage(1);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '13px' }}
              >
                ✕
              </button>
            )}
          </div>

          <div className="subtable-filter-group">
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4b6357' }}>Jalur Pemesanan:</label>
            <AdminCustomDropdown
              value={websitesSource}
              onChange={(val) => {
                setWebsitesSource(val);
                setWebsitesPage(1);
              }}
              options={[
                { value: 'all', label: 'Semua Jalur' },
                { value: 'direct', label: 'Direct DayMoment' },
                { value: 'affiliate', label: 'Jalur Mitra Affiliate' },
                { value: 'free', label: 'Order Gratis (Complimentary)' },
              ]}
              minWidth="200px"
            />
          </div>
        </div>

        <div className="detail-table-wrap">
          <table className="detail-table">
            <thead>
              <tr>
                <th>Website Undangan</th>
                <th>Sumber Order</th>
                <th>Pemesan</th>
                <th>Template</th>
                <th>Masa Aktif Sampai</th>
                <th>Status Akses</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedWebsites.length ? pagedWebsites.map((order) => {
                const isAff = isAffiliateOrder(order);
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
                    Tidak ada website aktif pada filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <DashboardPagination
          currentPage={websitesPage}
          totalPages={websitesTotalPages}
          totalItems={filteredWebsites.length}
          pageSize={websitesPageSize}
          onPageChange={setWebsitesPage}
        />
      </section>
    </div>
  );
}
