-- ============================================
-- JALANKAN SEMUA QUERY INI DI SUPABASE SQL EDITOR
-- ============================================

-- 1. Tambah kolom emergency_contact (jika belum ada)
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(64) NULL;

-- 2. PENTING: Reload PostgREST schema cache agar kolom baru dikenali
NOTIFY pgrst, 'reload schema';
