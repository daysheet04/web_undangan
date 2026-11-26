import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Loading, ErrorState } from '../components/Layout.jsx';
import { money, post } from '../lib/api.js';
import { useRemote } from '../lib/hooks.js';
import { buildReferralNavigation, normalizeReferralCode, referralBackHref } from '../lib/referralNavigation.js';
import { defaultTemplateCover, templatePhoneCoverUrl } from '../components/TemplateCover.jsx';
import TemplateSwitcherDropdown from '../components/TemplateSwitcherDropdown.jsx';
import { templatePreviewPath, templateSlug } from '../lib/templateSlug.js';

const OrderPhonePreview = React.memo(function OrderPhonePreview({ template, packageCode }) {
  const fallback = defaultTemplateCover(template?.code);
  const [coverSrc, setCoverSrc] = useState(() => templatePhoneCoverUrl(template));
  const [mountIframe, setMountIframe] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const iframeSrc = `${templatePreviewPath(template)}?embed=1&package=${encodeURIComponent(packageCode || 'signature')}`;

  useEffect(() => {
    setCoverSrc(templatePhoneCoverUrl(template));
    setIframeLoaded(false);
    setMountIframe(false);

    let cancelled = false;
    let idleId = 0;
    let timerId = 0;
    const activate = () => {
      if (!cancelled) setMountIframe(true);
    };
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(activate, { timeout: 220 });
    } else {
      timerId = window.setTimeout(activate, 140);
    }
    return () => {
      cancelled = true;
      if (idleId && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId);
      if (timerId) window.clearTimeout(timerId);
    };
  }, [template?.code, packageCode]);

  return (
    <div className="phone-mockup order-summary-phone">
      <div className="phone-speaker" aria-hidden="true" />
      <div className="order-phone-screen order-phone-screen--live">
        {!iframeLoaded && (
          <img
            className="order-phone-poster"
            src={coverSrc}
            alt={`Sampul template undangan ${template.name}`}
            width="244"
            height="488"
            loading="eager"
            decoding="async"
            onError={() => {
              if (coverSrc !== fallback) setCoverSrc(fallback);
            }}
          />
        )}
        {mountIframe && (
          <iframe
            key={iframeSrc}
            className={`order-phone-iframe${iframeLoaded ? ' is-ready' : ''}`}
            title={`Preview interaktif ${template.name}`}
            src={iframeSrc}
            loading="lazy"
            onLoad={() => setIframeLoaded(true)}
          />
        )}
      </div>
    </div>
  );
});

export default function OrderPage() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialCode = query.get('template') || 'java_vibes';
  const [selectedCode, setSelectedCode] = useState(initialCode);
  const referralCode = normalizeReferralCode(query.get('ref'));
  const referralNav = buildReferralNavigation(referralCode);
  const referralHomeHref = referralNav?.homeHref || '/';
  const referralQuery = referralCode ? `?ref=${encodeURIComponent(referralCode)}` : '';

  const { data, loading, error } = useRemote(`/api/templates/${selectedCode}${referralQuery}`, [selectedCode, referralCode]);
  const catalogPath = referralCode ? `/api/affiliate-catalog/${encodeURIComponent(referralCode)}` : '/api/templates';
  const catalogState = useRemote(catalogPath, [catalogPath]);
  const availableTemplates = catalogState.data?.templates || [];

  const [form, setForm] = useState({
    package_code: query.get('package') || 'signature',
    customer_name: '', customer_email: '', customer_phone: '', agreement: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches
  ));

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 720px)');
    const handleChange = (event) => {
      setIsMobile(event.matches);
      if (!event.matches) setMobilePreviewOpen(false);
    };
    setIsMobile(mediaQuery.matches);
    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', handleChange);
    else mediaQuery.addListener(handleChange);
    return () => {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', handleChange);
      else mediaQuery.removeListener(handleChange);
    };
  }, []);

  useEffect(() => {
    if (!mobilePreviewOpen) return undefined;
    document.body.classList.add('mobile-preview-open');
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobilePreviewOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('mobile-preview-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobilePreviewOpen]);

  useEffect(() => {
    const packages = data?.template?.packages || [];
    if (packages.length && !packages.some((item) => item.code === form.package_code)) {
      setForm((current) => ({ ...current, package_code: packages[0].code }));
    }
  }, [data, form.package_code]);

  const handleTemplateSwitch = (nextCode) => {
    if (!nextCode || nextCode === selectedCode) return;
    setSelectedCode(nextCode);
    try {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('template', nextCode);
      window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}`);
    } catch {}
  };

  if (loading && !data?.template) return <Layout className="order-page" navigation={referralNav}><Loading fullscreen /></Layout>;
  if (error) return <Layout className="order-page" navigation={referralNav}><ErrorState error={error} homeHref={referralHomeHref} /></Layout>;
  const template = data.template;
  const requestedPackage = selectedCode === initialCode ? query.get('package') : '';
  if (requestedPackage && !template.packages.some((item) => item.code === requestedPackage)) {
    return <Layout className="order-page" navigation={referralNav}><ErrorState error={new Error('Paket template ini sedang maintenance dan belum dapat dipesan. Silakan pilih paket lain dari halaman template.')} homeHref={referralHomeHref} /></Layout>;
  }
  if (!template.packages.length) return <Layout className="order-page" navigation={referralNav}><ErrorState error={new Error(referralCode ? 'Affiliate ini belum menampilkan paket untuk template tersebut.' : 'Seluruh paket template ini sedang maintenance dan belum dapat dipesan.')} homeHref={referralHomeHref} /></Layout>;

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
      let nextRedirect = String(result.redirect || '');
      if (referralCode && nextRedirect && !/[?&]ref=/.test(nextRedirect)) {
        nextRedirect += `${nextRedirect.includes('?') ? '&' : '?'}ref=${encodeURIComponent(referralCode)}`;
      }
      window.location.href = nextRedirect;
    } catch (failure) {
      setErrors(failure.data?.errors || {});
      window.showToast?.(failure.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const previewUrl = `${templatePreviewPath(template)}${referralCode ? `?ref=${encodeURIComponent(referralCode)}` : ''}`;
  const activePackage = template.packages.find((item) => item.code === form.package_code) || template.packages[0];
  const directEmbedUrl = `${templatePreviewPath(template)}?embed=1&package=${encodeURIComponent(activePackage.code)}${referralCode ? `&ref=${encodeURIComponent(referralCode)}` : ''}`;

  return <Layout className="order-page" title="Data Pemesan — Daymoment" navigation={referralNav}>
    <section className="flow-page">
      <div className="flow-grid">
        <aside className="choice-summary">
          <span className="eyebrow">Template pilihanmu</span>
          {!isMobile && <OrderPhonePreview template={template} packageCode={activePackage.code} />}
          <div className="preview-meta-row">
            <a
              className="back-link preview-back-circle"
              href={referralBackHref(referralCode, templateSlug(template))}
              aria-label="Kembali memilih template"
              title="Kembali memilih template"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </a>
            <span className="category-pill">{template.category}</span>
          </div>
          <h1>{template.name}</h1><p>{template.description}</p>
          {!isMobile && <a className="text-link" href={previewUrl}>Lihat preview penuh →</a>}
        </aside>
        <div className="flow-card">
          <span className="flow-step">Langkah 1 dari 2</span>
          <h2>Siapa yang membuat undangan?</h2>
          <p>Data ini hanya untuk order dan tidak akan tampil pada undangan publik.</p>
          <TemplateSwitcherDropdown
            templates={availableTemplates}
            currentTemplate={template}
            onSelect={(item) => handleTemplateSwitch(item.code)}
          />
          {isMobile && (
            <button
              type="button"
              className="order-mobile-preview-btn"
              onClick={() => setMobilePreviewOpen(true)}
            >
              <span className="order-mobile-preview-left">
                <svg className="order-mobile-preview-svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="order-mobile-preview-label">Lihat Preview</span>
                <span className="order-mobile-preview-tier">{activePackage.name}</span>
              </span>
              <svg className="order-mobile-preview-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          )}
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
            <label><span className="order-field-label">Nama lengkap pemesan <b className="required-star" aria-hidden="true">*</b></span><input value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} maxLength="120" placeholder="Contoh: Dandi Pratama" required/>{errors.customer_name && <small className="field-error">{errors.customer_name}</small>}</label>
            <label><span className="order-field-label">Email pemesan <b className="required-star" aria-hidden="true">*</b></span><input type="email" value={form.customer_email} onChange={(event) => setForm({ ...form, customer_email: event.target.value })} maxLength="254" placeholder="nama@email.com" autoComplete="email" required/><small className="field-help">Instruksi dan status pembayaran akan dikirim ke email ini.</small>{errors.customer_email && <small className="field-error">{errors.customer_email}</small>}</label>
            <label><span className="order-field-label">Nomor HP / WhatsApp <b className="required-star" aria-hidden="true">*</b></span><input type="tel" value={form.customer_phone} onChange={(event) => setForm({ ...form, customer_phone: event.target.value })} maxLength="24" placeholder="08xxxxxxxxxx atau +62xxxxxxxxxx" required/><small className="field-help">Dipakai untuk informasi order. Tidak ditampilkan ke tamu.</small>{errors.customer_phone && <small className="field-error">{errors.customer_phone}</small>}</label>
            <label className="check-label"><input type="checkbox" checked={form.agreement} onChange={(event) => setForm({ ...form, agreement: event.target.checked })}/><span>Saya menyetujui data ini digunakan untuk memproses pembuatan undangan.</span></label>
            {errors.agreement && <small className="field-error">{errors.agreement}</small>}
            <button className="button button-primary button-wide" disabled={submitting}>{submitting ? 'Memproses…' : 'Lanjutkan →'}</button>
          </form>
        </div>
      </div>
    </section>

    {isMobile && mobilePreviewOpen && (
      <div
        className="mobile-preview-modal is-open"
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${template.name} paket ${activePackage.name}`}
        onClick={() => setMobilePreviewOpen(false)}
      >
        <div className="mobile-preview-dialog" onClick={(event) => event.stopPropagation()}>
          <div className="mobile-preview-toolbar">
            <div className="mobile-preview-toolbar-info">
              <small>Sedang melihat</small>
              <strong>{activePackage.name}</strong>
              <a
                href={directEmbedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="preview-direct-link"
                title={`Buka preview paket ${activePackage.name} tanpa mockup di tab baru`}
              >
                <span>Buka link preview</span>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
            <button
              type="button"
              className="mobile-preview-close"
              aria-label="Tutup preview"
              onClick={() => setMobilePreviewOpen(false)}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className="mobile-preview-body">
            <div className="phone-mockup preview-phone">
              <div className="phone-speaker" />
              <iframe
                key={`${template.code}-${activePackage.code}`}
                className="preview-iframe"
                title={`Preview ${template.name} paket ${activePackage.name}`}
                src={directEmbedUrl}
              />
            </div>
          </div>
        </div>
      </div>
    )}
  </Layout>;
}
