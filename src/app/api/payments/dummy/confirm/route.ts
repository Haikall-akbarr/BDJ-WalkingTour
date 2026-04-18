import { NextRequest, NextResponse } from 'next/server';
import { getDummyBooking, updateDummyBooking } from '@/lib/dummy-booking-store';
import { getServerFirestore, isFirebaseAdminUnavailableError, serverTimestamp } from '@/lib/server-firebase';
import { buildAttendanceQrUrl, generateAttendanceCode, sendAttendanceEmail } from '@/lib/payment-helpers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bookingId = body?.bookingId;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId wajib diisi.' }, { status: 400 });
    }

    try {
      const db = getServerFirestore();
      const bookingRef = db.collection('bookings').doc(bookingId);
      const bookingDoc = await bookingRef.get();

      if (!bookingDoc.exists) {
        return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
      }

      const bookingData = bookingDoc.data() as any;
      const attendanceCode = bookingData.attendanceCode || generateAttendanceCode(bookingId);
      const qrImageUrl = bookingData.attendanceQrImageUrl || buildAttendanceQrUrl(attendanceCode);
      let emailDeliveryStatus: 'not-requested' | 'sent' | 'skipped' | 'failed' = bookingData.userEmail ? 'failed' : 'not-requested';
      let emailDeliveryDetail: string | undefined;

      await bookingRef.update({
        paymentStatus: 'paid',
        status: 'paid',
        paymentGateway: bookingData.paymentGateway || 'dummy',
        paymentTransactionId: `dummy-${bookingId}`,
        attendanceCode,
        attendanceQrImageUrl: qrImageUrl,
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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

          await bookingRef.update({
            barcodeSentAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
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
        emailDelivery: {
          status: emailDeliveryStatus,
          detail: emailDeliveryDetail,
          to: bookingData.userEmail || null,
        },
      });
    } catch (dbError) {
      if (!isFirebaseAdminUnavailableError(dbError)) {
        throw dbError;
      }

      let localBooking = getDummyBooking(bookingId);
      if (!localBooking) {
        // In-memory store is ephemeral and can be reset on server reload.
        // Rebuild a minimal booking so dummy confirmation flow remains usable.
        localBooking = updateDummyBooking(
          bookingId,
          {
            userName: body?.name || 'Dummy User',
            userWhatsApp: body?.whatsapp || '-',
            userEmail: body?.email || '',
            domicile: body?.domicile || 'unknown',
            customDomicile: body?.customDomicile || '',
            tourId: body?.tourId || 'unknown-tour',
            tourName: body?.tourName || 'Dummy Tour',
            pax: Number(body?.pax || 1),
            pricePerPax: Number(body?.pricePerPax || 0),
            grossAmount: Number(body?.grossAmount || 0),
            status: 'pending_payment',
            paymentStatus: 'pending_payment',
            paymentGateway: 'dummy',
            paymentOrderId: bookingId,
            paymentTransactionId: null,
            paymentCheckoutUrl: null,
            attendanceCode: null,
            attendanceQrImageUrl: null,
            attendanceScannedAt: null,
            attendanceScannedBy: null,
          } as any
        );

        if (!localBooking) {
          const { createDummyBooking } = await import('@/lib/dummy-booking-store');
          localBooking = createDummyBooking({
            id: bookingId,
            userName: body?.name || 'Dummy User',
            userWhatsApp: body?.whatsapp || '-',
            userEmail: body?.email || '',
            domicile: body?.domicile || 'unknown',
            customDomicile: body?.customDomicile || '',
            tourId: body?.tourId || 'unknown-tour',
            tourName: body?.tourName || 'Dummy Tour',
            pax: Number(body?.pax || 1),
            pricePerPax: Number(body?.pricePerPax || 0),
            grossAmount: Number(body?.grossAmount || 0),
            status: 'pending_payment',
            paymentStatus: 'pending_payment',
            paymentGateway: 'dummy',
            paymentOrderId: bookingId,
            paymentTransactionId: null,
            paymentCheckoutUrl: null,
            attendanceCode: null,
            attendanceQrImageUrl: null,
            attendanceScannedAt: null,
            attendanceScannedBy: null,
          });
        }
      }

      const attendanceCode = localBooking.attendanceCode || generateAttendanceCode(bookingId);
      const qrImageUrl = localBooking.attendanceQrImageUrl || buildAttendanceQrUrl(attendanceCode);
      let emailDeliveryStatus: 'not-requested' | 'sent' | 'skipped' | 'failed' = localBooking.userEmail ? 'failed' : 'not-requested';
      let emailDeliveryDetail: string | undefined;

      const updated = updateDummyBooking(bookingId, {
        paymentStatus: 'paid',
        status: 'paid',
        paymentGateway: localBooking.paymentGateway || 'dummy',
        paymentTransactionId: `dummy-${bookingId}`,
        attendanceCode,
        attendanceQrImageUrl: qrImageUrl,
        paidAt: new Date().toISOString(),
      });

      if (localBooking.userEmail) {
        try {
          const emailResult = await sendAttendanceEmail({
            to: localBooking.userEmail,
            name: localBooking.userName,
            tourName: localBooking.tourName,
            attendanceCode,
            qrImageUrl,
            orderId: bookingId,
            totalAmount: Number(localBooking.grossAmount || 0),
          });

          if ((emailResult as any)?.skipped) {
            emailDeliveryStatus = 'skipped';
            emailDeliveryDetail = 'Provider email belum dikonfigurasi (RESEND_API_KEY/RESEND_FROM_EMAIL).';
          } else {
            emailDeliveryStatus = 'sent';
          }

          updateDummyBooking(bookingId, {
            barcodeSentAt: new Date().toISOString(),
          });
        } catch (emailError) {
          emailDeliveryStatus = 'failed';
          emailDeliveryDetail = (emailError as any)?.message || 'Gagal mengirim email barcode.';
          console.error('[payments/dummy/confirm] Failed to send email (local fallback):', emailError);
        }
      }

      return NextResponse.json({
        ok: true,
        bookingId,
        attendanceCode,
        qrImageUrl,
        localFallback: true,
        paymentStatus: updated?.paymentStatus || 'paid',
        emailDelivery: {
          status: emailDeliveryStatus,
          detail: emailDeliveryDetail,
          to: localBooking.userEmail || null,
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Konfirmasi dummy payment gagal.' }, { status: 500 });
  }
}
