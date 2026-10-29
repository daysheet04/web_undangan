import React, { useEffect } from 'react';
import { useBodyClass, useDocumentTitle, useHeadLinks } from '../lib/hooks.js';
import './admin-mobile.css';

export default function AdminTemplate({ children, title = 'Admin Dashboard — Daymoment', sidebar }) {
  useBodyClass('admin-page');
  useDocumentTitle(title);
  useHeadLinks(['/assets/css/app.css', '/assets/css/admin.css?v=20261021-mobile-v7', '/assets/css/admin-withdrawals.css?v=20261022-status-v2', '/assets/css/admin-commissions.css?v=20261021-mobile-v7', '/assets/css/admin-orders.css?v=20261022-1', '/assets/css/admin-free-orders.css?v=20261022-1', '/assets/css/admin-feedback.css?v=20261022-1', '/assets/css/admin-notifications.css?v=20261022-2', '/assets/css/admin-customer-access.css?v=20261023-editor-v3', '/assets/css/admin-cover-adjuster.css?v=20261023-1', '/assets/css/admin-dashboard-summary.css?v=20261028-profit-v1', '/assets/css/admin-template-editor.css?v=20261029-v7']);
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
      <a className="admin-template-brand" href="/" aria-label="Daymoment Admin">
        <span className="admin-template-brand-logo" aria-hidden="true">
          <img className="admin-brand-logo-white" src="/assets/images/brand/daymoment-logo-white.webp" alt="Daymoment" />
        </span>
        <small className="admin-template-brand-label">Admin Panel</small>
      </a>
      <span className="admin-template-label">Private workspace</span>
      {sidebar}
    </header>
    <main>{children}</main>
    <div className="toast-region" id="toastRegion" aria-live="polite" aria-atomic="true" />
  </>;
}
