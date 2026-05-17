-- Supabase / PostgreSQL schema for BDJ WalkingTour
-- Run this in Supabase SQL Editor before switching DB_PROVIDER to supabase.

create table if not exists tours (
  id text primary key,
  name text not null,
  price integer not null default 0,
  date text null,
  description text null,
  distance text null,
  duration text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tours_name on tours (name);

create table if not exists tour_images (
  id text primary key,
  tour_id text not null references tours(id) on delete cascade,
  url text not null,
  filename text not null,
  is_cover boolean not null default false,
  uploaded_by text null,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_tour_images_tour_id on tour_images (tour_id);

create table if not exists bookings (
  id text primary key,
  user_name text not null,
  user_whatsapp text not null,
  user_email text null,
  domicile text not null,
  custom_domicile text null,
  tour_id text not null,
  tour_name text not null,
  pax integer not null default 1,
  price_per_pax integer not null default 0,
  gross_amount integer not null default 0,
  status text not null default 'pending_payment',
  payment_status text not null default 'pending_payment',
  payment_gateway text not null default 'dummy',
  payment_order_id text null,
  payment_transaction_id text null,
  payment_checkout_url text null,
  guide_id text null,
  guide_name text null,
  report text null,
  report_submitted_at timestamptz null,
  attendance_code text null unique,
  attendance_qr_image_url text null,
  attendance_scanned_at timestamptz null,
  attendance_scanned_by text null,
  attendance_status text null,
  paid_at timestamptz null,
  barcode_sent_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookings_status on bookings (status);
create index if not exists idx_bookings_payment_status on bookings (payment_status);
create index if not exists idx_bookings_tour on bookings (tour_id);
create index if not exists idx_bookings_guide_id on bookings (guide_id);

create table if not exists audit_logs (
  id text primary key,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  actor_id text null,
  actor_role text null,
  actor_name text null,
  details text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on audit_logs (created_at);
create index if not exists idx_audit_logs_entity on audit_logs (entity_type, entity_id);

create table if not exists users (
  id text primary key,
  email text not null unique,
  name text not null,
  role text not null,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_role on users (role);

create table if not exists password_reset_tokens (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_reset_tokens_user_id on password_reset_tokens (user_id);
create index if not exists idx_password_reset_tokens_expires_at on password_reset_tokens (expires_at);

create table if not exists sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_id on sessions (user_id);
create index if not exists idx_sessions_expires_at on sessions (expires_at);

create table if not exists guides (
  id text primary key,
  user_id text not null unique references users(id) on delete cascade,
  name text not null,
  phone text not null,
  email text not null,
  specialization text null,
  availability_status text not null default 'available',
  total_tours_led integer not null default 0,
  average_rating numeric(3, 2) null,
  bio text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_guides_user_id on guides (user_id);
create index if not exists idx_guides_availability on guides (availability_status);

create table if not exists guide_tour_assignments (
  id text primary key,
  booking_id text not null references bookings(id) on delete cascade,
  guide_id text not null references guides(id) on delete cascade,
  tour_date timestamptz not null,
  pax_count integer not null,
  status text not null default 'pending',
  notes text null,
  assigned_at timestamptz not null default now(),
  accepted_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id)
);

create index if not exists idx_assignments_guide_id on guide_tour_assignments (guide_id);
create index if not exists idx_assignments_status on guide_tour_assignments (status);

create table if not exists notifications (
  id text primary key,
  recipient_id text not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  related_id text null,
  is_read boolean not null default false,
  action_url text null,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists idx_notifications_recipient on notifications (recipient_id);
create index if not exists idx_notifications_type on notifications (type);
create index if not exists idx_notifications_is_read on notifications (is_read);
create index if not exists idx_notifications_created on notifications (created_at);

create table if not exists barcode_scans (
  id text primary key,
  booking_id text not null references bookings(id) on delete cascade,
  guide_id text not null references guides(id) on delete cascade,
  attendance_code text not null,
  scanned_at timestamptz not null default now(),
  location text null,
  notes text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_scans_booking on barcode_scans (booking_id);
create index if not exists idx_scans_guide on barcode_scans (guide_id);
create index if not exists idx_scans_scanned_at on barcode_scans (scanned_at);
