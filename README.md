# BDJ WalkingTour

Tour booking app with Firebase auth/data, payment flow, and attendance QR/barcode delivery.

## Payment setup

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
5. Ensure Firebase Admin env vars are set so webhook can update bookings and send barcode email.
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
