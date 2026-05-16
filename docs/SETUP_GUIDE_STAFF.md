# Setup Guide untuk Admin, Owner, dan Guide Dashboard

Panduan lengkap untuk mengatur database, membuat akun staff, dan menggunakan dashboard yang telah diperbaharui.

## 1. DATABASE SETUP

### 1.1 Tabel Baru yang Diperlukan

Jalankan SQL queries berikut di MySQL Anda (127.0.0.1:3306):

```sql
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
```

### 1.2 Jalankan Queries

1. Buka MySQL client (MySQL Workbench, phpMyAdmin, atau command line)
2. Koneksikan ke database `bdj_walking_tour` (atau nama database Anda)
3. Copy-paste seluruh SQL query di atas dan execute

Pastikan tidak ada error. Jika sukses, Anda akan lihat pesan "Query OK".

---

## 2. MEMBUAT AKUN STAFF (Admin, Owner, Guide)

Ada dua cara untuk membuat akun staff:

### 2.1 Cara 1: Manual SQL Insert (Tercepat)

Jalankan SQL berikut untuk membuat 3 akun staff:

**Penting:** jangan pakai nilai password hash placeholder dari dokumen lama seperti `$2b$10$YourHashedPasswordHere`. Aplikasi login ini tidak memakai bcrypt di database; ia membandingkan nilai hash internal dari `hashPassword()`. Cara paling aman adalah pakai seed endpoint di langkah 2.2.

```sql
-- ADMIN Account
INSERT INTO users (id, email, name, role, password_hash, is_active) 
VALUES (
  'admin-user-1',
  'admin@bdjwalkingtour.com',
  'Administrator BDJ',
  'admin',
  '$2b$10$YourHashedPasswordHere', -- Ini akan kami ganti di langkah berikutnya
  1
);

-- OWNER Account
INSERT INTO users (id, email, name, role, password_hash, is_active) 
VALUES (
  'owner-user-1',
  'owner@bdjwalkingtour.com',
  'Pemilik Tour BDJ',
  'owner',
  '$2b$10$YourHashedPasswordHere',
  1
);

-- GUIDE Account
INSERT INTO users (id, email, name, role, password_hash, is_active) 
VALUES (
  'guide-user-1',
  'guide@bdjwalkingtour.com',
  'Pemandu Wisata Budi',
  'guide',
  '$2b$10$YourHashedPasswordHere',
  1
);

-- Jika ada guide tambahan
INSERT INTO users (id, email, name, role, password_hash, is_active) 
VALUES (
  'guide-user-2',
  'guide2@bdjwalkingtour.com',
  'Pemandu Wisata Siti',
  'guide',
  '$2b$10$YourHashedPasswordHere',
  1
);
```

**PENTING**: Jika tetap ingin memakai SQL manual, isi `password_hash` dengan nilai hash yang benar-benar dihasilkan oleh aplikasi, bukan hash bcrypt placeholder dari internet.

### 2.2 Cara 2: Seed Otomatis Staff Accounts

Kalau Anda tidak mau membuat hash manual, jalankan endpoint seed lokal berikut:

```bash
curl -X POST http://localhost:9002/api/auth/seed
```

Atau kirim `POST` request kosong ke endpoint tersebut lewat Postman / API client.

Seed ini akan membuat akun berikut secara otomatis:
- Admin: `admin@bdjwalkingtour.com` / `admin123`
- Owner: `owner@bdjwalkingtour.com` / `owner123`
- Guide: `guide@bdjwalkingtour.com` / `guide123`
- User test: `user@bdjwalkingtour.com` / `user123`

### 2.3 Jika Anda Mendaftar Lewat Form Register

Form register memang khusus peserta, jadi role-nya akan tetap `user`.

Kalau akun sudah terlanjur dibuat sebagai peserta, ubah role-nya dengan SQL berikut:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@bdjwalkingtour.com';
UPDATE users SET role = 'owner' WHERE email = 'owner@bdjwalkingtour.com';
UPDATE users SET role = 'guide' WHERE email = 'guide@bdjwalkingtour.com';
```

### 2.4 Credentials untuk Testing (Jika menggunakan seed atau SQL Insert)

Simpan credentials ini untuk testing:

| Role | Email | Password | Akses |
|------|-------|----------|-------|
| Admin | `admin@bdjwalkingtour.com` | `admin123` | http://localhost:9002/dashboard/admin |
| Owner | `owner@bdjwalkingtour.com` | `owner123` | http://localhost:9002/dashboard/owner |
| Guide 1 | `guide@bdjwalkingtour.com` | `guide123` | http://localhost:9002/dashboard/guide |
| Guide 2 | `guide2@bdjwalkingtour.com` | `guide123` | http://localhost:9002/dashboard/guide |

---

## 3. TESTING DASHBOARD

### 3.1 Admin Dashboard (`/dashboard/admin`)

**Fungsi:**
- ✅ Melihat semua tour yang tersedia
- ✅ Tambah tour baru
- ✅ Edit tour (nama, harga, deskripsi, jarak, durasi)
- ✅ Hapus tour
- ✅ Melihat semua booking/pemesanan
- ✅ Melihat laporan attendance

**Langkah Testing:**
1. Login dengan admin@bdjwalkingtour.com / admin123
2. Pergi ke /dashboard/admin
3. Tab "Tur": 
   - Klik "Tambah Tur Baru"
   - Isi form: Nama, Harga, Deskripsi, Jarak, Durasi
   - Klik "Simpan"
4. Edit/Hapus: Klik icon edit atau trash di tour yang ada
5. Tab "Pemesanan": Lihat semua booking yang masuk

### 3.2 Owner Dashboard (`/dashboard/owner`)

**Fungsi:**
- ✅ Lihat semua pemesanan yang perlu guide
- ✅ Assign guide ke setiap pemesanan
- ✅ Lihat status penugasan guide
- ✅ Monitor tour yang sedang berlangsung

**Langkah Testing:**
1. Login dengan owner@bdjwalkingtour.com / owner123
2. Pergi ke /dashboard/owner
3. Tab "Pemesanan": Lihat daftar pemesanan yang belum ada guide
4. Klik "Pilih Guide" pada pemesanan
5. Pilih guide dari dropdown list
6. Klik "Assign" untuk menetapkan guide

### 3.3 Guide Dashboard (`/dashboard/guide`)

**Fungsi:**
- ✅ Lihat tour yang di-assign ke guide
- ✅ Scan barcode QR code dari peserta
- ✅ Catat kehadiran (attendance)
- ✅ Buat laporan tour
- ✅ Download laporan sebagai Excel
- ✅ Terima notifikasi pembayaran dan penugasan

**Langkah Testing:**
1. Login dengan guide@bdjwalkingtour.com / guide123
2. Pergi ke /dashboard/guide
3. Tab "Penugasan": Lihat tour yang di-assign
4. Tab "Scan Barcode":
   - Klik "Buka Scanner"
   - Arahkan kamera ke barcode QR peserta (atau copy-paste attendance code)
   - Sistem akan mencatat kehadiran otomatis
5. Tab "Laporan":
   - Isi form laporan tour (peserta yang hadir, catatan, rating)
   - Klik "Kirim Laporan"
   - Download laporan sebagai Excel

---

## 4. FITUR NOTIFIKASI BELL

Di navbar (kanan atas), ada icon lonceng (bell) yang menampilkan:
- ✅ Notifikasi pembayaran diterima
- ✅ Barcode dikirim ke email
- ✅ Guide telah assign
- ✅ Laporan tour selesai
- ✅ Absen/attendance recorded

Klik bell icon untuk melihat notifikasi terbaru.

---

## 5. EXPORT DATA KE EXCEL

### Guide Report Export

Di Guide Dashboard, tab "Laporan":
1. Isi detail tour (peserta, catatan, rating)
2. Klik "Download Excel"
3. File akan di-download dengan nama: `laporan_tour_[tour_id]_[date].xlsx`

Format Excel berisi:
- Nama Tour
- Tanggal Tour
- Jumlah Peserta
- Detail Peserta (Nama, Email, WhatsApp)
- Kehadiran (Check-in time)
- Catatan Guide
- Rating & Feedback

---

## 6. TROUBLESHOOTING

### Database Connection Error

**Error:** `getaddrinfo ENOTFOUND bdj-walking-...`

**Fix:** 
- Pastikan `.env.local` sudah benar:
  ```
  MYSQL_HOST=127.0.0.1
  MYSQL_PORT=3306
  MYSQL_USER=root
  MYSQL_PASSWORD=
  MYSQL_DATABASE=bdj_walking_tour
  ```
- Restart dev server: `npm run dev`

### Login Tidak Bekerja

**Error:** Email atau password salah

**Fix:**
- Pastikan email sudah ada di tabel `users`
- Pastikan password hash benar (gunakan https://bcrypt.online/ untuk verify)
- Cek bahwa role sudah di-set (admin, owner, guide, atau user)

### Dashboard Tidak Muncul

**Error:** Blank page atau redirect ke home

**Fix:**
- Pastikan Anda login dengan akun yang benar
- Pastikan role user sesuai dengan dashboard yang diakses
- Buka console browser (F12) untuk melihat error detail
- Cek bahwa session cookie tersimpan dengan benar

### Notifikasi Tidak Muncul

**Error:** Bell icon tidak ada notifikasi baru

**Fix:**
- Pastikan booking telah dibuat dan pembayaran dikonfirmasi
- Cek tabel `notifications` apakah ada data
- Refresh browser untuk melihat notifikasi terbaru

---

## 7. NEXT STEPS

Setelah setup selesai, testing bisa dilakukan dengan flow berikut:

1. **User** membuat akun dan pesan tour
2. **User** melakukan pembayaran via Pakasir
3. **Admin** verifikasi pembayaran (otomatis)
4. **User** terima barcode QR via email
5. **Owner** assign guide untuk booking
6. **Guide** menerima notifikasi penugasan
7. **Guide** pada hari tour, buka scanner dan scan barcode peserta
8. **Guide** submit laporan tour
9. **Owner/Admin** download laporan sebagai Excel

---

## File Support

- Database schema: `docs/mysql-schema.sql`
- API docs: Lihat di `docs/backend.json`
- Payment flow: `docs/payment-barcode-flow.md`

Pertanyaan? Hubungi support atau cek error console untuk detail lebih lanjut.
