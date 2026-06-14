import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSession, getUserByEmail, upsertUser } from '@/lib/auth-store';
import { generateSessionToken, getSessionCookieName, getSessionExpiryDate, hashPassword, hashSessionToken } from '@/lib/auth-session';
import { signJwt, JWT_COOKIE_NAME } from '@/lib/jwt';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';
import { buildWelcomeEmailHtml, sendAuthEmail } from '@/lib/auth-email';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ error: 'Backend database belum aktif.' }, { status: 400 });
    }

    const body = await request.json();
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const confirmPassword = String(body?.confirmPassword || '');

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter.' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Konfirmasi password tidak sama.' }, { status: 400 });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar. Silakan login atau reset password.' }, { status: 409 });
    }

    const user = await upsertUser({
      id: randomUUID(),
      email,
      name,
      role: 'user',
      passwordHash: hashPassword(password),
      isActive: true,
    });

    if (user) {
      try {
        await sendAuthEmail({
          to: user.email,
          subject: 'Akun BDJ WalkingTour berhasil dibuat',
          html: buildWelcomeEmailHtml({ name: user.name, email: user.email, password }),
          text: `Halo ${user.name},\n\nSelamat bergabung dengan BDJ Walking Tour!\n\nDetail Login Akun Anda:\nEmail/Username: ${user.email}\nPassword: ${password}\n\nSilakan login ke akun Anda di http://localhost:9002/login\n\nSelamat bergabung!\nBDJ Walking Tour`,
        });
      } catch {
        // Non-blocking: akun tetap dibuat walau email gagal.
      }
    }

    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = getSessionExpiryDate(14);

    await createSession({ userId: user!.id, tokenHash, expiresAt });

    const response = NextResponse.json({
      user: {
        id: user!.id,
        email: user!.email,
        name: user!.name,
        role: user!.role,
      },
    });

    response.cookies.set({
      name: getSessionCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    // Create JWT token for Middleware
    const jwtToken = await signJwt({
      id: user!.id,
      email: user!.email,
      name: user!.name,
      role: user!.role,
    });

    response.cookies.set({
      name: JWT_COOKIE_NAME,
      value: jwtToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Pembuatan akun gagal.' }, { status: 500 });
  }
}
