<?php
$giftProviders = ['BCA', 'BRI', 'BNI', 'Mandiri', 'BSI', 'CIMB Niaga', 'PermataBank', 'SeaBank', 'Jago', 'GoPay', 'DANA', 'OVO', 'ShopeePay', 'Lainnya'];
?>
<div class="builder-shell" id="builderApp"
     data-token="<?= e($invitation['editor_token']) ?>"
     data-csrf="<?= e(csrf_token()) ?>"
     data-template="<?= e($invitation['template_code']) ?>">
    <div class="builder-topbar">
        <div>
            <a href="/" class="builder-brand" aria-label="Temuara by Daysheet Group, kembali ke beranda"><img class="brand-logo" src="<?= e(asset('images/brand/temuara-mark.svg')) ?>" alt=""><span class="builder-brand-copy"><strong>Temuara</strong><small>by Daysheet Group</small></span></a>
            <span class="order-label"><?= e($invitation['order_code']) ?></span>
        </div>
        <div class="save-state" id="saveState" data-state="saved"><i></i><span>Tersimpan</span></div>
        <button type="button" class="button button-secondary change-template-button" data-open-template>Ganti Template</button>
    </div>

    <div class="mobile-builder-tabs" role="tablist" aria-label="Tampilan editor">
        <button type="button" class="active" data-builder-tab="form" role="tab" aria-selected="true">Form</button>
        <button type="button" data-builder-tab="preview" role="tab" aria-selected="false">Preview</button>
    </div>

    <div class="builder-content">
        <section class="builder-form-pane" data-builder-pane="form">
            <div class="builder-progress" aria-label="Progress pengisian">
                <div class="progress-line"><span id="progressBar" style="width:11.111%"></span></div>
                <div class="progress-copy"><span id="stepCaption">Langkah 1 dari 9</span><strong id="stepTitle">Data Pengantin</strong></div>
            </div>

            <form id="invitationForm" autocomplete="off">
                <section class="form-step active" data-step="0" data-title="Data Pengantin">
                    <div class="step-intro">
                        <span class="step-icon">♡</span>
                        <div><h1>Kenalkan kedua mempelai</h1><p>Nama panggilan akan menjadi nama utama pada cover undangan.</p></div>
                    </div>
                    <div class="form-section-card">
                        <h2>Mempelai pria</h2>
                        <div class="field-grid">
                            <label class="field full"><span>Nama lengkap <b>*</b></span><input name="groom_full_name" maxlength="150" required value="<?= e($invitation['groom_full_name']) ?>" placeholder="Contoh: Andi Pratama"></label>
                            <label class="field"><span>Nama panggilan <b>*</b></span><input name="groom_nickname" maxlength="80" required value="<?= e($invitation['groom_nickname']) ?>" placeholder="Andi"></label>
                        </div>
                    </div>
                    <div class="form-section-card">
                        <h2>Mempelai wanita</h2>
                        <div class="field-grid">
                            <label class="field full"><span>Nama lengkap <b>*</b></span><input name="bride_full_name" maxlength="150" required value="<?= e($invitation['bride_full_name']) ?>" placeholder="Contoh: Nisa Maharani"></label>
                            <label class="field"><span>Nama panggilan <b>*</b></span><input name="bride_nickname" maxlength="80" required value="<?= e($invitation['bride_nickname']) ?>" placeholder="Nisa"></label>
                        </div>
                    </div>
                </section>

                <section class="form-step" data-step="1" data-title="Data Orang Tua">
                    <div class="step-intro">
                        <span class="step-icon">⌂</span>
                        <div><h1>Nama orang tua</h1><p>Lengkapi nama ayah dan ibu dari masing-masing mempelai.</p></div>
                    </div>
                    <div class="form-section-card">
                        <h2>Orang tua mempelai pria</h2>
                        <div class="field-grid">
                            <label class="field"><span>Nama ayah <b>*</b></span><input name="groom_father" maxlength="150" required value="<?= e($invitation['groom_father']) ?>" placeholder="Bapak ..."></label>
                            <label class="field"><span>Nama ibu <b>*</b></span><input name="groom_mother" maxlength="150" required value="<?= e($invitation['groom_mother']) ?>" placeholder="Ibu ..."></label>
                        </div>
                    </div>
                    <div class="form-section-card">
                        <h2>Orang tua mempelai wanita</h2>
                        <div class="field-grid">
                            <label class="field"><span>Nama ayah <b>*</b></span><input name="bride_father" maxlength="150" required value="<?= e($invitation['bride_father']) ?>" placeholder="Bapak ..."></label>
                            <label class="field"><span>Nama ibu <b>*</b></span><input name="bride_mother" maxlength="150" required value="<?= e($invitation['bride_mother']) ?>" placeholder="Ibu ..."></label>
                        </div>
                    </div>
                </section>

                <section class="form-step" data-step="2" data-title="Jadwal Acara">
                    <div class="step-intro">
                        <span class="step-icon">◫</span>
                        <div><h1>Kapan hari bahagianya?</h1><p>Isi waktu akad dan resepsi sesuai jadwal yang telah ditentukan.</p></div>
                    </div>
                    <div class="form-section-card">
                        <h2>Akad Nikah</h2>
                        <div class="field-grid">
                            <label class="field full"><span>Tanggal akad <b>*</b></span><input type="date" name="akad_date" required value="<?= e($invitation['akad_date']) ?>"></label>
                            <label class="field"><span>Jam mulai <b>*</b></span><input type="time" name="akad_start_time" required value="<?= e(substr((string) $invitation['akad_start_time'], 0, 5)) ?>"></label>
                            <label class="field"><span>Jam selesai <b>*</b></span><input type="time" name="akad_end_time" required value="<?= e(substr((string) $invitation['akad_end_time'], 0, 5)) ?>"></label>
                        </div>
                    </div>
                    <div class="form-section-card">
                        <h2>Resepsi</h2>
                        <div class="field-grid">
                            <label class="field full"><span>Tanggal resepsi <b>*</b></span><input type="date" name="reception_date" required value="<?= e($invitation['reception_date']) ?>"></label>
                            <label class="field"><span>Jam mulai <b>*</b></span><input type="time" name="reception_start_time" required value="<?= e(substr((string) $invitation['reception_start_time'], 0, 5)) ?>"></label>
                            <label class="field"><span>Jam selesai <b>*</b></span><input type="time" name="reception_end_time" required value="<?= e(substr((string) $invitation['reception_end_time'], 0, 5)) ?>"></label>
                        </div>
                    </div>
                </section>

                <section class="form-step" data-step="3" data-title="Lokasi">
                    <div class="step-intro">
                        <span class="step-icon">⌖</span>
                        <div><h1>Di mana acaranya?</h1><p>Bantu tamu menemukan lokasi dengan alamat jelas dan tautan peta.</p></div>
                    </div>
                    <div class="form-section-card">
                        <div class="field-grid">
                            <label class="field full"><span>Nama gedung atau lokasi <b>*</b></span><input name="venue_name" maxlength="180" required value="<?= e($invitation['venue_name']) ?>" placeholder="Contoh: Pendopo Arunika"></label>
                            <label class="field full"><span>Alamat lengkap <b>*</b></span><textarea name="venue_address" rows="4" maxlength="1500" required placeholder="Jalan, nomor, kelurahan, kota"><?= e($invitation['venue_address']) ?></textarea></label>
                            <label class="field full"><span>Link Google Maps</span><input type="url" name="maps_url" maxlength="500" value="<?= e($invitation['maps_url']) ?>" placeholder="https://maps.google.com/..."><small>Gunakan URL lengkap yang diawali https://</small></label>
                        </div>
                    </div>
                </section>

                <section class="form-step" data-step="4" data-title="Cerita dan Foto">
                    <div class="step-intro">
                        <span class="step-icon">✦</span>
                        <div><h1>Hidupkan ceritamu</h1><p>Tambahkan cerita singkat dan foto pilihan. Gambar akan dikompres sebelum diunggah.</p></div>
                    </div>
                    <div class="form-section-card">
                        <label class="field full"><span>Kisah singkat pasangan <b>*</b></span><textarea name="love_story" rows="6" maxlength="3000" required placeholder="Ceritakan awal pertemuan dan perjalanan kalian..."><?= e($invitation['love_story']) ?></textarea><small><span data-char-count="love_story">0</span>/3000 karakter</small></label>
                        <label class="field full"><span>Instagram pasangan (opsional)</span><div class="input-prefix"><span>@</span><input name="instagram" maxlength="100" value="<?= e($invitation['instagram']) ?>" placeholder="andindanisa"></div></label>
                    </div>
                    <div class="form-section-card upload-section">
                        <div class="upload-heading"><div><h2>Foto cover</h2><p>Maksimal 2 MB · JPG, PNG, WEBP</p></div></div>
                        <label class="cover-upload">
                            <input type="file" id="coverInput" accept="image/jpeg,image/png,image/webp">
                            <img id="coverThumb" src="<?= e(upload_url($invitation['cover_image'])) ?>" alt="Preview foto cover">
                            <span><b>Ganti foto cover</b><small>Gambar akan dipotong menyesuaikan desain.</small></span>
                        </label>
                    </div>
                    <div class="form-section-card upload-section">
                        <div class="upload-heading"><div><h2>Foto masing-masing mempelai</h2><p>Dipakai pada profil pria dan wanita di undangan.</p></div></div>
                        <div class="couple-photo-editor">
                            <label class="cover-upload compact-upload">
                                <input type="file" id="brideInput" accept="image/jpeg,image/png,image/webp">
                                <img id="brideThumb" src="<?= e(upload_url($invitation['bride_photo'])) ?>" alt="Preview foto mempelai wanita">
                                <span><b>Foto wanita</b><small>Klik untuk pilih foto.</small></span>
                            </label>
                            <label class="cover-upload compact-upload">
                                <input type="file" id="groomInput" accept="image/jpeg,image/png,image/webp">
                                <img id="groomThumb" src="<?= e(upload_url($invitation['groom_photo'])) ?>" alt="Preview foto mempelai pria">
                                <span><b>Foto pria</b><small>Klik untuk pilih foto.</small></span>
                            </label>
                        </div>
                    </div>
                    <div class="form-section-card upload-section">
                        <div class="upload-heading"><div><h2>Galeri</h2><p>Maksimal lima foto, masing-masing 2 MB</p></div><span id="galleryCount"><?= count($media) ?>/5</span></div>
                        <div class="gallery-editor" id="galleryEditor">
                            <?php foreach ($media as $photo): ?>
                                <figure data-media-id="<?= (int) $photo['id'] ?>"><img src="<?= e(upload_url($photo['file_path'])) ?>" alt="Foto galeri"><button type="button" data-delete-photo="<?= (int) $photo['id'] ?>" aria-label="Hapus foto">×</button></figure>
                            <?php endforeach; ?>
                            <label class="gallery-add" id="galleryAdd">
                                <input type="file" id="galleryInput" accept="image/jpeg,image/png,image/webp">
                                <span>＋</span><small>Tambah foto</small>
                            </label>
                        </div>
                    </div>
                </section>

                <section class="form-step" data-step="5" data-title="Hadiah dan Musik">
                    <div class="step-intro">
                        <span class="step-icon">♪</span>
                        <div><h1>Amplop digital dan musik</h1><p>Tambahkan beberapa rekening atau e-wallet, lalu unggah musik latar undangan.</p></div>
                    </div>
                    <div class="form-section-card">
                        <div class="upload-heading"><div><h2>Rekening hadiah</h2><p>Bisa bank maupun e-wallet, maksimal sepuluh.</p></div><button type="button" class="button button-secondary button-small" id="addGiftAccount">+ Tambah</button></div>
                        <div class="gift-account-editor" id="giftAccountEditor">
                            <?php foreach ($giftAccounts as $account): ?>
                                <div class="gift-account-row" data-gift-row>
                                    <label class="field"><span>Bank / e-wallet</span><select data-gift-field="provider"><?php foreach ($giftProviders as $provider): ?><option value="<?= e($provider) ?>" <?= $provider === $account['provider'] ? 'selected' : '' ?>><?= e($provider) ?></option><?php endforeach; ?></select></label>
                                    <label class="field"><span>Nomor rekening / akun</span><input data-gift-field="account_number" maxlength="100" value="<?= e($account['account_number']) ?>"></label>
                                    <label class="field"><span>Nama pemilik</span><input data-gift-field="account_name" maxlength="150" value="<?= e($account['account_name']) ?>"></label>
                                    <label class="field"><span>Label opsional</span><input data-gift-field="label" maxlength="100" value="<?= e($account['label']) ?>" placeholder="Contoh: Amplop untuk mempelai"></label>
                                    <button type="button" class="remove-editor-row" data-remove-gift>Hapus</button>
                                </div>
                            <?php endforeach; ?>
                        </div>
                        <div class="empty-editor-note" id="giftEmpty" <?= $giftAccounts ? 'hidden' : '' ?>>Belum ada rekening. Klik “Tambah” untuk membuat amplop digital.</div>
                        <button type="button" class="button button-primary" id="saveGiftAccounts">Simpan rekening</button>
                    </div>
                    <div class="form-section-card upload-section">
                        <div class="upload-heading"><div><h2>Musik undangan</h2><p>MP3, M4A, OGG, atau WAV · maksimal 12 MB.</p></div></div>
                        <label class="music-upload-card">
                            <input type="file" id="musicInput" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,.mp3,.m4a,.ogg,.wav">
                            <span class="music-upload-icon">♪</span>
                            <span><b id="musicTitle"><?= e($invitation['music_title'] ?: 'Pilih musik dari perangkat') ?></b><small>Musik diputar melalui tombol musik pada undangan.</small></span>
                        </label>
                    </div>
                </section>

                <section class="form-step" data-step="6" data-title="Daftar Tamu">
                    <div class="step-intro">
                        <span class="step-icon">⌁</span>
                        <div><h1>Buat link untuk setiap tamu</h1><p>Nama tamu akan langsung tampil pada cover ketika link pribadinya dibuka.</p></div>
                    </div>
                    <div class="form-section-card">
                        <div class="invitee-create-grid">
                            <label class="field"><span>Sapaan</span><select id="inviteeSalutation"><option>Bapak/Ibu/Saudara/i</option><option>Bapak &amp; Ibu</option><option>Saudara/i</option><option>Keluarga</option><option>Teman/Sahabat</option></select></label>
                            <label class="field"><span>Nama tamu</span><input id="inviteeName" maxlength="150" placeholder="Contoh: Bapak Budi sekeluarga"></label>
                            <button type="button" class="button button-primary" id="addInvitee">Tambah tamu</button>
                        </div>
                    </div>
                    <div class="form-section-card">
                        <div class="upload-heading"><div><h2>Link undangan personal</h2><p id="inviteeCount"><?= count($invitees) ?> nama tersimpan</p></div></div>
                        <div class="invitee-list" id="inviteeList">
                            <?php foreach ($invitees as $guest): ?>
                                <article class="invitee-row" data-guest-id="<?= (int) $guest['id'] ?>" data-guest-name="<?= e($guest['guest_name']) ?>">
                                    <div><strong><?= e($guest['guest_name']) ?></strong><small><?= e($guest['salutation']) ?></small></div>
                                    <div class="invitee-link"><input readonly value="<?= e(base_url(($invitation['slug'] ?: 'preview-undangan') . '?to=' . rawurlencode($guest['guest_name']))) ?>"><button type="button" data-copy-invitee>Salin</button><button type="button" data-delete-invitee>Hapus</button></div>
                                </article>
                            <?php endforeach; ?>
                        </div>
                        <div class="empty-editor-note" id="inviteeEmpty" <?= $invitees ? 'hidden' : '' ?>>Belum ada nama tamu. Tambahkan nama untuk mendapatkan link personal.</div>
                    </div>
                </section>

                <section class="form-step" data-step="7" data-title="URL Undangan">
                    <div class="step-intro">
                        <span class="step-icon">↗</span>
                        <div><h1>Pilih alamat undangan</h1><p>Buat URL singkat yang mudah diingat dan dibagikan.</p></div>
                    </div>
                    <div class="form-section-card">
                        <label class="field full"><span>Slug URL <b>*</b></span>
                            <div class="url-field"><span><?= e(rtrim((string) (app_config('app')['base_url'] ?? ''), '/')) ?>/</span><input name="slug" maxlength="120" value="<?= e($invitation['slug']) ?>" placeholder="andi-nisa" pattern="[a-z0-9-]+"></div>
                            <small>Hanya huruf kecil, angka, dan tanda hubung.</small>
                            <small class="slug-status" id="slugStatus"></small>
                            <div class="slug-suggestions" id="slugSuggestions"></div>
                        </label>
                        <div class="reserved-note"><strong>Alamat yang tidak tersedia</strong><p>admin, api, assets, uploads, template, order, payment, edit, publish, dan success.</p></div>
                    </div>
                </section>

                <section class="form-step" data-step="8" data-title="Preview dan Publish">
                    <div class="step-intro">
                        <span class="step-icon">✓</span>
                        <div><h1>Semua siap untuk diterbitkan</h1><p>Periksa preview, lengkapi penanda yang belum hijau, lalu terbitkan.</p></div>
                    </div>
                    <div class="form-section-card review-card">
                        <h2>Ringkasan kesiapan</h2>
                        <ul id="publishChecklist">
                            <li data-check-group="couple"><span>Data pengantin dan orang tua</span><b>Periksa</b></li>
                            <li data-check-group="event"><span>Jadwal dan lokasi acara</span><b>Periksa</b></li>
                            <li data-check-group="story"><span>Cerita pasangan</span><b>Periksa</b></li>
                            <li data-check-group="slug"><span>URL undangan unik</span><b>Periksa</b></li>
                        </ul>
                    </div>
                    <div class="locked-copy">
                        <span>🔒</span>
                        <div><strong>Teks undangan utama dikunci</strong><p>Salam pembuka, judul bagian, dan teks penutup sudah disiapkan agar tetap rapi dan konsisten.</p></div>
                    </div>
                    <div class="publish-errors" id="publishErrors" hidden></div>
                    <button type="button" class="button button-primary button-wide publish-button" id="publishButton">Selesai dan Publish</button>
                    <small class="publish-hint">Undangan tetap dapat disunting setelah diterbitkan.</small>
                </section>
            </form>

            <div class="builder-nav">
                <button type="button" class="button button-secondary" id="prevStep" disabled>← Sebelumnya</button>
                <button type="button" class="button button-primary" id="nextStep">Selanjutnya →</button>
            </div>
        </section>

        <aside class="builder-preview-pane" data-builder-pane="preview">
            <div class="preview-toolbar">
                <div><span>Live Preview</span><small id="previewTemplateName"><?= e($invitation['template_name']) ?></small></div>
                <button type="button" data-refresh-preview aria-label="Muat ulang preview">↻</button>
            </div>
            <div class="device-frame">
                <div class="device-notch"></div>
                <iframe id="livePreview" title="Live preview undangan" src="/template/<?= e($invitation['template_code']) ?>?embed=1&amp;token=<?= e($invitation['editor_token']) ?>"></iframe>
            </div>
            <p class="preview-tip">Perubahan form tampil langsung di sini dan disimpan otomatis.</p>
        </aside>
    </div>

    <dialog class="template-dialog" id="templateDialog">
        <form method="dialog" class="dialog-card">
            <div class="dialog-heading"><div><span class="eyebrow">Ganti nuansa</span><h2>Pilih template baru</h2><p>Semua data dan foto yang sudah diisi akan tetap tersimpan.</p></div><button value="cancel" aria-label="Tutup">×</button></div>
            <div class="dialog-templates">
                <?php if (!$templates): ?><p class="dialog-empty">Belum ada template aktif. Template pertama akan muncul di sini setelah selesai dibuat.</p><?php endif; ?>
                <?php foreach ($templates as $item): ?>
                    <button type="button" class="dialog-template <?= $item['code'] === $invitation['template_code'] ? 'selected' : '' ?>" data-template-choice="<?= e($item['code']) ?>" data-template-name="<?= e($item['name']) ?>">
                        <span class="dialog-thumb thumb-<?= e($item['code']) ?>"><i><?= e(substr($item['name'], 0, 1)) ?></i></span>
                        <span><b><?= e($item['name']) ?></b><small><?= e($item['category']) ?></small></span>
                        <i class="choice-check">✓</i>
                    </button>
                <?php endforeach; ?>
            </div>
            <div class="dialog-actions"><button value="cancel" class="button button-secondary">Batal</button><button type="button" id="confirmTemplate" class="button button-primary" disabled>Gunakan Template</button></div>
        </form>
    </dialog>
</div>
