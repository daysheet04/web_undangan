import React, { useEffect, useRef, useState } from 'react';
import {
  VINTAGE_WHEEL_QUICK_SWATCHES,
  hexToHsv,
  hsvToHex,
  sanitizeHex,
} from '../lib/vintageThemeColors.js';

export default function VintageColorWheel({
  color,
  fieldLabel,
  fieldDescription,
  onChange,
  compact = false,
}) {
  const safeColor = sanitizeHex(color, '#F4F0E8') || '#F4F0E8';
  const discRef = useRef(null);
  const draggingRef = useRef(false);
  const rectRef = useRef(null);
  const moveRafRef = useRef(0);
  const pendingPointRef = useRef(null);

  const [hsv, setHsv] = useState(() => hexToHsv(safeColor));
  const hsvRef = useRef(hsv);
  hsvRef.current = hsv;
  const [hexDraft, setHexDraft] = useState(safeColor);

  useEffect(() => {
    setHexDraft(safeColor);
    setHsv((prev) => {
      // Preserve hue/saturation when value hits 0 or saturation hits 0 so dragging slider/thumb back out doesn't jump to red
      if (hsvToHex(prev.h, prev.s, prev.v) === safeColor) {
        return prev;
      }
      return hexToHsv(safeColor);
    });
  }, [safeColor]);

  useEffect(() => {
    return () => {
      if (moveRafRef.current) window.cancelAnimationFrame(moveRafRef.current);
    };
  }, []);

  const commitHsv = (nextHsv) => {
    const clamped = {
      h: ((nextHsv.h % 360) + 360) % 360,
      s: Math.max(0, Math.min(100, nextHsv.s)),
      v: Math.max(0, Math.min(100, nextHsv.v)),
    };
    hsvRef.current = clamped;
    setHsv(clamped);
    const nextHex = hsvToHex(clamped.h, clamped.s, clamped.v);
    setHexDraft(nextHex);
    onChange(nextHex);
  };

  const updateFromPointer = (clientX, clientY) => {
    const rect = rectRef.current || discRef.current?.getBoundingClientRect();
    if (!rect) return;
    const radius = rect.width / 2;
    if (!radius) return;
    const cx = rect.left + radius;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const s = Math.min(100, (dist / radius) * 100);
    const h = (Math.atan2(dy, dx) * (180 / Math.PI) + 360) % 360;
    commitHsv({ h, s, v: hsvRef.current.v });
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    rectRef.current = discRef.current?.getBoundingClientRect() || null;
    pendingPointRef.current = null;
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {}
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    pendingPointRef.current = { x: e.clientX, y: e.clientY };
    if (!moveRafRef.current) {
      moveRafRef.current = window.requestAnimationFrame(() => {
        moveRafRef.current = 0;
        const pt = pendingPointRef.current;
        if (!pt) return;
        pendingPointRef.current = null;
        updateFromPointer(pt.x, pt.y);
      });
    }
  };

  const handlePointerEnd = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (moveRafRef.current) {
      window.cancelAnimationFrame(moveRafRef.current);
      moveRafRef.current = 0;
    }
    const pt = pendingPointRef.current;
    pendingPointRef.current = null;
    if (pt) {
      updateFromPointer(pt.x, pt.y);
    }
    rectRef.current = null;
    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      }
    } catch {}
  };

  const handleDiscKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      commitHsv({ ...hsv, h: (hsv.h - 6 + 360) % 360 });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      commitHsv({ ...hsv, h: (hsv.h + 6) % 360 });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      commitHsv({ ...hsv, s: Math.min(100, hsv.s + 5) });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      commitHsv({ ...hsv, s: Math.max(0, hsv.s - 5) });
    }
  };

  const handleBrightnessChange = (e) => {
    const nextV = Number(e.target.value);
    commitHsv({ ...hsv, v: Number.isFinite(nextV) ? nextV : hsv.v });
  };

  const handleHexInputChange = (e) => {
    const raw = e.target.value.trim();
    const prefixed = raw.startsWith('#') ? raw : `#${raw}`;
    const formatted = prefixed.toUpperCase().slice(0, 7);
    setHexDraft(formatted);
    if (/^#[0-9A-F]{6}$/.test(formatted)) {
      const nextHsv = hexToHsv(formatted);
      setHsv(nextHsv);
      onChange(formatted);
    }
  };

  const handleHexBlur = () => {
    const clean = sanitizeHex(hexDraft, null);
    if (clean) {
      setHexDraft(clean);
      if (clean !== safeColor) {
        setHsv(hexToHsv(clean));
        onChange(clean);
      }
    } else {
      setHexDraft(safeColor);
    }
  };

  const handleQuickSwatch = (swatchHex) => {
    const clean = sanitizeHex(swatchHex, safeColor);
    setHexDraft(clean);
    setHsv(hexToHsv(clean));
    onChange(clean);
  };

  const rad = (hsv.h * Math.PI) / 180;
  const thumbLeft = 50 + (hsv.s / 100) * 50 * Math.cos(rad);
  const thumbTop = 50 + (hsv.s / 100) * 50 * Math.sin(rad);
  const brightMaxHex = hsvToHex(hsv.h, hsv.s, 100);
  const darkScrimOpacity = Math.max(0, Math.min(1, (100 - hsv.v) / 100));

  return (
    <div className={`vc-wheel-studio${compact ? ' is-compact' : ''}`} data-vc-wheel-studio>
      <div className="vc-wheel-stage">
        <div
          ref={discRef}
          className="vc-wheel-disc"
          role="slider"
          tabIndex={0}
          aria-label={`Bola warna untuk ${fieldLabel}`}
          aria-valuetext={safeColor}
          data-vc-wheel-disc
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onKeyDown={handleDiscKeyDown}
        >
          <div className="vc-wheel-sat" />
          <div
            className="vc-wheel-val"
            style={{ backgroundColor: `rgba(0, 0, 0, ${darkScrimOpacity.toFixed(3)})` }}
          />
          <span
            className="vc-wheel-thumb"
            data-vc-wheel-thumb
            style={{
              left: `${thumbLeft.toFixed(2)}%`,
              top: `${thumbTop.toFixed(2)}%`,
              backgroundColor: safeColor,
            }}
          />
        </div>
        <span className="vc-wheel-hint">Geser bola warna atau arah panah</span>
      </div>

      <div className="vc-wheel-controls">
        <div className="vc-wheel-active-badge">
          <span className="vc-wheel-active-dot" style={{ backgroundColor: safeColor }} />
          <div>
            <strong>{fieldLabel}</strong>
            <small>{fieldDescription}</small>
          </div>
        </div>

        <label className="vc-wheel-brightness-wrap">
          <div className="vc-wheel-control-head">
            <span>Kecerahan</span>
            <b>{Math.round(hsv.v)}%</b>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(hsv.v)}
            onChange={handleBrightnessChange}
            aria-label={`Kecerahan ${fieldLabel}`}
            data-vc-wheel-brightness
            className="vc-wheel-brightness-slider"
            style={{
              background: `linear-gradient(90deg, #000000 0%, ${brightMaxHex} 100%)`,
            }}
          />
        </label>

        <div className="vc-wheel-manual-wrap">
          <span className="vc-wheel-manual-label">Input Kode Warna (Hex)</span>
          <div className="vc-wheel-manual-row">
            <span className="vc-wheel-manual-chip" style={{ backgroundColor: safeColor }} aria-hidden="true" />
            <input
              type="text"
              className="vc-wheel-hex-input"
              value={hexDraft}
              maxLength={7}
              spellCheck={false}
              autoComplete="off"
              placeholder="#F4F0E8"
              aria-label={`Input kode warna hex untuk ${fieldLabel}`}
              data-vc-wheel-hex
              onChange={handleHexInputChange}
              onBlur={handleHexBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleHexBlur();
                }
              }}
            />
          </div>
        </div>

        <div className="vc-wheel-quick-wrap">
          <span className="vc-wheel-manual-label">Pilihan Cepat</span>
          <div className="vc-wheel-quick-swatches">
            {VINTAGE_WHEEL_QUICK_SWATCHES.map((hex) => {
              const active = safeColor === hex;
              return (
                <button
                  key={hex}
                  type="button"
                  className={`vc-wheel-quick-dot${active ? ' is-active' : ''}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => handleQuickSwatch(hex)}
                  aria-label={`Pilih warna ${hex}`}
                  title={hex}
                  data-vc-quick-swatch={hex}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
