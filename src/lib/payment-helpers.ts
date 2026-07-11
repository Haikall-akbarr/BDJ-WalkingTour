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
  participantNames?: string;
};

export function generateAttendanceCode(orderId: string) {
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BDJ-${orderId.slice(0, 8).toUpperCase()}-${randomPart}`;
}

export function buildAttendanceQrUrl(attendanceCode: string) {
  return `https://quickchart.io/qr?size=320&text=${encodeURIComponent(attendanceCode)}`;
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

async function fetchQrImageAttachment(qrImageUrl: string) {
  const response = await fetch(qrImageUrl);

  if (!response.ok) {
    throw new Error(`Gagal mengambil QR image: ${response.status}`);
  }

  return {
    filename: 'attendance-qr.png',
    content: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') || 'image/png',
    cid: 'attendance-qr',
  };
}

async function fetchQrImageAsBase64(qrImageUrl: string) {
  const response = await fetch(qrImageUrl);

  if (!response.ok) {
    throw new Error(`Gagal mengambil QR image: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

function buildAttendanceEmailHtml(params: {
  name: string;
  tourName: string;
  attendanceCode: string;
  qrImageUrl: string;
  orderId: string;
  totalAmount: number;
  appBaseUrl: string;
  qrSrc: string;
}) {
  return `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#10221f;max-width:600px;margin:0 auto;">
        <h2 style="margin-bottom:20px;">Pembayaran berhasil</h2>
        
        <p>Halo ${params.name}, pembayaran untuk <strong>${params.tourName}</strong> telah kami terima.</p>
        
        <div style="background-color:#f5f5f5;padding:15px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;"><strong>Order ID:</strong> ${params.orderId}</p>
          <p style="margin:8px 0 0 0;"><strong>Total:</strong> Rp ${params.totalAmount.toLocaleString('id-ID')}</p>
        </div>
        
        <h3 style="margin-top:25px;margin-bottom:10px;">Barcode/QR Absensi</h3>
        <p style="margin-top:0;font-size:14px;color:#666;">Tunjukkan barcode di bawah kepada guide untuk absensi peserta.</p>
        
        <div style="text-align:center;margin:20px 0;">
          <img src="${params.qrSrc}" alt="Attendance QR" width="400" height="400" style="display:inline-block;border:2px solid #ddd;padding:10px;background-color:#fff;border-radius:8px;max-width:100%;height:auto;" />
        </div>
        
        <div style="background-color:#f0f8ff;padding:15px;border-radius:8px;margin:20px 0;border-left:4px solid #16302c;">
          <p style="margin:0;"><strong>Kode Absensi:</strong> <span style="font-family:monospace;font-size:16px;font-weight:bold;color:#16302c;">${params.attendanceCode}</span></p>
        </div>
        
        <p style="font-size:12px;color:#999;margin-top:25px;">Jika gambar tidak tampil, buka tautan ini: <a href="${params.qrImageUrl}" style="color:#16302c;text-decoration:none;">${params.qrImageUrl}</a></p>
        <p style="font-size:11px;color:#ccc;text-align:center;margin-top:20px;border-top:1px solid #eee;padding-top:10px;">BDJ WalkingTour • ${params.appBaseUrl}</p>
      </div>
    `;
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

  const qrAttachment = await fetchQrImageAttachment(params.qrImageUrl);

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  const fromName = process.env.SMTP_FROM_NAME || 'BDJ Walking Tour';
  const info = await transporter.sendMail({
    from: `"${fromName}" <${smtpConfig.fromEmail}>`,
    to: params.to,
    subject: 'Pembayaran Berhasil - BDJ WalkingTour',
    html: buildAttendanceEmailHtml({
      ...params,
      appBaseUrl: getAppBaseUrl(),
      qrSrc: 'cid:attendance-qr',
    }),
    attachments: [qrAttachment],
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

  // Fetch QR as base64 for inline embedding (Resend doesn't support CID well)
  const qrBase64 = await fetchQrImageAsBase64(params.qrImageUrl);

  const fromName = process.env.SMTP_FROM_NAME || 'BDJ Walking Tour';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: `"${fromName}" <${fromEmail}>`,
      to: [params.to],
      subject: 'Pembayaran Berhasil - BDJ WalkingTour',
      html: buildAttendanceEmailHtml({
        ...params,
        appBaseUrl,
        qrSrc: qrBase64,
      }),
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

export async function sendWhatsAppConfirmation(params: {
  whatsapp: string;
  name: string;
  tourName: string;
  orderId: string;
  totalAmount: number;
  qrImageUrl: string;
}) {
  const token = 'YXAefASCYfDftvarX6Mj'; // Fonnte API Token
  if (!params.whatsapp) return { skipped: true, reason: 'No WhatsApp number' };

  let target = params.whatsapp;
  // Ensure the target is formatted (remove leading 0 or +62, fonnte accepts many formats but standard is good)
  if (target.startsWith('0')) target = '62' + target.slice(1);
  if (target.startsWith('+')) target = target.slice(1);

  const message = `Halo ${params.name},\n\nPembayaran untuk *${params.tourName}* telah kami terima.\n\n*Order ID:* ${params.orderId}\n*Total:* Rp ${params.totalAmount.toLocaleString('id-ID')}\n\nBerikut adalah link QR Code kehadiran Anda:\n${params.qrImageUrl}\n\nHarap tunjukkan pesan ini beserta QR Code kepada pemandu tur saat acara berlangsung.\n\nTerima kasih telah memilih BDJ WalkingTour!`;

  const formData = new FormData();
  formData.append('target', target);
  formData.append('message', message);
  formData.append('delay', '2');

  try {
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
      console.error('[sendWhatsAppConfirmation] Fonnte API Error:', data);
    } else {
      console.log('[sendWhatsAppConfirmation] WA terkirim ke', target);
    }
    return data;
  } catch (error) {
    console.error('[sendWhatsAppConfirmation] Request failed:', error);
    return null;
  }
}
