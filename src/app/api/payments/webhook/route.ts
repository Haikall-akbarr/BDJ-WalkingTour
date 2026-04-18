import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore, serverTimestamp } from '@/lib/server-firebase';
import { buildAttendanceQrUrl, generateAttendanceCode, sendAttendanceEmail, verifyMidtransSignature } from '@/lib/payment-helpers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
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

    const db = getServerFirestore();
    const bookingRef = db.collection('bookings').doc(orderId);

    if (['settlement', 'capture'].includes(transactionStatus)) {
      const bookingDoc = await bookingRef.get();

      if (!bookingDoc.exists) {
        return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
      }

      const bookingData = bookingDoc.data() as any;
      const attendanceCode = bookingData.attendanceCode || generateAttendanceCode(orderId);
      const qrImageUrl = bookingData.attendanceQrImageUrl || buildAttendanceQrUrl(attendanceCode);

      await bookingRef.update({
        paymentStatus: 'paid',
        status: 'paid',
        paymentTransactionId: transactionId || payload?.transaction_id || null,
        attendanceCode,
        attendanceQrImageUrl: qrImageUrl,
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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

          await bookingRef.update({
            barcodeSentAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (emailError) {
          console.error('[payments/webhook] Failed to send email:', emailError);
        }
      }
    } else if (['deny', 'cancel', 'expire'].includes(transactionStatus)) {
      await bookingRef.update({
        paymentStatus: transactionStatus,
        status: transactionStatus,
        updatedAt: serverTimestamp(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Webhook processing failed.' }, { status: 500 });
  }
}
