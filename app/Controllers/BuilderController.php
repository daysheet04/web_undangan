<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\GiftAccountRepository;
use App\Repositories\InvitationRepository;
use App\Repositories\InviteeRepository;
use App\Repositories\OrderRepository;
use App\Repositories\TemplateRepository;
use App\Services\InvitationService;
use App\Services\SlugService;
use App\Services\UploadService;
use Throwable;

final class BuilderController
{
    public function show(string $token): void
    {
        $repo = new InvitationRepository(db());
        $invitation = $repo->findDetailedByToken($token);
        if (!$invitation) {
            http_response_code(404);
            view('errors/404', [
                'title' => 'Editor tidak ditemukan',
                'message' => 'Token editor salah atau undangan tidak tersedia.',
            ]);
            return;
        }
        if ($invitation['order_status'] === 'waiting_payment') {
            redirect('/payment/' . rawurlencode($invitation['order_code']));
        }
        view('builder/edit', [
            'title' => 'Editor Undangan — Temuara',
            'invitation' => $invitation,
            'media' => $repo->media((int) $invitation['id']),
            'giftAccounts' => (new GiftAccountRepository(db()))->all((int) $invitation['id']),
            'invitees' => (new InviteeRepository(db()))->all((int) $invitation['id']),
            'templates' => (new TemplateRepository(db()))->allActive(),
            'pageClass' => 'builder-page',
            'styles' => ['builder.css'],
            'scripts' => ['builder.js'],
        ]);
    }

    public function autosave(): void
    {
        $input = $this->jsonInput();
        verify_csrf((string) ($input['_csrf'] ?? ''));
        $invitation = $this->authorized((string) ($input['editor_token'] ?? ''));
        $repo = new InvitationRepository(db());
        $result = (new InvitationService($repo, new SlugService($repo)))->autosave($invitation, $input);
        json_response(array_merge(['ok' => true, 'message' => 'Tersimpan'], $result));
    }

    public function upload(): void
    {
        verify_csrf();
        $invitation = $this->authorized((string) ($_POST['editor_token'] ?? ''));
        $kind = (string) ($_POST['kind'] ?? '');
        if (!in_array($kind, ['cover', 'gallery', 'groom', 'bride', 'music'], true)) {
            json_response(['ok' => false, 'message' => 'Jenis berkas tidak valid.'], 422);
        }
        $repo = new InvitationRepository(db());
        $media = $repo->media((int) $invitation['id']);
        if ($kind === 'gallery' && count($media) >= 5) {
            json_response(['ok' => false, 'message' => 'Galeri maksimal lima foto.'], 422);
        }
        try {
            $upload = new UploadService();
            if ($kind === 'music') {
                $originalName = mb_substr(trim((string) ($_FILES['file']['name'] ?? 'Musik undangan')), 0, 150);
                $path = $upload->storeAudio($_FILES['file'] ?? [], (int) $invitation['id']);
                $oldPath = $invitation['music_file'] ?? null;
                $repo->update((int) $invitation['id'], ['music_file' => $path, 'music_title' => $originalName]);
                safe_unlink_upload($oldPath);
                json_response(['ok' => true, 'message' => 'Musik undangan tersimpan.', 'path' => upload_url($path), 'title' => $originalName]);
            }
            $path = $upload->store($_FILES['file'] ?? $_FILES['photo'] ?? [], (int) $invitation['id']);
            if ($kind !== 'gallery') {
                $field = ['cover' => 'cover_image', 'groom' => 'groom_photo', 'bride' => 'bride_photo'][$kind];
                $oldPath = $invitation[$field] ?? null;
                $repo->update((int) $invitation['id'], [$field => $path]);
                safe_unlink_upload($oldPath);
                $labels = ['cover' => 'Foto cover', 'groom' => 'Foto mempelai pria', 'bride' => 'Foto mempelai wanita'];
                json_response(['ok' => true, 'message' => $labels[$kind] . ' tersimpan.', 'path' => upload_url($path)]);
            }
            $id = $repo->addMedia((int) $invitation['id'], $path);
            json_response(['ok' => true, 'message' => 'Foto galeri ditambahkan.', 'media' => [
                'id' => $id,
                'file_path' => $path,
                'url' => upload_url($path),
            ]]);
        } catch (Throwable $exception) {
            json_response(['ok' => false, 'message' => $exception->getMessage()], 422);
        }
    }

    public function saveGiftAccounts(): void
    {
        $input = $this->jsonInput();
        verify_csrf((string) ($input['_csrf'] ?? ''));
        $invitation = $this->authorized((string) ($input['editor_token'] ?? ''));
        $items = is_array($input['accounts'] ?? null) ? array_slice($input['accounts'], 0, 10) : [];
        $clean = [];
        foreach ($items as $index => $item) {
            if (!is_array($item)) {
                continue;
            }
            $provider = mb_substr(trim(strip_tags((string) ($item['provider'] ?? ''))), 0, 80);
            $number = mb_substr(trim(strip_tags((string) ($item['account_number'] ?? ''))), 0, 100);
            $name = mb_substr(trim(strip_tags((string) ($item['account_name'] ?? ''))), 0, 150);
            $label = mb_substr(trim(strip_tags((string) ($item['label'] ?? ''))), 0, 100);
            if ($provider === '' || $number === '' || $name === '') {
                json_response(['ok' => false, 'message' => 'Lengkapi bank/e-wallet, nomor, dan nama pemilik pada rekening ke-' . ($index + 1) . '.'], 422);
            }
            $clean[] = [
                'provider' => $provider,
                'account_number' => $number,
                'account_name' => $name,
                'label' => $label,
            ];
        }
        (new GiftAccountRepository(db()))->replaceAll((int) $invitation['id'], $clean);
        json_response(['ok' => true, 'message' => 'Daftar rekening hadiah tersimpan.', 'accounts' => $clean]);
    }

    public function addInvitee(): void
    {
        $input = $this->jsonInput();
        verify_csrf((string) ($input['_csrf'] ?? ''));
        $invitation = $this->authorized((string) ($input['editor_token'] ?? ''));
        $repo = new InviteeRepository(db());
        if ($repo->count((int) $invitation['id']) >= 500) {
            json_response(['ok' => false, 'message' => 'Daftar tamu maksimal 500 nama.'], 422);
        }
        $name = mb_substr(trim(strip_tags((string) ($input['guest_name'] ?? ''))), 0, 150);
        $salutation = mb_substr(trim(strip_tags((string) ($input['salutation'] ?? 'Bapak/Ibu/Saudara/i'))), 0, 80);
        if ($name === '') {
            json_response(['ok' => false, 'message' => 'Nama tamu wajib diisi.'], 422);
        }
        $guest = $repo->create((int) $invitation['id'], $name, $salutation ?: 'Bapak/Ibu/Saudara/i');
        $guest['url'] = base_url(($invitation['slug'] ?: 'preview-undangan') . '?to=' . rawurlencode($guest['guest_name']));
        json_response(['ok' => true, 'message' => 'Tamu ditambahkan.', 'guest' => $guest], 201);
    }

    public function deleteInvitee(): void
    {
        $input = $this->jsonInput();
        verify_csrf((string) ($input['_csrf'] ?? ''));
        $invitation = $this->authorized((string) ($input['editor_token'] ?? ''));
        $deleted = (new InviteeRepository(db()))->delete((int) $invitation['id'], (int) ($input['guest_id'] ?? 0));
        if (!$deleted) {
            json_response(['ok' => false, 'message' => 'Tamu tidak ditemukan.'], 404);
        }
        json_response(['ok' => true, 'message' => 'Tamu dihapus dari daftar.']);
    }

    public function deletePhoto(): void
    {
        $input = $this->jsonInput();
        verify_csrf((string) ($input['_csrf'] ?? ''));
        $invitation = $this->authorized((string) ($input['editor_token'] ?? ''));
        $repo = new InvitationRepository(db());
        $media = $repo->findMediaOwned((int) ($input['media_id'] ?? 0), (int) $invitation['id']);
        if (!$media) {
            json_response(['ok' => false, 'message' => 'Foto tidak ditemukan.'], 404);
        }
        $repo->deleteMedia((int) $media['id'], (int) $invitation['id']);
        safe_unlink_upload($media['file_path']);
        json_response(['ok' => true, 'message' => 'Foto dihapus.']);
    }

    public function changeTemplate(): void
    {
        $input = $this->jsonInput();
        verify_csrf((string) ($input['_csrf'] ?? ''));
        $invitation = $this->authorized((string) ($input['editor_token'] ?? ''));
        $template = (new TemplateRepository(db()))->findByCode((string) ($input['template_code'] ?? ''));
        if (!$template) {
            json_response(['ok' => false, 'message' => 'Template tidak tersedia.'], 422);
        }
        (new OrderRepository(db()))->updateTemplate((int) $invitation['order_id'], (int) $template['id']);
        json_response([
            'ok' => true,
            'message' => 'Template berhasil diganti tanpa mengubah data.',
            'template' => ['code' => $template['code'], 'name' => $template['name']],
        ]);
    }

    public function publish(): void
    {
        $input = $this->jsonInput();
        verify_csrf((string) ($input['_csrf'] ?? ''));
        $invitation = $this->authorized((string) ($input['editor_token'] ?? ''));
        $repo = new InvitationRepository(db());
        $service = new InvitationService($repo, new SlugService($repo));
        $validation = $service->validateForPublish($invitation, $input);
        if ($validation['errors']) {
            json_response([
                'ok' => false,
                'message' => 'Lengkapi data yang masih belum valid.',
                'errors' => $validation['errors'],
                'slug_suggestions' => $validation['suggestions'],
            ], 422);
        }
        $repo->update((int) $invitation['id'], $validation['data']);
        db()->beginTransaction();
        try {
            $repo->publish((int) $invitation['id'], (int) $invitation['order_id']);
            db()->commit();
        } catch (Throwable $exception) {
            if (db()->inTransaction()) {
                db()->rollBack();
            }
            throw $exception;
        }
        json_response([
            'ok' => true,
            'message' => 'Undangan berhasil diterbitkan.',
            'redirect' => '/success/' . rawurlencode($invitation['editor_token']),
        ]);
    }

    public function success(string $token): void
    {
        $invitation = (new InvitationRepository(db()))->findDetailedByToken($token);
        if (!$invitation || !$invitation['published_at']) {
            http_response_code(404);
            view('errors/404', ['title' => 'Undangan belum diterbitkan', 'message' => 'Selesaikan proses publish terlebih dahulu.']);
            return;
        }
        $invitees = new InviteeRepository(db());
        $guestPerPage = 10;
        $guestTotal = $invitees->count((int) $invitation['id']);
        $guestPages = max(1, (int) ceil($guestTotal / $guestPerPage));
        $guestPage = max(1, (int) ($_GET['page'] ?? 1));
        $guestPage = min($guestPage, $guestPages);
        view('builder/success', [
            'title' => 'Undangan Berhasil Diterbitkan — Temuara',
            'invitation' => $invitation,
            'publicUrl' => base_url($invitation['slug']),
            'editorUrl' => base_url('edit/' . $invitation['editor_token']),
            'invitees' => $invitees->page((int) $invitation['id'], $guestPerPage, ($guestPage - 1) * $guestPerPage),
            'guestTotal' => $guestTotal,
            'guestPage' => $guestPage,
            'guestPages' => $guestPages,
            'pageClass' => 'success-page',
        ]);
    }

    private function authorized(string $token): array
    {
        if ($token === '' || strlen($token) > 128) {
            json_response(['ok' => false, 'message' => 'Akses editor tidak valid.'], 403);
        }
        $invitation = (new InvitationRepository(db()))->findDetailedByToken($token);
        if (!$invitation) {
            json_response(['ok' => false, 'message' => 'Akses editor tidak valid.'], 403);
        }
        return $invitation;
    }

    private function jsonInput(): array
    {
        $input = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($input)) {
            json_response(['ok' => false, 'message' => 'Format data tidak valid.'], 400);
        }
        return $input;
    }
}
