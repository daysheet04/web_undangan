import React, { lazy, Suspense } from 'react';
import AdminPage from './pages/AdminPage.jsx';

const TemplatePreviewPage = lazy(() => import('./pages/TemplatePreviewPage.jsx'));
const InvitationPage = lazy(() => import('./pages/InvitationPage.jsx'));

function RouteLoading() {
  return (
    <div className="invitation-loading" role="status" aria-label="Memuat halaman">
      <img className="invitation-loading-logo" src="/assets/images/brand/daymoment-logo.webp" alt="" aria-hidden="true" />
    </div>
  );
}

export default function AdminApp() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  let match;
  if (path === '/' || path === '/admin') return <AdminPage />;
  if ((match = path.match(/^\/template\/([a-z0-9_]+)$/))) {
    const isEmbed = new URLSearchParams(window.location.search).get('embed') === '1';
    return (
      <Suspense fallback={<RouteLoading />}>
        {isEmbed ? <InvitationPage templateCode={match[1]} preview /> : <TemplatePreviewPage code={match[1]} />}
      </Suspense>
    );
  }
  if ((match = path.match(/^\/undangan\/([a-z0-9_]+)$/))) {
    return (
      <Suspense fallback={<RouteLoading />}>
        <InvitationPage templateCode={match[1]} preview />
      </Suspense>
    );
  }
  return (
    <main className="app-error">
      <div>
        <span className="eyebrow">Daymoment Admin</span>
        <h1>Halaman tidak ditemukan</h1>
        <p>Alamat tersebut tidak tersedia di workspace admin.</p>
        <a className="button button-primary" href="/">Kembali ke dashboard</a>
      </div>
    </main>
  );
}
