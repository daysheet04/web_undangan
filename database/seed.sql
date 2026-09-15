-- Katalog template sengaja dikosongkan.
-- Record lama dinonaktifkan agar order dan undangan yang memiliki foreign key
-- tidak ikut terhapus. Template baru akan ditambahkan satu per satu.
UPDATE templates SET is_active = 0;

INSERT INTO templates (code, name, category, description, thumbnail, is_active) VALUES
('puspa_jawi', 'Puspa Jawi', 'Javanese Botanical', 'Romansa Jawa kontemporer dengan lanskap gunung, gapura ukir, puspa watercolor, dan awan bergerak.', 'puspa-jawi', 1)
ON DUPLICATE KEY UPDATE
name = VALUES(name), category = VALUES(category), description = VALUES(description), thumbnail = VALUES(thumbnail), is_active = VALUES(is_active);

INSERT INTO template_packages
    (template_id, code, name, tagline, price, gallery_limit, has_music, has_gift, has_wishes, sort_order, is_active)
SELECT id, 'essential', 'Essential', 'Undangan inti yang cantik dan ringkas.', 99000, 2, 0, 0, 0, 1, 1
FROM templates WHERE code = 'puspa_jawi'
ON DUPLICATE KEY UPDATE name = VALUES(name), tagline = VALUES(tagline), price = VALUES(price), gallery_limit = VALUES(gallery_limit), has_music = VALUES(has_music), has_gift = VALUES(has_gift), has_wishes = VALUES(has_wishes), sort_order = VALUES(sort_order), is_active = VALUES(is_active);

INSERT INTO template_packages
    (template_id, code, name, tagline, price, gallery_limit, has_music, has_gift, has_wishes, sort_order, is_active)
SELECT id, 'signature', 'Signature', 'Lebih hidup dengan musik dan ucapan tamu.', 159000, 3, 1, 0, 1, 2, 1
FROM templates WHERE code = 'puspa_jawi'
ON DUPLICATE KEY UPDATE name = VALUES(name), tagline = VALUES(tagline), price = VALUES(price), gallery_limit = VALUES(gallery_limit), has_music = VALUES(has_music), has_gift = VALUES(has_gift), has_wishes = VALUES(has_wishes), sort_order = VALUES(sort_order), is_active = VALUES(is_active);

INSERT INTO template_packages
    (template_id, code, name, tagline, price, gallery_limit, has_music, has_gift, has_wishes, sort_order, is_active)
SELECT id, 'prestige', 'Prestige', 'Pengalaman lengkap dengan seluruh fitur premium.', 249000, 5, 1, 1, 1, 3, 1
FROM templates WHERE code = 'puspa_jawi'
ON DUPLICATE KEY UPDATE name = VALUES(name), tagline = VALUES(tagline), price = VALUES(price), gallery_limit = VALUES(gallery_limit), has_music = VALUES(has_music), has_gift = VALUES(has_gift), has_wishes = VALUES(has_wishes), sort_order = VALUES(sort_order), is_active = VALUES(is_active);
