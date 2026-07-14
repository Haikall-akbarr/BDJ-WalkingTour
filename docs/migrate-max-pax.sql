-- Silakan jalankan query ini di SQL Editor pada dashboard Supabase Anda.
-- Ini akan menambahkan kolom 'max_pax' ke dalam tabel 'tours'
-- Default value diset ke 35 untuk data lama yang sudah ada.

ALTER TABLE tours ADD COLUMN max_pax INT DEFAULT 35;

-- Merefresh cache skema Supabase agar API segera mendeteksi kolom baru ini
NOTIFY pgrst, 'reload schema';
