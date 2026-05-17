import { NextRequest, NextResponse } from 'next/server';
import { createTour, listTours } from '@/lib/data-store';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';

export const runtime = 'nodejs';

function assertMySql() {
  if (!isDatabaseProviderEnabled()) {
    throw new Error('Backend database belum aktif. Set DB_PROVIDER=mysql atau supabase di environment.');
  }
}

export async function GET() {
  try {
    assertMySql();
    const tours = await listTours();
    return NextResponse.json({ tours });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal mengambil data tur.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    assertMySql();
    const body = await request.json();

    if (!body?.name || typeof body?.price === 'undefined') {
      return NextResponse.json({ error: 'name dan price wajib diisi.' }, { status: 400 });
    }

    const tour = await createTour({
      name: String(body.name),
      price: Number(body.price || 0),
      date: body.date ? String(body.date) : '',
      description: body.description ? String(body.description) : '',
      distance: body.distance ? String(body.distance) : '3 KM',
      duration: body.duration ? String(body.duration) : '2 Jam',
    });

    return NextResponse.json({ tour }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal membuat tur.' }, { status: 500 });
  }
}
