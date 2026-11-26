import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { get, post } from '../lib/api.js';
import { DashboardPagination } from './DashboardPagination.jsx';

const PUBLIC_PREVIEW_PREFIXES = [
  'invitations/',
  'template-covers/',
  'template-phone-covers/',
  'template-photos/',
  'template-gallery/',
  'template-music/',
  'homepage/hero/',
];

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDateTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isPreviewableMedia(key) {
  const lower = String(key || '').toLowerCase();
  if (!PUBLIC_PREVIEW_PREFIXES.some((prefix) => lower.startsWith(prefix))) return false;
  return /\.(jpg|jpeg|png|webp|gif|mp3|m4a|ogg|wav)$/i.test(lower);
}

export default function AdminStorageAuditPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [audit, setAudit] = useState(null);
  const [statusFilter, setStatusFilter] = useState('orphan'); // 'orphan' | 'active' | 'all'
  const [folderFilter, setFolderFilter] = useState('all');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [deletingKey, setDeletingKey] = useState('');
  const [downloadingZip, setDownloadingZip] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: string }
  const [copiedKey, setCopiedKey] = useState('');

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await get('/api/admin/storage-audit');
      setAudit(res);
      setSelectedKeys(new Set());
    } catch (err) {
      setError(err?.message || 'Gagal memindai bucket R2.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runAudit();
  }, [runAudit]);

  const filteredItems = useMemo(() => {
    const items = audit?.items || [];
    const q = deferredSearch.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (folderFilter !== 'all' && item.folder !== folderFilter) return false;
      if (q) {
        const hay = `${item.key} ${item.folder} ${(item.usages || []).map((u) => u.label).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [audit, statusFilter, folderFilter, deferredSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = useMemo(
    () => filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredItems, currentPage],
  );

  useEffect(() => {
    setPage(1);
  }, [statusFilter, folderFilter, deferredSearch]);

  const filteredOrphans = useMemo(
    () => filteredItems.filter((item) => item.status === 'orphan' && !item.protected),
    [filteredItems],
  );

  const selectedVisibleOrphans = useMemo(
    () => filteredOrphans.filter((item) => selectedKeys.has(item.key)),
    [filteredOrphans, selectedKeys],
  );

  const allVisibleOrphansSelected = filteredOrphans.length > 0 && selectedVisibleOrphans.length === filteredOrphans.length;

  const toggleSelectKey = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAllOrphans = () => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (allVisibleOrphansSelected) {
        filteredOrphans.forEach((item) => next.delete(item.key));
      } else {
        filteredOrphans.forEach((item) => next.add(item.key));
      }
      return next;
    });
  };

  const handleDeleteKeys = async (keys, { allowActive = false, label = '' } = {}) => {
    if (!keys.length) return;
    setDeletingKey(label || keys[0]);
    setFeedback(null);
    try {
      const res = await post('/api/admin/storage-audit/delete', { keys, allow_active: allowActive });
      setFeedback({ type: 'success', text: res.message || `${res.deleted_count || keys.length} file dihapus dari R2.` });
      await runAudit();
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Gagal menghapus file dari R2.' });
    } finally {
      setDeletingKey('');
    }
  };

  const confirmAndDeleteSingle = (item) => {
    if (item.protected) return;
    const isActive = item.status === 'active';
    const msg = isActive
      ? `PERINGATAN: File ini MASIH DIPAKAI (${(item.usages || []).map((u) => u.label).join(', ')}).\n\nYakin tetap hapus permanen dari R2?\n${item.key} (${formatBytes(item.size)})`
      : `Hapus permanen file yatim ini dari bucket R2?\n\n${item.key}\nUkuran: ${formatBytes(item.size)}`;
    if (!window.confirm(msg)) return;
    handleDeleteKeys([item.key], { allowActive: isActive, label: item.key });
  };

  const confirmAndDeleteSelected = () => {
    const keys = [...selectedKeys];
    if (!keys.length) return;
    const totalSize = (audit?.items || [])
      .filter((item) => selectedKeys.has(item.key))
      .reduce((sum, item) => sum + Number(item.size || 0), 0);
    if (!window.confirm(`Hapus permanen ${keys.length} file yatim terpilih (${formatBytes(totalSize)}) dari bucket R2?\n\nFile aktif di database tetap terlindungi dan tidak akan ikut terhapus.`)) {
      return;
    }
    handleDeleteKeys(keys, { allowActive: false, label: 'bulk-selected' });
  };

  const confirmAndDeleteAllFilteredOrphans = () => {
    const keys = filteredOrphans.map((item) => item.key);
    if (!keys.length) return;
    const totalSize = filteredOrphans.reduce((sum, item) => sum + Number(item.size || 0), 0);
    const scopeLabel = folderFilter === 'all' ? 'seluruh folder yang tampil' : `folder ${folderFilter}`;
    if (!window.confirm(`Hapus permanen SEMUA ${keys.length} file yatim (${formatBytes(totalSize)}) pada ${scopeLabel} di bucket R2?\n\nFile aktif (halaman depan, preview template, undangan aktif, affiliate) TIDAK akan terhapus.`)) {
      return;
    }
    handleDeleteKeys(keys, { allowActive: false, label: 'bulk-filtered' });
  };

  const handleDownloadCustomerZip = async (orderCode) => {
    if (!orderCode) return;
    setDownloadingZip(orderCode);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderCode)}/assets.zip`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Gagal membuat arsip ZIP customer.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aset-${orderCode}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setFeedback({ type: 'success', text: `Arsip ZIP aset ${orderCode} berhasil diunduh.` });
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Gagal mengunduh ZIP aset.' });
    } finally {
      setDownloadingZip('');
    }
  };

  const handleCopyOne = async (key) => {
    try {
      await navigator.clipboard.writeText(key);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = key;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((prev) => (prev === key ? '' : prev)), 1800);
  };

  const summary = audit?.summary || {
    total_objects: 0,
    total_bytes: 0,
    active_objects: 0,
    active_bytes: 0,
    orphan_objects: 0,
    orphan_bytes: 0,
  };

  return (
    <div className="r2-audit-wrap">
      <style dangerouslySetInnerHTML={{ __html: `
        .r2-audit-wrap { display: flex; flex-direction: column; gap: 16px; }
        .r2-audit-notice {
          display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
          padding: 13px 16px; border-radius: 14px;
          background: linear-gradient(135deg, #ecfdf5, #f0f9f5);
          border: 1px solid #a7f3d0; color: #065f46;
        }
        .r2-audit-notice strong { display: block; font-size: 0.9rem; margin-bottom: 2px; }
        .r2-audit-notice p { margin: 0; font-size: 0.8rem; color: #047857; line-height: 1.45; }
        .r2-audit-refresh {
          padding: 9px 16px; border-radius: 10px; border: 0;
          background: #124938; color: #fff; font-weight: 700; font-size: 0.82rem; cursor: pointer;
          transition: background 0.16s ease;
        }
        .r2-audit-refresh:hover:not(:disabled) { background: #0d3629; }
        .r2-audit-refresh:disabled { opacity: 0.6; cursor: wait; }
        .r2-feedback {
          padding: 11px 15px; border-radius: 12px; font-size: 0.83rem; font-weight: 700;
        }
        .r2-feedback.is-success { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
        .r2-feedback.is-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
        .r2-audit-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .r2-kpi-card {
          background: #fff; border: 1px solid #dce8e1; border-radius: 14px; padding: 15px 16px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .r2-kpi-card.is-orphan { border-color: #fed7aa; background: #fffbf5; }
        .r2-kpi-card.is-active { border-color: #bbf7d0; background: #f7fdf9; }
        .r2-kpi-card span { font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #5b7267; }
        .r2-kpi-card strong { font-size: 1.35rem; color: #123026; line-height: 1.2; }
        .r2-kpi-card.is-orphan strong { color: #b45309; }
        .r2-kpi-card.is-active strong { color: #15803d; }
        .r2-kpi-card small { font-size: 0.78rem; color: #5b7267; }
        .r2-folder-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .r2-folder-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 7px 12px; border-radius: 999px; border: 1px solid #d4e3db;
          background: #fff; color: #123026; font-size: 0.78rem; font-weight: 600; cursor: pointer;
          transition: all 0.15s ease;
        }
        .r2-folder-pill:hover { border-color: #165643; background: #f4faf7; }
        .r2-folder-pill.is-selected { background: #124938; border-color: #124938; color: #fff; }
        .r2-folder-pill em {
          font-style: normal; font-size: 0.7rem; font-weight: 700; padding: 2px 7px; border-radius: 999px;
          background: #fef3c7; color: #92400e;
        }
        .r2-folder-pill.is-selected em { background: rgba(255,255,255,0.2); color: #fff; }
        .r2-folder-pill em.is-clean { background: #dcfce7; color: #166534; }
        .r2-toolbar {
          display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
          background: #fff; border: 1px solid #dce8e1; border-radius: 14px; padding: 12px 14px;
        }
        .r2-toolbar-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex: 1; min-width: 240px; }
        .r2-toolbar-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .r2-status-tabs { display: inline-flex; background: #eef4f1; padding: 3px; border-radius: 10px; gap: 3px; }
        .r2-status-tabs button {
          border: 0; background: transparent; padding: 6px 11px; border-radius: 8px;
          font-size: 0.78rem; font-weight: 700; color: #476056; cursor: pointer;
        }
        .r2-status-tabs button.is-active { background: #fff; color: #123026; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
        .r2-search-input {
          flex: 1; min-width: 190px; padding: 8px 12px; border: 1px solid #cde0d6; border-radius: 9px;
          font-size: 0.82rem; color: #123026; background: #fcfefd;
        }
        .r2-btn-danger-solid {
          padding: 8px 13px; border-radius: 9px; border: 0;
          background: #dc2626; color: #fff; font-size: 0.78rem; font-weight: 700; cursor: pointer;
        }
        .r2-btn-danger-solid:hover:not(:disabled) { background: #b91c1c; }
        .r2-btn-danger-solid:disabled { opacity: 0.45; cursor: not-allowed; }
        .r2-btn-danger-soft {
          padding: 8px 13px; border-radius: 9px; border: 1px solid #fca5a5;
          background: #fef2f2; color: #b91c1c; font-size: 0.78rem; font-weight: 700; cursor: pointer;
        }
        .r2-btn-danger-soft:hover:not(:disabled) { background: #fee2e2; }
        .r2-btn-danger-soft:disabled { opacity: 0.45; cursor: not-allowed; }
        .r2-table-card {
          background: #fff; border: 1px solid #dce8e1; border-radius: 14px; overflow: hidden;
        }
        .r2-table-scroll { overflow-x: auto; }
        .r2-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .r2-table th {
          text-align: left; padding: 11px 13px; background: #f5f9f7; color: #476056;
          font-size: 0.73rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e1ece6;
        }
        .r2-table td { padding: 10px 13px; border-bottom: 1px solid #edf4f0; vertical-align: top; color: #173329; }
        .r2-key-cell { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.76rem; word-break: break-all; }
        .r2-key-link { color: #0f5132; text-decoration: underline; display: inline-block; margin-top: 3px; font-family: inherit; font-size: 0.74rem; }
        .r2-badge {
          display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 999px;
          font-size: 0.72rem; font-weight: 700; white-space: nowrap;
        }
        .r2-badge.is-orphan { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .r2-badge.is-active { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .r2-usage-list { margin: 5px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 4px; font-size: 0.74rem; color: #4f695e; }
        .r2-usage-item { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .r2-zip-inline {
          padding: 2px 8px; border-radius: 6px; border: 1px solid #a7f3d0;
          background: #ecfdf5; color: #065f46; font-size: 0.7rem; font-weight: 700; cursor: pointer;
        }
        .r2-zip-inline:hover:not(:disabled) { background: #d1fae5; }
        .r2-row-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .r2-copy-btn {
          padding: 5px 9px; border-radius: 7px; border: 1px solid #cfe0d7; background: #fff;
          color: #123026; font-size: 0.74rem; font-weight: 700; cursor: pointer; white-space: nowrap;
        }
        .r2-copy-btn:hover { background: #eff7f3; border-color: #165643; }
        .r2-del-btn {
          padding: 5px 10px; border-radius: 7px; border: 1px solid #fca5a5; background: #fef2f2;
          color: #b91c1c; font-size: 0.74rem; font-weight: 700; cursor: pointer; white-space: nowrap;
        }
        .r2-del-btn:hover:not(:disabled) { background: #dc2626; border-color: #dc2626; color: #fff; }
        .r2-del-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .r2-empty { padding: 34px 18px; text-align: center; color: #587266; font-size: 0.86rem; }
        .r2-error { padding: 14px 16px; border-radius: 12px; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; font-size: 0.84rem; font-weight: 600; }
        @media (max-width: 780px) {
          .r2-audit-kpis { grid-template-columns: 1fr; }
        }
      ` }} />

      <div className="r2-audit-notice">
        <div>
          <strong>Audit &amp; Bersih-Bersih Bucket R2 <code>daymoment-media</code></strong>
          <p>
            Setiap file dicocokkan otomatis dengan database (halaman depan, preview template, undangan customer, affiliate, &amp; pencairan). File <b>Aman Dihapus (Yatim)</b> bisa langsung dihapus dari R2 lewat tombol di bawah — file aktif tetap dilindungi.
          </p>
        </div>
        <button type="button" className="r2-audit-refresh" onClick={runAudit} disabled={loading || Boolean(deletingKey)}>
          {loading ? 'Memindai...' : '↻ Scan Ulang R2'}
        </button>
      </div>

      {feedback && (
        <div className={`r2-feedback ${feedback.type === 'error' ? 'is-error' : 'is-success'}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
          {feedback.text}
        </div>
      )}

      {error && <div className="r2-error" role="alert">{error}</div>}

      {!loading && audit && (
        <>
          <div className="r2-audit-kpis">
            <div className="r2-kpi-card">
              <span>Total Isi Bucket R2</span>
              <strong>{summary.total_objects} file</strong>
              <small>{formatBytes(summary.total_bytes)} · Terakhir scan {formatDateTime(audit.audited_at)}</small>
            </div>
            <div className="r2-kpi-card is-active">
              <span>File Aktif (Jangan Dihapus)</span>
              <strong>{summary.active_objects} file</strong>
              <small>{formatBytes(summary.active_bytes)} · Masih dipakai di website/DB</small>
            </div>
            <div className="r2-kpi-card is-orphan">
              <span>File Yatim (Aman Dihapus)</span>
              <strong>{summary.orphan_objects} file</strong>
              <small>{formatBytes(summary.orphan_bytes)} · Tidak dipakai di tabel mana pun</small>
            </div>
          </div>

          <div className="r2-folder-grid" role="group" aria-label="Filter folder R2">
            <button
              type="button"
              className={`r2-folder-pill${folderFilter === 'all' ? ' is-selected' : ''}`}
              onClick={() => setFolderFilter('all')}
            >
              <span>Semua Folder ({summary.total_objects})</span>
              <em className={summary.orphan_objects === 0 ? 'is-clean' : ''}>
                {summary.orphan_objects} yatim
              </em>
            </button>
            {(audit.folders || []).map((f) => (
              <button
                key={f.folder}
                type="button"
                className={`r2-folder-pill${folderFilter === f.folder ? ' is-selected' : ''}`}
                onClick={() => setFolderFilter(f.folder)}
                title={`Total ${f.total_count} file (${formatBytes(f.total_bytes)}), yatim ${f.orphan_count} file (${formatBytes(f.orphan_bytes)})`}
              >
                <span>{f.folder}</span>
                <em className={f.orphan_count === 0 ? 'is-clean' : ''}>
                  {f.orphan_count > 0 ? `${f.orphan_count} yatim · ${formatBytes(f.orphan_bytes)}` : 'Bersih'}
                </em>
              </button>
            ))}
          </div>

          <div className="r2-toolbar">
            <div className="r2-toolbar-left">
              <div className="r2-status-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === 'orphan'}
                  className={statusFilter === 'orphan' ? 'is-active' : ''}
                  onClick={() => setStatusFilter('orphan')}
                >
                  Aman Dihapus ({summary.orphan_objects})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === 'active'}
                  className={statusFilter === 'active' ? 'is-active' : ''}
                  onClick={() => setStatusFilter('active')}
                >
                  Dipakai ({summary.active_objects})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === 'all'}
                  className={statusFilter === 'all' ? 'is-active' : ''}
                  onClick={() => setStatusFilter('all')}
                >
                  Semua ({summary.total_objects})
                </button>
              </div>
              <input
                type="search"
                className="r2-search-input"
                placeholder="Cari nama file, customer, kode order, atau folder..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="r2-toolbar-actions">
              {selectedKeys.size > 0 && (
                <button
                  type="button"
                  className="r2-btn-danger-solid"
                  disabled={Boolean(deletingKey)}
                  onClick={confirmAndDeleteSelected}
                >
                  {deletingKey === 'bulk-selected' ? 'Menghapus...' : `Hapus ${selectedKeys.size} Terpilih di R2`}
                </button>
              )}
              <button
                type="button"
                className="r2-btn-danger-soft"
                disabled={!filteredOrphans.length || Boolean(deletingKey)}
                onClick={confirmAndDeleteAllFilteredOrphans}
              >
                {deletingKey === 'bulk-filtered'
                  ? 'Menghapus...'
                  : `Hapus Semua Yatim di Filter (${filteredOrphans.length})`}
              </button>
            </div>
          </div>

          <div className="r2-table-card">
            <div className="r2-table-scroll">
              {filteredItems.length ? (
                <table className="r2-table">
                  <thead>
                    <tr>
                      <th style={{ width: '36px' }}>
                        <input
                          type="checkbox"
                          aria-label="Pilih semua file yatim di filter ini"
                          checked={allVisibleOrphansSelected}
                          disabled={!filteredOrphans.length}
                          onChange={toggleSelectAllOrphans}
                        />
                      </th>
                      <th>Key / Nama File R2</th>
                      <th>Ukuran</th>
                      <th>Status &amp; Pemakaian</th>
                      <th>Diunggah</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedItems.map((item) => {
                      const canSelect = item.status === 'orphan' && !item.protected;
                      const isDeletingThis = deletingKey === item.key;
                      return (
                        <tr key={item.key}>
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Pilih ${item.key}`}
                              disabled={!canSelect}
                              checked={selectedKeys.has(item.key)}
                              onChange={() => toggleSelectKey(item.key)}
                            />
                          </td>
                          <td className="r2-key-cell">
                            <div>{item.key}</div>
                            {isPreviewableMedia(item.key) && (
                              <a
                                className="r2-key-link"
                                href={`/media/${item.key}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Lihat / dengar file ↗
                              </a>
                            )}
                          </td>
                          <td style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>{formatBytes(item.size)}</td>
                          <td>
                            {item.status === 'orphan' ? (
                              <>
                                <span className="r2-badge is-orphan">Aman Dihapus (Yatim)</span>
                                <ul className="r2-usage-list">
                                  <li>Tidak direferensikan di tabel database mana pun.</li>
                                </ul>
                              </>
                            ) : (
                              <>
                                <span className="r2-badge is-active">Aktif · Dipakai</span>
                                <ul className="r2-usage-list">
                                  {(item.usages || []).map((u, idx) => (
                                    <li key={`${item.key}-u-${idx}`} className="r2-usage-item">
                                      <span>• {u.label}</span>
                                      {u.order_code && (
                                        <button
                                          type="button"
                                          className="r2-zip-inline"
                                          disabled={downloadingZip === u.order_code}
                                          onClick={() => handleDownloadCustomerZip(u.order_code)}
                                        >
                                          {downloadingZip === u.order_code ? 'Menyiapkan ZIP...' : `⬇ Unduh ZIP ${u.order_code}`}
                                        </button>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(item.uploaded)}</td>
                          <td>
                            <div className="r2-row-actions">
                              <button type="button" className="r2-copy-btn" onClick={() => handleCopyOne(item.key)}>
                                {copiedKey === item.key ? '✓ Tersalin' : 'Salin'}
                              </button>
                              <button
                                type="button"
                                className="r2-del-btn"
                                disabled={item.protected || Boolean(deletingKey)}
                                title={item.protected ? 'Backup JSON template dilindungi' : 'Hapus file ini dari bucket R2'}
                                onClick={() => confirmAndDeleteSingle(item)}
                              >
                                {item.protected ? 'Dilindungi' : isDeletingThis ? 'Menghapus...' : 'Hapus R2'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="r2-empty">
                  {statusFilter === 'orphan'
                    ? 'Tidak ada file yatim pada filter ini — bucket sudah bersih!'
                    : 'Tidak ada file yang cocok dengan filter pencarian.'}
                </div>
              )}
            </div>
            <DashboardPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredItems.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {loading && (
        <div className="r2-table-card">
          <div className="r2-empty">Memindai seluruh objek di bucket R2 dan mencocokkannya dengan database...</div>
        </div>
      )}
    </div>
  );
}
