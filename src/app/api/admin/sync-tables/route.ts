import { NextRequest, NextResponse } from 'next/server';
import { listBookings } from '@/lib/data-store';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';
import { getCurrentSessionUser } from '@/lib/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { syncBookingToTables } from '@/lib/supabase-store';

export const runtime = 'nodejs';

// POST: Force sync all bookings ke 3 tabel (barcode_scans, guide_tour_assignments, notifications)
// Hanya bisa diakses oleh admin/owner
export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ error: 'Database belum aktif.' }, { status: 400 });
    }

    const user = await getCurrentSessionUser();
    if (!user || !['admin', 'owner'].includes(user.role)) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    const { data: bookings, error } = await admin.from('bookings').select('*');

    if (error || !bookings) {
      return NextResponse.json({ error: error?.message || 'Gagal mengambil bookings.' }, { status: 500 });
    }

    let synced = 0;
    let failed = 0;

    for (const booking of bookings) {
      try {
        await syncBookingToTables(booking);
        synced++;
      } catch (err) {
        failed++;
        console.error(`[sync-tables] Failed for booking ${booking.id}:`, err);
      }
    }

    // Count final state
    const { count: scans } = await admin.from('barcode_scans').select('*', { count: 'exact', head: true });
    const { count: assignments } = await admin.from('guide_tour_assignments').select('*', { count: 'exact', head: true });
    const { count: notifications } = await admin.from('notifications').select('*', { count: 'exact', head: true });

    return NextResponse.json({
      ok: true,
      message: `Sync selesai: ${synced} booking berhasil, ${failed} gagal.`,
      totalBookings: bookings.length,
      synced,
      failed,
      tables: {
        barcode_scans: scans,
        guide_tour_assignments: assignments,
        notifications: notifications,
      },
    });
  } catch (error: any) {
    console.error('[sync-tables] Error:', error);
    return NextResponse.json({ error: error?.message || 'Sync gagal.' }, { status: 500 });
  }
}

// GET: Check current state of 3 tables
export async function GET(request: NextRequest) {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ error: 'Database belum aktif.' }, { status: 400 });
    }

    const user = await getCurrentSessionUser();
    if (!user || !['admin', 'owner'].includes(user.role)) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const admin = getSupabaseAdmin();

    const { count: bookingCount } = await admin.from('bookings').select('*', { count: 'exact', head: true });
    const { count: scans } = await admin.from('barcode_scans').select('*', { count: 'exact', head: true });
    const { count: assignments } = await admin.from('guide_tour_assignments').select('*', { count: 'exact', head: true });
    const { count: notifications } = await admin.from('notifications').select('*', { count: 'exact', head: true });
    const { count: guides } = await admin.from('guides').select('*', { count: 'exact', head: true });

    return NextResponse.json({
      ok: true,
      tables: {
        bookings: bookingCount,
        guides: guides,
        barcode_scans: scans,
        guide_tour_assignments: assignments,
        notifications: notifications,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal cek status.' }, { status: 500 });
  }
}
