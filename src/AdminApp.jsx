import React from 'react';
import AdminPage from './pages/AdminPage.jsx';

export default function AdminApp() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/admin') return <AdminPage />;
  return <main className="app-error"><div><span className="eyebrow">Daymoment Admin</span><h1>Halaman tidak ditemukan</h1><p>Alamat tersebut tidak tersedia di workspace admin.</p><a className="button button-primary" href="/">Kembali ke dashboard</a></div></main>;
}
