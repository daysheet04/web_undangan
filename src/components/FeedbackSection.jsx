import React, { useState } from 'react';
import { post } from '../lib/api.js';

export default function FeedbackSection() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedName, setSubmittedName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setErrorMessage('Mohon masukkan nama Anda.');
      setStatus('error');
      return;
    }
    if (!trimmedMessage || trimmedMessage.length < 3) {
      setErrorMessage('Mohon tuliskan saran atau kritik Anda minimal 3 karakter.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await post('/api/feedback', {
        name: trimmedName,
        message: trimmedMessage,
      });

      setSubmittedName(trimmedName);
      setName('');
      setMessage('');
      setStatus('success');
      window.showToast?.(res?.message || 'Terima kasih banyak atas saran dan masukan Anda!');
    } catch (err) {
      // Fallback darurat: jika server worker belum terhubung, kirim langsung via FormSubmit.co
      const isNetworkError = !err.status || String(err.message || '').includes('Server belum terhubung');
      if (isNetworkError) {
        try {
          const directRes = await fetch('https://formsubmit.co/ajax/daymoment7@gmail.com', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              _subject: `[Daymoment] Saran & Kritik Baru dari ${trimmedName}`,
              _template: 'table',
              _captcha: 'false',
              'Nama Pengirim': trimmedName,
              'Saran & Kritik': trimmedMessage,
              'Waktu Pengiriman': new Date().toLocaleString('id-ID'),
            }),
          });
          const directData = await directRes.json().catch(() => ({}));
          if (directRes.ok && directData?.success !== 'false') {
            setSubmittedName(trimmedName);
            setName('');
            setMessage('');
            setStatus('success');
            window.showToast?.('Terima kasih banyak atas saran dan masukan Anda!');
            return;
          }
        } catch {
          // Lanjutkan ke penanganan error standar jika fallback juga tidak berhasil
        }
      }

      setStatus('error');
      const msg = err.message || 'Terjadi kendala saat mengirimkan saran. Silakan coba lagi.';
      setErrorMessage(msg);
      window.showToast?.(msg, 'error');
    }
  };

  return (
    <section className="feedback-section" id="saran" aria-labelledby="feedback-heading">
      <div className="feedback-container">
        <div className="feedback-copy">
          <span className="eyebrow">Kotak Saran &amp; Kritik</span>
          <h2 id="feedback-heading">Saran Anda Sangat Penting Bagi Kami</h2>
          <p>
            Punya kritik mengenai pelayanan kami? Menemukan kendala di website? Atau memiliki ide fitur baru yang ingin Anda temukan di Daymoment? Tuliskan masukan Anda langsung kepada kami.
          </p>

          <div className="feedback-highlights">
            <a
              href="https://wa.me/6285111451135"
              target="_blank"
              rel="noopener noreferrer"
              className="feedback-contact-card whatsapp"
              aria-label="Hubungi WhatsApp Daymoment di 085111451135"
            >
              <div className="feedback-contact-left">
                <span className="feedback-contact-icon whatsapp" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.18-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.783-1.676-2.084-.175-.301-.019-.464.132-.614.136-.135.301-.351.451-.527.151-.176.201-.301.302-.502.1-.2.05-.376-.026-.526-.075-.15-.677-1.633-.928-2.238-.244-.59-.493-.51-.677-.52l-.578-.01c-.2 0-.527.076-.803.377-.276.301-1.054 1.03-1.054 2.513s1.08 2.913 1.23 3.114c.15.2 2.125 3.245 5.148 4.552.719.31 1.28.496 1.718.636.722.23 1.378.198 1.898.12.579-.087 1.78-.727 2.03-1.43.251-.703.251-1.305.176-1.43-.075-.125-.276-.201-.577-.351zM12.042 21.67A9.63 9.63 0 0 1 7.12 20.33l-.352-.209-3.666.962.978-3.573-.23-.366a9.63 9.63 0 1 1 8.192 4.526zm0-17.67a8.03 8.03 0 0 0-6.953 12.067l.38.605-.584 2.132 2.18-.572.587.348a8.03 8.03 0 1 0 3.99-14.58z" />
                  </svg>
                </span>
                <div className="feedback-contact-info">
                  <span className="feedback-contact-title">WhatsApp Daymoment</span>
                  <strong className="feedback-contact-val">085111451135</strong>
                  <span className="feedback-contact-desc">Chat langsung respon cepat via WhatsApp</span>
                </div>
              </div>
              <span className="feedback-contact-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </span>
            </a>

            <a
              href="mailto:daymoment7@gmail.com"
              className="feedback-contact-card email"
              aria-label="Kirim Email ke daymoment7@gmail.com"
            >
              <div className="feedback-contact-left">
                <span className="feedback-contact-icon email" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </span>
                <div className="feedback-contact-info">
                  <span className="feedback-contact-title">Email Resmi</span>
                  <strong className="feedback-contact-val">daymoment7@gmail.com</strong>
                  <span className="feedback-contact-desc">Kirim masukan atau kerja sama bisnis</span>
                </div>
              </div>
              <span className="feedback-contact-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </span>
            </a>
          </div>
        </div>

        <div className="feedback-card-wrapper">
          <div className="feedback-card">
            {status === 'success' ? (
              <div className="feedback-success" role="status">
                <div className="feedback-success-icon" aria-hidden="true">✓</div>
                <h3>Terima Kasih, {submittedName || 'Kawan'}!</h3>
                <p>
                  Saran dan kritik Anda telah berhasil kami terima. Masukan Anda sangat berharga dalam membantu kami menyempurnakan Daymoment.
                </p>
                <button
                  type="button"
                  className="button button-primary feedback-reset-btn"
                  onClick={() => setStatus('idle')}
                >
                  Kirim Saran Lain
                </button>
              </div>
            ) : (
              <form className="feedback-form" onSubmit={handleSubmit}>
                <div className="feedback-form-header">
                  <h3>Tulis Saran &amp; Kritik</h3>
                  <p>Beri tahu kami masukan untuk pelayanan atau website Daymoment.</p>
                </div>

                {status === 'error' && errorMessage && (
                  <div className="feedback-alert feedback-alert-error" role="alert">
                    <span aria-hidden="true">⚠</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="feedback-field">
                  <label htmlFor="feedback-name">
                    Nama Anda <span className="required-star">*</span>
                  </label>
                  <input
                    id="feedback-name"
                    name="name"
                    type="text"
                    required
                    maxLength={120}
                    placeholder="Contoh: Dandi Pratama"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    disabled={status === 'loading'}
                  />
                </div>

                <div className="feedback-field">
                  <div className="feedback-field-label-row">
                    <label htmlFor="feedback-message">
                      Saran atau Kritik <span className="required-star">*</span>
                    </label>
                    <small className="char-count">{message.length}/1000</small>
                  </div>
                  <textarea
                    id="feedback-message"
                    name="message"
                    required
                    rows={4}
                    maxLength={1000}
                    placeholder="Tuliskan pengalaman Anda, kritik mengenai pelayanan/website, atau ide saran perbaikan..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    disabled={status === 'loading'}
                  />
                </div>

                <button
                  type="submit"
                  className="button button-primary feedback-submit-btn"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    'Mengirimkan Saran...'
                  ) : (
                    <>
                      Kirim Saran <span>→</span>
                    </>
                  )}
                </button>

                <p className="feedback-privacy-note">
                  🔒 Masukan Anda aman dan digunakan khusus untuk evaluasi peningkatan mutu Daymoment.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
