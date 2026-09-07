<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;

final class GreetingRepository
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function latest(int $invitationId, int $limit = 20): array
    {
        $limit = max(1, min(50, $limit));
        $stmt = $this->db->prepare(
            "SELECT id, guest_name, attendance_status, guest_count, message, created_at
             FROM guest_messages WHERE invitation_id = ? AND is_approved = 1
             ORDER BY created_at DESC, id DESC LIMIT {$limit}"
        );
        $stmt->execute([$invitationId]);
        return $stmt->fetchAll();
    }

    public function create(int $invitationId, string $name, string $attendance, int $guestCount, string $message): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO guest_messages (invitation_id, guest_name, attendance_status, guest_count, message, is_approved)
             VALUES (?, ?, ?, ?, ?, 1)'
        );
        $stmt->execute([$invitationId, $name, $attendance, $guestCount, $message]);
        return (int) $this->db->lastInsertId();
    }
}
