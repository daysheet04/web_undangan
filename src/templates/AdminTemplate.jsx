import React, { memo, useEffect } from 'react';
import { useBodyClass, useDocumentTitle, useHeadLinks } from '../lib/hooks.js';
import './admin-mobile.css';

const ADMIN_HEAD_LINKS = import.meta.env.DEV
  ? [
      '/assets/css/app.css',
      '/assets/css/admin.css?v=20261127-perf-v1',
      '/assets/css/admin-withdrawals.css?v=20261127-perf-v1',
      '/assets/css/admin-commissions.css?v=20261021-mobile-v7',
      '/assets/css/admin-affiliate-commissions.css?v=20261127-perf-v1',
      '/assets/css/admin-orders.css?v=20261127-perf-v1',
      '/assets/css/admin-free-orders.css?v=20261022-1',
      '/assets/css/admin-demo-links.css?v=20261123-2',
      '/assets/css/admin-feedback.css?v=20261127-perf-v1',
      '/assets/css/admin-notifications.css?v=20261127-perf-v1',
      '/assets/css/admin-customer-access.css?v=20261127-perf-v1',
      '/assets/css/admin-cover-adjuster.css?v=20261127-perf-v1',
      '/assets/css/admin-dashboard-summary.css?v=20261127-perf-v1',
      '/assets/css/admin-template-editor.css?v=20261127-perf-v1',
      '/assets/css/vintage-color-customizer.css?v=20261120-3',
      '/assets/css/admin-affiliate-traffic.css?v=20261127-perf-v1',
    ]
  : ['/assets/css/admin-bundle.css?v=20261127-perf-v2'];

const AdminTemplate = memo(function AdminTemplate({ children, title = 'Admin Dashboard — Daymoment', sidebar }) {
  useBodyClass('admin-page');
  useDocumentTitle(title);
  useHeadLinks(ADMIN_HEAD_LINKS);
  useEffect(() => {
    if (window.showToast) return;
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
      <a className="admin-template-brand" href="/" aria-label="Daymoment Admin">
        <span className="admin-template-brand-logo" aria-hidden="true">
          <img className="admin-brand-logo-white" src="/assets/images/brand/daymoment-logo-white.webp" alt="Daymoment" decoding="async" />
        </span>
        <small className="admin-template-brand-label">Admin Panel</small>
      </a>
      <span className="admin-template-label">Private workspace</span>
      {sidebar}
    </header>
    <main>{children}</main>
    <div className="toast-region" id="toastRegion" aria-live="polite" aria-atomic="true" />
  </>;
});

export default AdminTemplate;
