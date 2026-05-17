import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createPasswordResetToken } from '@/lib/auth-store';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';
import { buildPasswordResetEmailHtml, sendAuthEmail } from '@/lib/auth-email';
import { generateResetToken, hashResetToken } from '@/lib/auth-session';

export const runtime = 'nodejs';

function getAppBaseUrl() {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:9002';
}

export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ error: 'Backend database belum aktif.' }, { status: 400 });
    }

    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi.' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user || user.role !== 'user') {
      return NextResponse.json({ ok: true });
    }

    const token = generateResetToken() || randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    try {
      await sendAuthEmail({
        to: user.email,
        subject: 'Reset password BDJ WalkingTour',
        html: buildPasswordResetEmailHtml({ name: user.name, resetUrl }),
      });
    } catch {
      // Jika email gagal, tetap balas OK agar flow tidak bocor ke pengguna.
    }

    return NextResponse.json({ ok: true, resetUrl: process.env.NODE_ENV === 'production' ? undefined : resetUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Permintaan reset password gagal.' }, { status: 500 });
  }
}
