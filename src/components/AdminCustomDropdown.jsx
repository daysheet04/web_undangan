import React, { useEffect, useRef, useState } from 'react';

export default function AdminCustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Pilih...',
  prefix = '',
  className = '',
  menuAlign = 'left',
  disabled = false,
  minWidth = '140px',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = options.find((opt) => String(opt.value) === String(value)) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const handleClose = (e) => {
      if (e.type === 'keydown' && e.key === 'Escape') setOpen(false);
      if (e.type === 'mousedown' && !rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClose);
    document.addEventListener('keydown', handleClose);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('keydown', handleClose);
    };
  }, [open]);

  return (
    <div
      className={`admin-custom-dropdown-wrap ${open ? 'is-open' : ''} ${className}`}
      ref={rootRef}
      style={{ minWidth }}
    >
      <button
        type="button"
        className="admin-custom-dropdown-trigger"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="dropdown-trigger-label">
          {prefix && <span className="dropdown-prefix">{prefix}</span>}
          <span className="dropdown-current-val">{selected?.label || placeholder}</span>
        </span>
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`dropdown-chevron-icon ${open ? 'is-open' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className={`admin-custom-dropdown-menu align-${menuAlign}`}
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`admin-custom-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <div className="dropdown-item-left">
                  {option.dotColor && (
                    <span
                      className="dropdown-item-dot"
                      style={{ backgroundColor: option.dotColor }}
                    />
                  )}
                  <span className="dropdown-item-label">{option.label}</span>
                  {option.desc && <small className="dropdown-item-desc">{option.desc}</small>}
                </div>
                {isSelected && (
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="#165643"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="dropdown-item-check"
                  >
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
