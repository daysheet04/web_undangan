import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Loading, ErrorState } from '../components/Layout.jsx';
import { money, post } from '../lib/api.js';
import { useRemote } from '../lib/hooks.js';

export default function OrderPage() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const code = query.get('template') || 'puspa_jawi';
  const referralCode = query.get('ref') || '';
  const referralQuery = referralCode ? `?ref=${encodeURIComponent(referralCode)}` : '';
  const { data, loading, error } = useRemote(`/api/templates/${code}${referralQuery}`, [code, referralCode]);
  const [form, setForm] = useState({
    package_code: query.get('package') || 'signature',
    customer_name: '', customer_email: '', customer_phone: '', agreement: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const packages = data?.template?.packages || [];
    if (packages.length && !packages.some((item) => item.code === form.package_code)) {
      setForm((current) => ({ ...current, package_code: packages[0].code }));
    }
  }, [data, form.package_code]);

  if (loading) return <Layout className="order-page"><Loading /></Layout>;
  if (error) return <Layout className="order-page"><ErrorState error={error} /></Layout>;
  const template = data.template;
  const requestedPackage = query.get('package');
  if (requestedPackage && !template.packages.some((item) => item.code === requestedPackage)) {
    return <Layout className="order-page"><ErrorState error={new Error('Paket template ini sedang maintenance dan belum dapat dipesan. Silakan pilih paket lain dari halaman template.')} /></Layout>;
  }
  if (!template.packages.length) return <Layout className="order-page"><ErrorState error={new Error(referralCode ? 'Affiliate ini belum menampilkan paket untuk template tersebut.' : 'Seluruh paket template ini sedang maintenance dan belum dapat dipesan.')} /></Layout>;

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const result = await post('/api/orders', {
        ...form,
        template_code: template.code,
        referral_code: referralCode,
      });
      window.location.href = result.redirect;
    } catch (failure) {
      setErrors(failure.data?.errors || {});
      window.showToast?.(failure.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const previewUrl = `/template/${template.code}${referralCode ? `?ref=${encodeURIComponent(referralCode)}` : ''}`;
  return <Layout className="order-page" title="Data Pemesan — Daymoment">
    <section className="flow-page">
      <a className="back-link" href="/#templates">← Kembali memilih template</a>
      <div className="flow-grid">
        <aside className="choice-summary">
          <span className="eyebrow">Template pilihanmu</span>
          <div className={`summary-mini visual-${template.code}`}><div className="collection-mini"><span>PREVIEW</span><i/><small>The Wedding of</small><strong>A <em>&amp;</em> N</strong><b>{template.name}</b></div></div>
          <span className="category-pill">{template.category}</span>
          <h1>{template.name}</h1><p>{template.description}</p>
          <a className="text-link" href={previewUrl}>Lihat preview penuh →</a>
        </aside>
        <div className="flow-card">
          <span className="flow-step">Langkah 1 dari 2</span>
          <h2>Siapa yang membuat undangan?</h2>
          <p>Data ini hanya untuk order dan tidak akan tampil pada undangan publik.</p>
          <form className="stack-form" onSubmit={submit}>
            <fieldset className="package-picker">
              <legend>Pilih paket undangan</legend>
              <p>Desainnya tetap sama cantiknya. Pilih kelengkapan fitur yang kamu butuhkan.</p>
              <div className="package-options">{template.packages.map((item) => <label className={`package-option ${item.code === 'signature' ? 'recommended' : ''}`} key={item.id}>
                <input type="radio" name="package_code" checked={form.package_code === item.code} onChange={() => setForm({ ...form, package_code: item.code })}/>
                <span className="package-card">
                  {item.code === 'signature' && <small className="package-badge">Paling populer</small>}
                  <span className="package-name"><strong>{item.name}</strong><b>{money(item.price)}</b></span>
                  <small>{item.tagline}</small>
                  <span className="package-features"><i>{item.gallery_limit} foto momen</i><i>{item.has_music ? 'Musik undangan' : 'Tanpa musik'}</i><i>{item.has_wishes ? 'Ucapan & RSVP' : 'Tanpa ucapan & RSVP'}</i><i>{item.has_gift ? 'Amplop digital' : 'Tanpa amplop digital'}</i></span>
                </span>
              </label>)}</div>
              {errors.package_code && <small className="field-error">{errors.package_code}</small>}
            </fieldset>
            <label><span>Nama lengkap pemesan</span><input value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} maxLength="120" placeholder="Contoh: Dandi Pratama" required/>{errors.customer_name && <small className="field-error">{errors.customer_name}</small>}</label>
            <label><span>Email pemesan</span><input type="email" value={form.customer_email} onChange={(event) => setForm({ ...form, customer_email: event.target.value })} maxLength="254" placeholder="nama@email.com" autoComplete="email" required/><small className="field-help">Instruksi dan status pembayaran akan dikirim ke email ini.</small>{errors.customer_email && <small className="field-error">{errors.customer_email}</small>}</label>
            <label><span>Nomor HP / WhatsApp</span><input type="tel" value={form.customer_phone} onChange={(event) => setForm({ ...form, customer_phone: event.target.value })} maxLength="24" placeholder="08xxxxxxxxxx atau +62xxxxxxxxxx" required/><small className="field-help">Dipakai untuk informasi order. Tidak ditampilkan ke tamu.</small>{errors.customer_phone && <small className="field-error">{errors.customer_phone}</small>}</label>
            <label className="check-label"><input type="checkbox" checked={form.agreement} onChange={(event) => setForm({ ...form, agreement: event.target.checked })}/><span>Saya menyetujui data ini digunakan untuk memproses pembuatan undangan.</span></label>
            {errors.agreement && <small className="field-error">{errors.agreement}</small>}
            <button className="button button-primary button-wide" disabled={submitting}>{submitting ? 'Memproses…' : 'Lanjutkan →'}</button>
          </form>
        </div>
      </div>
    </section>
  </Layout>;
}
