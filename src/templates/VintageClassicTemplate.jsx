import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mediaUrl } from '../lib/api.js';
import { buildVintageCssVars, extractVintageColorsFromPayload } from '../lib/vintageThemeColors.js';
import { parseVintageStory } from '../lib/vintageStory.js';
import TemplateFooter from '../components/TemplateFooter.jsx';
import VintageFlipbookGallery from './vintage-classic/VintageFlipbookGallery.jsx';
import {
  VcArchCrown,
  VcBaroqueDivider,
  VcCornerFiligree,
  VcEnvelopeSealIcon,
  VcIcon,
  VcMapCompass,
  VcMapDestination,
  VcMapTrailCurve,
  VcMapWaypointStar,
  VcRibbonBanner,
  VcRingsEmblem,
} from './vintage-classic/VintageOrnaments.jsx';

const ORNAMENT_DIMENSIONS = Object.freeze({
  'orn-baroque-corner.webp': [380, 380],
  'orn-cover-oval-wreath.webp': [560, 736],
  'orn-hero-floral-corner.webp': [440, 435],
  'orn-couple-rings-floral.webp': [580, 184],
  'orn-dancing-couple.webp': [540, 704],
  'orn-ceremony-arch.webp': [640, 799],
  'orn-urn-envelope.webp': [580, 399],
  'orn-rsvp-vignette.webp': [592, 110],
  'orn-wedding-car.webp': [640, 362],
});

const TintedOrnament = React.memo(function TintedOrnament({ src, className = '', style, eager = false }) {
  const filename = String(src || '').split('?')[0].split('/').pop();
  const dims = ORNAMENT_DIMENSIONS[filename];
  const mergedStyle = useMemo(
    () => ({
      '--vc-orn-src': `url("${src}")`,
      ...(dims ? { aspectRatio: `${dims[0]} / ${dims[1]}` } : null),
      ...style,
    }),
    [src, dims, style],
  );

  return (
    <span
      aria-hidden="true"
      className={`vc-orn-tint${className ? ` ${className}` : ''}`}
      style={mergedStyle}
    >
      {!dims && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="vc-orn-sizer"
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'low'}
          decoding="async"
        />
      )}
    </span>
  );
});

const ASSET_BASE = '/assets/images/templates/vintage-classic/';
const MONTHS_UPPER = [
  'JANUARI',
  'FEBRUARI',
  'MARET',
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DESEMBER',
];
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const DEFAULT_GALLERY_FALLBACK = [
  { file_path: `${ASSET_BASE}demo-gallery-1.webp`, caption: 'Pelukan Senja' },
  { file_path: `${ASSET_BASE}demo-gallery-3.webp`, caption: 'Tawa Di Taman' },
  { file_path: `${ASSET_BASE}demo-gallery-2.webp`, caption: 'Rangkaian Bunga' },
  { file_path: `${ASSET_BASE}demo-cover.webp`, caption: 'Langkah Bersama' },
  { file_path: `${ASSET_BASE}demo-bride.webp`, caption: 'Elegi Pagi' },
];

const photoSrc = (rawPath, fallback) => (rawPath ? mediaUrl(rawPath) : fallback);

function detectMotionTier() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'full';
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'lite';
  const memory = Number(navigator.deviceMemory || 0);
  const cores = Number(navigator.hardwareConcurrency || 0);
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || '')) return 'lite';
  if ((memory && memory <= 3) || (cores && cores <= 4)) return 'lite';
  return 'full';
}

function getDateParts(value) {
  const raw = String(value || '').slice(0, 10);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T12:00:00`) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return { day: '13', monthUpper: 'DESEMBER', year: '2026', weekday: 'Minggu' };
  }
  return {
    day: String(parsed.getDate()).padStart(2, '0'),
    monthUpper: MONTHS_UPPER[parsed.getMonth()],
    year: String(parsed.getFullYear()),
    weekday: DAYS_ID[parsed.getDay()],
  };
}

function formatEditorialDate(value, withDay = false) {
  const p = getDateParts(value);
  return `${withDay ? `${p.weekday}, ` : ''}${Number(p.day)} ${p.monthUpper} ${p.year}`;
}

function formatTimeRange(start, end) {
  const s = String(start || '').slice(0, 5).replace(':', '.');
  if (!s) return '08.00 - Selesai';
  const e = String(end || '').slice(0, 5).replace(':', '.');
  return e ? `${s} - ${e} WIB` : `${s} - Selesai`;
}

function buildCalendarUrl(live, eventDate, eventTime) {
  const cleanDate = String(eventDate || '').slice(0, 10).replaceAll('-', '') || '20261213';
  const cleanTime = String(eventTime || '10:00').slice(0, 5).replace(':', '') || '1000';
  const title = `Pernikahan ${live.bride_nickname || 'Nadia'} & ${live.groom_nickname || 'Rayhan'}`;
  const location = [live.venue_name, live.venue_address].filter(Boolean).join(', ');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${cleanDate}T${cleanTime}00/${cleanDate}T${cleanTime}00&location=${encodeURIComponent(location)}`;
}

const VcCountdownLedger = React.memo(function VcCountdownLedger({ eventDate, eventTime, active }) {
  const ledgerRef = useRef(null);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');
  const [docHidden, setDocHidden] = useState(() => (typeof document !== 'undefined' ? document.hidden : false));
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const node = ledgerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInView(entry.isIntersecting);
      },
      { rootMargin: '220px 0px' },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      const hidden = document.hidden;
      setDocHidden(hidden);
      if (!hidden) setClock(Date.now());
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!active || !inView || docHidden) return undefined;
    setClock(Date.now());
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active, inView, docHidden]);

  const countdown = useMemo(() => {
    const target = new Date(`${String(eventDate).slice(0, 10)}T${eventTime}:00+07:00`).getTime();
    const diff = Number.isNaN(target) ? 0 : Math.max(0, target - clock);
    return [
      { value: Math.floor(diff / 86400000), label: 'Hari' },
      { value: Math.floor((diff / 3600000) % 24), label: 'Jam' },
      { value: Math.floor((diff / 60000) % 60), label: 'Menit' },
      { value: Math.floor((diff / 1000) % 60), label: 'Detik' },
    ];
  }, [eventDate, eventTime, clock]);

  return (
    <div
      ref={ledgerRef}
      className="vc-countdown-ledger vc-reveal vc-anim-countdown"
      aria-label="Hitung mundur acara"
    >
      {countdown.map((item) => (
        <div className="vc-countdown-cell" key={item.label}>
          <strong>{String(item.value).padStart(2, '0')}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
});

const VcRsvpForm = React.memo(function VcRsvpForm({ slug, initialGuestName, preview }) {
  const [guestNameInput, setGuestNameInput] = useState(
    initialGuestName && initialGuestName !== 'Bapak/Ibu/Saudara/i' ? initialGuestName : '',
  );
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [submittingRsvp, setSubmittingRsvp] = useState(false);
  const [rsvpFeedback, setRsvpFeedback] = useState({ text: '', isError: false });

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (preview) {
      setRsvpFeedback({ text: 'Mode preview — form tidak mengirim data.', isError: false });
      return;
    }
    const cleanGuest = guestNameInput.trim();
    const cleanMsg = messageInput.trim();
    if (!cleanGuest || !attendanceStatus || !cleanMsg) {
      setRsvpFeedback({ text: 'Lengkapi nama, konfirmasi kehadiran, dan ucapan Anda.', isError: true });
      return;
    }
    setSubmittingRsvp(true);
    setRsvpFeedback({ text: '', isError: false });
    try {
      const response = await fetch('/api/greetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          slug,
          guest_name: cleanGuest,
          attendance_status: attendanceStatus,
          message: cleanMsg,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'Ucapan gagal dikirim.');
      }
      setMessageInput('');
      setRsvpFeedback({
        text: result.message || 'Terima kasih, ucapan & konfirmasi Anda telah tersimpan.',
        isError: false,
      });
      if (result.greeting) {
        window.dispatchEvent(new CustomEvent('daymoment:greeting-sent', { detail: { greeting: result.greeting } }));
      }
    } catch (error) {
      setRsvpFeedback({ text: error.message || 'Terjadi kesalahan saat mengirim ucapan.', isError: true });
    } finally {
      setSubmittingRsvp(false);
    }
  };

  return (
    <>
      {preview && <p className="preview-form-badge">Mode preview — form tidak mengirim data</p>}
      <form className="vc-rsvp-form" onSubmit={handleRsvpSubmit}>
        <label className="vc-underlined-field">
          <span className="vc-field-label">Nama Tamu</span>
          <input
            name="guest_name"
            maxLength={120}
            required
            value={guestNameInput}
            onChange={(e) => setGuestNameInput(e.target.value)}
            placeholder="Tuliskan nama Anda"
          />
        </label>

        <div>
          <span className="vc-field-label">Status Kehadiran</span>
          <div className="vc-rsvp-pills">
            {[
              ['attending', 'Hadir'],
              ['not_attending', 'Berhalangan'],
              ['unsure', 'Masih Ragu'],
            ].map(([value, label]) => {
              const active = attendanceStatus === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`vc-rsvp-choice${active ? ' is-selected' : ''}`}
                  onClick={() => setAttendanceStatus(value)}
                  aria-pressed={active}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="vc-wish-message" className="vc-field-label">
            Ucapan &amp; Doa
          </label>
          <textarea
            id="vc-wish-message"
            name="message"
            className="vc-textarea"
            maxLength={500}
            required
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Tuliskan ucapan hangat dan doa terbaik untuk kedua mempelai..."
          />
          <div className="vc-char-counter">{messageInput.length}/500</div>
        </div>

        <button
          type="submit"
          className="vc-btn-pill"
          style={{ alignSelf: 'center', marginTop: '4px' }}
          disabled={submittingRsvp}
        >
          {submittingRsvp ? 'Mengirim...' : 'Kirim Ucapan'}
        </button>

        {rsvpFeedback.text && (
          <p className={`vc-form-feedback${rsvpFeedback.isError ? ' is-error' : ''}`} role="status">
            {rsvpFeedback.text}
          </p>
        )}
      </form>
    </>
  );
});

export default function VintageClassicTemplate({
  invitation: initialInvitation = {},
  media = [],
  giftAccounts = [],
  greetings = [],
  guestName = 'Bapak/Ibu/Saudara/i',
  guestSalutation = 'Kepada Yth.',
  preview = false,
}) {
  const [live, setLive] = useState(initialInvitation);
  useEffect(() => {
    setLive(initialInvitation);
  }, [initialInvitation]);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'invitation:update' && event.data?.data) {
        setLive((prev) => ({ ...prev, ...event.data.data }));
      }
    };
    window.addEventListener('message', onMessage);
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'invitation:ready' }, window.location.origin);
    }
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const [motionTier] = useState(detectMotionTier);
  const [coverEntered, setCoverEntered] = useState(() =>
    typeof document !== 'undefined' && document.body.classList.contains('is-cover-only'),
  );
  const [coverSettled, setCoverSettled] = useState(() =>
    typeof document !== 'undefined' && document.body.classList.contains('is-cover-only'),
  );
  const [openingPhase, setOpeningPhase] = useState('closed'); // 'closed' | 'opening' | 'open'
  const [heroEntered, setHeroEntered] = useState(false);
  const [heroSettled, setHeroSettled] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const audioRef = useRef(null);
  const rootRef = useRef(null);
  const coverImgRef = useRef(null);
  const heroWarmImgRef = useRef(null);
  const openTimerRef = useRef(null);
  const heroTimerRef = useRef(null);
  const touchStartX = useRef(0);

  const isOpened = openingPhase !== 'closed';
  const isSettledOpen = openingPhase === 'open';

  useEffect(() => {
    if (document.body.classList.contains('is-cover-only')) {
      setCoverEntered(true);
      setCoverSettled(true);
      return undefined;
    }
    let active = true;
    let triggered = false;
    let raf1 = 0;
    let raf2 = 0;
    let capTimer = 0;

    const triggerEntrance = () => {
      if (!active || triggered) return;
      triggered = true;
      if (capTimer) {
        window.clearTimeout(capTimer);
        capTimer = 0;
      }
      raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(() => {
          if (active) setCoverEntered(true);
        });
      });
    };

    capTimer = window.setTimeout(triggerEntrance, 180);
    const img = coverImgRef.current;
    if (!img || (img.complete && img.naturalWidth > 0 && typeof img.decode !== 'function')) {
      triggerEntrance();
    } else if (typeof img.decode === 'function') {
      img.decode().catch(() => {}).finally(triggerEntrance);
    } else {
      triggerEntrance();
    }

    return () => {
      active = false;
      if (capTimer) window.clearTimeout(capTimer);
      if (raf1) window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, []);

  useEffect(() => {
    if (!coverEntered || document.body.classList.contains('is-cover-only')) return undefined;
    const settleTimer = window.setTimeout(() => setCoverSettled(true), 1600);
    const warmTimer = window.setTimeout(() => {
      if (typeof Image === 'undefined') return;
      const floral = new Image();
      floral.decoding = 'async';
      floral.src = `${ASSET_BASE}orn-hero-floral-corner.webp`;
      floral.decode?.().catch(() => {});
      heroWarmImgRef.current = floral;
    }, 420);
    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(warmTimer);
    };
  }, [coverEntered]);

  useEffect(() => {
    if (!heroEntered) return undefined;
    const timer = window.setTimeout(() => setHeroSettled(true), 1900);
    return () => window.clearTimeout(timer);
  }, [heroEntered]);

  useEffect(() => {
    const isCoverOnly = document.body.classList.contains('is-cover-only');
    if (isCoverOnly || isOpened) {
      document.body.style.overflow = '';
      return undefined;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpened]);

  useEffect(() => {
    return () => {
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
      if (heroTimerRef.current) window.clearTimeout(heroTimerRef.current);
      document.body.style.overflow = '';
    };
  }, []);

  const bride = live.bride_nickname || 'Nadia';
  const groom = live.groom_nickname || 'Rayhan';
  const brideFull = live.bride_full_name || 'Nadia Kusuma, S.Ars.';
  const groomFull = live.groom_full_name || 'Rayhan Mahendra, S.T.';
  const eventDate = live.reception_date || live.akad_date || '2026-12-13';
  const akadDate = live.akad_date || eventDate;
  const eventTime = String(live.reception_start_time || live.akad_start_time || '10:00').slice(0, 5);
  const dateParts = useMemo(() => getDateParts(eventDate), [eventDate]);
  const limit = Math.max(1, Number(live.gallery_limit) || 5);
  const customMedia = useMemo(
    () => media.filter((item) => !item?.file_path?.includes('custom-couple')).slice(0, limit),
    [media, limit],
  );
  const galleryPhotos = useMemo(
    () =>
      customMedia.length
        ? customMedia.map((item, idx) => ({
            src: mediaUrl(item.file_path),
            title: `Folio · ${String(idx + 1).padStart(2, '0')}`,
            caption: `${bride} & ${groom} — Momen Bahagia`,
          }))
        : DEFAULT_GALLERY_FALLBACK.slice(0, limit).map((item, idx) => ({
            src: item.file_path,
            title: `Folio · ${String(idx + 1).padStart(2, '0')}`,
            caption: item.caption,
          })),
    [customMedia, limit, bride, groom],
  );

  const coverPhoto = photoSrc(live.cover_image, `${ASSET_BASE}demo-cover.webp`);
  const bridePhoto = photoSrc(
    live.bride_photo,
    customMedia[0]?.file_path ? mediaUrl(customMedia[0].file_path) : `${ASSET_BASE}demo-bride.webp`,
  );
  const groomPhoto = photoSrc(
    live.groom_photo,
    customMedia[1]?.file_path ? mediaUrl(customMedia[1].file_path) : `${ASSET_BASE}demo-groom.webp`,
  );

  const storyStops = useMemo(
    () => parseVintageStory(live.love_story, { fallbackToDefaults: true, enforceWordCap: true }),
    [live.love_story],
  );
  const calendarUrl = useMemo(() => buildCalendarUrl(live, eventDate, eventTime), [live, eventDate, eventTime]);
  const cleanInstagram = String(live.instagram || '').replace(/^@/, '').trim();

  // Directional downward-only scroll reveal engine (never animates when scrolling up)
  useEffect(() => {
    if (!heroEntered) return undefined;
    const rootEl = rootRef.current;
    if (!rootEl) return undefined;
    const targets = Array.from(rootEl.querySelectorAll('.vc-reveal'));

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('is-instant', 'is-visible', 'is-settled'));
      return undefined;
    }

    const unsettled = new Set(targets);
    const timers = new Set();
    const transitionCleanups = new Set();
    const settleMs = motionTier === 'lite' ? 980 : 1650;
    let lastY = window.scrollY || window.pageYOffset || 0;
    let lastScanY = lastY;
    let goingUp = false;
    let scrollRaf = 0;
    let tornDown = false;
    let observer = null;
    let primerObserver = null;

    const markSettled = (el) => {
      el.classList.remove('is-primed');
      el.classList.add('is-settled');
    };

    const maybeTeardown = () => {
      if (tornDown || unsettled.size > 0) return;
      tornDown = true;
      window.removeEventListener('scroll', onScroll);
      if (scrollRaf) {
        window.cancelAnimationFrame(scrollRaf);
        scrollRaf = 0;
      }
      observer?.disconnect();
      primerObserver?.disconnect();
    };

    const markInstant = (el) => {
      if (!unsettled.has(el)) return;
      unsettled.delete(el);
      el.classList.remove('is-primed');
      el.classList.add('is-instant', 'is-visible', 'is-settled');
      observer?.unobserve(el);
      primerObserver?.unobserve(el);
      maybeTeardown();
    };

    const markAnimate = (el) => {
      if (!unsettled.has(el)) return;
      unsettled.delete(el);
      el.classList.add('is-visible');
      observer?.unobserve(el);
      primerObserver?.unobserve(el);

      let settledDone = false;
      let tid = 0;
      const onTransitionEnd = (e) => {
        if (e.target === el) finalize();
      };
      const cleanupListener = () => el.removeEventListener('transitionend', onTransitionEnd);
      const finalize = () => {
        if (settledDone) return;
        settledDone = true;
        if (tid) {
          window.clearTimeout(tid);
          timers.delete(tid);
        }
        cleanupListener();
        transitionCleanups.delete(cleanupListener);
        markSettled(el);
      };
      el.addEventListener('transitionend', onTransitionEnd);
      transitionCleanups.add(cleanupListener);
      tid = window.setTimeout(finalize, settleMs);
      timers.add(tid);
      maybeTeardown();
    };

    primerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target;
          if (!unsettled.has(el)) return;
          if (entry.isIntersecting) {
            el.classList.add('is-primed');
          }
        });
      },
      { threshold: 0, rootMargin: '220px 0px 320px 0px' },
    );

    observer = new IntersectionObserver(
      (entries) => {
        const vh = window.innerHeight || document.documentElement.clientHeight || 800;
        entries.forEach((entry) => {
          const el = entry.target;
          if (!unsettled.has(el)) return;
          if (entry.isIntersecting) {
            if (goingUp || entry.boundingClientRect.bottom <= 0) {
              markInstant(el);
            } else {
              markAnimate(el);
            }
            return;
          }
          if (entry.boundingClientRect.bottom <= Math.min(40, vh * 0.1)) {
            markInstant(el);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -10% 0px' },
    );

    const syncDirectionAndSkipped = () => {
      scrollRaf = 0;
      if (unsettled.size === 0) {
        maybeTeardown();
        return;
      }
      const currY = window.scrollY || window.pageYOffset || 0;
      if (currY < lastY - 1) goingUp = true;
      else if (currY > lastY + 1) goingUp = false;
      lastY = currY;

      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      if (!goingUp && Math.abs(currY - lastScanY) <= vh * 0.35) return;
      lastScanY = currY;

      const toInstant = [];
      unsettled.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom <= Math.min(80, vh * 0.15) || (goingUp && rect.top <= vh * 0.96)) {
          toInstant.push(el);
        }
      });
      for (let i = 0; i < toInstant.length; i++) {
        markInstant(toInstant[i]);
      }
    };

    const onScroll = () => {
      if (unsettled.size === 0) {
        maybeTeardown();
        return;
      }
      const currY = window.scrollY || window.pageYOffset || 0;
      if (currY < lastY - 1) goingUp = true;
      else if (currY > lastY + 1) goingUp = false;
      if (!scrollRaf) {
        scrollRaf = window.requestAnimationFrame(syncDirectionAndSkipped);
      }
    };

    // Batch initial layout reads before observer/class writes
    const initialInstant = [];
    const initialObserve = [];
    for (let i = 0; i < targets.length; i++) {
      const el = targets[i];
      const rect = el.getBoundingClientRect();
      if (rect.bottom <= 0) initialInstant.push(el);
      else initialObserve.push(el);
    }
    for (let i = 0; i < initialInstant.length; i++) {
      markInstant(initialInstant[i]);
    }
    if (unsettled.size > 0) {
      for (let i = 0; i < initialObserve.length; i++) {
        const el = initialObserve[i];
        primerObserver.observe(el);
        observer.observe(el);
      }
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
      observer?.disconnect();
      primerObserver?.disconnect();
      timers.forEach((tid) => window.clearTimeout(tid));
      timers.clear();
      transitionCleanups.forEach((fn) => fn());
      transitionCleanups.clear();
    };
  }, [heroEntered, motionTier, storyStops.length, galleryPhotos.length, live.has_gift, live.has_wishes]);

  useEffect(() => {
    if (!lightbox) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLightbox(null);
      else if (e.key === 'ArrowRight' && lightbox.items.length > 1) {
        setLightbox((prev) => (prev ? { ...prev, index: (prev.index + 1) % prev.items.length } : null));
      } else if (e.key === 'ArrowLeft' && lightbox.items.length > 1) {
        setLightbox((prev) => (prev ? { ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length } : null));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightbox]);

  const handleOpenInvitation = () => {
    if (openingPhase !== 'closed') return;
    setOpeningPhase('opening');
    if (live.has_music && live.music_file && audioRef.current) {
      audioRef.current
        .play()
        .then(() => setMusicPlaying(true))
        .catch(() => {});
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setHeroEntered(true);
    } else {
      heroTimerRef.current = window.setTimeout(() => {
        setHeroEntered(true);
      }, 240);
    }
    openTimerRef.current = window.setTimeout(() => {
      setOpeningPhase('open');
    }, 1100);
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setMusicPlaying(true))
        .catch(() => {});
    }
  };

  const openSinglePhoto = (src, title, caption) => {
    setLightbox({ items: [{ src, title, caption }], index: 0 });
  };

  const openGalleryLightbox = useCallback(
    (index) => {
      if (!galleryPhotos.length) return;
      setLightbox({
        items: galleryPhotos,
        index: Math.max(0, Math.min(index, galleryPhotos.length - 1)),
      });
    },
    [galleryPhotos],
  );

  const handleCopyAccount = (key, accNumber) => {
    const clean = String(accNumber || '').replace(/\s+/g, '');
    if (!clean) return;
    const markCopied = () => {
      setCopiedId(key);
      window.setTimeout(() => setCopiedId((prev) => (prev === key ? null : prev)), 2000);
    };
    const fallbackExecCopy = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = clean;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        markCopied();
      } catch {
        window.prompt('Salin nomor rekening:', clean);
      }
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(clean).then(markCopied).catch(fallbackExecCopy);
    } else {
      fallbackExecCopy();
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/${live.slug || ''}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Undangan Pernikahan ${bride} & ${groom}`,
          text: `Dengan penuh suka cita, kami mengundang Anda pada hari bahagia ${bride} & ${groom}.`,
          url,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') window.prompt('Salin tautan undangan:', url);
    }
  };

  const themeVars = useMemo(
    () => buildVintageCssVars(extractVintageColorsFromPayload(live)),
    [live],
  );
  const activeAccountList = giftAccounts || [];
  const rootClasses = [
    'invitation-page vintage-classic',
    openingPhase === 'opening' ? 'is-opening' : '',
    isSettledOpen ? 'invitation-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={rootRef}
      className={rootClasses}
      style={themeVars}
      data-template-root
      data-vc-motion={motionTier}
      data-slug={live.slug || ''}
    >
      {/* OPENING COVER (Heirloom Stationery Card + Cameo Rose Wreath + Wax-Seal CTA) */}
      <section
        className={`opening-cover vc-opening-cover${coverEntered ? ' is-cover-entered' : ''}${coverSettled ? ' is-cover-settled' : ''}`}
        aria-label="Cover undangan"
      >
        <div className="vc-cover-stationery">
          <TintedOrnament src={`${ASSET_BASE}orn-baroque-corner.webp`} className="vc-cover-corner vc-cover-corner-tl" eager />
          <TintedOrnament src={`${ASSET_BASE}orn-baroque-corner.webp`} className="vc-cover-corner vc-cover-corner-tr" eager />
          <TintedOrnament src={`${ASSET_BASE}orn-baroque-corner.webp`} className="vc-cover-corner vc-cover-corner-bl" eager />
          <TintedOrnament src={`${ASSET_BASE}orn-baroque-corner.webp`} className="vc-cover-corner vc-cover-corner-br" eager />

          <div className="vc-cover-stage" data-cover-content>
            <div className="vc-cover-eyebrow vc-enter" style={{ '--vc-d': '120ms', '--vc-dur': '780ms' }}>
              <span className="vc-cover-wing" aria-hidden="true" />
              <span className="vc-cover-star" aria-hidden="true">✦</span>
              <span className="vc-cover-eyebrow-text">The Wedding Invitation</span>
              <span className="vc-cover-star" aria-hidden="true">✦</span>
              <span className="vc-cover-wing" aria-hidden="true" />
            </div>

            <div className="vc-cover-cameo-stage vc-enter vc-enter-arch" style={{ '--vc-d': '180ms', '--vc-dur': '980ms' }}>
              <div
                className="vc-cover-cameo"
                onClick={() => openSinglePhoto(coverPhoto, `${bride} & ${groom}`, formatEditorialDate(eventDate))}
                role="button"
                tabIndex={0}
                aria-label="Lihat foto cover ukuran penuh"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openSinglePhoto(coverPhoto, `${bride} & ${groom}`, formatEditorialDate(eventDate));
                  }
                }}
              >
                <div className="vc-cover-cameo-inner">
                  <img
                    ref={coverImgRef}
                    src={coverPhoto}
                    alt={`Foto ${bride} dan ${groom}`}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </div>
              </div>
              <TintedOrnament src={`${ASSET_BASE}orn-cover-oval-wreath.webp`} className="vc-cover-wreath-overlay" eager />
            </div>

            <h1 className="vc-cover-names vc-enter" style={{ '--vc-d': '320ms', '--vc-dur': '920ms' }}>
              <span data-live="bride_nickname">{bride}</span>
              <i>&amp;</i>
              <span data-live="groom_nickname">{groom}</span>
            </h1>

            <div className="vc-cover-date-row vc-enter" style={{ '--vc-d': '420ms', '--vc-dur': '840ms' }}>
              <span className="vc-cover-date-rule" aria-hidden="true" />
              <time className="vc-cover-date" data-date-field="reception_date">
                {formatEditorialDate(eventDate)}
              </time>
              <span className="vc-cover-date-rule" aria-hidden="true" />
            </div>

            <div className="vc-cover-guest vc-enter" style={{ '--vc-d': '500ms', '--vc-dur': '840ms' }}>
              <small>{guestSalutation || 'Kepada Yth.'}</small>
              <strong>{guestName || 'Bapak/Ibu/Saudara/i'}</strong>
            </div>

            <div className="vc-enter" style={{ '--vc-d': '580ms', '--vc-dur': '840ms' }}>
              <button
                type="button"
                className="open-invitation vc-open-btn"
                data-open-invitation
                onClick={handleOpenInvitation}
              >
                <VcEnvelopeSealIcon className="vc-open-btn-icon" />
                <span>Buka Undangan</span>
                <span className="vc-open-btn-arrow" aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* EDITORIAL INVITATION BODY */}
      <main
        className={`invitation-content vc-content${heroEntered ? ' is-hero-entered' : ''}${heroSettled ? ' is-hero-settled' : ''}`}
        aria-hidden={!isOpened}
      >
        <TintedOrnament src={`${ASSET_BASE}orn-baroque-corner.webp`} className="vc-body-corner vc-body-corner-tl" />
        <TintedOrnament src={`${ASSET_BASE}orn-baroque-corner.webp`} className="vc-body-corner vc-body-corner-tr" />
        <div className="vc-column">
          {/* 1. HERO EDITORIAL COVER PHOTO + CORNER FLORALS + QUOTE SANCTUARY */}
          <section className="vc-hero-entrance">
            <header className="vc-sanctuary-head">
              <div className="vc-hero-kicker-row vc-hero-anim" style={{ '--vc-hd': '0ms' }}>
                <span className="vc-hair-wing" aria-hidden="true" />
                <span className="vc-sanctuary-kicker">The Wedding Of</span>
                <span className="vc-hair-wing" aria-hidden="true" />
              </div>
              <h2 className="vc-sanctuary-names vc-hero-anim" style={{ '--vc-hd': '110ms' }}>
                <span data-live="bride_nickname">{bride}</span> <i>&amp;</i>{' '}
                <span data-live="groom_nickname">{groom}</span>
              </h2>
              <time
                className="vc-sanctuary-date vc-hero-anim"
                style={{ '--vc-hd': '210ms' }}
                data-date-field="reception_date"
              >
                {formatEditorialDate(eventDate, true)}
              </time>
            </header>

            <div className="vc-hero-editorial-stage vc-hero-anim" style={{ '--vc-hd': '240ms' }}>
              <div className="vc-hero-editorial-frame">
                <TintedOrnament src={`${ASSET_BASE}orn-hero-floral-corner.webp`} className="vc-hero-floral vc-hero-floral-tl" />
                <TintedOrnament src={`${ASSET_BASE}orn-hero-floral-corner.webp`} className="vc-hero-floral vc-hero-floral-br" />
                <div
                  className="vc-hero-photo-hit"
                  role="button"
                  tabIndex={0}
                  aria-label="Lihat foto cover ukuran penuh"
                  onClick={() => openSinglePhoto(coverPhoto, `${bride} & ${groom}`, formatEditorialDate(eventDate, true))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openSinglePhoto(coverPhoto, `${bride} & ${groom}`, formatEditorialDate(eventDate, true));
                    }
                  }}
                >
                  <div className="vc-hero-editorial-clip">
                    <img src={coverPhoto} alt={`Foto ${bride} dan ${groom}`} loading="eager" decoding="async" />
                  </div>
                  <div className="vc-hero-editorial-foot">
                    <span className="vc-hero-editorial-cap">
                      {bride} &amp; {groom} · {dateParts.year}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="vc-quote-sanctuary">
              <span className="vc-quote-mark vc-reveal" style={{ '--vc-delay': '0ms' }} aria-hidden="true">
                &ldquo;
              </span>
              <blockquote className="vc-reveal" style={{ '--vc-delay': '110ms' }}>
                &ldquo;Di antara tanda-tanda (kebesaran)-Nya ialah bahwa Dia menciptakan pasangan-pasangan untukmu dari
                jenismu sendiri agar kamu merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa cinta dan kasih
                sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda bagi kaum yang
                berpikir.&rdquo;
              </blockquote>
              <div className="vc-reveal vc-anim-unfold" style={{ '--vc-delay': '190ms' }}>
                <VcBaroqueDivider variant="diamond" />
              </div>
              <cite className="vc-reveal" style={{ '--vc-delay': '250ms' }}>
                QS. Ar-Rum · 21
              </cite>
            </div>
          </section>

          {/* 2. BRIDE & GROOM */}
          <section className="vc-couple">
            <div className="vc-section-header vc-reveal vc-anim-unfold">
              <VcBaroqueDivider variant="scroll" />
              <span className="vc-section-eyebrow">Dua Jiwa Satu Ikatan</span>
              <h2 className="vc-section-title">Mempelai</h2>
            </div>

            <article className="vc-person-block vc-reveal vc-anim-portrait vc-anim-left" style={{ '--vc-delay': '100ms' }}>
              <div className="vc-person-arch-stage">
                <VcArchCrown className="vc-arch-top-crown" />
                <div
                  className="vc-arch-portrait"
                  onClick={() =>
                    openSinglePhoto(
                      bridePhoto,
                      brideFull,
                      `Putri dari ${live.bride_father || 'Bpk. Hendra Kusuma'} & ${live.bride_mother || 'Ibu Ratna Sari'}`,
                    )
                  }
                  role="button"
                  tabIndex={0}
                  aria-label={`Lihat foto ${brideFull} ukuran penuh`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openSinglePhoto(
                        bridePhoto,
                        brideFull,
                        `Putri dari ${live.bride_father || 'Bpk. Hendra Kusuma'} & ${live.bride_mother || 'Ibu Ratna Sari'}`,
                      );
                    }
                  }}
                >
                  <div className="vc-arch-photo-clip">
                    <img src={bridePhoto} alt={brideFull} loading="lazy" decoding="async" />
                  </div>
                </div>
              </div>
              <span className="vc-person-role">Mempelai Wanita</span>
              <h3 className="vc-person-name" data-live="bride_full_name">
                {brideFull}
              </h3>
              <p className="vc-person-parents">
                Putri dari <span data-live="bride_father">{live.bride_father || 'Bpk. Hendra Kusuma'}</span>
                <br />
                &amp; <span data-live="bride_mother">{live.bride_mother || 'Ibu Ratna Sari'}</span>
              </p>
            </article>

            <div className="vc-couple-vignette vc-reveal vc-anim-vignette" style={{ '--vc-delay': '120ms' }}>
              <span className="vc-vignette-rule" aria-hidden="true" />
              <TintedOrnament src={`${ASSET_BASE}orn-couple-rings-floral.webp`} className="vc-orn-couple-rings" />
              <span className="vc-vignette-rule" aria-hidden="true" />
            </div>

            <article className="vc-person-block vc-reveal vc-anim-portrait vc-anim-right" style={{ '--vc-delay': '120ms' }}>
              <div className="vc-person-arch-stage">
                <VcArchCrown className="vc-arch-top-crown" />
                <div
                  className="vc-arch-portrait"
                  onClick={() =>
                    openSinglePhoto(
                      groomPhoto,
                      groomFull,
                      `Putra dari ${live.groom_father || 'Bpk. Surya Mahendra'} & ${live.groom_mother || 'Ibu Lestari Putri'}`,
                    )
                  }
                  role="button"
                  tabIndex={0}
                  aria-label={`Lihat foto ${groomFull} ukuran penuh`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openSinglePhoto(
                        groomPhoto,
                        groomFull,
                        `Putra dari ${live.groom_father || 'Bpk. Surya Mahendra'} & ${live.groom_mother || 'Ibu Lestari Putri'}`,
                      );
                    }
                  }}
                >
                  <div className="vc-arch-photo-clip">
                    <img src={groomPhoto} alt={groomFull} loading="lazy" decoding="async" />
                  </div>
                </div>
              </div>
              <span className="vc-person-role">Mempelai Pria</span>
              <h3 className="vc-person-name" data-live="groom_full_name">
                {groomFull}
              </h3>
              <p className="vc-person-parents">
                Putra dari <span data-live="groom_father">{live.groom_father || 'Bpk. Surya Mahendra'}</span>
                <br />
                &amp; <span data-live="groom_mother">{live.groom_mother || 'Ibu Lestari Putri'}</span>
              </p>
            </article>
          </section>

          {/* 3. KISAH CINTA (No Per-Paragraph Boxes + Single Cover Keepsake Photo) */}
          <section className="vc-story">
            <div className="vc-section-header">
              <TintedOrnament
                src={`${ASSET_BASE}orn-dancing-couple.webp`}
                className="vc-orn-plate vc-orn-dancers vc-reveal vc-anim-bloom"
              />
              <span className="vc-section-eyebrow vc-reveal" style={{ '--vc-delay': '100ms' }}>
                Catatan Perjalanan
              </span>
              <h2 className="vc-section-title vc-reveal" style={{ '--vc-delay': '160ms' }}>
                Kisah Cinta Kami
              </h2>
              <div className="vc-reveal vc-anim-unfold" style={{ '--vc-delay': '200ms' }}>
                <VcBaroqueDivider variant="scroll" />
              </div>
            </div>

            <div className="vc-story-cover-wrap vc-reveal vc-anim-portrait" style={{ '--vc-delay': '120ms' }}>
              <div
                className="vc-story-cover-frame"
                onClick={() => openSinglePhoto(coverPhoto, `${bride} & ${groom}`, 'Sampul Kisah Kami')}
                role="button"
                tabIndex={0}
                aria-label="Lihat foto sampul kisah cinta ukuran penuh"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openSinglePhoto(coverPhoto, `${bride} & ${groom}`, 'Sampul Kisah Kami');
                  }
                }}
              >
                <VcCornerFiligree position="tl" />
                <VcCornerFiligree position="tr" />
                <VcCornerFiligree position="bl" />
                <VcCornerFiligree position="br" />
                <div className="vc-story-cover-clip">
                  <img src={coverPhoto} alt={`Sampul kisah ${bride} & ${groom}`} loading="lazy" decoding="async" />
                </div>
                <span className="vc-story-cover-caption">
                  {bride} &amp; {groom} · Kisah Kami
                </span>
              </div>
            </div>

            <div className="vc-story-map">
              <div className="vc-map-origin vc-reveal vc-anim-unfold">
                <VcMapCompass className="vc-map-compass-svg" />
                <span>Peta Perjalanan</span>
              </div>

              {storyStops.map((stop, idx) => {
                const alignClass = idx % 2 === 0 ? 'is-left' : 'is-right';
                const sideAnim = idx % 2 === 0 ? 'vc-anim-map-left' : 'vc-anim-map-right';
                return (
                  <React.Fragment key={`story-stop-${idx}`}>
                    <article
                      className={`vc-map-stop ${alignClass} vc-reveal ${sideAnim}`}
                      style={{ '--vc-delay': `${Math.min(idx * 80, 220)}ms` }}
                    >
                      <div className="vc-map-stop-head">
                        <span className="vc-map-pin" aria-hidden="true">
                          <VcMapWaypointStar className="vc-map-pin-icon" />
                        </span>
                        <div className="vc-map-meta">
                          {stop.year && <span className="vc-map-year">{stop.year}</span>}
                          {stop.title && <h3 className="vc-map-title">{stop.title}</h3>}
                        </div>
                      </div>
                      {stop.description && <p className="vc-map-desc">{stop.description}</p>}
                    </article>

                    {idx < storyStops.length - 1 && (
                      <div className="vc-map-trail vc-reveal vc-anim-trail" aria-hidden="true">
                        <VcMapTrailCurve direction={idx % 2 === 0 ? 'ltr' : 'rtl'} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              <div className="vc-map-finish vc-reveal vc-anim-bloom">
                <VcMapDestination className="vc-map-dest-svg" />
                <span>Menuju Pelaminan</span>
              </div>
            </div>
          </section>

          {/* 4. GALERI KENANGAN (Portrait Flip-Book Album) */}
          <section className="vc-gallery-ledger">
            <div className="vc-section-header vc-reveal vc-anim-unfold">
              <VcBaroqueDivider variant="scroll" />
              <span className="vc-section-eyebrow">Album Kenangan · {dateParts.year}</span>
              <h2 className="vc-section-title">Galeri Kenangan</h2>
            </div>

            <div className="vc-book-reveal-wrap vc-reveal vc-anim-card" style={{ '--vc-delay': '120ms' }}>
              <VintageFlipbookGallery
                photos={galleryPhotos}
                coupleLabel={`${bride} & ${groom}`}
                onOpenLightbox={openGalleryLightbox}
              />
            </div>
          </section>

          {/* 5. WAKTU & LOKASI */}
          <section className="vc-details">
            <div className="vc-section-header">
              <TintedOrnament
                src={`${ASSET_BASE}orn-ceremony-arch.webp`}
                className="vc-orn-plate vc-orn-ceremony vc-reveal vc-anim-bloom"
              />
              <div className="vc-reveal vc-anim-unfold" style={{ '--vc-delay': '100ms' }}>
                <VcRibbonBanner text="Save The Date" />
              </div>
              <h2 className="vc-section-title vc-reveal" style={{ '--vc-delay': '160ms', marginTop: '6px' }}>
                Waktu &amp; Lokasi
              </h2>
            </div>

            <VcCountdownLedger eventDate={eventDate} eventTime={eventTime} active={isOpened} />

            <div className="vc-events-stack">
              <article className="vc-event-sheet vc-reveal vc-anim-card">
                <VcCornerFiligree position="tl" />
                <VcCornerFiligree position="tr" />
                <VcCornerFiligree position="bl" />
                <VcCornerFiligree position="br" />
                <VcRingsEmblem className="vc-event-emblem" />
                <h3 className="vc-event-title">Akad Nikah</h3>
                <div className="vc-event-date" data-date-field="akad_date">
                  {formatEditorialDate(akadDate, true)}
                </div>
                <div className="vc-event-time" data-time-range="akad">
                  {formatTimeRange(live.akad_start_time, live.akad_end_time)}
                </div>
                <p className="vc-event-venue" data-live="venue_name">
                  {live.venue_name || 'Rumah Kaca Heritage'}
                </p>
                <address className="vc-event-address" data-live="venue_address">
                  {live.venue_address || 'Jl. Diponegoro No. 28, Citarum, Kota Bandung'}
                </address>
                {live.nearest_landmark && <p className="vc-event-landmark">Patokan: {live.nearest_landmark}</p>}
                <a
                  className="vc-btn-pill"
                  data-live-href="maps_url"
                  href={live.maps_url || 'https://maps.google.com/'}
                  target="_blank"
                  rel="noreferrer"
                >
                  <VcIcon name="map" />
                  <span>Buka Google Maps</span>
                </a>
              </article>

              <article className="vc-event-sheet vc-reveal vc-anim-card" style={{ '--vc-delay': '130ms' }}>
                <VcCornerFiligree position="tl" />
                <VcCornerFiligree position="tr" />
                <VcCornerFiligree position="bl" />
                <VcCornerFiligree position="br" />
                <VcBaroqueDivider variant="fleuron" className="vc-event-fleuron" />
                <h3 className="vc-event-title">Resepsi</h3>
                <div className="vc-event-date" data-date-field="reception_date">
                  {formatEditorialDate(eventDate, true)}
                </div>
                <div className="vc-event-time" data-time-range="reception">
                  {formatTimeRange(live.reception_start_time, live.reception_end_time)}
                </div>
                <p className="vc-event-venue" data-live="venue_name">
                  {live.venue_name || 'Rumah Kaca Heritage'}
                </p>
                <address className="vc-event-address" data-live="venue_address">
                  {live.venue_address || 'Jl. Diponegoro No. 28, Citarum, Kota Bandung'}
                </address>
                <a
                  className="vc-btn-pill"
                  data-live-href="maps_url"
                  href={live.maps_url || 'https://maps.google.com/'}
                  target="_blank"
                  rel="noreferrer"
                >
                  <VcIcon name="map" />
                  <span>Buka Google Maps</span>
                </a>
              </article>
            </div>

            <a className="vc-calendar-action vc-reveal" href={calendarUrl} target="_blank" rel="noreferrer">
              <VcIcon name="calendar" />
              <span>Simpan ke Google Calendar</span>
            </a>
          </section>

          {/* 6. VIGNETTE KEABADIAN & INSTAGRAM */}
          <section className="vc-vignette-section vc-reveal vc-anim-bloom">
            <TintedOrnament src={`${ASSET_BASE}orn-urn-envelope.webp`} className="vc-orn-plate vc-orn-envelope" />
            <VcBaroqueDivider variant="fleuron" />
            <p className="vc-feature-quote">
              &ldquo;Dua cerita yang dipertemukan waktu untuk berjalan menuju satu tujuan.&rdquo;
            </p>
            {cleanInstagram && (
              <a
                className="vc-instagram-pill"
                data-instagram
                href={`https://instagram.com/${encodeURIComponent(cleanInstagram)}`}
                target="_blank"
                rel="noreferrer"
              >
                @{cleanInstagram}
              </a>
            )}
          </section>

          {/* 7. RSVP & BUKU TAMU */}
          {Boolean(live.has_wishes) && (
            <section className="vc-rsvp-wrapper" id="rsvp">
              <div className="vc-rsvp-sheet vc-reveal vc-anim-card">
                <VcCornerFiligree position="tl" />
                <VcCornerFiligree position="tr" />
                <VcCornerFiligree position="bl" />
                <VcCornerFiligree position="br" />
                <div className="vc-section-header" style={{ marginBottom: '22px' }}>
                  <TintedOrnament src={`${ASSET_BASE}orn-rsvp-vignette.webp`} className="vc-orn-plate vc-orn-vine" />
                  <span className="vc-section-eyebrow">Konfirmasi Kehadiran</span>
                  <h2 className="vc-section-title">RSVP &amp; Doa Restu</h2>
                </div>
                <VcRsvpForm slug={live.slug} initialGuestName={guestName} preview={preview} />
              </div>

              <div className="vc-guestbook-ledger vc-reveal vc-anim-card" style={{ '--vc-delay': '120ms' }}>
                <VcCornerFiligree position="tl" />
                <VcCornerFiligree position="tr" />
                <h3 className="vc-guestbook-title">Buku Tamu &amp; Doa</h3>
                <div className="vc-wishes-scroll">
                  {greetings.length ? (
                    greetings.map((item) => (
                      <article className="vc-wish-entry" key={item.id}>
                        <div className="vc-wish-head">
                          <strong>{item.guest_name}</strong>
                          <small>
                            {item.attendance_status === 'attending'
                              ? 'Hadir'
                              : item.attendance_status === 'not_attending'
                              ? 'Berhalangan'
                              : 'Masih Ragu'}
                          </small>
                        </div>
                        <p>{item.message}</p>
                      </article>
                    ))
                  ) : (
                    <div className="vc-wishes-empty">Belum ada ucapan. Jadilah yang pertama menuliskan doa hangat.</div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* 8. TANDA KASIH */}
          {Boolean(live.has_gift) && (
            <section className="vc-gift-sanctuary">
              <div className="vc-section-header vc-reveal vc-anim-unfold">
                <VcBaroqueDivider variant="scroll" />
                <span className="vc-section-eyebrow">Amplop Digital</span>
                <h2 className="vc-section-title">Tanda Kasih</h2>
              </div>
              <p className="vc-gift-intro vc-reveal" style={{ '--vc-delay': '100ms' }}>
                Doa restu Bapak/Ibu/Saudara/i merupakan hadiah terindah bagi kami. Namun apabila berkenan menyampaikan
                tanda kasih, dapat melalui rekening berikut:
              </p>

              <div className="vc-gift-cards">
                {activeAccountList.length ? (
                  activeAccountList.map((acc, idx) => {
                    const rowKey = acc.id || `gift-${idx}`;
                    const copied = copiedId === rowKey;
                    return (
                      <article
                        className="vc-gift-card vc-reveal vc-anim-card"
                        style={{ '--vc-delay': `${Math.min(idx * 110, 220)}ms` }}
                        key={rowKey}
                      >
                        <VcCornerFiligree position="tl" />
                        <VcCornerFiligree position="br" />
                        <div className="vc-gift-top">
                          <span className="vc-gift-provider">{acc.provider}</span>
                          {acc.label && <span className="vc-gift-label">{acc.label}</span>}
                        </div>
                        <span className="vc-gift-holder">a.n. {acc.account_name}</span>
                        <div className="vc-gift-number-bar">
                          <span>{acc.account_number}</span>
                          <button
                            type="button"
                            className="vc-copy-btn"
                            onClick={() => handleCopyAccount(rowKey, acc.account_number)}
                            aria-label={`Salin nomor rekening ${acc.provider}`}
                          >
                            <VcIcon name={copied ? 'check' : 'copy'} size={14} />
                            <span>{copied ? 'Tersalin' : 'Salin'}</span>
                          </button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <p className="vc-wishes-empty">Informasi rekening amplop digital belum ditambahkan.</p>
                )}
              </div>
            </section>
          )}

          {/* 9. PENUTUP */}
          <section className="vc-closing">
            <TintedOrnament src={`${ASSET_BASE}orn-wedding-car.webp`} className="vc-orn-plate vc-orn-car vc-reveal vc-anim-drive" />
            <span className="vc-section-eyebrow vc-reveal vc-anim-unfold" style={{ '--vc-delay': '140ms' }}>
              Terima Kasih
            </span>
            <p className="vc-closing-text vc-reveal" style={{ '--vc-delay': '220ms' }}>
              Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta
              memberikan doa restu bagi langkah awal kami.
            </p>
            <h2 className="vc-closing-signoff vc-reveal vc-anim-bloom" style={{ '--vc-delay': '300ms' }}>
              <span data-live="bride_nickname">{bride}</span> <i>&amp;</i>{' '}
              <span data-live="groom_nickname">{groom}</span>
            </h2>
            <div className="vc-reveal vc-anim-unfold" style={{ '--vc-delay': '360ms' }}>
              <VcBaroqueDivider variant="diamond" />
            </div>
            {!preview && live.slug && (
              <div className="vc-reveal vc-anim-unfold" style={{ '--vc-delay': '420ms' }}>
                <button type="button" className="vc-btn-pill vc-btn-pill-soft" onClick={handleShare}>
                  <VcIcon name="share" />
                  <span>{shareCopied ? 'Tautan Tersalin ✓' : 'Bagikan Undangan'}</span>
                </button>
              </div>
            )}
          </section>
        </div>

        <TemplateFooter className="vc-template-footer" />
      </main>

      {/* FLOATING MUSIC CONTROLLER */}
      {Boolean(live.has_music && live.music_file) && (
        <>
          <audio ref={audioRef} loop preload="metadata" src={mediaUrl(live.music_file)} />
          <button
            type="button"
            className={`vc-music-btn${musicPlaying ? ' is-playing' : ''}`}
            onClick={toggleMusic}
            aria-label={musicPlaying ? 'Hentikan musik' : 'Putar musik'}
            aria-pressed={musicPlaying}
            title={live.music_title || 'Musik undangan'}
          >
            <VcIcon name="music" />
          </button>
        </>
      )}

      {/* LIGHTBOX */}
      {lightbox && lightbox.items[lightbox.index] && (
        <div
          className="vc-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Tampilan foto penuh"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="vc-lightbox-close"
            onClick={() => setLightbox(null)}
            aria-label="Tutup tampilan foto"
          >
            <VcIcon name="close" size={18} />
          </button>

          {lightbox.items.length > 1 && (
            <>
              <button
                type="button"
                className="vc-lightbox-nav is-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((prev) =>
                    prev ? { ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length } : null,
                  );
                }}
                aria-label="Foto sebelumnya"
              >
                <VcIcon name="prev" size={18} />
              </button>
              <button
                type="button"
                className="vc-lightbox-nav is-next"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((prev) => (prev ? { ...prev, index: (prev.index + 1) % prev.items.length } : null));
                }}
                aria-label="Foto berikutnya"
              >
                <VcIcon name="next" size={18} />
              </button>
            </>
          )}

          <div
            className="vc-lightbox-stage"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (lightbox.items.length <= 1) return;
              const delta = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(delta) > 40) {
                setLightbox((prev) =>
                  prev
                    ? {
                        ...prev,
                        index:
                          delta < 0
                            ? (prev.index + 1) % prev.items.length
                            : (prev.index - 1 + prev.items.length) % prev.items.length,
                      }
                    : null,
                );
              }
            }}
          >
            <img
              src={lightbox.items[lightbox.index].src}
              alt={lightbox.items[lightbox.index].title || 'Foto undangan'}
            />
            <div className="vc-lightbox-meta">
              <strong>{lightbox.items[lightbox.index].title}</strong>
              {lightbox.items[lightbox.index].caption && <span>{lightbox.items[lightbox.index].caption}</span>}
              {lightbox.items.length > 1 && (
                <div>
                  {lightbox.index + 1} / {lightbox.items.length}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
