<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;

final class TemplateRepository
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function allActive(): array
    {
        return $this->db->query(
            "SELECT t.*,
                    (SELECT COUNT(*) FROM template_packages p WHERE p.template_id = t.id AND p.is_active = 1) AS package_count,
                    (SELECT MIN(p.price) FROM template_packages p WHERE p.template_id = t.id AND p.is_active = 1) AS starting_price
             FROM templates t WHERE t.code = 'puspa_jawi' AND t.is_active = 1 ORDER BY t.id"
        )->fetchAll();
    }

    public function findByCode(string $code): ?array
    {
        if ($code !== 'puspa_jawi') {
            return null;
        }
        $stmt = $this->db->prepare(
            'SELECT t.*,
                    (SELECT COUNT(*) FROM template_packages p WHERE p.template_id = t.id AND p.is_active = 1) AS package_count,
                    (SELECT MIN(p.price) FROM template_packages p WHERE p.template_id = t.id AND p.is_active = 1) AS starting_price
             FROM templates t WHERE t.code = ? AND t.is_active = 1 LIMIT 1'
        );
        $stmt->execute([$code]);
        return $stmt->fetch() ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM templates WHERE id = ? AND code = 'puspa_jawi' AND is_active = 1 LIMIT 1");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }
}
