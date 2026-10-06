import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mediaUrl } from '../lib/api.js';
import VerdantOpeningScene from './verdant-vow/VerdantOpeningScene.jsx';
import VerdantCinematicJourney from './verdant-vow/VerdantCinematicJourney.jsx';
import './verdant-vow/experience.css';

const BASE = '/assets/images/templates/verdant-vow';
const LAYER = BASE + '/layers';
const date = (value, options = { weekday:'long',day:'numeric',month:'long',year:'numeric' }) => {
  const parsed = new Date(String(value || '').slice(0,10) + 'T12:00:00');
  return Number.isNaN(parsed.getTime()) ? 'Tanggal akan diumumkan' : new Intl.DateTimeFormat('id-ID',options).format(parsed);
};
const time = (start,end) => String(start || '').slice(0,5) ? String(start).slice(0,5) + ' WIB' + (end ? ' – ' + String(end).slice(0,5) + ' WIB' : ' – selesai') : 'Waktu akan diumumkan';

function EventCard({ title, day, start, end, venue, address, maps }) {
  if (!day) return null;
  return <article className='vv-event-card'><small>{title}</small><h3>{date(day)}</h3><time>{time(start,end)}</time><strong>{venue}</strong><p>{address}</p>{maps && <a href={maps} target='_blank' rel='noreferrer'>Lihat lokasi ↗</a>}</article>;
}
function Person({ role, name, nickname, photo, father, mother }) {
  return <article className='vv-person-card'>{photo && <img src={mediaUrl(photo)} alt={name} loading='lazy'/>}<div><small>{role}</small><h3>{name}</h3><p>{role === 'Mempelai pria' ? 'Putra' : 'Putri'} dari<br/>{father || 'Bapak'} &amp; {mother || 'Ibu'}</p><span>{nickname}</span></div></article>;
}

export default function VerdantVowExperience({ invitation:i, media=[], giftAccounts=[], greetings=[], guestName='Bapak/Ibu/Saudara/i', preview=false }) {
  const groom = i.groom_nickname || 'Raka', bride = i.bride_nickname || 'Alya';
  const groomFull = i.groom_full_name || groom, brideFull = i.bride_full_name || bride;
  const eventDate = i.reception_date || i.akad_date;
  const photos = media.slice(0, Math.max(1,Number(i.gallery_limit || 5)));
  const [opened,setOpened] = useState(false), [cinematicDone,setCinematicDone] = useState(false), [replayId,setReplayId] = useState(0), [menuOpen,setMenuOpen] = useState(false), [autoReplayOpening,setAutoReplayOpening] = useState(false);
  const [journeyStarted,setJourneyStarted] = useState(false), [journeyReady,setJourneyReady] = useState(false);
  const [activeNormal,setActiveNormal] = useState('vv-full-opening');
  const [clock,setClock] = useState(Date.now), [musicPlaying,setMusicPlaying] = useState(false);
  const audioRef = useRef(null);
  const scrollRef = useRef(null);
  const normalRef = useRef(null);
  const sections = [['vv-full-opening','Pembuka'],['vv-full-couple','Mempelai'],['vv-full-events','Rangkaian Acara'],...(i.love_story ? [['vv-full-story','Kisah Kami']] : []),['vv-full-gallery','Galeri'],...(i.has_gift ? [['vv-full-gift','Hadiah']] : []),...(i.has_wishes ? [['vv-full-rsvp','RSVP & Ucapan']] : []),['vv-full-closing','Penutup']];
  const countdown = useMemo(() => {
    const target = new Date(String(eventDate || '').slice(0,10) + 'T00:00:00');
    const remaining = Math.max(0,(Number.isNaN(target.getTime()) ? clock : target.getTime())-clock);
    return [Math.floor(remaining/86400000),Math.floor(remaining/3600000)%24,Math.floor(remaining/60000)%60,Math.floor(remaining/1000)%60];
  },[eventDate,clock]);

  useEffect(() => {
    [
      BASE+'/cinematic/distant-garden-panorama-v2.webp',
      BASE+'/cinematic/garden-aisle-v2.webp',
      BASE+'/cinematic/scene-01-grand-gate-v1.webp',
      BASE+'/cinematic/scene-02-couple-arches-v1.webp',
      BASE+'/cinematic/scene-05-pavilion-frame-v1.webp',
      LAYER+'/foreground-botanical.webp',
      LAYER+'/couple-cinematic.webp',
    ].forEach(src => { const image = new Image(); image.src = src; });
  },[]);
  useEffect(() => {
    if (!opened) return undefined;
    const timer = window.setInterval(() => setClock(Date.now()),1000);
    if (i.has_music && i.music_file && audioRef.current) audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {});
    return () => window.clearInterval(timer);
  },[opened,i.has_music,i.music_file]);
  useEffect(() => {
    if (!opened || !cinematicDone) return undefined;
    const root = scrollRef.current;
    if (!root) return undefined;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
      if (visible) setActiveNormal(visible.target.id);
    },{root,rootMargin:'-14% 0px -55% 0px',threshold:[0,.1,.3,.6]});
    sections.forEach(([id]) => { const element = root.querySelector('#'+id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  },[opened,cinematicDone,i.love_story,i.has_gift,i.has_wishes]);

  const finishCinematic = useCallback(() => {
    setCinematicDone(true);
    window.requestAnimationFrame(() => {
      const root = scrollRef.current;
      const target = normalRef.current;
      if (root && target) root.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
    });
  },[]);
  const replayCinematic = useCallback(() => {
    const root = scrollRef.current;
    if (root) root.scrollTo({ top: 0, behavior: 'auto' });
    setOpened(false);
    setCinematicDone(false);
    setJourneyStarted(false);
    setJourneyReady(false);
    setMenuOpen(false);
    setAutoReplayOpening(true);
    setReplayId(value => value + 1);
  },[]);
  const finishOpening = useCallback(() => {
    setOpened(true);
    setAutoReplayOpening(false);
  },[]);
  const startJourney = useCallback(() => setJourneyStarted(true),[]);
  const markJourneyReady = useCallback(() => setJourneyReady(true),[]);
  const navigateSection = id => {
    setMenuOpen(false);
    setActiveNormal(id);
    const root = scrollRef.current;
    const target = root?.querySelector('#'+id);
    if (root && target) root.scrollTo({ top: target.offsetTop, behavior:'smooth' });
  };
  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) { audioRef.current.pause(); setMusicPlaying(false); }
    else audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {});
  };
  return <main className={'verdant-vow vv-redesign ' + (opened ? 'is-open ' : '') + (cinematicDone ? 'is-cinematic-done' : 'is-cinematic-playing')}>
    {!opened && <VerdantOpeningScene bride={bride} groom={groom} guestName={guestName} date={date(eventDate)} sceneReady={journeyReady} autoEnter={autoReplayOpening} onStart={startJourney} onEnter={finishOpening}/>} 
    <div className='vv-scroll' ref={scrollRef} inert={!opened ? '' : undefined} aria-hidden={!opened}>
      <section className='vv-journey' id='vv-journey'>
        <VerdantCinematicJourney invitation={i} bride={bride} groom={groom} brideFull={brideFull} groomFull={groomFull} dateLabel={date(eventDate,{day:'numeric',month:'long',year:'numeric'})} runId={replayId} active={journeyStarted} onReady={markJourneyReady} onComplete={finishCinematic}/>
      </section>
      <section className='vv-after vv-full-opening' id='vv-full-opening' ref={normalRef}>
        <button type='button' className='vv-replay-cinematic' onClick={replayCinematic}>Ulangi Cinematic</button>
        <div className='vv-after-heading'><small>Dengan penuh rasa syukur</small><h2>The Wedding</h2></div>
        <p>Kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menjadi bagian dari hari bahagia kami.</p>
        <h3>{groom} <i>&amp;</i> {bride}</h3><time>{date(eventDate)}</time>
        <div className='vv-countdown-grid'>{countdown.map((value,index) => <span key={index}><b>{String(value).padStart(2,'0')}</b><small>{['Hari','Jam','Menit','Detik'][index]}</small></span>)}</div>
      </section>
      <section className='vv-after vv-full-couple' id='vv-full-couple'>
        <div className='vv-after-heading'><small>Dua hati yang dipertemukan</small><h2>Mempelai</h2></div>
        <div className='vv-person-grid'>
          <Person role='Mempelai pria' name={groomFull} nickname={groom} photo={i.groom_photo || media[1]?.file_path || i.cover_image} father={i.groom_father} mother={i.groom_mother}/>
          <span className='vv-person-amp'>&amp;</span>
          <Person role='Mempelai wanita' name={brideFull} nickname={bride} photo={i.bride_photo || media[0]?.file_path || i.cover_image} father={i.bride_father} mother={i.bride_mother}/>
        </div>
      </section>

        <section className='vv-after vv-full-events' id='vv-full-events'>
        <div className='vv-after-heading'><small>Catat hari bahagia kami</small><h2>Rangkaian Acara</h2></div>
        <div className='vv-event-grid'>
          <EventCard title='Akad Nikah' day={i.akad_date} start={i.akad_start_time} end={i.akad_end_time} venue={i.venue_name} address={i.venue_address} maps={i.maps_url}/>
          <EventCard title='Resepsi' day={i.reception_date} start={i.reception_start_time} end={i.reception_end_time} venue={i.venue_name} address={i.venue_address} maps={i.maps_url}/>
        </div>
      </section>
       {i.love_story && <section className='vv-after vv-story' id='vv-full-story'>
        <div className='vv-after-heading'><small>Kisah yang tumbuh</small><h2>Kisah Kami</h2></div>
        {(i.cover_image || media[0]?.file_path) && <div className='vv-story-photo'><img src={mediaUrl(i.cover_image || media[0]?.file_path)} alt={groom+' dan '+bride} loading='lazy'/></div>}
        <p>{i.love_story}</p>
      </section>}
       <section className='vv-after vv-gallery' id='vv-full-gallery'>
        <div className='vv-after-heading'><small>Potongan waktu yang kami simpan</small><h2>Galeri</h2></div>
        {photos.length?<div className='vv-gallery-grid'>{photos.map((photo,index)=><figure key={photo.id || index}><img src={mediaUrl(photo.file_path)} alt={'Momen '+(index+1)} loading='lazy'/><figcaption>Memory · {String(index+1).padStart(2,'0')}</figcaption></figure>)}</div>:<p className='vv-empty'>Momen bahagia akan segera hadir.</p>}
      </section>
       {i.has_gift && <section className='vv-after vv-gift' id='vv-full-gift'>
        <div className='vv-after-heading'><small>Tanda kasih</small><h2>Wedding Gift</h2></div>
        <p>Doa restu Anda adalah hadiah terindah. Bagi yang ingin mengirimkan tanda kasih, tersedia rekening berikut.</p>
        <div className='vv-gift-grid'>{giftAccounts.map((account,index)=><article key={account.id || index}><small>{account.provider}</small><strong data-account-number>{account.account_number}</strong><span>a.n. {account.account_name}</span>{account.label && <em>{account.label}</em>}<button type='button' data-copy-account>Salin nomor</button></article>)}</div>
      </section>}
       {i.has_wishes && <section className='vv-after vv-rsvp' id='vv-full-rsvp'>
        <div className='vv-after-heading'><small>Ucapan &amp; konfirmasi</small><h2>Kehadiran Anda</h2></div>
        {preview && <p className='vv-preview-note'>Mode preview — form tidak mengirim data.</p>}
        <form {...(preview?{'data-preview-form':''}:{'data-greeting-form':''})}>
          <input type='hidden' name='slug' value={i.slug || ''}/>
          <div className='vv-form-row'><label><span>Nama</span><input name='guest_name' maxLength='120' required defaultValue={guestName!=='Bapak/Ibu/Saudara/i'?guestName:''} placeholder='Nama Anda'/></label><label><span>Kehadiran</span><select name='attendance_status' required defaultValue=''><option value='' disabled>Pilih kehadiran</option><option value='attending'>Hadir</option><option value='not_attending'>Tidak hadir</option><option value='unsure'>Masih ragu</option></select></label></div>
          <label><span>Ucapan &amp; doa</span><textarea name='message' maxLength='500' required placeholder='Tuliskan doa hangat...'/><small><span data-message-count>0</span>/500</small></label>
          <button type='submit'>Kirim ucapan</button><p className='form-feedback' data-form-feedback/>
        </form>
        <div className='vv-wishes' data-greeting-list>{greetings.length?greetings.slice(0,8).map(greeting=><article className='greeting-item' key={greeting.id}><strong>{greeting.guest_name}</strong><small>{greeting.attendance_status==='attending'?'Hadir':greeting.attendance_status==='not_attending'?'Tidak hadir':'Masih ragu'}</small><p>{greeting.message}</p></article>):<p className='vv-empty' data-empty-greeting>Belum ada ucapan. Jadilah yang pertama mengirimkan doa hangat.</p>}</div>
      </section>}
       <section className='vv-after vv-closing' id='vv-full-closing'>
        <img src={LAYER+'/couple-cinematic.webp'} alt='' loading='lazy'/>
        <div><small>Terima kasih</small><p>Merupakan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.</p><h2><b>{groom}</b><span>&amp;</span><b>{bride}</b></h2><time>{date(eventDate,{day:'numeric',month:'long',year:'numeric'})}</time>
          {!preview && <button type='button' className='vv-share-button' data-share data-share-url={window.location.origin+'/'+i.slug}>Bagikan undangan <span>→</span></button>}
          <strong>DAYMOMENT · BY DAYSHEET GROUP</strong>
        </div>
      </section>
    </div>
    {opened && cinematicDone && <nav className={'vv-nav '+(menuOpen?'is-expanded':'')} aria-label='Navigasi undangan'>
      <button type='button' className='vv-nav-mobile-toggle' aria-expanded={menuOpen} onClick={() => setMenuOpen(value=>!value)}>{menuOpen?'Tutup':'Menu'}</button>
      <div className='vv-nav-scroller'><span className='vv-nav-group'>Undangan</span>
        {sections.map(([id,label])=><button key={id} type='button' className={activeNormal===id?'is-active':''} aria-current={activeNormal===id?'location':undefined} onClick={()=>navigateSection(id)}>{label}</button>)}
      </div>
    </nav>}
    {opened && i.has_music && i.music_file && <><audio ref={audioRef} data-wedding-audio loop src={mediaUrl(i.music_file)}/><button type='button' className={'vv-music-toggle '+(musicPlaying?'is-playing':'')} onClick={toggleMusic} aria-label={musicPlaying?'Matikan musik':'Putar musik'}>♫</button></>}
  </main>;
}
