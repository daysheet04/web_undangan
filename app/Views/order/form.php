<section class="flow-page">
    <a class="back-link" href="/#templates">← Kembali memilih template</a>
    <div class="flow-grid">
        <aside class="choice-summary">
            <span class="eyebrow">Template pilihanmu</span>
            <div class="summary-mini visual-<?= e($template['code']) ?>">
                <div class="collection-mini"><span>PREVIEW</span><i></i><small>The Wedding of</small><strong>A <em>&amp;</em> N</strong><b><?= e($template['name']) ?></b></div>
            </div>
            <span class="category-pill"><?= e($template['category']) ?></span>
            <h1><?= e($template['name']) ?></h1>
            <p><?= e($template['description']) ?></p>
            <a class="text-link" href="/template/<?= e($template['code']) ?>">Lihat preview penuh →</a>
        </aside>

        <div class="flow-card">
            <span class="flow-step">Langkah 1 dari 2</span>
            <h2>Siapa yang membuat undangan?</h2>
            <p>Data ini hanya untuk order dan tidak akan tampil pada undangan publik.</p>
            <form method="post" action="/order" class="stack-form" novalidate>
                <?= csrf_field() ?>
                <input type="hidden" name="template_code" value="<?= e($template['code']) ?>">
                <fieldset class="package-picker">
                    <legend>Pilih paket undangan</legend>
                    <p>Desainnya tetap sama cantiknya. Pilih kelengkapan fitur yang kamu butuhkan.</p>
                    <div class="package-options">
                        <?php $selectedPackage = $old['package_code'] ?? 'signature'; ?>
                        <?php foreach ($packages as $package): ?>
                            <label class="package-option <?= $package['code'] === 'signature' ? 'recommended' : '' ?>">
                                <input type="radio" name="package_code" value="<?= e($package['code']) ?>" <?= $selectedPackage === $package['code'] ? 'checked' : '' ?>>
                                <span class="package-card">
                                    <?php if ($package['code'] === 'signature'): ?><small class="package-badge">Paling populer</small><?php endif; ?>
                                    <span class="package-name"><strong><?= e($package['name']) ?></strong><b>Rp<?= e(number_format((float) $package['price'], 0, ',', '.')) ?></b></span>
                                    <small><?= e($package['tagline']) ?></small>
                                    <span class="package-features">
                                        <i><?= (int) $package['gallery_limit'] ?> foto momen</i>
                                        <i><?= $package['has_music'] ? 'Musik undangan' : 'Tanpa musik' ?></i>
                                        <i><?= $package['has_wishes'] ? 'Ucapan & RSVP' : 'Tanpa ucapan & RSVP' ?></i>
                                        <i><?= $package['has_gift'] ? 'Amplop digital' : 'Tanpa amplop digital' ?></i>
                                    </span>
                                </span>
                            </label>
                        <?php endforeach; ?>
                    </div>
                    <?php if (isset($errors['package_code'])): ?><small class="field-error"><?= e($errors['package_code']) ?></small><?php endif; ?>
                </fieldset>
                <label>
                    <span>Nama lengkap pemesan</span>
                    <input type="text" name="customer_name" value="<?= e($old['customer_name'] ?? '') ?>" maxlength="120" autocomplete="name" placeholder="Contoh: Dandi Pratama" required aria-describedby="customerNameError">
                    <?php if (isset($errors['customer_name'])): ?><small class="field-error" id="customerNameError"><?= e($errors['customer_name']) ?></small><?php endif; ?>
                </label>
                <label>
                    <span>Nomor HP / WhatsApp</span>
                    <input type="tel" name="customer_phone" value="<?= e($old['customer_phone'] ?? '') ?>" maxlength="24" inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxxxx atau +62xxxxxxxxxx" required aria-describedby="phoneHelp customerPhoneError">
                    <small class="field-help" id="phoneHelp">Dipakai untuk informasi order. Tidak ditampilkan ke tamu.</small>
                    <?php if (isset($errors['customer_phone'])): ?><small class="field-error" id="customerPhoneError"><?= e($errors['customer_phone']) ?></small><?php endif; ?>
                </label>
                <label class="check-label">
                    <input type="checkbox" name="agreement" value="1" required>
                    <span>Saya menyetujui data ini digunakan untuk memproses pembuatan undangan.</span>
                </label>
                <?php if (isset($errors['agreement'])): ?><small class="field-error"><?= e($errors['agreement']) ?></small><?php endif; ?>
                <button class="button button-primary button-wide" type="submit">Lanjutkan <span aria-hidden="true">→</span></button>
            </form>
        </div>
    </div>
</section>
