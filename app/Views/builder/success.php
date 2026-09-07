<section class="success-wrap">
    <div class="success-column">
    <div class="success-card">
        <div class="success-check" aria-hidden="true">✓</div>
        <span class="eyebrow">Undanganmu sudah tayang</span>
        <h1>Selamat, undangan berhasil diterbitkan!</h1>
        <p>Salin tautan di bawah lalu bagikan kepada keluarga dan sahabat.</p>
        <div class="url-copy">
            <span id="publicUrl"><?= e($publicUrl) ?></span>
            <button type="button" data-copy="<?= e($publicUrl) ?>">Salin URL</button>
        </div>
        <div class="success-actions">
            <a class="button button-primary" href="/<?= e($invitation['slug']) ?>" target="_blank" rel="noopener">Buka Undangan</a>
            <a class="button button-secondary" href="/edit/<?= e($invitation['editor_token']) ?>">Kembali ke Editor</a>
        </div>
        <div class="private-warning">
            <strong>Jaga tautan editor tetap pribadi</strong>
            <p>Siapa pun yang memiliki tautan ini dapat menyunting undanganmu.</p>
            <div class="private-url"><span><?= e($editorUrl) ?></span><button type="button" data-copy="<?= e($editorUrl) ?>">Salin</button></div>
        </div>
    </div>
    <section class="guest-links-card" aria-labelledby="guestLinksTitle">
        <div class="guest-links-heading">
            <div>
                <span class="eyebrow">Tautan personal tamu</span>
                <h2 id="guestLinksTitle">Bagikan undangan satu per satu</h2>
                <p>Setiap tautan akan menampilkan nama tamu yang dituju.</p>
            </div>
            <strong><?= (int) $guestTotal ?> tamu</strong>
        </div>

        <?php if ($invitees): ?>
            <div class="guest-link-list">
                <?php foreach ($invitees as $guest): ?>
                    <?php $guestUrl = $publicUrl . '?to=' . rawurlencode((string) $guest['guest_name']); ?>
                    <article class="guest-link-row">
                        <div class="guest-link-identity">
                            <strong><?= e($guest['guest_name']) ?></strong>
                            <small><?= e($guest['salutation']) ?></small>
                        </div>
                        <span class="guest-personal-url" title="<?= e($guestUrl) ?>"><?= e($guestUrl) ?></span>
                        <button type="button" data-copy="<?= e($guestUrl) ?>">Salin</button>
                        <a href="<?= e($guestUrl) ?>" target="_blank" rel="noopener" aria-label="Buka undangan untuk <?= e($guest['guest_name']) ?>">Buka</a>
                    </article>
                <?php endforeach; ?>
            </div>

            <?php if ($guestPages > 1): ?>
                <?php
                $pageStart = max(1, $guestPage - 2);
                $pageEnd = min($guestPages, $guestPage + 2);
                if ($pageEnd - $pageStart < 4) {
                    $pageStart = max(1, $pageEnd - 4);
                    $pageEnd = min($guestPages, $pageStart + 4);
                }
                $successPath = '/success/' . rawurlencode((string) $invitation['editor_token']);
                ?>
                <nav class="guest-pagination" aria-label="Halaman tautan tamu">
                    <?php if ($guestPage > 1): ?><a href="<?= e($successPath) ?>?page=<?= $guestPage - 1 ?>" aria-label="Halaman sebelumnya">←</a><?php endif; ?>
                    <?php for ($page = $pageStart; $page <= $pageEnd; $page++): ?>
                        <a href="<?= e($successPath) ?>?page=<?= $page ?>" class="<?= $page === $guestPage ? 'active' : '' ?>" <?= $page === $guestPage ? 'aria-current="page"' : '' ?>><?= $page ?></a>
                    <?php endfor; ?>
                    <?php if ($guestPage < $guestPages): ?><a href="<?= e($successPath) ?>?page=<?= $guestPage + 1 ?>" aria-label="Halaman berikutnya">→</a><?php endif; ?>
                </nav>
            <?php endif; ?>
        <?php else: ?>
            <div class="guest-links-empty">Belum ada nama tamu. Tambahkan daftar tamu melalui editor untuk membuat tautan personal.</div>
        <?php endif; ?>
    </section>
    </div>
</section>
