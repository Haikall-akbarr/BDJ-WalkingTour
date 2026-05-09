import { NextRequest, NextResponse } from 'next/server';
import { isMySqlEnabled } from '@/lib/mysql';
import { getBookingById, updateBooking } from '@/lib/mysql-store';
import { buildAttendanceQrUrl, generateAttendanceCode, sendAttendanceEmail, verifyMidtransSignature } from '@/lib/payment-helpers';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Webhook endpoint is ready' });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function PUT() {
  return NextResponse.json({ ok: true, message: 'Webhook endpoint is ready' });
}

export async function PATCH() {
  return NextResponse.json({ ok: true, message: 'Webhook endpoint is ready' });
}

export async function DELETE() {
  return NextResponse.json({ ok: true, message: 'Webhook endpoint is ready' });
}

export async function POST(request: NextRequest) {
  try {
    if (!isMySqlEnabled()) {
      return NextResponse.json({ error: 'Mode MySQL wajib aktif untuk webhook ini.' }, { status: 400 });
    }

    const payload = await request.json();
    const orderId = payload?.order_id;
    const statusCode = payload?.status_code;
    const grossAmount = payload?.gross_amount;
    const signatureKey = payload?.signature_key;
    const transactionStatus = payload?.transaction_status;
    const transactionId = payload?.transaction_id;

    if (!orderId || !statusCode || !grossAmount || !signatureKey) {
      return NextResponse.json({ error: 'Payload webhook tidak lengkap.' }, { status: 400 });
    }

    if (!verifyMidtransSignature({ orderId, statusCode, grossAmount, signatureKey })) {
      return NextResponse.json({ error: 'Signature webhook tidak valid.' }, { status: 401 });
    }

    if (['settlement', 'capture'].includes(transactionStatus)) {
      const bookingData = await getBookingById(orderId);

      if (!bookingData) {
        return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
      }

      const attendanceCode = bookingData.attendanceCode || generateAttendanceCode(orderId);
      const qrImageUrl = bookingData.attendanceQrImageUrl || buildAttendanceQrUrl(attendanceCode);

      await updateBooking(orderId, {
        paymentStatus: 'paid',
        status: 'paid',
        paymentGateway: 'midtrans',
        paymentTransactionId: transactionId || payload?.transaction_id || null,
        attendanceCode,
        attendanceQrImageUrl: qrImageUrl,
        paidAt: new Date().toISOString(),
      });

      if (bookingData.userEmail) {
        try {
          await sendAttendanceEmail({
            to: bookingData.userEmail,
            name: bookingData.userName,
            tourName: bookingData.tourName,
            attendanceCode,
            qrImageUrl,
            orderId,
            totalAmount: Number(grossAmount),
          });

          await updateBooking(orderId, {
            barcodeSentAt: new Date().toISOString(),
          });
        } catch (emailError) {
          console.error('[payments/webhook] Failed to send email:', emailError);
        }
      }
    } else if (['deny', 'cancel', 'expire'].includes(transactionStatus)) {
      await updateBooking(orderId, {
        paymentStatus: transactionStatus,
        status: transactionStatus,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Webhook processing failed.' }, { status: 500 });
  }
}
