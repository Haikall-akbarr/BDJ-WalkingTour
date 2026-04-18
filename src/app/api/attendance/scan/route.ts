import { NextRequest, NextResponse } from 'next/server';
import { findDummyBookingByAttendanceCode, updateDummyBooking } from '@/lib/dummy-booking-store';
import { getServerFirestore, isFirebaseAdminUnavailableError, serverTimestamp } from '@/lib/server-firebase';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const attendanceCode = body?.attendanceCode;
    const scannedBy = body?.scannedBy || 'guide';

    if (!attendanceCode) {
      return NextResponse.json({ error: 'attendanceCode wajib diisi.' }, { status: 400 });
    }

    try {
      const db = getServerFirestore();
      const snapshot = await db
        .collection('bookings')
        .where('attendanceCode', '==', attendanceCode)
        .limit(1)
        .get();
      const bookingDoc = snapshot.docs[0];

      if (!bookingDoc) {
        return NextResponse.json({ error: 'Kode tidak ditemukan.' }, { status: 404 });
      }

      const booking = bookingDoc.data() as any;

      if (booking.paymentStatus !== 'paid') {
        return NextResponse.json({ error: 'Pembayaran belum berhasil. Barcode belum valid untuk absensi.' }, { status: 400 });
      }

      if (booking.attendanceStatus === 'present') {
        return NextResponse.json({ error: 'Barcode sudah pernah digunakan untuk absensi.' }, { status: 409 });
      }

      await bookingDoc.ref.update({
        attendanceScannedAt: serverTimestamp(),
        attendanceScannedBy: scannedBy,
        attendanceStatus: 'present',
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json({
        ok: true,
        bookingId: bookingDoc.id,
        booking: bookingDoc.data(),
      });
    } catch (dbError) {
      if (!isFirebaseAdminUnavailableError(dbError)) {
        throw dbError;
      }

      const localBooking = findDummyBookingByAttendanceCode(attendanceCode);
      if (!localBooking) {
        return NextResponse.json({ error: 'Kode tidak ditemukan (fallback lokal).' }, { status: 404 });
      }

      if (localBooking.paymentStatus !== 'paid') {
        return NextResponse.json({ error: 'Pembayaran belum berhasil. Barcode belum valid untuk absensi.' }, { status: 400 });
      }

      if (localBooking.attendanceStatus === 'present') {
        return NextResponse.json({ error: 'Barcode sudah pernah digunakan untuk absensi.' }, { status: 409 });
      }

      const updated = updateDummyBooking(localBooking.id, {
        attendanceScannedAt: new Date().toISOString(),
        attendanceScannedBy: scannedBy,
        attendanceStatus: 'present',
      });

      return NextResponse.json({
        ok: true,
        bookingId: localBooking.id,
        booking: updated,
        localFallback: true,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Scan attendance gagal.' }, { status: 500 });
  }
}
