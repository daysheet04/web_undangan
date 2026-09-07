<?php

/**
 * Smoke test tanpa dependency.
 * Jalankan: php tests/smoke.php
 * Opsional dengan DB: php tests/smoke.php --db
 */

$root = dirname(__DIR__);
$failures = array();
$passes = 0;
$withDatabase = in_array('--db', $argv, true);

if ($withDatabase) {
    require $root . '/app/bootstrap.php';
}

function check($condition, $message)
{
    global $failures, $passes;
    if ($condition) {
        $passes++;
        echo "[OK]   {$message}\n";
        return;
    }
    $failures[] = $message;
    echo "[FAIL] {$message}\n";
}

$requiredFiles = array(
    'public/index.php',
    'public/router.php',
    'database/schema.sql',
    'database/seed.sql',
    'app/Controllers/HomeController.php',
    'app/Controllers/OrderController.php',
    'app/Controllers/PaymentController.php',
    'app/Controllers/BuilderController.php',
    'app/Controllers/InvitationController.php',
    'app/Controllers/GreetingController.php',
    'app/Views/templates/elegant-navy.php',
    'app/Views/templates/soft-garden.php',
    'app/Views/templates/javanese-heritage.php',
    'public/assets/js/builder.js',
    'public/assets/js/preview.js',
    'public/assets/js/greeting.js',
    'public/assets/images/brand/temuara-mark.svg',
    'public/favicon.svg',
    'public/uploads/.htaccess',
);

foreach ($requiredFiles as $file) {
    check(is_file($root . '/' . $file), "File tersedia: {$file}");
}

$schema = file_get_contents($root . '/database/schema.sql');
foreach (array('templates', 'orders', 'invitations', 'invitation_media', 'guest_messages', 'payments') as $table) {
    check(stripos($schema, "CREATE TABLE {$table}") !== false, "Tabel {$table} didefinisikan");
}
check(substr_count(strtoupper($schema), 'ENGINE=INNODB') === 6, 'Semua tabel memakai InnoDB');
check(stripos($schema, 'DEFAULT CHARSET=utf8mb4') !== false, 'Schema memakai utf8mb4');
check(stripos($schema, 'UNIQUE KEY uq_invitations_slug') !== false, 'Slug memiliki unique index');
check(substr_count(strtoupper($schema), 'ON DELETE CASCADE') >= 4, 'Foreign key turunan memakai cascade yang aman');

$seed = file_get_contents($root . '/database/seed.sql');
foreach (array('elegant_navy', 'soft_garden', 'javanese_heritage') as $code) {
    check(strpos($seed, $code) !== false, "Seed template {$code} tersedia");
}

$router = file_get_contents($root . '/public/index.php');
$routes = array(
    '/template/', '/order', '/payment/', '/edit/', '/api/invitation/autosave',
    '/api/invitation/upload', '/api/invitation/delete-photo',
    '/api/invitation/change-template', '/publish', '/success/', '/api/greetings',
);
foreach ($routes as $route) {
    check(strpos($router, $route) !== false, "Route tersedia: {$route}");
}
$greetingPosition = strpos($router, '/api/greetings');
$slugPosition = strpos($router, 'Route slug publik');
check($greetingPosition !== false && $slugPosition !== false && $slugPosition > $greetingPosition, 'Route slug publik diproses paling akhir');

$builder = file_get_contents($root . '/public/assets/js/builder.js');
check(strpos($builder, "type: 'invitation:update'") !== false, 'Live preview memakai postMessage');
check(strpos($builder, '1000') !== false && strpos($builder, 'autosave') !== false, 'Autosave memakai debounce satu detik');
check(strpos($builder, '1600') !== false && strpos($builder, 'canvas') !== false, 'Kompresi Canvas membatasi dimensi 1600px');

$upload = file_get_contents($root . '/app/Services/UploadService.php');
check(strpos($upload, 'FILEINFO_MIME_TYPE') !== false, 'Upload memvalidasi MIME dengan fileinfo');
check(strpos($upload, 'getimagesize') !== false, 'Upload memverifikasi isi gambar');
check(strpos($upload, 'random_bytes') !== false, 'Nama upload dibuat acak');

$views = '';
foreach (glob($root . '/app/Views/templates/*.php') as $view) {
    $views .= file_get_contents($view);
}
check(strpos($views, 'customer_phone') === false, 'Nomor HP tidak dirender di template publik');
check(strpos($views, 'editor_token') === false, 'Token editor tidak dirender di template publik');
check(stripos($views, 'lorem ipsum') === false, 'Tidak ada lorem ipsum');

$branding = file_get_contents($root . '/README.md')
    . file_get_contents($root . '/app/bootstrap.php')
    . file_get_contents($root . '/app/Views/layouts/app.php')
    . file_get_contents($root . '/app/Views/home/index.php')
    . file_get_contents($root . '/app/Views/builder/edit.php')
    . $views;
foreach (glob($root . '/app/Controllers/*.php') as $controller) {
    $branding .= file_get_contents($controller);
}
check(stripos($branding, 'Janji' . 'Kita') === false, 'Brand lama tidak tersisa pada tampilan dan metadata');
check(substr_count($branding, 'Temuara') >= 10, 'Brand Temuara diterapkan konsisten');
check(substr_count($branding, 'Tempat kisah baik dimulai.') >= 5, 'Tagline Temuara tersedia pada halaman utama dan publik');
$brandLogo = file_get_contents($root . '/public/assets/images/brand/temuara-mark.svg');
check(strpos($brandLogo, '#102B4A') !== false && strpos($brandLogo, '#C9A46A') !== false, 'Logo lokal memakai warna navy dan gold');
check(substr_count($brandLogo, '<ellipse') === 2, 'Logo lokal membentuk dua elemen yang saling bertemu');

if ($withDatabase) {
    $pdo = db();
    check($pdo instanceof PDO, 'Koneksi PDO berhasil');
    $templateCount = (int) $pdo->query('SELECT COUNT(*) FROM templates WHERE is_active = 1')->fetchColumn();
    check($templateCount === 3, 'Database berisi tiga template aktif');
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    foreach (array('templates', 'orders', 'invitations', 'invitation_media', 'guest_messages', 'payments') as $table) {
        check(in_array($table, $tables, true), "Tabel database tersedia: {$table}");
    }
}

echo "\n{$passes} pemeriksaan lolos, " . count($failures) . " gagal.\n";
exit($failures ? 1 : 0);
