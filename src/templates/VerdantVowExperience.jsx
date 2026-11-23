import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { mediaUrl } from '../lib/api.js';
import TemplateFooter from '../components/TemplateFooter.jsx';
import VerdantOpeningScene from './verdant-vow/VerdantOpeningScene.jsx';
import VerdantCinematicJourney from './verdant-vow/VerdantCinematicJourney.jsx';
import useCrispMediaWarmup from './verdant-vow/useCrispMediaWarmup.js';
import './verdant-vow/experience.css';

const BASE = '/assets/images/templates/verdant-vow';
const LAYER = BASE + '/layers';
const STORY = BASE + '/story';
const GALLERY = BASE + '/gallery';
const GIFT = BASE + '/gift';
const RSVP = BASE + '/rsvp';
const CLOSING = BASE + '/closing';

const VerdantCountdownGrid = React.memo(function VerdantCountdownGrid({ eventDate, active }) {
  const [clock, setClock] = useState(() => Date.now());
  const [inViewport, setInViewport] = useState(true);
  const gridRef = useRef(null);

  useEffect(() => {
    if (!active || typeof window === 'undefined') {
      setInViewport(false);
      return undefined;
    }
    const node = gridRef.current;
    if (!node || typeof IntersectionObserver !== 'function') {
      setInViewport(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInViewport(entry.isIntersecting);
      },
      { root: null, rootMargin: '120px 0px 120px 0px', threshold: 0 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [active]);

  useEffect(() => {
    if (!active || !inViewport) return undefined;
    setClock(Date.now());
    const timer = window.setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        setClock(Date.now());
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active, inViewport]);

  const countdown = useMemo(() => {
    const target = new Date(String(eventDate || '').slice(0, 10) + 'T00:00:00');
    const remaining = Math.max(0, (Number.isNaN(target.getTime()) ? clock : target.getTime()) - clock);
    return [
      Math.floor(remaining / 86400000),
      Math.floor(remaining / 3600000) % 24,
      Math.floor(remaining / 60000) % 60,
      Math.floor(remaining / 1000) % 60,
    ];
  }, [eventDate, clock]);

  return (
    <div className='vv-countdown-grid' ref={gridRef}>
      {countdown.map((value, index) => (
        <span key={index}>
          <b>{String(value).padStart(2, '0')}</b>
          <small>{['Hari', 'Jam', 'Menit', 'Detik'][index]}</small>
        </span>
      ))}
    </div>
  );
});
const VALID_PERF_TIERS = new Set(['low', 'balanced', 'high']);
const getForcedPerfTier = () => {
  if (typeof window === 'undefined') return null;
  const param = new URLSearchParams(window.location.search).get('perf');
  return param && VALID_PERF_TIERS.has(param) ? param : null;
};
const detectPerformanceTier = () => {
  const forced = getForcedPerfTier();
  if (forced) return forced;
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'balanced';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'low';
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return 'low';
  const isCompact = window.matchMedia('(max-width: 800px)').matches;
  const isCoarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const memory = Number(navigator.deviceMemory || 0);
  const cores = Number(navigator.hardwareConcurrency || 0);
  if (isCompact || isCoarse) {
    if ((memory && memory <= 4) || (cores && cores <= 4) || connection?.effectiveType === '3g') {
      return 'low';
    }
    return 'balanced';
  }
  const renderedPixels = window.innerWidth * window.innerHeight * Math.pow(window.devicePixelRatio || 1, 2);
  let pressure = 0;
  if (memory) {
    if (memory <= 3) pressure += 3;
    else if (memory <= 4) pressure += 2;
    else if (memory <= 6) pressure += 1;
  }
  if (cores) {
    if (cores <= 2) pressure += 3;
    else if (cores <= 4) pressure += 2;
    else if (cores <= 6) pressure += 1;
  }
  if (connection?.effectiveType === '3g') pressure += 1;
  if (renderedPixels > 3600000) pressure += 1;
  if (pressure >= 4) return 'low';
  if (pressure >= 2) return 'balanced';
  return 'high';
};
const date = (value, options = { weekday:'long',day:'numeric',month:'long',year:'numeric' }) => {
  const parsed = new Date(String(value || '').slice(0,10) + 'T12:00:00');
  return Number.isNaN(parsed.getTime()) ? 'Tanggal akan diumumkan' : new Intl.DateTimeFormat('id-ID',options).format(parsed);
};
const time = (start,end) => String(start || '').slice(0,5) ? String(start).slice(0,5) + ' WIB' + (end ? ' – ' + String(end).slice(0,5) + ' WIB' : ' – selesai') : 'Waktu akan diumumkan';

function EventCard({ title, day, start, end, venue, address, maps }) {
  if (!day) return null;
  return <article className='vv-event-card'><small>{title}</small><h3>{date(day)}</h3><time>{time(start,end)}</time><strong>{venue}</strong><p>{address}</p>{maps && <a href={maps} target='_blank' rel='noreferrer'>Lihat lokasi ↗</a>}</article>;
}
function VvIcon({ name }) { return <svg><use href={`#${name}`} /></svg>; }
function VvSymbols() {
  return (
    <svg className="vv-symbols" aria-hidden="true" style={{ display: 'none' }}>
      <defs>
        <symbol id="vv-close" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></symbol>
        <symbol id="vv-chevron-left" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></symbol>
        <symbol id="vv-chevron-right" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></symbol>
        <symbol id="vv-zoom" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></symbol>
      </defs>
    </svg>
  );
}
function Person({ role, name, nickname, photo, displayPhoto, father, mother, onPhotoClick }) {
  const src = displayPhoto || (photo ? mediaUrl(photo) : '');
  return (
    <article className='vv-person-card'>
      {photo && (
        <figure
          className='vv-person-photo-wrap vv-clickable-photo'
          onClick={onPhotoClick}
          role="button"
          tabIndex={0}
          aria-label={`Lihat foto ${name} ukuran penuh`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPhotoClick?.(); } }}
        >
          <img src={src} alt={name} width='900' height='1200' decoding='async'/>
          <span className="vv-photo-zoom-hint" aria-hidden="true"><VvIcon name="vv-zoom" /></span>
        </figure>
      )}
      <div>
        <small>{role}</small>
        <h3>{name}</h3>
        <p>{role === 'Mempelai pria' ? 'Putra' : 'Putri'} dari<br/>{father || 'Bapak'} &amp; {mother || 'Ibu'}</p>
        <span>{nickname}</span>
      </div>
    </article>
  );
}

export default function VerdantVowExperience({ invitation:i, media=[], giftAccounts=[], greetings=[], guestName='Bapak/Ibu/Saudara/i', preview=false }) {
  const groom = i.groom_nickname || 'Raka', bride = i.bride_nickname || 'Alya';
  const groomFull = i.groom_full_name || groom, brideFull = i.bride_full_name || bride;
  const eventDate = i.reception_date || i.akad_date;
  const customCoupleMedia = media?.find(m => m.file_path && m.file_path.includes('custom-couple'));
  const customCoupleVersion = customCoupleMedia?.id || customCoupleMedia?.created_at || (i.updated_at ? new Date(i.updated_at).getTime() : '');
  const rawCustomCoupleUrl = customCoupleMedia
    ? mediaUrl(customCoupleMedia.file_path)
    : (i.stage_photo ? mediaUrl(i.stage_photo) : (i.custom_couple_image ? mediaUrl(i.custom_couple_image) : null));
  const customCoupleUrl = useMemo(() => {
    if (!rawCustomCoupleUrl) return null;
    if (!customCoupleVersion) return rawCustomCoupleUrl;
    return rawCustomCoupleUrl.includes('?')
      ? `${rawCustomCoupleUrl}&v=${customCoupleVersion}`
      : `${rawCustomCoupleUrl}?v=${customCoupleVersion}`;
  }, [rawCustomCoupleUrl, customCoupleVersion]);
  const photos = media.filter(m => !m.file_path?.includes('custom-couple')).slice(0, Math.max(1,Number(i.gallery_limit || 5)));
  const [lightbox, setLightbox] = useState(null);
  const [activeGallerySlide, setActiveGallerySlide] = useState(0);
  const touchStartX = useRef(0);
  const galleryTrackRef = useRef(null);
  const galleryScrollRafRef = useRef(0);
  const galleryDragRef = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });

  const openPhoto = useCallback((photo) => {
    setLightbox({
      items: [photo],
      index: 0
    });
  }, []);

  const openGalleryPhoto = useCallback((index) => {
    const galleryItems = (photos.length ? photos : []).map((p, idx) => ({
      src: mediaUrl(p.file_path),
      title: `Memory · ${String(idx + 1).padStart(2, '0')}`,
      caption: `${groom} & ${bride} — Momen Bahagia`
    }));
    if (!galleryItems.length) return;
    setLightbox({
      items: galleryItems,
      index: Math.max(0, Math.min(index, galleryItems.length - 1))
    });
  }, [photos, groom, bride]);

  const handleGalleryScroll = useCallback(() => {
    if (galleryScrollRafRef.current) return;
    galleryScrollRafRef.current = window.requestAnimationFrame(() => {
      galleryScrollRafRef.current = 0;
      const track = galleryTrackRef.current;
      if (!track) return;
      const cards = track.querySelectorAll('figure');
      if (!cards.length) return;
      const trackCenter = track.scrollLeft + track.clientWidth / 2;
      let bestIndex = 0;
      let bestDist = Infinity;
      cards.forEach((card, idx) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(cardCenter - trackCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = idx;
        }
      });
      setActiveGallerySlide((prev) => (prev === bestIndex ? prev : bestIndex));
    });
  }, []);

  const scrollToGallerySlide = useCallback((index) => {
    const track = galleryTrackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll('figure');
    if (!cards.length) return;
    const clamped = Math.max(0, Math.min(cards.length - 1, index));
    const target = cards[clamped];
    if (!target) return;
    const targetLeft = target.offsetLeft - (track.clientWidth - target.offsetWidth) / 2;
    track.scrollTo({
      left: Math.max(0, Math.min(track.scrollWidth - track.clientWidth, targetLeft)),
      behavior: 'smooth',
    });
    setActiveGallerySlide(clamped);
  }, []);

  const scrollGalleryBy = useCallback((delta) => {
    scrollToGallerySlide(activeGallerySlide + delta);
  }, [activeGallerySlide, scrollToGallerySlide]);

  const handleGalleryPointerDown = useCallback((e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const track = galleryTrackRef.current;
    if (!track) return;
    galleryDragRef.current = {
      active: true,
      startX: e.clientX,
      startScrollLeft: track.scrollLeft,
      moved: false,
    };
    track.classList.add('is-dragging');
  }, []);

  const handleGalleryPointerMove = useCallback((e) => {
    const drag = galleryDragRef.current;
    if (!drag.active) return;
    const track = galleryTrackRef.current;
    if (!track) return;
    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 6) {
      drag.moved = true;
    }
    if (drag.moved) {
      track.scrollLeft = drag.startScrollLeft - dx;
    }
  }, []);

  const finishGalleryPointerDrag = useCallback(() => {
    const drag = galleryDragRef.current;
    if (!drag.active) return;
    drag.active = false;
    const track = galleryTrackRef.current;
    if (track) {
      track.classList.remove('is-dragging');
      handleGalleryScroll();
    }
    window.setTimeout(() => {
      galleryDragRef.current.moved = false;
    }, 60);
  }, [handleGalleryScroll]);

  const handleGalleryPhotoClick = useCallback((index) => {
    if (galleryDragRef.current.moved) return;
    openGalleryPhoto(index);
  }, [openGalleryPhoto]);

  const nextPhoto = () => {
    setLightbox((prev) => prev && prev.items.length > 1 ? { ...prev, index: (prev.index + 1) % prev.items.length } : prev);
  };
  const prevPhoto = () => {
    setLightbox((prev) => prev && prev.items.length > 1 ? { ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length } : prev);
  };

  useEffect(() => {
    if (!lightbox) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightbox(null);
      } else if (e.key === 'ArrowRight' && lightbox.items.length > 1) {
        nextPhoto();
      } else if (e.key === 'ArrowLeft' && lightbox.items.length > 1) {
        prevPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightbox]);

  const [performanceTier] = useState(detectPerformanceTier);
  const [isCompactViewport, setIsCompactViewport] = useState(() => (typeof window !== 'undefined' ? window.matchMedia('(max-width: 800px)').matches : false));
  const [opened,setOpened] = useState(false), [cinematicDone,setCinematicDone] = useState(false), [replayId,setReplayId] = useState(0), [menuOpen,setMenuOpen] = useState(false), [autoReplayOpening,setAutoReplayOpening] = useState(false);
  const [openingPhase,setOpeningPhase] = useState('idle');
  const [eventsPhase,setEventsPhase] = useState('idle');
  const [couplePhase,setCouplePhase] = useState('idle');
  const [storyPhase,setStoryPhase] = useState('idle');
  const [galleryPhase,setGalleryPhase] = useState('idle');
  const [giftPhase,setGiftPhase] = useState('idle');
  const [rsvpPhase,setRsvpPhase] = useState('idle');
  const [closingPhase,setClosingPhase] = useState('idle');
  const [journeyMounted,setJourneyMounted] = useState(true), [journeyStarted,setJourneyStarted] = useState(false), [journeyReady,setJourneyReady] = useState(false);
  const [selectedGiftIndex, setSelectedGiftIndex] = useState(0);
  const [isGiftDropdownOpen, setIsGiftDropdownOpen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(max-width: 800px)');
    const sync = () => setIsCompactViewport(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  const groomPhotoRaw = i.groom_photo || media[1]?.file_path || i.cover_image;
  const bridePhotoRaw = i.bride_photo || media[0]?.file_path || i.cover_image;
  const storyPhotoRaw = i.cover_image || media[0]?.file_path;
  const closingPhotoOrig = customCoupleUrl || (LAYER + (isCompactViewport ? '/couple-cinematic-mobile-v2.webp' : '/couple-cinematic-v2.webp'));
  const warmupPhotoUrls = useMemo(() => [
    groomPhotoRaw ? mediaUrl(groomPhotoRaw) : null,
    bridePhotoRaw ? mediaUrl(bridePhotoRaw) : null,
    storyPhotoRaw ? mediaUrl(storyPhotoRaw) : null,
    ...photos.map((p) => (p?.file_path ? mediaUrl(p.file_path) : null)),
    closingPhotoOrig || null,
  ].filter(Boolean), [groomPhotoRaw, bridePhotoRaw, storyPhotoRaw, photos, closingPhotoOrig]);

  const { getDisplaySrc } = useCrispMediaWarmup({
    photoUrls: warmupPhotoUrls.filter((u) => u !== closingPhotoOrig),
    predecodeOnlyUrls: closingPhotoOrig ? [closingPhotoOrig] : [],
    performanceTier,
    isCompact: isCompactViewport,
    canWarm: !opened || (opened && cinematicDone),
  });

  const showOrnaments = performanceTier !== 'low';
  const showSparkles = performanceTier === 'high' && !isCompactViewport;
  const defaultGiftAccounts = useMemo(() => [
    { provider: 'BCA', account_number: '8410 9283 1928', account_name: `${groom} & ${bride}`, label: 'Rekening Utama' },
    { provider: 'BNI', account_number: '0912 3847 1920', account_name: `${groom} & ${bride}`, label: 'Rekening Hadiah' },
    { provider: 'Mandiri', account_number: '1370 0192 8371 2', account_name: `${groom} & ${bride}`, label: 'Amplop Digital' }
  ], [groom, bride]);
  const activeGiftAccounts = useMemo(() => (giftAccounts && giftAccounts.length > 0) ? giftAccounts : defaultGiftAccounts, [giftAccounts, defaultGiftAccounts]);
  useEffect(() => {
    if (!isGiftDropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.vv-custom-dropdown')) {
        setIsGiftDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isGiftDropdownOpen]);
  const copyAccountNumber = (accNumber) => {
    if (!accNumber) return;
    const cleanNum = String(accNumber).replace(/\s+/g, '');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(cleanNum).then(() => {
        setCopiedAccount(true);
        setTimeout(() => setCopiedAccount(false), 2000);
      }).catch(() => {
        window.prompt('Salin nomor rekening:', cleanNum);
      });
    } else {
      window.prompt('Salin nomor rekening:', cleanNum);
    }
  };
  const [activeNormal,setActiveNormal] = useState('vv-full-opening');
  const [musicPlaying,setMusicPlaying] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState('');
  const [submittingGreeting, setSubmittingGreeting] = useState(false);
  const [greetingFeedback, setGreetingFeedback] = useState({ text: '', type: '' });
  const audioRef = useRef(null);
  const scrollRef = useRef(null);
  const navRef = useRef(null);
  const activeNormalRef = useRef('vv-full-opening');
  const journeyReadyRef = useRef(false);
  journeyReadyRef.current = journeyReady;
  const normalRef = useRef(null);
  const coupleRef = useRef(null);
  const eventsRef = useRef(null);
  const storyRef = useRef(null);
  const galleryRef = useRef(null);
  const giftRef = useRef(null);
  const rsvpRef = useRef(null);
  const closingRef = useRef(null);
  const sections = [['vv-full-opening','Pembuka'],['vv-full-couple','Mempelai'],['vv-full-events','Rangkaian Acara'],...(i.love_story ? [['vv-full-story','Kisah Kami']] : []),['vv-full-gallery','Galeri'],...(i.has_gift ? [['vv-full-gift','Hadiah']] : []),...(i.has_wishes ? [['vv-full-rsvp','RSVP & Ucapan']] : []),['vv-full-closing','Penutup']];

  const syncActiveNavDom = useCallback((id) => {
    if (!id || activeNormalRef.current === id) return;
    activeNormalRef.current = id;
    const navEl = navRef.current;
    if (!navEl) return;
    const buttons = navEl.querySelectorAll('button[data-section-id]');
    buttons.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.sectionId === id);
    });
  }, []);

  const musicUserPausedRef = useRef(false);
  const startMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !i.has_music || !i.music_file) return;
    musicUserPausedRef.current = false;
    if (audio.error || audio.networkState === 0) {
      try { audio.load(); } catch {}
    }
    audio.play().then(() => setMusicPlaying(true)).catch(() => {});
  }, [i.has_music, i.music_file]);

  useEffect(() => {
    if (!opened || musicUserPausedRef.current) return undefined;
    const audio = audioRef.current;
    if (i.has_music && i.music_file && audio && audio.paused) {
      audio.play().then(() => setMusicPlaying(true)).catch(() => {});
    }
    return undefined;
  },[opened,i.has_music,i.music_file]);
  useEffect(() => {
    if (!opened || !cinematicDone) return undefined;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
      if (visible) syncActiveNavDom(visible.target.id);
    },{root:null,rootMargin:'-14% 0px -55% 0px',threshold:[0,.15,.4]});
    sections.forEach(([id]) => { const element = scrollRef.current?.querySelector('#'+id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  },[opened,cinematicDone,i.love_story,i.has_gift,i.has_wishes,syncActiveNavDom]);

  // Retire the cinematic, mount native document scrolling before paint.
  useLayoutEffect(() => {
    if (!opened || !cinematicDone) return undefined;
    const html = document.documentElement;
    const body = document.body;
    html.classList.add('vv-doc-scroll-active');
    html.classList.toggle('vv-embed-scroll-hide', body.classList.contains('embed-preview'));
    body.classList.add('vv-doc-scroll-active');
    window.scrollTo({ top: 0, behavior: 'auto' });
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    setJourneyMounted(false);
    normalRef.current?.classList.add('is-revealed', 'is-in-viewport');
    activeNormalRef.current = 'vv-full-opening';
    setActiveNormal('vv-full-opening');
    return () => {
      html.classList.remove('vv-doc-scroll-active', 'vv-embed-scroll-hide');
      body.classList.remove('vv-doc-scroll-active');
    };
  },[opened,cinematicDone,replayId]);

  // Apply reveal classes synchronously before first paint (0 mount transition storm).
  useLayoutEffect(() => {
    if (!opened || !cinematicDone) return undefined;
    const root = scrollRef.current;
    if (!root) return undefined;
    const experience = root.closest('.vv-redesign');
    const mobileReveal = window.matchMedia('(max-width: 800px)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const useWaapiReveal = mobileReveal && !prefersReducedMotion && typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
    const selectors = [
      '.vv-full-couple > .vv-after-heading',
      '.vv-person-card',
      '.vv-person-amp',
      '.vv-full-events > .vv-after-heading',
      '.vv-event-card',
      '.vv-story-glass',
      '.vv-story-photo',
      '.vv-gallery > .vv-after-heading',
      '.vv-gallery-carousel',
      '.vv-gift-redesign > .vv-after-heading',
      '.vv-gift-redesign > p',
      '.vv-gift-selector-container',
      '.vv-rsvp-redesign > .vv-after-heading',
      '.vv-rsvp-redesign > .vv-preview-note',
      '.vv-rsvp-form',
      '.vv-rsvp-wishes-shell',
      '.vv-closing-couple',
      '.vv-closing-copy > small',
      '.vv-closing-divider',
      '.vv-closing-copy > p',
      '.vv-closing-copy > h2',
      '.vv-closing-copy > time',
      '.vv-closing-copy > strong',
    ];
    const targets = Array.from(root.querySelectorAll(selectors.join(',')));
    const revealVariants = ['vv-reveal-left','vv-reveal-right','vv-reveal-up','vv-reveal-bounce','vv-reveal-zoom','vv-reveal-type'];
    const getRevealVariant = (el) => {
      if (el.matches('.vv-full-couple > .vv-after-heading')) return 'vv-reveal-up';
      if (el.matches('.vv-person-card')) return el === el.parentElement?.querySelector('.vv-person-card') ? 'vv-reveal-left' : 'vv-reveal-right';
      if (el.matches('.vv-person-amp')) return 'vv-reveal-zoom';
      if (el.matches('.vv-full-events > .vv-after-heading')) return 'vv-reveal-zoom';
      if (el.matches('.vv-event-card')) return el === el.parentElement?.querySelector('.vv-event-card') ? 'vv-reveal-left' : 'vv-reveal-right';
      if (el.matches('.vv-story-glass')) return 'vv-reveal-left';
      if (el.matches('.vv-story-photo')) return 'vv-reveal-right';
      if (el.matches('.vv-gallery > .vv-after-heading')) return 'vv-reveal-up';
      if (el.matches('.vv-gallery-carousel')) return 'vv-reveal-zoom';
      if (el.matches('.vv-gift-redesign > .vv-after-heading')) return 'vv-reveal-zoom';
      if (el.matches('.vv-gift-redesign > p')) return 'vv-reveal-type';
      if (el.matches('.vv-gift-selector-container')) return 'vv-reveal-up';
      if (el.matches('.vv-rsvp-redesign > .vv-after-heading')) return 'vv-reveal-bounce';
      if (el.matches('.vv-rsvp-redesign > .vv-preview-note')) return 'vv-reveal-type';
      if (el.matches('.vv-rsvp-form')) return 'vv-reveal-left';
      if (el.matches('.vv-rsvp-wishes-shell')) return 'vv-reveal-right';
      if (el.matches('.vv-closing-couple')) return 'vv-reveal-up';
      if (el.matches('.vv-closing-copy > small')) return 'vv-reveal-left';
      if (el.matches('.vv-closing-divider')) return 'vv-reveal-zoom';
      if (el.matches('.vv-closing-copy > p')) return 'vv-reveal-type';
      if (el.matches('.vv-closing-copy > h2')) return 'vv-reveal-bounce';
      if (el.matches('.vv-closing-copy > time')) return 'vv-reveal-right';
      return 'vv-reveal-up';
    };

    const getWaapiSpec = (el) => {
      const isLow = performanceTier === 'low';
      if (el.matches('.vv-rsvp-form')) {
        return {
          opacityOnly: true,
          duration: isLow ? 1040 : 1240,
          easing: 'cubic-bezier(0.22, 0.85, 0.36, 1)',
        };
      }
      if (el.matches('.vv-closing-couple')) {
        return {
          from: isLow ? 'translate3d(-50%, 22px, 0)' : 'translate3d(-50%, 34px, 0)',
          to: 'translate3d(-50%, 0, 0)',
          duration: isLow ? 1040 : 1260,
          easing: 'cubic-bezier(0.16, 0.88, 0.26, 1)',
        };
      }
      if (el.matches('.vv-gallery-carousel')) {
        return {
          from: isLow ? 'translate3d(0, 22px, 0)' : 'translate3d(0, 34px, 0)',
          to: 'translate3d(0, 0, 0)',
          duration: isLow ? 1040 : 1260,
          easing: 'cubic-bezier(0.16, 0.88, 0.26, 1)',
        };
      }
      if (el.classList.contains('vv-reveal-left')) {
        return {
          from: isLow ? 'translate3d(-24px, 8px, 0)' : 'translate3d(-34px, 14px, 0)',
          to: 'translate3d(0, 0, 0)',
          duration: isLow ? 1040 : 1260,
          easing: 'cubic-bezier(0.16, 0.92, 0.28, 1)',
        };
      }
      if (el.classList.contains('vv-reveal-right')) {
        return {
          from: isLow ? 'translate3d(24px, 8px, 0)' : 'translate3d(34px, 14px, 0)',
          to: 'translate3d(0, 0, 0)',
          duration: isLow ? 1040 : 1260,
          easing: 'cubic-bezier(0.16, 0.92, 0.28, 1)',
        };
      }
      if (el.classList.contains('vv-reveal-bounce')) {
        return {
          from: isLow ? 'translate3d(0, 24px, 0)' : 'translate3d(0, 38px, 0)',
          to: 'translate3d(0, 0, 0)',
          duration: isLow ? 1040 : 1320,
          easing: 'cubic-bezier(0.18, 1.08, 0.32, 1)',
        };
      }
      if (el.classList.contains('vv-reveal-zoom')) {
        return {
          from: isLow ? 'translate3d(0, 18px, 0) scale(0.97)' : 'translate3d(0, 24px, 0) scale(0.95)',
          to: 'translate3d(0, 0, 0) scale(1)',
          duration: isLow ? 1040 : 1240,
          easing: 'cubic-bezier(0.16, 0.92, 0.28, 1)',
        };
      }
      if (el.classList.contains('vv-reveal-type')) {
        return {
          from: 'translate3d(0, 22px, 0)',
          to: 'translate3d(0, 0, 0)',
          duration: isLow ? 960 : 1120,
          easing: 'cubic-bezier(0.16, 0.88, 0.26, 1)',
        };
      }
      return {
        from: isLow ? 'translate3d(0, 22px, 0)' : 'translate3d(0, 34px, 0)',
        to: 'translate3d(0, 0, 0)',
        duration: isLow ? 1040 : 1260,
        easing: 'cubic-bezier(0.16, 0.88, 0.26, 1)',
      };
    };

    experience?.classList.add('vv-reveal-init');
    const sectionOrder = new Map();
    targets.forEach((el) => {
      const section = el.closest('.vv-after');
      const order = sectionOrder.get(section) || 0;
      sectionOrder.set(section, order + 1);
      el.classList.add('vv-scroll-reveal',getRevealVariant(el));
      const delay = mobileReveal ? Math.min(order * 95, 260) : Math.min(order * 95, 285);
      el.style.setProperty('--vv-reveal-delay', `${delay}ms`);
      el.dataset.vvRevealDelay = String(delay);
    });
    experience?.classList.add('has-component-reveals');
    if (useWaapiReveal) experience?.classList.add('has-waapi-reveals');

    let releaseInitRaf2 = 0;
    const releaseInitRaf1 = window.requestAnimationFrame(() => {
      releaseInitRaf2 = window.requestAnimationFrame(() => {
        experience?.classList.remove('vv-reveal-init');
      });
    });

    const activeAnims = new Set();
    const settleTimers = new Set();
    const warmObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-will-animate');
        warmObserver.unobserve(entry.target);
      });
    }, {
      root: null,
      rootMargin: '750px 0px 750px 0px',
      threshold: 0,
    });

    const revealTargetOnce = (el, entry) => {
      if (!el || el.dataset.vvRevealSeen === 'true') return;
      el.dataset.vvRevealSeen = 'true';
      el.classList.remove('is-component-exiting-up');
      el.classList.add('is-component-visible');
      componentObserver.unobserve(el);
      warmObserver.unobserve(el);

      const markSettled = () => {
        el.classList.remove('is-will-animate');
        el.classList.add('is-motion-settled');
      };

      if (useWaapiReveal) {
        if (entry?.boundingClientRect && entry.boundingClientRect.bottom < 0) {
          markSettled();
          return;
        }
        el.classList.add('is-will-animate');
        const spec = getWaapiSpec(el);
        const delay = Number(el.dataset.vvRevealDelay || 0);
        const keyframes = spec.opacityOnly
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [
              { opacity: 0, transform: spec.from },
              { opacity: 1, transform: spec.to },
            ];
        const anim = el.animate(
          keyframes,
          {
            duration: spec.duration,
            delay,
            easing: spec.easing,
            fill: 'backwards',
          },
        );
        activeAnims.add(anim);
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          settleTimers.delete(timer);
          activeAnims.delete(anim);
          markSettled();
        };
        const timer = window.setTimeout(finish, spec.duration + delay + 250);
        settleTimers.add(timer);
        anim.onfinish = finish;
        anim.oncancel = finish;
      } else {
        let settled = false;
        const finish = (evt) => {
          if (evt && evt.target !== el) return;
          if (settled) return;
          settled = true;
          el.removeEventListener('transitionend', finish);
          window.clearTimeout(timer);
          settleTimers.delete(timer);
          markSettled();
        };
        el.addEventListener('transitionend', finish);
        const timer = window.setTimeout(() => finish(null), 1650);
        settleTimers.add(timer);
      }
    };

    const componentObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const rootTop = entry.rootBounds?.top ?? 0;
        if (!entry.isIntersecting && entry.boundingClientRect.top >= rootTop) return;
        revealTargetOnce(entry.target, entry);
      });
    }, {
      root: null,
      rootMargin: '2400px 0px -8% 0px',
      threshold: 0.01
    });
    targets.forEach((el) => {
      warmObserver.observe(el);
      componentObserver.observe(el);
    });

    return () => {
      window.cancelAnimationFrame(releaseInitRaf1);
      window.cancelAnimationFrame(releaseInitRaf2);
      activeAnims.forEach((anim) => {
        try { anim.cancel(); } catch {}
      });
      activeAnims.clear();
      settleTimers.forEach((t) => window.clearTimeout(t));
      settleTimers.clear();
      warmObserver.disconnect();
      componentObserver.disconnect();
      experience?.classList.remove('vv-reveal-init','has-component-reveals','has-waapi-reveals');
      targets.forEach(el => {
        el.classList.remove('vv-scroll-reveal','is-component-visible','is-component-exiting-up','is-will-animate','is-motion-settled',...revealVariants);
        el.style.removeProperty('--vv-reveal-delay');
        delete el.dataset.vvRevealDelay;
        delete el.dataset.vvRevealSeen;
      });
    };
  }, [opened, cinematicDone, replayId, photos.length, greetings.length]);

  // One-time section reveal coordinator (uses viewport root, zero scroll-time React renders).
  useEffect(() => {
    if (!opened || !cinematicDone) return undefined;

    const sectionEls = [
      normalRef.current,
      coupleRef.current,
      eventsRef.current,
      i.love_story ? storyRef.current : null,
      galleryRef.current,
      i.has_gift ? giftRef.current : null,
      i.has_wishes ? rsvpRef.current : null,
      closingRef.current,
    ].filter(Boolean);

    const revealSectionOnce = (el) => {
      if (!el || el.classList.contains('is-revealed')) return;
      el.classList.remove('is-leaving');
      el.classList.add('is-revealed');
      revealObserver.unobserve(el);
    };

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const rootTop = entry.rootBounds?.top ?? 0;
          if (entry.isIntersecting || entry.boundingClientRect.top < rootTop) {
            revealSectionOnce(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '2400px 0px -6% 0px',
        threshold: 0.01,
      }
    );

    const viewportObserver = showSparkles
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              entry.target.classList.toggle('is-in-viewport', entry.isIntersecting);
            });
          },
          {
            root: null,
            rootMargin: '300px 0px 300px 0px',
            threshold: 0,
          }
        )
      : null;

    const viewBottom = window.innerHeight || 900;
    sectionEls.forEach((el) => {
      viewportObserver?.observe(el);
      const rect = el.getBoundingClientRect();
      if (rect.top <= viewBottom * 0.94) {
        revealSectionOnce(el);
      } else {
        revealObserver.observe(el);
      }
    });

    return () => {
      revealObserver.disconnect();
      viewportObserver?.disconnect();
      if (galleryScrollRafRef.current) {
        window.cancelAnimationFrame(galleryScrollRafRef.current);
        galleryScrollRafRef.current = 0;
      }
    };
  }, [opened, cinematicDone, journeyMounted, showSparkles, replayId, i.love_story, i.has_gift, i.has_wishes, photos.length]);

  const finishCinematic = useCallback(() => {
    setOpened(true);
    setAutoReplayOpening(false);
    setCinematicDone(true);
  },[]);
  const replayCinematic = useCallback(() => {
    document.documentElement.classList.remove('vv-doc-scroll-active', 'vv-embed-scroll-hide');
    document.body.classList.remove('vv-doc-scroll-active');
    window.scrollTo({ top: 0, behavior: 'auto' });
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    setOpened(false);
    setCinematicDone(false);
    setJourneyMounted(true);
    setJourneyStarted(false);
    setJourneyReady(false);
    setOpeningPhase('idle');
    setEventsPhase('idle');
    setCouplePhase('idle');
    setStoryPhase('idle');
    setGalleryPhase('idle');
    setGiftPhase('idle');
    setRsvpPhase('idle');
    setClosingPhase('idle');
    setMenuOpen(false);
    setAutoReplayOpening(true);
    setReplayId(value => value + 1);
  },[]);
  const finishOpening = useCallback(() => {
    setOpened(true);
    setAutoReplayOpening(false);
    if (!journeyReadyRef.current) {
      setCinematicDone(true);
    }
  },[]);
  const prepareJourney = useCallback(() => {
    setJourneyMounted(true);
    startMusic();
  },[startMusic]);
  const startJourney = useCallback(() => setJourneyStarted(true),[]);
  const markJourneyReady = useCallback(() => setJourneyReady(true),[]);
  const navigateSection = id => {
    setMenuOpen(false);
    syncActiveNavDom(id);
    const target = scrollRef.current?.querySelector('#'+id);
    if (target?.scrollIntoView) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (target) {
      window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
    }
  };
  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      musicUserPausedRef.current = true;
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      startMusic();
    }
  };
  const handleGreetingSubmit = async (e) => {
    e.preventDefault();
    if (preview) {
      setGreetingFeedback({ text: 'Mode preview — form tidak mengirim data.', type: 'info' });
      return;
    }
    const form = e.currentTarget;
    const formData = new FormData(form);
    const guestNameInput = String(formData.get('guest_name') || '').trim();
    const attendanceStatus = formData.get('attendance_status');
    const message = String(formData.get('message') || '').trim();

    if (!guestNameInput || !attendanceStatus || !message) {
      setGreetingFeedback({ text: 'Lengkapi nama, kehadiran, dan ucapan.', type: 'error' });
      return;
    }

    setSubmittingGreeting(true);
    setGreetingFeedback({ text: '', type: '' });

    try {
      const response = await fetch('/api/greetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          slug: i.slug,
          guest_name: guestNameInput,
          attendance_status: attendanceStatus,
          message
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'Ucapan gagal dikirim.');
      }
      setGreetingMessage('');
      setGreetingFeedback({ text: result.message || 'Terima kasih, ucapan Anda sudah terkirim.', type: 'success' });
      window.dispatchEvent(new CustomEvent('daymoment:greeting-sent', { detail: { greeting: result.greeting } }));
    } catch (error) {
      setGreetingFeedback({ text: error.message || 'Terjadi kesalahan saat mengirim ucapan.', type: 'error' });
    } finally {
      setSubmittingGreeting(false);
    }
  };
  return <main className={'verdant-vow vv-redesign vv-perf-'+performanceTier+' ' + (opened ? 'is-open ' : '') + (cinematicDone ? 'is-cinematic-done' : 'is-cinematic-playing')} data-performance-tier={performanceTier}>
    <VvSymbols />
    {!opened && <VerdantOpeningScene bride={bride} groom={groom} guestName={guestName} date={date(eventDate)} sceneReady={journeyReady} autoEnter={autoReplayOpening} performanceTier={performanceTier} onPrepare={prepareJourney} onStart={startJourney} onEnter={finishOpening}/>}
    <div className='vv-scroll' ref={scrollRef} inert={!opened ? true : undefined} aria-hidden={!opened}>
      <section className={'vv-journey '+(cinematicDone && !journeyMounted ? 'is-retired' : '')} id='vv-journey'>
        {journeyMounted && <VerdantCinematicJourney invitation={i} customCoupleUrl={customCoupleUrl} bride={bride} groom={groom} brideFull={brideFull} groomFull={groomFull} dateLabel={date(eventDate,{day:'numeric',month:'long',year:'numeric'})} runId={replayId} active={journeyStarted} performanceTier={performanceTier} onReady={markJourneyReady} onComplete={finishCinematic}/>}
      </section>
      {cinematicDone && <>
      <section className={'vv-after vv-full-opening is-revealed'} id='vv-full-opening' ref={normalRef}>
        {showOrnaments && !isCompactViewport && (
          <div className='vv-wedding-ornaments' aria-hidden='true'>
            <img className='vv-wedding-ornament-left' src={LAYER+'/section-wedding-edge-ornament-indonesian-v2.webp'} alt='' width='720' height='1080' decoding='async'/>
            <img className='vv-wedding-ornament-right' src={LAYER+'/section-wedding-edge-ornament-indonesian-v2.webp'} alt='' width='720' height='1080' decoding='async'/>
          </div>
        )}
        <button type='button' className='vv-replay-cinematic' onClick={replayCinematic}>Ulangi Cinematic</button>
        <div className='vv-wedding-stage'>
          <div className='vv-after-heading'><small>Dengan penuh rasa syukur</small><h2>The Wedding</h2></div>
          <p>Kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menjadi bagian dari hari bahagia kami.</p>
          <h3>{groom} <i>&amp;</i> {bride}</h3><time>{date(eventDate)}</time>
          <VerdantCountdownGrid eventDate={eventDate} active={opened && cinematicDone} />
        </div>
      </section>
      <section className={'vv-after vv-full-couple '+(couplePhase === 'visible' ? 'is-revealed' : couplePhase === 'leaving' ? 'is-leaving' : '')} id='vv-full-couple' ref={coupleRef}>
        {showOrnaments && (
          <div className='vv-couple-ornaments' aria-hidden='true'>
            <img src={LAYER + (isCompactViewport ? '/section-couple-janur-orbit-ornament-mobile-v2.webp' : '/section-couple-janur-orbit-ornament-v2.webp')} alt='' width='720' height='1080' decoding='async'/>
            <img src={LAYER + (isCompactViewport ? '/section-couple-janur-orbit-ornament-mobile-v2.webp' : '/section-couple-janur-orbit-ornament-v2.webp')} alt='' width='720' height='1080' decoding='async'/>
          </div>
        )}
        {showSparkles && <div className='vv-couple-sparkles' aria-hidden='true'><i/><i/><i/><i/><i/><i/><i/><i/></div>}
        <div className='vv-after-heading'><small>Dua hati yang dipertemukan</small><h2>Mempelai</h2></div>
        <div className='vv-person-grid'>
          <Person
            role='Mempelai pria'
            name={groomFull}
            nickname={groom}
            photo={groomPhotoRaw}
            displayPhoto={groomPhotoRaw ? getDisplaySrc(mediaUrl(groomPhotoRaw)) : ''}
            father={i.groom_father}
            mother={i.groom_mother}
            onPhotoClick={() => openPhoto({
              src: mediaUrl(groomPhotoRaw),
              title: `Mempelai Pria · ${groomFull}`,
              caption: `Putra dari ${i.groom_father || 'Bapak'} & ${i.groom_mother || 'Ibu'}`
            })}
          />
          <span className='vv-person-amp'>&amp;</span>
          <Person
            role='Mempelai wanita'
            name={brideFull}
            nickname={bride}
            photo={bridePhotoRaw}
            displayPhoto={bridePhotoRaw ? getDisplaySrc(mediaUrl(bridePhotoRaw)) : ''}
            father={i.bride_father}
            mother={i.bride_mother}
            onPhotoClick={() => openPhoto({
              src: mediaUrl(bridePhotoRaw),
              title: `Mempelai Wanita · ${brideFull}`,
              caption: `Putri dari ${i.bride_father || 'Bapak'} & ${i.bride_mother || 'Ibu'}`
            })}
          />
        </div>
      </section>

        <section className={'vv-after vv-full-events '+(eventsPhase === 'visible' ? 'is-revealed' : eventsPhase === 'leaving' ? 'is-leaving' : '')} id='vv-full-events' ref={eventsRef}>
        {showOrnaments && (
          <div className='vv-events-ornaments' aria-hidden='true'>
            <img className='vv-events-corner vv-events-corner-tl' src={LAYER + (isCompactViewport ? '/events-janur-melati-corner-mobile-v2.webp' : '/events-janur-melati-corner-v2.webp')} alt='' width='760' height='800' decoding='async'/>
            {!isCompactViewport && <>
              <img className='vv-events-corner vv-events-corner-tr' src={LAYER+'/events-janur-melati-corner-v2.webp'} alt='' width='760' height='800' decoding='async'/>
              <img className='vv-events-corner vv-events-corner-bl' src={LAYER+'/events-janur-melati-corner-v2.webp'} alt='' width='760' height='800' decoding='async'/>
            </>}
            <img className='vv-events-corner vv-events-corner-br' src={LAYER + (isCompactViewport ? '/events-janur-melati-corner-mobile-v2.webp' : '/events-janur-melati-corner-v2.webp')} alt='' width='760' height='800' decoding='async'/>
          </div>
        )}
        {showSparkles && <div className='vv-events-sparkles' aria-hidden='true'>{Array.from({length: 10}, (_, n) => <i key={n}/>)}</div>}
        <div className='vv-after-heading'><small>Catat hari bahagia kami</small><h2>Rangkaian Acara</h2></div>
        <div className='vv-event-grid'>
          <EventCard title='Akad Nikah' day={i.akad_date} start={i.akad_start_time} end={i.akad_end_time} venue={i.venue_name} address={i.venue_address} maps={i.maps_url}/>
          <EventCard title='Resepsi' day={i.reception_date} start={i.reception_start_time} end={i.reception_end_time} venue={i.venue_name} address={i.venue_address} maps={i.maps_url}/>
        </div>
      </section>
       {i.love_story && <section className={'vv-after vv-story '+(storyPhase === 'visible' ? 'is-revealed' : storyPhase === 'leaving' ? 'is-leaving' : '')} id='vv-full-story' ref={storyRef}>
        {showOrnaments && (
          <div className='vv-story-ornaments' aria-hidden='true'>
            <img className='vv-story-side vv-story-side-left' src={STORY + (isCompactViewport ? '/story-side-ornament-indonesian-mobile-v1.webp' : '/story-side-ornament-indonesian-v1.webp')} alt='' width='720' height='1080' decoding='async'/>
            <img className='vv-story-side vv-story-side-right' src={STORY + (isCompactViewport ? '/story-side-ornament-indonesian-mobile-v1.webp' : '/story-side-ornament-indonesian-v1.webp')} alt='' width='720' height='1080' decoding='async'/>
            {showSparkles && <>
              <span className='vv-story-glint vv-story-glint-one'/>
              <span className='vv-story-glint vv-story-glint-two'/>
              <span className='vv-story-glint vv-story-glint-three'/>
            </>}
          </div>
        )}
        <div className='vv-story-glass'>
          <div className='vv-after-heading'><small>Kisah yang tumbuh</small><h2><span>Kisah</span><span>Kami</span></h2></div>
          <div className='vv-story-divider' aria-hidden='true'><i/><b>◆</b><i/></div>
          <p>{i.love_story}</p>
          <div className='vv-story-signature' aria-label={groom+' dan '+bride}><span>{groom}</span><i>&amp;</i><span>{bride}</span></div>
        </div>
        {storyPhotoRaw && <figure className='vv-story-photo'>
          <div
            className='vv-story-photo-window vv-clickable-photo'
            onClick={() => openPhoto({
              src: mediaUrl(storyPhotoRaw),
              title: `${groom} & ${bride}`,
              caption: 'Kisah Kami — Tumbuh, memilih, dan pulang bersama.'
            })}
            role="button"
            tabIndex={0}
            aria-label="Lihat foto kisah kami ukuran penuh"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openPhoto({
                  src: mediaUrl(storyPhotoRaw),
                  title: `${groom} & ${bride}`,
                  caption: 'Kisah Kami — Tumbuh, memilih, dan pulang bersama.'
                });
              }
            }}
          >
            <img className='vv-story-photo-img' src={getDisplaySrc(mediaUrl(storyPhotoRaw))} alt={groom+' dan '+bride} width='900' height='1200' decoding='async'/>
            <img className='vv-story-frame-overlay' src={STORY + (isCompactViewport ? '/story-photo-frame-indonesian-portrait-mobile-v1.webp' : '/story-photo-frame-indonesian-portrait-v1.webp')} alt='' aria-hidden='true' width='900' height='1138' decoding='async'/>
            <span className="vv-photo-zoom-hint" aria-hidden="true"><VvIcon name="vv-zoom" /></span>
          </div>
          <figcaption><small>Catatan perjalanan</small><span>Tumbuh, memilih, dan pulang bersama.</span></figcaption>
        </figure>}
      </section>}
       <section className={'vv-after vv-gallery '+(galleryPhase === 'visible' ? 'is-revealed' : galleryPhase === 'leaving' ? 'is-leaving' : '')} id='vv-full-gallery' ref={galleryRef}>
        {showOrnaments && (
          <div className='vv-gallery-ornaments' aria-hidden='true'>
            <img className='vv-gallery-corner vv-gallery-corner-tl' src={GALLERY + (isCompactViewport ? '/gallery-corner-ornament-indonesian-mobile-v1.webp' : '/gallery-corner-ornament-indonesian-v1.webp')} alt='' width='720' height='720' decoding='async'/>
            {!isCompactViewport && <>
              <img className='vv-gallery-corner vv-gallery-corner-tr' src={GALLERY+'/gallery-corner-ornament-indonesian-v1.webp'} alt='' width='720' height='720' decoding='async'/>
              <img className='vv-gallery-corner vv-gallery-corner-bl' src={GALLERY+'/gallery-corner-ornament-indonesian-v1.webp'} alt='' width='720' height='720' decoding='async'/>
            </>}
            <img className='vv-gallery-corner vv-gallery-corner-br' src={GALLERY + (isCompactViewport ? '/gallery-corner-ornament-indonesian-mobile-v1.webp' : '/gallery-corner-ornament-indonesian-v1.webp')} alt='' width='720' height='720' decoding='async'/>
            {showSparkles && <><i/><i/><i/><i/></>}
          </div>
        )}
        <div className='vv-after-heading'><small>Potongan waktu yang kami simpan</small><h2>Galeri</h2><span aria-hidden='true'>Album Kenangan</span></div>
        {photos.length ? (
          <div className='vv-gallery-carousel'>
            <div
              className={'vv-gallery-grid vv-gallery-slider vv-gallery-count-'+Math.min(photos.length,6)}
              ref={galleryTrackRef}
              onScroll={handleGalleryScroll}
              onPointerDown={handleGalleryPointerDown}
              onPointerMove={handleGalleryPointerMove}
              onPointerUp={finishGalleryPointerDrag}
              onPointerCancel={finishGalleryPointerDrag}
              onPointerLeave={finishGalleryPointerDrag}
            >
              {photos.map((photo,index) => (
                <figure
                  key={photo.id || index}
                  data-active-slide={activeGallerySlide === index ? 'true' : undefined}
                  data-gallery-index={index}
                >
                  <div
                    className='vv-gallery-photo vv-clickable-photo'
                    onClick={() => handleGalleryPhotoClick(index)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Lihat foto galeri ${index + 1} ukuran penuh`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openGalleryPhoto(index);
                      }
                    }}
                  >
                    <img src={getDisplaySrc(mediaUrl(photo.file_path))} alt={'Momen '+(index+1)} width='900' height='1200' decoding='async' draggable='false'/>
                    <span className="vv-photo-zoom-hint" aria-hidden="true"><VvIcon name="vv-zoom" /></span>
                  </div>
                  <figcaption><span>Memory</span><b>{String(index+1).padStart(2,'0')}</b></figcaption>
                </figure>
              ))}
            </div>
            {photos.length > 1 && (
              <div className='vv-gallery-controls' aria-label='Navigasi geser galeri'>
                <button
                  type='button'
                  className='vv-gallery-nav-btn is-prev'
                  onClick={() => scrollGalleryBy(-1)}
                  disabled={activeGallerySlide <= 0}
                  aria-label='Geser ke foto sebelumnya'
                >
                  <VvIcon name='vv-chevron-left' />
                </button>
                <div className='vv-gallery-dots' role='tablist' aria-label='Indikator foto galeri'>
                  {photos.map((photo, index) => (
                    <button
                      key={photo.id || index}
                      type='button'
                      role='tab'
                      aria-selected={activeGallerySlide === index}
                      aria-label={`Geser ke foto ${index + 1}`}
                      className={`vv-gallery-dot ${activeGallerySlide === index ? 'is-active' : ''}`}
                      onClick={() => scrollToGallerySlide(index)}
                    />
                  ))}
                </div>
                <button
                  type='button'
                  className='vv-gallery-nav-btn is-next'
                  onClick={() => scrollGalleryBy(1)}
                  disabled={activeGallerySlide >= photos.length - 1}
                  aria-label='Geser ke foto berikutnya'
                >
                  <VvIcon name='vv-chevron-right' />
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className='vv-empty'>Momen bahagia akan segera hadir.</p>
        )}
      </section>
       {i.has_gift && <section className={'vv-after vv-gift vv-gift-redesign '+(giftPhase === 'visible' ? 'is-revealed' : giftPhase === 'leaving' ? 'is-leaving' : '')} id='vv-full-gift' ref={giftRef}>
        {showOrnaments && (
          <div className='vv-gift-ornaments' aria-hidden='true'>
            <img className='vv-gift-seserahan vv-gift-seserahan-left' src={GIFT + (isCompactViewport ? '/gift-seserahan-ornament-indonesian-mobile-v1.webp' : '/gift-seserahan-ornament-indonesian-v1.webp')} alt='' width='840' height='560' decoding='async'/>
            <img className='vv-gift-seserahan vv-gift-seserahan-right' src={GIFT + (isCompactViewport ? '/gift-seserahan-ornament-indonesian-mobile-v1.webp' : '/gift-seserahan-ornament-indonesian-v1.webp')} alt='' width='840' height='560' decoding='async'/>
            <span className='vv-gift-gunungan'/>
          </div>
        )}
        {showSparkles && <div className='vv-gift-sparkles' aria-hidden='true'>{Array.from({length: 8}, (_, n) => <i key={n}/>)}</div>}
        <div className='vv-after-heading'><small>Tanda kasih</small><h2>Wedding Gift</h2><span aria-hidden='true'>Seserahan Kasih</span></div>
        <p>Doa restu Anda adalah hadiah terindah. Bagi yang ingin mengirimkan tanda kasih, tersedia rekening berikut.</p>

        {activeGiftAccounts.length > 0 && (
          <div className={'vv-gift-selector-container '+(activeGiftAccounts.length === 1 ? 'is-single-account' : '')}>
            {activeGiftAccounts.length > 1 && <div className={`vv-custom-dropdown ${isGiftDropdownOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className="vv-custom-dropdown-trigger"
                onClick={() => setIsGiftDropdownOpen(!isGiftDropdownOpen)}
                aria-haspopup="listbox"
                aria-expanded={isGiftDropdownOpen}
              >
                {activeGiftAccounts[selectedGiftIndex]?.provider || activeGiftAccounts[0]?.provider || 'Pilih Rekening'}
                <span className="vv-dropdown-arrow">▼</span>
              </button>

              <div className="vv-custom-dropdown-menu" role="listbox">
                {activeGiftAccounts.map((account, index) => (
                  <button
                    key={account.id || index}
                    type="button"
                    role="option"
                    aria-selected={selectedGiftIndex === index}
                    className={`vv-custom-dropdown-item ${selectedGiftIndex === index ? 'is-selected' : ''}`}
                    onClick={() => {
                      setSelectedGiftIndex(index);
                      setIsGiftDropdownOpen(false);
                    }}
                  >
                    {account.provider}
                  </button>
                ))}
              </div>
            </div>}

            {(activeGiftAccounts[selectedGiftIndex] || activeGiftAccounts[0]) && (() => {
              const account = activeGiftAccounts[selectedGiftIndex] || activeGiftAccounts[0];
              return (
                <article className='vv-gift-card-single' key={account.id || selectedGiftIndex}>
                  <div className='vv-gift-card-topline'><span>Rekening hadiah</span><i aria-hidden='true'>✦</i></div>
                  <small>{account.provider}</small>
                  <strong data-account-number>{account.account_number}</strong>
                  <span className='vv-gift-owner'><b>Atas nama</b>{account.account_name}</span>
                  {account.label && <em>{account.label}</em>}
                  <button type='button' data-copy-account onClick={() => copyAccountNumber(account.account_number)}>
                    <span>{copiedAccount ? 'Tersalin ✓' : 'Salin nomor'}</span>
                    <b aria-hidden='true'>{copiedAccount ? '✓' : '⧉'}</b>
                  </button>
                </article>
              );
            })()}
          </div>
        )}
      </section>}
       {i.has_wishes && <section className={'vv-after vv-rsvp vv-rsvp-redesign '+(rsvpPhase === 'visible' ? 'is-revealed' : rsvpPhase === 'leaving' ? 'is-leaving' : '')} id='vv-full-rsvp' ref={rsvpRef}>
        {showOrnaments && (
          <div className='vv-rsvp-ornaments' aria-hidden='true'>
            <img className='vv-rsvp-ledger' src={RSVP + (isCompactViewport ? '/rsvp-guestbook-ornament-mobile-v1.webp' : '/rsvp-guestbook-ornament-v1.webp')} alt='' width='840' height='420' decoding='async'/>
            <span className='vv-rsvp-contour vv-rsvp-contour-left'/>
            <span className='vv-rsvp-contour vv-rsvp-contour-right'/>
            {showSparkles && <><i/><i/><i/><i/><i/><i/></>}
          </div>
        )}
        <div className='vv-after-heading'><small>Ucapan &amp; konfirmasi</small><h2>Kehadiran Anda</h2><span aria-hidden='true'>Buku Tamu Nusantara</span></div>
        {preview && <p className='vv-preview-note'>Mode preview — form tidak mengirim data.</p>}
        <form className='vv-rsvp-form' {...(preview?{'data-preview-form':''}:{'data-greeting-form':''})} onSubmit={handleGreetingSubmit}>
          <div className='vv-rsvp-form-intro' aria-hidden='true'><span>Konfirmasi kehadiran</span><i>✦</i></div>
          <input type='hidden' name='slug' value={i.slug || ''}/>
          <div className='vv-form-row'><label><span>Nama</span><input name='guest_name' maxLength='120' required defaultValue={guestName!=='Bapak/Ibu/Saudara/i'?guestName:''} placeholder='Nama Anda'/></label><label><span>Kehadiran</span><select name='attendance_status' required defaultValue=''><option value='' disabled>Pilih kehadiran</option><option value='attending'>Hadir</option><option value='not_attending'>Tidak hadir</option><option value='unsure'>Masih ragu</option></select></label></div>
          <label><span>Ucapan &amp; doa</span><textarea name='message' maxLength='500' required placeholder='Tuliskan doa hangat...' value={greetingMessage} onChange={(e) => setGreetingMessage(e.target.value)}/><small><span data-message-count>{greetingMessage.length}</span>/500</small></label>
          <button type='submit' disabled={submittingGreeting}>{submittingGreeting ? 'Mengirim...' : 'Kirim ucapan'}</button>
          <p className={'form-feedback ' + (greetingFeedback.type ? `is-${greetingFeedback.type}` : '')} data-form-feedback>{greetingFeedback.text}</p>
        </form>
        <div className='vv-rsvp-wishes-shell'>
          <div className='vv-rsvp-wishes-heading'><span>Doa dari para tamu</span><i>{String(greetings.length).padStart(2,'0')}</i></div>
          <div className='vv-wishes' data-greeting-list>{greetings.length?greetings.map(greeting=><article className='greeting-item' key={greeting.id}><strong>{greeting.guest_name}</strong><small>{greeting.attendance_status==='attending'?'Hadir':greeting.attendance_status==='not_attending'?'Tidak hadir':'Masih ragu'}</small><p>{greeting.message}</p></article>):<p className='vv-empty' data-empty-greeting>Belum ada ucapan. Jadilah yang pertama mengirimkan doa hangat.</p>}</div>
        </div>
      </section>}
       <section className={'vv-after vv-closing vv-closing-redesign '+(closingPhase === 'visible' ? 'is-revealed' : closingPhase === 'leaving' ? 'is-leaving' : '')} id='vv-full-closing' ref={closingRef}>
        {showOrnaments && (
          <div className='vv-closing-ornaments' aria-hidden='true'>
            <img className='vv-closing-canopy' src={CLOSING + (isCompactViewport ? '/closing-pendopo-canopy-ornament-mobile-v1.webp' : '/closing-pendopo-canopy-ornament-v1.webp')} alt='' width='1200' height='409' decoding='async'/>
            <span className='vv-closing-floor-sigil'/>
            {showSparkles && <><i/><i/><i/><i/><i/><i/></>}
          </div>
        )}
        <img
          className='vv-closing-couple vv-clickable-photo'
          src={closingPhotoOrig}
          alt={`${groom} & ${bride}`}
          width='900'
          height='1200'
          decoding='async'
          onClick={() => openPhoto({
            src: closingPhotoOrig,
            title: `${groom} & ${bride}`,
            caption: 'The Wedding — Bersama Menuju Bahagia'
          })}
          role="button"
          tabIndex={0}
          aria-label="Lihat foto pasangan ukuran penuh"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openPhoto({
                src: closingPhotoOrig,
                title: `${groom} & ${bride}`,
                caption: 'The Wedding — Bersama Menuju Bahagia'
              });
            }
          }}
        />
        <div className='vv-closing-copy'><small>Terima kasih</small><div className='vv-closing-divider' aria-hidden='true'><i/><b>✦</b><i/></div><p>Merupakan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.</p><h2><b>{groom}</b><span>&amp;</span><b>{bride}</b></h2><time>{date(eventDate,{day:'numeric',month:'long',year:'numeric'})}</time>
          <strong>DAYMOMENT</strong>
        </div>
      </section>
       <TemplateFooter className='vv-template-footer'/>
      </>}
    </div>
    {opened && cinematicDone && <nav className={'vv-nav '+(menuOpen?'is-expanded':'')} ref={navRef} aria-label='Navigasi undangan'>
      <button type='button' className='vv-nav-mobile-toggle' aria-expanded={menuOpen} onClick={() => setMenuOpen(value=>!value)}>{menuOpen?'Tutup':'Menu'}</button>
      <div className='vv-nav-scroller'><span className='vv-nav-group'>Undangan</span>
        {sections.map(([id,label])=><button key={id} type='button' data-section-id={id} className={activeNormalRef.current===id?'is-active':''} aria-current={activeNormalRef.current===id?'location':undefined} onClick={()=>navigateSection(id)}>{label}</button>)}
      </div>
    </nav>}
    {i.has_music && i.music_file && (
      <audio
        ref={audioRef}
        data-wedding-audio
        loop
        preload="auto"
        src={mediaUrl(i.music_file)}
        onPlay={() => setMusicPlaying(true)}
        onPause={() => setMusicPlaying(false)}
      />
    )}
    {opened && i.has_music && i.music_file && (
      <button type='button' className={'vv-music-toggle '+(musicPlaying?'is-playing':'')} onClick={toggleMusic} aria-label={musicPlaying?'Matikan musik':'Putar musik'}>♫</button>
    )}

    {lightbox && lightbox.items[lightbox.index] && (
      <div
        className="vv-lightbox is-open"
        role="dialog"
        aria-modal="true"
        aria-label="Lihat foto penuh"
        onClick={() => setLightbox(null)}
      >
        <div className="vv-lightbox-backdrop" aria-hidden="true" />
        <button
          className="vv-lightbox-close"
          type="button"
          onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
          aria-label="Tutup tampilan foto"
        >
          <VvIcon name="vv-close" />
        </button>
        {lightbox.items.length > 1 && (
          <>
            <button
              className="vv-lightbox-nav prev"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
              aria-label="Foto sebelumnya"
            >
              <VvIcon name="vv-chevron-left" />
            </button>
            <button
              className="vv-lightbox-nav next"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
              aria-label="Foto berikutnya"
            >
              <VvIcon name="vv-chevron-right" />
            </button>
          </>
        )}
        <div
          className="vv-lightbox-dialog"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (lightbox.items.length <= 1) return;
            const diff = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(diff) > 42) {
              if (diff < 0) nextPhoto();
              else prevPhoto();
            }
          }}
        >
          <div className="vv-lightbox-frame">
            <img
              className="vv-lightbox-img"
              src={lightbox.items[lightbox.index].src}
              alt={lightbox.items[lightbox.index].title || 'Foto ukuran penuh'}
            />
          </div>
          <div className="vv-lightbox-caption">
            <strong>{lightbox.items[lightbox.index].title}</strong>
            {lightbox.items[lightbox.index].caption && <p>{lightbox.items[lightbox.index].caption}</p>}
            {lightbox.items.length > 1 && (
              <span className="vv-lightbox-counter">
                {lightbox.index + 1} / {lightbox.items.length}
              </span>
            )}
          </div>
        </div>
      </div>
    )}
  </main>;
}
