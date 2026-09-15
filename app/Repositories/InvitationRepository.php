<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;

final class InvitationRepository
{
    private const EDITABLE = [
        'slug', 'groom_full_name', 'groom_nickname', 'groom_father', 'groom_mother',
        'bride_full_name', 'bride_nickname', 'bride_father', 'bride_mother',
        'akad_date', 'akad_start_time', 'akad_end_time', 'reception_date',
        'reception_start_time', 'reception_end_time', 'venue_name', 'venue_address',
        'maps_url', 'love_story', 'instagram', 'cover_image', 'groom_photo',
        'bride_photo', 'music_file', 'music_title',
    ];

    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function createEmpty(int $orderId): int
    {
        $stmt = $this->db->prepare('INSERT INTO invitations (order_id) VALUES (?)');
        $stmt->execute([$orderId]);
        return (int) $this->db->lastInsertId();
    }

    public function findByOrderId(int $orderId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM invitations WHERE order_id = ? LIMIT 1');
        $stmt->execute([$orderId]);
        return $stmt->fetch() ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM invitations WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function findDetailedByToken(string $token): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT i.*, o.order_code, o.editor_token, o.status AS order_status, o.payment_status,
                    o.template_id, o.package_id, t.code AS template_code, t.name AS template_name, t.category AS template_category,
                    p.code AS package_code, p.name AS package_name, p.price AS package_price,
                    p.gallery_limit, p.has_music, p.has_gift, p.has_wishes
             FROM invitations i
             JOIN orders o ON o.id = i.order_id
             JOIN templates t ON t.id = o.template_id
             JOIN template_packages p ON p.id = o.package_id
             WHERE o.editor_token = ? LIMIT 1'
        );
        $stmt->execute([$token]);
        return $stmt->fetch() ?: null;
    }

    public function findPublishedBySlug(string $slug): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT i.*, o.template_id, o.package_id, t.code AS template_code, t.name AS template_name,
                    p.code AS package_code, p.name AS package_name, p.price AS package_price,
                    p.gallery_limit, p.has_music, p.has_gift, p.has_wishes
             FROM invitations i
             JOIN orders o ON o.id = i.order_id
             JOIN templates t ON t.id = o.template_id
             JOIN template_packages p ON p.id = o.package_id
             WHERE i.slug = ? AND i.published_at IS NOT NULL AND o.status = \'published\' LIMIT 1'
        );
        $stmt->execute([$slug]);
        return $stmt->fetch() ?: null;
    }

    public function update(int $id, array $data): void
    {
        $data = array_intersect_key($data, array_flip(self::EDITABLE));
        if ($data === []) {
            return;
        }
        $sets = [];
        $params = [];
        foreach ($data as $column => $value) {
            $sets[] = $column . ' = ?';
            $params[] = $value === '' ? null : $value;
        }
        $params[] = $id;
        $stmt = $this->db->prepare('UPDATE invitations SET ' . implode(', ', $sets) . ', updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute($params);
    }

    public function isSlugAvailable(string $slug, ?int $exceptId = null): bool
    {
        $sql = 'SELECT COUNT(*) FROM invitations WHERE slug = ?';
        $params = [$slug];
        if ($exceptId !== null) {
            $sql .= ' AND id <> ?';
            $params[] = $exceptId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn() === 0;
    }

    public function publish(int $invitationId, int $orderId): void
    {
        $stmt = $this->db->prepare('UPDATE invitations SET published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$invitationId]);
        $stmt = $this->db->prepare('UPDATE orders SET status = \'published\', updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$orderId]);
    }

    public function media(int $invitationId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM invitation_media WHERE invitation_id = ? ORDER BY sort_order, id');
        $stmt->execute([$invitationId]);
        return $stmt->fetchAll();
    }

    public function addMedia(int $invitationId, string $path): int
    {
        $stmt = $this->db->prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 FROM invitation_media WHERE invitation_id = ?');
        $stmt->execute([$invitationId]);
        $sort = (int) $stmt->fetchColumn();
        $stmt = $this->db->prepare('INSERT INTO invitation_media (invitation_id, file_path, sort_order) VALUES (?, ?, ?)');
        $stmt->execute([$invitationId, $path, $sort]);
        return (int) $this->db->lastInsertId();
    }

    public function findMediaOwned(int $mediaId, int $invitationId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM invitation_media WHERE id = ? AND invitation_id = ? LIMIT 1');
        $stmt->execute([$mediaId, $invitationId]);
        return $stmt->fetch() ?: null;
    }

    public function deleteMedia(int $mediaId, int $invitationId): void
    {
        $stmt = $this->db->prepare('DELETE FROM invitation_media WHERE id = ? AND invitation_id = ?');
        $stmt->execute([$mediaId, $invitationId]);
    }
}
