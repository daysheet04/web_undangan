import React, { useEffect, useState } from 'react';
import {
  VINTAGE_STORY_DEFAULT_ITEMS,
  VINTAGE_STORY_MAX_ITEMS,
  VINTAGE_STORY_MAX_WORDS,
  clampWords,
  countWords,
  parseVintageStory,
  serializeVintageStory,
} from '../lib/vintageStory.js';

function createInitialItems(rawValue) {
  const parsed = parseVintageStory(rawValue, { fallbackToDefaults: true, enforceWordCap: false });
  return parsed.length ? parsed : VINTAGE_STORY_DEFAULT_ITEMS.map((item) => ({ ...item }));
}

export default function VintageStoryEditor({ value = '', onChange, compact = false }) {
  const [items, setItems] = useState(() => createInitialItems(value));

  useEffect(() => {
    const incoming = String(value || '').trim();
    const localSerialized = serializeVintageStory(items).trim();
    if (!incoming) return;
    if (incoming !== localSerialized) {
      const parsed = parseVintageStory(incoming, { fallbackToDefaults: false, enforceWordCap: false });
      if (parsed.length) setItems(parsed);
    }
  }, [value]);

  const commit = (nextItems) => {
    setItems(nextItems);
    if (typeof onChange === 'function') {
      onChange(serializeVintageStory(nextItems));
    }
  };

  const updateItem = (idx, key, nextVal) => {
    const updated = items.map((item, i) => {
      if (i !== idx) return item;
      if (key === 'description') {
        return { ...item, description: clampWords(nextVal, VINTAGE_STORY_MAX_WORDS) };
      }
      return { ...item, [key]: nextVal };
    });
    commit(updated);
  };

  const addItem = () => {
    if (items.length >= VINTAGE_STORY_MAX_ITEMS) return;
    commit([
      ...items,
      { year: '', title: '', description: '' },
    ]);
  };

  const removeItem = (idx) => {
    if (items.length <= 1) return;
    commit(items.filter((_, i) => i !== idx));
  };

  return (
    <div className={`vse-card${compact ? ' vse-compact' : ''}`} data-vintage-story-editor>
      <div className="vse-head">
        <div>
          <span className="vse-badge">Khusus Vintage Classic</span>
          <h3 className="vse-heading">Peta Kisah Cinta</h3>
          <p className="vse-sub">
            Atur hingga {VINTAGE_STORY_MAX_ITEMS} titik perjalanan dengan tahun, subjudul, dan deskripsi singkat
            (maks. {VINTAGE_STORY_MAX_WORDS} kata per momen).
          </p>
        </div>
      </div>

      <div className="vse-list">
        {items.map((item, idx) => {
          const words = countWords(item.description);
          const nearLimit = words >= VINTAGE_STORY_MAX_WORDS - 3;
          return (
            <div className="vse-item" key={`vse-stop-${idx}`} data-vse-item={idx}>
              <div className="vse-item-top">
                <span className="vse-pin">{String(idx + 1).padStart(2, '0')}</span>
                <span className="vse-item-label">Titik Perjalanan {idx + 1}</span>
                {items.length > 1 && (
                  <button
                    type="button"
                    className="vse-remove-btn"
                    onClick={() => removeItem(idx)}
                    aria-label={`Hapus titik perjalanan ${idx + 1}`}
                  >
                    Hapus
                  </button>
                )}
              </div>

              <div className="vse-row">
                <label className="vse-field vse-field-year">
                  <span>Tahun</span>
                  <input
                    type="text"
                    maxLength={12}
                    value={item.year}
                    placeholder="2025"
                    data-vse-year={idx}
                    onChange={(e) => updateItem(idx, 'year', e.target.value)}
                  />
                </label>

                <label className="vse-field vse-field-title">
                  <span>Subjudul Momen</span>
                  <input
                    type="text"
                    maxLength={45}
                    value={item.title}
                    placeholder="Mulai Perkenalan"
                    data-vse-title={idx}
                    onChange={(e) => updateItem(idx, 'title', e.target.value)}
                  />
                </label>
              </div>

              <label className="vse-field">
                <span>Deskripsi Singkat</span>
                <textarea
                  rows={compact ? 2 : 3}
                  value={item.description}
                  placeholder="Tulis cerita singkat maksimal 35 kata untuk titik perjalanan ini..."
                  data-vse-desc={idx}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                />
                <small className={`vse-word-count${nearLimit ? ' is-warn' : ''}`} data-vse-words={idx}>
                  {words} / {VINTAGE_STORY_MAX_WORDS} kata
                </small>
              </label>
            </div>
          );
        })}
      </div>

      {items.length < VINTAGE_STORY_MAX_ITEMS && (
        <button type="button" className="vse-add-btn" data-vse-add onClick={addItem}>
          + Tambah Titik Perjalanan ({items.length}/{VINTAGE_STORY_MAX_ITEMS})
        </button>
      )}
    </div>
  );
}
