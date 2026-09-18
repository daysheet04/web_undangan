import React, { useEffect } from 'react';
import { useBodyClass, useDocumentTitle, useHeadLinks } from '../lib/hooks.js';

export default function AdminTemplate({ children, title = 'Admin Dashboard — Daymoment', sidebar }) {
  useBodyClass('admin-page');
  useDocumentTitle(title);
  useHeadLinks(['/assets/css/app.css', '/assets/css/admin.css']);
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
    <header className="admin-template-header">
      <a className="admin-template-brand" href="/admin" aria-label="Daymoment Admin">
        <span className="admin-template-mark">D</span>
        <span><strong>Daymoment</strong><small>Admin workspace</small></span>
      </a>
      <span className="admin-template-label">Private workspace</span>
      {sidebar}
    </header>
    <main>{children}</main>
    <div className="toast-region" id="toastRegion" aria-live="polite" aria-atomic="true" />
  </>;
}