import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth-session';
import { upsertUser } from '@/lib/auth-store';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';

export const runtime = 'nodejs';

export async function POST() {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ error: 'Backend database belum aktif.' }, { status: 400 });
    }

    const users = [
      { id: 'admin-1', email: 'admin@bdjwalkingtour.com', name: 'Admin BDJ', role: 'admin', password: 'admin123' },
      { id: 'owner-1', email: 'owner@bdjwalkingtour.com', name: 'Owner BDJ', role: 'owner', password: 'owner123' },
      { id: 'g1', email: 'guide@bdjwalkingtour.com', name: 'Guide BDJ', role: 'guide', password: 'guide123' },
      { id: 'user-1', email: 'user@bdjwalkingtour.com', name: 'User BDJ', role: 'user', password: 'user123' },
    ];

    for (const item of users) {
      await upsertUser({
        id: item.id,
        email: item.email,
        name: item.name,
        role: item.role,
        passwordHash: hashPassword(item.password),
        isActive: true,
      });
    }

    return NextResponse.json({ ok: true, seeded: users.length });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Seed user gagal.' }, { status: 500 });
  }
}
