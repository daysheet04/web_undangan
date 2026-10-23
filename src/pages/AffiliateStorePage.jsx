import React from 'react';
import { Layout, Loading, ErrorState } from '../components/Layout.jsx';
import { money } from '../lib/api.js';
import { useRemote } from '../lib/hooks.js';
import TemplateCover from '../components/TemplateCover.jsx';

function partnerWhatsapp(phone, name) {
  const digits = String(phone || '').replace(/\D/g, '');
  const number = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  if (!number) return '';
  const message = `Halo Kak ${name || 'Partner Daymoment'}, saya melihat etalase undangan Daymoment Anda dan ingin bertanya mengenai pemesanan.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function displayPhone(phone) {
  const value = String(phone || '').trim();
  return value.startsWith('+62') ? `0${value.slice(3)}` : value;
}

export default function AffiliateStorePage({ referralCode }) {
  const code = String(referralCode || '').trim().replace(/[^a-zA-Z0-9]/g, '');
  const { data, loading, error } = useRemote(`/api/affiliate-catalog/${encodeURIComponent(code)}`, [code]);
  const suspended = error?.data?.code === 'AFFILIATE_SUSPENDED';
  const referralPath = `/ref/${encodeURIComponent(code)}`;
  const storeNavigation = {
    scoped: true,
    homeHref: referralPath,
    templateHref: `${referralPath}#affiliate-products`,
    templateTargetId: 'affiliate-products',
    templateLabel: 'Produk',
    stepsHref: `${referralPath}#affiliate-order-steps`,
    stepsTargetId: 'affiliate-order-steps',
    stepsLabel: 'Cara Pemesanan',
    showAffiliate: false,
  };
  const limitedNavigation = { ...storeNavigation, showSecondary: false };

  if (loading) return <Layout className="homepage affiliate-store-page" title="Memeriksa Link Referral — Daymoment" navigation={limitedNavigation}>
    <section className="affiliate-referral-check" aria-live="polite">
      <Loading showLabel/>
    </section>
  </Layout>;

  if (suspended) return <Layout className="homepage affiliate-store-page" title="Link Referral Tidak Aktif — Daymoment" navigation={limitedNavigation}>
    <section className="affiliate-referral-unavailable" role="status">
      <span className="eyebrow">Daymoment Partner</span>
      <div className="affiliate-referral-unavailable-icon" aria-hidden="true">!</div>
      <h1>Link referral sudah tidak aktif.</h1>
      <p>Akun affiliate pemilik link ini sedang ditangguhkan, sehingga link belum dapat digunakan untuk membuat pesanan baru.</p>
      <small>Pesanan yang sudah dibuat sebelumnya tetap dapat dilanjutkan melalui halaman pembayaran atau panel editor masing-masing.</small>
      <a className="button button-primary" href="/">Lihat template Daymoment</a>
    </section>
  </Layout>;

  if (error) return <Layout className="homepage affiliate-store-page" title="Link Referral — Daymoment" navigation={limitedNavigation}>
    <ErrorState error={error}/>
  </Layout>;

  const partnerName = data.partner.display_name;
  const partnerPhone = displayPhone(data.partner.phone);
  const partnerWhatsappUrl = partnerWhatsapp(data.partner.phone, partnerName);

  return <Layout className="homepage affiliate-store-page" title="Pilihan Undangan — Daymoment" navigation={storeNavigation}>
    <section className="affiliate-store-hero" id="affiliate-home">
      <div className="affiliate-store-hero-copy">
        <span className="eyebrow">Koleksi pilihan partner Daymoment</span>
        <h1>Temukan undangan yang terasa seperti kisahmu.</h1>
        <p>Jelajahi template dan paket pilihan partner kami. Setiap pembelian melalui halaman ini otomatis tercatat menggunakan kode referral <strong>{code}</strong>.</p>
        <a className="button button-primary" href="#affiliate-products">Lihat pilihan produk</a>
        <div className="affiliate-partner-contact">
          <div><small>Partner Daymoment</small><strong>{partnerName}</strong></div>
          {partnerWhatsappUrl && <a href={partnerWhatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={`Hubungi ${partnerName} melalui WhatsApp`}><span>WhatsApp</span><b>{partnerPhone}</b></a>}
        </div>
      </div>
      <div className="affiliate-store-brand-mark">
        <img src="/assets/images/brand/daymoment-logo.webp" alt="Daymoment" width="360" height="129" loading="eager" decoding="async" />
      </div>
    </section>

    <section className="affiliate-store-products" id="affiliate-products">
      <>
        <div className="section-heading">
          <span className="eyebrow">Etalase {partnerName}</span>
          <h2>Produk yang direkomendasikan</h2>
          <p>Hanya paket yang dipilih oleh partner ini yang ditampilkan.</p>
        </div>
        {!data.templates.length ? <div className="affiliate-store-empty"><span>01</span><h3>Etalase sedang disiapkan</h3><p>Partner ini belum memilih produk untuk ditampilkan.</p></div> : <div className="affiliate-store-grid">
          {data.templates.map((template, index) => <article className="affiliate-store-card" key={template.id}>
            <TemplateCover template={template} eager={index < 2} />
            <div className="affiliate-store-card-body">
              <div className="template-meta"><span>{template.category}</span><span>{template.package_count} paket pilihan</span></div>
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <div className="affiliate-store-packages">
                {template.packages.map((product) => <div key={product.id}>
                  <span><b>{product.name}</b><small>{product.tagline}</small></span>
                  <strong>{money(product.price)}</strong>
                  <a href={`/order?template=${encodeURIComponent(template.code)}&package=${encodeURIComponent(product.code)}&ref=${encodeURIComponent(code)}`}>Pilih</a>
                </div>)}
              </div>
              <a className="affiliate-store-preview" href={`/template/${encodeURIComponent(template.code)}?ref=${encodeURIComponent(code)}`}>Lihat preview template <span>→</span></a>
            </div>
          </article>)}
        </div>}
      </>
    </section>

    <section className="steps-section affiliate-store-order-steps" id="affiliate-order-steps">
      <div className="section-heading">
        <span className="eyebrow">Cara pemesanan melalui partner</span>
        <h2>Tiga langkah menuju undanganmu</h2>
        <p>Kode referral <strong>{code}</strong> akan tetap tercatat otomatis selama proses pemesanan.</p>
      </div>
      <div className="steps-grid">
        <article><span className="step-number">01</span><h3>Pilih produk</h3><p>Tentukan template dan paket yang paling sesuai dari etalase partner.</p></article>
        <article><span className="step-number">02</span><h3>Lengkapi pesanan</h3><p>Isi data pemesan lalu selesaikan pembayaran sesuai petunjuk.</p></article>
        <article><span className="step-number">03</span><h3>Edit dan bagikan</h3><p>Personalisasi undanganmu di panel editor, kemudian terbitkan dan bagikan.</p></article>
      </div>
    </section>

    <footer className="site-footer" role="contentinfo">
      <a className="brand brand-light brand-wordmark-footer" href={referralPath} aria-label="Daymoment, kembali ke beranda etalase partner"><img className="brand-logo brand-logo-wordmark" src="/assets/images/brand/daymoment-logo-white.webp" alt="Daymoment" width="175" height="42" loading="lazy" decoding="async"/></a>
      <p>Undangan digital yang dibuat untuk merayakan setiap cerita.</p>
      <div className="footer-socials" aria-label="Media sosial Daymoment">
        <a className="footer-social-link" href="https://instagram.com/daymoment.biz.id" target="_blank" rel="noopener noreferrer" aria-label="Instagram Daymoment"><SocialIcon type="instagram"/><span>Instagram</span></a>
        <a className="footer-social-link" href="https://tiktok.com/@daymoment.biz.id" target="_blank" rel="noopener noreferrer" aria-label="TikTok Daymoment"><SocialIcon type="tiktok"/><span>TikTok</span></a>
        <a className="footer-social-link" href="https://facebook.com/daymoment.biz.id" target="_blank" rel="noopener noreferrer" aria-label="Facebook Daymoment"><SocialIcon type="facebook"/><span>Facebook</span></a>
        <a className="footer-social-link" href="https://wa.me/6285111451135" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Daymoment"><SocialIcon type="whatsapp"/><span>WhatsApp</span></a>
        <a className="footer-social-link" href="mailto:daymoment7@gmail.com" aria-label="Email Daymoment"><SocialIcon type="email"/><span>Email</span></a>
      </div>
      <small>© {new Date().getFullYear()} Daymoment. Semua hak dilindungi.</small>
    </footer>
  </Layout>;
}

function SocialIcon({ type }) {
  if (type === 'instagram') return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1"/></svg>;
  if (type === 'tiktok') return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-2.01-2.77V9.4a6.34 6.34 0 1 0 5.32 6.26V8.72a8.16 8.16 0 0 0 4.91 1.63V6.9c-.34 0-.67-.07-1-.21z"/></svg>;
  if (type === 'facebook') return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8h3V4h-3c-3.31 0-6 2.69-6 6v2H5v4h3v8h4v-8h4l1-4h-5v-2c0-1.1.9-2 2-2z"/></svg>;
  if (type === 'whatsapp') return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.95 1.18-.18.2-.35.23-.65.08-1.77-.89-2.93-1.58-4.1-3.59-.31-.54.31-.5.89-1.67.1-.2.05-.38-.03-.53-.08-.15-.68-1.63-.93-2.24-.24-.59-.49-.51-.68-.52h-.58c-.2 0-.53.08-.8.38-2.76 3.02-1.01 6.79.3 8.53 2.58 3.44 6.27 4.83 8.85 4.02.7-.22 1.78-.73 2.03-1.43.25-.7.25-1.31.18-1.43-.08-.13-.28-.2-.58-.35zM12.04 21.67a9.63 9.63 0 0 1-4.92-1.34l-4.02 1.05 1.08-3.94A9.63 9.63 0 1 1 12.04 21.67z"/></svg>;
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>;
}
