(function() {
  'use strict';

  let retryCount = 0;
  function startInit() {
    if (initPhotoAdjuster()) return;
    if (retryCount < 60) {
      retryCount++;
      setTimeout(startInit, 60);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInit);
  } else {
    startInit();
  }

  function initPhotoAdjuster() {
    const dialog = document.getElementById('photoAdjusterDialog');
    if (!dialog) return false;

    const canvas = document.getElementById('adjusterCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const stage = document.getElementById('adjusterStage');
    const mask = document.getElementById('adjusterMask');
    const titleEl = document.getElementById('adjusterPhotoTitle');
    const zoomSlider = document.getElementById('adjusterZoomSlider');
    const zoomVal = document.getElementById('adjusterZoomVal');
    const xSlider = document.getElementById('adjusterXSlider');
    const xVal = document.getElementById('adjusterXVal');
    const ySlider = document.getElementById('adjusterYSlider');
    const yVal = document.getElementById('adjusterYVal');
    const saveBtn = document.getElementById('adjusterSaveBtn');

    const shapeArchBtn = document.getElementById('adjusterShapeArch');
    const shapeRectBtn = document.getElementById('adjusterShapeRect');

    // Internal state
    let currentImage = null;
    let currentKind = 'cover'; // 'cover' | 'bride' | 'groom' | 'gallery'
    let currentMediaId = null; // for existing gallery photos
    let originalFileName = 'photo.webp';
    let objectUrlToRevoke = null;

    let zoom = 1.0; // 1.0 = 100% cover
    let panX = 0; // pixels in preview canvas space
    let panY = 0; // pixels in preview canvas space

    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartPanX = 0;
    let dragStartPanY = 0;

    const CANVAS_W = 600;
    const CANVAS_H = 800; // 3:4 aspect ratio standard
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    // Redraw preview canvas
    function render() {
      if (!currentImage || !currentImage.complete || !currentImage.naturalWidth) return;

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Base scale: image covers the 600x800 box at zoom = 1.0
      const baseScale = Math.max(CANVAS_W / currentImage.naturalWidth, CANVAS_H / currentImage.naturalHeight);
      const scale = baseScale * zoom;

      const drawW = currentImage.naturalWidth * scale;
      const drawH = currentImage.naturalHeight * scale;

      const baseX = (CANVAS_W - drawW) / 2;
      const baseY = (CANVAS_H - drawH) / 2;

      const drawX = baseX + panX;
      const drawY = baseY + panY;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(currentImage, drawX, drawY, drawW, drawH);

      // Update UI readouts
      if (zoomVal) zoomVal.textContent = Math.round(zoom * 100) + '%';
      if (zoomSlider) zoomSlider.value = Math.round(zoom * 100);

      const maxPanX = Math.max(10, (drawW - CANVAS_W) / 2 + CANVAS_W * 0.4);
      const maxPanY = Math.max(10, (drawH - CANVAS_H) / 2 + CANVAS_H * 0.4);

      if (xSlider) {
        xSlider.value = Math.round((panX / maxPanX) * 100);
      }
      if (xVal) {
        xVal.textContent = (panX > 0 ? '+' : '') + Math.round(panX) + 'px';
      }

      if (ySlider) {
        ySlider.value = Math.round((panY / maxPanY) * 100);
      }
      if (yVal) {
        yVal.textContent = (panY > 0 ? '+' : '') + Math.round(panY) + 'px';
      }
    }

    function setZoom(newZoom) {
      zoom = Math.max(0.5, Math.min(3.5, newZoom));
      render();
    }

    function setPan(newX, newY) {
      if (!currentImage) return;
      const baseScale = Math.max(CANVAS_W / currentImage.naturalWidth, CANVAS_H / currentImage.naturalHeight);
      const scale = baseScale * zoom;
      const drawW = currentImage.naturalWidth * scale;
      const drawH = currentImage.naturalHeight * scale;
      const maxPanX = Math.max(10, (drawW - CANVAS_W) / 2 + CANVAS_W * 0.45);
      const maxPanY = Math.max(10, (drawH - CANVAS_H) / 2 + CANVAS_H * 0.45);

      panX = Math.max(-maxPanX, Math.min(maxPanX, newX));
      panY = Math.max(-maxPanY, Math.min(maxPanY, newY));
      render();
    }

    // Direct pointer drag on stage
    stage.addEventListener('pointerdown', (e) => {
      if (!currentImage) return;
      isDragging = true;
      stage.classList.add('is-dragging');
      stage.setPointerCapture(e.pointerId);
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStartPanX = panX;
      dragStartPanY = panY;
    });

    stage.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const rect = stage.getBoundingClientRect();
      const scaleFactor = CANVAS_W / rect.width;
      const deltaX = (e.clientX - dragStartX) * scaleFactor;
      const deltaY = (e.clientY - dragStartY) * scaleFactor;
      setPan(dragStartPanX + deltaX, dragStartPanY + deltaY);
    });

    function endDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      stage.classList.remove('is-dragging');
      try { stage.releasePointerCapture(e.pointerId); } catch {}
    }

    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    // Mouse wheel zoom
    stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      setZoom(zoom + delta);
    }, { passive: false });

    // Slider listeners
    if (zoomSlider) {
      zoomSlider.addEventListener('input', () => {
        setZoom(parseFloat(zoomSlider.value) / 100);
      });
    }

    const zoomInBtn = document.getElementById('adjusterZoomIn');
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => setZoom(zoom + 0.15));
    }

    const zoomOutBtn = document.getElementById('adjusterZoomOut');
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => setZoom(zoom - 0.15));
    }

    if (xSlider) {
      xSlider.addEventListener('input', () => {
        if (!currentImage) return;
        const baseScale = Math.max(CANVAS_W / currentImage.naturalWidth, CANVAS_H / currentImage.naturalHeight);
        const scale = baseScale * zoom;
        const drawW = currentImage.naturalWidth * scale;
        const maxPanX = Math.max(10, (drawW - CANVAS_W) / 2 + CANVAS_W * 0.45);
        setPan((parseFloat(xSlider.value) / 100) * maxPanX, panY);
      });
    }

    const leftBtn = document.getElementById('adjusterLeftBtn');
    if (leftBtn) {
      leftBtn.addEventListener('click', () => setPan(panX - 25, panY));
    }

    const rightBtn = document.getElementById('adjusterRightBtn');
    if (rightBtn) {
      rightBtn.addEventListener('click', () => setPan(panX + 25, panY));
    }

    if (ySlider) {
      ySlider.addEventListener('input', () => {
        if (!currentImage) return;
        const baseScale = Math.max(CANVAS_W / currentImage.naturalWidth, CANVAS_H / currentImage.naturalHeight);
        const scale = baseScale * zoom;
        const drawH = currentImage.naturalHeight * scale;
        const maxPanY = Math.max(10, (drawH - CANVAS_H) / 2 + CANVAS_H * 0.45);
        setPan(panX, (parseFloat(ySlider.value) / 100) * maxPanY);
      });
    }

    const upBtn = document.getElementById('adjusterUpBtn');
    if (upBtn) {
      upBtn.addEventListener('click', () => setPan(panX, panY - 25));
    }

    const downBtn = document.getElementById('adjusterDownBtn');
    if (downBtn) {
      downBtn.addEventListener('click', () => setPan(panX, panY + 25));
    }

    // Preset buttons
    const resetBtn = document.getElementById('adjusterResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        zoom = 1.0;
        panX = 0;
        panY = 0;
        render();
      });
    }

    const fitBtn = document.getElementById('adjusterFitBtn');
    if (fitBtn) {
      fitBtn.addEventListener('click', () => {
        if (!currentImage) return;
        const fitScale = Math.min(CANVAS_W / currentImage.naturalWidth, CANVAS_H / currentImage.naturalHeight);
        const baseScale = Math.max(CANVAS_W / currentImage.naturalWidth, CANVAS_H / currentImage.naturalHeight);
        zoom = fitScale / baseScale;
        panX = 0;
        panY = 0;
        render();
      });
    }

    const fillBtn = document.getElementById('adjusterFillBtn');
    if (fillBtn) {
      fillBtn.addEventListener('click', () => {
        zoom = 1.0;
        panX = 0;
        panY = 0;
        render();
      });
    }

    // Frame Shape Toggles
    if (shapeArchBtn && shapeRectBtn) {
      shapeArchBtn.addEventListener('click', () => {
        mask.classList.remove('is-rect');
        shapeArchBtn.classList.add('active');
        shapeRectBtn.classList.remove('active');
      });
      shapeRectBtn.addEventListener('click', () => {
        mask.classList.add('is-rect');
        shapeRectBtn.classList.add('active');
        shapeArchBtn.classList.remove('active');
      });
    }

    // Close Dialog
    dialog.querySelectorAll('[data-close-adjuster]').forEach(btn => {
      btn.addEventListener('click', () => closeAdjuster());
    });

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) closeAdjuster();
    });

    dialog.addEventListener('cancel', () => {
      closeAdjuster();
    });

    function closeAdjuster() {
      if (dialog.open) {
        try { dialog.close(); } catch {}
      }
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
        objectUrlToRevoke = null;
      }
      currentImage = null;
    }

    // Open Adjuster with Image Source
    function openAdjuster({ src, kind, title, mediaId, fileName, defaultShape = 'arch' }) {
      currentKind = kind;
      currentMediaId = mediaId || null;
      originalFileName = fileName || `${kind}-${Date.now()}.webp`;

      if (titleEl) titleEl.textContent = title || 'Atur Posisi & Zoom Foto';

      // Shape preset
      if (defaultShape === 'rect') {
        mask.classList.add('is-rect');
        shapeRectBtn?.classList.add('active');
        shapeArchBtn?.classList.remove('active');
      } else {
        mask.classList.remove('is-rect');
        shapeArchBtn?.classList.add('active');
        shapeRectBtn?.classList.remove('active');
      }

      zoom = 1.0;
      panX = 0;
      panY = 0;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        currentImage = img;
        render();
        if (!dialog.open && typeof dialog.showModal === 'function') {
          dialog.showModal();
        }
      };
      img.onerror = () => {
        window.showToast?.('Gagal memuat foto untuk diatur.', 'error');
      };
      img.src = src;
    }

    // Open from a local File object
    function openFromFile(file, kind, title, defaultShape = 'arch') {
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        window.showToast?.('Format foto harus JPG, PNG, atau WEBP.', 'error');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        window.showToast?.('Foto terlalu besar (maksimal 15 MB).', 'error');
        return;
      }

      const url = URL.createObjectURL(file);
      objectUrlToRevoke = url;
      openAdjuster({
        src: url,
        kind,
        title,
        fileName: file.name,
        defaultShape
      });
    }

    // Save & Upload Adjusted Photo
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        if (!currentImage) return;

        const originalBtnText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Menyimpan...';
        dialog.classList.add('is-saving');

        try {
          // 1. Render high-resolution export canvas (1200 x 1600 px)
          const exportCanvas = document.createElement('canvas');
          const EXPORT_W = 1200;
          const EXPORT_H = 1600;
          exportCanvas.width = EXPORT_W;
          exportCanvas.height = EXPORT_H;
          const exportCtx = exportCanvas.getContext('2d');

          const baseScale = Math.max(CANVAS_W / currentImage.naturalWidth, CANVAS_H / currentImage.naturalHeight);
          const scale = baseScale * zoom;
          const drawW = currentImage.naturalWidth * scale;
          const drawH = currentImage.naturalHeight * scale;
          const baseX = (CANVAS_W - drawW) / 2;
          const baseY = (CANVAS_H - drawH) / 2;
          const finalX = baseX + panX;
          const finalY = baseY + panY;

          const ratio = EXPORT_W / CANVAS_W;
          exportCtx.imageSmoothingEnabled = true;
          exportCtx.imageSmoothingQuality = 'high';
          exportCtx.drawImage(
            currentImage,
            finalX * ratio,
            finalY * ratio,
            drawW * ratio,
            drawH * ratio
          );

          // 2. Compress to high-quality WebP Blob
          const blob = await new Promise((resolve) => {
            exportCanvas.toBlob(resolve, 'image/webp', 0.88);
          });

          if (!blob) throw new Error('Gagal memproses gambar dari kanvas.');

          // 3. Upload to /api/invitation/upload
          const builderApp = document.getElementById('builderApp');
          const token = builderApp?.dataset?.token || '';
          const csrf = builderApp?.dataset?.csrf || 'worker-token';

          const formData = new FormData();
          formData.append('_csrf', csrf);
          formData.append('editor_token', token);
          formData.append('kind', currentKind);
          if (currentKind === 'gallery' && currentMediaId) {
            formData.append('media_id', currentMediaId);
          }
          formData.append('photo', blob, `photo-${Date.now()}.webp`);

          const res = await fetch('/api/invitation/upload', {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: formData
          });

          const result = await res.json();
          if (!res.ok || !result.ok) {
            throw new Error(result.message || 'Gagal menyimpan foto.');
          }

          // 4. Update UI in Builder
          const timestamp = Date.now();
          const cleanPath = result.path || result.media?.url || '';

          if (currentKind === 'cover') {
            const thumb = document.getElementById('coverThumb');
            if (thumb) thumb.src = `${cleanPath}?v=${timestamp}`;
            const btn = document.getElementById('btnAdjustCover');
            if (btn) btn.disabled = false;
          } else if (currentKind === 'bride') {
            const thumb = document.getElementById('brideThumb');
            if (thumb) thumb.src = `${cleanPath}?v=${timestamp}`;
            const btn = document.getElementById('btnAdjust_brideInput');
            if (btn) btn.disabled = false;
          } else if (currentKind === 'groom') {
            const thumb = document.getElementById('groomThumb');
            if (thumb) thumb.src = `${cleanPath}?v=${timestamp}`;
            const btn = document.getElementById('btnAdjust_groomInput');
            if (btn) btn.disabled = false;
          } else if (currentKind === 'gallery') {
            if (currentMediaId) {
              const fig = document.querySelector(`#galleryEditor figure[data-media-id="${currentMediaId}"] img`);
              if (fig) fig.src = `${cleanPath}?v=${timestamp}`;
            } else if (result.media) {
              // Append new figure
              const fig = document.createElement('figure');
              fig.dataset.mediaId = result.media.id;
              const imgEl = document.createElement('img');
              imgEl.src = `${cleanPath}?v=${timestamp}`;
              imgEl.alt = 'Foto galeri';
              imgEl.loading = 'lazy';
              imgEl.decoding = 'async';

              const adjBtn = document.createElement('button');
              adjBtn.type = 'button';
              adjBtn.className = 'btn-adjust-gallery';
              adjBtn.dataset.adjustPhoto = result.media.id;
              adjBtn.title = 'Atur posisi & zoom foto';
              adjBtn.textContent = '📐';

              const delBtn = document.createElement('button');
              delBtn.type = 'button';
              delBtn.dataset.deletePhoto = result.media.id;
              delBtn.title = 'Hapus foto';
              delBtn.textContent = '×';

              fig.append(imgEl, adjBtn, delBtn);
              const addBtn = document.getElementById('galleryAdd');
              document.getElementById('galleryEditor').insertBefore(fig, addBtn);

              // Update count
              const countEl = document.getElementById('galleryCount');
              const limit = parseInt(builderApp.dataset.galleryLimit || '5', 10);
              const total = document.querySelectorAll('#galleryEditor figure').length;
              if (countEl) countEl.textContent = `${total}/${limit}`;
              if (addBtn) addBtn.classList.toggle('disabled', total >= limit);
            }
          }

          // 5. Refresh live preview
          const livePreview = document.getElementById('livePreview');
          if (livePreview) {
            try {
              const url = new URL(livePreview.src, window.location.origin);
              url.searchParams.set('reload', String(Date.now()));
              livePreview.src = url.toString();
            } catch {}
          }
          const refreshBtn = document.querySelector('[data-refresh-preview]');
          if (refreshBtn) refreshBtn.click();

          window.showToast?.(result.message || 'Foto berhasil disesuaikan & disimpan.');
          closeAdjuster();
        } catch (err) {
          console.error(err);
          window.showToast?.(err.message || 'Terjadi kesalahan saat menyimpan foto.', 'error');
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = originalBtnText;
          dialog.classList.remove('is-saving');
        }
      });
    }

    // ========================================================
    // BINDING TO INPUTS & BUTTONS
    // ========================================================

    // 1. Cover Input (intercept change)
    const coverInput = document.getElementById('coverInput');
    if (coverInput) {
      coverInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.stopImmediatePropagation();
        e.preventDefault();
        openFromFile(file, 'cover', 'Atur Posisi Foto Cover', 'arch');
        e.target.value = '';
      }, true);
    }

    // Default editorial sample image when no custom photo uploaded yet
    const DEFAULT_SAMPLE_COVER = '/assets/images/templates/lunara-azure/lunara-hero-aurora-collage-v1.webp';
    const DEFAULT_SAMPLE_PORTRAIT = '/assets/images/templates/lunara-azure/lunara-couple-editorial-collage-v1.webp';

    // Change File button inside dialog
    const changeFileBtn = document.getElementById('adjusterChangeFileBtn');
    if (changeFileBtn) {
      changeFileBtn.addEventListener('click', () => {
        if (currentKind === 'cover') coverInput?.click();
        else if (currentKind === 'bride') brideInput?.click();
        else if (currentKind === 'groom') groomInput?.click();
        else if (currentKind === 'gallery') galleryInput?.click();
      });
    }

    // Cover Adjust Trigger Button
    const btnAdjustCover = document.getElementById('btnAdjustCover');
    if (btnAdjustCover) {
      btnAdjustCover.addEventListener('click', (e) => {
        e.preventDefault();
        const thumb = document.getElementById('coverThumb');
        const hasCustomPhoto = thumb?.src && !thumb.src.includes('placeholder') && !thumb.src.endsWith('.svg');
        const src = hasCustomPhoto ? thumb.src : DEFAULT_SAMPLE_COVER;
        openAdjuster({
          src,
          kind: 'cover',
          title: 'Atur Posisi Foto Cover',
          defaultShape: 'arch'
        });
      });
    }

    // 2. Bride Input (intercept change)
    const brideInput = document.getElementById('brideInput');
    if (brideInput) {
      brideInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.stopImmediatePropagation();
        e.preventDefault();
        openFromFile(file, 'bride', 'Atur Posisi Foto Mempelai Wanita', 'arch');
        e.target.value = '';
      }, true);
    }

    // Bride Adjust Trigger Button
    const btnAdjustBride = document.getElementById('btnAdjust_brideInput');
    if (btnAdjustBride) {
      btnAdjustBride.addEventListener('click', (e) => {
        e.preventDefault();
        const thumb = document.getElementById('brideThumb');
        const hasCustomPhoto = thumb?.src && !thumb.src.includes('placeholder') && !thumb.src.endsWith('.svg');
        const src = hasCustomPhoto ? thumb.src : DEFAULT_SAMPLE_PORTRAIT;
        openAdjuster({
          src,
          kind: 'bride',
          title: 'Atur Posisi Foto Mempelai Wanita',
          defaultShape: 'arch'
        });
      });
    }

    // 3. Groom Input (intercept change)
    const groomInput = document.getElementById('groomInput');
    if (groomInput) {
      groomInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.stopImmediatePropagation();
        e.preventDefault();
        openFromFile(file, 'groom', 'Atur Posisi Foto Mempelai Pria', 'arch');
        e.target.value = '';
      }, true);
    }

    // Groom Adjust Trigger Button
    const btnAdjustGroom = document.getElementById('btnAdjust_groomInput');
    if (btnAdjustGroom) {
      btnAdjustGroom.addEventListener('click', (e) => {
        e.preventDefault();
        const thumb = document.getElementById('groomThumb');
        const hasCustomPhoto = thumb?.src && !thumb.src.includes('placeholder') && !thumb.src.endsWith('.svg');
        const src = hasCustomPhoto ? thumb.src : DEFAULT_SAMPLE_PORTRAIT;
        openAdjuster({
          src,
          kind: 'groom',
          title: 'Atur Posisi Foto Mempelai Pria',
          defaultShape: 'arch'
        });
      });
    }

    // 4. Gallery Input (intercept change)
    const galleryInput = document.getElementById('galleryInput');
    if (galleryInput) {
      galleryInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.stopImmediatePropagation();
        e.preventDefault();
        openFromFile(file, 'gallery', 'Atur Posisi Foto Galeri', 'rect');
        e.target.value = '';
      }, true);
    }

    // 5. Existing Gallery Photos Adjust Buttons (delegated)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-adjust-photo]');
      if (!btn) return;
      e.preventDefault();
      const mediaId = btn.dataset.adjustPhoto;
      const figure = btn.closest('figure');
      const img = figure?.querySelector('img');
      if (!img || !img.src) return;

      openAdjuster({
        src: img.src,
        kind: 'gallery',
        mediaId: mediaId,
        title: 'Atur Posisi Foto Galeri',
        defaultShape: 'rect'
      });
    });

    window.openPhotoAdjuster = openAdjuster;
    return true;
  }
})();
