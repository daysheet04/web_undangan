<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\InvitationRepository;

final class InvitationService
{
    private const LIMITS = [
        'slug' => 120,
        'groom_full_name' => 150,
        'groom_nickname' => 80,
        'groom_father' => 150,
        'groom_mother' => 150,
        'bride_full_name' => 150,
        'bride_nickname' => 80,
        'bride_father' => 150,
        'bride_mother' => 150,
        'venue_name' => 180,
        'venue_address' => 1500,
        'maps_url' => 500,
        'love_story' => 3000,
        'instagram' => 100,
    ];

    private const DATE_FIELDS = ['akad_date', 'reception_date'];
    private const TIME_FIELDS = ['akad_start_time', 'akad_end_time', 'reception_start_time', 'reception_end_time'];

    private $invitations;
    private $slugs;

    public function __construct(
        InvitationRepository $invitations,
        SlugService $slugs
    ) {
        $this->invitations = $invitations;
        $this->slugs = $slugs;
    }

    public function sanitize(array $input, bool $includeSlug = true): array
    {
        $clean = [];
        foreach (self::LIMITS as $field => $limit) {
            if (!$includeSlug && $field === 'slug') {
                continue;
            }
            if (array_key_exists($field, $input)) {
                $clean[$field] = mb_substr(trim((string) $input[$field]), 0, $limit);
            }
        }
        foreach (self::DATE_FIELDS as $field) {
            if (array_key_exists($field, $input)) {
                $value = trim((string) $input[$field]);
                $clean[$field] = $value === '' || !valid_date_string($value) ? null : $value;
            }
        }
        foreach (self::TIME_FIELDS as $field) {
            if (array_key_exists($field, $input)) {
                $value = substr(trim((string) $input[$field]), 0, 5);
                $clean[$field] = $value === '' || !valid_time_string($value) ? null : $value;
            }
        }
        if (isset($clean['instagram'])) {
            $clean['instagram'] = ltrim($clean['instagram'], '@');
        }
        return $clean;
    }

    public function autosave(array $invitation, array $input): array
    {
        $clean = $this->sanitize($input, false);
        $slugInput = trim((string) ($input['slug'] ?? ''));
        $slug = $this->slugs->normalize($slugInput);
        $slugError = $slugInput === '' ? null : $this->slugs->error($slug, (int) $invitation['id']);
        if ($slugInput === '') {
            $clean['slug'] = null;
        } elseif ($slugError === null) {
            $clean['slug'] = $slug;
        }
        $this->invitations->update((int) $invitation['id'], $clean);
        return [
            'saved' => $clean,
            'slug' => $slug,
            'slug_available' => $slugInput !== '' && $slugError === null,
            'slug_message' => $slugError,
            'slug_suggestions' => $slugError ? $this->slugs->suggestions($slug, (int) $invitation['id']) : [],
        ];
    }

    public function validateForPublish(array $invitation, array $input): array
    {
        $clean = $this->sanitize($input);
        $required = [
            'groom_full_name' => 'Nama lengkap mempelai pria',
            'groom_nickname' => 'Nama panggilan mempelai pria',
            'groom_father' => 'Nama ayah mempelai pria',
            'groom_mother' => 'Nama ibu mempelai pria',
            'bride_full_name' => 'Nama lengkap mempelai wanita',
            'bride_nickname' => 'Nama panggilan mempelai wanita',
            'bride_father' => 'Nama ayah mempelai wanita',
            'bride_mother' => 'Nama ibu mempelai wanita',
            'akad_date' => 'Tanggal akad',
            'akad_start_time' => 'Jam mulai akad',
            'akad_end_time' => 'Jam selesai akad',
            'reception_date' => 'Tanggal resepsi',
            'reception_start_time' => 'Jam mulai resepsi',
            'reception_end_time' => 'Jam selesai resepsi',
            'venue_name' => 'Nama lokasi',
            'venue_address' => 'Alamat lengkap',
            'love_story' => 'Cerita pasangan',
        ];
        $errors = [];
        foreach ($required as $field => $label) {
            if (empty($clean[$field])) {
                $errors[$field] = $label . ' wajib diisi.';
            }
        }
        if (!valid_http_url((string) ($clean['maps_url'] ?? ''))) {
            $errors['maps_url'] = 'Link Google Maps harus berupa URL http/https yang valid.';
        }
        $slug = $this->slugs->normalize((string) ($input['slug'] ?? ''));
        $slugError = $this->slugs->error($slug, (int) $invitation['id']);
        if ($slugError) {
            $errors['slug'] = $slugError;
        } else {
            $clean['slug'] = $slug;
        }
        return [
            'data' => $clean,
            'errors' => $errors,
            'suggestions' => isset($errors['slug']) ? $this->slugs->suggestions($slug, (int) $invitation['id']) : [],
        ];
    }
}
