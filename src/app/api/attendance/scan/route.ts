import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { findDummyBookingByAttendanceCode, updateDummyBooking, initializeDummyBookings } from '@/lib/dummy-booking-store';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';
import { getBookingByAttendanceCode, updateBooking } from '@/lib/data-store';
import { logAuditEvent } from '@/lib/audit-log';
import { getSupabaseAdmin } from '@/lib/supabase';

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

    // Try the active database provider first, then fallback to dummy bookings
    let booking = null;
    let bookingId = null;
    let usedMySql = false;

    if (isDatabaseProviderEnabled()) {
      const mysqlBooking = await getBookingByAttendanceCode(attendanceCode);
      if (mysqlBooking) {
        booking = mysqlBooking;
        bookingId = mysqlBooking.id;
        usedMySql = true;
      }
    }

    // If not found in the database, try local dummy bookings
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

    const scannedAt = new Date().toISOString();

    // Update in the active database provider if available, otherwise update local dummy booking
    if (usedMySql) {
      await updateBooking(bookingId!, {
        attendanceScannedAt: scannedAt,
        attendanceScannedBy: scannedBy,
        attendanceStatus: 'present',
      });

      try {
        const admin = getSupabaseAdmin();

        // Resolve actual guide_id from guides table using scannedBy (user_id)
        let actualGuideId = scannedBy;
        const { data: guideData } = await admin.from('guides').select('id').eq('user_id', scannedBy).maybeSingle();
        if (guideData?.id) {
          actualGuideId = guideData.id;
        }

        // Insert into barcode_scans with generated UUID
        const scanId = randomUUID();
        const { error: scanError } = await admin.from('barcode_scans').insert({
          id: scanId,
          booking_id: bookingId,
          guide_id: actualGuideId,
          attendance_code: attendanceCode,
          scanned_at: scannedAt,
          location: body?.location || null,
          notes: `Scan absensi: ${booking?.userName || '-'} - ${booking?.tourName || '-'}${body?.notes ? '. ' + body.notes : ''}`
        });

        if (scanError) {
          console.error('[barcode_scans] Insert error:', scanError);
        }

        // Insert notification for attendance scan (notify owner/admin)
        try {
          // Notify the booking owner (user who booked)
          const { data: userData } = await admin.from('users').select('id').eq('email', booking.userEmail).maybeSingle();
          if (userData?.id) {
            await admin.from('notifications').insert({
              id: randomUUID(),
              recipient_id: userData.id,
              type: 'attendance_scanned',
              title: 'Absensi Berhasil',
              message: `Peserta ${booking.userName} telah berhasil di-scan untuk tur ${booking.tourName}.`,
              related_id: bookingId,
              action_url: `/payments/success/${bookingId}`,
            });
          }

          // Notify owner/admin users about the scan
          const { data: adminUsers } = await admin.from('users').select('id').in('role', ['owner', 'admin']);
          if (adminUsers && adminUsers.length > 0) {
            const adminNotifs = adminUsers.map((u: any) => ({
              id: randomUUID(),
              recipient_id: u.id,
              type: 'attendance_scanned',
              title: 'Peserta Sudah Absen',
              message: `Peserta ${booking.userName} sudah discan oleh guide untuk tur ${booking.tourName}.`,
              related_id: bookingId,
              action_url: `/dashboard/owner`,
            }));
            await admin.from('notifications').insert(adminNotifs);
          }
        } catch (notifErr) {
          console.error('[attendance/scan] Failed to insert notifications:', notifErr);
        }

      } catch (err) {
        console.error('Failed to insert into barcode_scans:', err);
      }
    } else {
      // Update local dummy booking
      const updated = updateDummyBooking(bookingId!, {
        attendanceScannedAt: scannedAt,
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
        source: usedMySql ? 'database' : 'local',
        bookingUserName: booking?.userName || null,
        tourName: booking?.tourName || null,
      },
    });

    return NextResponse.json({
      ok: true,
      bookingId,
      booking,
      source: usedMySql ? 'database' : 'local',
    });
  } catch (error: any) {
    console.error('[attendance/scan] Fatal error:', error?.message, error?.stack);
    return NextResponse.json({ error: error?.message || 'Scan attendance gagal.' }, { status: 500 });
  }
}
