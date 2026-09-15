<?php

declare(strict_types=1);

define('ROOT_PATH', dirname(__DIR__));
define('PUBLIC_PATH', ROOT_PATH . DIRECTORY_SEPARATOR . 'public');

if (!function_exists('str_starts_with')) {
    function str_starts_with(string $haystack, string $needle): bool
    {
        return $needle === '' || strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}

if (!function_exists('str_contains')) {
    function str_contains(string $haystack, string $needle): bool
    {
        return $needle === '' || strpos($haystack, $needle) !== false;
    }
}

$localConfig = ROOT_PATH . '/config/config.php';
$config = file_exists($localConfig)
    ? require $localConfig
    : require ROOT_PATH . '/config/config.example.php';

function app_config(?string $section = null)
{
    global $config;
    return $section === null ? $config : ($config[$section] ?? []);
}

date_default_timezone_set((string) (app_config('app')['timezone'] ?? 'Asia/Jakarta'));
$sessionPath = ROOT_PATH . '/storage/sessions';
if (!is_dir($sessionPath)) {
    @mkdir($sessionPath, 0775, true);
}
session_save_path($sessionPath);
ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
session_name('daymoment_session');
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start([
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
        'cookie_secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    ]);
}

spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $path = ROOT_PATH . '/app/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($path)) {
        require $path;
    }
});

require_once ROOT_PATH . '/config/database.php';
require_once ROOT_PATH . '/app/Helpers/csrf.php';
require_once ROOT_PATH . '/app/Helpers/response.php';
require_once ROOT_PATH . '/app/Helpers/validation.php';
require_once ROOT_PATH . '/app/Helpers/url.php';
require_once ROOT_PATH . '/app/Helpers/upload.php';

set_exception_handler(static function (Throwable $exception): void {
    $logDir = ROOT_PATH . '/storage/logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0775, true);
    }
    error_log(sprintf("[%s] %s\n%s\n", date('c'), $exception->getMessage(), $exception->getTraceAsString()), 3, $logDir . '/app.log');
    if (headers_sent()) {
        return;
    }
    http_response_code(500);
    $debug = (bool) (app_config('app')['debug'] ?? false);
    if (str_contains($_SERVER['REQUEST_URI'] ?? '', '/api/') || wants_json()) {
        json_response(['ok' => false, 'message' => $debug ? $exception->getMessage() : 'Terjadi kesalahan pada server.'], 500);
    }
    echo '<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Kesalahan</title><style>body{font-family:system-ui;background:#f7f3ee;padding:10vh 24px;color:#263238}.box{max-width:620px;margin:auto;background:#fff;padding:32px;border-radius:20px}a{color:#143156}</style><div class="box"><h1>Maaf, terjadi kesalahan.</h1><p>' . e($debug ? $exception->getMessage() : 'Silakan coba kembali beberapa saat lagi.') . '</p><a href="/">Kembali ke beranda</a></div></html>';
    exit;
});
