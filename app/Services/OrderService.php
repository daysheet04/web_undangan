<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\InvitationRepository;
use App\Repositories\OrderRepository;
use App\Repositories\PaymentRepository;
use App\Repositories\TemplateRepository;
use App\Repositories\TemplatePackageRepository;
use PDO;
use RuntimeException;
use Throwable;

final class OrderService
{
    private $db;
    private $templates;
    private $orders;
    private $invitations;
    private $payments;

    public function __construct(
        PDO $db,
        TemplateRepository $templates,
        OrderRepository $orders,
        InvitationRepository $invitations,
        PaymentRepository $payments
    ) {
        $this->db = $db;
        $this->templates = $templates;
        $this->orders = $orders;
        $this->invitations = $invitations;
        $this->payments = $payments;
    }

    public function create(string $templateCode, string $packageCode, string $name, string $phone): array
    {
        $template = $this->templates->findByCode($templateCode);
        if (!$template) {
            throw new RuntimeException('Template yang dipilih tidak tersedia.');
        }
        $package = (new TemplatePackageRepository($this->db))->findForTemplate((int) $template['id'], $packageCode);
        if (!$package) {
            throw new RuntimeException('Paket yang dipilih tidak tersedia untuk template ini.');
        }

        $this->db->beginTransaction();
        try {
            $orderCode = 'INV-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(4)));
            $token = bin2hex(random_bytes(32));
            $orderId = $this->orders->create([
                'order_code' => $orderCode,
                'template_id' => (int) $template['id'],
                'package_id' => (int) $package['id'],
                'customer_name' => $name,
                'customer_phone' => $phone,
                'editor_token' => $token,
                'status' => 'waiting_payment',
                'payment_status' => 'pending',
            ]);
            $this->invitations->createEmpty($orderId);
            $this->payments->createPending($orderId, (float) $package['price']);
            $this->db->commit();
            $order = $this->orders->findByCode($orderCode);
            if (!$order) {
                throw new RuntimeException('Order gagal dimuat setelah dibuat.');
            }
            return $order;
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $exception;
        }
    }
}
