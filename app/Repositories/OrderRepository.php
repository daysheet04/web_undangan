<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;

final class OrderRepository
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO orders (order_code, template_id, package_id, customer_name, customer_phone, editor_token, status, payment_status)
             VALUES (:order_code, :template_id, :package_id, :customer_name, :customer_phone, :editor_token, :status, :payment_status)'
        );
        $stmt->execute($data);
        return (int) $this->db->lastInsertId();
    }

    public function findByCode(string $code): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT o.*, t.code AS template_code, t.name AS template_name, t.category AS template_category,
                    p.code AS package_code, p.name AS package_name, p.price AS package_price,
                    p.gallery_limit, p.has_music, p.has_gift, p.has_wishes
             FROM orders o
             JOIN templates t ON t.id = o.template_id
             JOIN template_packages p ON p.id = o.package_id
             WHERE o.order_code = ? LIMIT 1'
        );
        $stmt->execute([$code]);
        return $stmt->fetch() ?: null;
    }

    public function findByToken(string $token): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT o.*, t.code AS template_code, t.name AS template_name, t.category AS template_category,
                    p.code AS package_code, p.name AS package_name, p.price AS package_price,
                    p.gallery_limit, p.has_music, p.has_gift, p.has_wishes
             FROM orders o
             JOIN templates t ON t.id = o.template_id
             JOIN template_packages p ON p.id = o.package_id
             WHERE o.editor_token = ? LIMIT 1'
        );
        $stmt->execute([$token]);
        return $stmt->fetch() ?: null;
    }

    public function updateStatus(int $id, string $status): void
    {
        $stmt = $this->db->prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$status, $id]);
    }

    public function updateTemplate(int $id, int $templateId, int $packageId): void
    {
        $stmt = $this->db->prepare('UPDATE orders SET template_id = ?, package_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$templateId, $packageId, $id]);
    }
}
