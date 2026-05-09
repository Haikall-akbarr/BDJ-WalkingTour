import { NextRequest, NextResponse } from 'next/server';
import { getDummyBooking, updateDummyBooking } from '@/lib/dummy-booking-store';
import { isMySqlEnabled } from '@/lib/mysql';
import { getBookingById, updateBooking } from '@/lib/mysql-store';
import { buildAttendanceQrUrl, generateAttendanceCode, sendAttendanceEmail } from '@/lib/payment-helpers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bookingId = body?.bookingId;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId wajib diisi.' }, { status: 400 });
    }

    if (isMySqlEnabled()) {
      const bookingData = await getBookingById(bookingId);
      if (!bookingData) {
        return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
      }

      const attendanceCode = bookingData.attendanceCode || generateAttendanceCode(bookingId);
      const qrImageUrl = bookingData.attendanceQrImageUrl || buildAttendanceQrUrl(attendanceCode);
      let emailDeliveryStatus: 'not-requested' | 'sent' | 'skipped' | 'failed' = bookingData.userEmail ? 'failed' : 'not-requested';
      let emailDeliveryDetail: string | undefined;

      await updateBooking(bookingId, {
        paymentStatus: 'paid',
        status: 'paid',
        paymentGateway: bookingData.paymentGateway || 'dummy',
        paymentTransactionId: `dummy-${bookingId}`,
        attendanceCode,
        attendanceQrImageUrl: qrImageUrl,
        paidAt: new Date().toISOString(),
      });

      if (bookingData.userEmail) {
        try {
          const emailResult = await sendAttendanceEmail({
            to: bookingData.userEmail,
            name: bookingData.userName,
            tourName: bookingData.tourName,
            attendanceCode,
            qrImageUrl,
            orderId: bookingId,
            totalAmount: Number(bookingData.grossAmount || 0),
          });

          if ((emailResult as any)?.skipped) {
            emailDeliveryStatus = 'skipped';
            emailDeliveryDetail = 'Provider email belum dikonfigurasi (RESEND_API_KEY/RESEND_FROM_EMAIL).';
          } else {
            emailDeliveryStatus = 'sent';
          }

          await updateBooking(bookingId, {
            barcodeSentAt: new Date().toISOString(),
          });
        } catch (emailError) {
          emailDeliveryStatus = 'failed';
          emailDeliveryDetail = (emailError as any)?.message || 'Gagal mengirim email barcode.';
          console.error('[payments/dummy/confirm] Failed to send email:', emailError);
        }
      }

      return NextResponse.json({
        ok: true,
        bookingId,
        attendanceCode,
        qrImageUrl,
        source: 'mysql',
        emailDelivery: {
          status: emailDeliveryStatus,
          detail: emailDeliveryDetail,
          to: bookingData.userEmail || null,
        },
      });
    }

    const localBooking = getDummyBooking(bookingId);
    if (!localBooking) {
      return NextResponse.json({ error: 'Booking tidak ditemukan di mode lokal.' }, { status: 404 });
    }

    const attendanceCode = localBooking.attendanceCode || generateAttendanceCode(bookingId);
    const qrImageUrl = localBooking.attendanceQrImageUrl || buildAttendanceQrUrl(attendanceCode);

    updateDummyBooking(bookingId, {
      paymentStatus: 'paid',
      status: 'paid',
      paymentGateway: localBooking.paymentGateway || 'dummy',
      paymentTransactionId: `dummy-${bookingId}`,
      attendanceCode,
      attendanceQrImageUrl: qrImageUrl,
      paidAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      bookingId,
      attendanceCode,
      qrImageUrl,
      source: 'local',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Konfirmasi dummy payment gagal.' }, { status: 500 });
  }
}
