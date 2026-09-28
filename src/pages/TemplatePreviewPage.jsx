import React, { useEffect, useState } from 'react';
import { Layout, ErrorState } from '../components/Layout.jsx';
import { money } from '../lib/api.js';
import { useRemote } from '../lib/hooks.js';

function PreviewPhone({ template, active }) {
  return (
    <div className="phone-mockup preview-phone">
      <div className="phone-speaker" />
      <iframe
        className="preview-iframe"
        title={`Preview ${template.name} paket ${active.name}`}
        src={`/template/${template.code}?embed=1&package=${active.code}`}
      />
    </div>
  );
}

export default function TemplatePreviewPage({ code }) {
  const { data, loading, error } = useRemote(`/api/templates/${code}`, [code]);
  const [selected, setSelected] = useState('signature');
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

  if (loading) return <Layout className="preview-page" />;
  if (error) return <Layout className="preview-page"><ErrorState error={error} /></Layout>;

  const template = data.template;
  const active = template.packages.find((item) => item.code === selected) || template.packages[0];

  const viewPackage = (packageCode) => {
    setSelected(packageCode);
    if (isMobile) setMobilePreviewOpen(true);
  };

  return (
    <Layout className="preview-page" title={`Preview ${template.name} — Daymoment`}>
      <section className="preview-showcase">
        <div className="preview-info">
          <a className="back-link" href="/#templates">← Kembali ke pilihan</a>
          <span className="category-pill">{template.category}</span>
          <h1>{template.name}</h1>
          <p>{template.description}</p>

          <div className="preview-package-heading">
            <span>Pilih pengalaman undangan</span>
            <p>Desain utama tetap sama. Fitur dan jumlah momen menyesuaikan paket.</p>
          </div>

          <div className="preview-package-grid">
            {template.packages.map((item) => {
              const isActive = item.code === active.code;
              const isBeingViewed = isActive && (!isMobile || mobilePreviewOpen);
              return (
                <article className={`preview-package-card ${isActive ? 'active' : ''}`} key={item.id}>
                  {item.code === 'signature' && <span className="preview-package-badge">Paling populer</span>}
                  <div className="preview-package-name">
                    <strong>{item.name}</strong>
                    <b>{money(item.price)}</b>
                  </div>
                  <p>{item.tagline}</p>
                  <div className={`package-photo-demo package-photo-demo-${item.gallery_limit}`}>
                    {Array.from({ length: item.gallery_limit }, (_, index) => (
                      <i key={index}><span>{index + 1}</span></i>
                    ))}
                  </div>
                  <ul>
                    <li>{item.gallery_limit} foto momen</li>
                    <li>{item.has_music ? 'Musik undangan' : 'Tanpa musik'}</li>
                    <li>{item.has_wishes ? 'Ucapan & RSVP' : 'Tanpa ucapan & RSVP'}</li>
                    <li>{item.has_gift ? 'Amplop digital' : 'Tanpa amplop digital'}</li>
                  </ul>
                  <button
                    type="button"
                    className={`button ${isBeingViewed ? 'button-primary' : 'button-secondary'} preview-package-button`}
                    onClick={() => viewPackage(item.code)}
                    aria-pressed={isBeingViewed}
                  >
                    {isBeingViewed ? 'Sedang dilihat' : `Lihat ${item.name}`}
                  </button>
                </article>
              );
            })}
          </div>

          <a className="button button-primary preview-order-button" href={`/order?template=${template.code}&package=${active.code}`}>
            Pilih Paket {active.name}
          </a>
        </div>

        {!isMobile && (
          <div className="preview-phone-wrap preview-phone-wrap--desktop">
            <div className="preview-phone-label">
              <span>Preview <b>{active.name}</b></span>
              <small>Klik “Buka Undangan” di dalam layar</small>
            </div>
            <PreviewPhone template={template} active={active} />
          </div>
        )}
      </section>

      {isMobile && mobilePreviewOpen && (
        <div
          className="mobile-preview-modal is-open"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview paket ${active.name}`}
          onClick={() => setMobilePreviewOpen(false)}
        >
          <div className="mobile-preview-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-preview-toolbar">
              <div>
                <small>Sedang melihat</small>
                <strong>{active.name}</strong>
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
              <PreviewPhone template={template} active={active} />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
