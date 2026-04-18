import { NextRequest, NextResponse } from 'next/server';
import { createDummyBooking } from '@/lib/dummy-booking-store';
import { getServerFirestore, isFirebaseAdminUnavailableError, serverTimestamp } from '@/lib/server-firebase';
import { BookingPaymentPayload } from '@/lib/payment-helpers';

export const runtime = 'nodejs';

function getGatewayBaseUrl() {
  return process.env.MIDTRANS_IS_PRODUCTION === 'true'
    ? 'https://app.midtrans.com'
    : 'https://app.sandbox.midtrans.com';
}

function buildBasicAuthHeader(serverKey: string) {
  return `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BookingPaymentPayload;

    if (!body?.name || !body?.whatsapp || !body?.email || !body?.tourId || !body?.tourName || !body?.tourPrice || !body?.pax) {
      return NextResponse.json({ error: 'Payload booking tidak lengkap.' }, { status: 400 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const paymentMode = (process.env.PAYMENT_MODE || '').toLowerCase();
    const useDummyMode = paymentMode === 'dummy' || !serverKey;

    let db: ReturnType<typeof getServerFirestore> | null = null;
    let tourName = body.tourName;
    let tourPrice = Number(body.tourPrice);
    let orderId: string | null = null;

    try {
      db = getServerFirestore();
      const tourDocRef = db.collection('tours').doc(body.tourId);
      const tourDoc = await tourDocRef.get();
      const tourData = tourDoc.data();
      tourName = tourDoc.exists ? (tourData?.name || body.tourName) : body.tourName;
      tourPrice = tourDoc.exists ? Number(tourData?.price || body.tourPrice) : Number(body.tourPrice);
    } catch (dbInitError) {
      if (!(useDummyMode && isFirebaseAdminUnavailableError(dbInitError))) {
        throw dbInitError;
      }

      db = null;
    }

    const grossAmount = tourPrice * Number(body.pax);

    if (db) {
      const bookingRef = await db.collection('bookings').add({
        userName: body.name,
        userWhatsApp: body.whatsapp,
        userEmail: body.email || '',
        domicile: body.domicile,
        customDomicile: body.customDomicile || '',
        tourId: body.tourId,
        tourName,
        pax: Number(body.pax),
        pricePerPax: tourPrice,
        grossAmount,
        status: 'pending_payment',
        paymentStatus: 'pending_payment',
        paymentGateway: useDummyMode ? 'dummy' : 'midtrans',
        paymentOrderId: null,
        paymentTransactionId: null,
        paymentCheckoutUrl: null,
        attendanceCode: null,
        attendanceQrImageUrl: null,
        attendanceScannedAt: null,
        attendanceScannedBy: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      orderId = bookingRef.id;
    }

    if (!orderId && useDummyMode) {
      const localBooking = createDummyBooking({
        userName: body.name,
        userWhatsApp: body.whatsapp,
        userEmail: body.email || '',
        domicile: body.domicile,
        customDomicile: body.customDomicile || '',
        tourId: body.tourId,
        tourName,
        pax: Number(body.pax),
        pricePerPax: tourPrice,
        grossAmount,
        status: 'pending_payment',
        paymentStatus: 'pending_payment',
        paymentGateway: 'dummy',
        paymentOrderId: null,
        paymentTransactionId: null,
        paymentCheckoutUrl: null,
        attendanceCode: null,
        attendanceQrImageUrl: null,
        attendanceScannedAt: null,
        attendanceScannedBy: null,
      });

      orderId = localBooking.id;
    }

    if (!orderId) {
      throw new Error('Gagal membuat booking pembayaran. Firebase Admin credentials belum tersedia.');
    }

    const snapPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: [
        {
          id: body.tourId,
          price: tourPrice,
          quantity: Number(body.pax),
          name: tourName,
        },
      ],
      customer_details: {
        first_name: body.name,
        email: body.email || undefined,
        phone: body.whatsapp,
      },
      callbacks: {
        finish: `${process.env.APP_BASE_URL || 'http://localhost:9002'}/book/${body.tourId}`,
      },
    };

    if (useDummyMode) {
      const baseUrl = process.env.APP_BASE_URL || 'http://localhost:9002';
      const dummyCheckoutUrl = `${baseUrl}/payments/dummy/${orderId}`;

      if (db) {
        await db.collection('bookings').doc(orderId).update({
          paymentOrderId: orderId,
          paymentCheckoutUrl: dummyCheckoutUrl,
          paymentStatus: 'pending_payment',
          updatedAt: serverTimestamp(),
        });
      } else {
        createDummyBooking({
          id: orderId,
          userName: body.name,
          userWhatsApp: body.whatsapp,
          userEmail: body.email || '',
          domicile: body.domicile,
          customDomicile: body.customDomicile || '',
          tourId: body.tourId,
          tourName,
          pax: Number(body.pax),
          pricePerPax: tourPrice,
          grossAmount,
          status: 'pending_payment',
          paymentStatus: 'pending_payment',
          paymentGateway: 'dummy',
          paymentOrderId: orderId,
          paymentTransactionId: null,
          paymentCheckoutUrl: dummyCheckoutUrl,
          attendanceCode: null,
          attendanceQrImageUrl: null,
          attendanceScannedAt: null,
          attendanceScannedBy: null,
        });
      }

      return NextResponse.json({
        bookingId: orderId,
        checkoutUrl: dummyCheckoutUrl,
        paymentGateway: 'dummy',
        grossAmount,
      });
    }

    const response = await fetch(`${getGatewayBaseUrl()}/snap/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: buildBasicAuthHeader(serverKey as string),
      },
      body: JSON.stringify(snapPayload),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: 'Gagal membuat transaksi Midtrans.', details: text, bookingId: orderId },
        { status: 502 }
      );
    }

    const midtransData = await response.json();
    const checkoutUrl = midtransData.redirect_url || midtransData.redirectUrl || midtransData.url || null;

    if (!db) {
      throw new Error('Midtrans mode membutuhkan Firebase Admin credentials yang valid.');
    }

    await db.collection('bookings').doc(orderId).update({
      paymentOrderId: orderId,
      paymentCheckoutUrl: checkoutUrl,
      paymentStatus: 'pending_payment',
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      bookingId: orderId,
      checkoutUrl,
      paymentGateway: 'midtrans',
      grossAmount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan saat membuat pembayaran.' },
      { status: 500 }
    );
  }
}
