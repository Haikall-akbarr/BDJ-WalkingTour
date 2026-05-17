import { NextResponse } from 'next/server';
import { checkSupabaseConnection, isSupabaseEnabled } from '@/lib/supabase';

export async function GET() {
  try {
    const status = await checkSupabaseConnection();

    return NextResponse.json(
      {
        provider: process.env.DB_PROVIDER || 'mysql',
        supabaseEnabled: isSupabaseEnabled(),
        ...status,
      },
      { status: status.ok ? 200 : 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        provider: process.env.DB_PROVIDER || 'mysql',
        supabaseEnabled: isSupabaseEnabled(),
        ok: false,
        message: error?.message || 'Gagal memeriksa koneksi Supabase.',
      },
      { status: 500 }
    );
  }
}
