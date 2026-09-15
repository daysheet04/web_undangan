<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\GreetingRepository;
use App\Repositories\InvitationRepository;

final class GreetingController
{
    public function store(): void
    {
        $input = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($input)) {
            json_response(['ok' => false, 'message' => 'Format data tidak valid.'], 400);
        }
        verify_csrf((string) ($input['_csrf'] ?? ''));
        $slug = strtolower(trim((string) ($input['slug'] ?? '')));
        $invitation = (new InvitationRepository(db()))->findPublishedBySlug($slug);
        if (!$invitation) {
            json_response(['ok' => false, 'message' => 'Undangan tidak ditemukan.'], 404);
        }
        if (empty($invitation['has_wishes'])) {
            json_response(['ok' => false, 'message' => 'Fitur ucapan tidak tersedia untuk undangan ini.'], 403);
        }
        $name = text_value($input, 'guest_name', 120);
        $attendance = (string) ($input['attendance_status'] ?? '');
        $guestCount = max(1, min(10, (int) ($input['guest_count'] ?? 1)));
        $message = text_value($input, 'message', 500);
        $errors = [];
        if ($name === '') {
            $errors['guest_name'] = 'Nama wajib diisi.';
        }
        if (!in_array($attendance, ['attending', 'not_attending', 'unsure'], true)) {
            $errors['attendance_status'] = 'Pilih status kehadiran.';
        }
        if ($message === '') {
            $errors['message'] = 'Ucapan wajib diisi.';
        }
        if ($errors) {
            json_response(['ok' => false, 'message' => 'Periksa kembali form ucapan.', 'errors' => $errors], 422);
        }
        $rateKey = 'greeting_' . (int) $invitation['id'];
        $lastSubmit = (int) ($_SESSION['_rate'][$rateKey] ?? 0);
        if (time() - $lastSubmit < 10) {
            json_response(['ok' => false, 'message' => 'Tunggu beberapa detik sebelum mengirim ucapan lagi.'], 429);
        }
        $id = (new GreetingRepository(db()))->create((int) $invitation['id'], $name, $attendance, $guestCount, $message);
        $_SESSION['_rate'][$rateKey] = time();
        json_response([
            'ok' => true,
            'message' => 'Terima kasih, ucapan Anda sudah terkirim.',
            'greeting' => [
                'id' => $id,
                'guest_name' => $name,
                'attendance_status' => $attendance,
                'guest_count' => $guestCount,
                'message' => $message,
                'created_at' => 'Baru saja',
            ],
        ], 201);
    }
}
