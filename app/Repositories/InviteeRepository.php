<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;

final class InviteeRepository
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function all(int $invitationId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM invitation_guests WHERE invitation_id = ? ORDER BY created_at DESC, id DESC');
        $stmt->execute([$invitationId]);
        return $stmt->fetchAll();
    }

    public function page(int $invitationId, int $limit, int $offset): array
    {
        $limit = max(1, min(100, $limit));
        $offset = max(0, $offset);
        $stmt = $this->db->prepare(
            'SELECT * FROM invitation_guests
             WHERE invitation_id = :invitation_id
             ORDER BY created_at DESC, id DESC
             LIMIT :limit OFFSET :offset'
        );
        $stmt->bindValue(':invitation_id', $invitationId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function create(int $invitationId, string $name, string $salutation): array
    {
        $token = bin2hex(random_bytes(20));
        $stmt = $this->db->prepare(
            'INSERT INTO invitation_guests (invitation_id, guest_name, salutation, guest_token)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$invitationId, $name, $salutation, $token]);
        return [
            'id' => (int) $this->db->lastInsertId(),
            'guest_name' => $name,
            'salutation' => $salutation,
            'guest_token' => $token,
        ];
    }

    public function findByToken(int $invitationId, string $token): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM invitation_guests WHERE invitation_id = ? AND guest_token = ? LIMIT 1');
        $stmt->execute([$invitationId, $token]);
        return $stmt->fetch() ?: null;
    }

    public function delete(int $invitationId, int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM invitation_guests WHERE id = ? AND invitation_id = ?');
        $stmt->execute([$id, $invitationId]);
        return $stmt->rowCount() > 0;
    }

    public function count(int $invitationId): int
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM invitation_guests WHERE invitation_id = ?');
        $stmt->execute([$invitationId]);
        return (int) $stmt->fetchColumn();
    }
}
