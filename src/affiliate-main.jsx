import React from 'react';
import { createRoot } from 'react-dom/client';
import AffiliateApp from './AffiliateApp.jsx';
import AppErrorBoundary from './components/AppErrorBoundary.jsx';
import './affiliate.css';

createRoot(document.getElementById('root')).render(
  <AppErrorBoundary><AffiliateApp /></AppErrorBoundary>
);

document.documentElement.classList.add('app-styles-ready');

