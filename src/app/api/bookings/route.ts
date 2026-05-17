import { NextRequest, NextResponse } from 'next/server';
import { listBookings } from '@/lib/data-store';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';

export const runtime = 'nodejs';

function assertMySql() {
  if (!isDatabaseProviderEnabled()) {
    throw new Error('Backend database belum aktif. Set DB_PROVIDER=mysql atau supabase di environment.');
  }
}

export async function GET(request: NextRequest) {
  try {
    assertMySql();
    const status = request.nextUrl.searchParams.get('status') || undefined;
    const paymentStatus = request.nextUrl.searchParams.get('paymentStatus') || undefined;
    const guideId = request.nextUrl.searchParams.get('guideId') || undefined;
    const unassigned = request.nextUrl.searchParams.get('unassigned') === 'true';
    const bookings = await listBookings({ status, paymentStatus, guideId, unassigned });
    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal mengambil data booking.' }, { status: 500 });
  }
}
