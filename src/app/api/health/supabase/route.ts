import { NextResponse } from 'next/server';
import { checkSupabaseConnection, isSupabaseEnabled } from '@/lib/supabase';
import { getDatabaseProvider } from '@/lib/database-provider';

export async function GET() {
  try {
    const status = await checkSupabaseConnection();

    return NextResponse.json(
      {
        provider: getDatabaseProvider(),
        supabaseEnabled: isSupabaseEnabled(),
        ...status,
      },
      { status: status.ok ? 200 : 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        provider: getDatabaseProvider(),
        supabaseEnabled: isSupabaseEnabled(),
        ok: false,
        message: error?.message || 'Gagal memeriksa koneksi Supabase.',
      },
      { status: 500 }
    );
  }
}
