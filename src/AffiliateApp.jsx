import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { affiliateApi, friendlyAffiliateError } from './lib/affiliateApi.js';
import { MAIN_APP_URL } from './lib/urls.js';

const cleanPath = () => window.location.pathname.replace(/\/+$/, '') || '/';

const DashboardNavigationContext = createContext(null);
const AffiliateToolsContext = createContext(null);

function DashboardLink({ to, onClick, children, ...props }) {
  const navigate = useContext(DashboardNavigationContext);
  const handleClick = (event) => {
    onClick?.(event);
    if (event.defaultPrevented || !navigate || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };
  return <a href={to} onClick={handleClick} {...props}>{children}</a>;
}

function Brand() {
  return <a className="affiliate-brand" href={MAIN_APP_URL} aria-label="Kembali ke Daymoment"><i className="affiliate-brand-mark">D</i><span><strong>Daymoment</strong><small>Affiliate Partner</small></span></a>;
}

function Field({ label, required, hint, ...props }) {
  return <label className="affiliate-field"><span>{label}{required && <b className="affiliate-required" aria-hidden="true"> *</b>}</span><input required={required} {...props}/>{hint && <small>{hint}</small>}</label>;
}

function PasswordField({ label, required, ...props }) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();
  return <div className="affiliate-field affiliate-password-field">
    <label htmlFor={inputId}>{label}{required && <b className="affiliate-required" aria-hidden="true"> *</b>}</label>
    <div className="affiliate-password-control">
      <input id={inputId} required={required} {...props} type={visible ? 'text' : 'password'}/>
      <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Sembunyikan password' : 'Lihat password'} aria-pressed={visible} title={visible ? 'Sembunyikan password' : 'Lihat password'}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.6"/>{visible && <path className="affiliate-eye-slash" d="m4 4 16 16"/>}</svg>
      </button>
    </div>
  </div>;
}

function AuthShell({ children, asideTitle, asideCopy }) {
  return <main className="affiliate-auth-shell">
    <section className="affiliate-auth-panel">
      <header><Brand/><a href={`${MAIN_APP_URL}/affiliate`}>Tentang program</a></header>
      <div className="affiliate-auth-content">{children}</div>
      <footer>© {new Date().getFullYear()} Daymoment</footer>
    </section>
    <aside className="affiliate-auth-aside">
      <div className="affiliate-aside-pattern" aria-hidden="true"/>
      <span className="affiliate-aside-kicker">DAYMOMENT PARTNER</span>
      <h2>{asideTitle}</h2><p>{asideCopy}</p>
      <div className="affiliate-aside-card"><small>ALUR PARTNER</small><div><span>01</span><b>Daftar</b></div><div><span>02</span><b>Bagikan</b></div><div><span>03</span><b>Dapatkan komisi</b></div></div>
    </aside>
  </main>;
}

function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', nik: '', ktp: null, socialPlatform: '', socialHandle: '', socialFollowerCount: '', socialProof: null, phone: '', email: '', password: '', confirmation: '', accepted: false });
  const [socialPlatforms, setSocialPlatforms] = useState([]);
  const [state, setState] = useState({ loading: false, error: '', success: '' });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    let active = true;
    affiliateApi('/registration-options').then((result) => {
      if (!active) return;
      const platforms = result.social_platforms || [];
      setSocialPlatforms(platforms);
      setForm((current) => ({ ...current, socialPlatform: current.socialPlatform || platforms[0]?.name || '' }));
    }).catch((error) => { if (active) setState((current) => ({ ...current, error: friendlyAffiliateError(error) })); });
    return () => { active = false; };
  }, []);
  const submit = async (event) => {
    event.preventDefault();
    if (state.success || state.loading) return;
    if (!/^\d{16}$/.test(form.nik)) return setState({ loading: false, error: 'NIK wajib terdiri dari 16 digit angka.', success: '' });
    if (!form.ktp) return setState({ loading: false, error: 'Foto KTP wajib diunggah.', success: '' });
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(form.ktp.type)) return setState({ loading: false, error: 'Format foto KTP harus JPG, PNG, atau WEBP.', success: '' });
    if (form.ktp.size > 4 * 1024 * 1024) return setState({ loading: false, error: 'Ukuran foto KTP maksimal 4 MB.', success: '' });
    if (!form.socialPlatform) return setState({ loading: false, error: 'Pilih media sosial yang digunakan.', success: '' });
    if (form.socialHandle.trim().length < 2) return setState({ loading: false, error: 'Username atau nama akun media sosial wajib diisi.', success: '' });
    if (!/^\d+$/.test(form.socialFollowerCount)) return setState({ loading: false, error: 'Jumlah followers wajib diisi dengan angka.', success: '' });
    if (!form.socialProof) return setState({ loading: false, error: 'Screenshot akun media sosial wajib diunggah.', success: '' });
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(form.socialProof.type)) return setState({ loading: false, error: 'Format screenshot media sosial harus JPG, PNG, atau WEBP.', success: '' });
    if (form.socialProof.size > 4 * 1024 * 1024) return setState({ loading: false, error: 'Ukuran screenshot media sosial maksimal 4 MB.', success: '' });
    if (form.password.length < 8) return setState({ loading: false, error: 'Password minimal 8 karakter.', success: '' });
    if (form.password !== form.confirmation) return setState({ loading: false, error: 'Konfirmasi password belum sama.', success: '' });
    if (!form.accepted) return setState({ loading: false, error: 'Setujui syarat program affiliate untuk melanjutkan.', success: '' });
    setState({ loading: true, error: '', success: '' });
    try {
      const payload = new FormData();
      payload.append('fullName', form.fullName);
      payload.append('nik', form.nik);
      payload.append('ktp', form.ktp);
      payload.append('socialPlatform', form.socialPlatform);
      payload.append('socialHandle', form.socialHandle);
      payload.append('socialFollowerCount', form.socialFollowerCount);
      payload.append('socialProof', form.socialProof);
      payload.append('phone', form.phone);
      payload.append('email', form.email);
      payload.append('password', form.password);
      const result = await affiliateApi('/register', {
        method: 'POST',
        body: payload,
      });
      setState({ loading: false, error: '', success: result.message });
      setForm((current) => ({ ...current, password: '', confirmation: '', ktp: null, socialProof: null }));
    } catch (error) {
      setState({ loading: false, error: friendlyAffiliateError(error), success: '' });
    }
  };
  return <AuthShell asideTitle="Bagikan cerita baik lebih jauh." asideCopy="Jadilah bagian dari ekosistem Daymoment dan bantu lebih banyak pasangan menemukan undangan yang terasa personal.">
    <div className="affiliate-auth-heading"><span>BUAT AKUN PARTNER</span><h1>Daftar Affiliate</h1><p>Lengkapi data berikut. Setelah email terverifikasi, pendaftaran akan direview oleh admin Daymoment.</p></div>
    {state.error && <div className="affiliate-form-alert error" role="alert">{state.error}</div>}
    {state.success && <div className="affiliate-form-alert success" role="status">{state.success}<span>Link verifikasi berlaku selama 24 jam.</span></div>}
    <form className="affiliate-auth-form" onSubmit={submit}>
      <Field label="Nama lengkap" type="text" autoComplete="name" required minLength="2" maxLength="120" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Nama lengkapmu"/>
      <Field label="NIK" type="text" inputMode="numeric" autoComplete="off" required minLength="16" maxLength="16" pattern="[0-9]{16}" value={form.nik} onChange={(e) => update('nik', e.target.value.replace(/\D/g, '').slice(0, 16))} placeholder="16 digit NIK"/>
      <label className="affiliate-field affiliate-ktp-field">
        <span>Foto KTP<b className="affiliate-required" aria-hidden="true"> *</b></span>
        <input className="affiliate-ktp-input" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => update('ktp', event.target.files?.[0] || null)}/>
        <span className={`affiliate-ktp-upload ${form.ktp ? 'has-file' : ''}`}><b>{form.ktp ? form.ktp.name : 'Pilih foto KTP'}</b><small>JPG, PNG, atau WEBP · maksimal 4 MB</small></span>
      </label>
      <p className="affiliate-identity-note"><b>Pastikan data sesuai.</b> NIK, foto KTP, dan nama lengkap wajib sama agar pendaftaran dapat disetujui.</p>
      <div className="affiliate-social-registration">
        <div className="affiliate-social-heading"><span>DATA MEDIA SOSIAL</span><p>Informasi ini ikut diperiksa admin saat proses review pendaftaran.</p></div>
        <div className="affiliate-field-row">
          <OrderFilterDropdown label="Media sosial *" value={form.socialPlatform} disabled={!socialPlatforms.length} options={[{ value: '', label: 'Pilih media sosial', meta: socialPlatforms.length ? 'Pilih platform utama akunmu' : 'Belum ada platform aktif' }, ...socialPlatforms.map((platform) => ({ value: platform.name, label: platform.name, meta: 'Platform tersedia untuk pendaftaran' }))]} onChange={(value) => update('socialPlatform', value)}/>
          <Field label="Username / nama akun" type="text" required maxLength="120" value={form.socialHandle} onChange={(event) => update('socialHandle', event.target.value)} placeholder="Contoh: @namakamu"/>
        </div>
        <Field label="Jumlah followers" type="number" inputMode="numeric" required min="0" step="1" value={form.socialFollowerCount} onChange={(event) => update('socialFollowerCount', event.target.value.replace(/\D/g, ''))} placeholder="Masukkan jumlah followers"/>
        <label className="affiliate-field affiliate-ktp-field">
          <span>Screenshot akun media sosial<b className="affiliate-required" aria-hidden="true"> *</b></span>
          <input className="affiliate-ktp-input" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => update('socialProof', event.target.files?.[0] || null)}/>
          <span className={`affiliate-ktp-upload ${form.socialProof ? 'has-file' : ''}`}><b>{form.socialProof ? form.socialProof.name : 'Pilih screenshot akun'}</b><small>Pastikan username dan jumlah followers terlihat · maksimal 4 MB</small></span>
        </label>
      </div>
      <Field label="Nomor WhatsApp" type="tel" autoComplete="tel" required maxLength="24" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="08xxxxxxxxxx"/>
      <Field label="Email" type="email" autoComplete="email" required maxLength="254" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="nama@email.com"/>
      <div className="affiliate-field-row"><PasswordField label="Password" autoComplete="new-password" required minLength="8" maxLength="64" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Minimal 8 karakter"/><PasswordField label="Ulangi password" autoComplete="new-password" required minLength="8" maxLength="64" value={form.confirmation} onChange={(e) => update('confirmation', e.target.value)} placeholder="Ketik ulang password"/></div>
      <label className="affiliate-check"><input type="checkbox" required checked={form.accepted} onChange={(e) => update('accepted', e.target.checked)}/><span>Saya menyetujui syarat dan ketentuan Program Affiliate Daymoment.<b className="affiliate-required" aria-hidden="true"> *</b></span></label>
      <button className="affiliate-submit" type="submit" disabled={state.loading || Boolean(state.success)}>{state.loading ? 'Mendaftarkan akun…' : state.success ? 'Pendaftaran terkirim' : 'Daftar Affiliate'}<span>{state.success ? '✓' : '→'}</span></button>
    </form>
    <p className="affiliate-auth-switch">Sudah punya akun? <a href="/login">Login di sini</a></p>
  </AuthShell>;
}

function ReviewCorrectionPage() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', nik: '', ktp: null, socialPlatform: '', socialHandle: '', socialFollowerCount: '', socialProof: null, hasSocialProof: false, reviewNote: '' });
  const [socialPlatforms, setSocialPlatforms] = useState([]);
  const [state, setState] = useState({ loading: true, submitting: false, error: token ? '' : 'Tautan perbaikan tidak valid.', success: '' });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    let active = true;
    if (!token) {
      setState({ loading: false, submitting: false, error: 'Tautan perbaikan tidak valid.', success: '' });
      return () => { active = false; };
    }
    Promise.all([affiliateApi(`/review-correction?token=${encodeURIComponent(token)}`), affiliateApi('/registration-options')])
      .then(([result, options]) => {
        if (!active) return;
        const registration = result.registration || {};
        const platforms = options.social_platforms || [];
        setSocialPlatforms(platforms);
        setForm({ fullName: registration.full_name || '', email: registration.email || '', phone: registration.phone || '', nik: registration.nik || '', ktp: null, socialPlatform: registration.social_platform || platforms[0]?.name || '', socialHandle: registration.social_handle || '', socialFollowerCount: String(registration.social_follower_count ?? ''), socialProof: null, hasSocialProof: Boolean(registration.has_social_proof), reviewNote: registration.review_note || '' });
        setState({ loading: false, submitting: false, error: '', success: '' });
      })
      .catch((error) => { if (active) setState({ loading: false, submitting: false, error: friendlyAffiliateError(error), success: '' }); });
    return () => { active = false; };
  }, [token]);

  const submit = async (event) => {
    event.preventDefault();
    if (state.submitting || state.success) return;
    if (!/^\d{16}$/.test(form.nik)) return setState((current) => ({ ...current, error: 'NIK wajib terdiri dari 16 digit angka.' }));
    if (form.ktp && !['image/jpeg', 'image/png', 'image/webp'].includes(form.ktp.type)) return setState((current) => ({ ...current, error: 'Format foto KTP harus JPG, PNG, atau WEBP.' }));
    if (form.ktp && form.ktp.size > 4 * 1024 * 1024) return setState((current) => ({ ...current, error: 'Ukuran foto KTP maksimal 4 MB.' }));
    if (!form.socialPlatform || form.socialHandle.trim().length < 2 || !/^\d+$/.test(form.socialFollowerCount)) return setState((current) => ({ ...current, error: 'Lengkapi data media sosial dengan benar.' }));
    if (!form.hasSocialProof && !form.socialProof) return setState((current) => ({ ...current, error: 'Screenshot akun media sosial wajib diunggah.' }));
    if (form.socialProof && !['image/jpeg', 'image/png', 'image/webp'].includes(form.socialProof.type)) return setState((current) => ({ ...current, error: 'Format screenshot media sosial harus JPG, PNG, atau WEBP.' }));
    if (form.socialProof && form.socialProof.size > 4 * 1024 * 1024) return setState((current) => ({ ...current, error: 'Ukuran screenshot media sosial maksimal 4 MB.' }));
    setState((current) => ({ ...current, submitting: true, error: '' }));
    try {
      const payload = new FormData();
      payload.append('token', token);
      payload.append('fullName', form.fullName);
      payload.append('phone', form.phone);
      payload.append('nik', form.nik);
      if (form.ktp) payload.append('ktp', form.ktp);
      payload.append('socialPlatform', form.socialPlatform);
      payload.append('socialHandle', form.socialHandle);
      payload.append('socialFollowerCount', form.socialFollowerCount);
      if (form.socialProof) payload.append('socialProof', form.socialProof);
      const result = await affiliateApi('/review-correction', { method: 'POST', body: payload });
      setState({ loading: false, submitting: false, error: '', success: result.message });
    } catch (error) {
      setState((current) => ({ ...current, submitting: false, error: friendlyAffiliateError(error) }));
    }
  };

  return <AuthShell asideTitle="Perbaiki data, lanjutkan langkahmu." asideCopy="Ikuti catatan dari tim Daymoment agar identitasmu dapat diperiksa kembali dengan cepat dan aman.">
    <div className="affiliate-auth-heading"><span>PERBAIKAN PENDAFTARAN</span><h1>Perbarui Data</h1><p>Periksa kembali data berikut, lalu kirim ulang untuk masuk ke antrean review admin.</p></div>
    {state.error && <div className="affiliate-form-alert error" role="alert">{state.error}</div>}
    {state.success && <div className="affiliate-form-alert success" role="status">{state.success}<span>Kamu akan menerima email lagi setelah admin menyelesaikan review.</span></div>}
    {!state.loading && !state.error && !state.success && <>
      <div className="affiliate-correction-reason"><span>ALASAN PERLU DIPERBAIKI</span><strong>{form.reviewNote || 'Silakan periksa kembali kesesuaian data identitas.'}</strong></div>
      <form className="affiliate-auth-form" onSubmit={submit}>
        <Field label="Nama lengkap" type="text" autoComplete="name" required minLength="2" maxLength="120" value={form.fullName} onChange={(event) => update('fullName', event.target.value)}/>
        <Field label="Email terverifikasi" type="email" value={form.email} readOnly disabled/>
        <Field label="NIK" type="text" inputMode="numeric" required minLength="16" maxLength="16" pattern="[0-9]{16}" value={form.nik} onChange={(event) => update('nik', event.target.value.replace(/\D/g, '').slice(0, 16))}/>
        <label className="affiliate-field affiliate-ktp-field">
          <span>Ganti foto KTP <small>(opsional)</small></span>
          <input className="affiliate-ktp-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => update('ktp', event.target.files?.[0] || null)}/>
          <span className={`affiliate-ktp-upload ${form.ktp ? 'has-file' : ''}`}><b>{form.ktp ? form.ktp.name : 'Gunakan KTP lama atau pilih foto baru'}</b><small>JPG, PNG, atau WEBP · maksimal 4 MB</small></span>
        </label>
        <p className="affiliate-identity-note"><b>Pastikan data sesuai.</b> Nama lengkap, NIK, dan identitas pada foto KTP harus sama.</p>
        <div className="affiliate-social-registration">
          <div className="affiliate-social-heading"><span>DATA MEDIA SOSIAL</span><p>Perbarui bagian ini apabila disebutkan dalam catatan admin.</p></div>
          <div className="affiliate-field-row"><OrderFilterDropdown label="Media sosial *" value={form.socialPlatform} disabled={!socialPlatforms.length} options={[{ value: '', label: 'Pilih media sosial', meta: socialPlatforms.length ? 'Pilih platform pengganti' : 'Belum ada platform aktif' }, ...socialPlatforms.map((platform) => ({ value: platform.name, label: platform.name, meta: 'Platform tersedia untuk pendaftaran' }))]} onChange={(value) => update('socialPlatform', value)}/><Field label="Username / nama akun" type="text" required maxLength="120" value={form.socialHandle} onChange={(event) => update('socialHandle', event.target.value)}/></div>
          <Field label="Jumlah followers" type="number" required min="0" step="1" value={form.socialFollowerCount} onChange={(event) => update('socialFollowerCount', event.target.value.replace(/\D/g, ''))}/>
          <label className="affiliate-field affiliate-ktp-field"><span>Ganti screenshot media sosial <small>({form.hasSocialProof ? 'opsional' : 'wajib'})</small></span><input className="affiliate-ktp-input" type="file" accept="image/jpeg,image/png,image/webp" required={!form.hasSocialProof} onChange={(event) => update('socialProof', event.target.files?.[0] || null)}/><span className={`affiliate-ktp-upload ${form.socialProof ? 'has-file' : ''}`}><b>{form.socialProof ? form.socialProof.name : form.hasSocialProof ? 'Gunakan screenshot lama atau pilih file baru' : 'Pilih screenshot akun'}</b><small>JPG, PNG, atau WEBP · maksimal 4 MB</small></span></label>
        </div>
        <Field label="Nomor WhatsApp" type="tel" autoComplete="tel" required maxLength="24" value={form.phone} onChange={(event) => update('phone', event.target.value)}/>
        <button className="affiliate-submit" type="submit" disabled={state.submitting}>{state.submitting ? 'Mengirim perbaikan…' : 'Kirim ulang untuk direview'}<span>→</span></button>
      </form>
    </>}
    {state.loading && <div className="affiliate-form-alert success">Memeriksa tautan perbaikan…</div>}
    <p className="affiliate-auth-switch"><a href="/login">← Kembali ke login</a></p>
  </AuthShell>;
}

function LoginPage({ onLogin }) {
  const query = new URLSearchParams(window.location.search);
  const [form, setForm] = useState({ email: '', password: '' });
  const [state, setState] = useState({ loading: false, error: '' });
  const submit = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: '' });
    try {
      const result = await affiliateApi('/login', { method: 'POST', body: JSON.stringify(form) });
      onLogin(result.affiliate);
      window.history.replaceState({}, '', '/');
    } catch (error) {
      setState({ loading: false, error: friendlyAffiliateError(error) });
    }
  };
  return <AuthShell asideTitle="Selamat datang kembali." asideCopy="Masuk untuk melanjutkan perjalananmu sebagai partner dan menyiapkan link referral Daymoment.">
    <div className="affiliate-auth-heading"><span>AREA PARTNER</span><h1>Login Affiliate</h1><p>Gunakan akun yang emailnya sudah diverifikasi dan disetujui admin Daymoment.</p></div>
    {query.get('verified') === '1' && <div className="affiliate-form-alert success">Email berhasil diverifikasi. Pendaftaranmu sedang menunggu review admin Daymoment.</div>}
    {state.error && <div className="affiliate-form-alert error" role="alert">{state.error}</div>}
    <form className="affiliate-auth-form" onSubmit={submit}>
      <Field label="Email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com"/>
      <PasswordField label="Password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Masukkan password"/>
      <div className="affiliate-login-options"><a href="/forgot-password">Lupa password?</a></div>
      <button className="affiliate-submit" type="submit" disabled={state.loading}>{state.loading ? 'Memeriksa akun…' : 'Login'}<span>→</span></button>
    </form>
    <p className="affiliate-auth-switch">Belum punya akun? <a href="/register">Daftar affiliate</a></p>
  </AuthShell>;
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ loading: false, error: '', success: '' });
  const submit = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: '', success: '' });
    try {
      const result = await affiliateApi('/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setState({ loading: false, error: '', success: result.message });
    } catch (error) {
      setState({ loading: false, error: friendlyAffiliateError(error), success: '' });
    }
  };
  return <AuthShell asideTitle="Akses akunmu kembali." asideCopy="Kami akan mengirim tautan aman ke email partner yang terdaftar untuk membuat password baru.">
    <div className="affiliate-auth-heading"><span>PEMULIHAN AKUN</span><h1>Lupa Password</h1><p>Masukkan email akun affiliate. Tautan reset berlaku selama satu jam dan hanya dapat digunakan sekali.</p></div>
    {state.error && <div className="affiliate-form-alert error" role="alert">{state.error}</div>}
    {state.success && <div className="affiliate-form-alert success" role="status">{state.success}<span>Periksa juga folder spam atau promosi pada emailmu.</span></div>}
    <form className="affiliate-auth-form" onSubmit={submit}>
      <Field label="Email terdaftar" type="email" autoComplete="email" required maxLength="254" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com"/>
      <button className="affiliate-submit" type="submit" disabled={state.loading}>{state.loading ? 'Mengirim tautan…' : 'Kirim link reset'}<span>→</span></button>
    </form>
    <p className="affiliate-auth-switch"><a href="/login">← Kembali ke login</a></p>
  </AuthShell>;
}

function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [form, setForm] = useState({ newPassword: '', confirmation: '' });
  const [state, setState] = useState({ loading: false, error: token ? '' : 'Tautan reset password tidak valid.', success: '' });
  const submit = async (event) => {
    event.preventDefault();
    if (form.newPassword.length < 8) return setState({ loading: false, error: 'Password baru minimal 8 karakter.', success: '' });
    if (form.newPassword !== form.confirmation) return setState({ loading: false, error: 'Konfirmasi password baru belum sama.', success: '' });
    setState({ loading: true, error: '', success: '' });
    try {
      const result = await affiliateApi('/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, ...form }),
      });
      setForm({ newPassword: '', confirmation: '' });
      setState({ loading: false, error: '', success: result.message });
    } catch (error) {
      setState({ loading: false, error: friendlyAffiliateError(error), success: '' });
    }
  };
  return <AuthShell asideTitle="Buat password yang baru." asideCopy="Setelah password diperbarui, seluruh sesi lama akan dikeluarkan untuk menjaga keamanan akun partner.">
    <div className="affiliate-auth-heading"><span>RESET PASSWORD</span><h1>Password Baru</h1><p>Gunakan minimal 8 karakter dan hindari password yang sama dengan akun lain.</p></div>
    {state.error && <div className="affiliate-form-alert error" role="alert">{state.error}</div>}
    {state.success && <div className="affiliate-form-alert success" role="status">{state.success}</div>}
    {!state.success && <form className="affiliate-auth-form" onSubmit={submit}>
      <PasswordField label="Password baru" autoComplete="new-password" required minLength="8" maxLength="64" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} placeholder="Minimal 8 karakter"/>
      <PasswordField label="Ulangi password baru" autoComplete="new-password" required minLength="8" maxLength="64" value={form.confirmation} onChange={(event) => setForm({ ...form, confirmation: event.target.value })} placeholder="Ketik ulang password"/>
      <button className="affiliate-submit" type="submit" disabled={state.loading || !token}>{state.loading ? 'Menyimpan password…' : 'Simpan password baru'}<span>→</span></button>
    </form>}
    <p className="affiliate-auth-switch"><a href="/login">{state.success ? 'Login dengan password baru →' : '← Kembali ke login'}</a></p>
  </AuthShell>;
}

function VerifyEmailPage() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [state, setState] = useState({ loading: true, error: '', success: '' });
  useEffect(() => {
    let active = true;
    if (!token) {
      setState({ loading: false, error: 'Token verifikasi tidak ditemukan.', success: '' });
      return () => { active = false; };
    }
    affiliateApi('/verify-email', { method: 'POST', body: JSON.stringify({ token }) })
      .then((result) => { if (active) setState({ loading: false, error: '', success: result.message }); })
      .catch((error) => { if (active) setState({ loading: false, error: friendlyAffiliateError(error), success: '' }); });
    return () => { active = false; };
  }, [token]);

  return <AuthShell asideTitle="Selangkah lagi menjadi partner." asideCopy="Verifikasi memastikan alamat email benar dan menjaga akun Affiliate Daymoment tetap aman.">
    <div className="affiliate-verify-card">
      <span className={`affiliate-verify-icon ${state.error ? 'error' : ''}`}>{state.loading ? '…' : state.error ? '!' : '✓'}</span>
      <div className="affiliate-auth-heading"><span>VERIFIKASI EMAIL</span><h1>{state.loading ? 'Memverifikasi akun…' : state.error ? 'Verifikasi gagal' : 'Email terverifikasi'}</h1></div>
      {state.error && <div className="affiliate-form-alert error" role="alert">{state.error}</div>}
      {state.success && <div className="affiliate-form-alert success" role="status">{state.success}</div>}
      {!state.loading && <a className="affiliate-submit" href="/login?verified=1">Kembali ke halaman login <span>→</span></a>}
    </div>
  </AuthShell>;
}


function AffiliateHeadingTools({
  category,
  title,
  reloadFn,
}) {
  const tools = useContext(AffiliateToolsContext);
  if (!tools) return null;

  const {
    notificationsData,
    readMarkers,
    openHeadingNotif,
    onToggleNotif,
    headingRefreshing,
    onRefresh,
  } = tools;

  const items = category === 'all'
    ? (notificationsData.notifications.all || [])
    : (notificationsData.notifications[category] || []);

  const marker = readMarkers[category];
  const markerTime = marker ? new Date(marker).getTime() : 0;
  const unreadCount = items.filter((item) => new Date(item.created_at || 0).getTime() > markerTime).length;
  const isOpen = openHeadingNotif === category;
  const isSpinning = headingRefreshing === category;

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date);
  };

  return (
    <div className="affiliate-heading-tools">
      <div className="affiliate-notif-box">
        <button
          type="button"
          className={`affiliate-tool-btn affiliate-notif-btn ${unreadCount > 0 ? 'has-unread' : ''} ${isOpen ? 'is-open' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleNotif(category);
          }}
          title={unreadCount > 0 ? `${unreadCount} notifikasi baru (klik untuk tandai dibaca)` : `Notifikasi ${title}`}
          aria-label={`Notifikasi ${title}`}
        >
          <svg viewBox="0 0 24 24" fill={unreadCount > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && <span className="affiliate-notif-badge">{unreadCount}</span>}
        </button>

        {isOpen && (
          <div
            className="affiliate-notif-dropdown"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`Notifikasi ${title}`}
          >
            <div className="dropdown-head">
              <h4 className="dropdown-title">{title}</h4>
              <span className="dropdown-status-pill">{items.length} Notifikasi</span>
            </div>

            <div className="dropdown-body">
              {items.length === 0 ? (
                <div className="notif-empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.6 }}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p style={{ margin: 0 }}>Belum ada notifikasi pada kategori ini.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="notif-item"
                    onClick={() => {
                      onToggleNotif(null);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={`notif-item-avatar ${item.type}`}>
                      {item.type === 'order' ? '🛒' : item.type === 'withdrawal' ? '💸' : '⭐'}
                    </div>
                    <div className="notif-item-content">
                      <div className="notif-item-top">
                        <span className="notif-item-name">{item.title}</span>
                        {item.status_label && (
                          <span className={`notif-item-status ${String(item.status || '').toLowerCase()}`}>
                            {item.status_label}
                          </span>
                        )}
                      </div>
                      <p className="notif-item-desc">{item.snippet}</p>
                      <span className="notif-item-time">{formatRelativeTime(item.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="dropdown-foot">
              <span style={{ fontSize: '11px', color: '#687771', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Sudah ditandai dibaca
              </span>
              <button
                type="button"
                className="dropdown-close-btn"
                onClick={() => onToggleNotif(null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  backgroundColor: '#173f36',
                  border: '1px solid #173f36',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        className={`affiliate-tool-btn affiliate-refresh-btn ${isSpinning ? 'is-spinning' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onRefresh(category, reloadFn);
        }}
        title="Muat ulang data & notifikasi"
        aria-label="Muat ulang"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
          <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10"/><path d="M3 4v6h6"/><path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14"/><path d="M21 20v-6h-6"/>
        </svg>
      </button>
    </div>
  );
}

const dashboardMenus = [
  { path: '/dashboard', label: 'Ringkasan', icon: '01' },
  { path: '/products', label: 'Produk', icon: '02' },
  { path: '/links', label: 'Link Referral', icon: '03' },
  { path: '/orders', label: 'Pesanan', icon: '04' },
  { path: '/earnings', label: 'Penghasilan', icon: '05' },
  { path: '/withdrawals', label: 'Penarikan', icon: '06' },
  { path: '/profile', label: 'Profil', icon: '07' },
];

const rupiah = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(Number(value || 0));

async function copyText(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const area = document.createElement('textarea');
  area.value = value;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

const emptyDashboardFilters = { year: '', from: '', to: '' };

function storedDashboardFilters(affiliateId) {
  try {
    const saved = JSON.parse(localStorage.getItem(`daymoment-affiliate-dashboard:${affiliateId}`) || 'null');
    if (!saved || typeof saved !== 'object') return { ...emptyDashboardFilters };
    return Object.fromEntries(Object.keys(emptyDashboardFilters).map((key) => [key, typeof saved[key] === 'string' ? saved[key] : '']));
  } catch {
    return { ...emptyDashboardFilters };
  }
}

function DashboardOverview({ affiliate, catalog, orderData, onReloadOverview }) {
  const templates = catalog?.templates || [];
  const products = templates.flatMap((template) => template.products || []);
  const visibleProducts = templates.flatMap((template) => (template.products || []).filter((product) => product.is_visible).map((product) => ({ ...product, template_name: template.name })));
  const visibleTemplates = templates.filter((item) => item.visible_products > 0);
  const orders = orderData?.orders || [];
  const [filters, setFilters] = useState(() => storedDashboardFilters(affiliate.id));
  const [detail, setDetail] = useState('');
  const [chartSelection, setChartSelection] = useState(null);
  useEffect(() => {
    try { localStorage.setItem(`daymoment-affiliate-dashboard:${affiliate.id}`, JSON.stringify(filters)); } catch {}
  }, [affiliate.id, filters]);
  useEffect(() => {
    setChartSelection(null);
  }, [filters.year, filters.from, filters.to]);
  const availableYears = useMemo(() => [...new Set(orders.map((order) => orderDateKey(order.created_at).slice(0, 4)).filter(Boolean))].sort((left, right) => right.localeCompare(left)), [orders]);
  const filteredOrders = useMemo(() => orders.filter((order) => {
    const date = orderDateKey(order.created_at);
    if (!date) return false;
    if (filters.year) return date.startsWith(`${filters.year}-`);
    if (filters.from && date < filters.from) return false;
    if (filters.to && date > filters.to) return false;
    return true;
  }), [orders, filters]);
  const paidOrders = filteredOrders.filter((order) => order.payment_status === 'paid');
  const pendingOrders = filteredOrders.filter((order) => order.payment_status !== 'paid');
  const commissionEarned = paidOrders.reduce((total, order) => total + Number(order.affiliate_commission_amount || 0), 0);
  const commissionPending = pendingOrders.reduce((total, order) => total + Number(order.affiliate_commission_amount || 0), 0);
  const hasFilters = Boolean(filters.year || filters.from || filters.to);
  const periodLabel = filters.year
    ? `Januari–Desember ${filters.year}`
    : filters.from || filters.to
      ? `${filters.from || 'Awal'} sampai ${filters.to || 'Sekarang'}`
      : 'Semua waktu';
  const yearOptions = [{ value: '', label: 'Semua tahun', meta: 'Gunakan rentang tanggal atau semua data' }, ...availableYears.map((year) => ({ value: year, label: year, meta: 'Januari sampai Desember' }))];
  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    if (key === 'from' && value && next.to && value > next.to) next.to = '';
    if (key === 'to' && value && next.from && value < next.from) next.from = '';
    setFilters(next);
  };
  const chartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    let buckets = [];
    if (filters.year) {
      buckets = monthNames.map((label, index) => ({ key: `${filters.year}-${String(index + 1).padStart(2, '0')}`, label }));
    } else {
      const rangeStart = filters.from ? new Date(`${filters.from}T00:00:00+07:00`) : null;
      const rangeEnd = filters.to ? new Date(`${filters.to}T00:00:00+07:00`) : null;
      const rangeDays = rangeStart && rangeEnd ? Math.round((rangeEnd - rangeStart) / 86400000) : null;
      if (rangeStart && rangeEnd && rangeDays >= 0 && rangeDays <= 31) {
        const cursor = new Date(rangeStart);
        while (cursor <= rangeEnd) {
          const key = orderDateKey(cursor);
          buckets.push({ key, label: new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short' }).format(cursor), daily: true });
          cursor.setDate(cursor.getDate() + 1);
        }
      } else {
        const keys = [...new Set(filteredOrders.map((order) => orderDateKey(order.created_at).slice(0, 7)).filter(Boolean))].sort();
        buckets = keys.map((key) => {
          const [year, month] = key.split('-');
          return { key, label: `${monthNames[Number(month) - 1]} ${String(year).slice(-2)}` };
        });
      }
    }
    return buckets.map((bucket) => {
      const items = filteredOrders.filter((order) => {
        const date = orderDateKey(order.created_at);
        return bucket.daily ? date === bucket.key : date.startsWith(bucket.key);
      });
      const paid = items.filter((order) => order.payment_status === 'paid');
      return {
        ...bucket,
        items,
        paidItems: paid,
        orders: items.length,
        paid: paid.length,
        commission: paid.reduce((total, order) => total + Number(order.affiliate_commission_amount || 0), 0),
      };
    });
  }, [filteredOrders, filters.year, filters.from, filters.to]);
  const maxChartOrders = Math.max(1, ...chartData.map((item) => item.orders));
  const maxChartCommission = Math.max(1, ...chartData.map((item) => item.commission));
  const selectedChartBucket = chartSelection ? chartData.find((item) => item.key === chartSelection.key) : null;
  const selectedChartRows = selectedChartBucket
    ? chartSelection.type === 'commission' ? selectedChartBucket.paidItems : selectedChartBucket.items
    : [];
  const toggleDetail = (nextDetail) => setDetail((current) => current === nextDetail ? '' : nextDetail);
  return <>
    <section className="affiliate-dashboard-hero">
      <div>
        <span>SELAMAT DATANG</span>
        <div className="affiliate-heading-title-line">
          <h1>Halo, {affiliate.full_name?.split(' ')[0] || 'Partner'}.</h1>
          <AffiliateHeadingTools category="all" title="Aktivitas Referral Terbaru" reloadFn={onReloadOverview}/>
        </div>
        <p>Pilih produk yang ingin ditampilkan melalui etalase dan link referralmu.</p>
      </div>
      <DashboardLink to="/products">Atur produk <b>→</b></DashboardLink>
    </section>
    <section className="affiliate-dashboard-filter-panel">
      <div><span>FILTER RINGKASAN</span><h2>Performa referral</h2><p>Pilih tahun untuk grafik Januari–Desember, atau kosongkan tahun agar memakai rentang tanggal.</p></div>
      <div className="affiliate-dashboard-filter-fields">
        <OrderFilterDropdown label="Tahun" value={filters.year} options={yearOptions} onChange={(value) => updateFilter('year', value)}/>
        <label><span>Dari tanggal</span><input type="date" disabled={Boolean(filters.year)} value={filters.from} max={filters.to || undefined} onChange={(event) => updateFilter('from', event.target.value)}/></label>
        <label><span>Sampai tanggal</span><input type="date" disabled={Boolean(filters.year)} value={filters.to} min={filters.from || undefined} onChange={(event) => updateFilter('to', event.target.value)}/></label>
        <button type="button" disabled={!hasFilters} onClick={() => setFilters({ ...emptyDashboardFilters })}>Reset filter</button>
      </div>
      <small>{periodLabel} · filter berjalan dari data yang sudah dimuat</small>
    </section>
    <section className="affiliate-stat-grid">
      <button type="button" className={detail === 'products' ? 'is-active' : ''} onClick={() => toggleDetail('products')}><span>Produk ditampilkan</span><strong>{visibleProducts.length}</strong><small>dari {products.length} produk aktif</small><i>Lihat isi →</i></button>
      <button type="button" className={detail === 'templates' ? 'is-active' : ''} onClick={() => toggleDetail('templates')}><span>Template referral</span><strong>{visibleTemplates.length}</strong><small>link siap dibagikan</small><i>Lihat isi →</i></button>
      <button type="button" className={detail === 'orders' ? 'is-active' : ''} onClick={() => toggleDetail('orders')}><span>Pesanan referral</span><strong>{filteredOrders.length}</strong><small>{paidOrders.length} pesanan sudah dibayar</small><i>Lihat isi →</i></button>
      <button type="button" className={detail === 'commission' ? 'is-active' : ''} onClick={() => toggleDetail('commission')}><span>Komisi order lunas</span><strong className="money">{rupiah(commissionEarned)}</strong><small>{rupiah(commissionPending)} masih menunggu pembayaran</small><i>Lihat isi →</i></button>
    </section>
    {detail && <section className="affiliate-dashboard-detail-panel">
      <header><div><span>RINCIAN RINGKASAN</span><h2>{detail === 'products' ? 'Produk ditampilkan' : detail === 'templates' ? 'Template referral' : detail === 'orders' ? 'Pesanan referral' : 'Komisi order lunas'}</h2><p>{['orders', 'commission'].includes(detail) ? periodLabel : 'Kondisi etalase saat ini'}</p></div><button type="button" onClick={() => setDetail('')} aria-label="Tutup rincian">×</button></header>
      <div className="affiliate-dashboard-detail-list">
        {detail === 'products' && (visibleProducts.length ? visibleProducts.map((product) => <article key={product.id}><div><b>{product.template_name}</b><span>{product.name}</span></div><strong>{rupiah(product.price)}</strong><small>{Number(product.commission_percent || 0).toLocaleString('id-ID')}% · estimasi {rupiah(product.commission_amount || 0)}</small></article>) : <p>Belum ada produk yang ditampilkan.</p>)}
        {detail === 'templates' && (visibleTemplates.length ? visibleTemplates.map((template) => <article key={template.id}><div><b>{template.name}</b><span>{template.category}</span></div><strong>{template.visible_products} produk</strong><small>Link referral siap dibagikan</small></article>) : <p>Belum ada template referral aktif.</p>)}
        {detail === 'orders' && (filteredOrders.length ? filteredOrders.map((order) => <article key={order.id}><div><b>{order.order_code}</b><span>{order.customer_name}</span></div><strong>{orderStatus(order.payment_status)}</strong><small>{order.template?.name || 'Template'} · {order.product?.name || 'Paket'} · {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(order.created_at))}</small></article>) : <p>Tidak ada pesanan pada periode ini.</p>)}
        {detail === 'commission' && (paidOrders.length ? paidOrders.map((order) => <article key={order.id}><div><b>{order.order_code}</b><span>{order.template?.name || 'Template'} · {order.product?.name || 'Paket'}</span></div><strong>{rupiah(order.affiliate_commission_amount)}</strong><small>{Number(order.affiliate_commission_percent || 0).toLocaleString('id-ID')}% · {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(order.created_at))}</small></article>) : <p>Belum ada komisi lunas pada periode ini.</p>)}
      </div>
    </section>}
    <section className="affiliate-dashboard-chart-card">
      <header><div><span>GRAFIK PESANAN</span><h2>Pergerakan referral</h2><p>{periodLabel}</p></div><div><span><i/>Total pesanan</span><span><i/>Komisi lunas</span></div></header>
      {chartData.length ? <div className={`affiliate-dashboard-chart ${filters.year ? 'is-yearly' : ''}`}>
        {chartData.map((item) => <div className="affiliate-dashboard-chart-column" key={item.key}>
          <div className="affiliate-dashboard-chart-bars">
            <button
              type="button"
              className={`affiliate-dashboard-chart-bar is-orders ${chartSelection?.key === item.key && chartSelection?.type === 'orders' ? 'is-selected' : ''}`}
              style={{ height: `${Math.max(item.orders ? item.orders / maxChartOrders * 100 : 3, 3)}%` }}
              disabled={!item.orders}
              onClick={() => setChartSelection((current) => current?.key === item.key && current?.type === 'orders' ? null : { key: item.key, type: 'orders' })}
              aria-label={`Lihat ${item.orders} pesanan pada ${item.label}`}
              title={`${item.orders} pesanan`}
            />
            <button
              type="button"
              className={`affiliate-dashboard-chart-bar is-commission ${chartSelection?.key === item.key && chartSelection?.type === 'commission' ? 'is-selected' : ''}`}
              style={{ height: `${Math.max(item.commission ? item.commission / maxChartCommission * 100 : 3, 3)}%` }}
              disabled={!item.commission}
              onClick={() => setChartSelection((current) => current?.key === item.key && current?.type === 'commission' ? null : { key: item.key, type: 'commission' })}
              aria-label={`Lihat komisi lunas ${rupiah(item.commission)} pada ${item.label}`}
              title={`${rupiah(item.commission)} komisi lunas`}
            />
          </div>
          <small>{item.label}</small>
        </div>)}
      </div> : <div className="affiliate-dashboard-chart-empty">Belum ada pesanan pada periode yang dipilih.</div>}
      {selectedChartBucket && <div className="affiliate-dashboard-chart-detail">
        <header>
          <div><span>RINCIAN GRAFIK</span><h3>{chartSelection.type === 'commission' ? 'Komisi lunas' : 'Pesanan'} · {selectedChartBucket.label}</h3><p>{chartSelection.type === 'commission' ? `${selectedChartBucket.paid} order lunas · ${rupiah(selectedChartBucket.commission)}` : `${selectedChartBucket.orders} pesanan pada periode ini`}</p></div>
          <button type="button" onClick={() => setChartSelection(null)} aria-label="Tutup rincian grafik">×</button>
        </header>
        <div>
          {selectedChartRows.map((order) => <article key={order.id}>
            <div><b>{order.order_code}</b><span>{order.customer_name}</span></div>
            <strong>{chartSelection.type === 'commission' ? rupiah(order.affiliate_commission_amount) : orderStatus(order.payment_status)}</strong>
            <small>{order.template?.name || 'Template'} · {order.product?.name || 'Paket'} · {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(order.created_at))}</small>
          </article>)}
        </div>
      </div>}
    </section>
    <section className="affiliate-quick-panel"><div><span>LANGKAH PERTAMA</span><h2>Siapkan etalase referralmu</h2><p>Pilih paket yang ingin ditampilkan, lalu salin link referral per template.</p></div><div className="affiliate-quick-actions"><DashboardLink to="/products"><i>1</i><span><b>Atur produk</b><small>Pilih paket yang ingin kamu tawarkan</small></span></DashboardLink><DashboardLink to="/links"><i>2</i><span><b>Salin link referral</b><small>Bagikan template pilihanmu</small></span></DashboardLink></div></section>
  </>;
}

const PRODUCT_PAGE_SIZE = 5;

function ProductSettings({ catalog, setCatalog, onboarding = false }) {
  const [saving, setSaving] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);
  const products = catalog.templates.flatMap((template) => (
    template.products.map((product) => ({ template, product }))
  ));
  const pageCount = Math.max(1, Math.ceil(products.length / PRODUCT_PAGE_SIZE));
  const pageItems = products.slice((page - 1) * PRODUCT_PAGE_SIZE, page * PRODUCT_PAGE_SIZE);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const updateLocal = (templateId, packageId, patch, savedOnboarding = null) => {
    setCatalog((current) => {
      const templates = current.templates.map((template) => {
        if (template.id !== templateId) return template;
        const nextProducts = template.products.map((product) => (
          product.id !== packageId ? product : { ...product, ...patch }
        ));
        return { ...template, products: nextProducts, visible_products: nextProducts.filter((product) => product.is_visible).length };
      });
      return {
        ...current,
        templates,
        onboarding_required: typeof savedOnboarding === 'boolean' ? savedOnboarding : current.onboarding_required,
      };
    });
  };

  const persistProduct = async (template, product, nextProduct = product, action = 'disimpan') => {
    const previous = { is_visible: product.is_visible };
    setSaving(String(product.id));
    setNotice('');
    updateLocal(template.id, product.id, { is_visible: nextProduct.is_visible });
    try {
      const result = await affiliateApi(`/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isVisible: nextProduct.is_visible === true,
        }),
      });
      updateLocal(template.id, product.id, result.setting, result.onboarding_required);
      setNotice(`${template.name} · ${product.name} berhasil ${action}.`);
    } catch (error) {
      updateLocal(template.id, product.id, previous);
      setNotice(friendlyAffiliateError(error));
    } finally {
      setSaving('');
    }
  };

  const toggleProduct = (template, product, checked) => {
    const nextProduct = { ...product, is_visible: checked };
    persistProduct(template, product, nextProduct, checked ? 'ditampilkan' : 'disembunyikan');
  };

  return <section className="affiliate-products-page">
    <div className="affiliate-page-heading"><div><span>{onboarding ? 'LANGKAH WAJIB PERTAMA' : 'ETALASE AFFILIATE'}</span><h1>{onboarding ? 'Pilih Produk Affiliate' : 'Produk'}</h1><p>{onboarding ? 'Pilih minimal satu produk untuk membuka dashboard affiliate.' : 'Pilih paket yang ingin tampil melalui link referralmu. Persentase komisi ditentukan oleh admin Daymoment.'}</p></div><div className="affiliate-limit-note"><b>Kontrol etalase</b><span>Perubahan tampil atau sembunyi hanya berlaku pada etalase referralmu.</span></div></div>
    {onboarding && <div className="affiliate-onboarding-banner"><span>1</span><div><b>Akunmu sudah aktif, etalasenya belum.</b><p>Aktifkan produk yang memang ingin kamu promosikan. Besaran komisi dikelola langsung oleh admin.</p></div></div>}
    {notice && <div className="affiliate-dashboard-notice">{notice}</div>}
    <article className="affiliate-template-group affiliate-product-catalog">
      <div className="affiliate-product-table">
        <div className="affiliate-product-row affiliate-product-labels"><span>Template & produk</span><span>Harga</span><span>Komisi</span><span>Tampilkan di etalase</span></div>
        {pageItems.map(({ template, product }) => <div className={`affiliate-product-row ${product.is_visible ? '' : 'is-hidden'}`} key={product.id}>
          <div className="affiliate-product-identity"><i className={`affiliate-product-mini-glyph glyph-${template.code}`}>{template.name.slice(0, 1)}</i><span><small>{template.name}</small><b>{product.name}</b><em>{product.tagline}</em></span></div>
          <strong>{rupiah(product.price)}</strong>
          <div className="affiliate-product-commission"><strong>{Number(product.commission_percent || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}%</strong><small>Estimasi {rupiah(product.commission_amount || 0)}</small></div>
          <label className={`affiliate-switch ${saving === String(product.id) ? 'is-saving' : ''}`}><input type="checkbox" checked={product.is_visible} disabled={saving === String(product.id)} onChange={(event) => toggleProduct(template, product, event.target.checked)}/><span/><small>{saving === String(product.id) ? 'Menyimpan…' : product.is_visible ? 'Tampil' : 'Hidden'}</small></label>
        </div>)}
      </div>
    </article>
    {pageCount > 1 && <nav className="affiliate-pagination" aria-label="Halaman produk"><button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>← Sebelumnya</button><div>{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button type="button" className={number === page ? 'active' : ''} aria-current={number === page ? 'page' : undefined} onClick={() => setPage(number)} key={number}>{number}</button>)}</div><button type="button" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Berikutnya →</button></nav>}
    <p className="affiliate-page-count">Menampilkan {pageItems.length} dari {products.length} produk · maksimal {PRODUCT_PAGE_SIZE} produk per halaman</p>
  </section>;
}

function ReferralLinks({ catalog }) {
  const [copied, setCopied] = useState('');
  const copy = async (key, url) => {
    await copyText(url);
    setCopied(String(key));
    window.setTimeout(() => setCopied(''), 1800);
  };
  return <section className="affiliate-links-page">
    <div className="affiliate-page-heading"><div><span>TAUTAN PERSONAL</span><h1>Link Referral</h1><p>Bagikan satu link etalase untuk seluruh produk pilihanmu, atau gunakan link khusus per template.</p></div><div className="affiliate-ref-code"><small>KODE REFERRAL</small><strong>{catalog.referral_code}</strong></div></div>
    <article className="affiliate-storefront-link"><div><small>LINK UTAMA AFFILIATE</small><h2>Semua Produk Pilihanmu</h2><p>Calon pelanggan akan melihat seluruh template dan paket yang sudah kamu aktifkan.</p><code>{catalog.storefront_url}</code></div><div className="affiliate-link-actions"><button type="button" onClick={() => copy('storefront', catalog.storefront_url)}>{copied === 'storefront' ? 'Tersalin ✓' : 'Salin link utama'}</button><a href={catalog.storefront_url} target="_blank" rel="noreferrer">Buka etalase ↗</a></div></article>
    <div className="affiliate-link-subheading"><span>LINK PER TEMPLATE</span><p>Gunakan tautan ini apabila kamu ingin mempromosikan satu desain tertentu.</p></div>
    <div className="affiliate-link-list">{catalog.templates.map((template) => <article className={template.visible_products ? '' : 'is-disabled'} key={template.id}>
      <div className={`affiliate-template-glyph glyph-${template.code}`}><span>{template.name.slice(0, 1)}</span></div>
      <div className="affiliate-link-info"><small>{template.category}</small><h2>{template.name}</h2><p>{template.visible_products} produk ditampilkan</p><code>{template.referral_url}</code></div>
      <div className="affiliate-link-actions"><button type="button" disabled={!template.visible_products} onClick={() => copy(template.id, template.referral_url)}>{copied === String(template.id) ? 'Tersalin ✓' : 'Salin link'}</button>{template.visible_products > 0 && <a href={template.referral_url} target="_blank" rel="noreferrer">Buka ↗</a>}</div>
    </article>)}</div>
  </section>;
}

const orderStatus = (status) => ({
  paid: 'Dibayar', pending: 'Menunggu', failed: 'Gagal', expired: 'Kedaluwarsa', cancelled: 'Dibatalkan',
}[status] || status || 'Menunggu');

const emptyOrderFilters = { search: '', product: '', status: '', from: '', to: '' };
const emptyWithdrawalFilters = { status: '', from: '', to: '' };
const ORDER_PAGE_SIZE = 10;

function storedOrderView(affiliateId) {
  const fallback = { filters: { ...emptyOrderFilters }, page: 1 };
  try {
    const saved = JSON.parse(localStorage.getItem(`daymoment-affiliate-orders:${affiliateId}`) || 'null');
    if (!saved || typeof saved !== 'object') return fallback;
    return {
      filters: Object.fromEntries(Object.keys(emptyOrderFilters).map((key) => [key, typeof saved.filters?.[key] === 'string' ? saved.filters[key] : ''])),
      page: Math.max(1, Number.parseInt(saved.page, 10) || 1),
    };
  } catch {
    return fallback;
  }
}

function storedEarningView(affiliateId) {
  const fallback = { filters: { ...emptyOrderFilters }, page: 1 };
  try {
    const saved = JSON.parse(localStorage.getItem(`daymoment-affiliate-earnings:${affiliateId}`) || 'null');
    if (!saved || typeof saved !== 'object') return fallback;
    return {
      filters: Object.fromEntries(Object.keys(emptyOrderFilters).map((key) => [key, typeof saved.filters?.[key] === 'string' ? saved.filters[key] : ''])),
      page: Math.max(1, Number.parseInt(saved.page, 10) || 1),
    };
  } catch {
    return fallback;
  }
}

function storedWithdrawalView(affiliateId) {
  const fallback = { filters: { ...emptyWithdrawalFilters }, page: 1 };
  try {
    const saved = JSON.parse(localStorage.getItem(`daymoment-affiliate-withdrawals:${affiliateId}`) || 'null');
    if (!saved || typeof saved !== 'object') return fallback;
    return {
      filters: Object.fromEntries(Object.keys(emptyWithdrawalFilters).map((key) => [key, typeof saved.filters?.[key] === 'string' ? saved.filters[key] : ''])),
      page: Math.max(1, Number.parseInt(saved.page, 10) || 1),
    };
  } catch {
    return fallback;
  }
}

function orderDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function visiblePages(currentPage, totalPages, maximum = 5) {
  const count = Math.min(maximum, Math.max(1, totalPages));
  let start = Math.max(1, currentPage - Math.floor(count / 2));
  const end = Math.min(totalPages, start + count - 1);
  start = Math.max(1, end - count + 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function OrderFilterDropdown({ label, value, options, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();
  const selected = options.find((option) => String(option.value) === String(value)) || options[0];
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);
  return <div className={`affiliate-filter-dropdown ${open ? 'is-open' : ''}`} ref={rootRef}>
    <span>{label}</span>
    <button type="button" className="affiliate-filter-dropdown-trigger" aria-expanded={open} aria-controls={listId} disabled={disabled} onClick={() => setOpen((current) => !current)}>
      <span><b>{selected?.label}</b>{selected?.meta && <small>{selected.meta}</small>}</span>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5.5 7.5 4.5 4.5 4.5-4.5"/></svg>
    </button>
    {open && <div className="affiliate-filter-dropdown-menu" id={listId} role="listbox" aria-label={label}>
      {options.map((option) => {
        const active = String(option.value) === String(value);
        return <button type="button" role="option" aria-selected={active} className={active ? 'is-selected' : ''} onClick={() => { onChange(String(option.value)); setOpen(false); }} key={String(option.value)}>
          <span><b>{option.label}</b>{option.meta && <small>{option.meta}</small>}</span>
          {active && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4.5 10 3.4 3.4 7.6-7.6"/></svg>}
        </button>;
      })}
    </div>}
  </div>;
}

function OrdersPage({ data, affiliateId, onReloadOrders }) {
  const [view, setView] = useState(() => storedOrderView(affiliateId));
  const { filters } = view;
  useEffect(() => {
    try { localStorage.setItem(`daymoment-affiliate-orders:${affiliateId}`, JSON.stringify(view)); } catch {}
  }, [affiliateId, view]);
  const updateFilter = (key, value) => {
    const nextFilters = { ...filters, [key]: value };
    if (key === 'from' && value && nextFilters.to && value > nextFilters.to) nextFilters.to = '';
    if (key === 'to' && value && nextFilters.from && value < nextFilters.from) nextFilters.from = '';
    setView({ filters: nextFilters, page: 1 });
  };
  const resetFilters = () => setView({ filters: { ...emptyOrderFilters }, page: 1 });
  const summary = data?.summary || {};
  const filteredOrders = useMemo(() => {
    const needle = filters.search.trim().toLocaleLowerCase('id');
    return (data?.orders || []).filter((order) => {
      if (needle && !`${order.order_code || ''} ${order.customer_name || ''}`.toLocaleLowerCase('id').includes(needle)) return false;
      if (filters.product && String(order.package_id) !== String(filters.product)) return false;
      if (filters.status && order.payment_status !== filters.status) return false;
      const date = orderDateKey(order.created_at);
      if (filters.from && date < filters.from) return false;
      if (filters.to && date > filters.to) return false;
      return true;
    });
  }, [data?.orders, filters]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDER_PAGE_SIZE));
  const currentPage = Math.min(view.page, totalPages);
  const visibleOrders = filteredOrders.slice((currentPage - 1) * ORDER_PAGE_SIZE, currentPage * ORDER_PAGE_SIZE);
  const hasActiveFilters = Object.values(filters).some(Boolean);
  const pageNumbers = visiblePages(currentPage, totalPages);
  const changePage = (page) => setView((current) => ({ ...current, page: Math.min(totalPages, Math.max(1, page)) }));
  const productOptions = [{ value: '', label: 'Semua produk' }, ...(data?.filters?.products || []).map((product) => ({ value: product.id, label: product.template_name, meta: product.product_name }))];
  const paymentOptions = [
    { value: '', label: 'Semua status' },
    { value: 'paid', label: 'Dibayar', meta: 'Pembayaran berhasil' },
    { value: 'pending', label: 'Menunggu', meta: 'Belum dibayar' },
    { value: 'failed', label: 'Gagal' },
    { value: 'expired', label: 'Kedaluwarsa' },
    { value: 'cancelled', label: 'Dibatalkan' },
  ];
  return <section className="affiliate-orders-page">
    <div className="affiliate-page-heading">
      <div>
        <span>TRANSAKSI REFERRAL</span>
        <div className="affiliate-heading-title-line">
          <h1>Pesanan</h1>
          <AffiliateHeadingTools category="orders" title="Pesanan Referral Terbaru" reloadFn={onReloadOrders}/>
        </div>
        <p>Pesanan yang masuk melalui link referralmu akan tercatat otomatis beserta snapshot komisinya.</p>
      </div>
      <div className="affiliate-ref-code"><small>TOTAL KOMISI DIBAYAR</small><strong>{rupiah(summary.commission_earned || 0)}</strong></div>
    </div>
    <div className="affiliate-order-stats"><article><span>Total pesanan</span><b>{summary.total_orders || 0}</b></article><article><span>Sudah dibayar</span><b>{summary.paid_orders || 0}</b></article><article><span>Menunggu</span><b>{summary.pending_orders || 0}</b></article><article><span>Komisi tertunda</span><b>{rupiah(summary.commission_pending || 0)}</b></article></div>
    <div className="affiliate-order-filters">
      <div className="affiliate-order-filter-grid">
        <label className="affiliate-order-search"><span>Invoice atau pelanggan</span><input type="search" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Cari invoice atau nama pelanggan" maxLength="100"/></label>
        <OrderFilterDropdown label="Produk" value={filters.product} options={productOptions} onChange={(value) => updateFilter('product', value)}/>
        <OrderFilterDropdown label="Status pembayaran" value={filters.status} options={paymentOptions} onChange={(value) => updateFilter('status', value)}/>
        <label><span>Dari tanggal</span><input type="date" value={filters.from} max={filters.to || undefined} onChange={(event) => updateFilter('from', event.target.value)}/></label>
        <label><span>Sampai tanggal</span><input type="date" value={filters.to} min={filters.from || undefined} onChange={(event) => updateFilter('to', event.target.value)}/></label>
      </div>
      <div className="affiliate-order-filter-actions"><small>{filteredOrders.length} pesanan ditemukan · disaring langsung dari data tersimpan</small><button type="button" className="secondary" onClick={resetFilters} disabled={!hasActiveFilters}>Reset semua filter</button></div>
    </div>
    <div className="affiliate-order-table-wrap">
      <table className="affiliate-order-table affiliate-orders-table"><thead><tr><th>Invoice</th><th>Pelanggan</th><th>Produk</th><th>Pembayaran</th><th>Komisi</th><th>Tanggal</th><th>Panel editor</th></tr></thead><tbody>
        {visibleOrders.length ? visibleOrders.map((order) => <tr key={order.id}><td><strong>{order.order_code}</strong></td><td>{order.customer_name}</td><td><b>{order.template?.name || 'Template'}</b><small>{order.product?.name || 'Paket'}</small></td><td><span className={`affiliate-payment-status status-${order.payment_status}`}>{orderStatus(order.payment_status)}</span></td><td><b>{rupiah(order.affiliate_commission_amount)}</b><small>{order.affiliate_commission_percent}%</small></td><td>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(order.created_at))}</td><td>{order.editor_url ? <a className="affiliate-editor-link" href={order.editor_url} target="_blank" rel="noopener noreferrer">Buka editor ↗</a> : <span className="affiliate-editor-unavailable">Tersedia setelah lunas</span>}</td></tr>) : <tr><td colSpan="7" className="affiliate-order-empty">{hasActiveFilters ? 'Tidak ada pesanan yang sesuai dengan filter.' : 'Belum ada pesanan melalui link referralmu.'}</td></tr>}
      </tbody></table>
    </div>
    {totalPages > 1 && <nav className="affiliate-pagination" aria-label="Halaman pesanan"><button type="button" disabled={currentPage <= 1} onClick={() => changePage(currentPage - 1)}>← Sebelumnya</button><div>{pageNumbers.map((page) => <button type="button" className={currentPage === page ? 'active' : ''} aria-current={currentPage === page ? 'page' : undefined} onClick={() => changePage(page)} key={page}>{page}</button>)}</div><button type="button" disabled={currentPage >= totalPages} onClick={() => changePage(currentPage + 1)}>Berikutnya →</button></nav>}
    <p className="affiliate-page-count">Maksimal 10 pesanan per halaman · halaman {currentPage} dari {totalPages}</p>
  </section>;
}

function FinanceLoading() {
  return <div className="affiliate-dashboard-loading"><span>Rp</span><p>Menyiapkan data keuangan…</p></div>;
}

function EarningsPage({ data, error, reload, affiliateId }) {
  const [view, setView] = useState(() => storedEarningView(affiliateId));
  const earnings = data?.earnings || [];
  const { filters } = view;
  useEffect(() => {
    try { localStorage.setItem(`daymoment-affiliate-earnings:${affiliateId}`, JSON.stringify(view)); } catch {}
  }, [affiliateId, view]);
  const productOptions = useMemo(() => [{ value: '', label: 'Semua produk' }, ...new Map(earnings.map((earning) => [String(earning.package_id), {
    value: earning.package_id,
    label: earning.template_name,
    meta: earning.product_name,
  }])).values()], [earnings]);
  const filteredEarnings = useMemo(() => {
    const needle = filters.search.trim().toLocaleLowerCase('id');
    return earnings.filter((earning) => {
      if (needle && !`${earning.order_code || ''} ${earning.template_name || ''} ${earning.product_name || ''}`.toLocaleLowerCase('id').includes(needle)) return false;
      if (filters.product && String(earning.package_id) !== String(filters.product)) return false;
      if (filters.status && earning.payment_status !== filters.status) return false;
      const date = orderDateKey(earning.created_at);
      if (filters.from && date < filters.from) return false;
      if (filters.to && date > filters.to) return false;
      return true;
    });
  }, [earnings, filters]);
  const pageCount = Math.max(1, Math.ceil(filteredEarnings.length / ORDER_PAGE_SIZE));
  const page = Math.min(view.page, pageCount);
  const rows = filteredEarnings.slice((page - 1) * ORDER_PAGE_SIZE, page * ORDER_PAGE_SIZE);
  const pageNumbers = visiblePages(page, pageCount);
  const hasActiveFilters = Object.values(filters).some(Boolean);
  const updateFilter = (key, value) => {
    const nextFilters = { ...filters, [key]: value };
    if (key === 'from' && value && nextFilters.to && value > nextFilters.to) nextFilters.to = '';
    if (key === 'to' && value && nextFilters.from && value < nextFilters.from) nextFilters.from = '';
    setView({ filters: nextFilters, page: 1 });
  };
  const changePage = (nextPage) => setView((current) => ({ ...current, page: Math.min(pageCount, Math.max(1, nextPage)) }));
  const resetFilters = () => setView({ filters: { ...emptyOrderFilters }, page: 1 });
  const paymentOptions = [
    { value: '', label: 'Semua status' },
    { value: 'paid', label: 'Dibayar', meta: 'Sudah masuk saldo' },
    { value: 'pending', label: 'Menunggu', meta: 'Komisi masih tertunda' },
    { value: 'failed', label: 'Gagal' },
    { value: 'expired', label: 'Kedaluwarsa' },
    { value: 'cancelled', label: 'Dibatalkan' },
  ];
  const filteredPaidCommission = filteredEarnings.filter((earning) => earning.payment_status === 'paid')
    .reduce((total, earning) => total + Number(earning.affiliate_commission_amount || 0), 0);
  const filteredPendingCommission = filteredEarnings.filter((earning) => earning.payment_status !== 'paid')
    .reduce((total, earning) => total + Number(earning.affiliate_commission_amount || 0), 0);
  const activeWithdrawals = (data?.withdrawals || []).filter((withdrawal) => ['pending', 'processing'].includes(withdrawal.status)).length;
  if (!data) return error
    ? <div className="affiliate-dashboard-error"><strong>Penghasilan belum dapat dimuat</strong><p>{error}</p><button type="button" onClick={reload}>Coba lagi</button></div>
    : <FinanceLoading/>;
  return <section className="affiliate-earnings-page">
    <div className="affiliate-page-heading">
      <div>
        <span>RINGKASAN KOMISI</span>
        <div className="affiliate-heading-title-line">
          <h1>Penghasilan</h1>
          <AffiliateHeadingTools category="orders" title="Komisi Referral Terbaru" reloadFn={reload}/>
        </div>
        <p>Komisi dicatat ketika order dibuat dan menjadi saldo tersedia setelah pembayaran pelanggan berhasil.</p>
      </div>
      <div className="affiliate-heading-balances"><div className="affiliate-ref-code"><small>SALDO TERSEDIA</small><strong>{rupiah(data.summary.available)}</strong><span>Siap diajukan untuk penarikan</span></div><div className={`affiliate-ref-code affiliate-reserved-balance ${activeWithdrawals ? 'is-active' : ''}`}><small><i/>DALAM PENARIKAN</small><strong>{rupiah(data.summary.reserved)}</strong><span>{activeWithdrawals ? `${activeWithdrawals} penarikan sedang diproses` : 'Tidak ada penarikan aktif'}</span></div></div>
    </div>
    <div className="affiliate-finance-summary"><article className="primary"><small>Total komisi dibayar</small><strong>{rupiah(filteredPaidCommission)}</strong><span>{hasActiveFilters ? 'Total komisi dibayar dari hasil filter' : 'Dari seluruh order berstatus dibayar'}</span></article><article><small>Menunggu pembayaran</small><strong>{rupiah(filteredPendingCommission)}</strong><span>{hasActiveFilters ? 'Komisi tertunda dari hasil filter' : 'Belum masuk saldo tersedia'}</span></article></div>
    <div className="affiliate-finance-section-heading"><div><span>RIWAYAT</span><h2>Pergerakan komisi</h2></div><small>{filteredEarnings.length} dari {earnings.length} transaksi referral</small></div>
    <div className="affiliate-order-filters affiliate-earning-filters">
      <div className="affiliate-order-filter-grid">
        <label className="affiliate-order-search"><span>Invoice atau produk</span><input type="search" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Cari invoice atau nama produk" maxLength="100"/></label>
        <OrderFilterDropdown label="Produk" value={filters.product} options={productOptions} onChange={(value) => updateFilter('product', value)}/>
        <OrderFilterDropdown label="Status komisi" value={filters.status} options={paymentOptions} onChange={(value) => updateFilter('status', value)}/>
        <label><span>Dari tanggal</span><input type="date" value={filters.from} max={filters.to || undefined} onChange={(event) => updateFilter('from', event.target.value)}/></label>
        <label><span>Sampai tanggal</span><input type="date" value={filters.to} min={filters.from || undefined} onChange={(event) => updateFilter('to', event.target.value)}/></label>
      </div>
      <div className="affiliate-order-filter-actions"><small>{filteredEarnings.length} transaksi ditemukan · disaring langsung dari data tersimpan</small><button type="button" className="secondary" onClick={resetFilters} disabled={!hasActiveFilters}>Reset semua filter</button></div>
    </div>
    <div className="affiliate-order-table-wrap"><table className="affiliate-order-table affiliate-earning-table"><thead><tr><th>Invoice</th><th>Produk</th><th>Status</th><th>Persentase</th><th>Komisi</th><th>Tanggal</th></tr></thead><tbody>{rows.length ? rows.map((earning) => <tr key={earning.id}><td><strong>{earning.order_code}</strong></td><td><b>{earning.template_name}</b><small>{earning.product_name}</small></td><td><span className={`affiliate-payment-status status-${earning.payment_status}`}>{orderStatus(earning.payment_status)}</span></td><td>{earning.affiliate_commission_percent}%</td><td><b>{rupiah(earning.affiliate_commission_amount)}</b><small>{earning.payment_status === 'paid' ? 'Masuk saldo' : 'Tertunda'}</small></td><td>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(earning.created_at))}</td></tr>) : <tr><td colSpan="6" className="affiliate-order-empty">{hasActiveFilters ? 'Tidak ada transaksi yang sesuai dengan filter.' : 'Belum ada penghasilan dari referral.'}</td></tr>}</tbody></table></div>
    {pageCount > 1 && <nav className="affiliate-pagination" aria-label="Halaman penghasilan"><button type="button" disabled={page === 1} onClick={() => changePage(page - 1)}>← Sebelumnya</button><div>{pageNumbers.map((number) => <button type="button" className={page === number ? 'active' : ''} aria-current={page === number ? 'page' : undefined} onClick={() => changePage(number)} key={number}>{number}</button>)}</div><button type="button" disabled={page === pageCount} onClick={() => changePage(page + 1)}>Berikutnya →</button></nav>}
    <p className="affiliate-page-count">Maksimal 10 transaksi per halaman · halaman {page} dari {pageCount}</p>
  </section>;
}

const withdrawalStatus = (status) => ({ pending: 'Menunggu', processing: 'Diproses', paid: 'Selesai', rejected: 'Ditolak', cancelled: 'Dibatalkan' }[status] || status);

function ProofLightboxModal({ proof, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!proof) return null;

  return (
    <div
      className="affiliate-lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Screenshot bukti ${proof.social_platform || ''} ${proof.social_handle || ''}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="affiliate-lightbox-card">
        <header>
          <div className="affiliate-lightbox-title">
            <span className="eyebrow">BUKTI SCREENSHOT MEDIA SOSIAL</span>
            <h3>{proof.social_platform} · {proof.social_handle}</h3>
          </div>
          <button
            type="button"
            className="affiliate-lightbox-close"
            onClick={onClose}
            aria-label="Tutup foto bukti"
          >
            ×
          </button>
        </header>

        <div className="affiliate-lightbox-image-wrap">
          <img
            src={proof.proof_url}
            alt={`Screenshot ${proof.social_platform} ${proof.social_handle}`}
          />
        </div>

        <footer>
          <div className="affiliate-lightbox-meta">
            <span>Followers: <b>{Number(proof.follower_count || 0).toLocaleString('id-ID')}</b></span>
            <span>Dikirim: <b>{profileDate(proof.created_at, true)}</b></span>
          </div>
          <div className="affiliate-lightbox-actions">
            {proof.proof_url && (
              <a
                href={proof.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="affiliate-lightbox-open-btn"
              >
                Buka Tab Baru ↗
              </a>
            )}
            <button
              type="button"
              className="affiliate-lightbox-done-btn"
              onClick={onClose}
            >
              Tutup
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ProUpgradeHistoryModal({ requests, onClose, onPreviewProof }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="affiliate-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Riwayat Pengajuan Akun Pro"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="affiliate-modal-card affiliate-history-modal-card">
        <header className="affiliate-modal-header">
          <div>
            <span className="eyebrow">STATUS &amp; RIWAYAT UPGRADE</span>
            <h2>Riwayat Pengajuan Akun Pro</h2>
            <p>Daftar pengajuan verifikasi media sosial, screenshot bukti yang diunggah, serta catatan review dari admin.</p>
          </div>
          <button
            type="button"
            className="affiliate-modal-close"
            onClick={onClose}
            aria-label="Tutup riwayat pengajuan"
          >
            ×
          </button>
        </header>

        <div className="affiliate-modal-body affiliate-history-modal-body">
          {!requests || requests.length === 0 ? (
            <div className="affiliate-history-empty">
              <div className="affiliate-history-empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3>Belum ada riwayat pengajuan</h3>
              <p>Pengajuan verifikasi media sosial atau pembayaran upgrade akan tercatat di sini beserta catatan review dari admin.</p>
            </div>
          ) : (
            <div className="affiliate-history-list">
              {requests.map((item) => {
                const isSocial = item.method === 'social';
                const isPending = item.status === 'pending';
                const isApproved = item.status === 'approved' || item.status === 'paid';
                const isRejected = item.status === 'rejected';

                let statusBadge = { label: 'Sedang Direview', cls: 'status-pending' };
                if (item.status === 'approved') statusBadge = { label: 'Disetujui', cls: 'status-approved' };
                else if (item.status === 'rejected') statusBadge = { label: 'Perlu Perbaikan', cls: 'status-rejected' };
                else if (item.status === 'paid') statusBadge = { label: 'Lunas', cls: 'status-paid' };
                else if (['failed', 'expired', 'cancelled'].includes(item.status)) statusBadge = { label: 'Kedaluwarsa', cls: 'status-expired' };

                return (
                  <article className={`affiliate-history-card status-${item.status}`} key={item.id}>
                    <header className="affiliate-history-card-header">
                      <div className="affiliate-history-header-left">
                        <span className="affiliate-history-method-badge">
                          {isSocial ? 'Verifikasi Media Sosial' : 'Upgrade Langsung (Midtrans)'}
                        </span>
                        <time>{profileDate(item.created_at, true)}</time>
                      </div>
                      <span className={`affiliate-history-status-tag ${statusBadge.cls}`}>
                        {statusBadge.label}
                      </span>
                    </header>

                    <div className="affiliate-history-card-content">
                      {isSocial ? (
                        <div className="affiliate-history-social-section">
                          <div className="affiliate-history-fields-row">
                            <div className="affiliate-history-field">
                              <small>MEDIA SOSIAL</small>
                              <strong>{item.social_platform || '—'}</strong>
                            </div>
                            <div className="affiliate-history-field">
                              <small>USERNAME / AKUN</small>
                              <strong>{item.social_handle || '—'}</strong>
                            </div>
                            <div className="affiliate-history-field">
                              <small>JUMLAH FOLLOWERS</small>
                              <strong>{Number(item.follower_count || 0).toLocaleString('id-ID')} followers</strong>
                            </div>
                          </div>

                          {item.proof_url ? (
                            <div className="affiliate-history-proof-wrapper">
                              <div className="affiliate-history-proof-label">
                                <small>SCREENSHOT BUKTI YANG DIUPLOAD</small>
                                <span>Klik gambar untuk memperbesar</span>
                              </div>
                              <div
                                className="affiliate-history-proof-thumbnail"
                                onClick={() => onPreviewProof(item)}
                                title="Klik untuk memperbesar screenshot bukti"
                              >
                                <img
                                  src={item.proof_url}
                                  alt={`Screenshot ${item.social_platform} ${item.social_handle}`}
                                  loading="lazy"
                                />
                                <div className="affiliate-history-proof-hover">
                                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8"/>
                                    <path d="m21 21-4.35-4.35"/>
                                    <line x1="11" y1="8" x2="11" y2="14"/>
                                    <line x1="8" y1="11" x2="14" y2="11"/>
                                  </svg>
                                  <span>Perbesar Screenshot</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="affiliate-history-no-proof">
                              <small>SCREENSHOT BUKTI</small>
                              <p>Tidak ada screenshot bukti tersimpan.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="affiliate-history-payment-section">
                          <div className="affiliate-history-fields-row">
                            <div className="affiliate-history-field">
                              <small>NOMINAL</small>
                              <strong>{rupiah(item.payment_amount || 20000)}</strong>
                            </div>
                            <div className="affiliate-history-field">
                              <small>METODE</small>
                              <strong>Midtrans</strong>
                            </div>
                            <div className="affiliate-history-field">
                              <small>ORDER ID</small>
                              <code className="affiliate-history-code">{item.gateway_order_id || '—'}</code>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className={`affiliate-history-note-box ${isRejected ? 'is-rejected' : isApproved ? 'is-approved' : 'is-pending'}`}>
                        <div className="affiliate-history-note-title">
                          <div className="affiliate-history-note-title-left">
                            {isRejected && (
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                              </svg>
                            )}
                            {isApproved && (
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                              </svg>
                            )}
                            {isPending && (
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                              </svg>
                            )}
                            <b>{isRejected ? 'Catatan Admin (Alasan Perbaikan):' : isApproved ? 'Catatan Admin:' : 'Status Review Admin:'}</b>
                          </div>
                          {item.reviewed_at && (
                            <time>Ditinjau {profileDate(item.reviewed_at, true)}</time>
                          )}
                        </div>

                        <div className="affiliate-history-note-content">
                          {item.review_note ? (
                            <p>{item.review_note}</p>
                          ) : isPending ? (
                            <p>Screenshot dan informasi akun media sosial sedang dalam antrean pemeriksaan oleh admin Daymoment. Kami akan segera memperbarui status pengajuan ini.</p>
                          ) : isApproved ? (
                            <p>Pengajuan telah disetujui. Akun kamu sudah berstatus Pro dan seluruh fitur penarikan komisi sudah dapat digunakan.</p>
                          ) : (
                            <p>Tidak ada catatan tambahan.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <footer className="affiliate-modal-footer">
          <button
            type="button"
            className="affiliate-modal-btn-close"
            onClick={onClose}
          >
            Tutup
          </button>
        </footer>
      </div>
    </div>
  );
}

function ProUpgradeGate({ pro, reload, onOpenHistory, onPreviewProof }) {
  const request = pro?.request;
  const requests = pro?.requests || (request ? [request] : []);
  const socialPlatforms = pro?.social_platforms || [];
  const rejectedSocialRequest = request?.method === 'social' && request.status === 'rejected' ? request : null;
  const [selected, setSelected] = useState(rejectedSocialRequest ? 'social' : '');
  const [social, setSocial] = useState(() => ({
    platform: rejectedSocialRequest?.social_platform || socialPlatforms[0]?.name || '',
    handle: rejectedSocialRequest?.social_handle || '',
    followerCount: rejectedSocialRequest?.follower_count ? String(rejectedSocialRequest.follower_count) : '',
    proof: null,
  }));
  const [working, setWorking] = useState('');
  const [notice, setNotice] = useState({ type: '', message: '' });
  const paymentStatusChecked = useRef(false);
  const hydratedRejectedRequest = useRef(rejectedSocialRequest?.id || '');
  const proofInputId = useId();
  const socialPending = request?.method === 'social' && request.status === 'pending';
  const platformOptions = socialPlatforms.length
    ? socialPlatforms.map((platform) => ({ value: platform.name, label: platform.name, meta: 'Minimal 1.000 followers' }))
    : [{ value: '', label: 'Belum ada pilihan', meta: 'Hubungi admin Daymoment' }];

  useEffect(() => {
    if (!rejectedSocialRequest || hydratedRejectedRequest.current === rejectedSocialRequest.id) return;
    hydratedRejectedRequest.current = rejectedSocialRequest.id;
    const rejectedPlatform = socialPlatforms.some((platform) => platform.name === rejectedSocialRequest.social_platform)
      ? rejectedSocialRequest.social_platform
      : socialPlatforms[0]?.name || '';
    setSelected('social');
    setSocial({
      platform: rejectedPlatform,
      handle: rejectedSocialRequest.social_handle || '',
      followerCount: rejectedSocialRequest.follower_count ? String(rejectedSocialRequest.follower_count) : '',
      proof: null,
    });
  }, [rejectedSocialRequest?.id, rejectedSocialRequest?.social_platform, rejectedSocialRequest?.social_handle, rejectedSocialRequest?.follower_count, socialPlatforms]);

  useEffect(() => {
    if (!socialPlatforms.length || socialPlatforms.some((platform) => platform.name === social.platform)) return;
    setSocial((current) => ({ ...current, platform: socialPlatforms[0].name }));
  }, [socialPlatforms, social.platform]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('upgrade') !== 'payment' || paymentStatusChecked.current) return;
    paymentStatusChecked.current = true;
    setWorking('status');
    affiliateApi('/pro-upgrade/payment-status', { method: 'POST' })
      .then(async (result) => {
        setNotice({ type: result.status === 'paid' ? 'success' : '', message: result.message });
        await reload();
      })
      .catch((failure) => setNotice({ type: 'error', message: friendlyAffiliateError(failure) }))
      .finally(() => {
        setWorking('');
        window.history.replaceState({}, '', '/withdrawals');
      });
  }, [reload]);

  const submitSocial = async (event) => {
    event.preventDefault();
    if (!social.platform) return setNotice({ type: 'error', message: 'Pilih media sosial terlebih dahulu.' });
    if (!social.proof) return setNotice({ type: 'error', message: 'Pilih screenshot akun media sosial terlebih dahulu.' });
    const form = new FormData();
    form.append('platform', social.platform);
    form.append('handle', social.handle);
    form.append('followerCount', social.followerCount);
    form.append('proof', social.proof);
    setWorking('social');
    setNotice({ type: '', message: '' });
    try {
      const result = await affiliateApi('/pro-upgrade/social', { method: 'POST', body: form });
      setNotice({ type: 'success', message: result.message });
      await reload();
    } catch (failure) {
      setNotice({ type: 'error', message: friendlyAffiliateError(failure) });
    } finally {
      setWorking('');
    }
  };

  const selectProof = (event) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > 4 * 1024 * 1024) {
      event.target.value = '';
      setSocial((current) => ({ ...current, proof: null }));
      setNotice({ type: 'error', message: 'Ukuran screenshot maksimal 4 MB.' });
      return;
    }
    setNotice({ type: '', message: '' });
    setSocial((current) => ({ ...current, proof: file }));
  };

  const startPayment = async () => {
    setWorking('payment');
    setNotice({ type: '', message: '' });
    try {
      const result = await affiliateApi('/pro-upgrade/payment', { method: 'POST' });
      if (result.status === 'paid') {
        setNotice({ type: 'success', message: result.message || 'Pembayaran berhasil. Akunmu sekarang sudah Pro.' });
        await reload();
        setWorking('');
        return;
      }
      if (!result.redirect_url) throw new Error('Halaman pembayaran belum tersedia. Silakan coba lagi.');
      window.location.href = result.redirect_url;
    } catch (failure) {
      setNotice({ type: 'error', message: friendlyAffiliateError(failure) });
      setWorking('');
    }
  };

  return <article className="affiliate-pro-gate">
    <header className="affiliate-pro-gate-header">
      <div className="affiliate-pro-gate-header-main">
        <span className="affiliate-pro-lock" aria-hidden="true">PRO</span>
        <div>
          <small>SYARAT PENARIKAN</small>
          <h2>Upgrade akun untuk menarik saldo</h2>
          <p>Pilih salah satu cara. Status Pro berlaku untuk penarikan berikutnya tanpa perlu upgrade ulang.</p>
        </div>
      </div>
      {requests.length > 0 && (
        <button
          type="button"
          className="affiliate-pro-history-btn"
          onClick={onOpenHistory}
          title="Lihat riwayat pengajuan dan catatan review admin"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Riwayat Pengajuan</span>
          <b className="affiliate-history-badge-count">{requests.length}</b>
        </button>
      )}
    </header>
    {notice.message && <div className={`affiliate-form-alert ${notice.type}`}>{notice.message}</div>}
    {socialPending && <div className="affiliate-pro-pending">
      <div className="affiliate-pro-pending-body">
        <b>Pengajuan sedang direview</b>
        <span>{request.social_platform} · {request.social_handle} · {Number(request.follower_count || 0).toLocaleString('id-ID')} followers</span>
        <small>Dikirim {profileDate(request.created_at, true)}. Kamu akan dapat menarik saldo setelah admin menyetujui bukti ini.</small>
      </div>
      <div className="affiliate-pro-pending-buttons">
        {request.proof_url && (
          <button
            type="button"
            className="affiliate-proof-link-btn"
            onClick={() => onPreviewProof?.(request)}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>Lihat Bukti Upload</span>
          </button>
        )}
        <button
          type="button"
          className="affiliate-history-link-btn"
          onClick={onOpenHistory}
        >
          <span>Riwayat Pengajuan ({requests.length}) →</span>
        </button>
      </div>
    </div>}
    {rejectedSocialRequest && <div className="affiliate-pro-rejection">
      <header>
        <div>
          <small>ALASAN ADMIN</small>
          <b>Pengajuan perlu diperbaiki</b>
        </div>
        <div className="affiliate-pro-rejection-meta">
          <time>{request.reviewed_at ? profileDate(request.reviewed_at, true) : ''}</time>
          <button
            type="button"
            className="affiliate-rejection-history-link"
            onClick={onOpenHistory}
          >
            Lihat Semua Riwayat ({requests.length}) →
          </button>
        </div>
      </header>
      <p>{request.review_note || 'Bukti belum memenuhi ketentuan.'}</p>
      <span>Perbarui media sosial, username, atau jumlah followers sesuai catatan di atas. Setelah itu unggah screenshot terbaru dan kirim ulang.</span>
      {request.proof_url && (
        <div className="affiliate-rejection-actions">
          <button
            type="button"
            className="affiliate-proof-link-btn secondary"
            onClick={() => onPreviewProof?.(request)}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>Lihat Bukti yang Pernah Diupload</span>
          </button>
        </div>
      )}
    </div>}
    {!socialPending && <div className="affiliate-pro-options">
      <button type="button" className={selected === 'social' ? 'is-selected' : ''} onClick={() => setSelected('social')}><i>01</i><span><b>Verifikasi media sosial</b><small>Gratis · minimal 1.000 followers</small><em>Upload screenshot, lalu admin akan memeriksa.</em></span></button>
      <button type="button" className={selected === 'payment' ? 'is-selected' : ''} onClick={() => setSelected('payment')}><i>02</i><span><b>Upgrade langsung</b><small>{rupiah(pro?.upgrade_price || 20000)} · sekali bayar</small><em>Pembayaran aman melalui Midtrans.</em></span></button>
    </div>}
    {!socialPending && selected === 'social' && <form className="affiliate-pro-social-form" onSubmit={submitSocial}>
      <div className="affiliate-withdrawal-fields"><OrderFilterDropdown label="Media sosial *" value={social.platform} options={platformOptions} disabled={!socialPlatforms.length} onChange={(platform) => setSocial((current) => ({ ...current, platform }))}/><label><span>Username / nama akun *</span><input value={social.handle} onChange={(event) => setSocial({ ...social, handle: event.target.value })} maxLength="120" placeholder="Contoh: @namakamu" required/></label></div>
      <label><span>Jumlah followers *</span><input type="number" min="1000" step="1" value={social.followerCount} onChange={(event) => setSocial({ ...social, followerCount: event.target.value })} placeholder="Minimal 1000" required/><small>Berlaku untuk media sosial apa pun, minimal 1.000 followers.</small></label>
      <label className={`affiliate-pro-proof ${social.proof ? 'has-file' : ''}`} htmlFor={proofInputId}><span>Screenshot akun *</span><input id={proofInputId} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectProof} required/><div className="affiliate-pro-upload-box"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/></svg><span><b>{social.proof?.name || 'Pilih screenshot akun'}</b><small>{social.proof ? `${(social.proof.size / 1024).toLocaleString('id-ID', { maximumFractionDigits: 0 })} KB · siap diunggah` : 'JPG, PNG, atau WEBP · maksimal 4 MB'}</small></span><em>{social.proof ? 'Ganti file' : 'Pilih file'}</em></div><small>Pastikan username dan jumlah followers terlihat jelas.</small></label>
      <button type="submit" disabled={working === 'social'}>{working === 'social' ? 'Mengirim bukti…' : rejectedSocialRequest ? 'Kirim ulang untuk direview →' : 'Kirim untuk direview →'}</button>
    </form>}
    {!socialPending && selected === 'payment' && <div className="affiliate-pro-payment"><div><small>UPGRADE SEKALI BAYAR</small><strong>{rupiah(pro?.upgrade_price || 20000)}</strong><p>Setelah pembayaran terkonfirmasi, akun otomatis menjadi Pro dan fitur penarikan langsung terbuka.</p></div><button type="button" onClick={startPayment} disabled={working === 'payment' || working === 'status'}>{working === 'payment' ? 'Membuka Midtrans…' : request?.method === 'payment' && request.status === 'pending' ? 'Lanjutkan pembayaran →' : 'Bayar dan upgrade →'}</button></div>}
  </article>;
}

function WithdrawalsPage({ data, error, reload, affiliateId }) {
  const [form, setForm] = useState({ amount: '', payoutMethod: 'bank', provider: '', accountName: '', accountNumber: '' });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [view, setView] = useState(() => storedWithdrawalView(affiliateId));
  const { filters } = view;
  useEffect(() => {
    try { localStorage.setItem(`daymoment-affiliate-withdrawals:${affiliateId}`, JSON.stringify(view)); } catch {}
  }, [affiliateId, view]);
  const filteredWithdrawals = useMemo(() => (data?.withdrawals || []).filter((withdrawal) => {
    if (filters.status && withdrawal.status !== filters.status) return false;
    const date = orderDateKey(withdrawal.requested_at);
    if (filters.from && date < filters.from) return false;
    if (filters.to && date > filters.to) return false;
    return true;
  }), [data?.withdrawals, filters]);
  const pageCount = Math.max(1, Math.ceil(filteredWithdrawals.length / ORDER_PAGE_SIZE));
  const page = Math.min(view.page, pageCount);
  const rows = filteredWithdrawals.slice((page - 1) * ORDER_PAGE_SIZE, page * ORDER_PAGE_SIZE);
  const pageNumbers = visiblePages(page, pageCount);
  const hasActiveFilters = Object.values(filters).some(Boolean);
  const filteredProcessed = filteredWithdrawals.filter((withdrawal) => ['pending', 'processing'].includes(withdrawal.status))
    .reduce((total, withdrawal) => total + Number(withdrawal.amount || 0), 0);
  const filteredPaid = filteredWithdrawals.filter((withdrawal) => withdrawal.status === 'paid')
    .reduce((total, withdrawal) => total + Number(withdrawal.amount || 0), 0);
  const statusOptions = [
    { value: '', label: 'Semua status' },
    { value: 'pending', label: 'Menunggu', meta: 'Belum diproses admin' },
    { value: 'processing', label: 'Diproses', meta: 'Transfer sedang diproses' },
    { value: 'paid', label: 'Selesai', meta: 'Komisi sudah dicairkan' },
    { value: 'rejected', label: 'Ditolak' },
    { value: 'cancelled', label: 'Dibatalkan' },
  ];
  const updateFilter = (key, value) => {
    const nextFilters = { ...filters, [key]: value };
    if (key === 'from' && value && nextFilters.to && value > nextFilters.to) nextFilters.to = '';
    if (key === 'to' && value && nextFilters.from && value < nextFilters.from) nextFilters.from = '';
    setView({ filters: nextFilters, page: 1 });
  };
  const resetFilters = () => setView({ filters: { ...emptyWithdrawalFilters }, page: 1 });
  const changePage = (nextPage) => setView((current) => ({ ...current, page: Math.min(pageCount, Math.max(1, nextPage)) }));
  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice({ type: '', message: '' });
    try {
      const result = await affiliateApi('/withdrawals', { method: 'POST', body: JSON.stringify(form) });
      setNotice({ type: 'success', message: result.message });
      setForm((current) => ({ ...current, amount: '', provider: '', accountName: '', accountNumber: '' }));
      await reload();
    } catch (failure) {
      setNotice({ type: 'error', message: friendlyAffiliateError(failure) });
    } finally {
      setSubmitting(false);
    }
  };
  if (!data) return error
    ? <div className="affiliate-dashboard-error"><strong>Penarikan belum dapat dimuat</strong><p>{error}</p><button type="button" onClick={reload}>Coba lagi</button></div>
    : <FinanceLoading/>;
  const canWithdraw = data.summary.available >= data.minimum_withdrawal;
  const settings = data.withdrawal_settings || {};
  const requestedAmount = Math.max(0, Number(form.amount || 0));
  const estimatedFee = Math.round(requestedAmount * Number(settings.fee_percent || 0) / 100);
  const estimatedNet = Math.max(0, requestedAmount - estimatedFee);
  return <section className="affiliate-withdrawals-page">
    <div className="affiliate-page-heading">
      <div>
        <span>PAYOUT AFFILIATE</span>
        <div className="affiliate-heading-title-line">
          <h1>Penarikan</h1>
          <AffiliateHeadingTools category="withdrawals" title="Permintaan Penarikan Terbaru" reloadFn={reload}/>
        </div>
        <p>Ajukan pencairan komisi ke rekening bank atau e-wallet. Setiap permintaan diproses dan ditransfer secara manual oleh admin Daymoment.</p>
      </div>
      <div className="affiliate-heading-balances">
        <div className="affiliate-ref-code">
          <small>SALDO TERSEDIA</small>
          <strong>{rupiah(data.summary.available)}</strong>
        </div>
        <div className="affiliate-ref-code affiliate-fee-status">
          <small>FEE PENARIKAN</small>
          <strong>{Number(settings.fee_percent || 0).toLocaleString('id-ID')}%</strong>
        </div>
      </div>
    </div>
    <div className="affiliate-withdrawal-grid">
      <article className="affiliate-withdrawal-form-card">
        <div><span>AJUKAN PENARIKAN</span><h2>Informasi tujuan payout</h2><p>Minimal penarikan {rupiah(data.minimum_withdrawal)}. Fee {Number(settings.fee_percent || 0).toLocaleString('id-ID')}% dihitung saat permintaan disimpan dan tidak akan berubah untuk transaksi tersebut.</p></div>
        {notice.message && <div className={`affiliate-form-alert ${notice.type}`}>{notice.message}</div>}
        <form onSubmit={submit}>
          <label><span>Nominal penarikan</span><div className="affiliate-money-input"><i>Rp</i><input type="number" min={data.minimum_withdrawal} max={data.summary.available} step="1000" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="50000" required/></div><small>Maksimal {rupiah(data.summary.available)}</small></label>
          <div className="affiliate-withdrawal-fields"><label><span>Metode</span><select value={form.payoutMethod} onChange={(event) => setForm({ ...form, payoutMethod: event.target.value })}><option value="bank">Transfer bank</option><option value="e_wallet">E-wallet</option></select></label><label><span>Bank / E-wallet</span><input value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })} placeholder={form.payoutMethod === 'bank' ? 'Contoh: BCA' : 'Contoh: DANA'} maxLength="50" required/></label></div>
          <label><span>Nama pemilik</span><input value={form.accountName} onChange={(event) => setForm({ ...form, accountName: event.target.value })} placeholder="Sesuai rekening" maxLength="120" required/></label>
          <label><span>Nomor rekening / e-wallet</span><input inputMode="numeric" value={form.accountNumber} onChange={(event) => setForm({ ...form, accountNumber: event.target.value })} placeholder="Masukkan nomor tujuan" maxLength="80" required/></label>
          <div className="affiliate-withdrawal-estimate"><span>Nominal diajukan <b>{rupiah(requestedAmount)}</b></span><span>Fee {Number(settings.fee_percent || 0).toLocaleString('id-ID')}% <b>- {rupiah(estimatedFee)}</b></span><strong>Perkiraan diterima <b>{rupiah(estimatedNet)}</b></strong></div>
          <button type="submit" disabled={!canWithdraw || submitting}>{submitting ? 'Mengirim permintaan…' : canWithdraw ? 'Ajukan penarikan →' : `Saldo belum mencapai ${rupiah(data.minimum_withdrawal)}`}</button>
        </form>
      </article>
      <aside className="affiliate-balance-card">
        <small>RINCIAN SALDO</small>
        <h2>{rupiah(data.summary.available)}</h2>
        <div className="affiliate-balance-breakdown"><span><i/>Sedang diproses <b>{rupiah(data.summary.reserved)}</b></span></div>
        <p>Saldo tersedia dihitung dari komisi order lunas dikurangi penarikan pending, diproses, dan selesai.</p>
        <div className="affiliate-sender-bank"><small>REKENING PENGIRIM DAYMOMENT</small>{settings.sender_bank_name ? <dl><div><dt>Bank</dt><dd>{settings.sender_bank_name}</dd></div><div><dt>Nomor rekening</dt><dd>{settings.sender_account_number || '—'}</dd></div><div><dt>Nama pemilik</dt><dd>{settings.sender_account_name || '—'}</dd></div></dl> : <p>Informasi rekening pengirim belum diatur oleh admin.</p>}</div>
      </aside>
    </div>
    <div className="affiliate-finance-section-heading"><div><span>RIWAYAT</span><h2>Permintaan penarikan</h2></div><small>{filteredWithdrawals.length} dari {data.withdrawals.length} permintaan</small></div>
    <div className="affiliate-withdrawal-filter-summary"><article><small>Sedang diproses</small><strong>{rupiah(filteredProcessed)}</strong><span>Penarikan menunggu dan sedang diproses dari hasil filter</span></article><article className="is-paid"><small>Sudah dicairkan</small><strong>{rupiah(filteredPaid)}</strong><span>Penarikan selesai dari hasil filter</span></article></div>
    <div className="affiliate-order-filters affiliate-withdrawal-filters">
      <div className="affiliate-withdrawal-filter-grid">
        <OrderFilterDropdown label="Status penarikan" value={filters.status} options={statusOptions} onChange={(value) => updateFilter('status', value)}/>
        <label><span>Dari tanggal</span><input type="date" value={filters.from} max={filters.to || undefined} onChange={(event) => updateFilter('from', event.target.value)}/></label>
        <label><span>Sampai tanggal</span><input type="date" value={filters.to} min={filters.from || undefined} onChange={(event) => updateFilter('to', event.target.value)}/></label>
      </div>
      <div className="affiliate-order-filter-actions"><small>{filteredWithdrawals.length} permintaan ditemukan · disaring langsung dari data tersimpan</small><button type="button" className="secondary" onClick={resetFilters} disabled={!hasActiveFilters}>Reset semua filter</button></div>
    </div>
    <div className="affiliate-order-table-wrap">
      <table className="affiliate-order-table affiliate-withdrawal-table">
        <thead><tr><th>Tanggal</th><th>Tujuan</th><th>Pengirim Daymoment</th><th>Diajukan</th><th>Fee</th><th>Diterima</th><th>Status</th><th>Catatan</th></tr></thead>
        <tbody>
          {rows.length ? rows.map((withdrawal) => <tr key={withdrawal.id}><td>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(withdrawal.requested_at))}</td><td><b>{withdrawal.provider}</b><small>{withdrawal.account_name} · {withdrawal.account_number}</small></td><td>{withdrawal.sender_bank_name ? <><b>{withdrawal.sender_bank_name}</b><small>{withdrawal.sender_account_number || '—'} · a.n. {withdrawal.sender_account_name || '—'}</small></> : <small>Belum terekam pada transaksi lama</small>}</td><td><strong>{rupiah(withdrawal.amount)}</strong></td><td>{withdrawal.fee_percent.toLocaleString('id-ID')}%<small>{rupiah(withdrawal.fee_amount)}</small></td><td><strong>{rupiah(withdrawal.net_amount)}</strong></td><td><span className={`affiliate-withdrawal-status status-${withdrawal.status}`}>{withdrawalStatus(withdrawal.status)}</span></td><td>{withdrawal.admin_note || '—'}</td></tr>) : <tr><td colSpan="8" className="affiliate-order-empty">{hasActiveFilters ? 'Tidak ada penarikan yang sesuai dengan filter.' : 'Belum ada permintaan penarikan.'}</td></tr>}
        </tbody>
      </table>
    </div>
    {pageCount > 1 && <nav className="affiliate-pagination" aria-label="Halaman penarikan"><button type="button" disabled={page === 1} onClick={() => changePage(page - 1)}>← Sebelumnya</button><div>{pageNumbers.map((number) => <button type="button" className={page === number ? 'active' : ''} aria-current={page === number ? 'page' : undefined} onClick={() => changePage(number)} key={number}>{number}</button>)}</div><button type="button" disabled={page === pageCount} onClick={() => changePage(page + 1)}>Berikutnya →</button></nav>}
    <p className="affiliate-page-count">Maksimal 10 penarikan per halaman · halaman {page} dari {pageCount}</p>
  </section>;
}

const profileDate = (value, withTime = false) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', withTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'long' }).format(date);
};

const loginFailure = (reason) => ({
  invalid_credentials: 'Email atau password salah',
  status_pending: 'Akun belum diverifikasi',
  status_suspended: 'Akun sedang ditangguhkan',
  status_rejected: 'Akun ditolak',
  rate_limited: 'Terlalu banyak percobaan',
}[reason] || 'Login tidak berhasil');

function ProfilePage({ data, error, reload, setData, onAffiliateUpdate }) {
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '', referralCode: '' });
  const [profileState, setProfileState] = useState({ loading: false, type: '', message: '' });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmation: '' });
  const [passwordState, setPasswordState] = useState({ loading: false, type: '', message: '' });
  const hydratedProfile = useRef('');

  useEffect(() => {
    if (!data?.profile || hydratedProfile.current === data.profile.id) return;
    hydratedProfile.current = data.profile.id;
    setProfileForm({
      fullName: data.profile.full_name || '',
      phone: data.profile.phone || '',
      referralCode: data.profile.referral_code || '',
    });
  }, [data]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileState({ loading: true, type: '', message: '' });
    try {
      const result = await affiliateApi('/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileForm),
      });
      setData((current) => ({ ...current, profile: result.profile }));
      setProfileForm({
        fullName: result.profile.full_name || '',
        phone: result.profile.phone || '',
        referralCode: result.profile.referral_code || '',
      });
      onAffiliateUpdate(result.profile);
      setProfileState({ loading: false, type: 'success', message: result.message });
    } catch (failure) {
      setProfileState({ loading: false, type: 'error', message: friendlyAffiliateError(failure) });
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordState({ loading: true, type: '', message: '' });
    try {
      const result = await affiliateApi('/profile/password', {
        method: 'POST',
        body: JSON.stringify(passwordForm),
      });
      setPasswordForm({ newPassword: '', confirmation: '' });
      setPasswordState({ loading: false, type: 'success', message: result.message });
    } catch (failure) {
      setPasswordState({ loading: false, type: 'error', message: friendlyAffiliateError(failure) });
    }
  };

  if (!data) return error
    ? <div className="affiliate-dashboard-error"><strong>Profil belum dapat dimuat</strong><p>{error}</p><button type="button" onClick={reload}>Coba lagi</button></div>
    : <div className="affiliate-dashboard-loading"><span>JD</span><p>Menyiapkan profil partner…</p></div>;

  const { profile, login_history: history = [] } = data;
  const initials = profile.full_name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'DP';
  return <section className="affiliate-profile-page">
    <div className="affiliate-page-heading"><div><span>AKUN PARTNER</span><h1>Profil</h1><p>Kelola informasi kontak, keamanan akun, dan pantau aktivitas login affiliate kamu.</p></div><div className="affiliate-profile-verified"><i>✓</i><span><small>STATUS AKUN</small><strong>Email terverifikasi</strong></span></div></div>
    <article className="affiliate-profile-identity"><span>{initials}</span><div><small>PARTNER DAYMOMENT</small><h2>{profile.full_name}</h2><p>Bergabung sejak {profileDate(profile.created_at)}</p></div><dl><div><dt>Kode referral</dt><dd>{profile.referral_code}</dd></div><div><dt>Status</dt><dd className="active">Aktif</dd></div></dl></article>
    <div className="affiliate-profile-grid">
      <article className="affiliate-profile-card"><header><span>01</span><div><h2>Informasi pribadi</h2><p>Nama ini tampil pada etalase dan dashboard affiliate.</p></div></header>{profileState.message && <div className={`affiliate-form-alert ${profileState.type}`}>{profileState.message}</div>}<form onSubmit={saveProfile}>
        <Field label="Nama lengkap" type="text" autoComplete="name" minLength="2" maxLength="120" required value={profileForm.fullName} onChange={(event) => setProfileForm({ ...profileForm, fullName: event.target.value })}/>
        <Field label="Nomor WhatsApp" type="tel" autoComplete="tel" maxLength="24" required value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })}/>
        <Field label="Email terverifikasi" type="email" value={profile.email} readOnly/>
        <Field label="Kode referral" type="text" required minLength="3" maxLength="32" pattern="[A-Za-z0-9]{3,32}" value={profileForm.referralCode} onChange={(event) => setProfileForm({ ...profileForm, referralCode: event.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32) })} hint="Bebas huruf besar, kecil, dan angka tanpa spasi (3–32 karakter). Contoh: DandiWedding atau dandi2026."/>
        <button type="submit" disabled={profileState.loading}>{profileState.loading ? 'Menyimpan…' : 'Simpan perubahan →'}</button>
      </form></article>
      <article className="affiliate-profile-card"><header><span>02</span><div><h2>Keamanan akun</h2><p>Isi hanya saat kamu ingin menggunakan password baru.</p></div></header>{passwordState.message && <div className={`affiliate-form-alert ${passwordState.type}`}>{passwordState.message}</div>}<form onSubmit={changePassword}>
        <PasswordField label="Password baru" autoComplete="new-password" minLength="8" maxLength="64" required value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}/>
        <PasswordField label="Ulangi password baru" autoComplete="new-password" minLength="8" maxLength="64" required value={passwordForm.confirmation} onChange={(event) => setPasswordForm({ ...passwordForm, confirmation: event.target.value })}/>
        <p className="affiliate-password-note">Kosongkan apabila tidak ingin mengganti password. Minimal 8 karakter; setelah diganti, akunmu otomatis keluar dari perangkat lain.</p>
        <button type="submit" disabled={passwordState.loading || !passwordForm.newPassword || !passwordForm.confirmation}>{passwordState.loading ? 'Mengganti password…' : 'Ganti password →'}</button>
      </form></article>
    </div>
    <article className="affiliate-login-history"><header><div><span>AKTIVITAS KEAMANAN</span><h2>Riwayat login</h2><p>Sepuluh percobaan login terbaru pada akunmu.</p></div><small>Terakhir diperbarui {profileDate(profile.updated_at, true)}</small></header><div className="affiliate-login-list">{history.length ? history.map((entry) => <div key={entry.id}><i className={entry.success ? 'success' : 'failed'}>{entry.success ? '✓' : '!'}</i><span><b>{entry.success ? 'Login berhasil' : loginFailure(entry.failure_reason)}</b><small>{entry.device} · {entry.ip_address}</small></span><time>{profileDate(entry.attempted_at, true)}</time></div>) : <p className="affiliate-login-empty">Belum ada riwayat login yang tercatat.</p>}</div></article>
  </section>;
}

function ComingSoon({ menu }) {
  return <section className="affiliate-coming-soon"><span>{menu?.icon || '•'}</span><small>SEGERA HADIR</small><h1>{menu?.label || 'Fitur baru'}</h1><p>Struktur menu sudah disiapkan. Fitur ini akan kita lanjutkan pada tahap berikutnya.</p><DashboardLink to="/dashboard">Kembali ke ringkasan</DashboardLink></section>;
}

function AffiliateDashboard({ affiliate, onLogout, onAffiliateUpdate }) {
  const initialPath = cleanPath() === '/' ? '/dashboard' : cleanPath();
  const [path, setPath] = useState(dashboardMenus.some((menu) => menu.path === initialPath) ? initialPath : '/dashboard');
  const [catalog, setCatalog] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [financeData, setFinanceData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [errors, setErrors] = useState({});
  const [initialized, setInitialized] = useState(false);
  const requests = useRef({});
  const pathRef = useRef(path);
  const scrollPositions = useRef(new Map());

  const [notificationsData, setNotificationsData] = useState({
    counts: { total: 0, orders: 0, withdrawals: 0, pro: 0 },
    notifications: { all: [], orders: [], withdrawals: [], pro: [] },
    refreshed_at: null,
  });
  const [openHeadingNotif, setOpenHeadingNotif] = useState(null);
  const [headingRefreshing, setHeadingRefreshing] = useState('');
  const [readMarkers, setReadMarkers] = useState(() => {
    try {
      const saved = localStorage.getItem(`daymoment_affiliate_read_markers_${affiliate.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const loadNotifications = useCallback(async (showFeedback = false) => {
    try {
      const res = await affiliateApi('/notifications');
      if (res?.ok) {
        setNotificationsData({
          counts: res.counts || { total: 0, orders: 0, withdrawals: 0, pro: 0 },
          notifications: res.notifications || { all: [], orders: [], withdrawals: [], pro: [] },
          refreshed_at: res.refreshed_at || new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Gagal memuat notifikasi affiliate:', err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(() => loadNotifications(), 45000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.affiliate-notif-box')) {
        setOpenHeadingNotif(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const toggleHeadingNotif = (category) => {
    if (openHeadingNotif === category) {
      setOpenHeadingNotif(null);
    } else {
      setOpenHeadingNotif(category);
      const nowIso = new Date().toISOString();
      setReadMarkers((prev) => {
        const next = { ...prev, [category]: nowIso, all: nowIso };
        try {
          localStorage.setItem(`daymoment_affiliate_read_markers_${affiliate.id}`, JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  };

  const handleHeadingRefresh = async (category, reloadFn) => {
    setHeadingRefreshing(category);
    try {
      await Promise.allSettled([
        loadNotifications(false),
        typeof reloadFn === 'function' ? reloadFn() : Promise.resolve(),
      ]);
      window.showToast?.('Data dan notifikasi berhasil diperbarui.');
    } catch (err) {
      window.showToast?.('Gagal memuat ulang data.', 'error');
    } finally {
      setHeadingRefreshing('');
    }
  };

  useEffect(() => { pathRef.current = path; }, [path]);

  const loadData = useCallback((key) => {
    if (requests.current[key]) return requests.current[key];
    const endpoints = {
      catalog: '/products',
      orders: '/orders?all=1',
      finance: '/finance',
      profile: '/profile',
    };
    const request = affiliateApi(endpoints[key])
      .then((result) => {
        if (key === 'catalog') setCatalog(result);
        if (key === 'orders') setOrderData(result);
        if (key === 'finance') setFinanceData(result);
        if (key === 'profile') setProfileData(result);
        setErrors((current) => ({ ...current, [key]: '' }));
        return result;
      })
      .catch((failure) => {
        setErrors((current) => ({ ...current, [key]: friendlyAffiliateError(failure) }));
        return null;
      })
      .finally(() => { delete requests.current[key]; });
    requests.current[key] = request;
    return request;
  }, []);

  const loadMany = useCallback((keys) => Promise.all(keys.map(loadData)), [loadData]);

  useEffect(() => {
    let active = true;
    loadMany(['catalog', 'orders', 'finance', 'profile']).finally(() => {
      if (active) setInitialized(true);
    });
    return () => { active = false; };
  }, [loadMany]);

  const restoreScroll = useCallback((targetPath) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPositions.current.get(targetPath) || 0, left: 0, behavior: 'auto' });
    }));
  }, []);

  const navigate = useCallback((targetPath) => {
    const nextPath = dashboardMenus.some((menu) => menu.path === targetPath) ? targetPath : '/dashboard';
    if (nextPath === pathRef.current) return;
    scrollPositions.current.set(pathRef.current, window.scrollY);
    window.history.pushState({}, '', nextPath);
    pathRef.current = nextPath;
    setPath(nextPath);
    restoreScroll(nextPath);
  }, [restoreScroll]);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    if (cleanPath() === '/') window.history.replaceState({}, '', '/dashboard');
    const handlePopState = () => {
      scrollPositions.current.set(pathRef.current, window.scrollY);
      const requestedPath = cleanPath();
      const nextPath = dashboardMenus.some((menu) => menu.path === requestedPath) ? requestedPath : '/dashboard';
      pathRef.current = nextPath;
      setPath(nextPath);
      restoreScroll(nextPath);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener('popstate', handlePopState);
    };
  }, [restoreScroll]);

  const activeMenu = dashboardMenus.find((menu) => menu.path === path) || dashboardMenus[0];
  const initials = affiliate.full_name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'DP';

  const dataError = (title, error, retry) => <div className="affiliate-dashboard-error"><strong>{title}</strong><p>{error || 'Data belum dapat dimuat.'}</p><button type="button" onClick={retry}>Coba lagi</button></div>;
  let content;
  if (!initialized) {
    content = <div className="affiliate-dashboard-loading"><span>D</span><p>Menyiapkan dashboard…</p></div>;
  } else if (catalog?.onboarding_required) {
    content = <ProductSettings catalog={catalog} setCatalog={setCatalog} onboarding/>;
  } else {
    const dashboardReady = catalog && orderData;
    const catalogReady = Boolean(catalog);
    content = <>
      <div hidden={path !== '/dashboard'}>{dashboardReady ? <DashboardOverview affiliate={affiliate} catalog={catalog} orderData={orderData} onReloadOverview={() => loadMany(['catalog', 'orders'])}/> : dataError('Dashboard belum dapat dimuat', errors.catalog || errors.orders, () => loadMany(['catalog', 'orders']))}</div>
      <div hidden={path !== '/products'}>{catalogReady ? <ProductSettings catalog={catalog} setCatalog={setCatalog}/> : dataError('Produk belum dapat dimuat', errors.catalog, () => loadData('catalog'))}</div>
      <div hidden={path !== '/links'}>{catalogReady ? <ReferralLinks catalog={catalog}/> : dataError('Link referral belum dapat dimuat', errors.catalog, () => loadData('catalog'))}</div>
      <div hidden={path !== '/orders'}>{orderData ? <OrdersPage data={orderData} affiliateId={affiliate.id} onReloadOrders={() => loadData('orders')}/> : dataError('Pesanan belum dapat dimuat', errors.orders, () => loadData('orders'))}</div>
      <div hidden={path !== '/earnings'}><EarningsPage data={financeData} error={errors.finance} reload={() => loadData('finance')} affiliateId={affiliate.id}/></div>
      <div hidden={path !== '/withdrawals'}><WithdrawalsPage data={financeData} error={errors.finance} reload={() => loadData('finance')} affiliateId={affiliate.id}/></div>
      <div hidden={path !== '/profile'}><ProfilePage data={profileData} error={errors.profile} reload={() => loadData('profile')} setData={setProfileData} onAffiliateUpdate={(updatedProfile) => {
        onAffiliateUpdate(updatedProfile);
        loadData('catalog');
      }}/></div>
      {!dashboardMenus.some((menu) => menu.path === path) && <ComingSoon menu={activeMenu}/>} 
    </>;
  }

  const toolsContextValue = {
    notificationsData,
    readMarkers,
    openHeadingNotif,
    onToggleNotif: toggleHeadingNotif,
    headingRefreshing,
    onRefresh: handleHeadingRefresh,
  };

  return <DashboardNavigationContext.Provider value={navigate}>
    <AffiliateToolsContext.Provider value={toolsContextValue}>
      <main className="affiliate-dashboard-shell">
        <aside className="affiliate-dashboard-sidebar"><Brand/><nav>{dashboardMenus.map((menu) => {
          const target = catalog?.onboarding_required ? '/products' : menu.path;
          const isActive = catalog?.onboarding_required ? menu.path === '/products' : menu.path === path;
          return <DashboardLink className={isActive ? 'active' : ''} to={target} key={menu.path}><i>{menu.icon}</i><span>{menu.label}</span>{menu.soon && <small>Segera</small>}</DashboardLink>;
        })}</nav><div className="affiliate-sidebar-help"><small>BUTUH BANTUAN?</small><p>Hubungi tim Daymoment apabila ada kendala dengan akun affiliate.</p><a href="mailto:support@daymoment.biz.id">Hubungi support</a></div></aside>
        <section className="affiliate-dashboard-main">
          <header className="affiliate-dashboard-topbar">
            <button className="affiliate-mobile-menu" type="button" aria-label="Buka menu">☰</button>
            <div><small>KODE PARTNER</small><strong>{affiliate.referral_code}</strong></div>
            <div className="affiliate-user-menu">
              <span>{initials}</span>
              <div><b>{affiliate.full_name}</b><small>{affiliate.email}</small></div>
              <button type="button" onClick={onLogout}>Keluar</button>
            </div>
          </header>
          <div className="affiliate-dashboard-content">{content}</div>
        </section>
      </main>
    </AffiliateToolsContext.Provider>
  </DashboardNavigationContext.Provider>;
}

export default function AffiliateApp() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    document.title = 'Daymoment Affiliate';
    affiliateApi('/session')
      .then((result) => setSession(result.authenticated ? result.affiliate : null))
      .catch(() => setSession(null));
  }, []);

  const logout = async () => {
    try { await affiliateApi('/logout', { method: 'POST' }); } catch {}
    setSession(null);
    window.location.replace('/login');
  };

  if (session === undefined) return <div className="affiliate-loading"><span>D</span><p>Memuat area partner…</p></div>;
  const path = cleanPath();
  if (path === '/reset-password') return <ResetPasswordPage/>;
  if (path === '/update-registration') return <ReviewCorrectionPage/>;
  if (session) return <AffiliateDashboard affiliate={session} onLogout={logout} onAffiliateUpdate={(profile) => setSession((current) => ({ ...current, ...profile }))}/>;
  if (path === '/register') return <RegisterPage/>;
  if (path === '/login') return <LoginPage onLogin={setSession}/>;
  if (path === '/forgot-password') return <ForgotPasswordPage/>;
  if (path === '/verify-email') return <VerifyEmailPage/>;
  window.location.replace('/login');
  return null;
}
