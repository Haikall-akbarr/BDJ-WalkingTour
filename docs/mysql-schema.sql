CREATE TABLE IF NOT EXISTS tours (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  price INT NOT NULL DEFAULT 0,
  date VARCHAR(64) NULL,
  description TEXT NULL,
  distance VARCHAR(64) NULL,
  duration VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tours_name (name)
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


