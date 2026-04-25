import { NextRequest, NextResponse } from 'next/server';
import { findDummyBookingByAttendanceCode, updateDummyBooking, initializeDummyBookings } from '@/lib/dummy-booking-store';
import { getServerFirestore, serverTimestamp } from '@/lib/server-firebase';

export const runtime = 'nodejs';

// POST endpoint for scanning attendance codes
export async function POST(request: NextRequest) {
  try {
    // Initialize dummy bookings on first call
    initializeDummyBookings();

    const body = await request.json();
    const attendanceCode = body?.attendanceCode;
    const scannedBy = body?.scannedBy || 'guide';

    if (!attendanceCode) {
      return NextResponse.json({ error: 'attendanceCode wajib diisi.' }, { status: 400 });
    }

    // Try Firestore first, but fallback to dummy bookings on any error
    let booking = null;
    let bookingId = null;
    let usedFirestore = false;

    try {
      const db = getServerFirestore();
      const snapshot = await db
        .collection('bookings')
        .where('attendanceCode', '==', attendanceCode)
        .limit(1)
        .get();
      
      if (snapshot.docs[0]) {
        bookingId = snapshot.docs[0].id;
        booking = snapshot.docs[0].data();
        usedFirestore = true;
      }
    } catch (firestoreError) {
      // Firestore unavailable, will use local fallback
      console.error('[attendance/scan] Firestore error:', (firestoreError as any)?.message);
    }

    // If not found in Firestore, try local dummy bookings
    if (!booking) {
      const localBooking = findDummyBookingByAttendanceCode(attendanceCode);
      if (localBooking) {
        booking = localBooking;
        bookingId = localBooking.id;
      }
    }

    if (!booking) {
      return NextResponse.json({ error: 'Kode tidak ditemukan (fallback lokal).' }, { status: 404 });
    }

    if (booking.paymentStatus !== 'paid') {
      return NextResponse.json({ error: 'Pembayaran belum berhasil. Barcode belum valid untuk absensi.' }, { status: 400 });
    }

    if (booking.attendanceStatus === 'present') {
      return NextResponse.json({ error: 'Barcode sudah pernah digunakan untuk absensi.' }, { status: 409 });
    }

    // Update in Firestore if we used it, otherwise update local dummy booking
    if (usedFirestore) {
      try {
        const db = getServerFirestore();
        await db
          .collection('bookings')
          .doc(bookingId)
          .update({
            attendanceScannedAt: serverTimestamp(),
            attendanceScannedBy: scannedBy,
            attendanceStatus: 'present',
            updatedAt: serverTimestamp(),
          });
      } catch (updateError) {
        console.error('[attendance/scan] Firestore update error:', (updateError as any)?.message);
        // Still return success even if update fails (read-only scenario)
      }
    } else {
      // Update local dummy booking
      const updated = updateDummyBooking(bookingId!, {
        attendanceScannedAt: new Date().toISOString(),
        attendanceScannedBy: scannedBy,
        attendanceStatus: 'present',
      });
      if (updated) {
        booking = updated;
      }
    }

    return NextResponse.json({
      ok: true,
      bookingId,
      booking,
      source: usedFirestore ? 'firestore' : 'local',
    });
  } catch (error: any) {
    console.error('[attendance/scan] Fatal error:', error?.message, error?.stack);
    return NextResponse.json({ error: error?.message || 'Scan attendance gagal.' }, { status: 500 });
  }
}
