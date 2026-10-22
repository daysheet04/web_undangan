import React, { useEffect, useMemo, useState } from 'react';
import { get, del } from '../lib/api.js';

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

function feedbackPaginationItems(page, pageCount) {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, index) => index + 1);
  if (page <= 3) return [1, 2, 3, 4, 'end-gap', pageCount];
  if (page >= pageCount - 2) return [1, 'start-gap', pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  return [1, 'start-gap', page - 1, page, page + 1, 'end-gap', pageCount];
}

export default function FeedbackManagementPanel({ refreshSignal }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const pageSize = 10;

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await get('/api/admin/feedbacks');
      setFeedbacks(res?.feedbacks || []);
    } catch (err) {
      window.showToast?.(err.message || 'Gagal memuat feedback.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, [refreshSignal]);

  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus kritik & saran dari "${item.name}"?`)) return;
    setWorking(true);
    try {
      await del(`/api/admin/feedbacks/${item.id}`);
      setFeedbacks((prev) => prev.filter((f) => f.id !== item.id));
      if (detail?.id === item.id) setDetail(null);
      window.showToast?.('Feedback berhasil dihapus.');
    } catch (err) {
      window.showToast?.(err.message || 'Gagal menghapus feedback.', 'error');
    } finally {
      setWorking(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      window.showToast?.('Teks saran berhasil disalin ke clipboard.');
    } catch {
      window.prompt('Salin teks saran:', text);
    }
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return feedbacks.filter((item) => {
      const dateStr = item.created_at ? item.created_at.slice(0, 10) : '';
      const dateMatch = (!startDate || dateStr >= startDate) && (!endDate || dateStr <= endDate);
      const textMatch = !needle ||
        String(item.name || '').toLowerCase().includes(needle) ||
        String(item.message || '').toLowerCase().includes(needle);
      return dateMatch && textMatch;
    });
  }, [feedbacks, query, startDate, endDate]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginationItems = feedbackPaginationItems(currentPage, pageCount);

  useEffect(() => setPage(1), [query, startDate, endDate]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const resetFilters = () => {
    setQuery('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Stats
  const totalCount = feedbacks.length;
  const thisMonthCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return feedbacks.filter((f) => {
      if (!f.created_at) return false;
      const d = new Date(f.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [feedbacks]);

  return (
    <>
      <div className="admin-feedback-stats">
        <div className="admin-feedback-stat-card">
          <span>Total Masukan</span>
          <strong>{totalCount}</strong>
          <small>Seluruh saran &amp; kritik masuk</small>
        </div>
        <div className="admin-feedback-stat-card">
          <span>Bulan Ini</span>
          <strong>{thisMonthCount}</strong>
          <small>Masukan periode bulan berjalan</small>
        </div>
        <div className="admin-feedback-stat-card">
          <span>Sesuai Filter</span>
          <strong>{filtered.length}</strong>
          <small>Dari pencarian &amp; filter tanggal</small>
        </div>
      </div>

      <div className="admin-section-heading">
        <div>
          <span className="eyebrow">ARSIP MASUKAN KLIEN</span>
          <h2>Daftar kritik &amp; saran</h2>
        </div>
        <div className="admin-heading-actions">
          <button className="button button-secondary" type="button" onClick={loadFeedbacks} disabled={loading}>
            {loading ? 'Memuat...' : 'Muat ulang'}
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <label className="admin-search">
          <span>Cari nama atau isi saran</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari berdasarkan nama atau kata kunci saran..."
          />
        </label>
        <label className="admin-date">
          <span>Dari tanggal</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className="admin-date">
          <span>Sampai tanggal</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <button className="admin-reset" type="button" onClick={resetFilters}>
          Reset filter
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table admin-feedback-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Pengirim</th>
              <th>Kritik &amp; Saran</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="admin-empty">Memuat data kritik &amp; saran...</td>
              </tr>
            ) : pageItems.length ? (
              pageItems.map((item, index) => {
                const rowNumber = (currentPage - 1) * pageSize + index + 1;
                const isLong = item.message && item.message.length > 95;
                const previewText = isLong ? `${item.message.slice(0, 95)}...` : item.message;
                const initial = (item.name || 'A').charAt(0).toUpperCase();

                return (
                  <tr key={item.id}>
                    <td><strong>{rowNumber}</strong></td>
                    <td>
                      <small>
                        {item.created_at ? dateFormat.format(new Date(item.created_at)) : '-'}
                      </small>
                    </td>
                    <td>
                      <div className="admin-feedback-sender">
                        <span className="admin-feedback-avatar" aria-hidden="true">{initial}</span>
                        <div className="admin-feedback-sender-info">
                          <strong>{item.name}</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-feedback-message-preview">
                        <span>{previewText}</span>
                        {isLong && (
                          <button
                            type="button"
                            className="admin-feedback-read-more"
                            onClick={() => setDetail(item)}
                          >
                            Baca selengkapnya
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="admin-feedback-actions">
                        <button
                          type="button"
                          className="admin-feedback-btn-view"
                          onClick={() => setDetail(item)}
                          title="Lihat detail lengkap"
                        >
                          Detail
                        </button>
                        <button
                          type="button"
                          className="admin-feedback-btn-del"
                          onClick={() => handleDelete(item)}
                          disabled={working}
                          title="Hapus saran ini"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="admin-empty">
                  {feedbacks.length === 0
                    ? 'Belum ada kritik atau saran yang masuk dari klien.'
                    : 'Tidak ada masukan yang cocok dengan kata kunci atau filter tanggal ini.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="admin-affiliate-pagination">
          <span>
            Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} dari {filtered.length} data
          </span>
          <nav aria-label="Halaman feedback saran">
            <button
              type="button"
              className="direction"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              aria-label="Halaman sebelumnya"
            >
              ‹
            </button>
            {paginationItems.map((item) =>
              typeof item === 'number' ? (
                <button
                  type="button"
                  className={item === currentPage ? 'is-active' : ''}
                  aria-current={item === currentPage ? 'page' : undefined}
                  key={item}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              ) : (
                <span className="ellipsis" key={item}>…</span>
              )
            )}
            <button
              type="button"
              className="direction"
              disabled={currentPage === pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              aria-label="Halaman berikutnya"
            >
              ›
            </button>
          </nav>
        </div>
      )}

      {detail && (
        <div
          className="admin-feedback-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-detail-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetail(null);
          }}
        >
          <div className="admin-feedback-modal-card">
            <header className="admin-feedback-modal-header">
              <div>
                <span className="eyebrow">DETAIL MASUKAN KLIEN</span>
                <h2 id="feedback-detail-title">Kritik &amp; Saran</h2>
              </div>
              <button
                type="button"
                className="admin-feedback-modal-close"
                onClick={() => setDetail(null)}
                aria-label="Tutup modal"
              >
                ×
              </button>
            </header>

            <div className="admin-feedback-modal-body">
              <dl>
                <div>
                  <dt>Nama Pengirim</dt>
                  <dd>{detail.name}</dd>
                </div>
                <div>
                  <dt>Waktu Masuk</dt>
                  <dd>
                    {detail.created_at ? dateFormat.format(new Date(detail.created_at)) : '-'}
                  </dd>
                </div>
              </dl>

              <div className="admin-feedback-bubble">
                <label>Isi Kritik / Saran</label>
                <p>{detail.message}</p>
              </div>
            </div>

            <footer className="admin-feedback-modal-footer">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => copyToClipboard(detail.message)}
              >
                Salin Teks
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setDetail(null)}
              >
                Tutup
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
