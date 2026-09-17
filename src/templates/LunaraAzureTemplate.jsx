import React from 'react';
import { mediaUrl } from '../lib/api.js';

const ASSET = '/assets/images/templates/lunara-azure/';
const LAYER_ASSET = `${ASSET}layers/`;
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAYS = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

const fallbackDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 45);
  return date.toISOString().slice(0, 10);
};
const idDate = (value, day = true) => {
  const date = new Date(`${value || fallbackDate()}T12:00:00`);
  return `${day ? `${DAYS[date.getDay()]}, ` : ''}${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};
const timeRange = (start, end) => `${String(start || '').slice(0, 5)}${end ? ` – ${String(end).slice(0, 5)}` : ''} WIB`;
const attendance = (value) => ({ attending: 'Hadir', not_attending: 'Tidak Hadir', unsure: 'Masih Ragu' }[value] || 'Masih Ragu');

export default function LunaraAzureTemplate({ invitation: i, media, giftAccounts, greetings, guestName, guestSalutation, preview }) {
  const bride = i.bride_nickname || 'Nisa';
  const groom = i.groom_nickname || 'Andi';
  const limit = Math.max(1, Number(i.gallery_limit) || 5);
  const photos = media.slice(0, limit);
  const cover = mediaUrl(i.cover_image);
  const bridePhoto = mediaUrl(i.bride_photo || media[0]?.file_path || i.cover_image);
  const groomPhoto = mediaUrl(i.groom_photo || media[1]?.file_path || i.cover_image);
  const eventDate = i.reception_date || fallbackDate();
  const eventTime = String(i.reception_start_time || '11:00').slice(0, 5);
  const calendar = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Pernikahan ${bride} & ${groom}`)}&dates=${eventDate.replaceAll('-', '')}T${eventTime.replace(':', '')}00/${eventDate.replaceAll('-', '')}T${eventTime.replace(':', '')}00&location=${encodeURIComponent(i.venue_name || '')}`;

  return <>
    <AzureSymbols />
    <div className="invitation-page lunara-azure" data-template-root data-slug={i.slug || ''}>
      <section className="opening-cover lunara-cover" aria-label="Cover undangan">
        <div className="lunara-cover-sky" data-lunara-depth="back" />
        <div className="lunara-opening-light" data-opening-step style={{ '--open-step': 0 }} />
        <div className="lunara-cover-panel panel-left" />
        <div className="lunara-cover-panel panel-right" />
        <MotionGarden className="opening-garden opening-garden-left" opening choreo="opening" />
        <MotionGarden className="opening-garden opening-garden-right" opening choreo="opening-reverse" />
        <div className="lunara-cover-orbit" aria-hidden="true"><i /><i /><i /></div>
        <div className="lunara-cover-card" data-cover-content>
          <small data-opening-step style={{ '--open-step': 6 }}>Daymoment mempersembahkan</small>
          <span className="lunara-moon-mark" data-opening-step style={{ '--open-step': 6 }}><i /></span>
          <p data-opening-step style={{ '--open-step': 7 }}>The Wedding of</p>
          <h1 data-opening-step style={{ '--open-step': 8 }}><span data-live="bride_nickname">{bride}</span><em>&amp;</em><span data-live="groom_nickname">{groom}</span></h1>
          <time data-opening-step style={{ '--open-step': 9 }} data-date-field="reception_date">{idDate(eventDate, false)}</time>
          <div className="lunara-cover-guest" data-opening-step style={{ '--open-step': 10 }}><span>{guestSalutation}</span><strong>{guestName}</strong></div>
          <button className="lunara-button lunara-button-light open-invitation" type="button" data-opening-step style={{ '--open-step': 11 }} data-open-invitation><span>Buka Undangan</span><AzureIcon name="azure-arrow" /></button>
        </div>
      </section>

      <main className="invitation-content lunara-content">
        <section className="lunara-section lunara-hero" data-lunara-scene>
          <div className="porcelain-glow" data-lunara-depth="back" />
          <MotionGarden className="section-garden hero-sequence-garden garden-hero-left" choreo="fan" sequence />
          <MotionGarden className="section-garden hero-sequence-garden garden-hero-right" choreo="reverse" sequence />
          <div className="lunara-hero-copy">
            <span className="lunara-eyebrow" data-hero-step="eyebrow">A moonlit celebration</span>
            <h2 data-hero-step="names"><span data-live="bride_nickname">{bride}</span><i>&amp;</i><span data-live="groom_nickname">{groom}</span></h2>
            <p data-hero-step="invitation">Kami mengundang Anda untuk menjadi bagian dari babak terindah perjalanan kami.</p>
            <time data-hero-step="date" data-date-field="reception_date">{idDate(eventDate)}</time>
          </div>
          <div className="lunara-portrait-stage" data-hero-step="portrait" data-lunara-depth="front">
            <div className="lunara-photo-orbit"><i /><i /></div>
            <div className="lunara-hero-photo"><img src={cover} alt="Foto pasangan" decoding="async" /></div>
            <span className="lunara-photo-caption" data-hero-caption>Our beautiful moment</span>
          </div>
          <div className="lunara-countdown" data-hero-step="countdown" data-countdown={`${eventDate}T${eventTime}:00+07:00`}>
            {[['days','Hari'],['hours','Jam'],['minutes','Menit'],['seconds','Detik']].map(([key,label]) => <div key={key}><strong {...{ [`data-${key}`]: '' }}>00</strong><span>{label}</span></div>)}
          </div>
          <a className="lunara-button lunara-save-date" data-hero-step="button" href={calendar} target="_blank" rel="noreferrer">Simpan Tanggal <AzureIcon name="azure-arrow" /></a>
        </section>

        <section className="lunara-section lunara-greeting" data-lunara-scene>
          <div className="lunara-wave wave-top" aria-hidden="true" />
          <div className="lunara-stars" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</div>
          <MotionGarden className="section-garden garden-greeting" choreo="orbit" />
          <div className="lunara-greeting-inner" data-lunara-reveal="tilt">
            <span className="lunara-eyebrow">Dengan penuh rasa syukur</span>
            <h2>The Wedding</h2>
            <p className="lunara-arabic">السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ</p>
            <p>Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami.</p>
            <span className="lunara-signature">{bride} <i>&amp;</i> {groom}</span>
          </div>
          <div className="lunara-wave wave-bottom" aria-hidden="true" />
        </section>

        <section className="lunara-section lunara-couple" data-lunara-scene>
          <MotionGarden className="section-garden garden-couple" choreo="bloom" />
          <SectionHeading eyebrow="Dua hati, satu tujuan" title="Mempelai" />
          <div className="lunara-couple-grid">
            <PersonCard type="bride" photo={bridePhoto} full={i.bride_full_name || 'Nisa Maharani'} father={i.bride_father || 'Bapak Firmansyah'} mother={i.bride_mother || 'Ibu Lestari'} />
            <div className="lunara-couple-amp" data-lunara-reveal="spin"><span>&amp;</span><i /></div>
            <PersonCard type="groom" photo={groomPhoto} full={i.groom_full_name || 'Andi Pratama'} father={i.groom_father || 'Bapak Suryanto'} mother={i.groom_mother || 'Ibu Rahayu'} />
          </div>
        </section>

        <section className="lunara-section lunara-events" data-lunara-scene>
          <MotionGarden className="section-garden garden-events" choreo="rise" />
          <SectionHeading eyebrow="Catat hari bahagia kami" title="Rangkaian Acara" />
          <div className="lunara-event-date" data-lunara-reveal="rise"><strong>{new Date(`${eventDate}T12:00:00`).getDate()}</strong><span>{MONTHS[new Date(`${eventDate}T12:00:00`).getMonth()]}<i />{new Date(`${eventDate}T12:00:00`).getFullYear()}</span></div>
          <div className="lunara-event-deck">
            <EventCard type="akad" invitation={i} />
            <EventCard type="reception" invitation={i} />
          </div>
        </section>

        <section className="lunara-section lunara-story" data-lunara-scene>
          <MotionGarden className="section-garden garden-story" choreo="drift" />
          <div className="lunara-story-photo" data-lunara-reveal="left" data-lunara-depth="mid"><img src={cover} alt="Kisah pasangan" loading="lazy" decoding="async" /></div>
          <div className="lunara-story-copy" data-lunara-reveal="tilt">
            <span className="lunara-eyebrow">Kisah kami</span>
            <h2>Written in<br />the moonlight</h2>
            <p data-live="love_story">{i.love_story || 'Berawal dari pertemuan sederhana, tumbuh menjadi persahabatan, lalu keyakinan untuk berjalan bersama.'}</p>
          </div>
        </section>

        <section className="lunara-section lunara-gallery" data-lunara-scene>
          <MotionGarden className="section-garden garden-gallery" choreo="cascade" />
          <SectionHeading eyebrow="Potongan waktu yang kami simpan" title="Moonlit Memories" />
          <div className={`lunara-gallery-deck gallery-count-${Math.min(photos.length || limit, 5)}`}>
            {photos.length ? photos.map((photo, index) => <figure key={photo.id} data-lunara-reveal={index % 2 ? 'right' : 'left'} style={{ '--card-index': index }}><img src={mediaUrl(photo.file_path)} alt={`Momen pasangan ${index + 1}`} loading="lazy" decoding="async" /><figcaption>Memory · {String(index + 1).padStart(2, '0')}</figcaption></figure>) : Array.from({ length: limit }, (_, index) => <figure className="lunara-gallery-placeholder" key={index} data-lunara-reveal={index % 2 ? 'right' : 'left'} style={{ '--card-index': index }}><span>{String(index + 1).padStart(2, '0')}</span><figcaption>Our moment</figcaption></figure>)}
          </div>
        </section>

        {i.has_gift && <GiftSection accounts={giftAccounts} />}
        {i.has_wishes && <RsvpSection invitation={i} guestName={guestName} greetings={greetings} preview={preview} />}

        <section className="lunara-section lunara-closing" data-lunara-scene>
          <div className="lunara-closing-moon" data-lunara-depth="back"><i /></div>
          <MotionGarden className="section-garden garden-closing" choreo="finale" />
          <div className="lunara-closing-copy" data-lunara-reveal="tilt">
            <span className="lunara-eyebrow">Terima kasih</span>
            <p>Merupakan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.</p>
            <h2><span data-live="bride_nickname">{bride}</span><i>&amp;</i><span data-live="groom_nickname">{groom}</span></h2>
            <time data-date-field="reception_date">{idDate(eventDate, false)}</time>
            {!preview && <button className="lunara-button lunara-button-light share-button" type="button" data-share data-share-url={`${location.origin}/${i.slug}`}>Bagikan Undangan <AzureIcon name="azure-arrow" /></button>}
          </div>
        </section>

        <footer className="template-footer lunara-footer"><div className="template-brand-lockup"><img src="/assets/images/brand/daymoment-mark.svg" alt="" /><strong>Daymoment</strong></div><small>by Daysheet Group</small></footer>
      </main>

      {i.has_music && i.music_file && <audio data-wedding-audio loop preload="metadata" src={mediaUrl(i.music_file)} />}
      {i.has_music && <button className="lunara-music" type="button" data-music-controller aria-label="Kontrol musik" aria-pressed="false" title={i.music_title || 'Musik undangan'}><AzureIcon name="azure-music" /></button>}
    </div>
  </>;
}

const CHOREOGRAPHY = {
  opening: [0, 2, 3, 1, 4, 5],
  'opening-reverse': [1, 3, 2, 0, 5, 4],
  fan: [0, 3, 1, 2, 5, 4],
  reverse: [3, 2, 1, 0, 4, 5],
  orbit: [3, 0, 2, 1, 5, 4],
  bloom: [0, 1, 3, 2, 4, 5],
  rise: [3, 0, 1, 2, 4, 5],
  drift: [2, 3, 0, 1, 5, 4],
  cascade: [4, 2, 0, 1, 3, 5],
  crown: [3, 2, 1, 0, 5, 4],
  embrace: [0, 3, 2, 1, 4, 5],
  finale: [3, 0, 2, 1, 4, 5],
};
const GARDEN_PIECES = [
  ['foliage', 'foliage.webp'],
  ['bloom', 'main-bloom.webp'],
  ['spray', 'accent-spray.webp'],
  ['vine', 'crescent-vine.webp'],
  ['petals', 'petals.webp'],
  ['butterfly', 'butterfly.webp'],
];
function MotionGarden({ className, choreo = 'fan', opening = false, sequence = false }) {
  const order = CHOREOGRAPHY[choreo] || CHOREOGRAPHY.fan;
  return <div className={`lunara-motion-garden ${className || ''} choreo-${choreo}`} {...(!opening && !sequence ? { 'data-lunara-garden': '' } : {})} {...(sequence ? { 'data-hero-garden': '' } : {})} aria-hidden="true">
    {GARDEN_PIECES.map(([piece, file], index) => <img className={`garden-piece garden-${piece}`} src={`${LAYER_ASSET}${file}`} alt="" decoding="async" key={piece} data-lunara-piece {...(opening ? { 'data-opening-step': '' } : {})} style={{ '--piece-order': order[index], ...(opening ? { '--open-step': order[index] + 1 } : {}) }} />)}
    <div className="garden-sparkles" {...(opening ? { 'data-opening-step': '', style: { '--open-step': 5 } } : {})}>{Array.from({ length: 7 }, (_, index) => <i key={index} />)}</div>
  </div>;
}

function SectionHeading({ eyebrow, title }) {
  return <div className="lunara-heading" data-lunara-reveal="rise"><span className="lunara-eyebrow">{eyebrow}</span><h2>{title}</h2><i /></div>;
}

function PersonCard({ type, photo, full, father, mother }) {
  return <article className={`lunara-person person-${type}`} data-lunara-reveal={type === 'bride' ? 'left' : 'right'}>
    <div className="lunara-person-photo"><span /><img src={photo} alt={`Foto mempelai ${type === 'bride' ? 'wanita' : 'pria'}`} loading="lazy" decoding="async" /></div>
    <small>{type === 'bride' ? 'Mempelai Wanita' : 'Mempelai Pria'}</small>
    <h3 data-live={`${type}_full_name`}>{full}</h3>
    <p>{type === 'bride' ? 'Putri' : 'Putra'} dari</p>
    <strong><span data-live={`${type}_father`}>{father}</span><br />&amp; <span data-live={`${type}_mother`}>{mother}</span></strong>
  </article>;
}

function EventCard({ type, invitation: i }) {
  const akad = type === 'akad';
  const date = i[`${type}_date`] || i.reception_date;
  return <article className={`lunara-event-card event-${type}`} data-lunara-reveal={akad ? 'left' : 'right'}>
    <span className="event-number">{akad ? '01' : '02'}</span>
    <small>{akad ? 'Janji suci' : 'Perayaan kasih'}</small>
    <h3>{akad ? 'Akad Nikah' : 'Resepsi'}</h3>
    <time data-date-field={`${type}_date`}>{idDate(date)}</time>
    <strong data-time-range={type}>{timeRange(i[`${type}_start_time`], i[`${type}_end_time`])}</strong>
    <p data-live="venue_name">{i.venue_name || 'Lokasi Acara'}</p>
    <address data-live="venue_address">{i.venue_address || 'Alamat lengkap akan diumumkan.'}</address>
    <a className="lunara-button" data-live-href="maps_url" href={i.maps_url || '#'} target="_blank" rel="noreferrer"><AzureIcon name="azure-map" /> Lihat Lokasi</a>
  </article>;
}

function GiftSection({ accounts }) {
  return <section className="lunara-section lunara-gift" data-lunara-scene>
    <div className="lunara-gift-ribbon" aria-hidden="true" />
    <MotionGarden className="section-garden garden-gift" choreo="crown" />
    <SectionHeading eyebrow="Tanda kasih" title="Wedding Gift" />
    <p className="lunara-gift-lead">Doa restu Anda adalah hadiah terindah. Bagi yang ingin mengirimkan tanda kasih, silakan melalui rekening berikut.</p>
    {accounts.length ? <>
      <label className="lunara-bank-select" data-lunara-reveal="rise"><span>Pilih bank / e-wallet</span><select data-lunara-bank>{accounts.map((account, index) => <option value={index} key={account.id || index}>{account.provider}{account.label ? ` — ${account.label}` : ''}</option>)}</select></label>
      <div className="lunara-bank-stack">{accounts.map((account, index) => <article className="lunara-bank-card" data-lunara-bank-card={index} hidden={index > 0} key={account.id || index}>
        <small>{account.provider}</small><strong data-account-number>{account.account_number}</strong><p>a.n. {account.account_name}</p>{account.label && <em>{account.label}</em>}
        <button type="button" data-copy-account><AzureIcon name="azure-copy" /> Salin Nomor</button>
      </article>)}</div>
    </> : <div className="lunara-empty">Informasi amplop digital belum ditambahkan.</div>}
  </section>;
}

function RsvpSection({ invitation: i, guestName, greetings, preview }) {
  return <section className="lunara-section lunara-rsvp" id="rsvp" data-lunara-scene>
    <MotionGarden className="section-garden garden-rsvp" choreo="embrace" />
    <div className="lunara-rsvp-shell" data-lunara-reveal="tilt">
      <SectionHeading eyebrow="Ucapan & konfirmasi" title="Kehadiran Anda" />
      {preview && <p className="preview-form-badge">Mode preview — form tidak mengirim data</p>}
      <form className="greeting-form lunara-form" {...(preview ? { 'data-preview-form': '' } : { 'data-greeting-form': '' })}>
        <input type="hidden" name="slug" value={i.slug || ''} />
        <label><span>Nama</span><input name="guest_name" maxLength="120" required defaultValue={guestName !== 'Bapak/Ibu/Saudara/i' ? guestName : ''} placeholder="Nama Anda" /></label>
        <div className="lunara-form-split"><label><span>Jumlah tamu</span><select name="guest_count" defaultValue="1"><option value="1">1 Orang</option><option value="2">2 Orang</option><option value="3">3 Orang</option><option value="4">4 Orang</option></select></label><label><span>Kehadiran</span><select name="attendance_status" required defaultValue=""><option value="" disabled>Pilih kehadiran</option><option value="attending">Hadir</option><option value="not_attending">Tidak Hadir</option><option value="unsure">Masih Ragu</option></select></label></div>
        <label><span>Ucapan & doa</span><textarea name="message" maxLength="500" required placeholder="Tuliskan doa hangat..." /><small><span data-message-count>0</span>/500</small></label>
        <button className="lunara-button" type="submit">Kirim Ucapan <AzureIcon name="azure-arrow" /></button><p className="form-feedback" data-form-feedback />
      </form>
      <div className="greeting-list lunara-wishes" data-greeting-list>{greetings.length ? greetings.map((greeting) => <article className="greeting-item" key={greeting.id}><div className="greeting-head"><strong>{greeting.guest_name}</strong><small>{attendance(greeting.attendance_status)}</small></div><p>{greeting.message}</p></article>) : <div className="greeting-empty" data-empty-greeting>Belum ada ucapan. Jadilah yang pertama mengirimkan doa hangat.</div>}</div>
    </div>
  </section>;
}

function AzureIcon({ name }) { return <svg><use href={`#${name}`} /></svg>; }
function AzureSymbols() {
  return <svg className="lunara-symbols"><defs>
    <symbol id="azure-arrow" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5" /></symbol>
    <symbol id="azure-map" viewBox="0 0 24 24"><path d="M12 21s6-5.4 6-12A6 6 0 0 0 6 9c0 6.6 6 12 6 12Z" /><circle cx="12" cy="9" r="2" /></symbol>
    <symbol id="azure-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></symbol>
    <symbol id="azure-music" viewBox="0 0 24 24"><path d="M9 18V6l10-2v12M9 10l10-2" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></symbol>
  </defs></svg>;
}
