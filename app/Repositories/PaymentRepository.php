<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;

final class PaymentRepository
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function createPending(int $orderId, float $amount = 0): int
    {
        $stmt = $this->db->prepare('INSERT INTO payments (order_id, amount, status) VALUES (?, ?, \'pending\')');
        $stmt->execute([$orderId, $amount]);
        return (int) $this->db->lastInsertId();
    }

    public function findByOrder(int $orderId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM payments WHERE order_id = ? LIMIT 1');
        $stmt->execute([$orderId]);
        return $stmt->fetch() ?: null;
    }
}
