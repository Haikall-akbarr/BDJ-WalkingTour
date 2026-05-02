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

function getPakasirBaseUrl() {
  return process.env.PAKASIR_BASE_URL || 'https://app.pakasir.com';
}

function getPublicBaseUrl(request: NextRequest) {
  return new URL(request.url).origin;
}

function buildPublicUrl(request: NextRequest, path: string) {
  return new URL(path, getPublicBaseUrl(request)).toString();
}

function buildBasicAuthHeader(serverKey: string) {
  return `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;
}

function getResolvedPaymentMode() {
  const hasPakasirCredentials = Boolean(
    (process.env.PAKASIR_PROJECT_SLUG || process.env.PAKASIR_PROJECT) && process.env.PAKASIR_API_KEY
  );

  if (hasPakasirCredentials) {
    return 'pakasir';
  }

  const explicitMode = (process.env.PAYMENT_MODE || '').trim().toLowerCase();
  if (explicitMode === 'manual' || explicitMode === 'dummy') {
    return explicitMode;
  }

  if (explicitMode === 'midtrans' && process.env.MIDTRANS_SERVER_KEY) {
    return 'midtrans';
  }

  const hasManualConfig = Boolean(
    process.env.PAYMENT_MANUAL_BANK_NAME ||
    process.env.PAYMENT_MANUAL_ACCOUNT_NAME ||
    process.env.PAYMENT_MANUAL_ACCOUNT_NUMBER ||
    process.env.PAYMENT_MANUAL_QR_IMAGE_URL
  );

  if (hasManualConfig) {
    return 'manual';
  }

  return 'dummy';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BookingPaymentPayload;

    if (!body?.name || !body?.whatsapp || !body?.email || !body?.tourId || !body?.tourName || !body?.tourPrice || !body?.pax) {
      return NextResponse.json({ error: 'Payload booking tidak lengkap.' }, { status: 400 });
    }

    const paymentMode = getResolvedPaymentMode();
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const useDummyMode = paymentMode === 'dummy';
    const useManualMode = paymentMode === 'manual';
    const usePakasirMode = paymentMode === 'pakasir';

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
      if (!isFirebaseAdminUnavailableError(dbInitError)) {
        throw dbInitError;
      }

      db = null;
    }

    const grossAmount = tourPrice * Number(body.pax);
    const bookingPayload = {
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
      paymentGateway: usePakasirMode ? 'pakasir' : useManualMode ? 'manual' : 'dummy',
      paymentOrderId: null,
      paymentTransactionId: null,
      paymentCheckoutUrl: null,
      attendanceCode: null,
      attendanceQrImageUrl: null,
      attendanceScannedAt: null,
      attendanceScannedBy: null,
    } as const;

    if (db) {
      try {
        const bookingRef = await db.collection('bookings').add({
          ...bookingPayload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        orderId = bookingRef.id;
      } catch (bookingWriteError) {
        if (!isFirebaseAdminUnavailableError(bookingWriteError)) {
          throw bookingWriteError;
        }

        db = null;
      }
    }

    if (!orderId && (useDummyMode || useManualMode || usePakasirMode)) {
      const localBooking = createDummyBooking({
        ...bookingPayload,
        paymentOrderId: null,
        paymentTransactionId: null,
        paymentCheckoutUrl: null,
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
        finish: buildPublicUrl(request, `/payments/success/${orderId}`),
      },
    };

    if (useManualMode) {
      const manualCheckoutUrl = buildPublicUrl(request, `/payments/manual/${orderId}`);

      if (db) {
        await db.collection('bookings').doc(orderId).update({
          paymentOrderId: orderId,
          paymentCheckoutUrl: manualCheckoutUrl,
          paymentStatus: 'pending_payment',
          paymentGateway: 'manual',
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
          paymentGateway: 'manual',
          paymentOrderId: orderId,
          paymentTransactionId: null,
          paymentCheckoutUrl: manualCheckoutUrl,
          attendanceCode: null,
          attendanceQrImageUrl: null,
          attendanceScannedAt: null,
          attendanceScannedBy: null,
        });
      }

      return NextResponse.json({
        bookingId: orderId,
        checkoutUrl: manualCheckoutUrl,
        paymentGateway: 'manual',
        grossAmount,
      });
    }

    if (usePakasirMode) {
      const pakasirProject = process.env.PAKASIR_PROJECT_SLUG || process.env.PAKASIR_PROJECT || '';
      const pakasirApiKey = process.env.PAKASIR_API_KEY || '';
      const pakasirBaseUrl = getPakasirBaseUrl();
      const pakasirRedirectUrl = buildPublicUrl(request, `/payments/success/${orderId}`);
      const pakasirUrl = new URL(`/pay/${pakasirProject}/${grossAmount}`, pakasirBaseUrl);

      pakasirUrl.searchParams.set('order_id', orderId);
      pakasirUrl.searchParams.set('redirect', pakasirRedirectUrl);

      if ((process.env.PAKASIR_QRIS_ONLY || '').toLowerCase() === 'true') {
        pakasirUrl.searchParams.set('qris_only', '1');
      }

      if (!pakasirProject || !pakasirApiKey) {
        return NextResponse.json(
          { error: 'Pakasir mode membutuhkan PAKASIR_PROJECT_SLUG dan PAKASIR_API_KEY.' },
          { status: 400 }
        );
      }

      if (db) {
        await db.collection('bookings').doc(orderId).update({
          paymentOrderId: orderId,
          paymentCheckoutUrl: pakasirUrl.toString(),
          paymentStatus: 'pending_payment',
          paymentGateway: 'pakasir',
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
          paymentGateway: 'pakasir',
          paymentOrderId: orderId,
          paymentTransactionId: null,
          paymentCheckoutUrl: pakasirUrl.toString(),
          attendanceCode: null,
          attendanceQrImageUrl: null,
          attendanceScannedAt: null,
          attendanceScannedBy: null,
        });
      }

      return NextResponse.json({
        bookingId: orderId,
        checkoutUrl: pakasirUrl.toString(),
        paymentGateway: 'pakasir',
        grossAmount,
      });
    }

    if (useDummyMode) {
      const dummyCheckoutUrl = buildPublicUrl(request, `/payments/dummy/${orderId}`);

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
