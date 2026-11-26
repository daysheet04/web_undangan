import React, { memo } from 'react';

export const DashboardPagination = memo(function DashboardPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) {
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
});

export default DashboardPagination;
