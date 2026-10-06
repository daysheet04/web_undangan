import React, { useEffect, useMemo, useRef, useState } from "react";
import { mediaUrl } from "../lib/api.js";
import VerdantOpeningScene from "./verdant-vow/VerdantOpeningScene.jsx";

const ASSET = "/assets/images/templates/verdant-vow/layers";

const formatDate = (value, options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) => {
  if (!value) return "Tanggal akan diumumkan";
  return new Intl.DateTimeFormat("id-ID", options).format(new Date(`${value}T12:00:00`));
};

const timeRange = (start, end) => {
  const from = String(start || "").slice(0, 5);
  const to = String(end || "").slice(0, 5);
  if (!from) return "Waktu akan diumumkan";
  return `${from} WIB${to ? ` — ${to} WIB` : " — selesai"}`;
};

const sceneOpacity = (progress, enter, holdStart, holdEnd, leave) => {
  if (progress <= enter || progress >= leave) return 0;
  if (progress < holdStart) return (progress - enter) / (holdStart - enter);
  if (progress <= holdEnd) return 1;
  return 1 - (progress - holdEnd) / (leave - holdEnd);
};

const IconMusic = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>;
const IconMap = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 10c0 5.8-8 11.5-8 11.5S4 15.8 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
const IconLeaf = () => <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.25"><path d="M31 8C18 8 9 15 9 28c8 2 18-1 22-20Z" /><path d="M11 29c5-6 10-10 17-14" /></svg>;

export default function VerdantVowTemplate({ invitation: i, media = [], giftAccounts = [], greetings = [], guestName, preview }) {
  const bride = i.bride_nickname || "Alya";
  const groom = i.groom_nickname || "Raka";
  const brideFull = i.bride_full_name || bride;
  const groomFull = i.groom_full_name || groom;
  const eventDate = i.reception_date || i.akad_date;
  const photos = media.slice(0, Number(i.gallery_limit || 5));
  const bridePhotoSource = i.bride_photo || media[0]?.file_path || i.cover_image;
  const groomPhotoSource = i.groom_photo || media[1]?.file_path || i.cover_image;
  const bridePhoto = bridePhotoSource ? mediaUrl(bridePhotoSource) : "";
  const groomPhoto = groomPhotoSource ? mediaUrl(groomPhotoSource) : "";
  const [opened, setOpened] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const scrollRef = useRef(null);
  const journeyRef = useRef(null);
  const stageRef = useRef(null);
  const audioRef = useRef(null);

  const countdown = useMemo(() => {
    const target = eventDate ? new Date(`${eventDate}T00:00:00`) : new Date();
    const delta = Math.max(0, target - clock);
    return [Math.floor(delta / 86400000), Math.floor(delta / 3600000) % 24, Math.floor(delta / 60000) % 60, Math.floor(delta / 1000) % 60];
  }, [eventDate, clock]);

  const goScene = (id) => {
    const root = scrollRef.current;
    const journey = journeyRef.current;
    const target = root?.querySelector(`#${id}`);
    const markers = { "vv-journey": 0, "vv-couple": 0.18, "vv-event": 0.6, "vv-location": 0.86 };
    if (!root) return;
    if (journey && Object.hasOwn(markers, id)) {
      const distance = Math.max(0, journey.offsetHeight - root.clientHeight);
      root.scrollTo({ top: journey.offsetTop + distance * markers[id], behavior: "smooth" });
      return;
    }
    if (target) root.scrollTo({ top: target.offsetTop, behavior: "smooth" });
  };

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicPlaying) {
      audio.pause();
      setMusicPlaying(false);
      return;
    }
    audio.play().then(() => setMusicPlaying(true)).catch(() => {});
  };

  useEffect(() => {
    if (!opened || !eventDate) return undefined;
    setClock(Date.now());
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [opened, eventDate]);

  useEffect(() => {
    if (!opened) return undefined;
    const root = scrollRef.current;
    const journey = journeyRef.current;
    const stage = stageRef.current;
    if (!root || !journey || !stage) return undefined;

    if (i.has_music && i.music_file && audioRef.current) {
      audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {});
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.classList.toggle("is-reduced", reduced);
    let frame = 0;
    const render = () => {
      frame = 0;
      if (reduced) return;
      const distance = Math.max(1, journey.offsetHeight - root.clientHeight);
      const progress = Math.min(1, Math.max(0, (root.scrollTop - journey.offsetTop) / distance));
      const ease = progress * progress * (3 - 2 * progress);
      stage.style.setProperty("--vv-p", progress.toFixed(4));
      stage.style.setProperty("--vv-camera-scale", (1 + Math.sin(progress * Math.PI) * 0.12 + progress * 0.055).toFixed(4));
      stage.style.setProperty("--vv-camera-x", `${(-3 + ease * 7).toFixed(2)}%`);
      stage.style.setProperty("--vv-camera-y", `${(-1 - ease * 5).toFixed(2)}%`);
      stage.style.setProperty("--vv-couple-scale", (0.92 + Math.sin(Math.min(1, progress * 1.8) * Math.PI * 0.5) * 0.22).toFixed(4));
      stage.style.setProperty("--vv-intro-o", Math.max(0, 1 - progress / 0.14).toFixed(3));
      stage.style.setProperty("--vv-profile-o", sceneOpacity(progress, 0.1, 0.16, 0.28, 0.35).toFixed(3));
      stage.style.setProperty("--vv-blessing-o", sceneOpacity(progress, 0.31, 0.38, 0.47, 0.54).toFixed(3));
      stage.style.setProperty("--vv-event-o", sceneOpacity(progress, 0.5, 0.57, 0.7, 0.77).toFixed(3));
      stage.style.setProperty("--vv-location-o", sceneOpacity(progress, 0.73, 0.81, 1, 1.01).toFixed(3));
    };
    const requestRender = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };
    render();
    root.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender);

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting)),
      { root, threshold: 0.16 }
    );
    root.querySelectorAll("[data-vv-reveal]").forEach((node) => observer.observe(node));

    return () => {
      root.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", requestRender);
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [opened, i.has_music, i.music_file]);

  return (
    <main className={`verdant-vow ${opened ? "is-open" : ""}`}>
      {!opened && <VerdantOpeningScene bride={bride} groom={groom} guestName={guestName} date={formatDate(eventDate)} onEnter={() => setOpened(true)} />}

      {opened && <div className="vv-scroll" ref={scrollRef}>
        <section className="vv-journey" id="vv-journey" ref={journeyRef}>
          <div className="vv-story-stage" ref={stageRef}>
            <div className="vv-world" aria-hidden="true">
              <div className="vv-world-backdrop" />
              <div className="vv-world-glow" />
              <div className="vv-cloud vv-cloud-rear" />
              <div className="vv-garden-arch" />
              <img className="vv-world-couple" src={`${ASSET}/couple-cinematic.webp`} alt="" fetchPriority="high" />
              <div className="vv-cloud vv-cloud-front" />
              <img className="vv-canopy" src={`${ASSET}/hanging-canopy.webp`} alt="" fetchPriority="high" />
              <img className="vv-foreground vv-foreground-left" src={`${ASSET}/foreground-botanical.webp`} alt="" />
              <img className="vv-foreground vv-foreground-right" src={`${ASSET}/foreground-botanical.webp`} alt="" />
              <div className="vv-fireflies">{Array.from({ length: 16 }, (_, n) => <i key={n} style={{ "--n": n, "--x": `${(n * 17) % 91}%`, "--y": `${(n * 29) % 83}%` }} />)}</div>
            </div>

            <div className="vv-scene-copy vv-scene-intro">
              <small>Selamat datang di taman kami</small>
              <h1><b>{bride}</b><span>&amp;</span><b>{groom}</b></h1>
              <p>Gulir perlahan untuk mengikuti kisah kami</p>
              <i className="vv-scroll-cue" />
            </div>

            <div className="vv-scene-copy vv-scene-profile" id="vv-couple">
              <small>Dua hati, satu perjalanan</small>
              <h2>Mempelai</h2>
              <div className="vv-profile-pair">
                <article>{bridePhoto && <img className="vv-profile-photo" src={bridePhoto} alt={brideFull} loading="lazy" />}<span>Mempelai wanita</span><h3>{brideFull}</h3><p>Putri dari<br /><b>{i.bride_father || "Bapak"}</b> &amp; <b>{i.bride_mother || "Ibu"}</b></p></article>
                <i>&amp;</i>
                <article>{groomPhoto && <img className="vv-profile-photo" src={groomPhoto} alt={groomFull} loading="lazy" />}<span>Mempelai pria</span><h3>{groomFull}</h3><p>Putra dari<br /><b>{i.groom_father || "Bapak"}</b> &amp; <b>{i.groom_mother || "Ibu"}</b></p></article>
              </div>
            </div>

            <div className="vv-scene-copy vv-scene-blessing">
              <IconLeaf />
              <small>Dengan penuh rasa syukur</small>
              <p className="vv-bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</p>
              <h2>Assalamu’alaikum<br />Warahmatullahi Wabarakatuh</h2>
              <p>Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menjadi bagian dari hari bahagia kami.</p>
            </div>

            <div className="vv-scene-copy vv-scene-event" id="vv-event">
              <small>Hari yang kami nantikan</small>
              <h2>{formatDate(eventDate, { day: "numeric", month: "long", year: "numeric" })}</h2>
              <div className="vv-countdown-grid">{countdown.map((value, index) => <span key={index}><b>{String(value).padStart(2, "0")}</b><small>{["Hari", "Jam", "Menit", "Detik"][index]}</small></span>)}</div>
              <div className="vv-event-compact">
                <EventSummary title="Akad Nikah" date={i.akad_date} start={i.akad_start_time} end={i.akad_end_time} />
                {i.reception_date && <EventSummary title="Resepsi" date={i.reception_date} start={i.reception_start_time} end={i.reception_end_time} />}
              </div>
            </div>

            <div className="vv-scene-copy vv-scene-location" id="vv-location">
              <small>Tempat kami mengikat janji</small>
              <h2>{i.venue_name || "Lokasi Pernikahan"}</h2>
              <p>{i.venue_address || "Alamat lengkap akan diumumkan."}</p>
              {i.maps_url && <a href={i.maps_url} target="_blank" rel="noreferrer"><IconMap /> Lihat lokasi</a>}
              <span>Perjalanan berlanjut di bawah</span>
            </div>
          </div>
        </section>

        {i.love_story && <section className="vv-after vv-story" id="vv-story" data-vv-reveal>
          <div className="vv-after-heading"><small>Kisah yang tumbuh</small><h2>Berawal, Bertumbuh,<br />Berlabuh</h2></div>
          <div className="vv-story-photo"><img src={mediaUrl(i.cover_image || media[0]?.file_path)} alt={`${bride} dan ${groom}`} loading="lazy" /></div>
          <p>{i.love_story}</p>
        </section>}

        <section className="vv-after vv-gallery" id="vv-gallery" data-vv-reveal>
          <div className="vv-after-heading"><small>Potongan waktu yang kami simpan</small><h2>Garden Memories</h2></div>
          {photos.length ? <div className="vv-gallery-grid">{photos.map((photo, index) => <figure key={photo.id || index}><img src={mediaUrl(photo.file_path)} alt={`Momen ${index + 1}`} loading="lazy" /><figcaption>Memory · {String(index + 1).padStart(2, "0")}</figcaption></figure>)}</div> : <p className="vv-empty">Momen bahagia akan segera hadir.</p>}
        </section>

        {i.has_gift && <section className="vv-after vv-gift" id="vv-gift" data-vv-reveal>
          <div className="vv-after-heading"><small>Tanda kasih</small><h2>Wedding Gift</h2></div>
          <p>Doa restu Anda adalah hadiah terindah. Bagi yang ingin mengirimkan tanda kasih, tersedia rekening berikut.</p>
          <div className="vv-gift-grid">{giftAccounts.map((account, index) => <article key={account.id || index}>
            <small>{account.provider}</small><strong data-account-number>{account.account_number}</strong><span>a.n. {account.account_name}</span>{account.label && <em>{account.label}</em>}
            <button type="button" data-copy-account>Salin nomor</button>
          </article>)}</div>
        </section>}

        {i.has_wishes && <section className="vv-after vv-rsvp" id="vv-rsvp" data-vv-reveal>
          <div className="vv-after-heading"><small>Ucapan &amp; konfirmasi</small><h2>Kehadiran Anda</h2></div>
          {preview && <p className="vv-preview-note">Mode preview — form tidak mengirim data.</p>}
          <form {...(preview ? { "data-preview-form": "" } : { "data-greeting-form": "" })}>
            <input type="hidden" name="slug" value={i.slug || ""} />
            <div className="vv-form-row">
              <label><span>Nama</span><input name="guest_name" maxLength="120" required defaultValue={guestName !== "Bapak/Ibu/Saudara/i" ? guestName : ""} placeholder="Nama Anda" /></label>
              <label><span>Kehadiran</span><select name="attendance_status" required defaultValue=""><option value="" disabled>Pilih kehadiran</option><option value="attending">Hadir</option><option value="not_attending">Tidak hadir</option><option value="unsure">Masih ragu</option></select></label>
            </div>
            <label><span>Ucapan &amp; doa</span><textarea name="message" maxLength="500" required placeholder="Tuliskan doa hangat..." /><small><span data-message-count>0</span>/500</small></label>
            <button type="submit">Kirim ucapan</button><p className="form-feedback" data-form-feedback />
          </form>
          <div className="vv-wishes" data-greeting-list>{greetings.length ? greetings.slice(0, 6).map((greeting) => <article className="greeting-item" key={greeting.id}><strong>{greeting.guest_name}</strong><small>{greeting.attendance_status === "attending" ? "Hadir" : greeting.attendance_status === "not_attending" ? "Tidak hadir" : "Masih ragu"}</small><p>{greeting.message}</p></article>) : <p className="vv-empty" data-empty-greeting>Belum ada ucapan. Jadilah yang pertama mengirimkan doa hangat.</p>}</div>
        </section>}

        <section className="vv-after vv-closing" id="vv-closing" data-vv-reveal>
          <img src={`${ASSET}/couple-cinematic.webp`} alt="" loading="lazy" />
          <div><small>Terima kasih</small><p>Merupakan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.</p><h2><b>{bride}</b><span>&amp;</span><b>{groom}</b></h2><time>{formatDate(eventDate, { day: "numeric", month: "long", year: "numeric" })}</time>{!preview && <button type="button" className="vv-share-button" data-share data-share-url={`${window.location.origin}/${i.slug}`}>Bagikan undangan <span>→</span></button>}<strong>DAYMOMENT · BY DAYSHEET GROUP</strong></div>
        </section>
      </div>}

      {opened && <nav className="vv-nav" aria-label="Navigasi undangan"><button type="button" onClick={() => goScene("vv-journey")}>Kisah</button><button type="button" onClick={() => goScene("vv-event")}>Acara</button><button type="button" onClick={() => goScene("vv-gallery")}>Galeri</button>{i.has_wishes && <button type="button" onClick={() => goScene("vv-rsvp")}>Ucapan</button>}</nav>}

      {opened && i.has_music && i.music_file && <><audio ref={audioRef} data-wedding-audio loop src={mediaUrl(i.music_file)} /><button type="button" className={`vv-music-toggle ${musicPlaying ? "is-playing" : ""}`} onClick={toggleMusic} aria-label={musicPlaying ? "Matikan musik" : "Putar musik"}><IconMusic /><span><i /><i /><i /></span></button></>}
    </main>
  );
}

function EventSummary({ title, date, start, end }) {
  if (!date) return null;
  return <article><small>{title}</small><b>{formatDate(date, { weekday: "long", day: "numeric", month: "long" })}</b><span>{timeRange(start, end)}</span></article>;
}
