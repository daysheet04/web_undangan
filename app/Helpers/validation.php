<?php

declare(strict_types=1);

function normalize_phone(string $phone): string
{
    $phone = preg_replace('/[\s.()-]+/', '', trim($phone)) ?? '';
    if (str_starts_with($phone, '08')) {
        return '+62' . substr($phone, 1);
    }
    return $phone;
}

function valid_indonesian_phone(string $phone): bool
{
    return (bool) preg_match('/^(?:\+62|0)8[1-9][0-9]{7,11}$/', preg_replace('/[\s.()-]+/', '', $phone) ?? '');
}

function text_value(array $source, string $key, int $max = 255): string
{
    $value = trim((string) ($source[$key] ?? ''));
    return mb_substr($value, 0, $max);
}

function valid_date_string(?string $value): bool
{
    if (!$value) {
        return false;
    }
    $date = DateTime::createFromFormat('Y-m-d', $value);
    return $date !== false && $date->format('Y-m-d') === $value;
}

function valid_time_string(?string $value): bool
{
    return $value !== null && (bool) preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/', $value);
}

function valid_http_url(string $value): bool
{
    if ($value === '') {
        return true;
    }
    if (!filter_var($value, FILTER_VALIDATE_URL)) {
        return false;
    }
    return in_array(strtolower((string) parse_url($value, PHP_URL_SCHEME)), ['http', 'https'], true);
}

