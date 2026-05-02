import crypto from 'crypto';
import nodemailer from 'nodemailer';

export type BookingPaymentPayload = {
  name: string;
  whatsapp: string;
  email?: string;
  domicile: string;
  customDomicile?: string;
  tourId: string;
  tourName: string;
  tourPrice: number;
  pax: number;
};

export function generateAttendanceCode(orderId: string) {
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BDJ-${orderId.slice(0, 8).toUpperCase()}-${randomPart}`;
}

export function buildAttendanceQrUrl(attendanceCode: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(attendanceCode)}`;
}

export function verifyMidtransSignature(input: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const raw = `${input.orderId}${input.statusCode}${input.grossAmount}${serverKey}`;
  const expected = crypto.createHash('sha512').update(raw).digest('hex');
  return expected === input.signatureKey;
}

function getAppBaseUrl() {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:9002';
}

function getEmailProvider() {
  return (process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
}

function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = (process.env.SMTP_USER || '').trim();
  const pass = process.env.SMTP_PASS || '';
  const fromEmail = (process.env.SMTP_FROM_EMAIL || '').trim();

  if (!host || !user || !pass || !fromEmail) {
    return null;
  }

  return {
    host,
    port,
    secure: (process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465,
    user,
    pass,
    fromEmail,
  };
}

async function sendAttendanceEmailViaSmtp(params: {
  to: string;
  name: string;
  tourName: string;
  attendanceCode: string;
  qrImageUrl: string;
  orderId: string;
  totalAmount: number;
}) {
  const smtpConfig = getSmtpConfig();

  if (!smtpConfig) {
    return { skipped: true, provider: 'smtp' as const };
  }

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  const info = await transporter.sendMail({
    from: smtpConfig.fromEmail,
    to: params.to,
    subject: 'Pembayaran Berhasil - BDJ WalkingTour',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#10221f">
        <h2>Pembayaran berhasil</h2>
        <p>Halo ${params.name}, pembayaran untuk <strong>${params.tourName}</strong> telah kami terima.</p>
        <p><strong>Order ID:</strong> ${params.orderId}<br/>
        <strong>Total:</strong> Rp ${params.totalAmount.toLocaleString('id-ID')}</p>
        <p>Barcode/QR Anda di bawah ini dan bisa dipakai guide untuk absensi peserta.</p>
        <p>
          <img src="${params.qrImageUrl}" alt="Attendance QR" width="280" height="280" style="display:block;border:0;max-width:100%;height:auto;" />
        </p>
        <p><strong>Kode Absensi:</strong> ${params.attendanceCode}</p>
        <p>Jika gambar tidak tampil, buka tautan ini: <a href="${params.qrImageUrl}">${params.qrImageUrl}</a></p>
        <p style="font-size:12px;color:#666">BDJ WalkingTour • ${getAppBaseUrl()}</p>
      </div>
    `,
  });

  return {
    provider: 'smtp' as const,
    messageId: info.messageId,
  };
}

async function sendAttendanceEmailViaResend(params: {
  to: string;
  name: string;
  tourName: string;
  attendanceCode: string;
  qrImageUrl: string;
  orderId: string;
  totalAmount: number;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const appBaseUrl = getAppBaseUrl();

  if (!resendKey || !fromEmail) {
    return { skipped: true, provider: 'resend' as const };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [params.to],
      subject: 'Pembayaran Berhasil - BDJ WalkingTour',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#10221f">
          <h2>Pembayaran berhasil</h2>
          <p>Halo ${params.name}, pembayaran untuk <strong>${params.tourName}</strong> telah kami terima.</p>
          <p><strong>Order ID:</strong> ${params.orderId}<br/>
          <strong>Total:</strong> Rp ${params.totalAmount.toLocaleString('id-ID')}</p>
          <p>Barcode/QR Anda di bawah ini dan bisa dipakai guide untuk absensi peserta.</p>
          <p>
            <img src="${params.qrImageUrl}" alt="Attendance QR" width="280" height="280" style="display:block;border:0;max-width:100%;height:auto;" />
          </p>
          <p><strong>Kode Absensi:</strong> ${params.attendanceCode}</p>
          <p>Jika gambar tidak tampil, buka tautan ini: <a href="${params.qrImageUrl}">${params.qrImageUrl}</a></p>
          <p style="font-size:12px;color:#666">BDJ WalkingTour • ${appBaseUrl}</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`Resend request failed: ${response.status} ${text}`);
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
}

export async function sendAttendanceEmail(params: {
  to: string;
  name: string;
  tourName: string;
  attendanceCode: string;
  qrImageUrl: string;
  orderId: string;
  totalAmount: number;
}) {
  const preferredProvider = getEmailProvider();
  const smtpConfig = getSmtpConfig();
  const resendConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);

  const providerOrder: Array<'smtp' | 'resend'> =
    preferredProvider === 'smtp'
      ? ['smtp', 'resend']
      : preferredProvider === 'resend'
        ? ['resend', 'smtp']
        : smtpConfig
          ? ['smtp', 'resend']
          : ['resend', 'smtp'];

  let lastError: unknown;

  for (const provider of providerOrder) {
    try {
      if (provider === 'smtp') {
        if (!smtpConfig) {
          continue;
        }

        return await sendAttendanceEmailViaSmtp(params);
      }

      if (!resendConfigured) {
        continue;
      }

      return await sendAttendanceEmailViaResend(params);
    } catch (error) {
      lastError = error;

      if (provider === 'resend') {
        const status = Number((error as any)?.status || (error as any)?.response?.status || 0);
        if (status === 403 && smtpConfig) {
          console.warn('[sendAttendanceEmail] Resend 403, falling back to SMTP.');
          continue;
        }
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  console.warn('[sendAttendanceEmail] No email provider configured. Skipping email send.');
  return { skipped: true };
}
