import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth-session';
import { upsertUser, deleteUserById, getUserByEmail } from '@/lib/auth-store';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';
import { requireAdmin } from '@/lib/api-auth-guard';

export const runtime = 'nodejs';

export async function POST() {
  try {
    // ── Block in production ──
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Seed endpoint dinonaktifkan di production demi keamanan.' },
        { status: 403 }
      );
    }

    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ error: 'Backend database belum aktif.' }, { status: 400 });
    }

    // ── Clean up known malicious accounts ──
    const maliciousEmails = ['hacker@test.com'];
    for (const email of maliciousEmails) {
      const hacker = await getUserByEmail(email);
      if (hacker) {
        await deleteUserById(hacker.id);
        console.log(`[Seed] Deleted malicious account: ${email}`);
      }
    }

    const users = [
      { id: 'admin-1', email: 'admin@bdjwalkingtour.com', name: 'Admin BDJ', role: 'admin', password: 'BDJAdmin@2026!Secure' },
      { id: 'owner-1', email: 'owner@bdjwalkingtour.com', name: 'Owner BDJ', role: 'owner', password: 'BDJOwner@2026!Secure' },
      { id: 'g1', email: 'guide@bdjwalkingtour.com', name: 'Guide BDJ', role: 'guide', password: 'BDJGuide@2026!Secure' },
      { id: 'user-1', email: 'user@bdjwalkingtour.com', name: 'User BDJ', role: 'user', password: 'BDJUser@2026!Secure' },
    ];

    for (const item of users) {
      await upsertUser({
        id: item.id,
        email: item.email,
        name: item.name,
        role: item.role,
        passwordHash: await hashPassword(item.password),
        isActive: true,
      });
    }

    return NextResponse.json({
      ok: true,
      seeded: users.length,
      message: 'Seed berhasil. Catat password baru, lalu segera ganti setelah login pertama.',
      credentials: users.map(u => ({ email: u.email, password: u.password, role: u.role })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Seed user gagal.' }, { status: 500 });
  }
}
