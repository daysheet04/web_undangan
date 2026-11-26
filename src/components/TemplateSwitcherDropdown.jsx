import React, { useEffect, useMemo, useRef, useState } from 'react';
import { money } from '../lib/api.js';
import { templatePhoneCoverUrl } from './TemplateCover.jsx';

export default function TemplateSwitcherDropdown({
  templates,
  currentTemplate,
  onSelect,
  label = 'Ganti tema undangan',
  placeholder = 'Cari nama tema atau kategori...',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return undefined;
    }

    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    // Auto-focus search input on pointer-hover (desktop) devices so mobile keyboards don't jump unexpectedly
    let focusTimer = 0;
    if (typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches) {
      focusTimer = window.setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 60);
    }

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      if (focusTimer) window.clearTimeout(focusTimer);
    };
  }, [open]);

  const filteredTemplates = useMemo(() => {
    const list = Array.isArray(templates) ? templates : [];
    const keyword = query.trim().toLowerCase();
    if (!keyword) return list;
    return list.filter((item) => {
      const haystack = [
        item.name,
        item.category,
        item.description,
        item.code,
        item.url_slug,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [templates, query]);

  if (!templates?.length || templates.length <= 1 || !currentTemplate) return null;

  const handleChoose = (item) => {
    onSelect?.(item);
    setOpen(false);
  };

  return (
    <div
      className={`order-template-switcher${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}
      ref={wrapRef}
    >
      <span className="order-template-switcher-label">{label}</span>
      <button
        type="button"
        className="order-template-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="order-template-trigger-left">
          <img
            className="order-template-thumb"
            src={templatePhoneCoverUrl(currentTemplate)}
            alt=""
            width="36"
            height="48"
            loading="lazy"
            decoding="async"
          />
          <span className="order-template-trigger-copy">
            <strong>{currentTemplate.name}</strong>
            <small>{currentTemplate.category}</small>
          </span>
        </span>
        <svg
          className="order-template-chevron"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div className="order-template-menu" role="dialog" aria-label="Pilih tema undangan">
        <div className="order-template-search-wrap">
          <svg
            className="order-template-search-icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            className="order-template-search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && filteredTemplates.length > 0) {
                event.preventDefault();
                handleChoose(filteredTemplates[0]);
              }
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="order-template-search-clear"
              aria-label="Hapus pencarian"
              onClick={() => {
                setQuery('');
                searchInputRef.current?.focus({ preventScroll: true });
              }}
            >
              ×
            </button>
          )}
        </div>

        <div className="order-template-list" role="listbox" aria-label="Daftar tema undangan">
          {filteredTemplates.length ? (
            filteredTemplates.map((item) => {
              const isActive = item.code === currentTemplate.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={`order-template-option${isActive ? ' is-active' : ''}`}
                  onClick={() => handleChoose(item)}
                >
                  <img
                    className="order-template-thumb"
                    src={templatePhoneCoverUrl(item)}
                    alt=""
                    width="34"
                    height="46"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="order-template-option-copy">
                    <strong>{item.name}</strong>
                    <small>
                      {item.category}
                      {item.starting_price ? ` · Mulai ${money(item.starting_price)}` : ''}
                    </small>
                  </span>
                  {isActive && <span className="order-template-check" aria-hidden="true">✓</span>}
                </button>
              );
            })
          ) : (
            <div className="order-template-empty">
              Tema “{query.trim()}” tidak ditemukan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
