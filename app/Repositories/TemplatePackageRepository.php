<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;

final class TemplatePackageRepository
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function allForTemplate(int $templateId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM template_packages WHERE template_id = ? AND is_active = 1 ORDER BY sort_order, id'
        );
        $stmt->execute([$templateId]);
        return $stmt->fetchAll();
    }

    public function findForTemplate(int $templateId, string $code): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM template_packages WHERE template_id = ? AND code = ? AND is_active = 1 LIMIT 1'
        );
        $stmt->execute([$templateId, $code]);
        return $stmt->fetch() ?: null;
    }
}
