import { NextRequest, NextResponse } from 'next/server';
import { getDummyBooking } from '@/lib/dummy-booking-store';
import { getServerFirestore, isFirebaseAdminUnavailableError } from '@/lib/server-firebase';
import { buildAttendanceQrUrl, generateAttendanceCode, sendAttendanceEmail } from '@/lib/payment-helpers';

export const runtime = 'nodejs';

function getPakasirBaseUrl() {
  return process.env.PAKASIR_BASE_URL || 'https://app.pakasir.com';
}

function getPakasirProjectSlug() {
  return process.env.PAKASIR_PROJECT_SLUG || process.env.PAKASIR_PROJECT || '';
}

function getPakasirApiKey() {
  return process.env.PAKASIR_API_KEY || '';
}

async function syncFromPakasir(params: {
  bookingId: string;
  booking: any;
  source: 'firestore' | 'local';
}) {
  if (params.booking?.paymentGateway !== 'pakasir') {
    return null;
  }

  if (params.booking?.paymentStatus === 'paid') {
    return params.booking;
  }

  const project = getPakasirProjectSlug();
  const apiKey = getPakasirApiKey();

  if (!project || !apiKey) {
    return null;
  }

  const amount = Number(params.booking?.grossAmount || 0);
  if (!amount) {
    return null;
  }

  const detailUrl = new URL('/api/transactiondetail', getPakasirBaseUrl());
  detailUrl.searchParams.set('project', project);
  detailUrl.searchParams.set('amount', String(amount));
  detailUrl.searchParams.set('order_id', params.bookingId);
  detailUrl.searchParams.set('api_key', apiKey);

  const response = await fetch(detailUrl.toString(), { method: 'GET' });
  if (!response.ok) {
    return null;
  }

  const result = await response.json();
  const transaction = result?.transaction || result?.payment || result;
  const status = String(transaction?.status || transaction?.payment_status || '').toLowerCase();

  if (status !== 'completed' && status !== 'paid' && status !== 'success') {
    return null;
  }

  const attendanceCode = params.booking?.attendanceCode || generateAttendanceCode(params.bookingId);
  const qrImageUrl = params.booking?.attendanceQrImageUrl || buildAttendanceQrUrl(attendanceCode);
  const paymentTransactionId = transaction?.transaction_id || transaction?.payment_id || `pakasir-${params.bookingId}`;

  try {
    if (params.source === 'firestore') {
      const db = getServerFirestore();
      await db.collection('bookings').doc(params.bookingId).update({
        paymentStatus: 'paid',
        status: 'paid',
        paymentGateway: 'pakasir',
        paymentTransactionId,
        attendanceCode,
        attendanceQrImageUrl: qrImageUrl,
        paidAt: transaction?.completed_at || transaction?.paid_at || new Date().toISOString(),
        updatedAt: new Date(),
      });
    } else {
      const { updateDummyBooking } = await import('@/lib/dummy-booking-store');
      updateDummyBooking(params.bookingId, {
        paymentStatus: 'paid',
        status: 'paid',
        paymentGateway: 'pakasir',
        paymentTransactionId,
        attendanceCode,
        attendanceQrImageUrl: qrImageUrl,
        paidAt: transaction?.completed_at || transaction?.paid_at || new Date().toISOString(),
      } as any);
    }

    if (params.booking?.userEmail) {
      await sendAttendanceEmail({
        to: params.booking.userEmail,
        name: params.booking.userName,
        tourName: params.booking.tourName,
        attendanceCode,
        qrImageUrl,
        orderId: params.bookingId,
        totalAmount: amount,
      });
    }

    return {
      ...params.booking,
      paymentStatus: 'paid',
      status: 'paid',
      paymentGateway: 'pakasir',
      paymentTransactionId,
      attendanceCode,
      attendanceQrImageUrl: qrImageUrl,
      paidAt: transaction?.completed_at || transaction?.paid_at || new Date().toISOString(),
    };
  } catch (syncError) {
    console.error('[payments/status] Pakasir sync failed:', (syncError as any)?.message);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const bookingId = request.nextUrl.searchParams.get('bookingId') || request.nextUrl.searchParams.get('orderId');

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId wajib diisi.' }, { status: 400 });
    }

    try {
      const db = getServerFirestore();
      const bookingDoc = await db.collection('bookings').doc(bookingId).get();

      if (bookingDoc.exists) {
        const booking = bookingDoc.data() as any;
        const syncedBooking = await syncFromPakasir({
          bookingId,
          booking: {
            id: bookingId,
            paymentStatus: booking?.paymentStatus || 'pending_payment',
            status: booking?.status || 'pending_payment',
            paymentGateway: booking?.paymentGateway || null,
            paymentCheckoutUrl: booking?.paymentCheckoutUrl || null,
            attendanceCode: booking?.attendanceCode || null,
            attendanceQrImageUrl: booking?.attendanceQrImageUrl || null,
            attendanceScannedAt: booking?.attendanceScannedAt || null,
            attendanceScannedBy: booking?.attendanceScannedBy || null,
            paidAt: booking?.paidAt || null,
            barcodeSentAt: booking?.barcodeSentAt || null,
            tourName: booking?.tourName || null,
            userName: booking?.userName || null,
            userEmail: booking?.userEmail || null,
            grossAmount: booking?.grossAmount || null,
          },
          source: 'firestore',
        });

        const nextBooking = syncedBooking || {
          id: bookingId,
          paymentStatus: booking?.paymentStatus || 'pending_payment',
          status: booking?.status || 'pending_payment',
          paymentGateway: booking?.paymentGateway || null,
          paymentCheckoutUrl: booking?.paymentCheckoutUrl || null,
          attendanceCode: booking?.attendanceCode || null,
          attendanceQrImageUrl: booking?.attendanceQrImageUrl || null,
          attendanceScannedAt: booking?.attendanceScannedAt || null,
          attendanceScannedBy: booking?.attendanceScannedBy || null,
          paidAt: booking?.paidAt || null,
          barcodeSentAt: booking?.barcodeSentAt || null,
          tourName: booking?.tourName || null,
          userName: booking?.userName || null,
          userEmail: booking?.userEmail || null,
          grossAmount: booking?.grossAmount || null,
        };

        return NextResponse.json({
          source: 'firestore',
          bookingId,
          booking: nextBooking,
        });
      }

      const localBooking = getDummyBooking(bookingId);
      if (!localBooking) {
        return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
      }

      const syncedBooking = await syncFromPakasir({
        bookingId,
        booking: {
          id: bookingId,
          paymentStatus: localBooking.paymentStatus || 'pending_payment',
          status: localBooking.status || 'pending_payment',
          paymentGateway: localBooking.paymentGateway || null,
          paymentCheckoutUrl: localBooking.paymentCheckoutUrl || null,
          attendanceCode: localBooking.attendanceCode || null,
          attendanceQrImageUrl: localBooking.attendanceQrImageUrl || null,
          attendanceScannedAt: localBooking.attendanceScannedAt || null,
          attendanceScannedBy: localBooking.attendanceScannedBy || null,
          paidAt: localBooking.paidAt || null,
          barcodeSentAt: localBooking.barcodeSentAt || null,
          tourName: localBooking.tourName || null,
          userName: localBooking.userName || null,
          userEmail: localBooking.userEmail || null,
          grossAmount: localBooking.grossAmount || null,
        },
        source: 'local',
      });

      const nextBooking = syncedBooking || {
        id: bookingId,
        paymentStatus: localBooking.paymentStatus || 'pending_payment',
        status: localBooking.status || 'pending_payment',
        paymentGateway: localBooking.paymentGateway || null,
        paymentCheckoutUrl: localBooking.paymentCheckoutUrl || null,
        attendanceCode: localBooking.attendanceCode || null,
        attendanceQrImageUrl: localBooking.attendanceQrImageUrl || null,
        attendanceScannedAt: localBooking.attendanceScannedAt || null,
        attendanceScannedBy: localBooking.attendanceScannedBy || null,
        paidAt: localBooking.paidAt || null,
        barcodeSentAt: localBooking.barcodeSentAt || null,
        tourName: localBooking.tourName || null,
        userName: localBooking.userName || null,
        userEmail: localBooking.userEmail || null,
        grossAmount: localBooking.grossAmount || null,
      };

      return NextResponse.json({
        source: 'local',
        bookingId,
        booking: nextBooking,
      });
    } catch (dbError) {
      if (!isFirebaseAdminUnavailableError(dbError)) {
        throw dbError;
      }

      const booking = getDummyBooking(bookingId);
      if (!booking) {
        return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
      }

      const syncedBooking = await syncFromPakasir({
        bookingId,
        booking: {
          id: bookingId,
          paymentStatus: booking.paymentStatus || 'pending_payment',
          status: booking.status || 'pending_payment',
          paymentGateway: booking.paymentGateway || null,
          paymentCheckoutUrl: booking.paymentCheckoutUrl || null,
          attendanceCode: booking.attendanceCode || null,
          attendanceQrImageUrl: booking.attendanceQrImageUrl || null,
          attendanceScannedAt: booking.attendanceScannedAt || null,
          attendanceScannedBy: booking.attendanceScannedBy || null,
          paidAt: booking.paidAt || null,
          barcodeSentAt: booking.barcodeSentAt || null,
          tourName: booking.tourName || null,
          userName: booking.userName || null,
          userEmail: booking.userEmail || null,
          grossAmount: booking.grossAmount || null,
        },
        source: 'local',
      });

      return NextResponse.json({
        source: 'local',
        bookingId,
        booking: syncedBooking || {
          id: bookingId,
          paymentStatus: booking.paymentStatus || 'pending_payment',
          status: booking.status || 'pending_payment',
          paymentGateway: booking.paymentGateway || null,
          paymentCheckoutUrl: booking.paymentCheckoutUrl || null,
          attendanceCode: booking.attendanceCode || null,
          attendanceQrImageUrl: booking.attendanceQrImageUrl || null,
          attendanceScannedAt: booking.attendanceScannedAt || null,
          attendanceScannedBy: booking.attendanceScannedBy || null,
          paidAt: booking.paidAt || null,
          barcodeSentAt: booking.barcodeSentAt || null,
          tourName: booking.tourName || null,
          userName: booking.userName || null,
          userEmail: booking.userEmail || null,
          grossAmount: booking.grossAmount || null,
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal mengambil status pembayaran.' }, { status: 500 });
  }
}