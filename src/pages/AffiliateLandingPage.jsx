import React from 'react';
import { Layout } from '../components/Layout.jsx';
import { affiliateUrl } from '../lib/urls.js';

const benefits = [
  ['Link milikmu sendiri', 'Bagikan tautan referral yang langsung membawa calon pelanggan ke koleksi Daymoment.'],
  ['Komisi tercatat rapi', 'Setiap pembelian yang valid akan terhubung ke akun affiliate milikmu.'],
  ['Pantau dengan mudah', 'Lihat perkembangan referral dan komisi melalui dashboard affiliate.'],
];

export default function AffiliateLandingPage() {
  return <Layout className="homepage affiliate-landing" title="Program Affiliate — Daymoment">
    <section className="affiliate-hero">
      <div className="affiliate-hero-copy">
        <span className="eyebrow">Daymoment Affiliate</span>
        <h1>Bagikan momen baik, dapatkan penghasilan.</h1>
        <p>Rekomendasikan undangan digital Daymoment kepada pasangan yang sedang mempersiapkan hari bahagia. Kami mencatat setiap referral yang berhasil dengan transparan.</p>
        <div className="affiliate-actions">
          <a className="button button-primary" href={affiliateUrl('/register')}>Daftar Affiliate</a>
          <a className="button button-secondary" href={affiliateUrl('/login')}>Login Affiliate</a>
        </div>
        <div className="affiliate-assurances"><span>✓ Pendaftaran mudah</span><span>✓ Link referral personal</span><span>✓ Rekap komisi transparan</span></div>
      </div>
      <div className="affiliate-visual" aria-hidden="true">
        <div className="affiliate-ring ring-a"/><div className="affiliate-ring ring-b"/>
        <div className="affiliate-ticket">
          <span>DAYMOMENT PARTNER</span>
          <strong>Temukan cerita.<br/>Bagikan bahagia.</strong>
          <div><small>LINK REFERRAL</small><b>daymoment.biz.id/?ref=KODEMU</b></div>
        </div>
        <div className="affiliate-float float-sale"><b>+1</b><span>Referral berhasil</span></div>
        <div className="affiliate-float float-commission"><b>Rp</b><span>Komisi tercatat</span></div>
      </div>
    </section>

    <section className="affiliate-benefits">
      <div className="section-heading"><span className="eyebrow">Cara sederhana untuk bertumbuh bersama</span><h2>Satu rekomendasi bisa menjadi awal cerita baru.</h2></div>
      <div className="affiliate-benefit-grid">{benefits.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
    </section>

    <section className="affiliate-flow">
      <div><span className="eyebrow">Cara kerja</span><h2>Daftar, bagikan, lalu pantau hasilnya.</h2></div>
      <ol><li><b>Buat akun</b><span>Lengkapi data dan verifikasi email affiliate.</span></li><li><b>Bagikan link</b><span>Gunakan link personal di media sosial atau langsung ke calon pelanggan.</span></li><li><b>Dapatkan komisi</b><span>Komisi dicatat setelah pembayaran pelanggan berhasil diverifikasi.</span></li></ol>
    </section>

    <section className="affiliate-final-cta"><div><span className="eyebrow">Siap menjadi partner?</span><h2>Mulai bersama Daymoment hari ini.</h2><p>Buat akun affiliate dan siapkan link referral personalmu.</p></div><div className="affiliate-actions"><a className="button button-light" href={affiliateUrl('/register')}>Daftar sekarang</a><a className="affiliate-login-link" href={affiliateUrl('/login')}>Sudah punya akun? Login →</a></div></section>
    <footer className="site-footer"><a className="brand brand-light brand-wordmark-footer" href="/" aria-label="Daymoment, kembali ke beranda"><img className="brand-logo brand-logo-wordmark" src="/assets/images/brand/daymoment-logo-white.webp" alt="Daymoment" width="175" height="42" loading="lazy" decoding="async"/></a><p>Program partner untuk membagikan cerita baik lebih jauh.</p><small>© {new Date().getFullYear()} Daymoment.</small></footer>
  </Layout>;
}

