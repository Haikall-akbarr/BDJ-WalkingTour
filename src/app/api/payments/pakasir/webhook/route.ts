import { NextRequest, NextResponse } from 'next/server';
import { createDummyBooking, getDummyBooking, updateDummyBooking } from '@/lib/dummy-booking-store';
import { getServerFirestore, isFirebaseAdminUnavailableError, serverTimestamp } from '@/lib/server-firebase';
import { buildAttendanceQrUrl, generateAttendanceCode, sendAttendanceEmail } from '@/lib/payment-helpers';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Pakasir webhook endpoint is ready' });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function PUT() {
  return NextResponse.json({ ok: true, message: 'Pakasir webhook endpoint is ready' });
}

export async function PATCH() {
  return NextResponse.json({ ok: true, message: 'Pakasir webhook endpoint is ready' });
}

export async function DELETE() {
  return NextResponse.json({ ok: true, message: 'Pakasir webhook endpoint is ready' });
}

function getPakasirProjectSlug() {
  return process.env.PAKASIR_PROJECT_SLUG || process.env.PAKASIR_PROJECT || '';
}

async function loadBooking(orderId: string) {
  try {
    const db = getServerFirestore();
    const bookingRef = db.collection('bookings').doc(orderId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      const localBooking = getDummyBooking(orderId) || null;
      return {
        db,
        bookingRef,
        bookingDoc,
        bookingData: localBooking,
        localBooking,
      };
    }

    return {
      db,
      bookingRef,
      bookingDoc,
      bookingData: bookingDoc.exists ? (bookingDoc.data() as any) : null,
      localBooking: null,
    };
  } catch (dbError) {
    if (!isFirebaseAdminUnavailableError(dbError)) {
      throw dbError;
    }

    const localBooking = getDummyBooking(orderId) || null;
    return {
      db: null,
      bookingRef: null,
      bookingDoc: null,
      bookingData: localBooking,
      localBooking,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await request.json() : {};
    const orderId = payload?.order_id;
    const amount = Number(payload?.amount || 0);
    const project = payload?.project;
    const status = payload?.status;
    const paymentMethod = payload?.payment_method;

    if (!orderId && !amount && !project && !status) {
      return NextResponse.json({ ok: true, ignored: true, message: 'Webhook probe accepted.' });
    }

    if (!orderId || !amount || !project || !status) {
      return NextResponse.json({ error: 'Payload webhook Pakasir tidak lengkap.' }, { status: 400 });
    }

    const expectedProject = getPakasirProjectSlug();
    if (expectedProject && project !== expectedProject) {
      return NextResponse.json({ error: 'Project Pakasir tidak cocok.' }, { status: 401 });
    }

    const context = await loadBooking(orderId);
    const bookingData = context.bookingData;

    if (!bookingData) {
      return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
    }

    if (Number(bookingData.grossAmount || 0) !== amount) {
      return NextResponse.json({ error: 'Nominal webhook tidak sesuai.' }, { status: 400 });
    }

    if (status !== 'completed') {
      if (context.db) {
        await context.bookingRef!.update({
          paymentStatus: status,
          status,
          updatedAt: serverTimestamp(),
        });
      } else {
        updateDummyBooking(orderId, {
          paymentStatus: status,
          status,
        } as any);
      }

      return NextResponse.json({ ok: true, ignored: true });
    }

    const attendanceCode = bookingData.attendanceCode || generateAttendanceCode(orderId);
    const qrImageUrl = bookingData.attendanceQrImageUrl || buildAttendanceQrUrl(attendanceCode);

    if (context.db) {
      await context.bookingRef!.update({
        paymentStatus: 'paid',
        status: 'paid',
        paymentGateway: 'pakasir',
        paymentTransactionId: `${paymentMethod || 'pakasir'}-${payload?.completed_at || Date.now()}`,
        attendanceCode,
        attendanceQrImageUrl: qrImageUrl,
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      updateDummyBooking(orderId, {
        paymentStatus: 'paid',
        status: 'paid',
        paymentGateway: 'pakasir',
        paymentTransactionId: `${paymentMethod || 'pakasir'}-${payload?.completed_at || Date.now()}`,
        attendanceCode,
        attendanceQrImageUrl: qrImageUrl,
        paidAt: new Date().toISOString(),
      } as any);
    }

    if (bookingData.userEmail) {
      try {
        await sendAttendanceEmail({
          to: bookingData.userEmail,
          name: bookingData.userName,
          tourName: bookingData.tourName,
          attendanceCode,
          qrImageUrl,
          orderId,
          totalAmount: Number(amount),
        });

        if (context.db) {
          await context.bookingRef!.update({
            barcodeSentAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          updateDummyBooking(orderId, {
            barcodeSentAt: new Date().toISOString(),
          } as any);
        }
      } catch (emailError) {
        console.error('[payments/pakasir/webhook] Failed to send email:', emailError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Webhook Pakasir gagal diproses.' }, { status: 500 });
  }
}