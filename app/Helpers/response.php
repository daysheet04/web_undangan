<?php

declare(strict_types=1);

function e($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function json_response(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function redirect(string $path, int $status = 302): void
{
    header('Location: ' . $path, true, $status);
    exit;
}

function wants_json(): bool
{
    return str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json')
        || strtolower($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'xmlhttprequest';
}

function view(string $name, array $data = [], ?string $layout = 'layouts/app'): void
{
    $viewFile = ROOT_PATH . '/app/Views/' . $name . '.php';
    if (!is_file($viewFile)) {
        throw new RuntimeException('View tidak ditemukan: ' . $name);
    }
    extract($data, EXTR_SKIP);
    if ($layout === null) {
        require $viewFile;
        return;
    }
    ob_start();
    require $viewFile;
    $content = (string) ob_get_clean();
    require ROOT_PATH . '/app/Views/' . $layout . '.php';
}

function flash(string $key, ?string $value = null): ?string
{
    if ($value !== null) {
        $_SESSION['_flash'][$key] = $value;
        return null;
    }
    $message = $_SESSION['_flash'][$key] ?? null;
    unset($_SESSION['_flash'][$key]);
    return $message;
}

function id_date(?string $value, bool $withYear = true): string
{
    if (!$value) {
        return 'Tanggal akan diumumkan';
    }
    try {
        $date = new DateTimeImmutable($value);
    } catch (Throwable $exception) {
        return 'Tanggal akan diumumkan';
    }
    $days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    $months = [1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return $days[(int) $date->format('w')] . ', ' . $date->format('j') . ' ' . $months[(int) $date->format('n')] . ($withYear ? ' ' . $date->format('Y') : '');
}

function id_time(?string $start, ?string $end): string
{
    if (!$start) {
        return 'Waktu akan diumumkan';
    }
    $result = substr($start, 0, 5);
    if ($end) {
        $result .= ' – ' . substr($end, 0, 5);
    }
    return $result . ' WIB';
}

function attendance_label(string $status): string
{
    switch ($status) {
        case 'attending':
            return 'Hadir';
        case 'not_attending':
            return 'Tidak Hadir';
        default:
            return 'Masih Ragu';
    }
}
