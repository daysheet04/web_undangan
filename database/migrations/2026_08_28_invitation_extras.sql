SET NAMES utf8mb4;

ALTER TABLE invitations
    ADD COLUMN groom_photo VARCHAR(255) NULL AFTER cover_image,
    ADD COLUMN bride_photo VARCHAR(255) NULL AFTER groom_photo,
    ADD COLUMN music_file VARCHAR(255) NULL AFTER bride_photo,
    ADD COLUMN music_title VARCHAR(150) NULL AFTER music_file;

ALTER TABLE guest_messages
    ADD COLUMN guest_count TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER attendance_status;

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
