import React, { lazy, Suspense } from 'react';

const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const AffiliateLandingPage = lazy(() => import('./pages/AffiliateLandingPage.jsx'));
const AffiliateStorePage = lazy(() => import('./pages/AffiliateStorePage.jsx'));
const TemplatePreviewPage = lazy(() => import('./pages/TemplatePreviewPage.jsx'));
const InvitationPage = lazy(() => import('./pages/InvitationPage.jsx'));
const OrderPage = lazy(() => import('./pages/OrderPage.jsx'));
const PaymentPage = lazy(() => import('./pages/PaymentPage.jsx'));
const BuilderPage = lazy(() => import('./pages/BuilderPage.jsx'));
const SuccessPage = lazy(() => import('./pages/SuccessPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

function RouteLoading() {
  return <div className="invitation-loading" role="status" aria-label="Memuat halaman"><span className="invitation-loading-mark" aria-hidden="true" /></div>;
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  let match;
  let page;
  if (path === '/') page = <HomePage />;
  else if (path === '/affiliate') page = <AffiliateLandingPage />;
  else if ((match = path.match(/^\/ref\/([A-Za-z0-9]+)$/))) page = <AffiliateStorePage referralCode={match[1]} />;
  else if (path === '/admin') page = <NotFoundPage />;
  else if (path === '/order') page = <OrderPage />;
  else if ((match = path.match(/^\/template\/([a-z0-9_]+)$/))) {
    page = new URLSearchParams(window.location.search).get('embed') === '1'
      ? <InvitationPage templateCode={match[1]} preview />
      : <TemplatePreviewPage code={match[1]} />;
  } else if ((match = path.match(/^\/payment\/([A-Za-z0-9-]+)$/))) page = <PaymentPage code={match[1]} />;
  else if ((match = path.match(/^\/edit\/([a-f0-9]{64})$/))) page = <BuilderPage token={match[1]} />;
  else if ((match = path.match(/^\/success\/([a-f0-9]{64})$/))) page = <SuccessPage token={match[1]} />;
  else if ((match = path.match(/^\/([a-z0-9]+(?:-[a-z0-9]+)*)$/))) page = <InvitationPage slug={match[1]} />;
  else if (!page) page = <NotFoundPage />;
  return <Suspense fallback={<RouteLoading />}>{page}</Suspense>;
}
