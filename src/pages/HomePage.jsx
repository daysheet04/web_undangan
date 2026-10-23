import React from 'react';
import { Layout, Loading, ErrorState } from '../components/Layout.jsx';
import { money } from '../lib/api.js';
import { useRemote } from '../lib/hooks.js';
import TemplateCover from '../components/TemplateCover.jsx';
import HeroPhoneSlideshow from '../components/HeroPhoneSlideshow.jsx';
import FeedbackSection from '../components/FeedbackSection.jsx';

const steps = [
  ['01', 'Pilih Template', 'Temukan template yang paling mewakili karakter dan momen hari bahagiamu.'],
  ['02', 'Lengkapi Undanganmu', 'Isi informasi Pasangan, Tempat Acara, Lokasi Acara, dan Unggah Foto sesuai momen indahmu'],
  ['03', 'Saatnya Berbagi', 'Bagikan undangan pernikahanmu kepada orang tersayang dan ajak mereka hadir dimomen yang paling berarti bagimu'],
];

export default function HomePage() {
  const { data, loading, error } = useRemote('/api/templates');
  const templates = data?.templates || [];

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  return <Layout className="homepage" title="Daymoment — Undangan Pernikahan Digital Elegan & Personal">
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">Undangan Untuk Momen Yang Indah</span>
        <h1>Bagikan Setiap Momen, Dengan Undangan <em>Yang Berkesan</em></h1>
        <p>Temukan Desain Favorit, Edit Sesuai Kebutuhan dan Bagikan Undangan Dengan Satu Tautan</p>
        <div className="hero-actions" >
          <a className="button button-primary" href="#templates" onClick={(e) => scrollToSection(e, 'templates')}>Pilih Template</a>
          <a className="text-link" href="#cara-kerja" onClick={(e) => scrollToSection(e, 'cara-kerja')}>Langkah Pemesanan <span>→</span></a>
        </div>
      </div>

      <div className="hero-visual" aria-label="Preview undangan digital Daymoment">
        <span className="hero-petal petal-one" />
        <span className="hero-petal petal-two" />
        <span className="hero-petal petal-three" />
        <div className="hero-arch"><span>made for<br />your story</span></div>
        <div className="phone-mockup hero-phone">
          <div className="phone-speaker" />
          <div className="hero-phone-screen">
            <HeroPhoneSlideshow templates={templates} />
          </div>
        </div>
        <div className="floating-note note-one"><span>✦</span><div><small>Siap dibagikan</small><b>Untuk hari bahagia</b></div></div>
        <div className="floating-note note-two"><span>♡</span><div><small>Dibuat personal</small><b>Seperti kisah kalian</b></div></div>
      </div>
    </section>

    <section className="templates-section" id="templates">
      <div className="section-heading"><span className="eyebrow">Koleksi pilihan Daymoment</span><h2>Mau Yang Simple, Romantis, Wah ?</h2><p>Temukan desain undangan yang cocok dengan kalian</p></div>
      {loading ? <Loading /> : error ? <ErrorState error={error} /> : <div className="template-grid">
        {!templates.length && <div className="template-empty"><span>01</span><h3>Template pertama sedang disiapkan</h3><p>Koleksi baru akan hadir di area ini.</p></div>}
        {templates.map((template, index) => <article className="template-card" key={template.id}>
          <TemplateCover
            template={template}
            eager={index < 3}
          />
          <div className="template-card-body"><div className="template-meta"><span>{template.category}</span><span>{template.package_count} paket</span></div><h3>{template.name}</h3><p>{template.description}</p>{template.starting_price && <p className="template-starting-price">Mulai {money(template.starting_price)}</p>}<div className="card-actions"><a className="button button-secondary" href={`/template/${template.code}`}>Lihat Preview</a><a className="button button-primary" href={`/order?template=${template.code}`}>Pilih Template</a></div></div>
        </article>)}
      </div>}
    </section>

    <section className="steps-section" id="cara-kerja">
      <div className="section-heading"><span className="eyebrow">Langkah Pemesanan</span><h2>Pesan Undanganmu Dalam 3 Langkah</h2></div>
      <div className="steps-grid">{steps.map((step) => <article key={step[0]}><span className="step-number">{step[0]}</span><div><h3>{step[1]}</h3><p>{step[2]}</p></div></article>)}</div>
    </section>

    <FeedbackSection />

    <footer className="site-footer" role="contentinfo">
      <a className="brand brand-light brand-wordmark-footer" href="/" aria-label="Daymoment, kembali ke beranda">
        <img className="brand-logo brand-logo-wordmark" src="/assets/images/brand/daymoment-logo-white.webp" alt="Daymoment" width="136" height="48" loading="lazy" decoding="async" />
      </a>
      <div className="footer-socials" aria-label="Media sosial Daymoment">
        <a className="footer-social-link" href="https://instagram.com/daymoment.biz.id" target="_blank" rel="noopener noreferrer" aria-label="Instagram Daymoment">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
          <span>Instagram</span>
        </a>
        <a className="footer-social-link" href="https://tiktok.com/@daymoment.biz.id" target="_blank" rel="noopener noreferrer" aria-label="TikTok Daymoment">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.48 6.3 6.3 0 0 0 1.86-4.48V8.72a8.16 8.16 0 0 0 4.91 1.63V6.9a4.85 4.85 0 0 1-1-.21z" />
          </svg>
          <span>TikTok</span>
        </a>
        <a className="footer-social-link" href="https://wa.me/6285111451135" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Daymoment">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.18-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.783-1.676-2.084-.175-.301-.019-.464.132-.614.136-.135.301-.351.451-.527.151-.176.201-.301.302-.502.1-.2.05-.376-.026-.526-.075-.15-.677-1.633-.928-2.238-.244-.59-.493-.51-.677-.52l-.578-.01c-.2 0-.527.076-.803.377-.276.301-1.054 1.03-1.054 2.513s1.08 2.913 1.23 3.114c.15.2 2.125 3.245 5.148 4.552.719.31 1.28.496 1.718.636.722.23 1.378.198 1.898.12.579-.087 1.78-.727 2.03-1.43.251-.703.251-1.305.176-1.43-.075-.125-.276-.201-.577-.351zM12.042 21.67A9.63 9.63 0 0 1 7.12 20.33l-.352-.209-3.666.962.978-3.573-.23-.366a9.63 9.63 0 1 1 8.192 4.526zm0-17.67a8.03 8.03 0 0 0-6.953 12.067l.38.605-.584 2.132 2.18-.572.587.348a8.03 8.03 0 1 0 3.99-14.58z" />
          </svg>
          <span>WhatsApp</span>
        </a>
        <a className="footer-social-link" href="mailto:daymoment7@gmail.com" aria-label="Email Daymoment">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
          <span>Email</span>
        </a>
      </div>
      <small>© {new Date().getFullYear()} Daymoment. Semua hak dilindungi.</small>
    </footer>
  </Layout>;
}
