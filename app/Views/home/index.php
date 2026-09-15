<section class="hero">
    <div class="hero-copy">
        <span class="eyebrow">Undangan digital, dibuat dengan hati</span>
        <h1>Buat Undangan Pernikahan Digitalmu</h1>
        <p>Ceritakan hari bahagiamu lewat desain yang indah, personal, dan siap dibagikan dalam hitungan menit.</p>
        <div class="hero-actions">
            <a class="button button-primary" href="#templates">Lihat Pilihan Template</a>
            <a class="text-link" href="#cara-kerja">Pelajari cara kerja <span aria-hidden="true">→</span></a>
        </div>
        <div class="hero-trust" aria-label="Keunggulan">
            <span>✓ Live preview</span>
            <span>✓ Mudah disunting</span>
            <span>✓ Ramah ponsel</span>
        </div>
    </div>
    <div class="hero-visual" aria-label="Contoh undangan digital">
        <div class="hero-orbit orbit-one"></div>
        <div class="hero-orbit orbit-two"></div>
        <div class="phone-mockup hero-phone">
            <div class="phone-speaker"></div>
            <div class="mini-cover mini-navy">
                <div class="mini-frame">
                    <span class="mini-kicker">The Wedding of</span>
                    <strong>A <i>&amp;</i> N</strong>
                    <small>Andi &amp; Nisa</small>
                    <span class="mini-button">Buka Undangan</span>
                </div>
            </div>
        </div>
        <div class="floating-note note-one"><span>✦</span> Siap dibagikan</div>
        <div class="floating-note note-two"><span>♡</span> Personal</div>
    </div>
</section>

<section class="templates-section" id="templates">
    <div class="section-heading">
        <span class="eyebrow">Koleksi baru segera hadir</span>
        <h2>Kita sedang menyiapkan desain pertama</h2>
        <p>Template akan dibangun dan dirilis satu per satu agar setiap detailnya benar-benar matang.</p>
    </div>
    <div class="template-grid">
        <?php if (!$templates): ?><div class="template-empty"><span>01</span><h3>Template pertama sedang disiapkan</h3><p>Koleksi lama sudah dikosongkan. Desain baru akan hadir di area ini.</p></div><?php endif; ?>
        <?php foreach ($templates as $index => $template): ?>
            <article class="template-card">
                <div class="template-visual visual-<?= e($template['code']) ?>">
                    <div class="collection-mini"><span><?= str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT) ?></span><i></i><small>The Wedding of</small><strong>A <em>&amp;</em> N</strong><b><?= e($template['name']) ?></b></div>
                </div>
                <div class="template-card-body">
                    <div class="template-meta"><span><?= e($template['category']) ?></span><span><?= (int) ($template['package_count'] ?? 3) ?> paket</span></div>
                    <h3><?= e($template['name']) ?></h3>
                    <p><?= e($template['description']) ?></p>
                    <?php if (!empty($template['starting_price'])): ?><p class="template-starting-price">Mulai Rp<?= e(number_format((float) $template['starting_price'], 0, ',', '.')) ?></p><?php endif; ?>
                    <div class="card-actions">
                        <a class="button button-secondary" href="/template/<?= e($template['code']) ?>">Lihat Preview</a>
                        <a class="button button-primary" href="/order?template=<?= e($template['code']) ?>">Pilih Template</a>
                    </div>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
</section>

<section class="steps-section" id="cara-kerja">
    <div class="section-heading">
        <span class="eyebrow">Sederhana dari awal sampai tayang</span>
        <h2>Tiga langkah menuju undanganmu</h2>
    </div>
    <div class="steps-grid">
        <article><span class="step-number">01</span><div><h3>Pilih nuansa</h3><p>Tentukan template yang paling mewakili hari bahagiamu.</p></div></article>
        <article><span class="step-number">02</span><div><h3>Isi ceritamu</h3><p>Tambahkan data acara, cerita, dan foto sambil melihat hasilnya langsung.</p></div></article>
        <article><span class="step-number">03</span><div><h3>Terbitkan &amp; bagikan</h3><p>Dapatkan tautan personal dan kirimkan kepada orang-orang tersayang.</p></div></article>
    </div>
</section>

<section class="home-cta">
    <div>
        <span class="eyebrow">Hari istimewamu layak dikenang</span>
        <h2>Mulai ciptakan undangan yang bercerita.</h2>
    </div>
    <a class="button button-light" href="#templates">Pilih Template</a>
</section>

<footer class="site-footer">
    <a class="brand brand-light" href="/"><img class="brand-logo" src="<?= e(asset('images/brand/daymoment-mark.svg')) ?>" alt=""><span class="brand-copy"><strong>Daymoment</strong><small>by Daysheet Group</small></span></a>
    <p>Dibuat untuk merayakan cerita yang tumbuh menjadi selamanya.</p>
    <small>© <?= date('Y') ?> Daymoment by Daysheet Group. Semua hak dilindungi.</small>
</footer>
