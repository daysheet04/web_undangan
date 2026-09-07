<?php

declare(strict_types=1);

require dirname(__DIR__) . '/app/bootstrap.php';

use App\Controllers\BuilderController;
use App\Controllers\GreetingController;
use App\Controllers\HomeController;
use App\Controllers\InvitationController;
use App\Controllers\OrderController;
use App\Controllers\PaymentController;

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$path = rtrim(current_path(), '/') ?: '/';

if ($method === 'GET' && $path === '/') {
    (new HomeController())->index();
    exit;
}
if ($method === 'GET' && preg_match('#^/template/([a-z0-9_]+)$#', $path, $match)) {
    (new InvitationController())->preview($match[1]);
    exit;
}
if ($path === '/order' && $method === 'GET') {
    (new OrderController())->form();
    exit;
}
if ($path === '/order' && $method === 'POST') {
    (new OrderController())->store();
    exit;
}
if ($method === 'GET' && preg_match('#^/payment/([A-Za-z0-9-]+)$#', $path, $match)) {
    (new PaymentController())->show($match[1]);
    exit;
}
if ($method === 'POST' && preg_match('#^/payment/([A-Za-z0-9-]+)/demo$#', $path, $match)) {
    (new PaymentController())->demo($match[1]);
    exit;
}
if ($method === 'GET' && preg_match('#^/edit/([a-f0-9]{64})$#', $path, $match)) {
    (new BuilderController())->show($match[1]);
    exit;
}
if ($method === 'POST' && $path === '/api/invitation/autosave') {
    (new BuilderController())->autosave();
    exit;
}
if ($method === 'POST' && $path === '/api/invitation/upload') {
    (new BuilderController())->upload();
    exit;
}
if ($method === 'POST' && $path === '/api/invitation/delete-photo') {
    (new BuilderController())->deletePhoto();
    exit;
}
if ($method === 'POST' && $path === '/api/invitation/gift-accounts') {
    (new BuilderController())->saveGiftAccounts();
    exit;
}
if ($method === 'POST' && $path === '/api/invitation/invitees') {
    (new BuilderController())->addInvitee();
    exit;
}
if ($method === 'POST' && $path === '/api/invitation/invitees/delete') {
    (new BuilderController())->deleteInvitee();
    exit;
}
if ($method === 'POST' && $path === '/api/invitation/change-template') {
    (new BuilderController())->changeTemplate();
    exit;
}
if ($method === 'POST' && $path === '/publish') {
    (new BuilderController())->publish();
    exit;
}
if ($method === 'GET' && preg_match('#^/success/([a-f0-9]{64})$#', $path, $match)) {
    (new BuilderController())->success($match[1]);
    exit;
}
if ($method === 'POST' && $path === '/api/greetings') {
    (new GreetingController())->store();
    exit;
}

// Route slug publik wajib berada paling akhir agar tidak menelan route sistem.
if ($method === 'GET' && preg_match('#^/([a-z0-9]+(?:-[a-z0-9]+)*)$#', $path, $match)) {
    (new InvitationController())->showPublic($match[1]);
    exit;
}

http_response_code(404);
view('errors/404', ['title' => 'Halaman tidak ditemukan', 'message' => 'Alamat yang Anda buka tidak tersedia.']);
