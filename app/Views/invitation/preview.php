<?php
$selectedPackage = 'signature';
$featureLabels = static function (array $package): array {
    return [
        (int) $package['gallery_limit'] . ' foto momen',
        !empty($package['has_music']) ? 'Musik undangan' : 'Tanpa musik',
        !empty($package['has_wishes']) ? 'Ucapan & RSVP' : 'Tanpa ucapan & RSVP',
        !empty($package['has_gift']) ? 'Amplop digital' : 'Tanpa amplop digital',
    ];
};
?>
<section class="preview-showcase" data-package-preview-root data-template-code="<?= e($template['code']) ?>">
    <div class="preview-info">
        <a class="back-link" href="/#templates">← Kembali ke pilihan</a>
        <span class="category-pill"><?= e($template['category']) ?></span>
        <h1><?= e($template['name']) ?></h1>
        <p><?= e($template['description']) ?></p>

        <div class="preview-package-heading">
            <span>Pilih pengalaman undangan</span>
            <p>Desain utama tetap sama. Fitur dan jumlah momen menyesuaikan paket.</p>
        </div>

        <div class="preview-package-grid" role="list" aria-label="Pilihan paket undangan">
            <?php foreach ($packages as $package): ?>
                <?php $isSelected = $package['code'] === $selectedPackage; ?>
                <article class="preview-package-card <?= $isSelected ? 'active' : '' ?>" data-preview-package-card="<?= e($package['code']) ?>" role="listitem">
                    <?php if ($package['code'] === 'signature'): ?><span class="preview-package-badge">Paling populer</span><?php endif; ?>
                    <div class="preview-package-name">
                        <strong><?= e($package['name']) ?></strong>
                        <b>Rp<?= e(number_format((float) $package['price'], 0, ',', '.')) ?></b>
                    </div>
                    <p><?= e($package['tagline']) ?></p>
                    <div class="package-photo-demo package-photo-demo-<?= (int) $package['gallery_limit'] ?>" aria-label="Contoh galeri <?= (int) $package['gallery_limit'] ?> foto">
                        <?php for ($photo = 1; $photo <= (int) $package['gallery_limit']; $photo++): ?><i><span><?= $photo ?></span></i><?php endfor; ?>
                    </div>
                    <ul>
                        <?php foreach ($featureLabels($package) as $feature): ?><li><?= e($feature) ?></li><?php endforeach; ?>
                    </ul>
                    <button type="button" class="button <?= $isSelected ? 'button-primary' : 'button-secondary' ?> preview-package-button"
                            data-preview-package="<?= e($package['code']) ?>"
                            data-package-name="<?= e($package['name']) ?>">
                        <?= $isSelected ? 'Sedang dilihat' : 'Lihat ' . e($package['name']) ?>
                    </button>
                </article>
            <?php endforeach; ?>
        </div>

        <a class="button button-primary preview-order-button" data-preview-order
           href="/order?template=<?= e($template['code']) ?>&amp;package=<?= e($selectedPackage) ?>">Pilih Paket Signature</a>
    </div>

    <div class="preview-phone-wrap">
        <div class="preview-phone-label"><span>Preview <b data-preview-label>Signature</b></span><small>Klik “Buka Undangan” di dalam layar</small></div>
        <div class="phone-mockup preview-phone">
            <div class="phone-speaker"></div>
            <iframe class="preview-iframe" data-package-preview-frame title="Preview <?= e($template['name']) ?> paket Signature" src="/template/<?= e($template['code']) ?>?embed=1&amp;package=<?= e($selectedPackage) ?>" loading="eager"></iframe>
        </div>
    </div>
</section>
