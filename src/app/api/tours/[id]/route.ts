import { NextRequest, NextResponse } from 'next/server';
import { deleteTour, updateTour } from '@/lib/mysql-store';
import { isMySqlEnabled } from '@/lib/mysql';

export const runtime = 'nodejs';

function assertMySql() {
  if (!isMySqlEnabled()) {
    throw new Error('MySQL backend belum aktif. Set DB_PROVIDER=mysql di environment.');
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertMySql();
    const { id } = await params;
    const body = await request.json();

    const tour = await updateTour(id, {
      name: typeof body?.name === 'undefined' ? undefined : String(body.name),
      price: typeof body?.price === 'undefined' ? undefined : Number(body.price),
      date: typeof body?.date === 'undefined' ? undefined : String(body.date || ''),
      description: typeof body?.description === 'undefined' ? undefined : String(body.description || ''),
      distance: typeof body?.distance === 'undefined' ? undefined : String(body.distance || ''),
      duration: typeof body?.duration === 'undefined' ? undefined : String(body.duration || ''),
    });

    if (!tour) {
      return NextResponse.json({ error: 'Tur tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ tour });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal memperbarui tur.' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertMySql();
    const { id } = await params;
    const deleted = await deleteTour(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Tur tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal menghapus tur.' }, { status: 500 });
  }
}
