import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import AppErrorBoundary from './components/AppErrorBoundary.jsx';
import './styles.css';

// The bundled shell styles are available once this module runs. Do not keep
// the HTML boot veil around while route data or template assets are fetched.
document.documentElement.classList.add('app-styles-ready');

createRoot(document.getElementById('root')).render(<AppErrorBoundary><App /></AppErrorBoundary>);
