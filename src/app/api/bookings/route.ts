import { NextRequest, NextResponse } from 'next/server';
import { listBookings } from '@/lib/mysql-store';
import { isMySqlEnabled } from '@/lib/mysql';

export const runtime = 'nodejs';

function assertMySql() {
  if (!isMySqlEnabled()) {
    throw new Error('MySQL backend belum aktif. Set DB_PROVIDER=mysql di environment.');
  }
}

export async function GET(request: NextRequest) {
  try {
    assertMySql();
    const status = request.nextUrl.searchParams.get('status') || undefined;
    const guideId = request.nextUrl.searchParams.get('guideId') || undefined;
    const unassigned = request.nextUrl.searchParams.get('unassigned') === 'true';
    const bookings = await listBookings({ status, guideId, unassigned });
    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal mengambil data booking.' }, { status: 500 });
  }
}
