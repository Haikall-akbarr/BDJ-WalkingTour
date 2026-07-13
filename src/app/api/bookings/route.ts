import { NextRequest, NextResponse } from 'next/server';
import { listBookings } from '@/lib/data-store';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';
import { getUserByEmail } from '@/lib/auth-store';
import { requireRole } from '@/lib/api-auth-guard';

export const runtime = 'nodejs';

function assertMySql() {
  if (!isDatabaseProviderEnabled()) {
    throw new Error('Backend database belum aktif. Set DB_PROVIDER=mysql atau supabase di environment.');
  }
}

export async function GET(request: NextRequest) {
  try {
    assertMySql();
    
    // Auth Guard: Only authenticated users with valid roles can access
    const auth = await requireRole('admin', 'owner', 'guide', 'user');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const status = request.nextUrl.searchParams.get('status') || undefined;
    const paymentStatus = request.nextUrl.searchParams.get('paymentStatus') || undefined;
    const guideId = request.nextUrl.searchParams.get('guideId') || undefined;
    const unassigned = request.nextUrl.searchParams.get('unassigned') === 'true';
    
    let bookings = await listBookings({ status, paymentStatus, guideId, unassigned });

    // Filter bookings if the requester is a regular user (can only see their own)
    if (auth.user.role === 'user') {
      bookings = bookings.filter(
        (b) => b.userEmail?.toLowerCase() === auth.user.email.toLowerCase()
      );
    }
    
    // Enrich bookings with emergencyContact from users table
    const uniqueEmails = [...new Set(bookings.map((b) => b.userEmail).filter(Boolean))];
    const userMap = new Map();
    if (uniqueEmails.length > 0) {
      await Promise.all(
        uniqueEmails.map(async (email) => {
          try {
            if (email) {
              const u = await getUserByEmail(email);
              if (u) userMap.set(email.toLowerCase(), u);
            }
          } catch { /* ignore */ }
        })
      );
    }

    const enrichedBookings = bookings.map((b) => {
      const bookingUser = b.userEmail ? userMap.get(b.userEmail.toLowerCase()) : null;
      return {
        ...b,
        userEmergencyContact: bookingUser?.emergencyContact || null,
      };
    });

    return NextResponse.json({ bookings: enrichedBookings });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal mengambil data booking.' }, { status: 500 });
  }
}
