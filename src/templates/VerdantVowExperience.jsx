import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mediaUrl } from '../lib/api.js';
import VerdantOpeningScene from './verdant-vow/VerdantOpeningScene.jsx';
import VerdantCinematicJourney from './verdant-vow/VerdantCinematicJourney.jsx';
import './verdant-vow/experience.css';

const BASE = '/assets/images/templates/verdant-vow';
const LAYER = BASE + '/layers';
const STORY = BASE + '/story';
const GALLERY = BASE + '/gallery';
const GIFT = BASE + '/gift';
const RSVP = BASE + '/rsvp';
const CLOSING = BASE + '/closing';
const detectPerformanceTier = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'balanced';
  if (!window.matchMedia('(max-width: 800px)').matches) return 'high';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'low';
  const memory = Number(navigator.deviceMemory || 0);
  const cores = Number(navigator.hardwareConcurrency || 0);
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const renderedPixels = window.innerWidth * window.innerHeight * Math.pow(window.devicePixelRatio || 1,2);
  let pressure = 0;
  if (memory && memory <= 3) pressure += 2;
  else if (memory && memory <= 4) pressure += 1;
  if (cores && cores <= 4) pressure += 2;
  else if (cores && cores <= 6) pressure += 1;
  if (renderedPixels > 4000000) pressure += 1;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) pressure += 2;
  return pressure >= 3 ? 'low' : pressure >= 1 ? 'balanced' : 'high';
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
function Person({ role, name, nickname, photo, father, mother }) {
  return <article className='vv-person-card'>{photo && <img src={mediaUrl(photo)} alt={name} loading='lazy' decoding='async'/>}<div><small>{role}</small><h3>{name}</h3><p>{role === 'Mempelai pria' ? 'Putra' : 'Putri'} dari<br/>{father || 'Bapak'} &amp; {mother || 'Ibu'}</p><span>{nickname}</span></div></article>;
}

export default function VerdantVowExperience({ invitation:i, media=[], giftAccounts=[], greetings=[], guestName='Bapak/Ibu/Saudara/i', preview=false }) {
  const groom = i.groom_nickname || 'Raka', bride = i.bride_nickname || 'Alya';
  const groomFull = i.groom_full_name || groom, brideFull = i.bride_full_name || bride;
  const eventDate = i.reception_date || i.akad_date;
  const photos = media.slice(0, Math.max(1,Number(i.gallery_limit || 5)));
  const [performanceTier,setPerformanceTier] = useState(detectPerformanceTier);
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
  const [clock,setClock] = useState(Date.now), [musicPlaying,setMusicPlaying] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState('');
  const [submittingGreeting, setSubmittingGreeting] = useState(false);
  const [greetingFeedback, setGreetingFeedback] = useState({ text: '', type: '' });
  const audioRef = useRef(null);
  const scrollRef = useRef(null);
  const journeyReadyRef = useRef(false);
  const cinematicHandoffTimerRef = useRef();
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
  const countdown = useMemo(() => {
    const target = new Date(String(eventDate || '').slice(0,10) + 'T00:00:00');
    const remaining = Math.max(0,(Number.isNaN(target.getTime()) ? clock : target.getTime())-clock);
    return [Math.floor(remaining/86400000),Math.floor(remaining/3600000)%24,Math.floor(remaining/60000)%60,Math.floor(remaining/1000)%60];
  },[eventDate,clock]);

  useEffect(() => {
    if (!opened) return undefined;
    const timer = window.setInterval(() => setClock(Date.now()),1000);
    if (i.has_music && i.music_file && audioRef.current) audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {});
    return () => window.clearInterval(timer);
  },[opened,i.has_music,i.music_file]);
  useEffect(() => {
    if (!opened || !cinematicDone) return undefined;
    const root = scrollRef.current;
    if (!root) return undefined;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
      if (visible) setActiveNormal(visible.target.id);
    },{root,rootMargin:'-14% 0px -55% 0px',threshold:[0,.1,.3,.6]});
    sections.forEach(([id]) => { const element = root.querySelector('#'+id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  },[opened,cinematicDone,i.love_story,i.has_gift,i.has_wishes]);

  // Keep the final WebGL frame mounted while the first invitation section is
  // committed and brought into view. Removing the canvas before React commits
  // the target leaves a full viewport of fallback background behind.
  useEffect(() => {
    if (!opened || !cinematicDone) return undefined;
    const root = scrollRef.current;
    const target = normalRef.current;
    if (!root || !target) return undefined;

    const frame = window.requestAnimationFrame(() => {
      root.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
      cinematicHandoffTimerRef.current = window.setTimeout(() => {
        setJourneyMounted(false);
        window.requestAnimationFrame(() => root.scrollTo({ top: 0, behavior: 'auto' }));
      }, 1100);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(cinematicHandoffTimerRef.current);
    };
  },[opened,cinematicDone,replayId]);
  // One observer drives every content block, so reveals follow the viewport instead
  // of firing an entire section at once.
  useEffect(() => {
    if (!opened || !cinematicDone) return undefined;
    const root = scrollRef.current;
    if (!root) return undefined;
    const experience = root.closest('.vv-redesign');
    const mobileReveal = window.matchMedia('(max-width: 800px)').matches;
    const selectors = [
      '.vv-wedding-stage > .vv-after-heading',
      '.vv-wedding-stage > p',
      '.vv-wedding-stage > h3',
      '.vv-wedding-stage > time',
      '.vv-wedding-stage > .vv-countdown-grid',
      '.vv-full-couple > .vv-after-heading',
      '.vv-person-card',
      '.vv-person-amp',
      '.vv-full-events > .vv-after-heading',
      '.vv-event-card',
      '.vv-story-glass',
      '.vv-story-photo',
      '.vv-gallery > .vv-after-heading',
      '.vv-gallery-grid figure',
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
    const getRevealVariant = (el,index) => {
      if (el.matches('.vv-wedding-stage > .vv-after-heading')) return 'vv-reveal-left';
      if (el.matches('.vv-wedding-stage > p')) return 'vv-reveal-type';
      if (el.matches('.vv-wedding-stage > h3')) return 'vv-reveal-bounce';
      if (el.matches('.vv-wedding-stage > time')) return 'vv-reveal-right';
      if (el.matches('.vv-wedding-stage > .vv-countdown-grid')) return 'vv-reveal-up';
      if (el.matches('.vv-full-couple > .vv-after-heading')) return 'vv-reveal-up';
      if (el.matches('.vv-person-card')) return el === el.parentElement?.querySelector('.vv-person-card') ? 'vv-reveal-left' : 'vv-reveal-right';
      if (el.matches('.vv-person-amp')) return 'vv-reveal-zoom';
      if (el.matches('.vv-full-events > .vv-after-heading')) return 'vv-reveal-zoom';
      if (el.matches('.vv-event-card')) return el === el.parentElement?.querySelector('.vv-event-card') ? 'vv-reveal-left' : 'vv-reveal-right';
      if (el.matches('.vv-story-glass')) return 'vv-reveal-left';
      if (el.matches('.vv-story-photo')) return 'vv-reveal-right';
      if (el.matches('.vv-gallery > .vv-after-heading')) return 'vv-reveal-up';
      if (el.matches('.vv-gallery-grid figure')) return ['vv-reveal-left','vv-reveal-up','vv-reveal-right','vv-reveal-zoom'][index%4];
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
    const sectionOrder = new Map();
    targets.forEach((el,index) => {
      const section = el.closest('.vv-after');
      const order = sectionOrder.get(section) || 0;
      sectionOrder.set(section, order + 1);
      el.classList.add('vv-scroll-reveal',getRevealVariant(el,index));
      const delay = mobileReveal ? Math.min(order * 110, 440) : Math.min(order * 85, 340);
      el.style.setProperty('--vv-reveal-delay', `${delay}ms`);
    });
    experience?.classList.add('has-component-reveals');

    const componentObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        if (entry.isIntersecting) {
          el.dataset.vvRevealSeen = 'true';
          el.classList.remove('is-component-exiting-up');
          el.classList.add('is-component-visible');
        } else if (el.dataset.vvRevealSeen === 'true') {
          el.classList.remove('is-component-visible');
          el.classList.toggle('is-component-exiting-up', entry.boundingClientRect.top < (entry.rootBounds?.top || 0));
        }
      });
    }, {
      root,
      rootMargin: '0px 0px -9% 0px',
      threshold: [0, 0.18, 0.45]
    });
    targets.forEach(el => componentObserver.observe(el));

    return () => {
      componentObserver.disconnect();
      experience?.classList.remove('has-component-reveals');
      targets.forEach(el => {
        el.classList.remove('vv-scroll-reveal','is-component-visible','is-component-exiting-up',...revealVariants);
        el.style.removeProperty('--vv-reveal-delay');
        delete el.dataset.vvRevealSeen;
      });
    };
  }, [opened, cinematicDone, replayId, photos.length, greetings.length]);

  // Unified section phase coordinator with cached offsets (Zero reflow during active touch scroll)
  useEffect(() => {
    if (!opened || !cinematicDone) return undefined;
    const root = scrollRef.current;
    if (!root) return undefined;

    let cachedMetrics = [];
    let frame = 0;

    const measureMetrics = () => {
      const vh = root.clientHeight || window.innerHeight;
      const configs = [
        { ref: normalRef, setter: setOpeningPhase, enter: 0.58, leave: 0.72 },
        { ref: coupleRef, setter: setCouplePhase, enter: 0.64, leave: 0.88 },
        { ref: eventsRef, setter: setEventsPhase, enter: 0.64, leave: 0.88 },
        { ref: storyRef, setter: setStoryPhase, enter: 0.64, leave: 0.90, active: Boolean(i.love_story) },
        { ref: galleryRef, setter: setGalleryPhase, enter: 0.64, leave: 0.94 },
        { ref: giftRef, setter: setGiftPhase, enter: 0.64, leave: 0.92, active: Boolean(i.has_gift) },
        { ref: rsvpRef, setter: setRsvpPhase, enter: 0.64, leave: 0.96, active: Boolean(i.has_wishes) },
        { ref: closingRef, setter: setClosingPhase, enter: 0.64, leave: 0.98 },
      ];

      cachedMetrics = configs
        .filter(c => c.active !== false && c.ref.current)
        .map(c => {
          const el = c.ref.current;
          const top = el.offsetTop;
          const height = Math.max(el.offsetHeight, 1);
          return {
            setter: c.setter,
            enterAt: top - vh * c.enter,
            leaveAt: top + height * c.leave,
            phase: null,
          };
        });
    };

    const updatePhases = () => {
      frame = 0;
      if (!cachedMetrics.length) measureMetrics();
      const st = root.scrollTop;

      for (let idx = 0; idx < cachedMetrics.length; idx += 1) {
        const m = cachedMetrics[idx];
        const next = st >= m.leaveAt ? 'leaving' : (st >= m.enterAt ? 'visible' : 'idle');
        if (m.phase !== next) {
          m.phase = next;
          m.setter(next);
        }
      }
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updatePhases);
    };

    const onResize = () => {
      measureMetrics();
      if (!frame) frame = window.requestAnimationFrame(updatePhases);
    };

    measureMetrics();
    updatePhases();

    root.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    const resizeObserver = new ResizeObserver(onResize);
    [normalRef, coupleRef, eventsRef, storyRef, galleryRef, giftRef, rsvpRef, closingRef]
      .forEach(sectionRef => {
        if (sectionRef.current) resizeObserver.observe(sectionRef.current);
      });

    return () => {
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      resizeObserver.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [opened, cinematicDone, replayId, i.love_story, i.has_gift, i.has_wishes, photos.length]);

  // Runtime safety net: device hints are incomplete on iOS, so sample actual
  // scroll-frame pacing and progressively reduce visual load when needed.
  useEffect(() => {
    if (!opened || !cinematicDone || performanceTier === 'low' || !window.matchMedia('(max-width: 800px)').matches) return undefined;
    const root = scrollRef.current;
    if (!root) return undefined;
    let frame = 0;
    let lastFrame = 0;
    let activeUntil = 0;
    let samples = [];

    const sampleFrames = now => {
      if (lastFrame) samples.push(now-lastFrame);
      lastFrame = now;
      if (samples.length >= 16) {
        const ordered = [...samples].sort((a,b) => a-b);
        const average = samples.reduce((sum,value) => sum+value,0)/samples.length;
        const p80 = ordered[Math.floor(ordered.length*.8)];
        frame = 0;
        lastFrame = 0;
        samples = [];
        if (average > 22 || p80 > 27) {
          setPerformanceTier(current => current === 'high' ? 'balanced' : 'low');
          return;
        }
      }
      if (now < activeUntil && document.visibilityState === 'visible') frame = window.requestAnimationFrame(sampleFrames);
      else {
        frame = 0;
        lastFrame = 0;
        samples = [];
      }
    };

    const onScroll = () => {
      activeUntil = performance.now()+520;
      if (!frame) frame = window.requestAnimationFrame(sampleFrames);
    };
    root.addEventListener('scroll',onScroll,{passive:true});
    return () => {
      root.removeEventListener('scroll',onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  },[opened,cinematicDone,performanceTier]);

  const finishCinematic = useCallback(() => {
    setCinematicDone(true);
  },[]);
  const replayCinematic = useCallback(() => {
    const root = scrollRef.current;
    if (root) root.scrollTo({ top: 0, behavior: 'auto' });
    setOpened(false);
    setCinematicDone(false);
    setJourneyMounted(true);
    setJourneyStarted(false);
    setJourneyReady(false);
    setOpeningPhase('idle');
    setEventsPhase('idle');
    setCouplePhase('idle');
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
  },[]);
  const startJourney = useCallback(() => setJourneyStarted(true),[]);
  const markJourneyReady = useCallback(() => setJourneyReady(true),[]);
  const navigateSection = id => {
    setMenuOpen(false);
    setActiveNormal(id);
    const root = scrollRef.current;
    const target = root?.querySelector('#'+id);
    if (root && target) root.scrollTo({ top: target.offsetTop, behavior:'smooth' });
  };
  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) { audioRef.current.pause(); setMusicPlaying(false); }
    else audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {});
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
    {!opened && <VerdantOpeningScene bride={bride} groom={groom} guestName={guestName} date={date(eventDate)} sceneReady={journeyReady} autoEnter={autoReplayOpening} onPrepare={prepareJourney} onStart={startJourney} onEnter={finishOpening}/>}
    <div className='vv-scroll' ref={scrollRef} inert={!opened ? '' : undefined} aria-hidden={!opened}>
      <section className={'vv-journey '+(cinematicDone && !journeyMounted ? 'is-retired' : '')} id='vv-journey'>
        {journeyMounted && <VerdantCinematicJourney invitation={i} bride={bride} groom={groom} brideFull={brideFull} groomFull={groomFull} dateLabel={date(eventDate,{day:'numeric',month:'long',year:'numeric'})} runId={replayId} active={journeyStarted} onReady={markJourneyReady} onComplete={finishCinematic}/>}
      </section>
      {cinematicDone && <>
      <section className={'vv-after vv-full-opening '+(openingPhase === 'visible' ? 'is-revealed' : openingPhase === 'leaving' ? 'is-leaving' : '')} id='vv-full-opening' ref={normalRef}>
        <div className='vv-wedding-ornaments' aria-hidden='true'>
          <img className='vv-wedding-ornament-left' src={LAYER+'/section-wedding-edge-ornament-indonesian-v2.webp'} alt='' loading='lazy' decoding='async'/>
          <img className='vv-wedding-ornament-right' src={LAYER+'/section-wedding-edge-ornament-indonesian-v2.webp'} alt='' loading='lazy' decoding='async'/>
          <img className='vv-wedding-bottom-ornament vv-wedding-bottom-ornament-left' src={LAYER+'/section-wedding-mobile-bottom-ornament-indonesian-v2.webp'} alt='' loading='lazy' decoding='async'/>
          <img className='vv-wedding-bottom-ornament vv-wedding-bottom-ornament-right' src={LAYER+'/section-wedding-mobile-bottom-ornament-indonesian-v2.webp'} alt='' loading='lazy' decoding='async'/>
        </div>
        <button type='button' className='vv-replay-cinematic' onClick={replayCinematic}>Ulangi Cinematic</button>
        <div className='vv-wedding-stage'>
          <div className='vv-after-heading'><small>Dengan penuh rasa syukur</small><h2>The Wedding</h2></div>
          <p>Kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menjadi bagian dari hari bahagia kami.</p>
          <h3>{groom} <i>&amp;</i> {bride}</h3><time>{date(eventDate)}</time>
          <div className='vv-countdown-grid'>{countdown.map((value,index) => <span key={index}><b>{String(value).padStart(2,'0')}</b><small>{['Hari','Jam','Menit','Detik'][index]}</small></span>)}</div>
        </div>
      </section>
      <section className={'vv-after vv-full-couple '+(couplePhase === 'visible' ? 'is-revealed' : couplePhase === 'leaving' ? 'is-leaving' : '')} id='vv-full-couple' ref={coupleRef}>
        <div className='vv-couple-ornaments' aria-hidden='true'>
          <img src={LAYER+'/section-couple-janur-orbit-ornament-v2.webp'} alt='' loading='lazy' decoding='async'/>
          <img src={LAYER+'/section-couple-janur-orbit-ornament-v2.webp'} alt='' loading='lazy' decoding='async'/>
        </div>
        <div className='vv-couple-sparkles' aria-hidden='true'><i/><i/><i/><i/><i/><i/><i/><i/></div>
        <div className='vv-after-heading'><small>Dua hati yang dipertemukan</small><h2>Mempelai</h2></div>
        <div className='vv-person-grid'>
          <Person role='Mempelai pria' name={groomFull} nickname={groom} photo={i.groom_photo || media[1]?.file_path || i.cover_image} father={i.groom_father} mother={i.groom_mother}/>
          <span className='vv-person-amp'>&amp;</span>
          <Person role='Mempelai wanita' name={brideFull} nickname={bride} photo={i.bride_photo || media[0]?.file_path || i.cover_image} father={i.bride_father} mother={i.bride_mother}/>
        </div>
      </section>

        <section className={'vv-after vv-full-events '+(eventsPhase === 'visible' ? 'is-revealed' : eventsPhase === 'leaving' ? 'is-leaving' : '')} id='vv-full-events' ref={eventsRef}>
        <div className='vv-events-ornaments' aria-hidden='true'>
          <img className='vv-events-corner vv-events-corner-tl' src={LAYER+'/events-janur-melati-corner-v2.webp'} alt='' loading='lazy' decoding='async'/>
          <img className='vv-events-corner vv-events-corner-tr' src={LAYER+'/events-janur-melati-corner-v2.webp'} alt='' loading='lazy' decoding='async'/>
          <img className='vv-events-corner vv-events-corner-bl' src={LAYER+'/events-janur-melati-corner-v2.webp'} alt='' loading='lazy' decoding='async'/>
          <img className='vv-events-corner vv-events-corner-br' src={LAYER+'/events-janur-melati-corner-v2.webp'} alt='' loading='lazy' decoding='async'/>
        </div>
        <div className='vv-events-sparkles' aria-hidden='true'>{Array.from({length: 10}, (_, n) => <i key={n}/>)}</div>
        <div className='vv-after-heading'><small>Catat hari bahagia kami</small><h2>Rangkaian Acara</h2></div>
        <div className='vv-event-grid'>
          <EventCard title='Akad Nikah' day={i.akad_date} start={i.akad_start_time} end={i.akad_end_time} venue={i.venue_name} address={i.venue_address} maps={i.maps_url}/>
          <EventCard title='Resepsi' day={i.reception_date} start={i.reception_start_time} end={i.reception_end_time} venue={i.venue_name} address={i.venue_address} maps={i.maps_url}/>
        </div>
      </section>
       {i.love_story && <section className={'vv-after vv-story '+(storyPhase === 'visible' ? 'is-revealed' : storyPhase === 'leaving' ? 'is-leaving' : '')} id='vv-full-story' ref={storyRef}>
        <div className='vv-story-ornaments' aria-hidden='true'>
          <img className='vv-story-side vv-story-side-left' src={STORY+'/story-side-ornament-indonesian-v1.webp'} alt='' loading='lazy' decoding='async'/>
          <img className='vv-story-side vv-story-side-right' src={STORY+'/story-side-ornament-indonesian-v1.webp'} alt='' loading='lazy' decoding='async'/>
          <span className='vv-story-glint vv-story-glint-one'/>
          <span className='vv-story-glint vv-story-glint-two'/>
          <span className='vv-story-glint vv-story-glint-three'/>
        </div>
        <div className='vv-story-glass'>
          <div className='vv-after-heading'><small>Kisah yang tumbuh</small><h2><span>Kisah</span><span>Kami</span></h2></div>
          <div className='vv-story-divider' aria-hidden='true'><i/><b>◆</b><i/></div>
          <p>{i.love_story}</p>
          <div className='vv-story-signature' aria-label={groom+' dan '+bride}><span>{groom}</span><i>&amp;</i><span>{bride}</span></div>
        </div>
        {(i.cover_image || media[0]?.file_path) && <figure className='vv-story-photo'>
          <div className='vv-story-photo-window'>
            <img className='vv-story-photo-img' src={mediaUrl(i.cover_image || media[0]?.file_path)} alt={groom+' dan '+bride} loading='lazy' decoding='async'/>
            <img className='vv-story-frame-overlay' src={STORY+'/story-photo-frame-indonesian-v1.webp'} alt='' aria-hidden='true' loading='lazy' decoding='async'/>
          </div>
          <figcaption><small>Catatan perjalanan</small><span>Tumbuh, memilih, dan pulang bersama.</span></figcaption>
        </figure>}
      </section>}
       <section className={'vv-after vv-gallery '+(galleryPhase === 'visible' ? 'is-revealed' : galleryPhase === 'leaving' ? 'is-leaving' : '')} id='vv-full-gallery' ref={galleryRef}>
        <div className='vv-gallery-ornaments' aria-hidden='true'>
          <img className='vv-gallery-corner vv-gallery-corner-tl' src={GALLERY+'/gallery-corner-ornament-indonesian-v1.webp'} alt='' loading='lazy' decoding='async'/>
          <img className='vv-gallery-corner vv-gallery-corner-tr' src={GALLERY+'/gallery-corner-ornament-indonesian-v1.webp'} alt='' loading='lazy' decoding='async'/>
          <img className='vv-gallery-corner vv-gallery-corner-bl' src={GALLERY+'/gallery-corner-ornament-indonesian-v1.webp'} alt='' loading='lazy' decoding='async'/>
          <img className='vv-gallery-corner vv-gallery-corner-br' src={GALLERY+'/gallery-corner-ornament-indonesian-v1.webp'} alt='' loading='lazy' decoding='async'/>
          <i/><i/><i/><i/>
        </div>
        <div className='vv-after-heading'><small>Potongan waktu yang kami simpan</small><h2>Galeri</h2><span aria-hidden='true'>Album Kenangan</span></div>
        {photos.length?<div className={'vv-gallery-grid vv-gallery-count-'+Math.min(photos.length,6)}>{photos.map((photo,index)=><figure key={photo.id || index}><div className='vv-gallery-photo'><img src={mediaUrl(photo.file_path)} alt={'Momen '+(index+1)} loading='lazy' decoding='async'/></div><figcaption><span>Memory</span><b>{String(index+1).padStart(2,'0')}</b></figcaption></figure>)}</div>:<p className='vv-empty'>Momen bahagia akan segera hadir.</p>}
      </section>
       {i.has_gift && <section className={'vv-after vv-gift vv-gift-redesign '+(giftPhase === 'visible' ? 'is-revealed' : giftPhase === 'leaving' ? 'is-leaving' : '')} id='vv-full-gift' ref={giftRef}>
        <div className='vv-gift-ornaments' aria-hidden='true'>
          <img className='vv-gift-seserahan vv-gift-seserahan-left' src={GIFT+'/gift-seserahan-ornament-indonesian-v1.webp'} alt='' loading='lazy' decoding='async'/>
          <img className='vv-gift-seserahan vv-gift-seserahan-right' src={GIFT+'/gift-seserahan-ornament-indonesian-v1.webp'} alt='' loading='lazy' decoding='async'/>
          <span className='vv-gift-gunungan'/>
        </div>
        <div className='vv-gift-sparkles' aria-hidden='true'>{Array.from({length: 8}, (_, n) => <i key={n}/>)}</div>
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
        <div className='vv-rsvp-ornaments' aria-hidden='true'>
          <img className='vv-rsvp-ledger' src={RSVP+'/rsvp-guestbook-ornament-v1.webp'} alt='' loading='lazy' decoding='async'/>
          <span className='vv-rsvp-contour vv-rsvp-contour-left'/>
          <span className='vv-rsvp-contour vv-rsvp-contour-right'/>
          <i/><i/><i/><i/><i/><i/>
        </div>
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
        <div className='vv-closing-ornaments' aria-hidden='true'>
          <img className='vv-closing-canopy' src={CLOSING+'/closing-pendopo-canopy-ornament-v1.webp'} alt='' loading='lazy' decoding='async'/>
          <span className='vv-closing-floor-sigil'/>
          <i/><i/><i/><i/><i/><i/>
        </div>
        <img className='vv-closing-couple' src={LAYER+'/couple-cinematic-v2.webp'} alt='' loading='lazy' decoding='async'/>
        <div className='vv-closing-copy'><small>Terima kasih</small><div className='vv-closing-divider' aria-hidden='true'><i/><b>✦</b><i/></div><p>Merupakan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.</p><h2><b>{groom}</b><span>&amp;</span><b>{bride}</b></h2><time>{date(eventDate,{day:'numeric',month:'long',year:'numeric'})}</time>
          <strong>DAYMOMENT · BY DAYSHEET GROUP</strong>
        </div>
      </section>
      </>}
    </div>
    {opened && cinematicDone && <nav className={'vv-nav '+(menuOpen?'is-expanded':'')} aria-label='Navigasi undangan'>
      <button type='button' className='vv-nav-mobile-toggle' aria-expanded={menuOpen} onClick={() => setMenuOpen(value=>!value)}>{menuOpen?'Tutup':'Menu'}</button>
      <div className='vv-nav-scroller'><span className='vv-nav-group'>Undangan</span>
        {sections.map(([id,label])=><button key={id} type='button' className={activeNormal===id?'is-active':''} aria-current={activeNormal===id?'location':undefined} onClick={()=>navigateSection(id)}>{label}</button>)}
      </div>
    </nav>}
    {opened && i.has_music && i.music_file && <><audio ref={audioRef} data-wedding-audio loop src={mediaUrl(i.music_file)}/><button type='button' className={'vv-music-toggle '+(musicPlaying?'is-playing':'')} onClick={toggleMusic} aria-label={musicPlaying?'Matikan musik':'Putar musik'}>♫</button></>}
  </main>;
}
