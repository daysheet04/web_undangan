import React, { useEffect, useRef, useState } from 'react';
import { VcArchCrown, VcCornerFiligree, VcIcon } from './VintageOrnaments.jsx';

const TURN_DURATION_MS = 720;

const VintageFlipbookGallery = React.memo(function VintageFlipbookGallery({
  photos = [],
  coupleLabel = '',
  onOpenLightbox,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flip, setFlip] = useState(null); // { fromIndex, toIndex, direction: 'next' | 'prev', phase: 'start' | 'animating' }
  const touchStartRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef({ raf1: 0, raf2: 0 });
  const timerRef = useRef(0);
  const pendingFlipToRef = useRef(null);
  const decodedRef = useRef(new Map());

  const count = photos.length;
  const safeIndex = count > 0 ? Math.min(currentIndex, count - 1) : 0;

  useEffect(() => {
    setCurrentIndex((prev) => (count > 0 ? Math.min(prev, count - 1) : 0));
    pendingFlipToRef.current = null;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = 0;
    }
    setFlip(null);
  }, [count]);

  useEffect(() => {
    if (!count || typeof Image === 'undefined') return undefined;
    const activeSrcSet = new Set(photos.map((p) => p?.src).filter(Boolean));
    for (const key of decodedRef.current.keys()) {
      if (!activeSrcSet.has(key)) decodedRef.current.delete(key);
    }
    const candidates = [
      photos[safeIndex],
      photos[(safeIndex + 1) % count],
      photos[(safeIndex - 1 + count) % count],
    ];
    candidates.forEach((item) => {
      const src = item?.src;
      if (!src) return;
      let img = decodedRef.current.get(src);
      if (!img) {
        img = new Image();
        img.decoding = 'async';
        img.src = src;
        decodedRef.current.set(src, img);
      }
      img.decode?.().catch(() => {});
    });
    return undefined;
  }, [photos, count, safeIndex]);

  useEffect(() => {
    const clearPending = () => {
      if (rafRef.current.raf1) window.cancelAnimationFrame(rafRef.current.raf1);
      if (rafRef.current.raf2) window.cancelAnimationFrame(rafRef.current.raf2);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      pendingFlipToRef.current = null;
    };
    return clearPending;
  }, []);

  if (!count) return null;

  const finishFlip = (targetIndex) => {
    if (pendingFlipToRef.current !== targetIndex) return;
    pendingFlipToRef.current = null;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = 0;
    }
    setCurrentIndex(targetIndex);
    setFlip(null);
  };

  const turnPage = (direction) => {
    if (count <= 1 || flip) return;
    const toIndex =
      direction === 'next'
        ? (safeIndex + 1) % count
        : (safeIndex - 1 + count) % count;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setCurrentIndex(toIndex);
      return;
    }

    pendingFlipToRef.current = toIndex;
    setFlip({ fromIndex: safeIndex, toIndex, direction, phase: 'start' });

    if (rafRef.current.raf1) window.cancelAnimationFrame(rafRef.current.raf1);
    if (rafRef.current.raf2) window.cancelAnimationFrame(rafRef.current.raf2);
    if (timerRef.current) window.clearTimeout(timerRef.current);

    rafRef.current.raf1 = window.requestAnimationFrame(() => {
      rafRef.current.raf2 = window.requestAnimationFrame(() => {
        setFlip((curr) => (curr ? { ...curr, phase: 'animating' } : null));
      });
    });

    timerRef.current = window.setTimeout(() => {
      finishFlip(toIndex);
    }, TURN_DURATION_MS + 80);
  };

  const handleTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e) => {
    if (count <= 1 || flip) return;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      turnPage(dx < 0 ? 'next' : 'prev');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      turnPage('next');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      turnPage('prev');
    }
  };

  const activePhoto = photos[safeIndex];
  const baseIndex = !flip
    ? safeIndex
    : flip.direction === 'next'
      ? flip.toIndex
      : flip.fromIndex;
  const basePhoto = photos[baseIndex];
  const leafIndex = flip
    ? flip.direction === 'next'
      ? flip.fromIndex
      : flip.toIndex
    : -1;
  const leafPhoto = leafIndex >= 0 ? photos[leafIndex] : null;
  const leafClass = flip
    ? `vc-book-page-leaf is-${flip.direction} is-${flip.phase}`
    : '';
  const displayIndex = flip ? flip.toIndex : safeIndex;

  return (
    <div
      className="vc-book-wrap"
      data-vc-flipbook
      onKeyDown={handleKeyDown}
    >
      <div className="vc-book-stage">
        {count > 1 && (
          <button
            type="button"
            className="vc-book-arrow is-prev"
            onClick={() => turnPage('prev')}
            disabled={Boolean(flip)}
            aria-label="Halaman foto sebelumnya"
            data-vc-book-prev
          >
            <VcIcon name="prev" size={18} />
          </button>
        )}

        <div
          className="vc-book-shell"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="vc-book-edges-right" aria-hidden="true" />
          <div className="vc-book-viewport">
            <div className="vc-book-spine" aria-hidden="true" />

            {/* Underlying page sheet */}
            <article className="vc-book-page vc-book-page-base">
              <div className="vc-book-sheet-head">
                <span>Folio · {String(baseIndex + 1).padStart(2, '0')}</span>
                <span>{coupleLabel}</span>
              </div>
              <button
                type="button"
                className="vc-book-photo-mat"
                onClick={() => onOpenLightbox?.(baseIndex)}
                aria-label={`Perbesar foto ${basePhoto?.caption || ''}`}
              >
                <VcCornerFiligree position="tl" />
                <VcCornerFiligree position="br" />
                <div className="vc-book-photo-clip">
                  <img
                    src={basePhoto?.src}
                    alt={basePhoto?.caption || `Potret ${coupleLabel}`}
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </button>
              <div className="vc-book-sheet-foot">
                <VcArchCrown className="vc-book-foot-crown" />
                <p>{basePhoto?.caption || activePhoto?.caption}</p>
              </div>
            </article>

            {/* Turning paper leaf overlay during 3D turn */}
            {flip && leafPhoto && (
              <div
                className={leafClass}
                aria-hidden="true"
                onTransitionEnd={(e) => {
                  if (e.target === e.currentTarget && e.propertyName === 'transform') {
                    finishFlip(flip.toIndex);
                  }
                }}
              >
                <div className="vc-book-leaf-face vc-book-leaf-front">
                  <div className="vc-book-sheet-head">
                    <span>Folio · {String(leafIndex + 1).padStart(2, '0')}</span>
                    <span>{coupleLabel}</span>
                  </div>
                  <div className="vc-book-photo-mat">
                    <div className="vc-book-photo-clip">
                      <img src={leafPhoto.src} alt="" loading="eager" decoding="async" />
                    </div>
                  </div>
                  <div className="vc-book-sheet-foot">
                    <VcArchCrown className="vc-book-foot-crown" />
                    <p>{leafPhoto.caption}</p>
                  </div>
                  <div className="vc-book-leaf-shade" />
                </div>

                <div className="vc-book-leaf-face vc-book-leaf-back">
                  <div className="vc-book-verso-emblem">
                    <VcArchCrown />
                    <span>{coupleLabel}</span>
                    <small>{String(displayIndex + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</small>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {count > 1 && (
          <button
            type="button"
            className="vc-book-arrow is-next"
            onClick={() => turnPage('next')}
            disabled={Boolean(flip)}
            aria-label="Halaman foto berikutnya"
            data-vc-book-next
          >
            <VcIcon name="next" size={18} />
          </button>
        )}
      </div>

      {count > 1 && (
        <div className="vc-book-controls">
          <button
            type="button"
            className="vc-book-mini-btn"
            onClick={() => turnPage('prev')}
            disabled={Boolean(flip)}
            aria-label="Halaman sebelumnya"
          >
            <VcIcon name="prev" size={15} />
          </button>

          <span className="vc-book-folio" data-vc-book-counter>
            Hal. {String(displayIndex + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>

          <button
            type="button"
            className="vc-book-mini-btn"
            onClick={() => turnPage('next')}
            disabled={Boolean(flip)}
            aria-label="Halaman berikutnya"
          >
            <VcIcon name="next" size={15} />
          </button>
        </div>
      )}

      <span className="vc-book-tip">
        {count > 1 ? 'Tekan panah kanan/kiri atau geser lembaran foto' : 'Ketuk foto untuk memperbesar'}
      </span>
    </div>
  );
});

export default VintageFlipbookGallery;
