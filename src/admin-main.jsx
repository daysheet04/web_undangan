import React from 'react';
import { createRoot } from 'react-dom/client';
import AdminApp from './AdminApp.jsx';
import AppErrorBoundary from './components/AppErrorBoundary.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<AppErrorBoundary><AdminApp /></AppErrorBoundary>);
