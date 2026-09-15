<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\InvitationRepository;
use App\Repositories\OrderRepository;
use App\Repositories\PaymentRepository;
use App\Repositories\TemplateRepository;
use App\Repositories\TemplatePackageRepository;
use App\Services\OrderService;

final class OrderController
{
    public function form(): void
    {
        $code = trim((string) ($_GET['template'] ?? $_SESSION['selected_template'] ?? ''));
        $template = (new TemplateRepository(db()))->findByCode($code);
        if (!$template) {
            flash('error', 'Pilih template terlebih dahulu.');
            redirect('/#templates');
        }
        $_SESSION['selected_template'] = $template['code'];
        $packages = (new TemplatePackageRepository(db()))->allForTemplate((int) $template['id']);
        $selectedPackage = strtolower(trim((string) ($_GET['package'] ?? 'signature')));
        if (!(new TemplatePackageRepository(db()))->findForTemplate((int) $template['id'], $selectedPackage)) {
            $selectedPackage = 'signature';
        }
        $this->render($template, $packages, [], ['package_code' => $selectedPackage]);
    }

    public function store(): void
    {
        verify_csrf();
        $code = trim((string) ($_POST['template_code'] ?? $_SESSION['selected_template'] ?? ''));
        $templateRepo = new TemplateRepository(db());
        $template = $templateRepo->findByCode($code);
        $packageCode = strtolower(trim((string) ($_POST['package_code'] ?? '')));
        $packageRepo = new TemplatePackageRepository(db());
        $packages = $template ? $packageRepo->allForTemplate((int) $template['id']) : [];
        $package = $template ? $packageRepo->findForTemplate((int) $template['id'], $packageCode) : null;
        $name = text_value($_POST, 'customer_name', 120);
        $phone = text_value($_POST, 'customer_phone', 24);
        $errors = [];

        if (!$template) {
            $errors['template'] = 'Template tidak valid. Silakan pilih kembali.';
        }
        if (!$package) {
            $errors['package_code'] = 'Pilih salah satu paket undangan.';
        }
        if (mb_strlen($name) < 3) {
            $errors['customer_name'] = 'Nama lengkap minimal 3 karakter.';
        }
        if (!valid_indonesian_phone($phone)) {
            $errors['customer_phone'] = 'Gunakan nomor Indonesia yang diawali 08 atau +62.';
        }
        if (($_POST['agreement'] ?? '') !== '1') {
            $errors['agreement'] = 'Persetujuan data wajib dicentang.';
        }

        if ($errors || !$template) {
            if (!$template) {
                flash('error', $errors['template'] ?? 'Template tidak tersedia.');
                redirect('/#templates');
            }
            $this->render($template, $packages, $errors, [
                'customer_name' => $name,
                'customer_phone' => $phone,
                'package_code' => $packageCode,
            ]);
            return;
        }

        $service = new OrderService(
            db(),
            $templateRepo,
            new OrderRepository(db()),
            new InvitationRepository(db()),
            new PaymentRepository(db())
        );
        $order = $service->create($code, $packageCode, $name, normalize_phone($phone));
        session_regenerate_id(true);
        $_SESSION['last_order_code'] = $order['order_code'];
        unset($_SESSION['selected_template']);
        redirect('/payment/' . rawurlencode($order['order_code']));
    }

    private function render(array $template, array $packages, array $errors = [], array $old = []): void
    {
        view('order/form', [
            'title' => 'Data Pemesan — Daymoment',
            'template' => $template,
            'packages' => $packages,
            'errors' => $errors,
            'old' => $old,
            'pageClass' => 'order-page',
            'styles' => ['homepage.css'],
        ]);
    }
}
