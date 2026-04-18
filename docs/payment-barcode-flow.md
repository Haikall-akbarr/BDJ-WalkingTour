# Payment Gateway + Barcode Attendance Flow

This document outlines the practical integration plan for tour booking payment and attendance QR/barcode scanning.

## Target Flow

1. Buyer submits booking form.
2. System creates booking record with status `pending_payment`.
3. System creates payment transaction in gateway.
4. Buyer pays via gateway checkout page.
5. Gateway calls webhook to server after payment status update.
6. On successful payment, system:
   - updates booking to `paid`
   - generates unique attendance code
   - generates QR/barcode image
   - sends email to buyer with QR/barcode attachment or inline image
7. Guide scans code at check-in and system marks attendance.

## Recommended Stack (for this project)

- Gateway: Midtrans (common for Indonesia) or Xendit.
- QR generation: `qrcode` package.
- Email: SMTP with Nodemailer (or provider API like Resend).
- Webhook route: Next.js Route Handler under `src/app/api/...`.

## Data Model Additions (bookings)

Add fields to booking document:

- `paymentStatus`: `pending | paid | failed | expired`
- `paymentGateway`: string
- `paymentOrderId`: string
- `paymentTransactionId`: string
- `paymentUrl`: string
- `attendanceCode`: string
- `attendanceQrDataUrl`: string (optional)
- `attendanceScannedAt`: timestamp | null
- `attendanceScannedBy`: string | null

## API Endpoints to Build

1. `POST /api/payments/create`
   - Input: booking info or booking id
   - Action: create payment transaction in gateway
   - Output: checkout/payment URL

2. `POST /api/payments/webhook`
   - Input: gateway callback payload
   - Action:
     - verify signature
     - update payment status
     - if paid: create QR/barcode + send email

3. `POST /api/attendance/scan`
   - Input: attendanceCode
   - Action: validate booking + set scanned fields

## Email Content

Subject:
- `Pembayaran Berhasil - BDJ WalkingTour`

Body:
- Booking summary
- Participant name
- Tour name and date
- QR/barcode image
- Attendance instructions for guide scan

## Security Notes

- Webhook signature verification is mandatory.
- Payment keys must stay server-side only.
- Never trust frontend payment status.
- Attendance scan endpoint should require authenticated guide/admin.

## Environment Variables Needed

Example for Midtrans + SMTP:

- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY`
- `MIDTRANS_IS_PRODUCTION`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`
- `APP_BASE_URL`

## Incremental Delivery Plan

1. Integrate payment create API + redirect checkout.
2. Implement webhook and payment status sync.
3. Generate QR/barcode and send success email.
4. Add guide scan page and attendance API.
5. Add dashboard reporting for paid and attended participants.
