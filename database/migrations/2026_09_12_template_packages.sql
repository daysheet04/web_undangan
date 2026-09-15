CREATE TABLE template_packages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    template_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(80) NOT NULL,
    tagline VARCHAR(180) NOT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    gallery_limit TINYINT UNSIGNED NOT NULL DEFAULT 2,
    has_music TINYINT(1) NOT NULL DEFAULT 0,
    has_gift TINYINT(1) NOT NULL DEFAULT 0,
    has_wishes TINYINT(1) NOT NULL DEFAULT 0,
    sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_template_package_code (template_id, code),
    KEY idx_template_packages_active (template_id, is_active, sort_order),
    CONSTRAINT fk_template_packages_template FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO template_packages
    (template_id, code, name, tagline, price, gallery_limit, has_music, has_gift, has_wishes, sort_order)
SELECT id, 'essential', 'Essential', 'Undangan inti yang cantik dan ringkas.', 99000, 2, 0, 0, 0, 1 FROM templates;

INSERT INTO template_packages
    (template_id, code, name, tagline, price, gallery_limit, has_music, has_gift, has_wishes, sort_order)
SELECT id, 'signature', 'Signature', 'Lebih hidup dengan musik dan ucapan tamu.', 159000, 3, 1, 0, 1, 2 FROM templates;

INSERT INTO template_packages
    (template_id, code, name, tagline, price, gallery_limit, has_music, has_gift, has_wishes, sort_order)
SELECT id, 'prestige', 'Prestige', 'Pengalaman lengkap dengan seluruh fitur premium.', 249000, 5, 1, 1, 1, 3 FROM templates;

ALTER TABLE orders ADD COLUMN package_id BIGINT UNSIGNED NULL AFTER template_id;

UPDATE orders o
JOIN template_packages p ON p.template_id = o.template_id AND p.code = 'prestige'
SET o.package_id = p.id
WHERE o.package_id IS NULL;

ALTER TABLE orders
    MODIFY package_id BIGINT UNSIGNED NOT NULL,
    ADD KEY idx_orders_package (package_id),
    ADD CONSTRAINT fk_orders_package FOREIGN KEY (package_id) REFERENCES template_packages(id);
