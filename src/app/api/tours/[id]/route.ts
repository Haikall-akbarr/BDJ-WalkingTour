import { NextRequest, NextResponse } from 'next/server';
import { deleteTour, updateTour, getTourById } from '@/lib/data-store';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';
import { resolveGoogleMapsUrl } from '@/lib/maps';

export const runtime = 'nodejs';

function assertMySql() {
  if (!isDatabaseProviderEnabled()) {
    throw new Error('Backend database belum aktif. Set DB_PROVIDER=mysql atau supabase di environment.');
  }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertMySql();
    const { id } = await params;
    const tour = await getTourById(id);

    if (!tour) {
      return NextResponse.json({ error: 'Tur tidak ditemukan.' }, { status: 404 });
    }

    // Resolve on the fly if it is a short link or unconverted long URL
    if (tour.routeMapUrl && (tour.routeMapUrl.includes('maps.app.goo.gl') || (tour.routeMapUrl.includes('google.com/maps') && !tour.routeMapUrl.includes('output=embed') && !tour.routeMapUrl.includes('/embed')))) {
      tour.routeMapUrl = await resolveGoogleMapsUrl(tour.routeMapUrl);
    }

    return NextResponse.json({ tour });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal mengambil detail tur.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertMySql();
    const { id } = await params;
    const body = await request.json();

    let routeMapUrl = typeof body?.routeMapUrl === 'undefined' ? undefined : String(body.routeMapUrl || '');
    console.log('PUT received routeMapUrl:', routeMapUrl);
    if (routeMapUrl) {
      routeMapUrl = await resolveGoogleMapsUrl(routeMapUrl);
      console.log('PUT resolved routeMapUrl:', routeMapUrl);
    }

    const tour = await updateTour(id, {
      name: typeof body?.name === 'undefined' ? undefined : String(body.name),
      price: typeof body?.price === 'undefined' ? undefined : Number(body.price),
      date: typeof body?.date === 'undefined' ? undefined : String(body.date || ''),
      description: typeof body?.description === 'undefined' ? undefined : String(body.description || ''),
      distance: typeof body?.distance === 'undefined' ? undefined : String(body.distance || ''),
      duration: typeof body?.duration === 'undefined' ? undefined : String(body.duration || ''),
      descriptionFull: typeof body?.descriptionFull === 'undefined' ? undefined : String(body.descriptionFull || ''),
      historyCulture: typeof body?.historyCulture === 'undefined' ? undefined : String(body.historyCulture || ''),
      historyHighlights: typeof body?.historyHighlights === 'undefined' ? undefined : String(body.historyHighlights || '[]'),
      routeDetail: typeof body?.routeDetail === 'undefined' ? undefined : String(body.routeDetail || ''),
      routeMapUrl: routeMapUrl,
      poiList: typeof body?.poiList === 'undefined' ? undefined : String(body.poiList || '[]'),
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

