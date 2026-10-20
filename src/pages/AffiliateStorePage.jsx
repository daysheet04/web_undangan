import React from 'react';
import { Layout, Loading, ErrorState } from '../components/Layout.jsx';
import { money } from '../lib/api.js';
import { useRemote } from '../lib/hooks.js';
import TemplateCover from '../components/TemplateCover.jsx';

export default function AffiliateStorePage({ referralCode }) {
  const code = String(referralCode || '').trim().replace(/[^a-zA-Z0-9]/g, '');
  const { data, loading, error } = useRemote(`/api/affiliate-catalog/${encodeURIComponent(code)}`, [code]);
  const suspended = error?.data?.code === 'AFFILIATE_SUSPENDED';

  if (loading) return <Layout className="homepage affiliate-store-page" title="Memeriksa Link Referral — Daymoment">
    <section className="affiliate-referral-check" aria-live="polite">
      <Loading showLabel/>
    </section>
  </Layout>;

  if (suspended) return <Layout className="homepage affiliate-store-page" title="Link Referral Tidak Aktif — Daymoment">
    <section className="affiliate-referral-unavailable" role="status">
      <span className="eyebrow">Daymoment Partner</span>
      <div className="affiliate-referral-unavailable-icon" aria-hidden="true">!</div>
      <h1>Link referral sudah tidak aktif.</h1>
      <p>Akun affiliate pemilik link ini sedang ditangguhkan, sehingga link belum dapat digunakan untuk membuat pesanan baru.</p>
      <small>Pesanan yang sudah dibuat sebelumnya tetap dapat dilanjutkan melalui halaman pembayaran atau panel editor masing-masing.</small>
      <a className="button button-primary" href="/">Lihat template Daymoment</a>
    </section>
  </Layout>;

  if (error) return <Layout className="homepage affiliate-store-page" title="Link Referral — Daymoment">
    <ErrorState error={error}/>
  </Layout>;

  return <Layout className="homepage affiliate-store-page" title="Pilihan Undangan — Daymoment">
    <section className="affiliate-store-hero">
      <div className="affiliate-store-hero-copy">
        <span className="eyebrow">Koleksi pilihan partner Daymoment</span>
        <h1>Temukan undangan yang terasa seperti kisahmu.</h1>
        <p>Jelajahi template dan paket pilihan partner kami. Setiap pembelian melalui halaman ini otomatis tercatat menggunakan kode referral <strong>{code}</strong>.</p>
        <a className="button button-primary" href="#affiliate-products">Lihat pilihan produk</a>
      </div>
      <div className="affiliate-store-seal" aria-hidden="true"><span>D</span><small>Partner collection</small></div>
    </section>

    <section className="affiliate-store-products" id="affiliate-products">
      <>
        <div className="section-heading">
          <span className="eyebrow">Etalase {data.partner.display_name}</span>
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

    <footer className="site-footer"><a className="brand brand-light brand-wordmark-footer" href="/" aria-label="Daymoment, kembali ke beranda"><img className="brand-logo brand-logo-wordmark" src="/assets/images/brand/daymoment-logo-white.webp" alt="Daymoment" width="175" height="42" loading="lazy" decoding="async"/></a><p>Undangan digital yang dibuat untuk merayakan setiap cerita.</p><small>© {new Date().getFullYear()} Daymoment.</small></footer>
  </Layout>;
}
