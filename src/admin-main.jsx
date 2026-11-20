import React from 'react';
import { createRoot } from 'react-dom/client';
import AdminApp from './AdminApp.jsx';
import AppErrorBoundary from './components/AppErrorBoundary.jsx';
import './styles.css';

document.documentElement.classList.add('app-styles-ready');

createRoot(document.getElementById('root')).render(<AppErrorBoundary><AdminApp /></AppErrorBoundary>);
