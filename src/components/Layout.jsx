import React, { useEffect, useState } from 'react';
import { useBodyClass, useDocumentTitle, useHeadLinks } from '../lib/hooks.js';

export function Layout({ children, title, className = '' }) {
  useBodyClass(className);
  useDocumentTitle(title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('beranda');
  const [isScrolled, setIsScrolled] = useState(false);
  const bodyClasses = String(className || '').split(/\s+/).filter(Boolean);
  const stylesReady = useHeadLinks([
    '/assets/css/app.css',
    ...(bodyClasses.some((name) => ['homepage', 'order-page', 'preview-page'].includes(name)) ? ['/assets/css/homepage.css'] : []),
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
      const caraKerjaEl = document.getElementById('cara-kerja');
      const templatesEl = document.getElementById('templates');

      if (caraKerjaEl && scrollPos >= caraKerjaEl.offsetTop) {
        setActiveNav('cara-kerja');
      } else if (templatesEl && scrollPos >= templatesEl.offsetTop) {
        setActiveNav('templates');
      } else {
        setActiveNav('beranda');
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, targetId) => {
    setMenuOpen(false);
    setActiveNav(targetId);
    if (targetId === 'beranda') {
      if (window.location.pathname === '/' || window.location.pathname === '') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.replaceState(null, '', '/');
      }
      return;
    }
    if (window.location.pathname === '/' || window.location.pathname === '') {
      const el = document.getElementById(targetId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.replaceState(null, '', `#${targetId}`);
      }
    }
  };

  if (!stylesReady) return <Loading />;
  return <>
    <header className="site-header-wrapper">
      <div className={`site-header-pill ${isScrolled ? 'is-scrolled' : ''} ${menuOpen ? 'menu-expanded' : ''}`}>
        <a className="brand" href="/" aria-label="Daymoment, kembali ke beranda" onClick={(e) => handleNavClick(e, 'beranda')}>
          <img className="brand-logo brand-logo-wordmark" src="/assets/images/brand/daymoment-logo.webp" alt="Daymoment" width="112" height="40" loading="eager" decoding="async" />
        </a>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Navigasi desktop">
          <a
            href="/"
            className={`desktop-nav-link ${activeNav === 'beranda' ? 'is-active' : ''}`}
            onClick={(e) => handleNavClick(e, 'beranda')}
          >
            Beranda
          </a>
          <a
            href="/#templates"
            className={`desktop-nav-link ${activeNav === 'templates' ? 'is-active' : ''}`}
            onClick={(e) => handleNavClick(e, 'templates')}
          >
            Template
          </a>
          <a
            href="/#cara-kerja"
            className={`desktop-nav-link ${activeNav === 'cara-kerja' ? 'is-active' : ''}`}
            onClick={(e) => handleNavClick(e, 'cara-kerja')}
          >
            Langkah Pemesanan
          </a>
          <a className="affiliate-nav-btn" href="/affiliate">
            <span>Affiliate</span>
            <span className="nav-arrow">↗</span>
          </a>
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
            href="/"
            className={`mobile-nav-link-item ${activeNav === 'beranda' ? 'is-active' : ''}`}
            onClick={(e) => handleNavClick(e, 'beranda')}
          >
            Beranda
          </a>
          <a
            href="/#templates"
            className={`mobile-nav-link-item ${activeNav === 'templates' ? 'is-active' : ''}`}
            onClick={(e) => handleNavClick(e, 'templates')}
          >
            Template
          </a>
          <a
            href="/#cara-kerja"
            className={`mobile-nav-link-item ${activeNav === 'cara-kerja' ? 'is-active' : ''}`}
            onClick={(e) => handleNavClick(e, 'cara-kerja')}
          >
            Langkah Pemesanan
          </a>
          <a
            href="/affiliate"
            className="mobile-nav-cta-item"
            onClick={() => setMenuOpen(false)}
          >
            <span>Program Affiliate</span>
            <span className="cta-arrow">↗</span>
          </a>
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

export function Loading({ showLabel = false }) {
  return (
    <div className="app-loading" role="status" aria-live="polite" aria-label="Sedang memuat">
      <img className="app-loading-logo" src="/assets/images/brand/daymoment-logo.webp" alt="" aria-hidden="true" />
      {showLabel && <p>Memuat Daymoment…</p>}
    </div>
  );
}

export function ErrorState({ error }) {
  return (
    <div className="app-error">
      <div>
        <h1>Maaf, terjadi kesalahan.</h1>
        <p>{error?.message || 'Data tidak dapat dimuat.'}</p>
        <a href="/">Kembali ke beranda</a>
      </div>
    </div>
  );
}
