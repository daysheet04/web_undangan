SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS guest_messages;
DROP TABLE IF EXISTS invitation_guests;
DROP TABLE IF EXISTS gift_accounts;
DROP TABLE IF EXISTS invitation_media;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invitations;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS template_packages;
DROP TABLE IF EXISTS templates;

CREATE TABLE templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    thumbnail VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_templates_code (code),
    KEY idx_templates_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(32) NOT NULL,
    template_id BIGINT UNSIGNED NOT NULL,
    package_id BIGINT UNSIGNED NOT NULL,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(24) NOT NULL,
    editor_token VARCHAR(128) NOT NULL,
    status ENUM('waiting_payment','editing','published','cancelled') NOT NULL DEFAULT 'waiting_payment',
    payment_status ENUM('pending','paid','failed','expired','refunded') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_orders_order_code (order_code),
    UNIQUE KEY uq_orders_editor_token (editor_token),
    KEY idx_orders_template (template_id),
    KEY idx_orders_package (package_id),
    KEY idx_orders_status (status, payment_status),
    CONSTRAINT fk_orders_template FOREIGN KEY (template_id) REFERENCES templates(id),
    CONSTRAINT fk_orders_package FOREIGN KEY (package_id) REFERENCES template_packages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invitations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    slug VARCHAR(120) NULL,
    groom_full_name VARCHAR(150) NULL,
    groom_nickname VARCHAR(80) NULL,
    groom_father VARCHAR(150) NULL,
    groom_mother VARCHAR(150) NULL,
    bride_full_name VARCHAR(150) NULL,
    bride_nickname VARCHAR(80) NULL,
    bride_father VARCHAR(150) NULL,
    bride_mother VARCHAR(150) NULL,
    akad_date DATE NULL,
    akad_start_time TIME NULL,
    akad_end_time TIME NULL,
    reception_date DATE NULL,
    reception_start_time TIME NULL,
    reception_end_time TIME NULL,
    venue_name VARCHAR(180) NULL,
    venue_address TEXT NULL,
    maps_url VARCHAR(500) NULL,
    love_story TEXT NULL,
    instagram VARCHAR(100) NULL,
    cover_image VARCHAR(255) NULL,
    groom_photo VARCHAR(255) NULL,
    bride_photo VARCHAR(255) NULL,
    music_file VARCHAR(255) NULL,
    music_title VARCHAR(150) NULL,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_invitations_order (order_id),
    UNIQUE KEY uq_invitations_slug (slug),
    KEY idx_invitations_published (published_at),
    CONSTRAINT fk_invitations_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invitation_media (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invitation_id BIGINT UNSIGNED NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_media_invitation_sort (invitation_id, sort_order),
    CONSTRAINT fk_media_invitation FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gift_accounts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invitation_id BIGINT UNSIGNED NOT NULL,
    provider VARCHAR(80) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    account_name VARCHAR(150) NOT NULL,
    label VARCHAR(100) NULL,
    sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_gift_invitation_sort (invitation_id, sort_order),
    CONSTRAINT fk_gift_invitation FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invitation_guests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invitation_id BIGINT UNSIGNED NOT NULL,
    guest_name VARCHAR(150) NOT NULL,
    salutation VARCHAR(80) NOT NULL DEFAULT 'Bapak/Ibu/Saudara/i',
    guest_token VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_invitation_guest_token (guest_token),
    KEY idx_guests_invitation_name (invitation_id, guest_name),
    CONSTRAINT fk_guests_invitation FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE guest_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invitation_id BIGINT UNSIGNED NOT NULL,
    guest_name VARCHAR(120) NOT NULL,
    attendance_status ENUM('attending','not_attending','unsure') NOT NULL,
    guest_count TINYINT UNSIGNED NOT NULL DEFAULT 1,
    message VARCHAR(500) NOT NULL,
    is_approved TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_messages_invitation_approved (invitation_id, is_approved, created_at),
    CONSTRAINT fk_messages_invitation FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    gateway VARCHAR(50) NULL,
    transaction_id VARCHAR(120) NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status ENUM('pending','paid','failed','expired','refunded') NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_payments_order (order_id),
    UNIQUE KEY uq_payments_transaction (transaction_id),
    KEY idx_payments_status (status),
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
