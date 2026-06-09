CREATE TABLE IF NOT EXISTS tours (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  price INT NOT NULL DEFAULT 0,
  price_hemat INT NULL,
  date VARCHAR(64) NULL,
  description TEXT NULL,
  distance VARCHAR(64) NULL,
  duration VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tours_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tour_images (
  id VARCHAR(64) PRIMARY KEY,
  tour_id VARCHAR(36) NOT NULL,
  url TEXT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  is_cover TINYINT(1) NOT NULL DEFAULT 0,
  uploaded_by VARCHAR(64) NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tour_images_tour_id (tour_id),
  CONSTRAINT fk_tour_images_tour FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(36) PRIMARY KEY,
  user_name VARCHAR(191) NOT NULL,
  user_whatsapp VARCHAR(64) NOT NULL,
  user_email VARCHAR(191) NULL,
  domicile VARCHAR(128) NOT NULL,
  custom_domicile VARCHAR(191) NULL,
  tour_id VARCHAR(36) NOT NULL,
  tour_name VARCHAR(191) NOT NULL,
  pax INT NOT NULL DEFAULT 1,
  price_per_pax INT NOT NULL DEFAULT 0,
  gross_amount INT NOT NULL DEFAULT 0,
  status VARCHAR(64) NOT NULL DEFAULT 'pending_payment',
  payment_status VARCHAR(64) NOT NULL DEFAULT 'pending_payment',
  payment_gateway VARCHAR(64) NOT NULL DEFAULT 'dummy',
  payment_order_id VARCHAR(64) NULL,
  payment_transaction_id VARCHAR(128) NULL,
  payment_checkout_url TEXT NULL,
  guide_id VARCHAR(64) NULL,
  guide_name VARCHAR(191) NULL,
  report TEXT NULL,
  report_submitted_at DATETIME NULL,
  attendance_code VARCHAR(64) NULL,
  attendance_qr_image_url TEXT NULL,
  attendance_scanned_at DATETIME NULL,
  attendance_scanned_by VARCHAR(64) NULL,
  attendance_status VARCHAR(64) NULL,
  paid_at DATETIME NULL,
  barcode_sent_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_payment_status (payment_status),
  INDEX idx_bookings_tour (tour_id),
  INDEX idx_bookings_guide_id (guide_id),
  UNIQUE KEY uq_bookings_attendance_code (attendance_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  action VARCHAR(191) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  actor_id VARCHAR(64) NULL,
  actor_role VARCHAR(32) NULL,
  actor_name VARCHAR(191) NULL,
  details TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_logs_created_at (created_at),
  INDEX idx_audit_logs_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  name VARCHAR(191) NOT NULL,
  role VARCHAR(32) NOT NULL,
  password_hash VARCHAR(128) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_password_reset_tokens_user_id (user_id),
  INDEX idx_password_reset_tokens_expires_at (expires_at),
  CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_expires_at (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel untuk menyimpan data guide (pemandu wisata)
CREATE TABLE IF NOT EXISTS guides (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(191) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(191) NOT NULL,
  specialization VARCHAR(191) NULL COMMENT 'e.g., Pacinan, Heritage, Modern',
  availability_status VARCHAR(32) NOT NULL DEFAULT 'available',
  total_tours_led INT NOT NULL DEFAULT 0,
  average_rating DECIMAL(3, 2) NULL,
  bio TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_guides_user_id (user_id),
  INDEX idx_guides_availability (availability_status),
  CONSTRAINT fk_guides_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel untuk assignment guide ke tour
CREATE TABLE IF NOT EXISTS guide_tour_assignments (
  id VARCHAR(64) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL,
  guide_id VARCHAR(64) NOT NULL,
  tour_date DATETIME NOT NULL,
  pax_count INT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending' COMMENT 'pending, accepted, completed, cancelled',
  notes TEXT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_assignment_booking (booking_id),
  INDEX idx_assignments_guide_id (guide_id),
  INDEX idx_assignments_status (status),
  CONSTRAINT fk_assignment_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_guide FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel untuk notifikasi real-time
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  recipient_id VARCHAR(64) NOT NULL,
  type VARCHAR(32) NOT NULL COMMENT 'booking_confirmed, payment_received, barcode_scanned, tour_completed, guide_assigned, message',
  title VARCHAR(191) NOT NULL,
  message TEXT NOT NULL,
  related_id VARCHAR(64) NULL COMMENT 'booking_id, guide_id, tour_id, etc',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  action_url VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  INDEX idx_notifications_recipient (recipient_id),
  INDEX idx_notifications_type (type),
  INDEX idx_notifications_is_read (is_read),
  INDEX idx_notifications_created (created_at),
  CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel untuk pencatatan scan barcode oleh guide
CREATE TABLE IF NOT EXISTS barcode_scans (
  id VARCHAR(64) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL,
  guide_id VARCHAR(64) NOT NULL,
  attendance_code VARCHAR(64) NOT NULL,
  scanned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  location VARCHAR(191) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_scans_booking (booking_id),
  INDEX idx_scans_guide (guide_id),
  INDEX idx_scans_scanned_at (scanned_at),
  CONSTRAINT fk_scans_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_scans_guide FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
