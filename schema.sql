-- Parking Management System schema for MySQL/phpMyAdmin.
-- Do not add CREATE DATABASE or USE statements here.

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    username VARCHAR(80) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'guard_entrance', 'guard_exit') NOT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cards (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    card_code VARCHAR(32) NOT NULL,
    status ENUM('available', 'in_use', 'lost', 'disabled') NOT NULL DEFAULT 'available',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cards_code (card_code),
    KEY idx_cards_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicles_tickets (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    card_id BIGINT UNSIGNED NULL,
    ticket_token CHAR(64) NOT NULL,
    plate_no VARCHAR(20) NOT NULL,
    vehicle_type ENUM('Car', 'Motorcycle', 'Van') NOT NULL DEFAULT 'Car',
    entry_time DATETIME NOT NULL,
    exit_time DATETIME NULL,
    status ENUM('active', 'paid', 'lost') NOT NULL DEFAULT 'active',
    amount_due DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(10,2) NULL,
    entry_guard_id INT UNSIGNED NOT NULL,
    exit_guard_id INT UNSIGNED NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tickets_token (ticket_token),
    KEY idx_tickets_plate (plate_no),
    KEY idx_tickets_status (status),
    KEY idx_tickets_entry_time (entry_time),
    KEY idx_tickets_card (card_id),
    CONSTRAINT fk_tickets_entry_guard FOREIGN KEY (entry_guard_id) REFERENCES users (id),
    CONSTRAINT fk_tickets_exit_guard FOREIGN KEY (exit_guard_id) REFERENCES users (id),
    CONSTRAINT fk_tickets_card FOREIGN KEY (card_id) REFERENCES cards (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rates (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    vehicle_type ENUM('Car', 'Motorcycle', 'Van') NOT NULL,
    grace_minutes INT UNSIGNED NOT NULL DEFAULT 15,
    first_hours DECIMAL(5,2) UNSIGNED NOT NULL DEFAULT 2.00,
    first_hours_rate DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 40.00,
    succeeding_rate DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 20.00,
    daily_cap DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 300.00,
    lost_ticket_fee DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 200.00,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_rates_vehicle_type (vehicle_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    action VARCHAR(80) NOT NULL,
    ticket_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_audit_user (user_id),
    KEY idx_audit_ticket (ticket_id),
    KEY idx_audit_created_at (created_at),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_audit_ticket FOREIGN KEY (ticket_id) REFERENCES vehicles_tickets (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (name, username, password_hash, role, created_at)
VALUES
    ('System Administrator', 'admin', '$2y$12$gm4MHlP534BU5XCzHLf/b.K/NpMSgWcJKkLJaw1hpmAF/zXmvwJBy', 'admin', NOW()),
    ('Entrance Guard', 'guard_entrance', '$2y$12$WZEiV1KhIx/KYbfdinbsceTJxLNbYETTAofUU7hmGBXUOyvIdbz0.', 'guard_entrance', NOW()),
    ('Exit Guard', 'guard_exit', '$2y$12$WZEiV1KhIx/KYbfdinbsceTJxLNbYETTAofUU7hmGBXUOyvIdbz0.', 'guard_exit', NOW())
ON DUPLICATE KEY UPDATE username = VALUES(username);

INSERT INTO rates (
    vehicle_type, grace_minutes, first_hours, first_hours_rate,
    succeeding_rate, daily_cap, lost_ticket_fee, updated_at
)
VALUES
    ('Car', 15, 2.00, 40.00, 20.00, 300.00, 200.00, NOW()),
    ('Motorcycle', 15, 2.00, 40.00, 20.00, 300.00, 200.00, NOW()),
    ('Van', 15, 2.00, 40.00, 20.00, 300.00, 200.00, NOW())
ON DUPLICATE KEY UPDATE vehicle_type = VALUES(vehicle_type);
