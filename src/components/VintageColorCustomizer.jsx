import React, { useEffect, useId, useState } from 'react';
import VintageColorWheel from './VintageColorWheel.jsx';
import {
  VINTAGE_COLOR_DEFAULTS,
  VINTAGE_COLOR_FIELDS,
  VINTAGE_COLOR_PRESETS,
  areVintageColorsEqual,
  normalizeVintageColors,
  sanitizeHex,
} from '../lib/vintageThemeColors.js';

export default function VintageColorCustomizer({
  value,
  onChange,
  open,
  onToggleOpen,
  defaultOpen = true,
  compact = false,
  id = 'vintageColorCustomizer',
}) {
  const colors = normalizeVintageColors(value);
  const headingId = useId();
  const [hexDrafts, setHexDrafts] = useState(colors);
  const [activeFieldKey, setActiveFieldKey] = useState('bg');
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = typeof onToggleOpen === 'function';
  const isOpen = isControlled ? Boolean(open) : internalOpen;
  const activeField = VINTAGE_COLOR_FIELDS.find((f) => f.key === activeFieldKey) || VINTAGE_COLOR_FIELDS[0];
  const togglePanel = () => {
    if (isControlled) {
      onToggleOpen(!isOpen);
    } else {
      setInternalOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    setHexDrafts(normalizeVintageColors(value));
  }, [value]);

  const isDefault = areVintageColorsEqual(colors, VINTAGE_COLOR_DEFAULTS);

  const handleSelectPreset = (presetColors) => {
    onChange(normalizeVintageColors(presetColors));
  };

  const handlePickerChange = (key, rawHex) => {
    const clean = sanitizeHex(rawHex, colors[key]);
    onChange({ ...colors, [key]: clean });
  };

  const handleHexInputChange = (key, rawText) => {
    const formatted = rawText.startsWith('#') ? rawText : `#${rawText}`;
    setHexDrafts((prev) => ({ ...prev, [key]: formatted.toUpperCase().slice(0, 7) }));
    if (/^#[0-9a-fA-F]{6}$/.test(formatted)) {
      onChange({ ...colors, [key]: formatted.toUpperCase() });
    }
  };

  const handleHexInputBlur = (key) => {
    const clean = sanitizeHex(hexDrafts[key], null);
    if (clean) {
      if (clean !== colors[key]) {
        onChange({ ...colors, [key]: clean });
      }
      setHexDrafts((prev) => ({ ...prev, [key]: clean }));
    } else {
      setHexDrafts((prev) => ({ ...prev, [key]: colors[key] }));
    }
  };

  const handleReset = () => {
    onChange({ ...VINTAGE_COLOR_DEFAULTS });
  };

  return (
    <section
      id={id}
      className={`vc-color-card${compact ? ' is-compact' : ''}${isOpen ? ' is-open' : ' is-collapsed'}`}
      aria-labelledby={headingId}
      data-vintage-color-customizer
    >
      <div className="vc-color-header">
        <div className="vc-color-header-copy">
          <span className="vc-color-pill-tag">Khusus Vintage Classic</span>
          <h3 id={headingId} className="vc-color-title">
            Palet Warna &amp; Ornamen
          </h3>
          <p className="vc-color-subtitle">
            Ubah warna latar, ukiran ornamen, border foto, dan teks — perubahan tampil seketika di Live Preview.
          </p>
        </div>

        <div className="vc-color-header-actions">
          <div className="vc-color-summary-dots" aria-hidden="true" title="Kombinasi warna aktif">
            <span style={{ backgroundColor: colors.bg }} />
            <span style={{ backgroundColor: colors.surface }} />
            <span style={{ backgroundColor: colors.ornament }} />
            <span style={{ backgroundColor: colors.photo_border }} />
            <span style={{ backgroundColor: colors.ink }} />
          </div>
          {!isDefault && (
            <button
              type="button"
              className="vc-color-btn-ghost"
              onClick={handleReset}
              data-vc-reset-colors
              title="Kembalikan ke palet bawaan Kertas Klasik"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            className="vc-color-btn-toggle"
            onClick={togglePanel}
            aria-expanded={isOpen}
            data-vc-toggle-colors
          >
            {isOpen ? 'Sembunyikan' : 'Atur Warna'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="vc-color-body">
          <div className="vc-color-block">
            <div className="vc-color-block-head">
              <strong>Preset Palet Cepat</strong>
              <span>Pilih nuansa siap pakai atau sesuaikan warna sendiri di bawah</span>
            </div>
            <div className="vc-color-presets" role="list">
              {VINTAGE_COLOR_PRESETS.map((preset) => {
                const active = areVintageColorsEqual(colors, preset.colors);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    role="listitem"
                    className={`vc-color-preset${active ? ' is-active' : ''}`}
                    onClick={() => handleSelectPreset(preset.colors)}
                    data-vc-preset={preset.id}
                    aria-pressed={active}
                  >
                    <span className="vc-preset-swatches" aria-hidden="true">
                      <i style={{ backgroundColor: preset.colors.bg }} />
                      <i style={{ backgroundColor: preset.colors.ornament }} />
                      <i style={{ backgroundColor: preset.colors.accent }} />
                      <i style={{ backgroundColor: preset.colors.photo_border }} />
                    </span>
                    <span className="vc-preset-meta">
                      <strong>{preset.name}</strong>
                      <small>{active ? 'Aktif' : preset.badge}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="vc-color-block">
            <div className="vc-color-block-head">
              <strong>Warna Bagian Detail</strong>
              <span>Pilih bagian di bawah lalu atur dengan Bola Warna atau ketik kode hex</span>
            </div>
            <div className="vc-color-fields">
              {VINTAGE_COLOR_FIELDS.map((field) => {
                const activeHex = colors[field.key];
                const draftHex = hexDrafts[field.key] ?? activeHex;
                const isSelected = field.key === activeField.key;
                return (
                  <div
                    key={field.key}
                    className={`vc-color-field${isSelected ? ' is-selected' : ''}`}
                    data-vc-color-field={field.key}
                    onClick={() => setActiveFieldKey(field.key)}
                  >
                    <div className="vc-color-field-controls">
                      <button
                        type="button"
                        className="vc-color-swatch-wrap vc-color-swatch-btn"
                        aria-label={`Pilih ${field.label} untuk diedit di Bola Warna`}
                        aria-pressed={isSelected}
                        data-vc-select-slot={field.key}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFieldKey(field.key);
                        }}
                      >
                        <span className="vc-color-swatch-preview" style={{ backgroundColor: activeHex }} />
                      </button>
                      <div className="vc-color-field-meta">
                        <span className="vc-color-field-label">{field.label}</span>
                        <small className="vc-color-field-desc">{field.description}</small>
                      </div>
                      <input
                        type="text"
                        className="vc-color-hex-input"
                        value={draftHex}
                        maxLength={7}
                        spellCheck={false}
                        autoComplete="off"
                        aria-label={`Kode hex ${field.label}`}
                        data-vc-hex={field.key}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={() => setActiveFieldKey(field.key)}
                        onChange={(e) => handleHexInputChange(field.key, e.target.value)}
                        onBlur={() => handleHexInputBlur(field.key)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleHexInputBlur(field.key);
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <VintageColorWheel
              color={colors[activeField.key]}
              fieldLabel={activeField.label}
              fieldDescription={activeField.description}
              compact={compact}
              onChange={(nextHex) => handlePickerChange(activeField.key, nextHex)}
            />
          </div>
        </div>
      )}
    </section>
  );
}
