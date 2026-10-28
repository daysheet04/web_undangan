import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function AdminCoverAdjusterModal({
  isOpen,
  onClose,
  template,
  initialImageUrl,
  onSaveCover,
  aspectRatio = '4:3',
  title,
  subtitle,
  hint,
}) {
  const isPhone = aspectRatio === 'phone';
  const CANVAS_W = isPhone ? 472 : 800;
  const CANVAS_H = isPhone ? 944 : 600;
  const exportW = isPhone ? 590 : 1200;
  const exportH = isPhone ? 1180 : 900;

  const [currentUrl, setCurrentUrl] = useState(initialImageUrl || '');
  const [zoom, setZoom] = useState(100); // 100% to 350%
  const [panX, setPanX] = useState(0); // in canvas px
  const [panY, setPanY] = useState(0); // in canvas px
  const [saving, setSaving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const imageRef = useRef(null);

  // Drag tracking refs
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    touchDist: 0,
    startZoom: 100,
  });

  // Keep state in sync with props
  useEffect(() => {
    if (isOpen) {
      setCurrentUrl(initialImageUrl || '');
      setZoom(100);
      setPanX(0);
      setPanY(0);
      setImageLoaded(false);
      setLoadError(false);
      setSaving(false);
    }
  }, [isOpen, initialImageUrl]);

  // Load image object
  useEffect(() => {
    if (!isOpen || !currentUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      setLoadError(false);
    };

    img.onerror = () => {
      // If anonymous CORS failed, retry without crossOrigin
      if (img.crossOrigin) {
        const retry = new Image();
        retry.onload = () => {
          imageRef.current = retry;
          setImageLoaded(true);
          setLoadError(false);
        };
        retry.onerror = () => {
          setLoadError(true);
          setImageLoaded(false);
        };
        retry.src = currentUrl;
      } else {
        setLoadError(true);
        setImageLoaded(false);
      }
    };

    img.src = currentUrl;

    return () => {
      imageRef.current = null;
    };
  }, [isOpen, currentUrl]);

  // Redraw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const baseScale = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
    const scale = baseScale * (zoom / 100);

    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;

    const baseX = (CANVAS_W - drawW) / 2;
    const baseY = (CANVAS_H - drawH) / 2;

    const drawX = baseX + panX;
    const drawY = baseY + panY;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }, [zoom, panX, panY]);

  useEffect(() => {
    if (imageLoaded) {
      draw();
    }
  }, [imageLoaded, draw]);

  // Mouse & Touch Pan Handling
  const handlePointerDown = (e) => {
    if (!imageLoaded || saving) return;
    const stage = stageRef.current;
    if (!stage) return;

    dragRef.current.isDragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.startPanX = panX;
    dragRef.current.startPanY = panY;
    stage.classList.add('is-dragging');

    const handlePointerMove = (moveEvent) => {
      if (!dragRef.current.isDragging) return;
      const rect = stage.getBoundingClientRect();
      const scaleFactorX = CANVAS_W / (rect.width || CANVAS_W);
      const scaleFactorY = CANVAS_H / (rect.height || CANVAS_H);

      const dx = (moveEvent.clientX - dragRef.current.startX) * scaleFactorX;
      const dy = (moveEvent.clientY - dragRef.current.startY) * scaleFactorY;

      setPanX(Math.round(dragRef.current.startPanX + dx));
      setPanY(Math.round(dragRef.current.startPanY + dy));
    };

    const handlePointerUp = () => {
      dragRef.current.isDragging = false;
      stage.classList.remove('is-dragging');
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (!imageLoaded || saving) return;
    const delta = -e.deltaY * 0.12;
    setZoom((prev) => Math.min(350, Math.max(100, Math.round(prev + delta))));
  };

  // Touch gesture support (drag + pinch zoom)
  const handleTouchStart = (e) => {
    if (!imageLoaded || saving) return;
    if (e.touches.length === 1) {
      dragRef.current.isDragging = true;
      dragRef.current.startX = e.touches[0].clientX;
      dragRef.current.startY = e.touches[0].clientY;
      dragRef.current.startPanX = panX;
      dragRef.current.startPanY = panY;
    } else if (e.touches.length === 2) {
      dragRef.current.isDragging = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      dragRef.current.touchDist = dist;
      dragRef.current.startZoom = zoom;
    }
  };

  const handleTouchMove = (e) => {
    if (!imageLoaded || saving) return;
    const stage = stageRef.current;
    if (!stage) return;

    if (e.touches.length === 1 && dragRef.current.isDragging) {
      const rect = stage.getBoundingClientRect();
      const scaleFactorX = CANVAS_W / (rect.width || CANVAS_W);
      const scaleFactorY = CANVAS_H / (rect.height || CANVAS_H);

      const dx = (e.touches[0].clientX - dragRef.current.startX) * scaleFactorX;
      const dy = (e.touches[0].clientY - dragRef.current.startY) * scaleFactorY;

      setPanX(Math.round(dragRef.current.startPanX + dx));
      setPanY(Math.round(dragRef.current.startPanY + dy));
    } else if (e.touches.length === 2 && dragRef.current.touchDist > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / dragRef.current.touchDist;
      setZoom(Math.min(350, Math.max(100, Math.round(dragRef.current.startZoom * factor))));
    }
  };

  const handleTouchEnd = () => {
    dragRef.current.isDragging = false;
    dragRef.current.touchDist = 0;
  };

  // Quick reset
  const handleReset = () => {
    setZoom(100);
    setPanX(0);
    setPanY(0);
  };

  // Step zoom buttons
  const stepZoom = (amount) => {
    setZoom((prev) => Math.min(350, Math.max(100, prev + amount)));
  };

  // File replacement inside modal
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCurrentUrl(url);
    setZoom(100);
    setPanX(0);
    setPanY(0);
    e.target.value = '';
  };

  // Export cropped high-res image & save
  const handleApply = async () => {
    const img = imageRef.current;
    if (!img || !imageLoaded || saving) return;

    setSaving(true);
    try {
      // 1200x900 px export canvas (exact 4:3 ratio with high-DPI clarity)
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = exportW;
      exportCanvas.height = exportH;
      const exportCtx = exportCanvas.getContext('2d');

      const baseScale = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
      const scale = baseScale * (zoom / 100);

      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;

      const baseX = (CANVAS_W - drawW) / 2;
      const baseY = (CANVAS_H - drawH) / 2;

      const drawX = baseX + panX;
      const drawY = baseY + panY;

      // Scale to export canvas
      const ratio = exportW / CANVAS_W;

      exportCtx.imageSmoothingEnabled = true;
      exportCtx.imageSmoothingQuality = 'high';
      exportCtx.drawImage(
        img,
        drawX * ratio,
        drawY * ratio,
        drawW * ratio,
        drawH * ratio
      );

      const blob = await new Promise((resolve, reject) => {
        exportCanvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Gagal memproses gambar crop.'));
          },
          'image/webp',
          0.92
        );
      });

      const fileName = isPhone
        ? `${template?.code || 'template'}-phone-cover-${Date.now()}.webp`
        : `${template?.code || 'template'}-cover-${Date.now()}.webp`;
      const file = new File([blob], fileName, { type: 'image/webp' });

      await onSaveCover(file);
      onClose();
    } catch (err) {
      console.error('Error applying cover adjustment:', err);
      window.showToast?.(err.message || 'Gagal menyimpan foto sampul.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="admin-cover-adjuster-backdrop" onClick={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className={`admin-cover-adjuster-modal ${isPhone ? 'is-phone-modal' : ''}`} role="dialog" aria-modal="true" aria-labelledby="adjusterTitle">
        {/* Header */}
        <div className="admin-cover-adjuster-header">
          <div className="admin-cover-adjuster-title-group">
            <div className="admin-cover-adjuster-badge-icon">{isPhone ? '📱' : '📐'}</div>
            <div>
              <h2 id="adjusterTitle">{title || (isPhone ? `Atur Sampul HP — ${template?.name || 'Template'}` : `Atur Frame Sampul — ${template?.name || 'Template'}`)}</h2>
              <p>{subtitle || (isPhone ? 'Geser dan atur zoom foto agar pas dengan frame layar HP di beranda (rasio 1:2 vertikal).' : 'Geser dan atur zoom foto agar pas dengan frame kartu template di homepage (rasio 4:3).')}</p>
            </div>
          </div>
          <button
            type="button"
            className="admin-cover-adjuster-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="admin-cover-adjuster-body">
          {/* Stage Area */}
          <div className="admin-cover-stage-wrap">
            <span className="admin-cover-stage-hint">
              {hint || (isPhone ? '📱 Frame Layar Mockup HP (Rasio 1:2)' : '🖼️ Frame Sampul Homepage (Rasio 4:3)')}
            </span>

            <div
              ref={stageRef}
              className={`admin-cover-stage-container ${isPhone ? 'is-phone-stage' : ''}`}
              style={isPhone ? { aspectRatio: '1 / 2', maxWidth: '240px', borderRadius: '28px' } : {}}
              onPointerDown={handlePointerDown}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <canvas
                ref={canvasRef}
                className="admin-cover-canvas"
                width={CANVAS_W}
                height={CANVAS_H}
              />
              <div className="admin-cover-grid-overlay" />
              <div className="admin-cover-drag-guide">
                ✋ Klik &amp; geser untuk memindahkan · Scroll mouse untuk zoom
              </div>
            </div>
          </div>

          {loadError && (
            <div className="admin-alert error" style={{ margin: '0' }}>
              ⚠️ Gagal memuat gambar. Silakan klik tombol <b>Pilih Foto Lain</b> di bawah.
            </div>
          )}

          {/* Controls Panel */}
          <div className="admin-cover-controls-panel">
            {/* Zoom Control */}
            <div className="admin-cover-control-row">
              <div className="admin-cover-control-header">
                <span>🔍 Perbesaran (Zoom)</span>
                <span className="admin-cover-val-badge">{zoom}%</span>
              </div>
              <div className="admin-cover-slider-bar">
                <button
                  type="button"
                  className="admin-cover-btn-step"
                  onClick={() => stepZoom(-10)}
                  disabled={zoom <= 100 || saving}
                  title="Perkecil zoom"
                >
                  –
                </button>
                <input
                  type="range"
                  className="admin-cover-slider"
                  min="100"
                  max="350"
                  step="1"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  disabled={saving || !imageLoaded}
                />
                <button
                  type="button"
                  className="admin-cover-btn-step"
                  onClick={() => stepZoom(10)}
                  disabled={zoom >= 350 || saving}
                  title="Perbesar zoom"
                >
                  +
                </button>
              </div>
              <div className="admin-cover-sub-buttons">
                <button type="button" className="admin-cover-sub-btn" onClick={() => setZoom(100)} disabled={saving}>100%</button>
                <button type="button" className="admin-cover-sub-btn" onClick={() => setZoom(130)} disabled={saving}>130%</button>
                <button type="button" className="admin-cover-sub-btn" onClick={() => setZoom(160)} disabled={saving}>160%</button>
                <button type="button" className="admin-cover-sub-btn" onClick={() => setZoom(200)} disabled={saving}>200%</button>
              </div>
            </div>

            {/* Horizontal Position Control */}
            <div className="admin-cover-control-row">
              <div className="admin-cover-control-header">
                <span>↔ Geser Horizontal (Kiri - Kanan)</span>
                <span className="admin-cover-val-badge">{panX > 0 ? `+${panX}px` : `${panX}px`}</span>
              </div>
              <div className="admin-cover-slider-bar">
                <button
                  type="button"
                  className="admin-cover-btn-step"
                  onClick={() => setPanX((prev) => prev - 25)}
                  disabled={saving || !imageLoaded}
                  title="Geser ke kiri"
                >
                  ◀
                </button>
                <input
                  type="range"
                  className="admin-cover-slider"
                  min="-450"
                  max="450"
                  step="1"
                  value={panX}
                  onChange={(e) => setPanX(Number(e.target.value))}
                  disabled={saving || !imageLoaded}
                />
                <button
                  type="button"
                  className="admin-cover-btn-step"
                  onClick={() => setPanX((prev) => prev + 25)}
                  disabled={saving || !imageLoaded}
                  title="Geser ke kanan"
                >
                  ▶
                </button>
              </div>
              <div className="admin-cover-sub-buttons">
                <button type="button" className="admin-cover-sub-btn" onClick={() => setPanX((prev) => prev - 50)} disabled={saving}>⬅ Kiri</button>
                <button type="button" className="admin-cover-sub-btn" onClick={() => setPanX(0)} disabled={saving}>Pusat (0)</button>
                <button type="button" className="admin-cover-sub-btn" onClick={() => setPanX((prev) => prev + 50)} disabled={saving}>Kanan ➡</button>
              </div>
            </div>

            {/* Vertical Position Control */}
            <div className="admin-cover-control-row">
              <div className="admin-cover-control-header">
                <span>↕ Geser Vertikal (Atas - Bawah)</span>
                <span className="admin-cover-val-badge">{panY > 0 ? `+${panY}px` : `${panY}px`}</span>
              </div>
              <div className="admin-cover-slider-bar">
                <button
                  type="button"
                  className="admin-cover-btn-step"
                  onClick={() => setPanY((prev) => prev - 25)}
                  disabled={saving || !imageLoaded}
                  title="Geser ke atas"
                >
                  ▲
                </button>
                <input
                  type="range"
                  className="admin-cover-slider"
                  min="-350"
                  max="350"
                  step="1"
                  value={panY}
                  onChange={(e) => setPanY(Number(e.target.value))}
                  disabled={saving || !imageLoaded}
                />
                <button
                  type="button"
                  className="admin-cover-btn-step"
                  onClick={() => setPanY((prev) => prev + 25)}
                  disabled={saving || !imageLoaded}
                  title="Geser ke bawah"
                >
                  ▼
                </button>
              </div>
              <div className="admin-cover-sub-buttons">
                <button type="button" className="admin-cover-sub-btn" onClick={() => setPanY((prev) => prev - 50)} disabled={saving}>⬆ Atas</button>
                <button type="button" className="admin-cover-sub-btn" onClick={() => setPanY(0)} disabled={saving}>Pusat (0)</button>
                <button type="button" className="admin-cover-sub-btn" onClick={() => setPanY((prev) => prev + 50)} disabled={saving}>Bawah ⬇</button>
              </div>
            </div>

            {/* Quick Tools */}
            <div className="admin-cover-tools-bar">
              <button
                type="button"
                className="admin-cover-tool-btn"
                onClick={handleReset}
                disabled={saving || !imageLoaded}
              >
                ↺ Pusatkan / Reset
              </button>
              <label className="admin-cover-tool-btn admin-cover-tool-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={saving}
                />
                📁 Pilih Foto Lain
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="admin-cover-adjuster-footer">
          <button
            type="button"
            className="admin-cover-btn-cancel"
            onClick={onClose}
            disabled={saving}
          >
            Batal
          </button>
          <button
            type="button"
            className="admin-cover-btn-save"
            onClick={handleApply}
            disabled={saving || !imageLoaded}
          >
            {saving ? (
              <>⏳ Menyimpan &amp; Menerapkan...</>
            ) : (
              <>✓ Simpan &amp; Terapkan Sampul</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
