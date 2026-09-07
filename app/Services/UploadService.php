<?php

declare(strict_types=1);

namespace App\Services;

use RuntimeException;

final class UploadService
{
    private const MAX_BYTES = 2 * 1024 * 1024;
    private const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
    private const TYPES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];
    private const AUDIO_TYPES = [
        'audio/mpeg' => 'mp3',
        'audio/mp4' => 'm4a',
        'audio/x-m4a' => 'm4a',
        'audio/ogg' => 'ogg',
        'audio/wav' => 'wav',
        'audio/x-wav' => 'wav',
    ];

    public function store(array $file, int $invitationId): string
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new RuntimeException($this->uploadError((int) ($file['error'] ?? UPLOAD_ERR_NO_FILE)));
        }
        if ((int) ($file['size'] ?? 0) <= 0 || (int) $file['size'] > self::MAX_BYTES) {
            throw new RuntimeException('Ukuran foto maksimal 2 MB.');
        }
        $tmp = (string) ($file['tmp_name'] ?? '');
        if (!is_uploaded_file($tmp)) {
            throw new RuntimeException('Berkas upload tidak valid.');
        }
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = (string) $finfo->file($tmp);
        if (!isset(self::TYPES[$mime])) {
            throw new RuntimeException('Format foto harus JPG, PNG, atau WEBP.');
        }
        if (@getimagesize($tmp) === false) {
            throw new RuntimeException('Isi berkas bukan gambar yang valid.');
        }
        [$folder, $absoluteFolder] = $this->folder($invitationId);
        $name = bin2hex(random_bytes(20)) . '.' . self::TYPES[$mime];
        if (!move_uploaded_file($tmp, $absoluteFolder . '/' . $name)) {
            throw new RuntimeException('Foto gagal disimpan.');
        }
        return $folder . '/' . $name;
    }

    public function storeAudio(array $file, int $invitationId): string
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new RuntimeException($this->uploadError((int) ($file['error'] ?? UPLOAD_ERR_NO_FILE), 'musik'));
        }
        if ((int) ($file['size'] ?? 0) <= 0 || (int) $file['size'] > self::MAX_AUDIO_BYTES) {
            throw new RuntimeException('Ukuran musik maksimal 12 MB.');
        }
        $tmp = (string) ($file['tmp_name'] ?? '');
        if (!is_uploaded_file($tmp)) {
            throw new RuntimeException('Berkas musik tidak valid.');
        }
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = (string) $finfo->file($tmp);
        if (!isset(self::AUDIO_TYPES[$mime])) {
            throw new RuntimeException('Format musik harus MP3, M4A, OGG, atau WAV.');
        }
        [$folder, $absoluteFolder] = $this->folder($invitationId);
        $name = 'music-' . bin2hex(random_bytes(20)) . '.' . self::AUDIO_TYPES[$mime];
        if (!move_uploaded_file($tmp, $absoluteFolder . '/' . $name)) {
            throw new RuntimeException('Musik gagal disimpan.');
        }
        return $folder . '/' . $name;
    }

    private function folder(int $invitationId): array
    {
        $folder = 'uploads/' . $invitationId;
        $absoluteFolder = PUBLIC_PATH . '/' . $folder;
        if (!is_dir($absoluteFolder) && !mkdir($absoluteFolder, 0775, true) && !is_dir($absoluteFolder)) {
            throw new RuntimeException('Folder upload tidak dapat dibuat.');
        }
        return [$folder, $absoluteFolder];
    }

    private function uploadError(int $code, string $label = 'foto'): string
    {
        switch ($code) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return 'Ukuran ' . $label . ' melebihi batas server.';
            case UPLOAD_ERR_PARTIAL:
                return 'Upload ' . $label . ' terputus. Silakan coba lagi.';
            case UPLOAD_ERR_NO_FILE:
                return 'Pilih ' . $label . ' terlebih dahulu.';
            default:
                return 'Upload ' . $label . ' gagal.';
        }
    }
}
