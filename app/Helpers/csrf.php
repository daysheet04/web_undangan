<?php

declare(strict_types=1);

function csrf_token(): string
{
    if (empty($_SESSION['_csrf'])) {
        $_SESSION['_csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['_csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="_csrf" value="' . e(csrf_token()) . '">';
}

function verify_csrf(?string $token = null): void
{
    if ($token === null) {
        $token = $_POST['_csrf'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    }
    if (!is_string($token) || !hash_equals($_SESSION['_csrf'] ?? '', $token)) {
        if (wants_json()) {
            json_response(['ok' => false, 'message' => 'Sesi keamanan kedaluwarsa. Muat ulang halaman.'], 419);
        }
        http_response_code(419);
        exit('Sesi keamanan kedaluwarsa. Silakan kembali dan muat ulang halaman.');
    }
}
