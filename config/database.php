<?php

declare(strict_types=1);

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $cfg = app_config('database');
    $envHost = getenv('DB_HOST');
    $envPort = getenv('DB_PORT');
    $envName = getenv('DB_NAME');
    $envUser = getenv('DB_USERNAME');
    $envPassword = getenv('DB_PASSWORD');
    if ($envHost !== false && $envHost !== '') {
        $cfg['host'] = $envHost;
    }
    if ($envPort !== false && $envPort !== '') {
        $cfg['port'] = (int) $envPort;
    }
    if ($envName !== false && $envName !== '') {
        $cfg['name'] = $envName;
    }
    if ($envUser !== false && $envUser !== '') {
        $cfg['username'] = $envUser;
    }
    if ($envPassword !== false) {
        $cfg['password'] = $envPassword;
    }
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $cfg['host'],
        $cfg['port'],
        $cfg['name'],
        $cfg['charset'] ?? 'utf8mb4'
    );

    $pdo = new PDO($dsn, $cfg['username'], $cfg['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
    ]);

    return $pdo;
}
