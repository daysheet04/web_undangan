<section class="flow-page payment-flow">
    <a class="back-link" href="/">← Kembali ke beranda</a>
    <div class="payment-card">
        <div class="payment-icon" aria-hidden="true">
            <svg viewBox="0 0 64 64"><rect x="8" y="15" width="48" height="36" rx="8"/><path d="M8 26h48M18 40h12"/></svg>
        </div>
        <span class="status-badge pending"><i></i> Menunggu Pembayaran</span>
        <h1>Ordermu sudah dibuat</h1>
        <p>Payment gateway belum tersedia. Untuk mencoba seluruh alur, lanjutkan menggunakan Mode Demo.</p>
        <dl class="order-details">
            <div><dt>Kode order</dt><dd><?= e($order['order_code']) ?></dd></div>
            <div><dt>Nama pemesan</dt><dd><?= e($order['customer_name']) ?></dd></div>
            <div><dt>Template</dt><dd><?= e($order['template_name']) ?></dd></div>
            <div><dt>Status pembayaran</dt><dd><?= e(ucfirst($payment['status'] ?? 'pending')) ?></dd></div>
        </dl>
        <div class="demo-note"><strong>Mode demonstrasi</strong><span>Tidak ada tagihan atau transaksi yang dibuat.</span></div>
        <form method="post" action="/payment/<?= e($order['order_code']) ?>/demo">
            <?= csrf_field() ?>
            <button class="button button-primary button-wide" type="submit">Lanjutkan ke Editor — Mode Demo</button>
        </form>
        <small class="secure-note">🔒 Token editor pribadi dibuat otomatis dan aman.</small>
    </div>
</section>

