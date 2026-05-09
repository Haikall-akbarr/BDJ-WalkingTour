import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieName, generateSessionToken, getSessionExpiryDate, hashPassword, hashSessionToken } from '@/lib/auth-session';
import { createSession, getUserByEmail } from '@/lib/mysql-auth-store';
import { isMySqlEnabled } from '@/lib/mysql';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    if (!isMySqlEnabled()) {
      return NextResponse.json({ error: 'MySQL backend belum aktif.' }, { status: 400 });
    }

    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    if (user.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = getSessionExpiryDate(14);

    await createSession({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
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

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Login gagal.' }, { status: 500 });
  }
}


