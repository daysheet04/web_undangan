import React from 'react';
import HomePage from './pages/HomePage.jsx';
import TemplatePreviewPage from './pages/TemplatePreviewPage.jsx';
import InvitationPage from './pages/InvitationPage.jsx';
import OrderPage from './pages/OrderPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import BuilderPage from './pages/BuilderPage.jsx';
import SuccessPage from './pages/SuccessPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  let match;
  if (path === '/') return <HomePage />;
  if (path === '/order') return <OrderPage />;
  if ((match = path.match(/^\/template\/([a-z0-9_]+)$/))) {
    return new URLSearchParams(window.location.search).get('embed') === '1'
      ? <InvitationPage templateCode={match[1]} preview />
      : <TemplatePreviewPage code={match[1]} />;
  }
  if ((match = path.match(/^\/payment\/([A-Za-z0-9-]+)$/))) return <PaymentPage code={match[1]} />;
  if ((match = path.match(/^\/edit\/([a-f0-9]{64})$/))) return <BuilderPage token={match[1]} />;
  if ((match = path.match(/^\/success\/([a-f0-9]{64})$/))) return <SuccessPage token={match[1]} />;
  if ((match = path.match(/^\/([a-z0-9]+(?:-[a-z0-9]+)*)$/))) return <InvitationPage slug={match[1]} />;
  return <NotFoundPage />;
}
