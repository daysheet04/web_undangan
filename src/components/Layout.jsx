import React, { useEffect, useState } from 'react';
import { useBodyClass, useDocumentTitle, useHeadLinks } from '../lib/hooks.js';

export function Layout({ children, title, className = '', navigation = null }) {
  useBodyClass(className);
  useDocumentTitle(title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('beranda');
  const [isScrolled, setIsScrolled] = useState(false);
  const bodyClasses = String(className || '').split(/\s+/).filter(Boolean);
  const scopedNavigation = Boolean(navigation?.scoped);
  const homeHref = navigation?.homeHref || '/';
  const templateTargetId = navigation?.templateTargetId || 'templates';
  const templateHref = navigation?.templateHref || `/#${templateTargetId}`;
  const templateLabel = navigation?.templateLabel || 'Template';
  const stepsTargetId = navigation?.stepsTargetId || 'cara-kerja';
  const stepsHref = navigation?.stepsHref || `/#${stepsTargetId}`;
  const stepsLabel = navigation?.stepsLabel || 'Langkah Pemesanan';
  const showSecondaryNavigation = navigation?.showSecondary !== false;
  const showAffiliateNavigation = navigation?.showAffiliate !== false;
  const stylesReady = useHeadLinks([
    '/assets/css/app.css?v=20261113-nav',
    ...(bodyClasses.some((name) => ['homepage', 'order-page', 'preview-page'].includes(name)) ? ['/assets/css/homepage.css', '/assets/css/homepage-overrides.css?v=20261127-modal-fit-v3'] : []),
    ...(bodyClasses.includes('affiliate-store-page') ? ['/assets/css/affiliate-store.css'] : []),
    ...(bodyClasses.includes('admin-page') ? ['/assets/css/admin.css', '/assets/css/admin-withdrawals.css', '/assets/css/admin-commissions.css', '/assets/css/admin-orders.css', '/assets/css/admin-free-orders.css'] : []),
  ]);

  useEffect(() => {
    window.showToast = (message, type = 'success') => {
      const region = document.getElementById('toastRegion');
      if (!region) return;
      const toast = document.createElement('div');
      toast.className = `toast${type === 'error' ? ' error' : ''}`;
      toast.textContent = message;
      region.appendChild(toast);
      window.setTimeout(() => toast.remove(), 3800);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth > 768) setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update activeNav and isScrolled on scroll
  useEffect(() => {
    let lastScrolled = window.scrollY > 20;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (!lastScrolled && scrollY > 24) {
        lastScrolled = true;
        setIsScrolled(true);
      } else if (lastScrolled && scrollY < 12) {
        lastScrolled = false;
        setIsScrolled(false);
      }

      const scrollPos = scrollY + 160;
      const caraKerjaEl = document.getElementById(stepsTargetId);
      const templatesEl = document.getElementById(templateTargetId);
      const atBottom = window.innerHeight + scrollY >= document.documentElement.scrollHeight - 24;

      if (caraKerjaEl && (caraKerjaEl.getBoundingClientRect().top <= 180 || (atBottom && scrollY > 40))) {
        setActiveNav(stepsTargetId);
      } else if (templatesEl && templatesEl.getBoundingClientRect().top <= 180) {
        setActiveNav(templateTargetId);
      } else {
        setActiveNav('beranda');
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [stepsTargetId, templateTargetId, stylesReady]);

  // Scroll to URL hash once layout styles are ready and target section mounts (supports async page loading)
  useEffect(() => {
    if (!stylesReady) return undefined;

    let cancelled = false;
    let observer = null;
    let safetyTimer = 0;
    let frameOne = 0;
    let frameTwo = 0;

    const cleanupPending = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (safetyTimer) {
        window.clearTimeout(safetyTimer);
        safetyTimer = 0;
      }
      if (frameOne) {
        window.cancelAnimationFrame(frameOne);
        frameOne = 0;
      }
      if (frameTwo) {
        window.cancelAnimationFrame(frameTwo);
        frameTwo = 0;
      }
    };

    const resolveTargetElement = (hash) => {
      const direct = document.getElementById(hash);
      if (direct) return direct;
      if ((hash.startsWith('affiliate-template-') || hash.startsWith('template-card-')) && templateTargetId) {
        return document.getElementById(templateTargetId);
      }
      return null;
    };

    const scrollToCurrentHash = () => {
      cleanupPending();
      const rawHash = window.location.hash.replace(/^#/, '');
      if (!rawHash) return;
      let hash = rawHash;
      try {
        hash = decodeURIComponent(rawHash);
      } catch {
        hash = rawHash;
      }

      const tryScroll = () => {
        if (cancelled) return false;
        const target = resolveTargetElement(hash);
        if (!target) return false;
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        if (safetyTimer) {
          window.clearTimeout(safetyTimer);
          safetyTimer = 0;
        }
        frameOne = window.requestAnimationFrame(() => {
          frameTwo = window.requestAnimationFrame(() => {
            if (cancelled) return;
            target.scrollIntoView({ behavior: 'auto', block: 'start' });
            if (hash === stepsTargetId) {
              setActiveNav(stepsTargetId);
            } else if (hash === templateTargetId || hash.startsWith('affiliate-template-') || hash.startsWith('template-card-')) {
              setActiveNav(templateTargetId);
            }
          });
        });
        return true;
      };

      if (tryScroll()) return;

      observer = new MutationObserver(() => {
        tryScroll();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      safetyTimer = window.setTimeout(() => {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      }, 8000);
    };

    const markCancelled = () => {
      cancelled = true;
      cleanupPending();
    };
    const handleHashChange = () => {
      cancelled = false;
      scrollToCurrentHash();
    };

    window.addEventListener('wheel', markCancelled, { passive: true, once: true });
    window.addEventListener('touchstart', markCancelled, { passive: true, once: true });
    window.addEventListener('hashchange', handleHashChange);

    scrollToCurrentHash();

    return () => {
      cancelled = true;
      cleanupPending();
      window.removeEventListener('wheel', markCancelled);
      window.removeEventListener('touchstart', markCancelled);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [stylesReady, stepsTargetId, templateTargetId]);

  const handleNavClick = (e, targetId) => {
    setMenuOpen(false);
    setActiveNav(targetId);
    const normalizePath = (p) => String(p || '/').replace(/\/+$/, '') || '/';
    const onHomePage = normalizePath(window.location.pathname) === normalizePath(homeHref);
    if (scopedNavigation) {
      if (!onHomePage) return;
      e.preventDefault();
      if (targetId === 'beranda') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.replaceState(null, '', homeHref);
        return;
      }

      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.replaceState(null, '', `${homeHref}#${targetId}`);
      }
      return;
    }
    if (targetId === 'beranda') {
      if (onHomePage) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.replaceState(null, '', homeHref);
      }
      return;
    }
    if (onHomePage) {
      const el = document.getElementById(targetId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.replaceState(null, '', `#${targetId}`);
      }
    }
  };

  if (!stylesReady) return <Loading fullscreen />;
  return <>
    <header className="site-header-wrapper">
      <div className={`site-header-pill ${isScrolled ? 'is-scrolled' : ''} ${menuOpen ? 'menu-expanded' : ''}`}>
        <a className="brand" href={homeHref} aria-label="Daymoment, kembali ke beranda" onClick={(e) => handleNavClick(e, 'beranda')}>
          <img className="brand-logo brand-logo-wordmark" src="/assets/images/brand/daymoment-logo.webp" alt="Daymoment" width="112" height="40" loading="eager" decoding="async" />
        </a>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Navigasi desktop">
          <a
            href={homeHref}
            className={`desktop-nav-link ${activeNav === 'beranda' ? 'is-active' : ''}`}
            onClick={(e) => handleNavClick(e, 'beranda')}
          >
            Beranda
          </a>
          {showSecondaryNavigation && <>
          <a
            href={templateHref}
            className={`desktop-nav-link ${activeNav === templateTargetId ? 'is-active' : ''}`}
            onClick={(e) => handleNavClick(e, templateTargetId)}
          >
            {templateLabel}
          </a>
          <a
            href={stepsHref}
            className={`desktop-nav-link ${activeNav === stepsTargetId ? 'is-active' : ''}`}
            onClick={(e) => handleNavClick(e, stepsTargetId)}
          >
            {stepsLabel}
          </a>
          </>}
          {showAffiliateNavigation && <a className="affiliate-nav-btn" href="/affiliate">
            <span>Affiliate</span>
            <span className="nav-arrow">↗</span>
          </a>}
        </nav>

        {/* Mobile Hamburger Toggle Button (Dark rounded button matching reference) */}
        <button
          type="button"
          className={`hamburger-button ${menuOpen ? 'is-active' : ''}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-card"
        >
          <span className="hamburger-line line-1" />
          <span className="hamburger-line line-2" />
          <span className="hamburger-line line-3" />
        </button>
      </div>

      {/* Mobile Floating Card Dropdown (Matching reference) */}
      <div
        id="mobile-nav-card"
        className={`mobile-nav-floating-card ${menuOpen ? 'is-open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <nav className="mobile-nav-links-list" aria-label="Navigasi mobile">
          <a
            href={homeHref}
            className={`mobile-nav-link-item ${activeNav === 'beranda' ? 'is-active' : ''}`}
            onClick={(e) => handleNavClick(e, 'beranda')}
          >
            Beranda
          </a>
          {showSecondaryNavigation && <>
          <a
            href={templateHref}
            className={`mobile-nav-link-item ${activeNav === templateTargetId ? 'is-active' : ''}`}
            onClick={(e) => handleNavClick(e, templateTargetId)}
          >
            {templateLabel}
          </a>
          <a
            href={stepsHref}
            className={`mobile-nav-link-item ${activeNav === stepsTargetId ? 'is-active' : ''}`}
            onClick={(e) => handleNavClick(e, stepsTargetId)}
          >
            {stepsLabel}
          </a>
          </>}
          {showAffiliateNavigation && <a
            href="/affiliate"
            className="mobile-nav-cta-item"
            onClick={() => setMenuOpen(false)}
          >
            <span>Program Affiliate</span>
            <span className="cta-arrow">↗</span>
          </a>}
        </nav>
      </div>
    </header>

    {/* Backdrop for closing when tapping outside */}
    <div
      className={`mobile-menu-backdrop ${menuOpen ? 'is-open' : ''}`}
      onClick={() => setMenuOpen(false)}
      aria-hidden="true"
    />

    <main>{children}</main>
    <div className="toast-region" id="toastRegion" aria-live="polite" aria-atomic="true" />
  </>;
}

export function Loading({ showLabel = false, fullscreen = false }) {
  const [animDelay] = useState(() => (typeof performance !== 'undefined' ? -Math.round(performance.now() % 1450) : 0));
  return (
    <div className={fullscreen ? 'app-loading app-loading-fullscreen' : 'app-loading'} role="status" aria-live="polite" aria-label="Sedang memuat">
      <img className="app-loading-logo" src="/assets/images/brand/daymoment-logo.webp" alt="" width="900" height="323" aria-hidden="true" style={{ animationDelay: `${animDelay}ms` }} />
      {showLabel && <p>Memuat Daymoment…</p>}
    </div>
  );
}

export function ErrorState({ error, homeHref = '/' }) {
  return (
    <div className="app-error">
      <div>
        <h1>Maaf, terjadi kesalahan.</h1>
        <p>{error?.message || 'Data tidak dapat dimuat.'}</p>
        <a href={homeHref}>Kembali ke beranda</a>
      </div>
    </div>
  );
}
