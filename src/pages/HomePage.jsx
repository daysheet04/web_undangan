import React from 'react';
import { Layout, Loading, ErrorState } from '../components/Layout.jsx';
import { money } from '../lib/api.js';
import { useRemote } from '../lib/hooks.js';
import TemplateCover from '../components/TemplateCover.jsx';

const steps = [
  ['01', 'Pilih nuansa', 'Temukan template yang paling mewakili karakter dan suasana hari bahagiamu.'],
  ['02', 'Rangkai ceritamu', 'Isi detail acara, perjalanan cinta, dan foto sambil melihat hasilnya langsung.'],
  ['03', 'Bagikan kebahagiaan', 'Terbitkan undangan dan kirimkan tautan personal kepada orang-orang tersayang.'],
];

export default function HomePage() {
  const { data, loading, error } = useRemote('/api/templates');
  const templates = data?.templates || [];
  const heroImage = data?.homepage?.hero_image_url || '';

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
        <span className="eyebrow">Undangan digital yang terasa personal</span>
        <h1>Rayakan kisahmu, <em>selembut</em> momen yang dikenang.</h1>
        <p>Wujudkan undangan pernikahan yang indah, hangat, dan benar-benar terasa seperti kalian—siap dibagikan kepada orang tersayang.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="#templates" onClick={(e) => scrollToSection(e, 'templates')}>Temukan Template</a>
          <a className="text-link" href="#cara-kerja" onClick={(e) => scrollToSection(e, 'cara-kerja')}>Lihat cara kerjanya <span>→</span></a>
        </div>
        <div className="hero-trust" aria-label="Keunggulan Daymoment">
          <span><i>01</i> Preview langsung</span>
          <span><i>02</i> Mudah disunting</span>
          <span><i>03</i> Nyaman di ponsel</span>
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
            {heroImage
              ? <img src={heroImage} alt="Visual undangan pernikahan Daymoment" width="236" height="472" loading="eager" decoding="async" />
              : <div className="mini-cover mini-pastel"><div className="mini-frame"><span className="mini-kicker">The Wedding of</span><strong>A <i>&amp;</i> N</strong><small>Andi &amp; Nisa</small><span className="mini-button">Buka Undangan</span></div></div>}
          </div>
        </div>
        <div className="floating-note note-one"><span>✦</span><div><small>Siap dibagikan</small><b>Untuk hari bahagia</b></div></div>
        <div className="floating-note note-two"><span>♡</span><div><small>Dibuat personal</small><b>Seperti kisah kalian</b></div></div>
      </div>
    </section>

    <section className="home-story-strip" aria-label="Keistimewaan Daymoment">
      <article><span>01</span><div><h2>Desain berkarakter</h2><p>Nuansa yang dipilih dengan hati, bukan sekadar tampilan.</p></div></article>
      <article><span>02</span><div><h2>Detail yang personal</h2><p>Nama, warna, foto, dan cerita hadir sebagai milik kalian.</p></div></article>
      <article><span>03</span><div><h2>Indah di setiap layar</h2><p>Nyaman dibuka dan dibagikan dari perangkat apa pun.</p></div></article>
    </section>

    <section className="templates-section" id="templates">
      <div className="section-heading"><span className="eyebrow">Koleksi pilihan Daymoment</span><h2>Pilih suasana yang terasa seperti kalian</h2><p>Dari lembut dan romantis hingga megah dan sinematik, setiap desain punya caranya sendiri untuk bercerita.</p></div>
      {loading ? <Loading /> : error ? <ErrorState error={error} /> : <div className="template-grid">
        {!templates.length && <div className="template-empty"><span>01</span><h3>Template pertama sedang disiapkan</h3><p>Koleksi baru akan hadir di area ini.</p></div>}
        {templates.map((template, index) => <article className="template-card" key={template.id}>
          <TemplateCover template={template} eager={index < 3} />
          <div className="template-card-body"><div className="template-meta"><span>{template.category}</span><span>{template.package_count} paket</span></div><h3>{template.name}</h3><p>{template.description}</p>{template.starting_price && <p className="template-starting-price">Mulai {money(template.starting_price)}</p>}<div className="card-actions"><a className="button button-secondary" href={`/template/${template.code}`}>Lihat Preview</a><a className="button button-primary" href={`/order?template=${template.code}`}>Pilih Template</a></div></div>
        </article>)}
      </div>}
    </section>

    <section className="steps-section" id="cara-kerja">
      <div className="section-heading"><span className="eyebrow">Mudah dari awal hingga dibagikan</span><h2>Tiga langkah untuk menghidupkan ceritamu</h2></div>
      <div className="steps-grid">{steps.map((step) => <article key={step[0]}><span className="step-number">{step[0]}</span><div><h3>{step[1]}</h3><p>{step[2]}</p></div></article>)}</div>
    </section>

    <section className="home-cta"><div><span className="eyebrow">Satu hari, seribu kenangan</span><h2>Biarkan undanganmu menjadi awal dari cerita yang indah.</h2><p>Pilih nuansa favoritmu dan mulai susun setiap detailnya.</p></div><a className="button button-light" href="#templates" onClick={(e) => scrollToSection(e, 'templates')}>Mulai Sekarang</a></section>
    <footer className="site-footer" role="contentinfo"><a className="brand brand-light brand-wordmark-footer" href="/" aria-label="Daymoment, kembali ke beranda"><img className="brand-logo brand-logo-wordmark" src="/assets/images/brand/daymoment-logo-white.webp" alt="Daymoment" width="136" height="48" loading="lazy" decoding="async" /></a><p>Dibuat untuk merayakan cerita yang tumbuh menjadi selamanya.</p><small>© {new Date().getFullYear()} Daymoment. Semua hak dilindungi.</small></footer>
  </Layout>;
}
