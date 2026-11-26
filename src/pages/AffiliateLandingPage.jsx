import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout.jsx';
import { affiliateUrl } from '../lib/urls.js';
import './affiliate-landing.css';

const GMAIL_COMPOSE_URL = 'https://mail.google.com/mail/?view=cm&fs=1&to=daymoment7%40gmail.com&su=Tanya%20%2F%20Order%20Undangan%20Digital%20Daymoment&body=Halo%20Tim%20Daymoment%2C%0A%0ASaya%20ingin%20bertanya%20atau%20memesan%20undangan%20digital%20Daymoment.%20Mohon%20informasinya%20ya.%20Terima%20kasih!';

const HIGHLIGHTS = [
  {
    code: '01',
    title: 'Gratis Bergabung',
    copy: 'Tanpa biaya pendaftaran dan tanpa target bulanan. Mulai rekomendasikan kapan saja sesuai ritmemu.',
  },
  {
    code: '02',
    title: 'Pelacakan Transparan',
    copy: 'Setiap klik, transaksi lunas, dan komisi dari link atau kode referral langsung terekam otomatis.',
  },
  {
    code: '03',
    title: 'Koleksi Undangan Premium',
    copy: 'Desain undangan digital Daymoment yang elegan dan siap pakai membuat rekomendasi lebih mudah diterima.',
  },
];

const BENEFITS = [
  {
    num: '01',
    title: 'Link & Etalase Personal',
    copy: 'Dapatkan link referral dan halaman etalase pribadi yang langsung membawa calon pengantin ke seluruh koleksi Daymoment.',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Komisi Tercatat Rapi',
    copy: 'Setiap pembelian valid yang berasal dari rekomendasimu otomatis masuk ke saldo komisi dengan rincian per pesanan.',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="2.5" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <line x1="6" y1="15" x2="10" y2="15" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Pantau & Cairkan Mudah',
    copy: 'Pantau performa views, klik, pesanan lunas, hingga pengajuan pencairan dana langsung dari dashboard affiliate.',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 3 3 5-6" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Buat akun partner',
    copy: 'Daftar gratis, lengkapi data singkat, dan verifikasi email agar akun affiliate segera aktif.',
  },
  {
    num: '02',
    title: 'Bagikan link personal',
    copy: 'Sematkan link atau etalase referral di bio media sosial, konten review, atau langsung ke calon pengantin.',
  },
  {
    num: '03',
    title: 'Terima & cairkan komisi',
    copy: 'Komisi otomatis dicatat setelah pembayaran pelanggan terverifikasi dan dapat ditarik ke rekeningmu.',
  },
];

const AUDIENCES = [
  {
    tag: 'Vendor & WO',
    title: 'Wedding Organizer & Vendor',
    copy: 'Tambahkan nilai lebih untuk klien pengantinmu sambil membuka sumber komisi tambahan.',
  },
  {
    tag: 'Kreator',
    title: 'Content Creator & Influencer',
    copy: 'Ubah inspirasi pernikahan di TikTok, Instagram, atau YouTube menjadi penghasilan berkelanjutan.',
  },
  {
    tag: 'Industri Kreatif',
    title: 'Fotografer, MUA & Dekorasi',
    copy: 'Rekomendasikan undangan digital yang serasi dengan hasil foto prewedding dan konsep acara klien.',
  },
  {
    tag: 'Terbuka',
    title: 'Siapa Saja yang Suka Berbagi',
    copy: 'Punya teman, kerabat, atau komunitas yang sedang menyiapkan acara? Cukup bagikan link personalmu.',
  },
];

function CornerFlourish({ className = '' }) {
  return (
    <svg className={`affx-corner ${className}`.trim()} viewBox="0 0 36 36" width="36" height="36" fill="none" aria-hidden="true">
      <path d="M2 34V8C2 4.686 4.686 2 8 2h26" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 28V11c0-2.209 1.791-4 4-4h17" stroke="currentColor" strokeWidth="0.8" opacity="0.55" />
      <circle cx="7" cy="7" r="1.6" fill="currentColor" />
    </svg>
  );
}

function EditorialDivider() {
  return (
    <div className="affx-divider" aria-hidden="true">
      <span className="affx-divider-line" />
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M12 2 14.8 9.2 22 12 14.8 14.8 12 22 9.2 14.8 2 12 9.2 9.2 12 2Z" />
      </svg>
      <span className="affx-divider-line" />
    </div>
  );
}

export default function AffiliateLandingPage() {
  const [loggedInAffiliate, setLoggedInAffiliate] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(null);

  useEffect(() => {
    let active = true;
    const checkSession = () => {
      fetch(affiliateUrl('/api/affiliate/session'), {
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!active) return;
          if (data?.authenticated && data?.affiliate) {
            setLoggedInAffiliate(data.affiliate);
          } else {
            setLoggedInAffiliate(null);
          }
        })
        .catch(() => {});
    };

    checkSession();
    const onFocus = () => checkSession();
    const onPageShow = () => checkSession();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkSession();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      active = false;
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const isLoggedIn = Boolean(loggedInAffiliate);

  return (
    <Layout className="homepage affiliate-landing affx-page" title="Program Affiliate — Daymoment">
      <div className="affx-wrapper">
        {/* SECTION 1: EDITORIAL HERO ON TACTILE IVORY PAPER */}
        <section className="affx-hero-band">
          <div className="affx-container affx-hero">
            <div className="affx-hero-copy">
              <div className="affx-eyebrow-pill">
                <span className="affx-eyebrow-diamond" aria-hidden="true">✦</span>
                <span>Program Partner Daymoment</span>
              </div>
              <h1>
                Bagikan momen baik, dapatkan <em>penghasilan</em>.
              </h1>
              <p className="affx-hero-lead">
                Rekomendasikan undangan digital Daymoment kepada pasangan yang sedang mempersiapkan hari bahagia. Setiap referral dan komisi dicatat otomatis dengan transparan.
              </p>

              <div className="affx-hero-actions">
                {isLoggedIn ? (
                  <a className="affx-btn affx-btn-primary" href={affiliateUrl('/dashboard')}>
                    <span>Akses ke Dashboard</span>
                    <span aria-hidden="true">→</span>
                  </a>
                ) : (
                  <>
                    <a className="affx-btn affx-btn-primary" href={affiliateUrl('/register')}>
                      <span>Daftar Affiliate</span>
                      <span aria-hidden="true">→</span>
                    </a>
                    <a className="affx-btn affx-btn-secondary" href={affiliateUrl('/login')}>
                      <span>Login Affiliate</span>
                    </a>
                  </>
                )}
              </div>

              {isLoggedIn && loggedInAffiliate?.full_name && (
                <p className="affx-session-note">
                  Sesi aktif sebagai <strong>{loggedInAffiliate.full_name}</strong>
                </p>
              )}
            </div>

            <div className="affx-hero-stage" aria-hidden="true">
              <div className="affx-stage-orbit affx-orbit-outer" />
              <div className="affx-stage-orbit affx-orbit-inner" />

              <div className="affx-float-row is-top">
                <div className="affx-float-badge">
                  <span className="affx-float-icon is-gold">+1</span>
                  <div>
                    <strong>Referral berhasil</strong>
                    <small>Tercatat otomatis</small>
                  </div>
                </div>
              </div>

              <div className="affx-pass-card">
                <div className="affx-pass-frame">
                  <CornerFlourish className="is-tl" />
                  <CornerFlourish className="is-tr" />
                  <CornerFlourish className="is-bl" />
                  <CornerFlourish className="is-br" />

                  <div className="affx-pass-top">
                    <span className="affx-pass-kicker">DAYMOMENT PARTNER</span>
                    <span className="affx-pass-seal">DM</span>
                  </div>

                  <div className="affx-pass-center">
                    <span className="affx-pass-rule" />
                    <strong>
                      Temukan cerita.
                      <br />
                      Bagikan <em>bahagia</em>.
                    </strong>
                    <p>Undangan digital elegan untuk setiap momen istimewa.</p>
                  </div>

                  <div className="affx-pass-footer">
                    <div className="affx-pass-linkbox">
                      <small>LINK REFERRAL PERSONAL</small>
                      <b>daymoment.id/?ref=KODEMU</b>
                    </div>
                    <div className="affx-pass-meta">
                      <span>Pelacakan otomatis</span>
                      <span>·</span>
                      <span>Pencairan mudah</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="affx-float-row is-bottom">
                <div className="affx-float-badge">
                  <span className="affx-float-icon is-emerald">Rp</span>
                  <div>
                    <strong>Komisi masuk</strong>
                    <small>Transparan &amp; rapi</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: ARCHITECTURAL HIGHLIGHTS STRIP */}
        <section className="affx-highlights-band" aria-label="Ringkasan program">
          <div className="affx-container">
            <div className="affx-highlights-grid">
              {HIGHLIGHTS.map((item) => (
                <article className="affx-highlight-item" key={item.code}>
                  <span className="affx-highlight-num">{item.code}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: EDITORIAL BENEFITS */}
        <section className="affx-benefits-band">
          <div className="affx-container">
            <header className="affx-section-head">
              <span className="affx-section-eyebrow">Cara sederhana untuk bertumbuh bersama</span>
              <h2>Satu rekomendasi bisa menjadi awal cerita baru.</h2>
              <EditorialDivider />
            </header>

            <div className="affx-benefits-grid">
              {BENEFITS.map((item) => (
                <article className="affx-benefit-card" key={item.num}>
                  <div className="affx-benefit-top">
                    <span className="affx-benefit-icon">{item.icon}</span>
                    <span className="affx-benefit-num">{item.num}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: DEEP EMERALD TEXTURED HOW-IT-WORKS BAND */}
        <section className="affx-flow-band">
          <div className="affx-container">
            <div className="affx-flow-shell">
              <CornerFlourish className="is-tl" />
              <CornerFlourish className="is-tr" />
              <CornerFlourish className="is-bl" />
              <CornerFlourish className="is-br" />

              <header className="affx-section-head is-light">
                <span className="affx-section-eyebrow">Cara kerja</span>
                <h2>Daftar, bagikan, lalu pantau hasilnya.</h2>
                <p>Tiga langkah singkat untuk mulai menghasilkan komisi bersama Daymoment.</p>
              </header>

              <ol className="affx-steps-grid">
                {STEPS.map((step, index) => {
                  const isFloated = activeStepIndex === index;
                  return (
                    <li
                      className={`affx-step-card ${isFloated ? 'is-floated' : ''}`.trim()}
                      key={step.num}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isFloated}
                      onClick={() => setActiveStepIndex((prev) => (prev === index ? null : index))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveStepIndex((prev) => (prev === index ? null : index));
                        }
                      }}
                    >
                      <div className="affx-step-head">
                        <span className="affx-step-num">{step.num}</span>
                        {index < STEPS.length - 1 && <span className="affx-step-arrow" aria-hidden="true">→</span>}
                      </div>
                      <h3>{step.title}</h3>
                      <p>{step.copy}</p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        {/* SECTION 5: WHO IT IS FOR */}
        <section className="affx-audience-band">
          <div className="affx-container">
            <header className="affx-section-head">
              <span className="affx-section-eyebrow">Terbuka untuk berbagai kalangan</span>
              <h2>Cocok untuk kamu yang dekat dengan dunia acara &amp; konten.</h2>
              <EditorialDivider />
            </header>

            <div className="affx-audience-grid">
              {AUDIENCES.map((item) => (
                <article className="affx-audience-card" key={item.title}>
                  <span className="affx-audience-tag">{item.tag}</span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6: FRAMED INVITATION CLOSING CTA */}
        <section className="affx-cta-band">
          <div className="affx-container">
            <div className="affx-cta-card">
              <div className="affx-cta-frame">
                <CornerFlourish className="is-tl" />
                <CornerFlourish className="is-tr" />
                <CornerFlourish className="is-bl" />
                <CornerFlourish className="is-br" />

                <span className="affx-cta-eyebrow">✦ Siap menjadi partner? ✦</span>
                <h2>Mulai bersama Daymoment hari ini.</h2>
                <p>Buat akun affiliate gratis dan siapkan link referral personalmu dalam hitungan menit.</p>

                <div className="affx-cta-actions">
                  {isLoggedIn ? (
                    <>
                      <a className="affx-btn affx-btn-gold" href={affiliateUrl('/dashboard')}>
                        <span>Akses ke Dashboard</span>
                        <span aria-hidden="true">→</span>
                      </a>
                      {loggedInAffiliate?.full_name && (
                        <p className="affx-cta-note">Masuk sebagai <strong>{loggedInAffiliate.full_name}</strong></p>
                      )}
                    </>
                  ) : (
                    <>
                      <a className="affx-btn affx-btn-gold" href={affiliateUrl('/register')}>
                        <span>Daftar sekarang</span>
                        <span aria-hidden="true">→</span>
                      </a>
                      <p className="affx-cta-note">
                        Sudah punya akun? <a href={affiliateUrl('/login')}>Login Affiliate →</a>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 7: EXACT HOME FOOTER (ICON + TEXT SOCIALS) */}
      <footer className="site-footer" role="contentinfo">
        <a className="brand brand-light brand-wordmark-footer" href="/" aria-label="Daymoment, kembali ke beranda">
          <img className="brand-logo brand-logo-wordmark" src="/assets/images/brand/daymoment-logo-white.webp" alt="Daymoment" width="136" height="48" decoding="async" />
        </a>
        <div className="footer-socials" aria-label="Media sosial Daymoment">
          <a className="footer-social-link" href="https://www.instagram.com/daymoment_id" target="_blank" rel="noopener noreferrer" aria-label="Instagram Daymoment">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            <span>Instagram</span>
          </a>
          <a className="footer-social-link" href="https://tiktok.com/@daymoment.id" target="_blank" rel="noopener noreferrer" aria-label="TikTok Daymoment">
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
          <a className="footer-social-link" href={GMAIL_COMPOSE_URL} target="_blank" rel="noopener noreferrer" aria-label="Email Daymoment via Gmail">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            <span>Email</span>
          </a>
        </div>
        <small>© {new Date().getFullYear()} Daymoment. Semua hak dilindungi.</small>
      </footer>
    </Layout>
  );
}
