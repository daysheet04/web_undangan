import { useCallback, useEffect, useRef, useState } from 'react';

const VV_IMG = '/assets/images/templates/verdant-vow';

function getSectionBackgroundUrls(performanceTier, isCompact) {
  if (!isCompact) {
    return [
      `${VV_IMG}/section-wedding-indonesian-bg-v2.webp`,
      `${VV_IMG}/section-couple-indonesian-pendopo-bg-v2.webp`,
      `${VV_IMG}/events/events-pendopo-bg-desktop-v2.webp`,
      `${VV_IMG}/story/story-heirloom-bg-desktop-v1.webp`,
      `${VV_IMG}/gallery/gallery-heirloom-bg-desktop-v1.webp`,
      `${VV_IMG}/gift/gift-heirloom-bg-desktop-v1.webp`,
      `${VV_IMG}/rsvp/rsvp-guestbook-bg-desktop-v1.webp`,
      `${VV_IMG}/closing/closing-pendopo-night-bg-desktop-v1.webp`,
    ];
  }
  if (performanceTier === 'low') {
    return [
      `${VV_IMG}/section-wedding-indonesian-mobile-bg-lite-v1.webp`,
      `${VV_IMG}/section-couple-indonesian-pendopo-mobile-bg-lite-v1.webp`,
      `${VV_IMG}/events/events-pendopo-bg-mobile-lite-v1.webp`,
      `${VV_IMG}/story/story-heirloom-bg-mobile-lite-v1.webp`,
      `${VV_IMG}/gallery/gallery-heirloom-bg-mobile-lite-v1.webp`,
      `${VV_IMG}/gift/gift-heirloom-bg-mobile-lite-v1.webp`,
      `${VV_IMG}/rsvp/rsvp-guestbook-bg-mobile-lite-v1.webp`,
      `${VV_IMG}/closing/closing-pendopo-night-bg-mobile-lite-v2.webp`,
    ];
  }
  return [
    `${VV_IMG}/section-wedding-indonesian-mobile-bg-perf-v1.webp`,
    `${VV_IMG}/section-couple-indonesian-pendopo-mobile-bg-perf-v1.webp`,
    `${VV_IMG}/events/events-pendopo-bg-mobile-v2.webp`,
    `${VV_IMG}/story/story-heirloom-bg-mobile-perf-v1.webp`,
    `${VV_IMG}/gallery/gallery-heirloom-bg-mobile-perf-v1.webp`,
    `${VV_IMG}/gift/gift-heirloom-bg-mobile-perf-v1.webp`,
    `${VV_IMG}/rsvp/rsvp-guestbook-bg-mobile-perf-v1.webp`,
    `${VV_IMG}/closing/closing-pendopo-night-bg-mobile-perf-v2.webp`,
  ];
}

function getOrnamentUrls(performanceTier, isCompact) {
  const shared = ['/assets/images/brand/daymoment-logo.webp'];
  if (performanceTier === 'low') return shared;
  const layer = `${VV_IMG}/layers`;
  return [
    ...shared,
    isCompact
      ? `${layer}/section-wedding-mobile-bottom-ornament-indonesian-v2.webp`
      : `${layer}/section-wedding-edge-ornament-indonesian-v2.webp`,
    `${layer}/section-couple-janur-orbit-ornament-v2.webp`,
    `${layer}/events-janur-melati-corner-v2.webp`,
    `${VV_IMG}/story/story-side-ornament-indonesian-v1.webp`,
    `${VV_IMG}/story/story-photo-frame-indonesian-portrait-v1.webp`,
    `${VV_IMG}/gallery/gallery-corner-ornament-indonesian-v1.webp`,
    `${VV_IMG}/gift/gift-seserahan-ornament-indonesian-v1.webp`,
    `${VV_IMG}/rsvp/rsvp-guestbook-ornament-v1.webp`,
    `${VV_IMG}/closing/closing-pendopo-canopy-ornament-v1.webp`,
  ];
}

const RESIZE_WORKER_SRC = `
self.onmessage = async (e) => {
  const { id, url, maxW, maxH } = e.data;
  try {
    const resp = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    if (!resp.ok) throw new Error('fetch failed');
    const rawBlob = await resp.blob();
    const bmp = await createImageBitmap(rawBlob);
    const natW = bmp.width || 0;
    const natH = bmp.height || 0;
    if (natW * natH <= 1350000) {
      bmp.close();
      self.postMessage({ id, skip: true });
      return;
    }
    const scale = Math.min(maxW / natW, maxH / natH, 1);
    const dstW = Math.max(1, Math.round(natW * scale));
    const dstH = Math.max(1, Math.round(natH * scale));
    const resized = await createImageBitmap(bmp, {
      resizeWidth: dstW,
      resizeHeight: dstH,
      resizeQuality: 'high',
    });
    bmp.close();
    const canvas = new OffscreenCanvas(dstW, dstH);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d ctx');
    ctx.drawImage(resized, 0, 0);
    resized.close();
    const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.91 });
    self.postMessage({ id, blob: outBlob });
  } catch {
    self.postMessage({ id, error: true });
  }
};
`;

function canUseOffscreenWorker() {
  return (
    typeof Worker === 'function' &&
    typeof OffscreenCanvas === 'function' &&
    typeof createImageBitmap === 'function'
  );
}

function scheduleIdle(fn, timeout = 160) {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, Math.min(timeout, 80));
  return () => window.clearTimeout(id);
}

/**
 * Zero-jitter off-main-thread image pre-decoder & Retina normalizer.
 * 1) Pre-decodes active tier section backgrounds & ornaments via img.decode().
 * 2) Downscales oversized >1.35MP photos in a Web Worker using HTTP force-cache
 *    (zero duplicate downloads) and commits ONCE strictly before the user scrolls
 *    (window.scrollY < 80), preventing any mid-scroll <img src> swap or jitter.
 */
export default function useCrispMediaWarmup({
  photoUrls = [],
  performanceTier = 'balanced',
  isCompact = false,
  canWarm = false,
}) {
  const [normalizedMap, setNormalizedMap] = useState(() => new Map());
  const isScrollingRef = useRef(false);
  const bgCacheRef = useRef([]);
  const warmedSrcSetRef = useRef(new Set());
  const createdUrlsRef = useRef(new Map());
  const committedMapRef = useRef(new Map());

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let idleTimer = 0;
    const onScroll = () => {
      isScrollingRef.current = true;
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 220);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(idleTimer);
    };
  }, []);

  useEffect(() => () => {
    for (const blobUrl of createdUrlsRef.current.values()) {
      URL.revokeObjectURL(blobUrl);
    }
    createdUrlsRef.current.clear();
  }, []);

  const photoKey = photoUrls.filter(Boolean).join('|');

  useEffect(() => {
    if (!canWarm || typeof window === 'undefined') return undefined;

    let cancelled = false;
    let cancelScheduled = null;
    let stepTimer = 0;
    let worker = null;
    let workerUrl = null;

    const waitUntilScrollIdle = () => {
      if (!isScrollingRef.current || cancelled) return Promise.resolve();
      return new Promise((resolve) => {
        const check = () => {
          if (cancelled || !isScrollingRef.current) {
            resolve();
            return;
          }
          stepTimer = window.setTimeout(check, 90);
        };
        check();
      });
    };

    const decodeIntoCache = async (url, crossOriginAnonymous = false) => {
      if (!url || warmedSrcSetRef.current.has(url)) return;
      const img = new Image();
      if (crossOriginAnonymous && /^https?:/i.test(url)) {
        try {
          const parsed = new URL(url, window.location.href);
          if (parsed.origin !== window.location.origin) img.crossOrigin = 'anonymous';
        } catch {}
      }
      img.decoding = 'async';
      img.src = url;
      try {
        if (typeof img.decode === 'function') {
          await img.decode();
        } else {
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
          });
        }
      } catch {
        return;
      }
      if (cancelled) return;
      warmedSrcSetRef.current.add(url);
      bgCacheRef.current.push(img);
    };

    const resizeInWorker = (url) => {
      if (!worker) {
        const scriptBlob = new Blob([RESIZE_WORKER_SRC], { type: 'application/javascript' });
        workerUrl = URL.createObjectURL(scriptBlob);
        worker = new Worker(workerUrl);
      }
      const absUrl = new URL(url, window.location.href).href;
      const maxW = isCompact ? 760 : 1080;
      const maxH = isCompact ? 1020 : 1440;
      return new Promise((resolve) => {
        const reqId = `${Math.random()}`;
        const onMsg = (ev) => {
          if (ev.data?.id !== reqId) return;
          worker?.removeEventListener('message', onMsg);
          resolve(ev.data);
        };
        worker.addEventListener('message', onMsg);
        worker.postMessage({ id: reqId, url: absUrl, maxW, maxH });
      });
    };

    const runWarmup = async () => {
      const uniquePhotos = Array.from(new Set(photoUrls.filter(Boolean)));

      const runPhotoNormalization = async () => {
        if (canUseOffscreenWorker()) {
          await Promise.all(
            uniquePhotos.map(async (url) => {
              if (cancelled || createdUrlsRef.current.has(url)) return;
              const res = await resizeInWorker(url);
              if (cancelled) return;
              if (res?.blob) {
                const blobUrl = URL.createObjectURL(res.blob);
                await decodeIntoCache(blobUrl, false);
                if (cancelled) {
                  URL.revokeObjectURL(blobUrl);
                  return;
                }
                createdUrlsRef.current.set(url, blobUrl);
              } else {
                await decodeIntoCache(url, Boolean(res?.skip));
              }
            }),
          );
        } else {
          for (const url of uniquePhotos) {
            if (cancelled) return;
            await waitUntilScrollIdle();
            if (cancelled) return;
            await decodeIntoCache(url, false);
          }
        }

        const isUrlOffscreenInDom = (origUrl) => {
          const imgs = document.querySelectorAll('.vv-redesign img');
          const vh = window.innerHeight || 844;
          for (const node of imgs) {
            const curSrc = node.getAttribute('src') || node.currentSrc || '';
            if (curSrc !== origUrl) continue;
            const rect = node.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && rect.bottom >= -120 && rect.top <= vh + 120) {
              return false;
            }
          }
          return true;
        };

        await waitUntilScrollIdle();
        if (cancelled) return;

        let changed = false;
        const allowAllAtTop = window.scrollY < 80;
        for (const [origUrl, blobUrl] of createdUrlsRef.current.entries()) {
          if (committedMapRef.current.get(origUrl) === blobUrl) continue;
          if (allowAllAtTop || isUrlOffscreenInDom(origUrl)) {
            committedMapRef.current.set(origUrl, blobUrl);
            changed = true;
          }
        }
        if (changed && !cancelled) {
          setNormalizedMap(new Map(committedMapRef.current));
        }
      };

      const runAssetPredecode = async () => {
        const assetUrls = [
          ...getSectionBackgroundUrls(performanceTier, isCompact),
          ...getOrnamentUrls(performanceTier, isCompact),
        ];
        for (let idx = 0; idx < assetUrls.length; idx += 3) {
          if (cancelled) return;
          await waitUntilScrollIdle();
          if (cancelled) return;
          await Promise.allSettled(
            assetUrls.slice(idx, idx + 3).map((u) => decodeIntoCache(u, false)),
          );
        }
      };

      await Promise.all([runPhotoNormalization(), runAssetPredecode()]);
    };

    cancelScheduled = scheduleIdle(() => {
      if (!cancelled) runWarmup();
    }, 160);

    return () => {
      cancelled = true;
      if (cancelScheduled) cancelScheduled();
      window.clearTimeout(stepTimer);
      if (worker) {
        worker.terminate();
        worker = null;
      }
      if (workerUrl) {
        URL.revokeObjectURL(workerUrl);
        workerUrl = null;
      }
    };
  }, [canWarm, performanceTier, isCompact, photoKey]);

  const getDisplaySrc = useCallback(
    (originalUrl) => {
      if (!originalUrl) return originalUrl;
      return normalizedMap.get(originalUrl) || originalUrl;
    },
    [normalizedMap],
  );

  return { getDisplaySrc };
}
