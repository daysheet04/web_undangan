<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Daymoment — Tempat kisah baik dimulai. Buat undangan pernikahan digital yang personal, indah, dan mudah dibagikan.">
    <meta name="application-name" content="Daymoment">
    <meta property="og:site_name" content="Daymoment">
    <meta property="og:title" content="<?= e($title ?? 'Daymoment — Tempat kisah baik dimulai.') ?>">
    <meta property="og:description" content="Tempat kisah baik dimulai.">
    <meta name="csrf-token" content="<?= e(csrf_token()) ?>">
    <title><?= e($title ?? 'Daymoment — Tempat kisah baik dimulai.') ?></title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="<?= e(asset('css/app.css')) ?>?v=20260829b">
    <?php foreach (($styles ?? []) as $style): ?>
        <link rel="stylesheet" href="<?= e(asset('css/' . $style)) ?>">
    <?php endforeach; ?>
</head>
<body class="<?= e($pageClass ?? '') ?>">
    <header class="site-header">
        <a class="brand" href="/" aria-label="Daymoment, kembali ke beranda">
            <img class="brand-logo" src="<?= e(asset('images/brand/daymoment-mark.svg')) ?>" alt="">
            <span class="brand-copy"><strong>Daymoment</strong><small>by Daysheet Group</small></span>
        </a>
        <nav aria-label="Navigasi utama">
            <a href="/#templates">Template</a>
            <a href="/#cara-kerja">Cara kerja</a>
        </nav>
    </header>

    <?php if ($message = flash('error')): ?>
        <div class="notice notice-error" role="alert"><?= e($message) ?></div>
    <?php endif; ?>

    <main><?= $content ?></main>
    <div class="toast-region" id="toastRegion" aria-live="polite" aria-atomic="true"></div>
    <script src="<?= e(asset('js/app.js')) ?>" defer></script>
    <?php foreach (($scripts ?? []) as $script): ?>
        <script src="<?= e(asset('js/' . $script)) ?>" defer></script>
    <?php endforeach; ?>
</body>
</html>
