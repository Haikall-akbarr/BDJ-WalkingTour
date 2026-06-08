import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieName, generateSessionToken, getSessionExpiryDate, hashPassword, hashSessionToken } from '@/lib/auth-session';
import { signJwt, JWT_COOKIE_NAME } from '@/lib/jwt';
import { createSession, getUserByEmail } from '@/lib/auth-store';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ error: 'Backend database belum aktif.' }, { status: 400 });
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

    // Create JWT token for Middleware
    const jwtToken = await signJwt({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
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

    // explicitly append just to be 100% sure the header gets written correctly in Next.js 15 Edge
    const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
    response.headers.append('Set-Cookie', `${JWT_COOKIE_NAME}=${jwtToken}; Path=/; Expires=${expiresAt.toUTCString()}; HttpOnly; SameSite=Lax; ${secureFlag}`);
    
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Login gagal.' }, { status: 500 });
  }
}


