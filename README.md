# BDJ WalkingTour

Tour booking app with MySQL backend, session auth, payment flow, and attendance QR/barcode delivery.

## Express backend mode

Project ini sekarang bisa dijalankan melalui custom Express server dengan `npm run dev`.

- Express menangani route inti seperti auth, tours, bookings, admin, analytics, notifications, attendance, dan payment config/dummy confirm.
- Route Next.js API yang belum dipindah masih tetap bisa dipakai sebagai fallback di server yang sama.
- Backend tetap berjalan di port `9002`, jadi frontend tidak perlu perubahan URL.

Kalau ingin menambah route baru ke Express, tambahkan handler di `server.ts` lalu biarkan route Next lama tetap menjadi cadangan sementara.

## MySQL backend (Laragon)

Jika Anda ingin data benar-benar tersimpan permanen (tour, booking, pembayaran, absensi), aktifkan backend MySQL:

1. Buat database baru di MySQL (contoh: `bdj_walking_tour`).
2. Import file schema: `docs/mysql-schema.sql`.
3. Tambahkan env berikut di `.env.local`:

- `DB_PROVIDER=mysql`
- `MYSQL_HOST=127.0.0.1`
- `MYSQL_PORT=3306`
- `MYSQL_USER=root`
- `MYSQL_PASSWORD=`
- `MYSQL_DATABASE=bdj_walking_tour`
- `AUTH_SESSION_SECRET=change-this-session-secret`
- `AUTH_PASSWORD_SALT=change-this-password-salt`

Lalu seed user demo ke tabel `users`:

1. Jalankan app.
2. Call endpoint `POST /api/auth/seed` (sekali saja).

Default akun:

- `admin@bdjwalkingtour.com / admin123`
- `owner@bdjwalkingtour.com / owner123`
- `guide@bdjwalkingtour.com / guide123`
- `user@bdjwalkingtour.com / user123`

Setelah itu, dashboard admin/owner/guide dan flow booking/payment akan memakai MySQL lewat API internal (`/api/tours`, `/api/bookings`, `/api/payments/*`, `/api/auth/*`) tanpa ketergantungan Firebase.

## Supabase backend

Project ini sekarang sudah punya koneksi Supabase dasar.

Env yang dipakai:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (opsional fallback ke anon key)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` (opsional fallback)
- `SUPABASE_SERVICE_ROLE_KEY`

Catatan provider:

- `DB_PROVIDER=mysql` -> flow backend lama tetap berjalan.
- `DB_PROVIDER=supabase` -> status provider akan tampil sebagai Supabase (endpoint health siap dipakai).

Endpoint cek koneksi:

- `GET /api/health/supabase`

Respons sukses akan mengembalikan `ok: true`.
Jika gagal dan ada pesan tabel `tours` tidak ditemukan, buat tabel `tours` dulu di Supabase SQL Editor.


## Auth peserta

- Login peserta tersedia via Google atau email/password.
- Jika tidak bisa login dengan Google, peserta bisa membuat akun email baru dari halaman login.
- Lupa password tersedia melalui email reset link.
- Akses staff tersembunyi ada di tombol `Heritage Walks` dan menuju `/login?mode=staff`.
- Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_ID` untuk mengaktifkan tombol Google.
- Pastikan provider email (`EMAIL_PROVIDER`, `SMTP_*` atau `RESEND_*`) aktif agar reset password bisa dikirim.


- `PAYMENT_MODE=dummy` keeps checkout in the local simulation flow.
- `PAYMENT_MODE=manual` sends buyers to the internal manual transfer page.
- `PAYMENT_MODE=pakasir` uses Pakasir checkout links and webhook confirmation.
- `PAYMENT_MODE=midtrans` enables Midtrans when the server key is ready.
- Leave `MIDTRANS_SERVER_KEY` empty to force dummy mode.
- When deploying to Vercel, set `APP_BASE_URL` to the public site URL if you want explicit absolute links in emails.
- The payment create API now falls back to the incoming request origin, so production no longer depends on `http://localhost:9002`.

## Email delivery

The app can send barcode emails through Resend or SMTP.

If Resend domain verification is not ready yet, use SMTP instead:

- `EMAIL_PROVIDER=smtp`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL`
- `SMTP_SECURE` (optional, set `true` for port 465)

Example Gmail SMTP setup:

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=youraccount@gmail.com`
- `SMTP_PASS=your-google-app-password`
- `SMTP_FROM_EMAIL=youraccount@gmail.com`
- `EMAIL_PROVIDER=smtp`

If you keep Resend, set:

- `EMAIL_PROVIDER=resend`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

If both providers are configured, the app prefers the provider you select in `EMAIL_PROVIDER` and can fall back to the other one when the first provider fails.

## Pakasir setup

Pakasir is the easiest production-friendly alternative if you want QRIS / VA via a hosted payment link.

Set these env vars:

- `PAYMENT_MODE=pakasir`
- `PAKASIR_PROJECT_SLUG`
- `PAKASIR_API_KEY`
- `PAKASIR_BASE_URL` (optional, defaults to `https://app.pakasir.com`)
- `PAKASIR_QRIS_ONLY=true` (optional)
- `PAKASIR_WEBHOOK_URL` (set this in Pakasir dashboard to `/api/payments/pakasir/webhook`)

If you only want QRIS, keep `PAKASIR_QRIS_ONLY=true`.

## Pakasir deploy checklist

1. Set `PAYMENT_MODE=pakasir` in Vercel and locally.
2. Fill `PAKASIR_PROJECT_SLUG` and `PAKASIR_API_KEY`.
3. Set `APP_BASE_URL=https://bdj-walking-tour.vercel.app`.
4. Add Pakasir webhook URL: `https://bdj-walking-tour.vercel.app/api/payments/pakasir/webhook`.
5. Ensure env MySQL dan auth session sudah benar agar webhook bisa update booking dan kirim barcode email.
6. Run one test booking, confirm the checkout link opens Pakasir, then simulate or finish a payment to verify the webhook updates status.

## Manual payment config

You can run a simple production-safe payment flow without Midtrans by setting these env vars:

- `PAYMENT_MANUAL_TITLE`
- `PAYMENT_MANUAL_DESCRIPTION`
- `PAYMENT_MANUAL_BANK_NAME`
- `PAYMENT_MANUAL_ACCOUNT_NAME`
- `PAYMENT_MANUAL_ACCOUNT_NUMBER`
- `PAYMENT_MANUAL_QR_IMAGE_URL`
- `PAYMENT_MANUAL_INSTRUCTIONS`
- `PAYMENT_MANUAL_SUPPORT_CONTACT`

`PAYMENT_MANUAL_INSTRUCTIONS` accepts one instruction per line.

## Midtrans

If Midtrans verification is not finished yet, keep using dummy mode for internal testing and switch to Midtrans later by filling the server key and setting `PAYMENT_MODE=midtrans`.

## Fast fallback for deadline

If you need a usable production flow before Midtrans verification is done, use `PAYMENT_MODE=manual` and fill the manual config env vars above.

