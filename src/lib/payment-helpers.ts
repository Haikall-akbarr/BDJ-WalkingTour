import crypto from 'crypto';

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

export async function sendAttendanceEmail(params: {
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
  const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:9002';

  if (!resendKey || !fromEmail) {
    console.warn('[sendAttendanceEmail] Missing RESEND_API_KEY or RESEND_FROM_EMAIL. Skipping email send.');
    return { skipped: true };
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
      subject: `Pembayaran Berhasil - BDJ WalkingTour`,
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
    throw new Error(`Resend request failed: ${response.status} ${text}`);
  }

  return response.json();
}
