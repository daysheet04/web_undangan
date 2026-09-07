<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;
use Throwable;

final class GiftAccountRepository
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function all(int $invitationId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM gift_accounts WHERE invitation_id = ? AND is_active = 1 ORDER BY sort_order, id');
        $stmt->execute([$invitationId]);
        return $stmt->fetchAll();
    }

    public function replaceAll(int $invitationId, array $accounts): void
    {
        $this->db->beginTransaction();
        try {
            $delete = $this->db->prepare('DELETE FROM gift_accounts WHERE invitation_id = ?');
            $delete->execute([$invitationId]);
            $insert = $this->db->prepare(
                'INSERT INTO gift_accounts (invitation_id, provider, account_number, account_name, label, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            foreach ($accounts as $index => $account) {
                $insert->execute([
                    $invitationId,
                    $account['provider'],
                    $account['account_number'],
                    $account['account_name'],
                    $account['label'] ?: null,
                    $index,
                ]);
            }
            $this->db->commit();
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $exception;
        }
    }
}
