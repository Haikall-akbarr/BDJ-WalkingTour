-- Supabase / PostgreSQL schema for BDJ WalkingTour
-- Run this in Supabase SQL Editor before switching DB_PROVIDER to supabase.
-- Tipe data sudah disesuaikan dengan best practice (VARCHAR, INTEGER, BOOLEAN, dll)

create table if not exists tours (
  id VARCHAR(36) primary key,
  name VARCHAR(191) not null,
  price INTEGER not null default 0,
  price_hemat INTEGER null,
  price_reguler_desc VARCHAR(255) null,
  price_hemat_desc VARCHAR(255) null,
  date VARCHAR(64) null,
  description TEXT null,
  distance VARCHAR(64) null,
  duration VARCHAR(64) null,
  description_full TEXT null,
  history_culture TEXT null,
  history_highlights TEXT null,
  route_detail TEXT null,
  route_map_url TEXT null,
  poi_list TEXT null,
  created_at TIMESTAMPTZ not null default now(),
  updated_at TIMESTAMPTZ not null default now()
);

create index if not exists idx_tours_name on tours (name);

create table if not exists tour_images (
  id VARCHAR(64) primary key,
  tour_id VARCHAR(36) not null references tours(id) on delete cascade,
  url TEXT not null,
  filename VARCHAR(255) not null,
  is_cover BOOLEAN not null default false,
  uploaded_by VARCHAR(64) null,
  uploaded_at TIMESTAMPTZ not null default now()
);

create index if not exists idx_tour_images_tour_id on tour_images (tour_id);

create table if not exists bookings (
  id VARCHAR(36) primary key,
  user_name VARCHAR(191) not null,
  user_whatsapp VARCHAR(64) not null,
  user_email VARCHAR(191) null,
  domicile VARCHAR(128) not null,
  custom_domicile VARCHAR(191) null,
  tour_id VARCHAR(36) not null,
  tour_name VARCHAR(191) not null,
  pax INTEGER not null default 1,
  price_per_pax INTEGER not null default 0,
  gross_amount INTEGER not null default 0,
  status VARCHAR(64) not null default 'pending_payment',
  payment_status VARCHAR(64) not null default 'pending_payment',
  payment_gateway VARCHAR(64) not null default 'dummy',
  payment_order_id VARCHAR(64) null,
  payment_transaction_id VARCHAR(128) null,
  payment_checkout_url TEXT null,
  guide_id VARCHAR(64) null,
  guide_name VARCHAR(191) null,
  report TEXT null,
  report_submitted_at TIMESTAMPTZ null,
  report_reply TEXT null,
  report_reply_submitted_at TIMESTAMPTZ null,
  attendance_code VARCHAR(64) null unique,
  attendance_qr_image_url TEXT null,
  attendance_scanned_at TIMESTAMPTZ null,
  attendance_scanned_by VARCHAR(64) null,
  attendance_status VARCHAR(64) null,
  paid_at TIMESTAMPTZ null,
  barcode_sent_at TIMESTAMPTZ null,
  participant_names TEXT null,
  created_at TIMESTAMPTZ not null default now(),
  updated_at TIMESTAMPTZ not null default now()
);

create index if not exists idx_bookings_status on bookings (status);
create index if not exists idx_bookings_payment_status on bookings (payment_status);
create index if not exists idx_bookings_tour on bookings (tour_id);
create index if not exists idx_bookings_guide_id on bookings (guide_id);

create table if not exists audit_logs (
  id VARCHAR(64) primary key,
  action VARCHAR(191) not null,
  entity_type VARCHAR(64) not null,
  entity_id VARCHAR(64) not null,
  actor_id VARCHAR(64) null,
  actor_role VARCHAR(32) null,
  actor_name VARCHAR(191) null,
  details TEXT null,
  created_at TIMESTAMPTZ not null default now()
);

create index if not exists idx_audit_logs_created_at on audit_logs (created_at);
create index if not exists idx_audit_logs_entity on audit_logs (entity_type, entity_id);

create table if not exists users (
  id VARCHAR(64) primary key,
  email VARCHAR(191) not null unique,
  name VARCHAR(191) not null,
  role VARCHAR(32) not null,
  password_hash VARCHAR(128) not null,
  emergency_contact VARCHAR(64) null,
  is_active BOOLEAN not null default true,
  created_at TIMESTAMPTZ not null default now(),
  updated_at TIMESTAMPTZ not null default now()
);

create index if not exists idx_users_role on users (role);

create table if not exists password_reset_tokens (
  id VARCHAR(64) primary key,
  user_id VARCHAR(64) not null references users(id) on delete cascade,
  token_hash VARCHAR(128) not null unique,
  expires_at TIMESTAMPTZ not null,
  used_at TIMESTAMPTZ null,
  created_at TIMESTAMPTZ not null default now()
);

create index if not exists idx_password_reset_tokens_user_id on password_reset_tokens (user_id);
create index if not exists idx_password_reset_tokens_expires_at on password_reset_tokens (expires_at);

create table if not exists sessions (
  id VARCHAR(64) primary key,
  user_id VARCHAR(64) not null references users(id) on delete cascade,
  token_hash VARCHAR(128) not null unique,
  expires_at TIMESTAMPTZ not null,
  created_at TIMESTAMPTZ not null default now(),
  last_seen_at TIMESTAMPTZ not null default now()
);

create index if not exists idx_sessions_user_id on sessions (user_id);
create index if not exists idx_sessions_expires_at on sessions (expires_at);

create table if not exists guides (
  id VARCHAR(64) primary key,
  user_id VARCHAR(64) not null unique references users(id) on delete cascade,
  name VARCHAR(191) not null,
  phone VARCHAR(20) not null,
  email VARCHAR(191) not null,
  specialization VARCHAR(191) null,
  availability_status VARCHAR(32) not null default 'available',
  total_tours_led INTEGER not null default 0,
  average_rating NUMERIC(3, 2) null,
  bio TEXT null,
  is_active BOOLEAN not null default true,
  created_at TIMESTAMPTZ not null default now(),
  updated_at TIMESTAMPTZ not null default now()
);

create index if not exists idx_guides_user_id on guides (user_id);
create index if not exists idx_guides_availability on guides (availability_status);

create table if not exists guide_tour_assignments (
  id VARCHAR(64) primary key,
  booking_id VARCHAR(36) not null references bookings(id) on delete cascade,
  guide_id VARCHAR(64) not null references guides(id) on delete cascade,
  tour_date TIMESTAMPTZ not null,
  pax_count INTEGER not null,
  status VARCHAR(32) not null default 'pending',
  notes TEXT null,
  assigned_at TIMESTAMPTZ not null default now(),
  accepted_at TIMESTAMPTZ null,
  completed_at TIMESTAMPTZ null,
  created_at TIMESTAMPTZ not null default now(),
  updated_at TIMESTAMPTZ not null default now(),
  unique (booking_id)
);

create index if not exists idx_assignments_guide_id on guide_tour_assignments (guide_id);
create index if not exists idx_assignments_status on guide_tour_assignments (status);

create table if not exists notifications (
  id VARCHAR(64) primary key,
  recipient_id VARCHAR(64) not null references users(id) on delete cascade,
  type VARCHAR(32) not null,
  title VARCHAR(191) not null,
  message TEXT not null,
  related_id VARCHAR(64) null,
  is_read BOOLEAN not null default false,
  action_url VARCHAR(255) null,
  created_at TIMESTAMPTZ not null default now(),
  read_at TIMESTAMPTZ null
);

create index if not exists idx_notifications_recipient on notifications (recipient_id);
create index if not exists idx_notifications_type on notifications (type);
create index if not exists idx_notifications_is_read on notifications (is_read);
create index if not exists idx_notifications_created on notifications (created_at);

create table if not exists barcode_scans (
  id VARCHAR(64) primary key,
  booking_id VARCHAR(36) not null references bookings(id) on delete cascade,
  guide_id VARCHAR(64) not null references guides(id) on delete cascade,
  attendance_code VARCHAR(64) not null,
  scanned_at TIMESTAMPTZ not null default now(),
  location VARCHAR(191) null,
  notes TEXT null,
  created_at TIMESTAMPTZ not null default now()
);

create index if not exists idx_scans_booking on barcode_scans (booking_id);
create index if not exists idx_scans_guide on barcode_scans (guide_id);
create index if not exists idx_scans_scanned_at on barcode_scans (scanned_at);
