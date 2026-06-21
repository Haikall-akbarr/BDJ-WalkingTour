-- ============================================================
-- Migration: Ubah tipe data dari TEXT ke VARCHAR/INTEGER
-- untuk database Supabase (PostgreSQL) yang sudah ada
-- ============================================================
-- PENTING: Backup data Anda sebelum menjalankan script ini!
-- Jalankan script ini di Supabase SQL Editor.
-- Setelah selesai, jalankan: NOTIFY pgrst, 'reload schema';
-- ============================================================

-- =====================
-- TABEL: tours
-- =====================
ALTER TABLE tours ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE tours ALTER COLUMN name TYPE VARCHAR(191);
ALTER TABLE tours ALTER COLUMN date TYPE VARCHAR(64);
-- description tetap TEXT (konten panjang)
ALTER TABLE tours ALTER COLUMN distance TYPE VARCHAR(64);
ALTER TABLE tours ALTER COLUMN duration TYPE VARCHAR(64);

-- Kolom tambahan dari migration sebelumnya
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tours' AND column_name = 'price_reguler_desc') THEN
    ALTER TABLE tours ALTER COLUMN price_reguler_desc TYPE VARCHAR(255);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tours' AND column_name = 'price_hemat_desc') THEN
    ALTER TABLE tours ALTER COLUMN price_hemat_desc TYPE VARCHAR(255);
  END IF;
END $$;

-- route_map_url tetap TEXT (URL bisa sangat panjang, terutama dengan query params/token)
-- description_full, history_culture, history_highlights, route_detail, poi_list tetap TEXT

-- =====================
-- TABEL: tour_images
-- =====================
ALTER TABLE tour_images ALTER COLUMN id TYPE VARCHAR(64);
ALTER TABLE tour_images ALTER COLUMN tour_id TYPE VARCHAR(36);
-- url tetap TEXT (URL bisa sangat panjang)
ALTER TABLE tour_images ALTER COLUMN filename TYPE VARCHAR(255);
ALTER TABLE tour_images ALTER COLUMN uploaded_by TYPE VARCHAR(64);

-- =====================
-- TABEL: bookings
-- =====================
ALTER TABLE bookings ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE bookings ALTER COLUMN user_name TYPE VARCHAR(191);
ALTER TABLE bookings ALTER COLUMN user_whatsapp TYPE VARCHAR(64);
ALTER TABLE bookings ALTER COLUMN user_email TYPE VARCHAR(191);
ALTER TABLE bookings ALTER COLUMN domicile TYPE VARCHAR(128);
ALTER TABLE bookings ALTER COLUMN custom_domicile TYPE VARCHAR(191);
ALTER TABLE bookings ALTER COLUMN tour_id TYPE VARCHAR(36);
ALTER TABLE bookings ALTER COLUMN tour_name TYPE VARCHAR(191);
ALTER TABLE bookings ALTER COLUMN status TYPE VARCHAR(64);
ALTER TABLE bookings ALTER COLUMN payment_status TYPE VARCHAR(64);
ALTER TABLE bookings ALTER COLUMN payment_gateway TYPE VARCHAR(64);
ALTER TABLE bookings ALTER COLUMN payment_order_id TYPE VARCHAR(64);
ALTER TABLE bookings ALTER COLUMN payment_transaction_id TYPE VARCHAR(128);
-- payment_checkout_url tetap TEXT (URL checkout bisa panjang)
ALTER TABLE bookings ALTER COLUMN guide_id TYPE VARCHAR(64);
ALTER TABLE bookings ALTER COLUMN guide_name TYPE VARCHAR(191);
-- report tetap TEXT (laporan panjang)
ALTER TABLE bookings ALTER COLUMN attendance_code TYPE VARCHAR(64);
-- attendance_qr_image_url tetap TEXT (URL gambar base64 bisa sangat panjang)
ALTER TABLE bookings ALTER COLUMN attendance_scanned_by TYPE VARCHAR(64);
ALTER TABLE bookings ALTER COLUMN attendance_status TYPE VARCHAR(64);
-- participant_names tetap TEXT (daftar nama bisa panjang)

-- Kolom tambahan (report_reply)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'report_reply') THEN
    -- report_reply tetap TEXT (balasan laporan bisa panjang)
    NULL;
  END IF;
END $$;

-- =====================
-- TABEL: audit_logs
-- =====================
ALTER TABLE audit_logs ALTER COLUMN id TYPE VARCHAR(64);
ALTER TABLE audit_logs ALTER COLUMN action TYPE VARCHAR(191);
ALTER TABLE audit_logs ALTER COLUMN entity_type TYPE VARCHAR(64);
ALTER TABLE audit_logs ALTER COLUMN entity_id TYPE VARCHAR(64);
ALTER TABLE audit_logs ALTER COLUMN actor_id TYPE VARCHAR(64);
ALTER TABLE audit_logs ALTER COLUMN actor_role TYPE VARCHAR(32);
ALTER TABLE audit_logs ALTER COLUMN actor_name TYPE VARCHAR(191);
-- details tetap TEXT (detail log bisa panjang)

-- =====================
-- TABEL: users
-- =====================
ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(64);
ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(191);
ALTER TABLE users ALTER COLUMN name TYPE VARCHAR(191);
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(32);
ALTER TABLE users ALTER COLUMN password_hash TYPE VARCHAR(128);

-- =====================
-- TABEL: password_reset_tokens
-- =====================
ALTER TABLE password_reset_tokens ALTER COLUMN id TYPE VARCHAR(64);
ALTER TABLE password_reset_tokens ALTER COLUMN user_id TYPE VARCHAR(64);
ALTER TABLE password_reset_tokens ALTER COLUMN token_hash TYPE VARCHAR(128);

-- =====================
-- TABEL: sessions
-- =====================
ALTER TABLE sessions ALTER COLUMN id TYPE VARCHAR(64);
ALTER TABLE sessions ALTER COLUMN user_id TYPE VARCHAR(64);
ALTER TABLE sessions ALTER COLUMN token_hash TYPE VARCHAR(128);

-- =====================
-- TABEL: guides
-- =====================
ALTER TABLE guides ALTER COLUMN id TYPE VARCHAR(64);
ALTER TABLE guides ALTER COLUMN user_id TYPE VARCHAR(64);
ALTER TABLE guides ALTER COLUMN name TYPE VARCHAR(191);
ALTER TABLE guides ALTER COLUMN phone TYPE VARCHAR(20);
ALTER TABLE guides ALTER COLUMN email TYPE VARCHAR(191);
ALTER TABLE guides ALTER COLUMN specialization TYPE VARCHAR(191);
ALTER TABLE guides ALTER COLUMN availability_status TYPE VARCHAR(32);
-- bio tetap TEXT (biografi bisa panjang)

-- =====================
-- TABEL: guide_tour_assignments
-- =====================
ALTER TABLE guide_tour_assignments ALTER COLUMN id TYPE VARCHAR(64);
ALTER TABLE guide_tour_assignments ALTER COLUMN booking_id TYPE VARCHAR(36);
ALTER TABLE guide_tour_assignments ALTER COLUMN guide_id TYPE VARCHAR(64);
ALTER TABLE guide_tour_assignments ALTER COLUMN status TYPE VARCHAR(32);
-- notes tetap TEXT (catatan bisa panjang)

-- =====================
-- TABEL: notifications
-- =====================
ALTER TABLE notifications ALTER COLUMN id TYPE VARCHAR(64);
ALTER TABLE notifications ALTER COLUMN recipient_id TYPE VARCHAR(64);
ALTER TABLE notifications ALTER COLUMN type TYPE VARCHAR(32);
ALTER TABLE notifications ALTER COLUMN title TYPE VARCHAR(191);
-- message tetap TEXT (pesan bisa panjang)
ALTER TABLE notifications ALTER COLUMN related_id TYPE VARCHAR(64);
ALTER TABLE notifications ALTER COLUMN action_url TYPE VARCHAR(255);

-- =====================
-- TABEL: barcode_scans
-- =====================
ALTER TABLE barcode_scans ALTER COLUMN id TYPE VARCHAR(64);
ALTER TABLE barcode_scans ALTER COLUMN booking_id TYPE VARCHAR(36);
ALTER TABLE barcode_scans ALTER COLUMN guide_id TYPE VARCHAR(64);
ALTER TABLE barcode_scans ALTER COLUMN attendance_code TYPE VARCHAR(64);
ALTER TABLE barcode_scans ALTER COLUMN location TYPE VARCHAR(191);
-- notes tetap TEXT (catatan bisa panjang)

-- ============================================================
-- SELESAI! Jalankan perintah berikut untuk refresh API Supabase:
-- ============================================================
NOTIFY pgrst, 'reload schema';
