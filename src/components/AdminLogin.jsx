import React, { useState } from 'react';
import { post } from '../lib/api.js';

export default function AdminLogin({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setWorking(true);
    setMessage('');
    try {
      await post('/api/admin/login', { password });
      onSuccess();
    } catch (failure) {
      setMessage(failure.message);
    } finally {
      setWorking(false);
    }
  };

  return <section className="admin-login">
    <div className="admin-login-card">
      <div className="admin-login-mark">D</div>
      <span className="eyebrow">Area terbatas · Daymoment</span>
      <h1>Selamat datang kembali</h1>
      <p>Masuk untuk memantau order, pemasukan, dan website customer.</p>
      <form onSubmit={submit}>
        <label>
          <span>Password admin</span>
          <div className="admin-password-field">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoFocus required placeholder="Masukkan password kamu" />
            <button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}><span aria-hidden="true" /></button>
          </div>
        </label>
        {message && <div className="admin-login-error">{message}</div>}
        <button className="button button-primary button-wide" type="submit" disabled={working}>{working ? 'Memeriksa...' : 'Masuk ke dashboard'}</button>
      </form>
      <small className="admin-login-note">Akses ini khusus pemilik Daymoment.</small>
    </div>
  </section>;
}
