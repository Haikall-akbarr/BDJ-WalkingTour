import { NextRequest, NextResponse } from 'next/server';
import { updateBooking } from '@/lib/data-store';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';

export const runtime = 'nodejs';

function assertMySql() {
  if (!isDatabaseProviderEnabled()) {
    throw new Error('Backend database belum aktif. Set DB_PROVIDER=mysql atau supabase di environment.');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertMySql();
    const body = await request.json();
    const { id } = await params;

    if (!body?.status) {
      return NextResponse.json({ error: 'status wajib diisi.' }, { status: 400 });
    }

    const booking = await updateBooking(id, {
      status: String(body.status),
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal memperbarui status booking.' }, { status: 500 });
  }
}
