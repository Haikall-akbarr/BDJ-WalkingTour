import { NextResponse } from 'next/server';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';
import { getCurrentSessionUser } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ user: null });
    }

    const user = await getCurrentSessionUser();
    
    // Debug logging - check terminal for this output
    if (user) {
      console.log('[/api/auth/me] user data:', JSON.stringify({
        id: user.id,
        name: user.name,
        emergencyContact: user.emergencyContact,
        address: user.address,
      }));
    }

    return NextResponse.json({ user: user || null });
  } catch (error: any) {
    console.error('[/api/auth/me] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Gagal mengambil sesi.' }, { status: 500 });
  }
}
