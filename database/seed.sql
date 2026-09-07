-- Katalog template sengaja dikosongkan.
-- Record lama dinonaktifkan agar order dan undangan yang memiliki foreign key
-- tidak ikut terhapus. Template baru akan ditambahkan satu per satu.
UPDATE templates SET is_active = 0;

INSERT INTO templates (code, name, category, description, thumbnail, is_active) VALUES
('puspa_jawi', 'Puspa Jawi', 'Javanese Botanical', 'Romansa Jawa kontemporer dengan lanskap gunung, gapura ukir, puspa watercolor, dan awan bergerak.', 'puspa-jawi', 1)
ON DUPLICATE KEY UPDATE
name = VALUES(name), category = VALUES(category), description = VALUES(description), thumbnail = VALUES(thumbnail), is_active = VALUES(is_active);
