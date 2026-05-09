import { NextResponse } from 'next/server';
import { isMySqlEnabled } from '@/lib/mysql';
import { getCurrentSessionUser } from '@/lib/server-auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    if (!isMySqlEnabled()) {
      return NextResponse.json(
        { user: null },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
            Pragma: 'no-cache',
          },
        }
      );
    }

    const user = await getCurrentSessionUser();
    return NextResponse.json(
      { user: user || null },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal mengambil sesi.' }, { status: 500 });
  }
}
