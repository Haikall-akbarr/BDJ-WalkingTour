# Pengujian Black Box Testing

## Aplikasi: BDJ WalkingTour — Sistem Pemesanan Tur Jalan Kaki Banjarmasin

**Tanggal Pengujian:** ___________________  
**Penguji:** ___________________  
**Versi Aplikasi:** BDJ WalkingTour v1.0  
**Lingkungan Pengujian:** Browser (Chrome/Firefox/Safari) — Desktop & Mobile

---

## Keterangan Status

| Status | Keterangan |
|:------:|:-----------|
| ✅ Berhasil | Fungsi berjalan sesuai harapan |
| ❌ Gagal | Fungsi tidak berjalan sesuai harapan |

---

## 1. Pengujian Halaman Publik (Landing Page)

| No | Skenario Pengujian | Langkah Pengujian | Data Masukan | Hasil yang Diharapkan | Hasil Pengujian | Status |
|:--:|:-------------------|:-------------------|:-------------|:----------------------|:----------------|:------:|
| 1 | Menampilkan halaman utama | Buka URL root `/` aplikasi | — | Halaman landing page tampil dengan hero image, statistik (Travelers Hosted, Guided Walks, Trusted Reviews), daftar tur, dan footer | | |
| 2 | Menampilkan daftar tur | Scroll ke bagian "Pilihan Tur" | — | Minimal 3 kartu tur ditampilkan dengan nama, harga, dan gambar | | |
| 3 | Navigasi ke detail tur | Klik salah satu kartu tur pada landing page | — | Pengguna diarahkan ke halaman `/tours/[id]` dengan informasi detail tur | | |
| 4 | Navigasi ke halaman semua tur | Klik tombol "Lihat Semua Tur" | — | Pengguna diarahkan ke halaman `/tours` yang menampilkan seluruh daftar tur | | |
| 5 | Menampilkan section destinasi | Scroll ke bagian "Pilihan Destinasi" | — | Section menampilkan galeri gambar tur dan tombol "Jelajahi Rute" | | |
| 6 | Menampilkan detail jadwal tur | Scroll ke bagian "Pilihan Jadwal Terbaru" | — | Setiap tur menampilkan tanggal, jarak, durasi, dan deskripsi | | |

---

## 2. Pengujian Halaman Daftar Tur (`/tours`)

| No | Skenario Pengujian | Langkah Pengujian | Data Masukan | Hasil yang Diharapkan | Hasil Pengujian | Status |
|:--:|:-------------------|:-------------------|:-------------|:----------------------|:----------------|:------:|
| 7 | Menampilkan semua tur yang tersedia | Buka halaman `/tours` | — | Daftar semua tur dari database tampil dalam bentuk kartu | | |
| 8 | Melihat detail tur | Klik kartu tur tertentu | — | Halaman detail tur (`/tours/[id]`) tampil dengan informasi lengkap: nama, harga reguler/hemat, jarak, durasi, deskripsi, highlight, peta rute, dan POI | | |
| 9 | Navigasi ke booking dari detail tur | Klik tombol "Pesan Sekarang" di halaman detail tur | — | Pengguna diarahkan ke halaman booking (`/book/[id]`) | | |

---

## 3. Pengujian Autentikasi (Login & Registrasi)

| No | Skenario Pengujian | Langkah Pengujian | Data Masukan | Hasil yang Diharapkan | Hasil Pengujian | Status |
|:--:|:-------------------|:-------------------|:-------------|:----------------------|:----------------|:------:|
| 10 | Login peserta dengan email dan password yang benar | Buka `/login`, isi email dan password, klik "Masuk" | Email: `user@bdjwalkingtour.com`, Password: `user123` | Login berhasil dan diarahkan ke dashboard user (`/dashboard/user`) | | |
| 11 | Login peserta dengan password salah | Buka `/login`, isi email benar dan password salah, klik "Masuk" | Email: `user@bdjwalkingtour.com`, Password: `salah123` | Muncul pesan error bahwa email atau password tidak valid | | |
| 12 | Login peserta dengan email tidak terdaftar | Buka `/login`, isi email yang tidak ada, klik "Masuk" | Email: `tidak@ada.com`, Password: `test123` | Muncul pesan error bahwa akun tidak ditemukan | | |
| 13 | Login peserta dengan field kosong | Buka `/login`, langsung klik "Masuk" tanpa mengisi form | Email: _(kosong)_, Password: _(kosong)_ | Muncul validasi bahwa email dan password wajib diisi | | |
| 14 | Login staff (Admin) | Buka `/login?mode=staff`, isi kredensial admin | Email: `admin@bdjwalkingtour.com`, Password: `admin123` | Login berhasil dan diarahkan ke dashboard admin (`/dashboard/admin`) | | |
| 15 | Login staff (Guide) | Buka `/login?mode=staff`, isi kredensial guide | Email: `guide@bdjwalkingtour.com`, Password: `guide123` | Login berhasil dan diarahkan ke dashboard guide (`/dashboard/guide`) | | |
| 16 | Login staff (Owner) | Buka `/login?mode=staff`, isi kredensial owner | Email: `owner@bdjwalkingtour.com`, Password: `owner123` | Login berhasil dan diarahkan ke dashboard owner (`/dashboard/owner`) | | |
| 17 | Registrasi akun baru | Buka `/login`, klik "Buat Akun Baru", isi form registrasi | Nama, Email baru, Password | Akun berhasil dibuat dan pengguna bisa login | | |
| 18 | Reset password | Buka halaman login, klik "Lupa Password", isi email | Email terdaftar | Email reset password terkirim ke email pengguna | | |
| 19 | Logout | Klik tombol "Keluar" di dashboard | — | Pengguna berhasil logout, sesi dihapus, dan diarahkan ke halaman utama | | |

---

## 4. Pengujian Pemesanan Tur (Booking)

| No | Skenario Pengujian | Langkah Pengujian | Data Masukan | Hasil yang Diharapkan | Hasil Pengujian | Status |
|:--:|:-------------------|:-------------------|:-------------|:----------------------|:----------------|:------:|
| 20 | Membuat pemesanan tur baru | Login sebagai user, buka `/book/[id]`, isi form pemesanan (nama, WhatsApp, jumlah peserta), klik "Lanjutkan" | Nama: "Tes User", WA: "08123456789", Pax: 2 | Pemesanan berhasil dibuat dan diarahkan ke halaman pembayaran | | |
| 21 | Membuat pemesanan tanpa login | Akses halaman booking tanpa login | — | Pengguna diminta untuk login terlebih dahulu atau diarahkan ke halaman login | | |
| 22 | Pemesanan dengan field kosong | Buka halaman booking, langsung klik "Lanjutkan" tanpa mengisi form | Field kosong | Muncul validasi bahwa field wajib harus diisi | | |
| 23 | Melihat riwayat pemesanan | Login sebagai user, buka dashboard user | — | Daftar pemesanan milik user tampil dengan status pembayaran (Belum Bayar / Sudah Bayar / Dibatalkan) | | |

---

## 5. Pengujian Pembayaran (Payment)

| No | Skenario Pengujian | Langkah Pengujian | Data Masukan | Hasil yang Diharapkan | Hasil Pengujian | Status |
|:--:|:-------------------|:-------------------|:-------------|:----------------------|:----------------|:------:|
| 24 | Pembayaran mode dummy | Set env `PAYMENT_MODE=dummy`, buat booking, klik "Bayar" | — | Simulasi pembayaran berhasil, status booking berubah menjadi "Paid" | | |
| 25 | Pembayaran mode manual | Set env `PAYMENT_MODE=manual`, buat booking | — | Pengguna diarahkan ke halaman transfer manual dengan informasi bank, nomor rekening, dan QR code | | |
| 26 | Halaman sukses pembayaran | Setelah pembayaran berhasil, lihat halaman sukses | — | Halaman `/payments/success/[id]` tampil dengan detail booking, barcode/QR absensi, dan opsi kirim email | | |

---

## 6. Pengujian Dashboard Admin (`/dashboard/admin`)

| No | Skenario Pengujian | Langkah Pengujian | Data Masukan | Hasil yang Diharapkan | Hasil Pengujian | Status |
|:--:|:-------------------|:-------------------|:-------------|:----------------------|:----------------|:------:|
| 27 | Menampilkan dashboard admin | Login sebagai admin, buka `/dashboard/admin` | — | Dashboard tampil dengan tab Pemesanan, Kelola Tur, Kelola Pengguna, dan Log Aktivitas | | |
| 28 | Melihat daftar semua pemesanan | Klik tab "Pemesanan Pending" | — | Tabel pemesanan tampil dengan kolom Pelanggan, Tur, Pax, Tanggal, dan Status | | |
| 29 | Filter booking berdasarkan status | Klik tombol filter "Belum Bayar" / "Sudah Bayar" / "Dibatalkan" | — | Tabel pemesanan hanya menampilkan data sesuai filter yang dipilih | | |
| 30 | Pencarian pemesanan | Ketik nama pelanggan atau nama tur di kolom pencarian | Keyword: "Pacinan" | Tabel hanya menampilkan booking yang mengandung kata kunci | | |
| 31 | Ekspor data booking ke Excel | Klik tombol "Excel" | — | File `.xlsx` berhasil diunduh dengan data pemesanan | | |
| 32 | Ekspor data booking ke PDF | Klik tombol "PDF" | — | File `.pdf` berhasil diunduh dengan data pemesanan dalam format tabel | | |
| 33 | Menambahkan tur baru | Klik tab "Kelola Tur", klik "Paket Tur Baru", isi form (nama, harga, deskripsi, jarak, durasi, highlight, POI), klik simpan | Nama: "Tur Baru Test", Harga: 75000 | Tur berhasil ditambahkan dan muncul di daftar tur | | |
| 34 | Mengedit tur yang ada | Klik tombol edit (ikon pensil) pada kartu tur, ubah data, klik simpan | Ubah harga dari 65000 menjadi 70000 | Data tur berhasil diperbarui | | |
| 35 | Menghapus tur | Klik tombol hapus (ikon trash) pada kartu tur, konfirmasi penghapusan | — | Tur berhasil dihapus dari daftar | | |
| 36 | Upload gambar galeri tur | Saat menambah/mengedit tur, pilih file gambar | File gambar (JPG/PNG) | Gambar berhasil diupload dan ditampilkan pada kartu tur | | |
| 37 | Upload peta rute tur | Saat menambah/mengedit tur, pilih file peta rute | File gambar peta rute | Peta rute berhasil diupload dan ditampilkan di halaman detail tur | | |
| 38 | Melihat daftar pengguna | Klik tab "Kelola Pengguna" | — | Daftar semua pengguna sistem tampil (admin, owner, guide, user) | | |
| 39 | Menambahkan pengguna baru | Klik "Tambah Pengguna", isi form (nama, email, role, password) | Nama: "Guide Baru", Role: guide | Pengguna berhasil ditambahkan ke sistem | | |
| 40 | Reset password pengguna | Klik tombol reset password pada pengguna, isi password baru | Password baru: `newpass123` | Password pengguna berhasil direset | | |
| 41 | Melihat log aktivitas (Audit Log) | Klik tab "Log Aktivitas" | — | Daftar log aktivitas sistem tampil (create, delete, scan, assign, dll.) | | |
| 42 | Pencarian log aktivitas | Ketik keyword pada kolom pencarian log | Keyword: "scan" | Log hanya menampilkan aktivitas yang mengandung kata kunci | | |

---

## 7. Pengujian Dashboard Guide/Pemandu (`/dashboard/guide`)

| No | Skenario Pengujian | Langkah Pengujian | Data Masukan | Hasil yang Diharapkan | Hasil Pengujian | Status |
|:--:|:-------------------|:-------------------|:-------------|:----------------------|:----------------|:------:|
| 43 | Menampilkan dashboard guide | Login sebagai guide, buka `/dashboard/guide` | — | Dashboard tampil dengan nama pemandu, estimasi pendapatan, scan barcode, riwayat scan, dan jadwal tur | | |
| 44 | Menampilkan estimasi pendapatan | Lihat bagian "Estimasi Pendapatan Anda" | — | Nominal estimasi komisi (35%) tampil dari tur yang ditugaskan | | |
| 45 | Scan barcode secara manual | Masukkan kode absensi di kolom input, klik "Verifikasi Kehadiran" | Kode absensi valid | Absensi berhasil diverifikasi, muncul notifikasi sukses, dan riwayat scan bertambah | | |
| 46 | Scan barcode dengan kode tidak valid | Masukkan kode absensi yang tidak valid | Kode: `INVALID-CODE-123` | Muncul pesan error "Kode absensi tidak valid" | | |
| 47 | Scan barcode via kamera | Klik tombol "Scan dari Kamera", arahkan kamera ke barcode/QR | Barcode/QR peserta | Kode terbaca otomatis, absensi terverifikasi, kamera berhenti | | |
| 48 | Melihat riwayat scan | Lihat bagian "Riwayat Scan Pemandu" | — | Daftar riwayat scan tampil dengan nama peserta, tur, pax, waktu scan, dan sumber scan (manual/kamera) | | |
| 49 | Download riwayat scan ke Excel | Klik tombol "Download Excel" | — | File `.xlsx` berhasil diunduh berisi data riwayat scan pemandu | | |
| 50 | Melihat jadwal tur yang ditugaskan | Lihat bagian "Jadwal Saya" | — | Daftar tur yang di-assign tampil, bisa diklik untuk melihat detail peserta | | |
| 51 | Melihat detail peserta per tur | Klik salah satu jadwal tur | — | Detail peserta tampil: nama, WhatsApp, email, domisili, pax, paket (Hemat/Reguler), dan peserta tambahan | | |

---

## 8. Pengujian Dashboard User/Peserta (`/dashboard/user`)

| No | Skenario Pengujian | Langkah Pengujian | Data Masukan | Hasil yang Diharapkan | Hasil Pengujian | Status |
|:--:|:-------------------|:-------------------|:-------------|:----------------------|:----------------|:------:|
| 52 | Menampilkan dashboard user | Login sebagai user, buka `/dashboard/user` | — | Dashboard tampil dengan profil (nama, email, role), navigasi ke tur, dan daftar pemesanan | | |
| 53 | Menampilkan profil user | Lihat bagian "Akun yang sedang login" | — | Nama, email, dan role user tampil sesuai akun yang login | | |
| 54 | Navigasi ke daftar tur | Klik tombol "Lihat Semua Tur" | — | Pengguna diarahkan ke halaman `/tours` | | |
| 55 | Melihat daftar pemesanan user | Lihat bagian "Pemesanan Saya" | — | Daftar pemesanan user tampil dengan nama tur, pax, harga, tanggal, dan status pembayaran | | |
| 56 | Melihat detail dan tiket | Klik tombol "Detail & Tiket" pada pemesanan | — | Halaman detail pembayaran tampil dengan barcode/QR absensi | | |
| 57 | Membuat laporan tur | Klik tombol "Laporan Tur" pada booking yang sudah dibayar | — | Form laporan tur tampil dan bisa diisi oleh user | | |
| 58 | Menerima notifikasi | Klik ikon lonceng notifikasi | — | Daftar notifikasi tampil (booking dikonfirmasi, barcode dikirim, dll.) | | |

---

## 9. Pengujian Dashboard Owner (`/dashboard/owner`)

| No | Skenario Pengujian | Langkah Pengujian | Data Masukan | Hasil yang Diharapkan | Hasil Pengujian | Status |
|:--:|:-------------------|:-------------------|:-------------|:----------------------|:----------------|:------:|
| 59 | Menampilkan dashboard owner | Login sebagai owner, buka `/dashboard/owner` | — | Dashboard owner tampil dengan data analitik, pendapatan, dan pengelolaan operasional | | |
| 60 | Melihat data analitik/revenue | Lihat bagian laporan keuangan di dashboard owner | — | Data pendapatan, jumlah booking, dan analitik tur tampil | | |

---

## 10. Pengujian Email & Notifikasi

| No | Skenario Pengujian | Langkah Pengujian | Data Masukan | Hasil yang Diharapkan | Hasil Pengujian | Status |
|:--:|:-------------------|:-------------------|:-------------|:----------------------|:----------------|:------:|
| 61 | Pengiriman email barcode setelah pembayaran | Selesaikan pembayaran tur hingga status "Paid" | — | Email berisi barcode absensi terkirim ke email peserta | | |
| 62 | Pengiriman email reset password | Klik "Lupa Password" di halaman login, isi email | Email terdaftar | Email reset password berhasil terkirim | | |
| 63 | Notifikasi bell di dashboard user | Setelah booking dikonfirmasi, cek notifikasi | — | Notifikasi baru muncul di ikon lonceng | | |

---

## 11. Pengujian API Endpoint

| No | Skenario Pengujian | Endpoint | Method | Data Masukan | Hasil yang Diharapkan | Hasil Pengujian | Status |
|:--:|:-------------------|:---------|:------:|:-------------|:----------------------|:----------------|:------:|
| 64 | Mengambil daftar tur | `/api/tours` | GET | — | Response 200 dengan array `tours` berisi data tur | | |
| 65 | Membuat tur baru | `/api/tours` | POST | JSON: `{ name, price, description, ... }` | Response 200/201, tur berhasil disimpan | | |
| 66 | Mengambil daftar booking | `/api/bookings` | GET | — | Response 200 dengan array `bookings` | | |
| 67 | Login via API | `/api/auth/login` | POST | JSON: `{ email, password }` | Response 200 dengan session data jika berhasil, error jika gagal | | |
| 68 | Logout via API | `/api/auth/logout` | POST | — | Response 200, session dihapus | | |
| 69 | Scan absensi | `/api/attendance/scan` | POST | JSON: `{ attendanceCode, scannedBy }` | Response 200 jika kode valid, error jika tidak valid | | |
| 70 | Health check | `/api/health` | GET | — | Response 200 dengan status koneksi database | | |

---

## 12. Pengujian Responsivitas (Responsive Design)

| No | Skenario Pengujian | Langkah Pengujian | Resolusi/Device | Hasil yang Diharapkan | Hasil Pengujian | Status |
|:--:|:-------------------|:-------------------|:----------------|:----------------------|:----------------|:------:|
| 71 | Tampilan desktop | Buka aplikasi di browser desktop | 1920×1080 | Semua elemen tertata rapi, tidak ada elemen yang terpotong atau overlapping | | |
| 72 | Tampilan tablet | Buka aplikasi dengan viewport tablet | 768×1024 | Layout menyesuaikan, navigasi berfungsi, konten terbaca | | |
| 73 | Tampilan mobile | Buka aplikasi dengan viewport mobile | 375×667 | Layout single-column, tombol dan teks terbaca, form bisa diisi | | |
| 74 | Navigasi floating navbar di mobile | Buka halaman utama di mobile | 375×667 | Navbar floating tampil, semua menu bisa diakses | | |

---

## Ringkasan Hasil Pengujian

| Kategori | Jumlah Skenario | ✅ Berhasil | ❌ Gagal | Catatan |
|:---------|:---------------:|:-----------:|:--------:|:--------|
| Halaman Publik | 6 | | | |
| Daftar Tur | 3 | | | |
| Autentikasi | 10 | | | |
| Pemesanan | 4 | | | |
| Pembayaran | 3 | | | |
| Dashboard Admin | 16 | | | |
| Dashboard Guide | 9 | | | |
| Dashboard User | 7 | | | |
| Dashboard Owner | 2 | | | |
| Email & Notifikasi | 3 | | | |
| API Endpoint | 7 | | | |
| Responsivitas | 4 | | | |
| **TOTAL** | **74** | | | |

---

## Kesimpulan Pengujian

_(Isi setelah pengujian selesai)_

Berdasarkan hasil pengujian Black Box yang telah dilakukan terhadap aplikasi BDJ WalkingTour dengan total **74 skenario pengujian**, diperoleh hasil sebagai berikut:

- **Jumlah skenario berhasil:** ___ dari 74 skenario  
- **Persentase keberhasilan:** ____%  
- **Skenario yang gagal:** _(sebutkan nomor dan penjelasan)_  
- **Rekomendasi perbaikan:** _(jika ada)_

---

*Dokumen ini dibuat untuk keperluan pengujian fungsionalitas aplikasi BDJ WalkingTour menggunakan metode Black Box Testing.*
