# Pengujian Acceptance Testing (User Acceptance Testing)

## Aplikasi: BDJ WalkingTour — Sistem Pemesanan Tur Jalan Kaki Banjarmasin

**Tanggal Pengujian:** ___________________  
**Penguji:** ___________________  
**Versi Aplikasi:** BDJ WalkingTour v1.0  
**Metode:** User Acceptance Testing (UAT) berbasis User Stories

---

## Pendahuluan

Pengujian Acceptance Testing (Pengujian Penerimaan) dilakukan untuk memastikan setiap fitur yang telah dikembangkan berjalan sesuai dengan skenario **User Stories** yang telah didefinisikan di awal pengembangan. Pengujian ini berfokus pada perspektif pengguna akhir, bukan pada struktur kode internal.

Setiap skenario pengujian diturunkan dari User Story dengan format:

> *"Sebagai [role], saya ingin [aksi], sehingga [manfaat]."*

Setiap User Story memiliki **Acceptance Criteria** (Kriteria Penerimaan) yang harus dipenuhi agar fitur dianggap **diterima (Accepted)**.

---

## Keterangan Status

| Status | Keterangan |
|:------:|:-----------|
| ✅ Accepted | Fitur diterima, semua kriteria terpenuhi |
| ❌ Rejected | Fitur ditolak, terdapat kriteria yang belum terpenuhi |

---

## 1. User Stories — Pengunjung / Calon Peserta (Public)

### US-01: Melihat Informasi Landing Page

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai pengunjung, saya ingin melihat halaman utama yang informatif, sehingga saya mengetahui gambaran umum layanan BDJ WalkingTour. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Halaman landing page menampilkan hero image dengan judul "Banjarmasin Walking Tour" | | |
| 2 | Statistik ringkasan (Travelers Hosted, Guided Walks, Trusted Reviews) tampil di hero section | | |
| 3 | Section "Pilihan Tur" menampilkan minimal 3 kartu tur dengan nama dan harga | | |
| 4 | Section "Pilihan Destinasi" menampilkan galeri gambar tur | | |
| 5 | Section "Pilihan Jadwal Terbaru" menampilkan detail (tanggal, jarak, durasi, deskripsi) | | |
| 6 | Footer tampil di bagian bawah halaman | | |
| 7 | Floating navbar berfungsi untuk navigasi | | |

---

### US-02: Melihat Daftar Tur yang Tersedia

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai pengunjung, saya ingin melihat daftar semua tur yang tersedia, sehingga saya bisa memilih tur yang sesuai minat saya. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Halaman `/tours` menampilkan semua tur yang tersedia dari database | | |
| 2 | Setiap kartu tur menampilkan nama, harga, dan gambar | | |
| 3 | Klik kartu tur mengarahkan ke halaman detail (`/tours/[id]`) | | |

---

### US-03: Melihat Detail Tur

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai pengunjung, saya ingin melihat detail lengkap sebuah tur, sehingga saya bisa memutuskan apakah tur tersebut cocok untuk saya. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Halaman detail menampilkan nama tur, deskripsi lengkap, dan gambar galeri | | |
| 2 | Harga reguler dan harga hemat (jika ada) tampil dengan jelas | | |
| 3 | Informasi jarak tempuh dan durasi tur ditampilkan | | |
| 4 | Highlight tur (poin-poin unggulan) tampil | | |
| 5 | Peta rute tur ditampilkan (jika tersedia) | | |
| 6 | Daftar Point of Interest (POI) tampil | | |
| 7 | Terdapat tombol untuk melanjutkan ke pemesanan | | |

---

## 2. User Stories — Autentikasi

### US-04: Registrasi Akun Peserta

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai calon peserta, saya ingin membuat akun baru dengan email, sehingga saya bisa login dan memesan tur. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Form registrasi tersedia di halaman login dengan opsi "Buat Akun Baru" | | |
| 2 | Registrasi berhasil dengan mengisi nama, email, dan password | | |
| 3 | Setelah registrasi, pengguna bisa langsung login dengan akun baru | | |
| 4 | Jika email sudah terdaftar, muncul pesan error yang informatif | | |

---

### US-05: Login Peserta

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai peserta terdaftar, saya ingin login dengan email dan password, sehingga saya bisa mengakses dashboard dan memesan tur. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Login berhasil dengan email dan password yang valid → diarahkan ke `/dashboard/user` | | |
| 2 | Login dengan password salah → muncul pesan error | | |
| 3 | Login dengan email tidak terdaftar → muncul pesan error | | |
| 4 | Login dengan field kosong → muncul validasi | | |

---

### US-06: Login Staff (Admin, Guide, Owner)

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai staff (admin/guide/owner), saya ingin login melalui halaman khusus staff, sehingga saya bisa mengakses dashboard sesuai peran saya. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Akses login staff tersedia melalui `/login?mode=staff` | | |
| 2 | Login admin berhasil → diarahkan ke `/dashboard/admin` | | |
| 3 | Login guide berhasil → diarahkan ke `/dashboard/guide` | | |
| 4 | Login owner berhasil → diarahkan ke `/dashboard/owner` | | |
| 5 | Role yang login menentukan dashboard yang ditampilkan | | |

---

### US-07: Reset Password

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai pengguna yang lupa password, saya ingin mereset password melalui email, sehingga saya bisa kembali mengakses akun saya. |
| **Prioritas** | Sedang |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Tombol "Lupa Password" tersedia di halaman login | | |
| 2 | Setelah mengisi email terdaftar, email reset password terkirim | | |
| 3 | Link reset password di email mengarahkan ke form ganti password | | |
| 4 | Password baru berhasil disimpan dan bisa digunakan untuk login | | |

---

### US-08: Logout

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai pengguna yang sedang login, saya ingin logout dari sistem, sehingga sesi saya berakhir dan akun saya aman. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Tombol "Keluar" tersedia di setiap dashboard | | |
| 2 | Muncul dialog konfirmasi sebelum logout | | |
| 3 | Setelah konfirmasi, sesi dihapus dan pengguna diarahkan ke halaman utama | | |
| 4 | Setelah logout, mengakses dashboard kembali harus login ulang | | |

---

## 3. User Stories — Pemesanan Tur

### US-09: Membuat Pemesanan Tur

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai peserta yang sudah login, saya ingin memesan tur, sehingga saya bisa mengikuti tur jalan kaki yang dipilih. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Form pemesanan tersedia setelah memilih tur dan login | | |
| 2 | User bisa mengisi nama, nomor WhatsApp, dan jumlah peserta (pax) | | |
| 3 | User bisa memilih paket Reguler atau Hemat (jika tersedia) | | |
| 4 | User bisa menambahkan nama peserta tambahan | | |
| 5 | **Perhitungan total harga tiket berjalan akurat** sesuai pax × harga paket yang dipilih | | |
| 6 | Validasi form berfungsi (field wajib tidak boleh kosong) | | |
| 7 | Setelah submit, booking tersimpan dan pengguna diarahkan ke pembayaran | | |

---

### US-10: Melihat Riwayat Pemesanan

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai peserta, saya ingin melihat riwayat pemesanan saya, sehingga saya bisa memantau status booking dan pembayaran. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Daftar pemesanan tampil di dashboard user bagian "Pemesanan Saya" | | |
| 2 | Setiap booking menampilkan nama tur, jumlah pax, total harga, dan tanggal | | |
| 3 | Status pembayaran tampil dengan badge warna yang berbeda (Belum Bayar / Sudah Bayar / Dibatalkan) | | |
| 4 | Hanya booking milik user yang login yang ditampilkan | | |

---

## 4. User Stories — Pembayaran

### US-11: Melakukan Pembayaran

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai peserta yang telah memesan tur, saya ingin melakukan pembayaran, sehingga pemesanan saya terkonfirmasi. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Setelah booking dibuat, pengguna diarahkan ke halaman pembayaran | | |
| 2 | Mode dummy: simulasi pembayaran berhasil, status berubah ke "Paid" | | |
| 3 | Mode manual: informasi bank, nomor rekening, dan QR code tampil | | |
| 4 | **Total pembayaran yang ditampilkan akurat** sesuai pemesanan | | |

---

### US-12: Menerima Barcode Absensi Setelah Pembayaran

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai peserta yang sudah membayar, saya ingin menerima barcode absensi, sehingga saya bisa diverifikasi saat hadir di tur. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Halaman sukses pembayaran (`/payments/success/[id]`) menampilkan barcode/QR | | |
| 2 | Email berisi barcode absensi terkirim ke email peserta | | |
| 3 | Barcode bisa digunakan untuk verifikasi kehadiran oleh guide | | |
| 4 | Tombol "Detail & Tiket" di dashboard user mengarahkan ke halaman ini | | |

---

## 5. User Stories — Dashboard Admin

### US-13: Mengelola Pemesanan

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai admin, saya ingin melihat dan mengelola semua pemesanan, sehingga saya bisa memantau status booking seluruh peserta. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Tabel pemesanan menampilkan data pelanggan, tur, pax, tanggal, dan status | | |
| 2 | Filter berdasarkan status (Semua / Belum Bayar / Sudah Bayar / Dibatalkan) berfungsi | | |
| 3 | Pencarian berdasarkan nama pelanggan atau nama tur berfungsi | | |
| 4 | Summary jumlah booking per status (pending, paid, cancelled) tampil akurat | | |

---

### US-14: Mengekspor Data Pemesanan

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai admin, saya ingin mengekspor data pemesanan ke Excel dan PDF, sehingga saya bisa membuat laporan untuk keperluan administrasi. |
| **Prioritas** | Sedang |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Tombol "Excel" mengunduh file `.xlsx` berisi data pemesanan | | |
| 2 | Tombol "PDF" mengunduh file `.pdf` berisi data pemesanan dalam format tabel | | |
| 3 | Data yang diekspor sesuai dengan filter yang sedang aktif | | |
| 4 | Kolom di file ekspor lengkap (No, Nama, Kontak WA, Peserta Tambahan, Tur, Pax, Total, Tanggal, Status) | | |

---

### US-15: Mengelola Paket Tur (CRUD)

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai admin, saya ingin menambah, mengedit, dan menghapus paket tur, sehingga daftar tur selalu up-to-date untuk peserta. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Tombol "Paket Tur Baru" membuka form tambah tur | | |
| 2 | Form tur mencakup: nama, harga reguler, harga hemat, tanggal, deskripsi, jarak, durasi, highlight, POI | | |
| 3 | Tur berhasil ditambahkan dan muncul di daftar tur serta halaman publik | | |
| 4 | Tombol edit membuka form yang terisi data tur existing | | |
| 5 | Perubahan data tur berhasil disimpan | | |
| 6 | Tombol hapus menghapus tur setelah konfirmasi | | |
| 7 | Upload gambar galeri tur berfungsi | | |
| 8 | Upload peta rute tur berfungsi | | |

---

### US-16: Mengelola Pengguna Sistem

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai admin, saya ingin mengelola akun pengguna (tambah, lihat, reset password), sehingga saya bisa mengontrol akses ke sistem. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Daftar semua pengguna sistem tampil (admin, owner, guide, user) | | |
| 2 | Admin bisa menambahkan pengguna baru dengan role tertentu | | |
| 3 | Admin bisa mereset password pengguna | | |
| 4 | Kredensial akun baru bisa dikirim via email | | |

---

### US-17: Melihat Log Aktivitas Sistem

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai admin, saya ingin melihat log aktivitas sistem, sehingga saya bisa memantau setiap perubahan yang terjadi (audit trail). |
| **Prioritas** | Sedang |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Tab "Log Aktivitas" menampilkan daftar log (create, delete, scan, assign, dll.) | | |
| 2 | Setiap log menampilkan: aksi, tipe entitas, aktor, role, dan waktu | | |
| 3 | Pencarian/filter log aktivitas berfungsi | | |
| 4 | Badge warna berbeda berdasarkan jenis aksi (assigned, scan, create, delete) | | |

---

## 6. User Stories — Dashboard Guide/Pemandu

### US-18: Memverifikasi Kehadiran Peserta (Scan Barcode)

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai guide, saya ingin memindai barcode absensi peserta, sehingga kehadiran peserta tercatat secara digital. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Input manual kode absensi → klik "Verifikasi Kehadiran" → absensi tercatat | | |
| 2 | Scan via kamera → kode terbaca otomatis → absensi tercatat | | |
| 3 | Kode absensi tidak valid → muncul pesan error "Kode absensi tidak valid" | | |
| 4 | Setelah scan berhasil, notifikasi sukses tampil | | |
| 5 | Riwayat scan bertambah otomatis setelah verifikasi berhasil | | |

---

### US-19: Melihat Riwayat Scan dan Mengekspor Data

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai guide, saya ingin melihat riwayat scan dan mengunduhnya ke Excel, sehingga saya memiliki rekap kehadiran peserta. |
| **Prioritas** | Sedang |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Riwayat scan menampilkan: nama peserta, tur, pax, waktu scan, sumber (manual/kamera) | | |
| 2 | Peserta tambahan (jika ada) tampil pada setiap entri scan | | |
| 3 | Tombol "Download Excel" mengunduh file `.xlsx` berisi data riwayat scan | | |
| 4 | Riwayat scan tersimpan di local storage dan tetap ada saat halaman di-refresh | | |

---

### US-20: Melihat Jadwal Tur dan Detail Peserta

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai guide, saya ingin melihat jadwal tur yang ditugaskan beserta detail peserta, sehingga saya bisa mempersiapkan tur dengan baik. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Daftar "Jadwal Saya" menampilkan tur yang di-assign ke guide yang login | | |
| 2 | Klik jadwal tur menampilkan detail peserta (nama, WhatsApp, email, domisili, pax) | | |
| 3 | Paket peserta (Hemat/Reguler) ditampilkan dengan badge berbeda | | |
| 4 | Nama peserta tambahan tampil jika ada | | |
| 5 | Total jumlah peserta (orang) dan jumlah pemesanan (booking) ditampilkan | | |

---

### US-21: Melihat Estimasi Pendapatan Guide

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai guide, saya ingin melihat estimasi pendapatan saya, sehingga saya mengetahui komisi dari tur yang saya pandu. |
| **Prioritas** | Rendah |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Section "Estimasi Pendapatan Anda" menampilkan nominal dalam Rupiah | | |
| 2 | **Perhitungan komisi 35% dari total tur berbayar berjalan akurat** | | |

---

## 7. User Stories — Dashboard User/Peserta

### US-22: Melihat Profil Akun

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai peserta, saya ingin melihat profil akun saya, sehingga saya bisa memastikan informasi yang terdaftar sudah benar. |
| **Prioritas** | Sedang |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Nama pengguna tampil sesuai akun yang login | | |
| 2 | Email tampil sesuai akun yang login | | |
| 3 | Role ditampilkan sebagai "User Peserta" | | |
| 4 | Inisial nama tampil di avatar header | | |

---

### US-23: Membuat Laporan Tur

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai peserta yang sudah mengikuti tur, saya ingin membuat laporan/review, sehingga saya bisa memberikan feedback pengalaman tur saya. |
| **Prioritas** | Sedang |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Tombol "Laporan Tur" hanya muncul pada booking dengan status "Sudah Bayar" | | |
| 2 | Form laporan tur bisa diisi dan disimpan | | |
| 3 | Jika laporan sudah ada, tombol berubah menjadi "Edit Laporan" | | |

---

### US-24: Menerima Notifikasi

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai peserta, saya ingin menerima notifikasi terkait pemesanan saya, sehingga saya selalu mendapat informasi terbaru. |
| **Prioritas** | Sedang |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Ikon lonceng (bell) tampil di header dashboard user | | |
| 2 | Klik ikon menampilkan daftar notifikasi | | |
| 3 | Notifikasi terkait konfirmasi booking dan pengiriman barcode ditampilkan | | |

---

## 8. User Stories — Dashboard Owner

### US-25: Melihat Analitik dan Pendapatan

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai owner, saya ingin melihat data analitik dan pendapatan keseluruhan, sehingga saya bisa memantau performa bisnis tur. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Dashboard owner menampilkan ringkasan pendapatan total | | |
| 2 | Data jumlah booking ditampilkan | | |
| 3 | Analitik tur (performa per tur) tersedia | | |

---

## 9. User Stories — Email

### US-26: Pengiriman Email Otomatis

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai peserta, saya ingin menerima email otomatis setelah pembayaran berhasil, sehingga saya memiliki bukti booking dan barcode absensi di email. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Email barcode absensi terkirim otomatis setelah status pembayaran menjadi "Paid" | | |
| 2 | Email reset password terkirim saat user meminta reset | | |
| 3 | Email berisi informasi yang lengkap dan mudah dipahami | | |

---

## 10. User Stories — Responsivitas

### US-27: Akses Aplikasi dari Berbagai Perangkat

| Item | Detail |
|:-----|:-------|
| **User Story** | Sebagai pengguna, saya ingin mengakses aplikasi dari desktop maupun mobile, sehingga saya bisa menggunakan aplikasi di perangkat apa pun. |
| **Prioritas** | Tinggi |

**Acceptance Criteria:**

| No | Kriteria | Hasil Pengujian | Status |
|:--:|:---------|:----------------|:------:|
| 1 | Layout desktop (1920×1080) tertata rapi tanpa elemen terpotong | | |
| 2 | Layout tablet (768×1024) menyesuaikan, semua fungsi berjalan | | |
| 3 | Layout mobile (375×667) single-column, form bisa diisi, teks terbaca | | |
| 4 | Floating navbar berfungsi di semua resolusi | | |

---

## Ringkasan Hasil Acceptance Testing

| No | User Story ID | Deskripsi User Story | Jumlah Kriteria | ✅ Accepted | ❌ Rejected | Status Akhir |
|:--:|:------------:|:---------------------|:---------------:|:-----------:|:-----------:|:------------:|
| 1 | US-01 | Melihat Informasi Landing Page | 7 | | | |
| 2 | US-02 | Melihat Daftar Tur yang Tersedia | 3 | | | |
| 3 | US-03 | Melihat Detail Tur | 7 | | | |
| 4 | US-04 | Registrasi Akun Peserta | 4 | | | |
| 5 | US-05 | Login Peserta | 4 | | | |
| 6 | US-06 | Login Staff (Admin, Guide, Owner) | 5 | | | |
| 7 | US-07 | Reset Password | 4 | | | |
| 8 | US-08 | Logout | 4 | | | |
| 9 | US-09 | Membuat Pemesanan Tur | 7 | | | |
| 10 | US-10 | Melihat Riwayat Pemesanan | 4 | | | |
| 11 | US-11 | Melakukan Pembayaran | 4 | | | |
| 12 | US-12 | Menerima Barcode Absensi | 4 | | | |
| 13 | US-13 | Mengelola Pemesanan (Admin) | 4 | | | |
| 14 | US-14 | Mengekspor Data Pemesanan | 4 | | | |
| 15 | US-15 | Mengelola Paket Tur (CRUD) | 8 | | | |
| 16 | US-16 | Mengelola Pengguna Sistem | 4 | | | |
| 17 | US-17 | Melihat Log Aktivitas Sistem | 4 | | | |
| 18 | US-18 | Memverifikasi Kehadiran (Scan) | 5 | | | |
| 19 | US-19 | Riwayat Scan & Ekspor Excel | 4 | | | |
| 20 | US-20 | Jadwal Tur & Detail Peserta | 5 | | | |
| 21 | US-21 | Estimasi Pendapatan Guide | 2 | | | |
| 22 | US-22 | Melihat Profil Akun | 4 | | | |
| 23 | US-23 | Membuat Laporan Tur | 3 | | | |
| 24 | US-24 | Menerima Notifikasi | 3 | | | |
| 25 | US-25 | Analitik & Pendapatan (Owner) | 3 | | | |
| 26 | US-26 | Pengiriman Email Otomatis | 3 | | | |
| 27 | US-27 | Responsivitas Multi-Device | 4 | | | |
| | | **TOTAL** | **117** | | | |

---

## Kesimpulan Pengujian Acceptance Testing

_(Isi setelah pengujian selesai)_

Berdasarkan hasil User Acceptance Testing yang telah dilakukan terhadap aplikasi BDJ WalkingTour dengan total **27 User Stories** dan **117 acceptance criteria**, diperoleh hasil sebagai berikut:

- **Jumlah User Story yang diterima (Accepted):** ___ dari 27
- **Jumlah acceptance criteria yang terpenuhi:** ___ dari 117
- **Persentase keberhasilan:** ____%
- **User Story yang ditolak (Rejected):** _(sebutkan ID dan penjelasan)_
- **Catatan perbaikan:** _(jika ada)_

### Interpretasi Hasil

| Persentase | Keterangan |
|:----------:|:-----------|
| 90% – 100% | Aplikasi siap digunakan (production-ready) |
| 75% – 89% | Aplikasi perlu perbaikan minor sebelum digunakan |
| 50% – 74% | Aplikasi perlu perbaikan signifikan |
| < 50% | Aplikasi belum layak digunakan |

---

*Dokumen ini dibuat untuk keperluan pengujian penerimaan (Acceptance Testing) aplikasi BDJ WalkingTour berdasarkan User Stories yang didefinisikan pada tahap perencanaan pengembangan.*
