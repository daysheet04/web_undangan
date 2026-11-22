import React, { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';

const RSVP_PER_PAGE = 8;

const STATUS_META = {
  attending: {
    label: 'Hadir',
    badgeClass: 'is-attending',
    pdfColor: [21, 93, 55],
    pdfBg: [232, 245, 237],
  },
  not_attending: {
    label: 'Tidak Hadir',
    badgeClass: 'is-not-attending',
    pdfColor: [168, 42, 42],
    pdfBg: [253, 236, 236],
  },
  unsure: {
    label: 'Masih Ragu',
    badgeClass: 'is-unsure',
    pdfColor: [146, 98, 24],
    pdfBg: [254, 244, 224],
  },
};

function normalizeStatus(raw) {
  const s = String(raw || '').toLowerCase().trim();
  if (s === 'attending' || s === 'hadir') return 'attending';
  if (s === 'not_attending' || s === 'tidak_hadir' || s === 'tidak hadir') return 'not_attending';
  return 'unsure';
}

function formatGreetingDate(value) {
  if (!value) return '';
  const str = String(value).trim();
  if (!str || /baru saja/i.test(str)) return str;
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return str;
  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed);
  } catch {
    return str;
  }
}

function cleanPdfText(str) {
  if (str == null) return '';
  return String(str)
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, '-')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-')
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[\u2600-\u27BF]/g, '')
    .trim();
}

export function generateRsvpPdf({
  greetings = [],
  coupleNames = 'Kedua Mempelai',
  orderCode = '',
  packageName = '',
  templateName = '',
  filterStatus = 'all',
  searchQuery = '',
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageW = 210;
  const pageH = 297;
  const marginX = 16;
  const contentW = pageW - marginX * 2;

  const counts = {
    total: greetings.length,
    attending: 0,
    not_attending: 0,
    unsure: 0,
  };
  greetings.forEach((g) => {
    const st = normalizeStatus(g?.attendance_status);
    counts[st] = (counts[st] || 0) + 1;
  });

  const drawPageBackgroundAndHeader = (isFirstPage) => {
    // Soft ivory paper background
    doc.setFillColor(251, 250, 247);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Top decorative accent bar
    doc.setFillColor(21, 93, 55);
    doc.rect(0, 0, pageW, 4, 'F');

    if (!isFirstPage) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(22, 46, 36);
      doc.text(cleanPdfText(`Rekap Ucapan & RSVP — ${coupleNames}`), marginX, 14);
      doc.setDrawColor(216, 224, 219);
      doc.setLineWidth(0.3);
      doc.line(marginX, 17, pageW - marginX, 17);
      return 23;
    }

    // Main header card on page 1
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(214, 224, 218);
    doc.setLineWidth(0.35);
    doc.roundedRect(marginX, 11, contentW, 29, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(21, 93, 55);
    doc.text('DAYMOMENT · REKAP KONFIRMASI KEHADIRAN & UCAPAN RSVP', marginX + 6, 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(22, 46, 36);
    doc.text(cleanPdfText(coupleNames || 'Kedua Mempelai'), marginX + 6, 26.5);

    const metaParts = [
      orderCode ? `Order: ${orderCode}` : '',
      packageName ? `Paket: ${packageName}` : '',
      templateName ? `Tema: ${templateName}` : '',
      `Dicetak: ${formatGreetingDate(new Date().toISOString())}`,
    ].filter(Boolean);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(104, 119, 113);
    doc.text(cleanPdfText(metaParts.join('  ·  ')), marginX + 6, 34);

    // 4 Summary stat boxes
    const stats = [
      { label: 'TOTAL UCAPAN', value: String(counts.total), bg: [242, 246, 244], fg: [22, 46, 36] },
      { label: 'HADIR', value: String(counts.attending), bg: [232, 245, 237], fg: [21, 93, 55] },
      { label: 'TIDAK HADIR', value: String(counts.not_attending), bg: [253, 236, 236], fg: [168, 42, 42] },
      { label: 'MASIH RAGU', value: String(counts.unsure), bg: [254, 244, 224], fg: [146, 98, 24] },
    ];
    const gap = 3.5;
    const boxW = (contentW - gap * 3) / 4;
    const statY = 44;
    stats.forEach((st, idx) => {
      const bx = marginX + idx * (boxW + gap);
      doc.setFillColor(...st.bg);
      doc.setDrawColor(220, 228, 224);
      doc.roundedRect(bx, statY, boxW, 17, 2.2, 2.2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...st.fg);
      doc.text(st.label, bx + 4, statY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.text(st.value, bx + 4, statY + 13.5);
    });

    let nextY = 66;
    if (filterStatus !== 'all' || (searchQuery && searchQuery.trim())) {
      const filterLabel =
        filterStatus === 'attending'
          ? 'Hadir'
          : filterStatus === 'not_attending'
            ? 'Tidak Hadir'
            : filterStatus === 'unsure'
              ? 'Masih Ragu'
              : 'Semua Status';
      const filterNote = [
        `Filter Status: ${filterLabel}`,
        searchQuery?.trim() ? `Pencarian Nama: "${searchQuery.trim()}"` : '',
      ]
        .filter(Boolean)
        .join('  |  ');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(88, 104, 96);
      doc.text(cleanPdfText(filterNote), marginX, nextY);
      nextY += 5.5;
    }

    return nextY;
  };

  let curY = drawPageBackgroundAndHeader(true);

  if (!greetings.length) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(218, 226, 221);
    doc.roundedRect(marginX, curY, contentW, 24, 2.5, 2.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(104, 119, 113);
    doc.text('Belum ada data ucapan atau konfirmasi kehadiran RSVP pada daftar ini.', marginX + 6, curY + 14);
  } else {
    greetings.forEach((item, index) => {
      const statusKey = normalizeStatus(item?.attendance_status);
      const statusInfo = STATUS_META[statusKey] || STATUS_META.unsure;
      const guestName = cleanPdfText(item?.guest_name || 'Tamu Undangan') || 'Tamu Undangan';
      const dateStr = cleanPdfText(formatGreetingDate(item?.created_at));
      const rawMsg = cleanPdfText(item?.message || '-');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.2);
      const msgLines = doc.splitTextToSize(rawMsg || '-', contentW - 14);
      const lineH = 4.3;
      const cardH = Math.max(20, 14 + msgLines.length * lineH + 3);

      if (curY + cardH > pageH - 16) {
        doc.addPage();
        curY = drawPageBackgroundAndHeader(false);
      }

      // Greeting card container
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(218, 226, 221);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, curY, contentW, cardH, 2.2, 2.2, 'FD');

      // Left status stripe
      doc.setFillColor(...statusInfo.pdfColor);
      doc.roundedRect(marginX, curY, 2.2, cardH, 1, 1, 'F');

      // Number + Guest Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.8);
      doc.setTextColor(22, 46, 36);
      const titleText = `${index + 1}. ${guestName}`;
      doc.text(titleText.slice(0, 62), marginX + 6, curY + 7.2);

      // Attendance status pill on top-right
      const badgeLabel = statusInfo.label.toUpperCase();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      const badgeW = doc.getTextWidth(badgeLabel) + 6;
      const badgeX = pageW - marginX - badgeW - 4;
      const badgeY = curY + 3.2;
      doc.setFillColor(...statusInfo.pdfBg);
      doc.roundedRect(badgeX, badgeY, badgeW, 5.4, 1.5, 1.5, 'F');
      doc.setTextColor(...statusInfo.pdfColor);
      doc.text(badgeLabel, badgeX + 3, badgeY + 3.8);

      // Timestamp next to status pill
      if (dateStr) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(124, 138, 132);
        const dtW = doc.getTextWidth(dateStr);
        doc.text(dateStr, badgeX - dtW - 4, curY + 7);
      }

      // Message body
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.2);
      doc.setTextColor(62, 78, 71);
      doc.text(msgLines, marginX + 6, curY + 13.2);

      curY += cardH + 3.5;
    });
  }

  // Footer with page numbers
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(130, 142, 136);
    doc.text(
      `Daymoment · Rekap RSVP & Ucapan ${cleanPdfText(coupleNames)}`,
      marginX,
      pageH - 7,
    );
    const pgText = `Halaman ${p} dari ${totalPages}`;
    doc.text(pgText, pageW - marginX - doc.getTextWidth(pgText), pageH - 7);
  }

  const safeSlug = String(coupleNames || orderCode || 'undangan')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'undangan';
  doc.save(`rekap-rsvp-ucapan-${safeSlug}.pdf`);
}

export default function BuilderRsvpPanel({
  initialGreetings = [],
  token = '',
  coupleNames = 'Kedua Mempelai',
  orderCode = '',
  packageName = '',
  templateName = '',
}) {
  const [greetings, setGreetings] = useState(() =>
    Array.isArray(initialGreetings) ? initialGreetings : [],
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [pdfWorking, setPdfWorking] = useState(false);

  const counts = useMemo(() => {
    const summary = {
      all: greetings.length,
      attending: 0,
      not_attending: 0,
      unsure: 0,
    };
    greetings.forEach((item) => {
      const key = normalizeStatus(item?.attendance_status);
      summary[key] = (summary[key] || 0) + 1;
    });
    return summary;
  }, [greetings]);

  const filteredGreetings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return greetings.filter((item) => {
      const st = normalizeStatus(item?.attendance_status);
      if (statusFilter !== 'all' && st !== statusFilter) return false;
      if (!q) return true;
      const name = String(item?.guest_name || '').toLowerCase();
      return name.includes(q);
    });
  }, [greetings, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredGreetings.length / RSVP_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * RSVP_PER_PAGE;
  const paginatedGreetings = filteredGreetings.slice(startIndex, startIndex + RSVP_PER_PAGE);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (nextStatus) => {
    setStatusFilter(nextStatus);
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    if (!token || refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/editor/${encodeURIComponent(token)}/greetings`, {
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data?.ok && Array.isArray(data.greetings)) {
        setGreetings(data.greetings);
        if (typeof window.showToast === 'function') {
          window.showToast('Daftar ucapan & RSVP berhasil diperbarui.');
        }
      }
    } catch (err) {
      console.error('Failed to refresh greetings:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadPdf = () => {
    if (pdfWorking) return;
    setPdfWorking(true);
    try {
      generateRsvpPdf({
        greetings: filteredGreetings,
        coupleNames,
        orderCode,
        packageName,
        templateName,
        filterStatus: statusFilter,
        searchQuery,
      });
      if (typeof window.showToast === 'function') {
        window.showToast('PDF rekap ucapan & RSVP berhasil diunduh.');
      }
    } catch (err) {
      console.error('RSVP PDF error:', err);
      alert(err?.message || 'Gagal mengunduh PDF rekap RSVP.');
    } finally {
      setPdfWorking(false);
    }
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    if (totalPages <= 7) {
      for (let p = 1; p <= totalPages; p += 1) pages.push(p);
      return pages;
    }
    pages.push(1);
    if (safePage > 3) pages.push('...');
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let p = start; p <= end; p += 1) pages.push(p);
    if (safePage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  }, [totalPages, safePage]);

  return (
    <div className="rsvp-results-panel" data-rsvp-panel>
      <div className="step-intro">
        <span className="step-icon">✉</span>
        <div>
          <h1>Jawaban Komentar &amp; RSVP</h1>
          <p>
            Pantau konfirmasi kehadiran serta ucapan doa dari para tamu pada paket{' '}
            <strong>{packageName || 'Undangan'}</strong>, lalu unduh rekapnya dalam format PDF.
          </p>
        </div>
      </div>

      <div className="builder-print-pdf-card rsvp-pdf-download-card">
        <span className="builder-print-pdf-icon">PDF</span>
        <div>
          <strong>Rekap Jawaban Komentar &amp; Kehadiran RSVP</strong>
          <p>
            {statusFilter === 'all' && !searchQuery.trim()
              ? `Unduh seluruh ${greetings.length} data ucapan dan status kehadiran tamu dalam dokumen PDF A4 rapi.`
              : `Unduh ${filteredGreetings.length} hasil ucapan sesuai filter/pencarian aktif dalam dokumen PDF A4.`}
          </p>
        </div>
        <div className="rsvp-pdf-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Muat ulang data komentar RSVP terbaru"
          >
            {refreshing ? 'Memuat...' : '↻ Refresh'}
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={handleDownloadPdf}
            disabled={pdfWorking || greetings.length === 0}
            id="btnDownloadRsvpPdf"
          >
            {pdfWorking ? 'Membuat PDF...' : '📥 Download PDF'}
          </button>
        </div>
      </div>

      <div className="rsvp-summary-grid" role="group" aria-label="Ringkasan kehadiran tamu">
        <button
          type="button"
          className={`rsvp-summary-card ${statusFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          <span className="rsvp-summary-label">Total Komentar</span>
          <strong className="rsvp-summary-value">{counts.all}</strong>
        </button>
        <button
          type="button"
          className={`rsvp-summary-card is-attending ${statusFilter === 'attending' ? 'is-active' : ''}`}
          onClick={() => handleFilterChange('attending')}
        >
          <span className="rsvp-summary-label">Hadir</span>
          <strong className="rsvp-summary-value">{counts.attending}</strong>
        </button>
        <button
          type="button"
          className={`rsvp-summary-card is-not-attending ${statusFilter === 'not_attending' ? 'is-active' : ''}`}
          onClick={() => handleFilterChange('not_attending')}
        >
          <span className="rsvp-summary-label">Tidak Hadir</span>
          <strong className="rsvp-summary-value">{counts.not_attending}</strong>
        </button>
        <button
          type="button"
          className={`rsvp-summary-card is-unsure ${statusFilter === 'unsure' ? 'is-active' : ''}`}
          onClick={() => handleFilterChange('unsure')}
        >
          <span className="rsvp-summary-label">Masih Ragu</span>
          <strong className="rsvp-summary-value">{counts.unsure}</strong>
        </button>
      </div>

      <div className="form-section-card">
        <div className="upload-heading rsvp-list-heading">
          <div>
            <h2>Daftar Ucapan &amp; Konfirmasi Tamu</h2>
            <p id="rsvpResultCount">
              {filteredGreetings.length === greetings.length
                ? `${greetings.length} komentar diterima`
                : `Menampilkan ${filteredGreetings.length} dari ${greetings.length} komentar`}
            </p>
          </div>
        </div>

        <div className="rsvp-toolbar">
          <div className="invitee-search-bar rsvp-search-bar">
            <div className="invitee-search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                id="rsvpNameSearch"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Cari nama tamu..."
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  id="rsvpSearchClear"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  title="Hapus pencarian"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="rsvp-filter-pills" role="tablist" aria-label="Filter status kehadiran">
            {[
              ['all', `Semua (${counts.all})`],
              ['attending', `Hadir (${counts.attending})`],
              ['not_attending', `Tidak Hadir (${counts.not_attending})`],
              ['unsure', `Masih Ragu (${counts.unsure})`],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={statusFilter === key}
                data-rsvp-filter={key}
                className={`rsvp-filter-pill ${statusFilter === key ? 'active' : ''}`}
                onClick={() => handleFilterChange(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {greetings.length === 0 ? (
          <div className="empty-editor-note" id="rsvpEmptyState">
            Belum ada komentar ucapan atau konfirmasi RSVP dari tamu undangan.
          </div>
        ) : filteredGreetings.length === 0 ? (
          <div className="empty-editor-note" id="rsvpFilterEmptyState">
            <p style={{ margin: '0 0 10px' }}>
              🔍 Tidak ditemukan komentar tamu yang cocok dengan pencarian atau filter kehadiran.
            </p>
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
            >
              Reset Filter &amp; Pencarian
            </button>
          </div>
        ) : (
          <div className="rsvp-comment-list" id="rsvpCommentList">
            {paginatedGreetings.map((item, idx) => {
              const statusKey = normalizeStatus(item?.attendance_status);
              const meta = STATUS_META[statusKey] || STATUS_META.unsure;
              const dateLabel = formatGreetingDate(item?.created_at);
              return (
                <article
                  key={item.id || `${item.guest_name}-${startIndex + idx}`}
                  className="rsvp-comment-card"
                  data-rsvp-item
                  data-attendance={statusKey}
                >
                  <div className="rsvp-comment-top">
                    <div className="rsvp-comment-author">
                      <span className="rsvp-comment-index">#{startIndex + idx + 1}</span>
                      <strong>{item.guest_name || 'Tamu Undangan'}</strong>
                    </div>
                    <div className="rsvp-comment-meta">
                      {dateLabel && <time className="rsvp-comment-date">{dateLabel}</time>}
                      <span className={`rsvp-status-badge ${meta.badgeClass}`}>{meta.label}</span>
                    </div>
                  </div>
                  <p className="rsvp-comment-message">{item.message}</p>
                </article>
              );
            })}
          </div>
        )}

        {filteredGreetings.length > 0 && (
          <div className="invitee-pagination-bar rsvp-pagination-bar" id="rsvpPaginationBar">
            <div className="pagination-count-label" id="rsvpPaginationInfo">
              Menampilkan {startIndex + 1}–{Math.min(startIndex + RSVP_PER_PAGE, filteredGreetings.length)} dari{' '}
              {filteredGreetings.length} ucapan
            </div>
            <div className="pagination-buttons" id="rsvpPaginationNav">
              <button
                type="button"
                className="page-btn"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Halaman sebelumnya"
              >
                ‹
              </button>
              {pageNumbers.map((pg, i) =>
                pg === '...' ? (
                  <span key={`dots-${i}`} className="page-dots">
                    …
                  </span>
                ) : (
                  <button
                    key={pg}
                    type="button"
                    className={`page-btn ${safePage === pg ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pg)}
                  >
                    {pg}
                  </button>
                ),
              )}
              <button
                type="button"
                className="page-btn"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Halaman berikutnya"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
