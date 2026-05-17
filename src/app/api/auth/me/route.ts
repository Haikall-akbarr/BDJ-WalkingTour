import { NextResponse } from 'next/server';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';
import { getCurrentSessionUser } from '@/lib/server-auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ user: null });
    }

    const user = await getCurrentSessionUser();
    return NextResponse.json({ user: user || null });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal mengambil sesi.' }, { status: 500 });
  }
}
