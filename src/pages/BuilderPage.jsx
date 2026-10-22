import React, { useEffect, useState } from 'react';
import { Loading, ErrorState } from '../components/Layout.jsx';
import { mediaUrl } from '../lib/api.js';
import { useBodyClass, useDocumentTitle, useHeadLinks, useLegacyScripts, useRemote } from '../lib/hooks.js';
import { downloadInvitationPdf } from '../lib/invitationPdf.js';

const providers=['BCA','BRI','BNI','Mandiri','BSI','CIMB Niaga','PermataBank','SeaBank','Jago','GoPay','DANA','OVO','ShopeePay','Lainnya'];
const salutations=['Bapak/Ibu/Saudara/i','Bapak & Ibu','Saudara/i','Keluarga','Teman/Sahabat'];
const TextField=({label,name,value='',full=false,...props})=><label className={`field ${full?'full':''}`}><span>{label}{props.required&&<b> *</b>}</span><input name={name} defaultValue={value||''} {...props}/></label>;
const invitationDateLabel=(value)=>value?new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'long',year:'numeric'}).format(new Date(value)):'';

export default function BuilderPage({token}){
  useBodyClass('builder-page'); useDocumentTitle('Editor Undangan — Daymoment');
  useHeadLinks(['/assets/css/app.css','/assets/css/builder.css','/assets/css/builder-pdf.css']);
  const state=useRemote(`/api/editor/${token}`,[token]);
  useLegacyScripts(['/assets/js/builder.js'],!state.loading&&!state.error);
  const [showPaymentSuccess,setShowPaymentSuccess]=useState(()=>new URLSearchParams(window.location.search).get('payment')==='success');
  const [pdfWorking,setPdfWorking]=useState(false);
  useEffect(()=>{
    if(!showPaymentSuccess||state.loading||state.error)return undefined;
    const cleanUrl=new URL(window.location.href);
    cleanUrl.searchParams.delete('payment');
    window.history.replaceState(window.history.state,'',`${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    const dismiss=()=>setShowPaymentSuccess(false);
    const timer=window.setTimeout(dismiss,4200);
    window.addEventListener('scroll',dismiss,{passive:true,once:true});
    return()=>{
      window.clearTimeout(timer);
      window.removeEventListener('scroll',dismiss);
    };
  },[showPaymentSuccess,state.loading,state.error]);
  if(state.loading)return <Loading/>; if(state.error)return <ErrorState error={state.error}/>;
  const {invitation:i,media,giftAccounts,invitees,appUrl}=state.data;
  const customCoupleMedia = media?.find(m => m.file_path && m.file_path.includes('custom-couple'));
  const customCoupleUrl = customCoupleMedia ? mediaUrl(customCoupleMedia.file_path) : (i.custom_couple_image ? mediaUrl(i.custom_couple_image) : null);
  const galleryMedia = media.filter(m => !m.file_path?.includes('custom-couple'));
  const galleryLimit=Math.max(1,Number(i.gallery_limit)||2), hasGift=Boolean(i.has_gift),hasMusic=Boolean(i.has_music);
  const published=i.order_status==='published'&&Boolean(i.published_at), activeUntilLabel=invitationDateLabel(i.active_until), activeExpired=Boolean(i.active_until&&new Date(i.active_until)<new Date());
  const coupleNames = (() => {
    const g = (i.groom_nickname || i.groom_full_name || '').trim();
    const b = (i.bride_nickname || i.bride_full_name || '').trim();
    if (g && b) return `${g} & ${b}`;
    if (g || b) return g || b;
    return 'Kedua Mempelai';
  })();
  const personalLinksAvailable=Boolean(published&&i.is_active&&!activeExpired&&i.slug);
  const activationState=!published?'pending':!i.is_active?'disabled':activeExpired?'expired':'active';
  const activationTitle=!published?'Masa aktif belum dimulai':!i.is_active?'Link undangan sedang dinonaktifkan':activeExpired?`Masa aktif berakhir pada ${activeUntilLabel}`:`Link aktif sampai ${activeUntilLabel}`;
  const activationCopy=!published?'Link baru aktif selama 2 bulan setelah tombol publish pertama kali ditekan.':!i.is_active?'Undangan sudah pernah diterbitkan, tetapi akses publik sedang dinonaktifkan.':activeExpired?'Tautan publik sudah melewati masa aktif dua bulan.':'Tanggal berakhir tetap sama meskipun undangan diedit dan disimpan ulang.';
  const downloadPrintPdf=async()=>{
    if(pdfWorking)return;
    setPdfWorking(true);
    try{
      const form=document.getElementById('invitationForm');
      const latest=form?Object.fromEntries(new FormData(form).entries()):{};
      await downloadInvitationPdf({
        invitation:{...i,...latest},
        templateCode:i.template_code,
        templateName:i.template_name,
        orderCode:i.order_code,
      });
      window.showToast?.('PDF A4 berhasil dibuat.');
    }catch(error){
      window.showToast?.(error?.message||'PDF belum dapat dibuat.','error');
    }finally{
      setPdfWorking(false);
    }
  };
  return <div className="builder-shell" id="builderApp" data-token={token} data-csrf="worker-token" data-template={i.template_code} data-gallery-limit={galleryLimit} data-published={published?'true':'false'} data-personal-links={personalLinksAvailable?'true':'false'} data-app-url={String(appUrl||location.origin).replace(/\/$/,'')} data-custom-couple={customCoupleUrl||''}>
    {showPaymentSuccess&&<div className="builder-payment-success" role="status"><div><b>✓ Pembayaran berhasil</b><span>Terima kasih. Editor undanganmu sekarang dapat digunakan.</span></div><button type="button" aria-label="Tutup notifikasi pembayaran" onClick={()=>setShowPaymentSuccess(false)}>×</button></div>}
    <div className="builder-topbar"><div><a href="/" className="builder-brand"><img className="brand-logo" src="/assets/images/brand/daymoment-mark.svg" alt=""/><span className="builder-brand-copy"><strong>Daymoment</strong></span></a><span className="order-label">{i.order_code} · {i.package_name}</span></div><div className="save-state" id="saveState" data-state="saved"><i/><span>Tersimpan</span></div></div>
    <div className="mobile-builder-tabs" role="tablist"><button type="button" className="active" data-builder-tab="form">Form</button><button type="button" data-builder-tab="preview">Preview</button></div>
    <div className="builder-content"><section className="builder-form-pane" data-builder-pane="form"><div className="builder-progress"><div className="progress-line"><span id="progressBar" style={{width:'11.111%'}}/></div><div className="progress-copy"><span id="stepCaption">Langkah 1 dari 9</span><strong id="stepTitle">Data Pengantin</strong></div>{published&&activeUntilLabel&&<div className={`builder-expiry-line ${activationState}`}><span>{activationState==='active'?'●':'○'}</span><span>{activationTitle}</span></div>}</div>
      <form id="invitationForm" autoComplete="off">
        <section className="form-step active" data-step="0" data-title="Data Pengantin"><Intro icon="♡" title="Kenalkan kedua mempelai" copy="Nama panggilan akan menjadi nama utama pada cover undangan."/><Card title="Mempelai pria"><div className="field-grid"><TextField full label="Nama lengkap" name="groom_full_name" maxLength="150" required value={i.groom_full_name} placeholder="Contoh: Andi Pratama"/><TextField label="Nama panggilan" name="groom_nickname" maxLength="80" required value={i.groom_nickname} placeholder="Andi"/></div></Card><Card title="Mempelai wanita"><div className="field-grid"><TextField full label="Nama lengkap" name="bride_full_name" maxLength="150" required value={i.bride_full_name} placeholder="Contoh: Nisa Maharani"/><TextField label="Nama panggilan" name="bride_nickname" maxLength="80" required value={i.bride_nickname} placeholder="Nisa"/></div></Card></section>
        <section className="form-step" data-step="1" data-title="Data Orang Tua"><Intro icon="⌂" title="Nama orang tua" copy="Lengkapi nama ayah dan ibu dari masing-masing mempelai."/><Card title="Orang tua mempelai pria"><div className="field-grid"><TextField label="Nama ayah" name="groom_father" required value={i.groom_father} placeholder="Bapak ..."/><TextField label="Nama ibu" name="groom_mother" required value={i.groom_mother} placeholder="Ibu ..."/></div></Card><Card title="Orang tua mempelai wanita"><div className="field-grid"><TextField label="Nama ayah" name="bride_father" required value={i.bride_father} placeholder="Bapak ..."/><TextField label="Nama ibu" name="bride_mother" required value={i.bride_mother} placeholder="Ibu ..."/></div></Card></section>
        <section className="form-step" data-step="2" data-title="Jadwal Acara"><Intro icon="◫" title="Kapan hari bahagianya?" copy="Isi waktu akad dan resepsi sesuai jadwal yang telah ditentukan."/><EventFields title="Akad Nikah" prefix="akad" invitation={i}/><EventFields title="Resepsi" prefix="reception" invitation={i}/></section>
        <section className="form-step" data-step="3" data-title="Lokasi">
          <Intro icon="⌖" title="Di mana acaranya?" copy="Bantu tamu menemukan lokasi dengan alamat, patokan, dan petunjuk perjalanan yang jelas."/>
          <Card>
            <p className="pdf-location-auto-note"><strong>Navigasi PDF dibuat otomatis.</strong> Cukup isi nama dan alamat lokasi. Link Maps, patokan, serta panduan transportasi di bawah bersifat opsional untuk membuat petunjuknya lebih spesifik.</p>
            <div className="field-grid">
              <TextField full label="Nama gedung atau lokasi" name="venue_name" required value={i.venue_name} placeholder="Contoh: Pendopo Arunika"/>
              <label className="field full"><span>Alamat lengkap <b>*</b></span><textarea name="venue_address" rows="4" maxLength="1500" required defaultValue={i.venue_address||''}/></label>
              <TextField full type="url" label="Link Google Maps" name="maps_url" value={i.maps_url} placeholder="https://maps.google.com/..."/>
              <TextField full label="Patokan terdekat" name="nearest_landmark" maxLength="240" value={i.nearest_landmark} placeholder="Contoh: 300 meter dari Gedung Sate, seberang minimarket"/>
              <label className="field full"><span>Petunjuk arah dari patokan</span><textarea name="route_directions" rows="4" maxLength="1200" defaultValue={i.route_directions||''} placeholder="Contoh: Dari Gedung Sate ambil arah timur, lurus 300 meter, lalu belok kiri setelah minimarket."/><small>Gunakan langkah singkat dan mudah diikuti.</small></label>
              <label className="field full"><span>Akses dan pilihan transportasi</span><textarea name="transportation_guide" rows="4" maxLength="1000" defaultValue={i.transportation_guide||''} placeholder="Contoh: Bisa menggunakan angkot jurusan ..., turun di ..., lalu jalan kaki 5 menit. Kendaraan pribadi dapat masuk dari gerbang timur."/><small>Jelaskan naik apa, titik turun, area parkir, atau akses transportasi online.</small></label>
            </div>
          </Card>
        </section>
        <section className="form-step" data-step="4" data-title="Cerita dan Foto"><Intro icon="✦" title="Hidupkan ceritamu" copy="Tambahkan cerita singkat dan foto pilihan. Gambar akan dikompres sebelum diunggah."/><Card><label className="field full"><span>Kisah singkat pasangan <b>*</b></span><textarea name="love_story" rows="6" maxLength="3000" required defaultValue={i.love_story||''}/><small><span data-char-count="love_story">0</span>/3000 karakter</small></label><TextField full label="Instagram pasangan (opsional)" name="instagram" value={i.instagram} placeholder="andindanisa"/></Card>
        {['verdant_vow', 'aurelia_grande'].includes(i.template_code) && (
          <div className="form-section-card upload-section verdant-couple-card" id="verdantCoupleStudio">
            <div className="upload-heading">
              <div>
                <h2>Foto Pasangan di Pelaminan 3D</h2>
                <p>Upload foto berdua tanpa background (PNG transparan).</p>
              </div>
              <span className={`custom-couple-badge ${customCoupleUrl ? 'active' : ''}`} id="vvCoupleBadge">
                {customCoupleUrl ? '✓ Foto Pasangan Aktif' : 'Default Template'}
              </span>
            </div>

            <div className="vv-upload-box">
              <label className="face-dropzone-box" id="vvCoupleDropzone">
                <input type="file" id="vvCoupleInput" accept="image/png,image/webp"/>
                <span className="face-box-icon" id="vvCoupleIcon">📸</span>
                <img id="vvCoupleThumb" className="face-dropzone-thumb" style={{ display: 'none' }} alt="Thumb Pasangan" />
                <span id="vvCoupleFileName">Upload Foto Pasangan (Wajib PNG Transparan)</span>
                <small>Format PNG transparan · Tanpa background · Maksimal 15 MB</small>
              </label>

              <div className="vv-upload-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <div style={{ fontSize: '0.85rem', color: '#555' }}>
                  Wajib foto transparan tanpa background. Belum punya? Hapus background gratis di <a href="https://www.remove.bg/" target="_blank" rel="noopener noreferrer" style={{ color: '#1d4831', fontWeight: 'bold', textDecoration: 'underline' }}>remove.bg ↗</a>
                </div>
                <div id="vvBgWarning" style={{ display: 'none', background: '#fff0f0', border: '1px solid #ffb3b3', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', color: '#c00' }}>
                  ❌ <b>Foto ditolak: Masih ada background!</b> Wajib upload PNG transparan tanpa background.
                </div>
              </div>
            </div>

            {/* STAGE CANVAS PREVIEW */}
            <div className="vv-face-preview-box">
              <div className="preview-label-row">
                <strong>Pratinjau di Panggung Pelaminan</strong>
                <small id="vvStatusText">Pilih foto atau atur posisi agar pas di panggung</small>
              </div>

              <div className="canvas-container">
                <canvas id="vvCoupleCanvas" width="600" height="750"></canvas>
              </div>

              {/* SLIDERS FOR SCALE & POSITION */}
              <div className="vv-controls-row" id="vvControlsRow">
                <div className="vv-control-item">
                  <label htmlFor="vvScaleSlider">Ukuran Foto: <span id="vvScaleVal">100%</span></label>
                  <input type="range" id="vvScaleSlider" min="50" max="160" defaultValue="100"/>
                </div>
                <div className="vv-control-item">
                  <label htmlFor="vvYSlider">Tinggi Kaki (Atas/Bawah): <span id="vvYVal">0px</span></label>
                  <input type="range" id="vvYSlider" min="-300" max="300" defaultValue="0"/>
                </div>
                <div className="vv-control-item">
                  <label htmlFor="vvXSlider">Geser Kiri/Kanan: <span id="vvXVal">0px</span></label>
                  <input type="range" id="vvXSlider" min="-300" max="300" defaultValue="0"/>
                </div>
              </div>

              <div className="vv-face-btn-row">
                <button type="button" className="button button-primary" id="vvApplyCoupleFaces" style={{ display: customCoupleUrl ? 'inline-block' : 'none' }}>
                  ✓ Pasang Foto ke Undangan
                </button>
                <button type="button" className="button button-secondary" id="vvResetCoupleFaces" style={{ display: customCoupleUrl ? 'inline-block' : 'none' }}>
                  Kembalikan ke Karakter Asli
                </button>
              </div>
            </div>
          </div>
        )}
        <UploadCard title="Foto cover" help="JPG, PNG, atau WEBP · otomatis dikompres"><label className="cover-upload"><input type="file" id="coverInput" accept="image/jpeg,image/png,image/webp"/><img id="coverThumb" src={mediaUrl(i.cover_image)} alt="Preview foto cover"/><span><b>Ganti foto cover</b><small>Gambar akan dipotong menyesuaikan desain.</small></span></label></UploadCard><UploadCard title="Foto masing-masing mempelai" help="Dipakai pada profil pria dan wanita di undangan."><div className="couple-photo-editor"><ProfileUpload id="brideInput" thumb="brideThumb" src={mediaUrl(i.bride_photo)} label="Foto wanita"/><ProfileUpload id="groomInput" thumb="groomThumb" src={mediaUrl(i.groom_photo)} label="Foto pria"/></div></UploadCard><div className="form-section-card upload-section"><div className="upload-heading"><div><h2>Galeri</h2><p>Maksimal {galleryLimit} foto sesuai paket {i.package_name}; gambar otomatis dikompres</p></div><span id="galleryCount">{galleryMedia.length}/{galleryLimit}</span></div><div className="gallery-editor" id="galleryEditor">{galleryMedia.map(photo=><figure data-media-id={photo.id} key={photo.id}><img src={mediaUrl(photo.file_path)} alt="Foto galeri" loading="lazy" decoding="async"/><button type="button" data-delete-photo={photo.id}>×</button></figure>)}<label className="gallery-add" id="galleryAdd"><input type="file" id="galleryInput" accept="image/jpeg,image/png,image/webp"/><span>＋</span><small>Tambah foto</small></label></div></div></section>
        {(hasGift||hasMusic)&&<section className="form-step" data-step="5" data-title={hasGift?'Hadiah dan Musik':'Musik'}><Intro icon="♪" title={hasGift?'Amplop digital dan musik':'Musik undangan'} copy={hasGift?'Tambahkan beberapa rekening atau e-wallet, lalu unggah musik latar undangan.':'Unggah musik latar untuk menemani tamu membuka undangan.'}/>{hasGift&&<Card><div className="upload-heading"><div><h2>Rekening hadiah</h2><p>Bisa bank maupun e-wallet, maksimal sepuluh.</p></div><button type="button" className="button button-secondary button-small" id="addGiftAccount">+ Tambah</button></div><div className="gift-account-editor" id="giftAccountEditor">{giftAccounts.map(account=><GiftRow key={account.id} account={account}/>)}</div><div className="empty-editor-note" id="giftEmpty" hidden={giftAccounts.length>0}>Belum ada rekening. Klik “Tambah” untuk membuat amplop digital.</div><button type="button" className="button button-primary" id="saveGiftAccounts">Simpan rekening</button></Card>}{hasMusic&&<UploadCard title="Musik undangan" help="MP3, M4A, OGG, atau WAV · maksimal 12 MB."><label className="music-upload-card"><input type="file" id="musicInput" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,.mp3,.m4a,.ogg,.wav"/><span className="music-upload-icon">♪</span><span><b id="musicTitle">{i.music_title||'Pilih musik dari perangkat'}</b><small>Musik diputar melalui tombol musik pada undangan.</small></span></label></UploadCard>}</section>}
        <section className="form-step" data-step="6" data-title="Daftar Tamu">
          <Intro icon="⌁" title="Buat link untuk setiap tamu" copy={personalLinksAvailable?'Nama tamu akan langsung tampil pada cover ketika link pribadinya dibuka.':'Simpan nama tamu sekarang. Link personal akan tersedia setelah undangan dipublish dan aktif.'}/>
          <Card>
            <div className="invitee-create-grid">
              <label className="field"><span>Sapaan</span><select id="inviteeSalutation">{salutations.map(v=><option key={v}>{v}</option>)}</select></label>
              <label className="field"><span>Nama tamu <b>*</b></span><input id="inviteeName" maxLength="150" placeholder="Contoh: Bapak Budi sekeluarga"/></label>
              <label className="field"><span>No. WhatsApp (opsional)</span><input id="inviteePhone" type="tel" maxLength="35" placeholder="Contoh: 081234567890"/></label>
              <button type="button" className="button button-primary" id="addInvitee">Tambah tamu</button>
            </div>

            <div className="invitee-import-bar" style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed #dce3e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <strong style={{ fontSize: '0.84rem', color: '#162e24', display: 'block' }}>Import Tamu dari Excel / CSV</strong>
                <small style={{ color: '#687771', fontSize: '0.72rem' }}>Kolom A: Nama Tamu · Kolom B: No. WhatsApp / HP</small>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button type="button" className="button button-secondary" id="btnDownloadTemplate" style={{ fontSize: '0.72rem', minHeight: '34px', padding: '0 11px' }}>
                  📄 Format Contoh
                </button>
                <label className="button button-secondary" style={{ fontSize: '0.72rem', minHeight: '34px', padding: '0 13px', cursor: 'pointer', background: '#eef5f1', borderColor: '#b6d8c7', color: '#155d37', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  📥 Upload CSV / Excel
                  <input type="file" id="inviteeFileInput" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </Card>
          <Card>
            <div className="upload-heading"><div><h2>Link undangan personal</h2><p id="inviteeCount">{invitees.length} nama tersimpan</p></div></div>
            <div className="invitee-search-bar" id="inviteeSearchBar" style={{ display: invitees.length === 0 ? 'none' : 'block' }}>
              <div className="invitee-search-input-wrap">
                <span className="search-icon">🔍</span>
                <input type="text" id="inviteeSearch" placeholder="Cari nama tamu atau nomor WhatsApp..." autoComplete="off"/>
                <button type="button" id="inviteeSearchClear" style={{ display: 'none' }} title="Hapus pencarian">×</button>
              </div>
            </div>
            <div className="invitee-bulk-bar" id="inviteeBulkBar" style={{ display: invitees.length === 0 ? 'none' : 'flex' }}>
              <label className="invitee-select-all-label">
                <input type="checkbox" id="selectAllInvitees" />
                <span id="selectAllLabel">Pilih Semua</span>
              </label>
              <div className="invitee-bulk-actions">
                <button type="button" className="btn-bulk-delete" id="btnBulkDelete" disabled>
                  🗑️ Hapus Terpilih
                </button>
              </div>
            </div>
            <div className="invitee-links-notice" id="inviteeLinksNotice" hidden={personalLinksAvailable||invitees.length===0}><strong>Link belum tersedia</strong><span>Selesaikan dan publish undangan terlebih dahulu. Setelah aktif, semua link akan memakai slug undangan pilihanmu.</span></div>
            <div className="invitee-list" id="inviteeList">{invitees.map(g=><InviteeRow key={g.id} guest={g} linkAvailable={personalLinksAvailable} appUrl={appUrl} slug={i.slug} coupleNames={coupleNames}/>)}</div>
            <div className="empty-editor-note" id="inviteeSearchEmpty" style={{ display: 'none' }}>🔍 Tidak ditemukan tamu yang cocok dengan kata kunci pencarian.</div>
            <div className="empty-editor-note" id="inviteeEmpty" hidden={invitees.length>0}>Belum ada nama tamu. Tambahkan nama untuk menyiapkan daftar undangan personal.</div>
            <div className="invitee-pagination-bar" id="inviteePaginationBar" style={{ display: invitees.length === 0 ? 'none' : 'flex' }}>
              <div className="pagination-count-label" id="inviteePaginationInfo"></div>
              <div className="pagination-buttons" id="inviteePaginationNav"></div>
            </div>
          </Card>
        </section>
        <section className="form-step" data-step="7" data-title="URL Undangan"><Intro icon="↗" title="Pilih alamat undangan" copy="Buat URL singkat yang mudah diingat dan dibagikan."/><Card><label className="field full"><span>Slug URL <b>*</b></span><div className="url-field"><span>{String(appUrl||location.origin).replace(/\/$/,'')}/</span><input name="slug" maxLength="120" defaultValue={i.slug||''} placeholder="andi-nisa" pattern="[a-z0-9-]+"/></div><small>Hanya huruf kecil, angka, dan tanda hubung.</small><small className="slug-status" id="slugStatus"/><div className="slug-suggestions" id="slugSuggestions"/></label><div className="reserved-note"><strong>Alamat yang tidak tersedia</strong><p>admin, api, assets, media, template, order, payment, edit, publish, dan success.</p></div></Card></section>
        <section className="form-step" data-step="8" data-title="Preview dan Publish"><Intro icon="✓" title="Semua siap untuk diterbitkan" copy="Periksa preview, lengkapi penanda yang belum hijau, lalu terbitkan."/><Card title="Ringkasan kesiapan"><ul id="publishChecklist">{[['couple','Data pengantin dan orang tua'],['event','Jadwal dan lokasi acara'],['story','Cerita pasangan'],['slug','URL undangan unik']].map(v=><li data-check-group={v[0]} key={v[0]}><span>{v[1]}</span><b>Periksa</b></li>)}</ul></Card><div className="builder-print-pdf-card"><span className="builder-print-pdf-icon">PDF</span><div><strong>Undangan cetak A4 · 4 halaman</strong><p>Cover, profil mempelai, jadwal acara, serta peta arah dan panduan transportasi.</p></div><button type="button" className="button button-secondary" disabled={pdfWorking} onClick={downloadPrintPdf}>{pdfWorking?'Membuat PDF...':'Download PDF'}</button></div><div className={`invitation-activation-status ${activationState}`}><span className="activation-status-icon">{activationState==='active'?'✓':activationState==='pending'?'◷':'!'}</span><div><strong>{activationTitle}</strong><p>{activationCopy}</p></div></div><div className="locked-copy"><span>🔒</span><div><strong>Teks undangan utama dikunci</strong><p>Salam pembuka, judul bagian, dan teks penutup sudah disiapkan agar tetap rapi dan konsisten.</p></div></div><div className="publish-errors" id="publishErrors" hidden/><button type="button" className="button button-primary button-wide publish-button" id="publishButton">{published?'Simpan dan Lihat Undangan':'Selesai dan Publish'}</button><small className="publish-hint">{published?'Menyimpan ulang tidak memperpanjang masa aktif undangan.':'Masa aktif dua bulan dimulai saat undangan pertama kali dipublish.'}</small></section>
      </form><div className="builder-nav"><button type="button" className="button button-secondary" id="prevStep" disabled>← Sebelumnya</button><button type="button" className="button button-primary" id="nextStep">Selanjutnya →</button></div></section>
      <aside className="builder-preview-pane" data-builder-pane="preview"><div className="preview-toolbar"><div><span>Live Preview</span><small id="previewTemplateName">{i.template_name}</small></div><button type="button" data-refresh-preview>↻</button></div><div className="device-frame"><div className="device-notch"/><iframe id="livePreview" title="Live preview undangan" src={`/template/${i.template_code}?embed=1&token=${token}`}/></div><p className="preview-tip">Perubahan form tampil langsung di sini dan disimpan otomatis.</p></aside>
    </div>
    <dialog className="publish-activation-dialog" id="publishActivationDialog"><div className="publish-activation-card"><span className="publish-activation-icon">✓</span><span className="eyebrow">Undangan berhasil diterbitkan</span><h2>Link aktif selama 2 bulan</h2><p>Masa aktif dimulai hari ini. Tamu dapat membuka undangan sampai:</p><strong className="publish-active-until" id="publishActiveUntil">-</strong><small>Tanggal berakhir ini tidak berubah saat undangan diedit ulang.</small><button className="button button-primary button-wide" id="continueAfterPublish" type="button">Lihat tautan undangan →</button></div></dialog>
    <div className="toast-region" id="toastRegion"/>
  </div>;
}

function InviteeRow({guest,linkAvailable,appUrl,slug,coupleNames}){
  const url=linkAvailable?`${String(appUrl||location.origin).replace(/\/$/,'')}/${slug}?to=${encodeURIComponent(guest.guest_name)}`:'';
  const rawPhone = guest.phone_number || (guest.guest_token?.startsWith('wa:') ? guest.guest_token.split(':')[1] : '');
  const cleanPhone = (() => {
    if (!rawPhone) return '';
    let d = String(rawPhone).replace(/\D/g, '');
    if (!d) return '';
    if (d.startsWith('6208')) d = '628' + d.slice(4);
    else if (d.startsWith('08')) d = '628' + d.slice(2);
    else if (d.startsWith('8')) d = '628' + d.slice(1);
    else if (d.startsWith('0')) d = '62' + d.slice(1);
    return d;
  })();
  const displayPhone = cleanPhone.startsWith('628') ? '0' + cleanPhone.slice(2) : cleanPhone;
  const guestName = (guest.guest_name || '').trim();
  const salut = (guest.salutation || '').trim();
  let guestTitle = guestName;
  if (salut) {
    if (guestName.toLowerCase().startsWith(salut.toLowerCase())) {
      guestTitle = guestName;
    } else {
      guestTitle = `${salut} ${guestName}`;
    }
  } else if (!/^(bapak|ibu|sdr|saudara|keluarga|dr\.|prof\.|ustadz|kak)/i.test(guestName)) {
    guestTitle = `Bapak/Ibu/Saudara/i ${guestName}`;
  }
  const couple = coupleNames?.trim() || 'Kedua Mempelai';
  const waMessage = `🕊️ *WEDDING INVITATION*
✨ *${couple}* ✨
──────────────────────────

Kepada Yth.
*${guestTitle}*

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk bersama-sama merayakan momen istimewa dan hari bahagia pernikahan kami.

💌 *Buka Tautan Undangan Digital:*
${url}

Merupakan suatu kehormatan dan kebahagiaan yang mendalam bagi kami sekeluarga apabila Anda berkenan hadir serta memberikan doa restu untuk mengawali lembaran baru ini.

Terima kasih atas segala perhatian, doa tulus, dan kasih hangat yang senantiasa menyertai. Sampai jumpa di hari bahagia kami! 🤍

──────────────────────────
_Hormat kami yang berbahagia,_
*${couple}*`;
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`;

  return (
    <article className="invitee-row" data-guest-id={guest.id} data-guest-name={guest.guest_name} data-guest-phone={cleanPhone} data-guest-salutation={guest.salutation}>
      <div className="invitee-row-header">
        <label className="invitee-checkbox-wrap" title="Pilih tamu ini">
          <input type="checkbox" className="invitee-checkbox" data-select-guest={guest.id} />
        </label>
        <div className="invitee-info">
          <strong>{guest.guest_name}</strong>
          <div className="invitee-row-meta">
            {guest.salutation && <span className="invitee-salut-badge">{guest.salutation}</span>}
            {displayPhone && <span className="invitee-phone-badge">📱 {displayPhone}</span>}
          </div>
        </div>
      </div>
      {linkAvailable ? (
        <div className="invitee-link">
          <input readOnly value={url} />
          <button type="button" data-copy-invitee>Salin</button>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-direct-wa" title="Kirim undangan via WhatsApp">
            Bagikan WA
          </a>
          <button type="button" data-delete-invitee>Hapus</button>
        </div>
      ) : (
        <div className="invitee-link invitee-link-locked">
          <span>Link tersedia setelah undangan dipublish dan aktif.</span>
          <button type="button" data-delete-invitee>Hapus</button>
        </div>
      )}
    </article>
  );
}

function Intro({icon,title,copy}){return <div className="step-intro"><span className="step-icon">{icon}</span><div><h1>{title}</h1><p>{copy}</p></div></div>}
function Card({title,children}){return <div className="form-section-card">{title&&<h2>{title}</h2>}{children}</div>}
function EventFields({title,prefix,invitation}){return <Card title={title}><div className="field-grid"><TextField full type="date" label={`Tanggal ${prefix==='akad'?'akad':'resepsi'}`} name={`${prefix}_date`} required value={invitation[`${prefix}_date`]}/><TextField type="time" label="Jam mulai" name={`${prefix}_start_time`} required value={String(invitation[`${prefix}_start_time`]||'').slice(0,5)}/><TextField type="time" label="Jam selesai" name={`${prefix}_end_time`} required value={String(invitation[`${prefix}_end_time`]||'').slice(0,5)}/></div></Card>}
function UploadCard({title,help,children}){return <div className="form-section-card upload-section"><div className="upload-heading"><div><h2>{title}</h2><p>{help}</p></div></div>{children}</div>}
function ProfileUpload({id,thumb,src,label}){return <label className="cover-upload compact-upload"><input type="file" id={id} accept="image/jpeg,image/png,image/webp"/><img id={thumb} src={src} alt={`Preview ${label}`}/><span><b>{label}</b><small>Klik untuk pilih foto.</small></span></label>}
function GiftRow({account}){return <div className="gift-account-row" data-gift-row><label className="field"><span>Bank / e-wallet</span><select data-gift-field="provider" defaultValue={account.provider}>{providers.map(v=><option key={v}>{v}</option>)}</select></label><label className="field"><span>Nomor rekening / akun</span><input data-gift-field="account_number" maxLength="100" defaultValue={account.account_number}/></label><label className="field"><span>Nama pemilik</span><input data-gift-field="account_name" maxLength="150" defaultValue={account.account_name}/></label><label className="field"><span>Label opsional</span><input data-gift-field="label" maxLength="100" defaultValue={account.label||''}/></label><button type="button" className="remove-editor-row" data-remove-gift>Hapus</button></div>}
