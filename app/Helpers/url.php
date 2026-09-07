<?php

declare(strict_types=1);

function base_url(string $path = ''): string
{
    $base = rtrim((string) (app_config('app')['base_url'] ?? ''), '/');
    return $base . '/' . ltrim($path, '/');
}

function asset(string $path): string
{
    return '/assets/' . ltrim($path, '/');
}

function upload_url(?string $path): string
{
    if (!$path) {
        return asset('images/templates/placeholder-couple.svg');
    }
    return '/' . ltrim(str_replace('\\', '/', $path), '/');
}

function current_path(): string
{
    return parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
}

