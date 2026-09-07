<section class="preview-showcase">
    <div class="preview-info">
        <a class="back-link" href="/#templates">← Kembali ke pilihan</a>
        <span class="category-pill"><?= e($template['category']) ?></span>
        <h1><?= e($template['name']) ?></h1>
        <p><?= e($template['description']) ?></p>
        <?php
        $features = [];
        ?>
        <ul><?php foreach ($features[$template['code']] ?? ['Komposisi premium yang responsif', 'Tipografi dan galeri dengan identitas kuat', 'Animasi halus yang nyaman'] as $feature): ?><li><?= e($feature) ?></li><?php endforeach; ?></ul>
        <a class="button button-primary" href="/order?template=<?= e($template['code']) ?>">Gunakan Template Ini</a>
    </div>
    <div class="preview-phone-wrap">
        <div class="preview-phone-label"><span>Preview interaktif</span><small>Klik “Buka Undangan” di dalam layar</small></div>
        <div class="phone-mockup preview-phone">
            <div class="phone-speaker"></div>
            <iframe class="preview-iframe" title="Preview <?= e($template['name']) ?>" src="/template/<?= e($template['code']) ?>?embed=1" loading="eager"></iframe>
        </div>
    </div>
</section>
