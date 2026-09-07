<?php

declare(strict_types=1);

function safe_unlink_upload(?string $relativePath): void
{
    if (!$relativePath || !str_starts_with(str_replace('\\', '/', $relativePath), 'uploads/')) {
        return;
    }
    $uploadRoot = realpath(PUBLIC_PATH . '/uploads');
    $target = realpath(PUBLIC_PATH . '/' . ltrim($relativePath, '/'));
    if ($uploadRoot && $target && str_starts_with($target, $uploadRoot . DIRECTORY_SEPARATOR) && is_file($target)) {
        @unlink($target);
    }
}
