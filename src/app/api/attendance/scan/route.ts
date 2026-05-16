import { NextRequest, NextResponse } from 'next/server';
import { findDummyBookingByAttendanceCode, updateDummyBooking, initializeDummyBookings } from '@/lib/dummy-booking-store';
import { isMySqlEnabled } from '@/lib/mysql';
import { getBookingByAttendanceCode, updateBooking } from '@/lib/mysql-store';
import { logAuditEvent } from '@/lib/audit-log';

export const runtime = 'nodejs';

// GET endpoint for health check
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'ok', message: 'Attendance scan endpoint is ready' });
}

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

    // Try MySQL first, then fallback to dummy bookings
    let booking = null;
    let bookingId = null;
    let usedMySql = false;

    if (isMySqlEnabled()) {
      const mysqlBooking = await getBookingByAttendanceCode(attendanceCode);
      if (mysqlBooking) {
        booking = mysqlBooking;
        bookingId = mysqlBooking.id;
        usedMySql = true;
      }
    }

    // If not found in MySQL, try local dummy bookings
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

    // Update in MySQL if available, otherwise update local dummy booking
    if (usedMySql) {
      await updateBooking(bookingId!, {
        attendanceScannedAt: new Date().toISOString(),
        attendanceScannedBy: scannedBy,
        attendanceStatus: 'present',
      });
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

    await logAuditEvent({
      action: 'ticket_scanned',
      entityType: 'booking',
      entityId: bookingId!,
      actorId: scannedBy || null,
      actorRole: 'guide',
      actorName: scannedBy || 'guide',
      details: {
        attendanceCode,
        source: usedMySql ? 'mysql' : 'local',
        bookingUserName: booking?.userName || null,
        tourName: booking?.tourName || null,
      },
    });

    return NextResponse.json({
      ok: true,
      bookingId,
      booking,
      source: usedMySql ? 'mysql' : 'local',
    });
  } catch (error: any) {
    console.error('[attendance/scan] Fatal error:', error?.message, error?.stack);
    return NextResponse.json({ error: error?.message || 'Scan attendance gagal.' }, { status: 500 });
  }
}
