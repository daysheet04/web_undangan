import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout.jsx';
import { affiliateUrl } from '../lib/urls.js';

const benefits = [
  ['Link milikmu sendiri', 'Bagikan tautan referral yang langsung membawa calon pelanggan ke koleksi Daymoment.'],
  ['Komisi tercatat rapi', 'Setiap pembelian yang valid akan terhubung ke akun affiliate milikmu.'],
  ['Pantau dengan mudah', 'Lihat perkembangan referral dan komisi melalui dashboard affiliate.'],
];

export default function AffiliateLandingPage() {
  const [loggedInAffiliate, setLoggedInAffiliate] = useState(null);

  useEffect(() => {
    let active = true;
    fetch(affiliateUrl('/api/affiliate/session'), {
      credentials: 'include',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.authenticated && data?.affiliate) {
          setLoggedInAffiliate(data.affiliate);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const isLoggedIn = Boolean(loggedInAffiliate);

  return <Layout className="homepage affiliate-landing" title="Program Affiliate — Daymoment">
    <section className="affiliate-hero">
      <div className="affiliate-hero-copy">
        <span className="eyebrow">Daymoment Affiliate</span>
        <h1>Bagikan momen baik, dapatkan penghasilan.</h1>
        <p>Rekomendasikan undangan digital Daymoment kepada pasangan yang sedang mempersiapkan hari bahagia. Kami mencatat setiap referral yang berhasil dengan transparan.</p>
        <div className="affiliate-actions">
          {isLoggedIn ? (
            <a className="button button-primary" href={affiliateUrl('/dashboard')}>Akses ke Dashboard →</a>
          ) : (
            <>
              <a className="button button-primary" href={affiliateUrl('/register')}>Daftar Affiliate</a>
              <a className="button button-secondary" href={affiliateUrl('/login')}>Login Affiliate</a>
            </>
          )}
        </div>
        <div className="affiliate-assurances"><span>✓ Pendaftaran mudah</span><span>✓ Link referral personal</span><span>✓ Rekap komisi transparan</span></div>
      </div>
      <div className="affiliate-visual" aria-hidden="true">
        <div className="affiliate-ring ring-a"/><div className="affiliate-ring ring-b"/>
        <div className="affiliate-ticket">
          <span>DAYMOMENT PARTNER</span>
          <strong>Temukan cerita.<br/>Bagikan bahagia.</strong>
          <div><small>LINK REFERRAL</small><b>daymoment.id/?ref=KODEMU</b></div>
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

    <section className="affiliate-final-cta">
      <div className="affiliate-final-cta-inner">
        <span className="eyebrow">Siap menjadi partner?</span>
        <h2>Mulai bersama Daymoment hari ini.</h2>
        <p>Buat akun affiliate dan siapkan link referral personalmu.</p>
        <div className="affiliate-final-cta-actions">
          {isLoggedIn ? (
            <>
              <a className="affiliate-cta-gold-btn" href={affiliateUrl('/dashboard')}>Akses ke Dashboard <span aria-hidden="true">→</span></a>
              {loggedInAffiliate?.full_name && (
                <p className="affiliate-final-login-note">Masuk sebagai <strong>{loggedInAffiliate.full_name}</strong></p>
              )}
            </>
          ) : (
            <>
              <a className="affiliate-cta-gold-btn" href={affiliateUrl('/register')}>Daftar sekarang <span aria-hidden="true">→</span></a>
              <p className="affiliate-final-login-note">Sudah punya akun? <a className="affiliate-login-link" href={affiliateUrl('/login')}>Login →</a></p>
            </>
          )}
        </div>
      </div>
    </section>
    <footer className="site-footer affiliate-landing-footer" role="contentinfo">
      <a className="brand brand-light brand-wordmark-footer" href="/" aria-label="Daymoment, kembali ke beranda">
        <img className="brand-logo brand-logo-wordmark" src="/assets/images/brand/daymoment-logo-white.webp" alt="Daymoment" width="142" height="44" loading="lazy" decoding="async"/>
      </a>
      <p>Program partner untuk membagikan cerita baik lebih jauh.</p>
      <div className="affiliate-footer-socials" aria-label="Media sosial Daymoment">
        <a href="https://www.instagram.com/daymoment_id" target="_blank" rel="noopener noreferrer" aria-label="Instagram Daymoment">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        </a>
        <a href="https://tiktok.com/@daymoment.id" target="_blank" rel="noopener noreferrer" aria-label="TikTok Daymoment">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
          </svg>
        </a>
        <a href="https://wa.me/6285111451135" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Daymoment">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </a>
      </div>
      <small>© {new Date().getFullYear()} Daymoment.</small>
    </footer>
  </Layout>;
}

