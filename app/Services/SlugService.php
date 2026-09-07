<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\InvitationRepository;

final class SlugService
{
    public const RESERVED = [
        'admin', 'api', 'assets', 'uploads', 'template', 'order', 'payment',
        'edit', 'publish', 'success',
    ];

    private $invitations;

    public function __construct(InvitationRepository $invitations)
    {
        $this->invitations = $invitations;
    }

    public function normalize(string $slug): string
    {
        $slug = strtolower(trim($slug));
        $slug = preg_replace('/\s+/', '-', $slug) ?? '';
        $slug = preg_replace('/[^a-z0-9-]/', '', $slug) ?? '';
        $slug = preg_replace('/-+/', '-', $slug) ?? '';
        return trim(substr($slug, 0, 120), '-');
    }

    public function error(string $slug, ?int $exceptId = null): ?string
    {
        if ($slug === '') {
            return 'URL undangan wajib diisi.';
        }
        if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
            return 'Gunakan huruf kecil, angka, dan tanda hubung saja.';
        }
        if (in_array($slug, self::RESERVED, true)) {
            return 'URL tersebut dipakai oleh sistem.';
        }
        if (!$this->invitations->isSlugAvailable($slug, $exceptId)) {
            return 'URL tersebut sudah digunakan.';
        }
        return null;
    }

    public function suggestions(string $slug, ?int $exceptId = null, int $count = 3): array
    {
        $base = $this->normalize($slug) ?: 'undangan';
        if (in_array($base, self::RESERVED, true)) {
            $base .= '-kami';
        }
        $result = [];
        for ($number = 2; count($result) < $count && $number < 100; $number++) {
            $candidate = substr($base, 0, 115) . '-' . $number;
            if ($this->invitations->isSlugAvailable($candidate, $exceptId)) {
                $result[] = $candidate;
            }
        }
        return $result;
    }
}
