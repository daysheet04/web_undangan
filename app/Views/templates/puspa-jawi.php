<?php
$groom = $invitation['groom_nickname'] ?: 'Andi';
$bride = $invitation['bride_nickname'] ?: 'Nisa';
$coverPhoto = upload_url($invitation['cover_image']);
$bridePhoto = !empty($invitation['bride_photo']) ? upload_url($invitation['bride_photo']) : (!empty($media[0]['file_path']) ? upload_url($media[0]['file_path']) : $coverPhoto);
$groomPhoto = !empty($invitation['groom_photo']) ? upload_url($invitation['groom_photo']) : (!empty($media[1]['file_path']) ? upload_url($media[1]['file_path']) : $coverPhoto);
$giftAccounts = $giftAccounts ?? [];
$guestSalutation = $guestSalutation ?? 'Kepada Yth.';
$eventDate = $invitation['reception_date'] ?: date('Y-m-d', strtotime('+45 days'));
$eventTime = substr($invitation['reception_start_time'] ?: '11:00', 0, 5);
$calendarStart = str_replace('-', '', $eventDate) . 'T' . str_replace(':', '', $eventTime) . '00';
$calendarUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' . rawurlencode('Pernikahan ' . $groom . ' & ' . $bride) . '&dates=' . $calendarStart . '/' . $calendarStart . '&location=' . rawurlencode((string) ($invitation['venue_name'] ?? ''));
$assetRoot = 'images/templates/puspa-jawi/';
?>
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#6B3B4C">
    <meta name="description" content="Undangan pernikahan <?= e($groom . ' dan ' . $bride) ?> di Temuara.">
    <title><?= e($groom . ' & ' . $bride) ?> — Puspa Jawi</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Italianno&family=Marcellus&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?= e(asset('css/templates/base.css')) ?>?v=20260829c">
    <link rel="stylesheet" href="<?= e(asset('css/templates/puspa-jawi.css')) ?>?v=20260829j">
</head>
<body class="<?= $embed ? 'embed-preview' : '' ?>">
<svg class="jawi-symbols" aria-hidden="true"><defs>
    <symbol id="jawi-arrow" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5"/></symbol>
    <symbol id="jawi-map" viewBox="0 0 24 24"><path d="M12 21s6-5.4 6-12A6 6 0 0 0 6 9c0 6.6 6 12 6 12Z"/><circle cx="12" cy="9" r="2"/></symbol>
    <symbol id="jawi-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></symbol>
    <symbol id="jawi-music" viewBox="0 0 24 24"><path d="M9 18V6l10-2v12M9 10l10-2"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></symbol>
  </defs></svg>

<div class="invitation-page puspa-jawi" data-template-root data-slug="<?= e($invitation['slug'] ?? '') ?>">
    <section class="opening-cover jawi-opening-cover" aria-label="Cover undangan">
        <div class="opening-scenery"></div><div class="opening-shade"></div>
        <div class="gate-panel gate-left"></div><div class="gate-panel gate-right"></div>
        <div class="opening-botanical" aria-hidden="true"><img class="decor-janur" src="<?= e(asset($assetRoot . 'janur-arch-v2.png')) ?>" alt=""><img class="decor-floral" src="<?= e(asset($assetRoot . 'floral-frame-v2.png')) ?>" alt=""></div>
        <div class="hanging-ornament hang-left" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <div class="hanging-ornament hang-right" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <div class="opening-copy" data-cover-content>
            <span class="jawi-kicker">The Wedding of</span>
            <h1><span data-live="bride_nickname"><?= e($bride) ?></span><i>&amp;</i><span data-live="groom_nickname"><?= e($groom) ?></span></h1>
            <time data-date-field="reception_date"><?= e(id_date($eventDate, false)) ?></time>
            <div class="opening-guest"><small><?= e($guestSalutation) ?></small><strong><?= e($guestName) ?></strong></div>
            <button class="jawi-button open-invitation" type="button" data-open-invitation><span>Buka Undangan</span><svg><use href="#jawi-arrow"/></svg></button>
        </div>
    </section>

    <main class="invitation-content jawi-layout">
        <aside class="jawi-stage" aria-label="Latar kisah pasangan">
            <div class="stage-parallax"></div><div class="stage-vignette"></div>
            <div class="stage-botanical" aria-hidden="true"><img class="decor-janur" src="<?= e(asset($assetRoot . 'janur-arch-v2.png')) ?>" alt=""><img class="decor-floral" src="<?= e(asset($assetRoot . 'floral-frame-v2.png')) ?>" alt=""></div>
            <div class="stage-copy"><small>The Wedding of</small><h2><span data-live="bride_nickname"><?= e($bride) ?></span><i>&amp;</i><span data-live="groom_nickname"><?= e($groom) ?></span></h2><div class="stage-guest"><span><?= e($guestSalutation) ?></span><strong><?= e($guestName) ?></strong></div></div>
            <div class="stage-petals" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        </aside>

        <div class="jawi-scroll">
            <section class="jawi-section jawi-prologue">
                <div class="section-botanical botanical-full" aria-hidden="true"><img class="decor-janur" src="<?= e(asset($assetRoot . 'janur-arch-v2.png')) ?>" alt=""><img class="decor-floral" src="<?= e(asset($assetRoot . 'floral-frame-v2.png')) ?>" alt=""></div>
                <div class="prologue-frame jawi-reveal" data-reveal="scale">
                    <span class="jawi-kicker">Pawiwahan</span>
                    <h2><span data-live="bride_nickname"><?= e($bride) ?></span> <i>&amp;</i> <span data-live="groom_nickname"><?= e($groom) ?></span></h2>
                    <div class="couple-portrait"><img src="<?= e($coverPhoto) ?>" alt="Foto pasangan"><span></span></div>
                    <p>#<?= e(preg_replace('/[^A-Za-z0-9]/', '', $bride . $groom)) ?>Forever</p>
                </div>
                <img class="floating-cloud prologue-cloud" src="<?= e(asset($assetRoot . 'cloud-line.svg')) ?>" alt="">
            </section>

            <section class="jawi-section jawi-greeting">
                <div class="greeting-floral-frame" aria-hidden="true"><img src="<?= e(asset($assetRoot . 'floral-frame-v2.png')) ?>" alt=""></div>
                <div class="greeting-cloud greeting-cloud-left" aria-hidden="true"><img src="<?= e(asset($assetRoot . 'cloud-line.svg')) ?>" alt=""></div>
                <div class="greeting-cloud greeting-cloud-right" aria-hidden="true"><img src="<?= e(asset($assetRoot . 'cloud-line.svg')) ?>" alt=""></div>
                <div class="greeting-card jawi-reveal" data-reveal="scale">
                    <div class="greeting-crest" aria-hidden="true"><span></span><img src="<?= e(asset($assetRoot . 'gunungan-line.svg')) ?>" alt=""><span></span></div>
                    <small class="greeting-eyebrow">Atas Rahmat Allah</small>
                    <h2>The Wedding</h2>
                    <div class="greeting-divider" aria-hidden="true"><i></i><b>&amp;</b><i></i></div>
                    <p class="arabic">اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ</p>
                    <p class="greeting-message">Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menjadi bagian dari hari bahagia kami.</p>
                    <span class="greeting-signature">Pawiwahan · <?= e($bride) ?> &amp; <?= e($groom) ?></span>
                </div>
            </section>

            <section class="jawi-section jawi-couple-section">
                <article class="jawi-person jawi-reveal" data-reveal="left">
                    <div class="portrait-frame bride-frame"><img src="<?= e($bridePhoto) ?>" alt="Foto mempelai wanita"><span></span></div>
                    <small>Mempelai Wanita</small><h2 data-live="bride_full_name"><?= e($invitation['bride_full_name'] ?: 'Nisa Maharani') ?></h2><p>Putri dari</p><strong><span data-live="bride_father"><?= e($invitation['bride_father'] ?: 'Bapak Firmansyah') ?></span><br>&amp; <span data-live="bride_mother"><?= e($invitation['bride_mother'] ?: 'Ibu Lestari') ?></span></strong>
                </article>
                <div class="couple-connector"><span></span><i>&amp;</i><span></span></div>
                <article class="jawi-person jawi-reveal" data-reveal="right">
                    <div class="portrait-frame groom-frame"><img src="<?= e($groomPhoto) ?>" alt="Foto mempelai pria"><span></span></div>
                    <small>Mempelai Pria</small><h2 data-live="groom_full_name"><?= e($invitation['groom_full_name'] ?: 'Andi Pratama') ?></h2><p>Putra dari</p><strong><span data-live="groom_father"><?= e($invitation['groom_father'] ?: 'Bapak Suryanto') ?></span><br>&amp; <span data-live="groom_mother"><?= e($invitation['groom_mother'] ?: 'Ibu Rahayu') ?></span></strong>
                </article>
            </section>

            <section class="jawi-section jawi-countdown-section">
                <img class="cloud-title jawi-reveal" data-reveal="ink" src="<?= e(asset($assetRoot . 'cloud-line.svg')) ?>" alt="">
                <div class="jawi-heading jawi-reveal"><small>Save the date</small><h2>Hari Yang Ditunggu</h2></div>
                <div class="countdown-wreath jawi-reveal" data-reveal="scale">
                    <img class="countdown-floral" src="<?= e(asset($assetRoot . 'floral-frame-v2.png')) ?>" alt="">
                    <img src="<?= e(asset($assetRoot . 'gunungan-line.svg')) ?>" alt="">
                    <div class="jawi-countdown countdown" data-countdown="<?= e($eventDate . 'T' . $eventTime . ':00+07:00') ?>"><div><strong data-days>00</strong><span>Hari</span></div><div><strong data-hours>00</strong><span>Jam</span></div><div><strong data-minutes>00</strong><span>Menit</span></div><div><strong data-seconds>00</strong><span>Detik</span></div></div>
                </div>
                <a class="jawi-button calendar-link jawi-reveal" href="<?= e($calendarUrl) ?>" target="_blank" rel="noopener">Tambah ke Kalender <svg><use href="#jawi-arrow"/></svg></a>
            </section>

            <section class="jawi-section jawi-events-section">
                <div class="event-ornaments" aria-hidden="true"><img class="event-cloud cloud-one" src="<?= e(asset($assetRoot . 'cloud-line.svg')) ?>" alt=""><img class="event-cloud cloud-two" src="<?= e(asset($assetRoot . 'cloud-line.svg')) ?>" alt=""><img class="event-gunungan gunungan-left" src="<?= e(asset($assetRoot . 'gunungan-line.svg')) ?>" alt=""><img class="event-gunungan gunungan-right" src="<?= e(asset($assetRoot . 'gunungan-line.svg')) ?>" alt=""></div>
                <div class="jawi-heading jawi-reveal"><small>Rangkaian Acara</small><h2>Lokasi &amp; Waktu</h2></div>
                <div class="event-date-lockup jawi-reveal" data-reveal="scale"><span><?= e(id_date($eventDate, false)) ?></span><strong><?= e(date('d', strtotime($eventDate))) ?></strong><span><?= e(date('Y', strtotime($eventDate))) ?></span></div>
                <article class="jawi-event jawi-reveal" data-reveal="left"><div class="event-icon"><span></span></div><small>Sakral &amp; khidmat</small><h3>Akad Nikah</h3><time data-date-field="akad_date"><?= e(id_date($invitation['akad_date'])) ?></time><strong data-time-range="akad"><?= e(id_time($invitation['akad_start_time'], $invitation['akad_end_time'])) ?></strong><p data-live="venue_name"><?= e($invitation['venue_name'] ?: 'Lokasi Acara') ?></p><address data-live="venue_address"><?= e($invitation['venue_address'] ?: 'Alamat lengkap akan diumumkan.') ?></address><a class="jawi-button" data-live-href="maps_url" href="<?= e($invitation['maps_url'] ?: '#') ?>" target="_blank" rel="noopener"><svg><use href="#jawi-map"/></svg> Lihat Peta</a></article>
                <article class="jawi-event reception-event jawi-reveal" data-reveal="right"><div class="event-icon"><span></span></div><small>Dengan sukacita</small><h3>Resepsi</h3><time data-date-field="reception_date"><?= e(id_date($eventDate)) ?></time><strong data-time-range="reception"><?= e(id_time($invitation['reception_start_time'], $invitation['reception_end_time'])) ?></strong><p data-live="venue_name"><?= e($invitation['venue_name'] ?: 'Lokasi Acara') ?></p><address data-live="venue_address"><?= e($invitation['venue_address'] ?: 'Alamat lengkap akan diumumkan.') ?></address><a class="jawi-button" data-live-href="maps_url" href="<?= e($invitation['maps_url'] ?: '#') ?>" target="_blank" rel="noopener"><svg><use href="#jawi-map"/></svg> Lihat Peta</a></article>
            </section>

            <section class="jawi-section jawi-story-section">
                <div class="story-gate jawi-reveal" data-reveal="ink"><div class="jawi-heading"><small>Kisah Kami</small><h2>Berawal, Bertumbuh,<br>Berlabuh</h2></div><p data-live="love_story"><?= nl2br(e($invitation['love_story'] ?: 'Berawal dari pertemuan sederhana, tumbuh menjadi persahabatan, lalu keyakinan untuk berjalan bersama.')) ?></p></div>
            </section>

            <section class="jawi-section jawi-gallery-section">
                <div class="jawi-heading jawi-reveal"><small>Potret Bahagia</small><h2>Galeri Kisah Kami</h2></div>
                <div class="jawi-gallery-track">
                    <?php if ($media): foreach ($media as $index => $photo): ?><figure class="jawi-reveal" data-reveal="<?= $index % 2 ? 'right' : 'left' ?>"><img class="gallery-image" loading="lazy" src="<?= e(upload_url($photo['file_path'])) ?>" alt="Momen pasangan <?= $index + 1 ?>"><figcaption>Kenangan <?= str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT) ?></figcaption></figure><?php endforeach; else: ?>
                        <?php foreach (['Pertemuan', 'Perjalanan', 'Selamanya'] as $index => $caption): ?><figure class="gallery-empty jawi-reveal" data-reveal="<?= $index % 2 ? 'right' : 'left' ?>"><span><?= str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT) ?></span><figcaption><?= e($caption) ?></figcaption></figure><?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </section>

            <section class="jawi-section jawi-gift-section">
                <div class="gift-emblem" aria-hidden="true"><img src="<?= e(asset($assetRoot . 'gunungan-line.svg')) ?>" alt=""><span></span></div>
                <div class="moving-clouds clouds-back" aria-hidden="true"><div><?php for ($i = 0; $i < 6; $i++): ?><img src="<?= e(asset($assetRoot . 'cloud-line.svg')) ?>" alt=""><?php endfor; ?></div></div>
                <div class="gift-inner"><div class="jawi-heading jawi-reveal"><small>Tanda Kasih</small><h2>Wedding Gift</h2><p>Doa restu Anda adalah hadiah terindah. Apabila ingin mengirimkan tanda kasih, dapat melalui rekening berikut.</p></div>
                    <?php if ($giftAccounts): ?>
                        <div class="bank-picker jawi-reveal" data-bank-picker>
                            <input class="bank-picker-toggle" type="checkbox" id="bankPickerToggle" aria-label="Tampilkan pilihan bank">
                            <label class="bank-picker-summary" for="bankPickerToggle"><span>Pilih bank / e-wallet</span><strong data-bank-label><?= e($giftAccounts[0]['provider']) ?></strong><i></i></label>
                            <div class="bank-picker-options"><?php foreach ($giftAccounts as $index => $account): ?><button type="button" data-bank-value="<?= $index ?>" aria-pressed="<?= $index === 0 ? 'true' : 'false' ?>"><span><?= e($account['provider']) ?></span><?php if ($account['label']): ?><small><?= e($account['label']) ?></small><?php endif; ?></button><?php endforeach; ?></div>
                        </div>
                        <div class="gift-bank-stack">
                            <?php foreach ($giftAccounts as $index => $account): ?>
                                <div class="bank-card jawi-reveal" data-reveal="scale" data-gift-account-card="<?= $index ?>" <?= $index ? 'hidden' : '' ?>><span class="bank-chip"></span><small><?= e($account['provider']) ?></small><strong data-account-number><?= e($account['account_number']) ?></strong><p>a.n. <?= e($account['account_name']) ?></p><?php if ($account['label']): ?><em><?= e($account['label']) ?></em><?php endif; ?><button type="button" data-copy-account><svg><use href="#jawi-copy"/></svg> Salin Nomor</button></div>
                            <?php endforeach; ?>
                        </div>
                    <?php else: ?>
                        <div class="gift-empty jawi-reveal">Informasi amplop digital belum ditambahkan.</div>
                    <?php endif; ?>
                </div>
                <div class="moving-clouds clouds-front" aria-hidden="true"><div><?php for ($i = 0; $i < 6; $i++): ?><img src="<?= e(asset($assetRoot . 'cloud-line.svg')) ?>" alt=""><?php endfor; ?></div></div>
            </section>

            <section class="jawi-section jawi-rsvp-section" id="rsvp">
                <div class="rsvp-ornament rsvp-ornament-left" aria-hidden="true"><img src="<?= e(asset($assetRoot . 'cloud-line.svg')) ?>" alt=""></div>
                <div class="rsvp-ornament rsvp-ornament-right" aria-hidden="true"><img src="<?= e(asset($assetRoot . 'cloud-line.svg')) ?>" alt=""></div>
                <div class="rsvp-shell">
                <div class="rsvp-emblem" aria-hidden="true"><img src="<?= e(asset($assetRoot . 'gunungan-line.svg')) ?>" alt=""></div>
                <div class="jawi-heading jawi-reveal"><small>Ucapan &amp; Harapan</small><h2>Turut Berbahagia</h2></div>
                <?php if ($isPreview): ?><p class="preview-form-badge">Mode preview — form tidak mengirim data</p><?php endif; ?>
                <form class="greeting-form jawi-form jawi-reveal" <?= $isPreview ? 'data-preview-form' : 'data-greeting-form' ?>><input type="hidden" name="_csrf" value="<?= e($csrf) ?>"><input type="hidden" name="slug" value="<?= e($invitation['slug']) ?>"><label><span>Nama</span><input name="guest_name" maxlength="120" required value="<?= e($guestName !== 'Bapak/Ibu/Saudara/i' ? $guestName : '') ?>" placeholder="Nama Anda"></label><div class="form-split"><div class="jawi-custom-select form-choice" data-custom-select><span class="choice-caption">Jumlah tamu</span><input type="hidden" name="guest_count" value="1"><button type="button" class="choice-trigger" data-choice-trigger aria-haspopup="listbox" aria-expanded="false"><span data-choice-label>1 Orang</span><i></i></button><div class="choice-options" data-choice-options role="listbox" hidden><?php for ($i = 1; $i <= 4; $i++): ?><button type="button" role="option" data-choice-value="<?= $i ?>" aria-selected="<?= $i === 1 ? 'true' : 'false' ?>"><?= $i ?> Orang</button><?php endfor; ?></div></div><div class="jawi-custom-select form-choice" data-custom-select><span class="choice-caption">Kehadiran</span><input type="hidden" name="attendance_status" value=""><button type="button" class="choice-trigger" data-choice-trigger aria-haspopup="listbox" aria-expanded="false"><span data-choice-label>Pilih kehadiran</span><i></i></button><div class="choice-options" data-choice-options role="listbox" hidden><button type="button" role="option" data-choice-value="attending">Hadir</button><button type="button" role="option" data-choice-value="not_attending">Tidak Hadir</button><button type="button" role="option" data-choice-value="unsure">Masih Ragu</button></div></div></div><label><span>Ucapan &amp; Doa</span><textarea name="message" maxlength="500" required placeholder="Tuliskan doa hangat..."></textarea><small><span data-message-count>0</span>/500</small></label><button class="jawi-button" type="submit">Kirim Ucapan <svg><use href="#jawi-arrow"/></svg></button><p class="form-feedback" data-form-feedback aria-live="polite"></p></form>
                <div class="greeting-list jawi-wishes" data-greeting-list><?php if ($greetings): foreach ($greetings as $greeting): ?><article class="greeting-item"><div class="greeting-head"><strong><?= e($greeting['guest_name']) ?></strong><small><?= e(attendance_label($greeting['attendance_status'])) ?></small></div><p><?= e($greeting['message']) ?></p></article><?php endforeach; else: ?><div class="greeting-empty" data-empty-greeting>Belum ada ucapan. Jadilah yang pertama mengirimkan doa hangat.</div><?php endif; ?></div>
                </div>
            </section>

            <section class="jawi-section jawi-closing-section">
                <div class="section-botanical botanical-full botanical-closing" aria-hidden="true"><img class="decor-janur" src="<?= e(asset($assetRoot . 'janur-arch-v2.png')) ?>" alt=""><img class="decor-floral" src="<?= e(asset($assetRoot . 'floral-frame-v2.png')) ?>" alt=""></div>
                <div class="closing-gate jawi-reveal" data-reveal="scale"><small>Matur Nuwun</small><h2><span data-live="bride_nickname"><?= e($bride) ?></span><i>&amp;</i><span data-live="groom_nickname"><?= e($groom) ?></span></h2><p>Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu.</p><time data-date-field="reception_date"><?= e(id_date($eventDate, false)) ?></time><?php if (!$isPreview): ?><button class="share-button jawi-button" type="button" data-share data-share-url="<?= e(base_url($invitation['slug'])) ?>">Bagikan Undangan <svg><use href="#jawi-arrow"/></svg></button><?php endif; ?></div>
            </section>
            <footer class="template-footer jawi-footer"><div class="template-brand-lockup"><img src="<?= e(asset('images/brand/temuara-mark.svg')) ?>" alt=""><strong>Temuara</strong></div><small>by Daysheet Group</small></footer>
        </div>
    </main>
    <?php if (!empty($invitation['music_file'])): ?><audio data-wedding-audio loop preload="metadata" src="<?= e(upload_url($invitation['music_file'])) ?>"></audio><?php endif; ?>
    <button class="jawi-music" type="button" data-music-controller aria-label="Kontrol musik" aria-pressed="false" title="<?= e($invitation['music_title'] ?? 'Musik undangan') ?>"><svg><use href="#jawi-music"/></svg></button>
</div>
<script src="<?= e(asset('js/preview.js')) ?>?v=20260829c" defer></script>
<script src="<?= e(asset('js/greeting.js')) ?>?v=20260829c" defer></script>
<script src="<?= e(asset('js/templates/puspa-jawi.js')) ?>?v=20260829i" defer></script>
</body>
</html>
