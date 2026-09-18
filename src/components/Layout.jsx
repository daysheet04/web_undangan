import React, { useEffect } from 'react';
import { useBodyClass, useDocumentTitle, useHeadLinks } from '../lib/hooks.js';

export function Layout({ children, title, className = '' }) {
  useBodyClass(className);
  useDocumentTitle(title);
  useHeadLinks(['/assets/css/app.css', ...(['homepage', 'order-page', 'preview-page'].includes(className) ? ['/assets/css/homepage.css'] : []), ...(className === 'admin-page' ? ['/assets/css/admin.css'] : [])]);
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
  return <>
    <header className="site-header">
      <a className="brand" href="/" aria-label="Daymoment, kembali ke beranda">
        <img className="brand-logo" src="/assets/images/brand/daymoment-mark.svg" alt="" />
        <span className="brand-copy"><strong>Daymoment</strong><small>by Daysheet Group</small></span>
      </a>
      <nav aria-label="Navigasi utama"><a href="/#templates">Template</a><a href="/#cara-kerja">Cara kerja</a></nav>
    </header>
    <main>{children}</main>
    <div className="toast-region" id="toastRegion" aria-live="polite" aria-atomic="true" />
  </>;
}

export function Loading() { return <div className="app-loading"><p>Memuat Daymoment…</p></div>; }
export function ErrorState({ error }) { return <div className="app-error"><div><h1>Maaf, terjadi kesalahan.</h1><p>{error?.message || 'Data tidak dapat dimuat.'}</p><a href="/">Kembali ke beranda</a></div></div>; }
