<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\GiftAccountRepository;
use App\Repositories\GreetingRepository;
use App\Repositories\InvitationRepository;
use App\Repositories\InviteeRepository;
use App\Repositories\TemplateRepository;
use App\Repositories\TemplatePackageRepository;

final class InvitationController
{
    public function preview(string $code): void
    {
        $template = (new TemplateRepository(db()))->findByCode($code);
        if (!$template) {
            $this->notFound('Template tidak ditemukan.');
            return;
        }
        $embed = ($_GET['embed'] ?? '') === '1';
        if (!$embed) {
            $packages = (new TemplatePackageRepository(db()))->allForTemplate((int) $template['id']);
            view('invitation/preview', [
                'title' => 'Preview ' . $template['name'] . ' — Daymoment',
                'template' => $template,
                'packages' => $packages,
                'pageClass' => 'preview-page',
                'styles' => ['homepage.css'],
                'scripts' => ['package-preview.js'],
            ]);
            return;
        }
        $token = trim((string) ($_GET['token'] ?? ''));
        $repo = new InvitationRepository(db());
        $invitation = $token !== '' ? $repo->findDetailedByToken($token) : null;
        if ($token !== '' && !$invitation) {
            $this->notFound('Preview editor tidak ditemukan.');
            return;
        }
        $media = $invitation ? $repo->media((int) $invitation['id']) : [];
        if ($invitation) {
            $previewData = $this->withPreviewFallbacks($invitation);
            $giftAccounts = !empty($invitation['has_gift']) ? (new GiftAccountRepository(db()))->all((int) $invitation['id']) : [];
        } else {
            $packageRepo = new TemplatePackageRepository(db());
            $packageCode = strtolower(trim((string) ($_GET['package'] ?? 'signature')));
            $package = $packageRepo->findForTemplate((int) $template['id'], $packageCode)
                ?: $packageRepo->findForTemplate((int) $template['id'], 'signature');
            $previewData = array_merge($this->sample(), [
                'package_code' => $package['code'],
                'package_name' => $package['name'],
                'gallery_limit' => (int) $package['gallery_limit'],
                'has_music' => (int) $package['has_music'],
                'has_gift' => (int) $package['has_gift'],
                'has_wishes' => (int) $package['has_wishes'],
            ]);
            $giftAccounts = !empty($package['has_gift']) ? [[
                'provider' => 'BCA',
                'account_number' => '1234 5678 90',
                'account_name' => 'Andi & Nisa',
                'label' => 'Hadiah pernikahan',
            ]] : [];
        }
        $this->renderTemplate($template['code'], $previewData, $media, [], [
            'isPreview' => true,
            'embed' => $embed,
            'guestName' => 'Bapak/Ibu/Saudara/i',
            'guestSalutation' => 'Kepada Yth.',
            'giftAccounts' => $giftAccounts,
            'template' => $template,
        ]);
    }

    public function showPublic(string $slug): void
    {
        $repo = new InvitationRepository(db());
        $invitation = $repo->findPublishedBySlug($slug);
        if (!$invitation) {
            $this->notFound('Undangan yang Anda cari belum tersedia.');
            return;
        }
        $guestName = trim((string) ($_GET['to'] ?? ''));
        $guestName = $guestName !== '' ? mb_substr(strip_tags($guestName), 0, 150) : 'Bapak/Ibu/Saudara/i';
        $guestSalutation = 'Kepada Yth.';
        $guestToken = trim((string) ($_GET['guest'] ?? ''));
        if ($guestToken !== '' && preg_match('/^[a-f0-9]{40}$/', $guestToken)) {
            $invitee = (new InviteeRepository(db()))->findByToken((int) $invitation['id'], $guestToken);
            if ($invitee) {
                $guestName = $invitee['guest_name'];
                $guestSalutation = $invitee['salutation'];
            }
        }
        $media = $repo->media((int) $invitation['id']);
        $greetings = !empty($invitation['has_wishes']) ? (new GreetingRepository(db()))->latest((int) $invitation['id']) : [];
        $this->renderTemplate($invitation['template_code'], $invitation, $media, $greetings, [
            'isPreview' => false,
            'embed' => false,
            'guestName' => $guestName,
            'guestSalutation' => $guestSalutation,
            'giftAccounts' => !empty($invitation['has_gift']) ? (new GiftAccountRepository(db()))->all((int) $invitation['id']) : [],
            'template' => ['code' => $invitation['template_code'], 'name' => $invitation['template_name']],
        ]);
    }

    private function renderTemplate(string $code, array $invitation, array $media, array $greetings, array $extra): void
    {
        $views = [
            'puspa_jawi' => 'templates/puspa-jawi',
        ];
        $view = $views[$code] ?? null;
        if ($view === null) {
            $this->notFound('Template tidak tersedia.');
            return;
        }
        view($view, array_merge([
            'invitation' => $invitation,
            'media' => $media,
            'greetings' => $greetings,
            'csrf' => csrf_token(),
        ], $extra), null);
    }

    private function sample(): array
    {
        $nextMonth = (new \DateTimeImmutable('+45 days'))->format('Y-m-d');
        return [
            'id' => 0,
            'slug' => null,
            'groom_full_name' => 'Andi Pratama',
            'groom_nickname' => 'Andi',
            'groom_father' => 'Bapak H. Suryanto',
            'groom_mother' => 'Ibu Hj. Rahayu',
            'bride_full_name' => 'Nisa Maharani',
            'bride_nickname' => 'Nisa',
            'bride_father' => 'Bapak H. Firmansyah',
            'bride_mother' => 'Ibu Hj. Lestari',
            'akad_date' => $nextMonth,
            'akad_start_time' => '08:00:00',
            'akad_end_time' => '10:00:00',
            'reception_date' => $nextMonth,
            'reception_start_time' => '11:00:00',
            'reception_end_time' => '14:00:00',
            'venue_name' => 'Pendopo Arunika',
            'venue_address' => 'Jl. Melati No. 12, Yogyakarta',
            'maps_url' => 'https://maps.google.com/',
            'love_story' => 'Berawal dari pertemuan sederhana pada sebuah sore di Yogyakarta, percakapan kami tumbuh menjadi persahabatan, lalu keyakinan untuk berjalan bersama.',
            'instagram' => 'andindanisa',
            'cover_image' => null,
            'groom_photo' => null,
            'bride_photo' => null,
            'music_file' => null,
            'music_title' => null,
            'package_code' => 'prestige',
            'package_name' => 'Prestige',
            'gallery_limit' => 5,
            'has_music' => 1,
            'has_gift' => 1,
            'has_wishes' => 1,
            'published_at' => null,
        ];
    }

    /**
     * Empty builder fields stay empty in storage, but the visual preview keeps
     * realistic sample copy until the customer supplies their own value.
     */
    private function withPreviewFallbacks(array $invitation): array
    {
        $sample = $this->sample();
        $previewFields = [
            'groom_full_name', 'groom_nickname', 'groom_father', 'groom_mother',
            'bride_full_name', 'bride_nickname', 'bride_father', 'bride_mother',
            'akad_date', 'akad_start_time', 'akad_end_time', 'reception_date',
            'reception_start_time', 'reception_end_time', 'venue_name',
            'venue_address', 'maps_url', 'love_story', 'instagram',
        ];
        foreach ($previewFields as $field) {
            if (!isset($invitation[$field]) || trim((string) $invitation[$field]) === '') {
                $invitation[$field] = $sample[$field];
            }
        }
        return $invitation;
    }

    private function notFound(string $message): void
    {
        http_response_code(404);
        view('errors/404', ['title' => 'Tidak ditemukan', 'message' => $message]);
    }
}
