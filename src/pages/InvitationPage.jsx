import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorState } from '../components/Layout.jsx';
import { mediaUrl } from '../lib/api.js';
import { useBodyClass, useDocumentTitle, useHeadLinks, useLegacyScripts, useRemote } from '../lib/hooks.js';
import { useInvitationRealtime } from '../lib/realtime.js';
const LunaraAzureTemplate = lazy(() => import('../templates/LunaraAzureTemplate.jsx'));
const AureliaGrandeTemplate = lazy(() => import('../templates/AureliaGrandeTemplate.jsx'));
const VerdantVowTemplate = lazy(() => import('../templates/VerdantVowExperience.jsx'));

const A='/assets/images/templates/puspa-jawi/';
const TEMPLATE_RUNTIME={
  puspa_jawi:{title:'Puspa Jawi — Daymoment',font:'https://fonts.googleapis.com/css2?family=Italianno&family=Marcellus&family=Manrope:wght@400;500;600&display=swap',css:'/assets/css/templates/puspa-jawi.css?v=20261019-01',script:'/assets/js/templates/puspa-jawi.js?v=20261016-52'},
  lunara_azure:{title:'Lunara Azure — Daymoment',font:'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Manrope:wght@400;500;600;700&display=swap',css:'/assets/css/templates/lunara-azure.css?v=20261016-01',script:'/assets/js/templates/lunara-azure.js?v=20261012-11'}
  ,aurelia_grande:{title:'Aurelia Grande — Daymoment',font:'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Manrope:wght@400;500;600;700&display=swap',css:'/assets/css/templates/aurelia-grande.css?v=20261019-01',script:'/assets/js/templates/aurelia-grande.js?v=20260928-1'}
  ,verdant_vow:{title:'Verdant Vow — Daymoment',font:'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Italianno&family=Manrope:wght@400;500;600;700&display=swap',css:'/assets/css/templates/verdant-vow.css?v=20261019-01',script:null}
};
TEMPLATE_RUNTIME.lunara_azure.css += '&motion=20261016-01';
TEMPLATE_RUNTIME.lunara_azure.script += '&motion=20261014-9';
const MONTHS=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAYS=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const sampleDate=()=>{const d=new Date();d.setDate(d.getDate()+45);return d.toISOString().slice(0,10)};
const sample=(pkg={})=>({id:0,slug:'',groom_full_name:'Andi Pratama',groom_nickname:'Andi',groom_father:'Bapak H. Suryanto',groom_mother:'Ibu Hj. Rahayu',bride_full_name:'Nisa Maharani',bride_nickname:'Nisa',bride_father:'Bapak H. Firmansyah',bride_mother:'Ibu Hj. Lestari',akad_date:sampleDate(),akad_start_time:'08:00',akad_end_time:'10:00',reception_date:sampleDate(),reception_start_time:'11:00',reception_end_time:'14:00',venue_name:'Pendopo Arunika',venue_address:'Jl. Melati No. 12, Yogyakarta',maps_url:'https://maps.google.com/',love_story:'Berawal dari pertemuan sederhana pada sebuah sore di Yogyakarta, percakapan kami tumbuh menjadi persahabatan, lalu keyakinan untuk berjalan bersama.',instagram:'andindanisa',gallery_limit:pkg.gallery_limit||3,has_music:Boolean(pkg.has_music),has_gift:Boolean(pkg.has_gift),has_wishes:Boolean(pkg.has_wishes),music_file:null,...pkg});
const idDate=(value,day=true)=>{const d=new Date(`${value||sampleDate()}T12:00:00`);return `${day?`${DAYS[d.getDay()]}, `:''}${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`};
const timeRange=(start,end)=>`${String(start||'').slice(0,5)}${end?` – ${String(end).slice(0,5)}`:''} WIB`;
const attendance=(v)=>({attending:'Hadir',not_attending:'Tidak Hadir',unsure:'Masih Ragu'}[v]||'Masih Ragu');

export default function InvitationPage({slug,templateCode,preview=false}){
  useBodyClass(preview?'embed-preview':'');
  const query=useMemo(()=>new URLSearchParams(window.location.search),[]), token=query.get('token');
  const path=preview?(token?`/api/editor/${token}`:`/api/templates/${templateCode}`):`/api/invitations/${slug}${window.location.search}`;
  const state=useRemote(path,[path]);
  const [submittedGreetings,setSubmittedGreetings]=useState([]);
  const invitationKey=state.data?.invitation?.id||slug||templateCode||'';
  useEffect(()=>setSubmittedGreetings([]),[invitationKey]);
  useEffect(()=>{
    if(preview)return undefined;
    const receiveGreeting=(event)=>{
      const greeting=event.detail?.greeting;
      if(!greeting?.id)return;
      setSubmittedGreetings((current)=>[greeting,...current.filter((item)=>item.id!==greeting.id)]);
    };
    window.addEventListener('daymoment:greeting-sent',receiveGreeting);
    return ()=>window.removeEventListener('daymoment:greeting-sent',receiveGreeting);
  },[preview]);
  const resolvedCode=templateCode||state.data?.invitation?.template_code||state.data?.template?.code||null;
  const activeCode=resolvedCode||'puspa_jawi';
  const runtime=TEMPLATE_RUNTIME[activeCode]||TEMPLATE_RUNTIME.puspa_jawi;
  useEffect(()=>{
    if(resolvedCode!=='verdant_vow')return;
    import('../templates/VerdantVowExperience.jsx');
  },[resolvedCode]);
  useDocumentTitle(runtime?.title||'Undangan Pernikahan — Daymoment');
  useHeadLinks(runtime?[runtime.font]:[]);
  const templateStylesReady=useHeadLinks(runtime?['/assets/css/templates/base.css?v=20260918-1',runtime.css]:[]);
  useEffect(()=>{
    if(resolvedCode!=='puspa_jawi')return undefined;
    const href=`${A}${window.matchMedia('(max-width: 700px)').matches?'puspa-cover-washi-v2-mobile.webp':'puspa-cover-washi-v2.webp'}`;
    const link=document.createElement('link');
    link.rel='preload';link.as='image';link.href=href;link.fetchPriority='high';link.dataset.puspaCoverPreload='true';
    document.head.appendChild(link);
    return()=>link.remove();
  },[resolvedCode]);
  useEffect(() => {
    if(activeCode==='puspa_jawi')return undefined;
    const coverPath=state.data?.invitation?.cover_image;
    if(!coverPath)return undefined;
    const image=new Image();
    image.decoding='async';
    image.fetchPriority='high';
    image.src=mediaUrl(coverPath);
    return()=>{ image.onload=null; image.onerror=null; };
  },[activeCode,state.data?.invitation?.cover_image]);
  useLegacyScripts(runtime?.script?['/assets/js/preview.js?v=20261015-9','/assets/js/greeting.js?v=20260927-1',runtime.script]:[],!state.loading&&!state.error&&templateStylesReady);
  useInvitationRealtime(state.data?.invitation?.id, state.reload, !preview && !state.loading && !state.error);
  // Keep a small, styled shell visible while the invitation payload and its
  // template stylesheet are loading. Returning null here made a hard refresh
  // look like a broken/unstyled page (the boot screen could disappear before
  // the API response arrived).
  if(state.loading||!templateStylesReady)return <InvitationLoading/>;
  if(state.error)return <ErrorState error={state.error}/>;
  let invitation,media=[],giftAccounts=[],greetings=[],guestName='Bapak/Ibu/Saudara/i',guestSalutation='Kepada Yth.';
  if(preview&&!token){const template=state.data.template,pkg=template.packages.find(p=>p.code===(query.get('package')||'signature'))||template.packages[0];invitation=sample({...pkg,package_code:pkg.code,package_name:pkg.name});if(pkg.has_gift)giftAccounts=[{provider:'BCA',account_number:'1234 5678 90',account_name:'Andi & Nisa',label:'Hadiah pernikahan'}];}
  else {invitation=preview?withFallbacks(state.data.invitation):state.data.invitation;media=state.data.media||[];giftAccounts=state.data.giftAccounts||[];const seen=new Set();greetings=[...submittedGreetings,...(state.data.greetings||[])].filter((item)=>item?.id&&!seen.has(item.id)&&seen.add(item.id));guestName=state.data.guestName||guestName;guestSalutation=state.data.guestSalutation||guestSalutation;}
  const Template=activeCode==='verdant_vow'?VerdantVowTemplate:activeCode==='aurelia_grande'?AureliaGrandeTemplate:activeCode==='lunara_azure'?LunaraAzureTemplate:PuspaJawi;
  return <Suspense fallback={<InvitationLoading/>}><Template invitation={invitation} media={media} giftAccounts={giftAccounts} greetings={greetings} guestName={guestName} guestSalutation={guestSalutation} preview={preview}/></Suspense>;
}

function InvitationLoading(){
  return <div className="invitation-loading" role="status" aria-label="Memuat undangan">
    <span className="invitation-loading-mark" aria-hidden="true"/>
  </div>;
}

function withFallbacks(value){const fallback=sample(value);for(const key of Object.keys(fallback)){if(value[key]===null||value[key]===undefined||String(value[key]).trim()==='')value={...value,[key]:fallback[key]};}return value}

function PuspaJawi({invitation:i,media,giftAccounts,greetings,guestName,guestSalutation,preview}){
  const groom=i.groom_nickname||'Andi',bride=i.bride_nickname||'Nisa',limit=Math.max(1,Number(i.gallery_limit)||5),photos=media.slice(0,limit);
  const cover=mediaUrl(i.cover_image),bridePhoto=mediaUrl(i.bride_photo||media[0]?.file_path||i.cover_image),groomPhoto=mediaUrl(i.groom_photo||media[1]?.file_path||i.cover_image);
  const eventDate=i.reception_date||sampleDate(),eventTime=String(i.reception_start_time||'11:00').slice(0,5), calendar=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Pernikahan ${groom} & ${bride}`)}&dates=${eventDate.replaceAll('-','')}T${eventTime.replace(':','')}00/${eventDate.replaceAll('-','')}T${eventTime.replace(':','')}00&location=${encodeURIComponent(i.venue_name||'')}`;

  const [lightbox, setLightbox] = useState(null);
  const touchStartX = useRef(0);

  const openPhoto = (photo) => {
    setLightbox({
      items: [photo],
      index: 0
    });
  };

  const openGalleryPhoto = (index) => {
    const galleryItems = (photos.length ? photos : ['Pertemuan', 'Perjalanan', 'Lamaran', 'Hari Bahagia', 'Selamanya'].slice(0, limit)).map((p, idx) => ({
      src: p?.file_path ? mediaUrl(p.file_path) : cover,
      title: `Kenangan · ${String(idx + 1).padStart(2, '0')}`,
      caption: `${bride} & ${groom} — Potret Bahagia`
    }));
    setLightbox({
      items: galleryItems,
      index: Math.max(0, Math.min(index, galleryItems.length - 1))
    });
  };

  const nextPhoto = () => {
    setLightbox((prev) => prev && prev.items.length > 1 ? { ...prev, index: (prev.index + 1) % prev.items.length } : prev);
  };
  const prevPhoto = () => {
    setLightbox((prev) => prev && prev.items.length > 1 ? { ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length } : prev);
  };

  useEffect(() => {
    if (!lightbox) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightbox(null);
      } else if (e.key === 'ArrowRight' && lightbox.items.length > 1) {
        nextPhoto();
      } else if (e.key === 'ArrowLeft' && lightbox.items.length > 1) {
        prevPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightbox]);

  return <><Symbols/><div className="invitation-page puspa-jawi motion-ready" data-template-root data-slug={i.slug||''}>
    <section className="opening-cover jawi-opening-cover jawi-cover-v3" aria-label="Cover undangan">
      <div className="jawi-cover-backdrop" aria-hidden="true"/>
      <div className="jawi-cover-glow" aria-hidden="true"/>
      <div className="jawi-cover-wayangs" aria-hidden="true">
        <img className="jawi-cover-wayang wayang-left" src={`${A}puspa-wayang-rama-v2.webp`} alt="" decoding="async"/>
        <img className="jawi-cover-wayang wayang-right" src={`${A}puspa-wayang-sinta-v2.webp`} alt="" decoding="async"/>
      </div>
      <div className="jawi-envelope-stage">
        <div className="jawi-envelope-aura" aria-hidden="true"><i/><i/></div>
        <div className="jawi-envelope-shell">
          <div className="jawi-envelope-back" aria-hidden="true"/>
          <div className="jawi-envelope-letter" data-cover-content>
            <div className="jawi-letter-face jawi-letter-front">
              <span className="jawi-kicker">The Wedding of</span>
              <h1><span data-live="bride_nickname">{bride}</span><i>&amp;</i><span data-live="groom_nickname">{groom}</span></h1>
              <time data-date-field="reception_date">{idDate(eventDate,false)}</time>
              <div className="jawi-envelope-letter-guest"><small>{guestSalutation}</small><strong>{guestName}</strong></div>
            </div>
            <div className="jawi-letter-face jawi-letter-back" aria-hidden="true">
              <small>Dengan penuh sukacita</small>
              <strong>{bride} <i>&amp;</i> {groom}</strong>
              <span>Kami mengundang Anda</span>
            </div>
          </div>
          <div className="jawi-envelope-flap" aria-hidden="true"><span className="jawi-envelope-flap-label">Wedding Invitation</span></div>
          <div className="jawi-envelope-pocket" aria-hidden="true">
            <div className="jawi-envelope-title"><strong>{bride} <i>&amp;</i> {groom}</strong></div>
            <div className="jawi-envelope-address"><small>Kepada Yth.</small><strong>{guestName}</strong></div>
          </div>
          <button className="jawi-envelope-seal open-invitation" type="button" data-open-invitation aria-label="Buka undangan"><b>{bride.charAt(0)}<i>&amp;</i>{groom.charAt(0)}</b><span data-open-label>Buka Undangan</span><Icon name="jawi-arrow"/></button>
        </div>
        <small className="jawi-envelope-hint">Klik undangan untuk membuka</small>
      </div>
    </section>
    <main className="invitation-content jawi-layout">
      <div className="jawi-scroll"><section className="jawi-section jawi-prologue jawi-prologue-v3">
        <div className="jawi-prologue-background" aria-hidden="true"/>
        <div className="jawi-prologue-contours" aria-hidden="true"><i/><i/><i/></div>
        <div className="jawi-prologue-ornaments" aria-hidden="true">
          <span className="jawi-prologue-batik batik-one"/>
          <span className="jawi-prologue-batik batik-two"/>
          <img className="jawi-prologue-wayang prologue-wayang-left" src={`${A}puspa-wayang-rama-v2.webp`} alt="" decoding="async"/>
          <img className="jawi-prologue-wayang prologue-wayang-right" src={`${A}puspa-wayang-sinta-v2.webp`} alt="" decoding="async"/>
          <img className="jawi-prologue-flower flower-scene" src={`${A}puspa-floral-nusantara-v3.webp`} alt="" decoding="async"/>
        </div>
        <div className="jawi-prologue-grid">
          <div className="jawi-prologue-copy jawi-reveal" data-reveal="card-3d">
            <span className="jawi-kicker">A Celebration of Love</span>
            <h2 className="jawi-typewriter-title"><span data-live="bride_nickname">{bride}</span><i>&amp;</i><span data-live="groom_nickname">{groom}</span></h2>
            <p>Kami mengundang Anda untuk menjadi bagian dari babak terindah perjalanan kami.</p>
            <time data-date-field="reception_date">{idDate(eventDate)}</time>
            <div className="jawi-prologue-countdown countdown" data-countdown={`${eventDate}T${eventTime}:00+07:00`}>
              {[['days','Hari'],['hours','Jam'],['minutes','Menit'],['seconds','Detik']].map(v=><div key={v[0]}><strong {...{[`data-${v[0]}`]:''}}>00</strong><span>{v[1]}</span></div>)}
            </div>
            <a className="jawi-button jawi-prologue-calendar" href={calendar} target="_blank" rel="noreferrer">Simpan Tanggal <Icon name="jawi-arrow"/></a>
          </div>
          <div className="jawi-prologue-portrait jawi-reveal" data-reveal="portrait-3d">
            <div
              className="jawi-prologue-arch jawi-clickable-photo"
              onClick={() => openPhoto({ src: cover, title: `${bride} & ${groom}`, caption: 'Our Beautiful Moment — Foto Sampul' })}
              role="button"
              tabIndex={0}
              aria-label="Lihat foto sampul ukuran penuh"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPhoto({ src: cover, title: `${bride} & ${groom}`, caption: 'Our Beautiful Moment — Foto Sampul' }); } }}
            >
              <img src={cover} alt={`Foto ${bride} dan ${groom}`} decoding="async" fetchPriority="low"/>
              <span className="jawi-photo-zoom-hint" aria-hidden="true"><Icon name="jawi-zoom"/></span>
              <span>Our Beautiful Moment</span>
            </div>
            <img className="jawi-prologue-flower portrait-flower" src={`${A}puspa-floral-nusantara-v3.webp`} alt="" decoding="async"/>
            <b className="jawi-prologue-seal" aria-hidden="true">{bride.charAt(0)} <i>&amp;</i> {groom.charAt(0)}</b>
          </div>
        </div>
      </section>
      <section className="jawi-section jawi-greeting jawi-greeting-v2">
        <div className="jawi-greeting-scenery" aria-hidden="true"/>
        <div className="jawi-greeting-contours" aria-hidden="true"><i/><i/><i/></div>
        <div className="greeting-card jawi-reveal" data-reveal="arch-gate">
          <span className="greeting-batik-ribbon" aria-hidden="true"/>
          <div className="greeting-crest"><span/><img src={`${A}puspa-greeting-crest-v1.webp`} alt="" loading="lazy" decoding="async"/><span/></div>
          <small className="greeting-eyebrow">Atas Rahmat Allah</small>
          <h2>The Wedding</h2>
          <div className="greeting-divider"><i/><b>&amp;</b><i/></div>
          <p className="arabic">السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ</p>
          <p className="greeting-message">Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menjadi bagian dari hari bahagia kami.</p>
          <span className="greeting-signature">Pawiwahan · {bride} &amp; {groom}</span>
        </div>
      </section>
      <section className="jawi-section jawi-couple-section jawi-couple-v2">
        <div className="jawi-couple-scenery" aria-hidden="true"/>
        <div className="jawi-couple-contours" aria-hidden="true"><i/><i/><i/></div>
        <Heading small="Dua Jiwa, Satu Janji" title="Mempelai"/>
        <div className="jawi-couple-grid">
          <Person
            type="bride"
            photo={bridePhoto}
            title="Mempelai Wanita"
            full={i.bride_full_name||'Nisa Maharani'}
            father={i.bride_father||'Bapak Firmansyah'}
            mother={i.bride_mother||'Ibu Lestari'}
            onPhotoClick={() => openPhoto({
              src: bridePhoto,
              title: i.bride_full_name || `${bride} — Mempelai Wanita`,
              caption: `Putri dari ${i.bride_father || 'Bapak Firmansyah'} & ${i.bride_mother || 'Ibu Lestari'}`
            })}
          />
          <div className="couple-connector jawi-reveal" data-reveal="scale"><span/><i>&amp;</i><span/></div>
          <Person
            type="groom"
            photo={groomPhoto}
            title="Mempelai Pria"
            full={i.groom_full_name||'Andi Pratama'}
            father={i.groom_father||'Bapak Suryanto'}
            mother={i.groom_mother||'Ibu Rahayu'}
            onPhotoClick={() => openPhoto({
              src: groomPhoto,
              title: i.groom_full_name || `${groom} — Mempelai Pria`,
              caption: `Putra dari ${i.groom_father || 'Bapak Suryanto'} & ${i.groom_mother || 'Ibu Rahayu'}`
            })}
          />
        </div>
      </section>
      <section className="jawi-section jawi-countdown-section jawi-countdown-v2">
        <div className="jawi-countdown-scenery" aria-hidden="true"/>
        <div className="jawi-countdown-orbits" aria-hidden="true"><i/><i/><i/></div>
        <Heading small="Save the date" title="Hari Yang Ditunggu"/>
        <div className="countdown-wreath jawi-reveal" data-reveal="wreath-bloom">
          <img className="countdown-celestial-wheel" src={`${A}puspa-countdown-wheel-v1.webp`} alt="" loading="lazy" decoding="async"/>
          <div className="jawi-countdown countdown" data-countdown={`${eventDate}T${eventTime}:00+07:00`}>{[['days','Hari'],['hours','Jam'],['minutes','Menit'],['seconds','Detik']].map(v=><div key={v[0]}><strong {...{[`data-${v[0]}`]:''}}>00</strong><span>{v[1]}</span></div>)}</div>
        </div>
        <a className="jawi-button calendar-link jawi-reveal" data-reveal="scale" href={calendar} target="_blank" rel="noreferrer">Tambah ke Kalender <Icon name="jawi-arrow"/></a>
      </section>
      <section className="jawi-section jawi-events-section jawi-events-v2"><div className="jawi-events-scenery" aria-hidden="true"/><div className="jawi-events-routes" aria-hidden="true"><i/><i/><i/></div><Heading small="Rangkaian Acara" title="Lokasi & Waktu"/><div className="event-date-lockup jawi-reveal" data-reveal="seal-stamp"><span>{new Date(`${eventDate}T12:00:00`).toLocaleDateString('id-ID',{month:'long'})}</span><strong>{new Date(`${eventDate}T12:00:00`).getDate()}</strong><span>{new Date(`${eventDate}T12:00:00`).getFullYear()}</span></div><div className="jawi-events-grid"><EventCard type="akad" invitation={i}/><EventCard type="reception" invitation={i}/></div></section>
      <section className="jawi-section jawi-story-section jawi-story-v2"><div className="jawi-story-scenery" aria-hidden="true"/><div className="jawi-story-stitches" aria-hidden="true"><i/><i/><i/></div><div className="story-gate story-manuscript jawi-reveal" data-reveal="story-gate"><span className="story-chapter" aria-hidden="true">Catatan <b>01</b></span><Heading small="Kisah Kami" title={<>Berawal,<br/>Bertumbuh,<br/>Berlabuh</>}/><div className="story-copy"><span aria-hidden="true">Satu kisah · satu tujuan</span><p data-live="love_story">{i.love_story||'Berawal dari pertemuan sederhana, tumbuh menjadi persahabatan, lalu keyakinan untuk berjalan bersama.'}</p></div><img className="story-thread-ornament" src={`${A}puspa-story-thread-v1.webp`} alt="" loading="lazy" decoding="async"/></div></section>
      <section className="jawi-section jawi-gallery-section jawi-gallery-v2"><div className="jawi-gallery-scenery" aria-hidden="true"/><div className="jawi-gallery-registers" aria-hidden="true"><i/><i/><i/></div><img className="gallery-studio-ornament gallery-studio-left" src={`${A}puspa-gallery-studio-ornament-v1.webp`} alt="" loading="lazy" decoding="async"/><img className="gallery-studio-ornament gallery-studio-right" src={`${A}puspa-gallery-studio-ornament-v1.webp`} alt="" loading="lazy" decoding="async"/><Heading small="Potret Bahagia" title="Galeri Kisah Kami"/><div className={`jawi-gallery-track gallery-count-${Math.min(photos.length||limit,5)}`}>{photos.length?photos.map((photo,index)=><figure className="jawi-reveal jawi-clickable-photo" data-reveal="gallery-card" key={photo.id} style={{'--gallery-rot': `${index % 2 === 0 ? -4 : 4}deg`, '--gallery-target-rot': `${index % 2 === 0 ? -1.5 : 2}deg`, '--gallery-x': `${index % 2 === 0 ? -35 : 35}px`}} onClick={()=>openGalleryPhoto(index)} role="button" tabIndex={0} aria-label={`Lihat foto galeri ${index+1} ukuran penuh`} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openGalleryPhoto(index);}}}><img className="gallery-image" loading="lazy" decoding="async" src={mediaUrl(photo.file_path)} alt={`Momen pasangan ${index+1}`}/><span className="jawi-photo-zoom-hint" aria-hidden="true"><Icon name="jawi-zoom"/></span><figcaption><span>{String(index+1).padStart(2,'0')}</span> Kenangan</figcaption></figure>):['Pertemuan','Perjalanan','Lamaran','Hari Bahagia','Selamanya'].slice(0,limit).map((caption,index)=><figure className="gallery-empty jawi-reveal jawi-clickable-photo" data-reveal="gallery-card" key={caption} style={{'--gallery-rot': `${index % 2 === 0 ? -4 : 4}deg`, '--gallery-target-rot': `${index % 2 === 0 ? -1.5 : 2}deg`, '--gallery-x': `${index % 2 === 0 ? -35 : 35}px`}} onClick={()=>openGalleryPhoto(index)} role="button" tabIndex={0} aria-label={`Lihat foto ${caption} ukuran penuh`} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openGalleryPhoto(index);}}}><span>{String(index+1).padStart(2,'0')}</span><span className="jawi-photo-zoom-hint" aria-hidden="true"><Icon name="jawi-zoom"/></span><figcaption>{caption}</figcaption></figure>)}</div></section>
      {i.has_gift&&<GiftSection accounts={giftAccounts}/>} {i.has_wishes&&<RsvpSection invitation={i} guestName={guestName} greetings={greetings} preview={preview}/>}
      <section className="jawi-section jawi-closing-section jawi-closing-v2">
        <div className="jawi-closing-scenery" aria-hidden="true"/>
        <div className="jawi-closing-contours" aria-hidden="true"><i/><i/><i/></div>
        <img className="closing-relief closing-relief-left" src={`${A}puspa-closing-relief-v1.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" fetchPriority="low"/>
        <img className="closing-relief closing-relief-right" src={`${A}puspa-closing-relief-v1.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" fetchPriority="low"/>
        <div className="closing-gate jawi-reveal" data-reveal="closing-portal">
          <span className="closing-copper-seal" aria-hidden="true"><i/></span>
          <small>Matur Nuwun</small>
          <h2><span data-live="bride_nickname">{bride}</span><i>&amp;</i><span data-live="groom_nickname">{groom}</span></h2>
          <p>Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu.</p>
          <time data-date-field="reception_date">{idDate(eventDate,false)}</time>
          {!preview&&<button className="share-button jawi-button" type="button" data-share data-share-url={`${location.origin}/${i.slug}`}>Bagikan Undangan <Icon name="jawi-arrow"/></button>}
          <img className="closing-card-relief" src={`${A}puspa-closing-relief-v1.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" fetchPriority="low"/>
        </div>
      </section>
      <footer className="template-footer jawi-footer jawi-footer-v2">
        <div className="footer-batik-ribbon" aria-hidden="true"><i/><i/><i/></div>
        <div className="template-brand-lockup"><img src="/assets/images/brand/daymoment-mark.svg" alt=""/><strong>Daymoment</strong></div>
        <p>Merangkai momen, menjaga cerita.</p>
        <small>© {new Date().getFullYear()} Daymoment</small>
      </footer>
    </div>
    </main>{i.has_music&&i.music_file&&<audio data-wedding-audio loop preload="metadata" src={mediaUrl(i.music_file)}/>} {i.has_music&&<button className="jawi-music" type="button" data-music-controller aria-label="Kontrol musik" aria-pressed="false" title={i.music_title||'Musik undangan'}><Icon name="jawi-music"/></button>}
    {lightbox && lightbox.items[lightbox.index] && (
      <div
        className="jawi-lightbox is-open"
        role="dialog"
        aria-modal="true"
        aria-label="Lihat foto penuh"
        onClick={() => setLightbox(null)}
      >
        <div className="jawi-lightbox-backdrop" aria-hidden="true" />
        <button
          className="jawi-lightbox-close"
          type="button"
          onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
          aria-label="Tutup tampilan foto"
        >
          <Icon name="jawi-close" />
        </button>
        {lightbox.items.length > 1 && (
          <>
            <button
              className="jawi-lightbox-nav prev"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
              aria-label="Foto sebelumnya"
            >
              <Icon name="jawi-chevron-left" />
            </button>
            <button
              className="jawi-lightbox-nav next"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
              aria-label="Foto berikutnya"
            >
              <Icon name="jawi-chevron-right" />
            </button>
          </>
        )}
        <div
          className="jawi-lightbox-dialog"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (lightbox.items.length <= 1) return;
            const diff = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(diff) > 42) {
              if (diff < 0) nextPhoto();
              else prevPhoto();
            }
          }}
        >
          <div className="jawi-lightbox-frame">
            <img
              className="jawi-lightbox-img"
              src={lightbox.items[lightbox.index].src}
              alt={lightbox.items[lightbox.index].title || 'Foto ukuran penuh'}
            />
          </div>
          <div className="jawi-lightbox-caption">
            <strong>{lightbox.items[lightbox.index].title}</strong>
            {lightbox.items[lightbox.index].caption && <p>{lightbox.items[lightbox.index].caption}</p>}
            {lightbox.items.length > 1 && (
              <span className="jawi-lightbox-counter">
                {lightbox.index + 1} / {lightbox.items.length}
              </span>
            )}
          </div>
        </div>
      </div>
    )}
  </div></>;
}

function Symbols(){return <svg className="jawi-symbols"><defs><symbol id="jawi-arrow" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5"/></symbol><symbol id="jawi-map" viewBox="0 0 24 24"><path d="M12 21s6-5.4 6-12A6 6 0 0 0 6 9c0 6.6 6 12 6 12Z"/><circle cx="12" cy="9" r="2"/></symbol><symbol id="jawi-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></symbol><symbol id="jawi-music" viewBox="0 0 24 24"><path d="M9 18V6l10-2v12M9 10l10-2"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></symbol><symbol id="jawi-zoom" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/></symbol><symbol id="jawi-close" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></symbol><symbol id="jawi-chevron-left" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></symbol><symbol id="jawi-chevron-right" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></symbol></defs></svg>}
function Icon({name}){return <svg><use href={`#${name}`}/></svg>}
function Botanical({className,eager=false}){return <div className={className} aria-hidden="true"><img className="decor-janur" src={`${A}janur-arch-v2.webp`} srcSet={`${A}janur-arch-v2-mobile.webp 900w, ${A}janur-arch-v2.webp 1536w`} sizes="100vw" alt="" loading={eager?'eager':'lazy'} fetchPriority={eager?'high':'low'} decoding="async"/><img className="decor-floral" src={`${A}floral-frame-v2.webp`} srcSet={`${A}floral-frame-v2-mobile.webp 900w, ${A}floral-frame-v2.webp 1536w`} sizes="100vw" alt="" loading={eager?'eager':'lazy'} fetchPriority={eager?'high':'low'} decoding="async"/></div>}
function Cloud({className}){return <img className={className} src={`${A}cloud-line.svg`} alt=""/>}
function Heading({small,title}){return <div className="jawi-heading jawi-reveal" data-reveal="scale"><small>{small}</small><h2>{title}</h2></div>}
function Person({type,photo,title,full,father,mother,onPhotoClick}){return <article className="jawi-person jawi-reveal" data-reveal={type==='bride'?'bride-entrance':'groom-entrance'}><div className={`portrait-frame ${type}-frame jawi-clickable-photo`} onClick={onPhotoClick} role="button" tabIndex={0} aria-label={`Lihat foto ${title} ukuran penuh`} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onPhotoClick?.();}}}><img className="couple-photo" src={photo} alt={`Foto ${title}`} loading="lazy" decoding="async"/><span className="jawi-photo-zoom-hint" aria-hidden="true"><Icon name="jawi-zoom"/></span><span className="couple-portrait-ornament" aria-hidden="true"><img src={`${A}puspa-couple-ornament-v1.webp`} alt="" loading="lazy" decoding="async"/></span></div><small>{title}</small><h2 data-live={`${type}_full_name`}>{full}</h2><p>{type==='bride'?'Putri':'Putra'} dari</p><strong><span data-live={`${type}_father`}>{father}</span><br/>&amp; <span data-live={`${type}_mother`}>{mother}</span></strong></article>}
function EventCard({type,invitation:i}){const akad=type==='akad',date=i[`${type}_date`]||i.reception_date;return <article className={`jawi-event ${akad?'':'reception-event'} jawi-reveal`} data-reveal={akad?'event-left':'event-right'}><img className="event-route-ornament" src={`${A}puspa-events-route-ornament-v1.webp`} alt="" loading="lazy" decoding="async"/><div className="event-icon"><span/></div><small>{akad?'Sakral & khidmat':'Dengan sukacita'}</small><h3>{akad?'Akad Nikah':'Resepsi'}</h3><time data-date-field={`${type}_date`}>{idDate(date)}</time><strong data-time-range={type}>{timeRange(i[`${type}_start_time`],i[`${type}_end_time`])}</strong><p data-live="venue_name">{i.venue_name||'Lokasi Acara'}</p><address data-live="venue_address">{i.venue_address||'Alamat lengkap akan diumumkan.'}</address><a className="jawi-button" data-live-href="maps_url" href={i.maps_url||'#'} target="_blank"><Icon name="jawi-map"/> Lihat Peta</a></article>}
function GiftSection({accounts}){return <section className="jawi-section jawi-gift-section jawi-gift-v2">
  <div className="jawi-gift-scenery" aria-hidden="true"/>
  <div className="jawi-gift-contours" aria-hidden="true"><i/><i/><i/></div>
  <img className="gift-knot-ornament gift-knot-left" src={`${A}puspa-gift-knot-v1.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" fetchPriority="low"/>
  <img className="gift-knot-ornament gift-knot-right" src={`${A}puspa-gift-knot-v1.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" fetchPriority="low"/>
  <div className="gift-inner jawi-reveal" data-reveal="scale">
    <div className="jawi-heading jawi-reveal" data-reveal="scale"><small>Tanda Kasih</small><h2>Wedding Gift</h2><p>Doa restu Anda adalah hadiah terindah. Apabila ingin mengirimkan tanda kasih, dapat melalui rekening berikut.</p><span className="gift-heading-stitch" aria-hidden="true"/></div>
    {accounts.length?<>
      <div className="bank-picker jawi-reveal" data-reveal="scale" data-bank-picker><input className="bank-picker-toggle" type="checkbox" id="bankPickerToggle"/><label className="bank-picker-summary" htmlFor="bankPickerToggle"><span>Pilih bank / e-wallet</span><strong data-bank-label>{accounts[0].provider}</strong><i/></label><div className="bank-picker-options">{accounts.map((a,index)=><button type="button" data-bank-value={index} aria-pressed={index===0} key={a.id||index}><span>{a.provider}</span>{a.label&&<small>{a.label}</small>}</button>)}</div></div>
      <div className="gift-bank-stack">{accounts.map((a,index)=><div className="bank-card jawi-reveal" data-reveal="gift-vault" data-gift-account-card={index} hidden={index>0} key={a.id||index}><span className="bank-chip"/><small>{a.provider}</small><strong data-account-number>{a.account_number}</strong><p>a.n. {a.account_name}</p>{a.label&&<em>{a.label}</em>}<button type="button" data-copy-account><Icon name="jawi-copy"/> Salin Nomor</button><img className="bank-card-knot" src={`${A}puspa-gift-knot-v1.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" fetchPriority="low"/></div>)}</div>
    </>:<div className="gift-empty jawi-reveal" data-reveal="scale">Informasi amplop digital belum ditambahkan.</div>}
  </div>
</section>}
function MovingClouds({className}){return <div className={`moving-clouds ${className}`}><div>{Array.from({length:6},(_,n)=><Cloud key={n}/>)}</div></div>}
function RsvpSection({invitation:i,guestName,greetings,preview}){return <section className="jawi-section jawi-rsvp-section jawi-rsvp-v2" id="rsvp">
  <div className="jawi-rsvp-scenery" aria-hidden="true"/>
  <div className="jawi-rsvp-contours" aria-hidden="true"><i/><i/><i/></div>
  <img className="rsvp-letter-flourish rsvp-letter-flourish-left" src={`${A}puspa-rsvp-stamp-flourish-v1.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" fetchPriority="low"/>
  <img className="rsvp-letter-flourish rsvp-letter-flourish-right" src={`${A}puspa-rsvp-stamp-flourish-v1.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" fetchPriority="low"/>
  <div className="rsvp-shell jawi-reveal" data-reveal="rsvp-card">
    <div className="rsvp-stamp-emblem" aria-hidden="true"><i/><span/></div>
    <Heading small="Ucapan & Harapan" title="Turut Berbahagia"/>
    {preview&&<p className="preview-form-badge">Mode preview — form tidak mengirim data</p>}
    <form className="greeting-form jawi-form jawi-reveal" {...(preview?{'data-preview-form':''}:{'data-greeting-form':''})}><input type="hidden" name="slug" value={i.slug||''}/><div className="form-split"><label><span>Nama</span><input name="guest_name" maxLength="120" required defaultValue={guestName!=='Bapak/Ibu/Saudara/i'?guestName:''} placeholder="Nama Anda"/></label><CustomSelect caption="Kehadiran" name="attendance_status" initial="" label="Pilih kehadiran" options={[["attending",'Hadir'],['not_attending','Tidak Hadir'],['unsure','Masih Ragu']]}/></div><label><span>Ucapan & Doa</span><textarea name="message" maxLength="500" required placeholder="Tuliskan doa hangat..."/><small><span data-message-count>0</span>/500</small></label><button className="jawi-button" type="submit">Kirim Ucapan <Icon name="jawi-arrow"/></button><p className="form-feedback" data-form-feedback/></form>
    <div className="greeting-list jawi-wishes jawi-reveal" data-reveal="left" data-greeting-list>{greetings.length?greetings.map(g=><article className="greeting-item" key={g.id}><div className="greeting-head"><strong>{g.guest_name}</strong><small>{attendance(g.attendance_status)}</small></div><p>{g.message}</p></article>):<div className="greeting-empty" data-empty-greeting>Belum ada ucapan. Jadilah yang pertama mengirimkan doa hangat.</div>}</div>
  </div>
</section>}
function CustomSelect({caption,name,initial,label,options}){return <div className="jawi-custom-select form-choice" data-custom-select><span className="choice-caption">{caption}</span><input type="hidden" name={name} defaultValue={initial}/><button type="button" className="choice-trigger" data-choice-trigger aria-haspopup="listbox" aria-expanded="false"><span data-choice-label>{label}</span><i/></button><div className="choice-options" data-choice-options role="listbox" hidden>{options.map((v,index)=><button type="button" role="option" data-choice-value={v[0]} aria-selected={index===0&&initial!==''} key={v[0]}>{v[1]}</button>)}</div></div>}
