import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSession, getUserByEmail, upsertUser } from '@/lib/auth-store';
import { generateSessionToken, getSessionCookieName, getSessionExpiryDate, hashPassword, hashSessionToken } from '@/lib/auth-session';
import { signJwt, JWT_COOKIE_NAME } from '@/lib/jwt';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';

export const runtime = 'nodejs';

async function verifyGoogleCredential(credential: string) {
  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();

  if (!clientId) {
    throw new Error('Google Client ID belum disetel di environment.');
  }

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google token tidak valid: ${response.status} ${text}`);
  }

  const payload = await response.json();

  if (payload.aud !== clientId) {
    throw new Error('Google token audience tidak cocok.');
  }

  if (String(payload.email_verified) !== 'true') {
    throw new Error('Email Google belum terverifikasi.');
  }

  if (!payload.email) {
    throw new Error('Email Google tidak ditemukan.');
  }

  return payload as {
    email: string;
    name?: string;
    given_name?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ error: 'Backend database belum aktif.' }, { status: 400 });
    }

    const body = await request.json();
    const credential = String(body?.credential || '').trim();

    if (!credential) {
      return NextResponse.json({ error: 'Credential Google wajib diisi.' }, { status: 400 });
    }

    const googleUser = await verifyGoogleCredential(credential);
    const email = googleUser.email.toLowerCase();
    const existing = await getUserByEmail(email);

    if (existing && existing.role !== 'user') {
      return NextResponse.json({ error: 'Akun ini dipakai untuk akses Heritage Walks.' }, { status: 403 });
    }

    const user = existing
      ? await upsertUser({
          id: existing.id,
          email: existing.email,
          name: googleUser.name || googleUser.given_name || existing.name,
          role: existing.role,
          passwordHash: existing.passwordHash,
          isActive: true,
        })
      : await upsertUser({
          id: randomUUID(),
          email,
          name: googleUser.name || googleUser.given_name || email.split('@')[0],
          role: 'user',
          passwordHash: await hashPassword(randomUUID()),
          isActive: true,
        });

    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = getSessionExpiryDate(14);

    await createSession({
      userId: user!.id,
      tokenHash,
      expiresAt,
    });

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
    return NextResponse.json({ error: error?.message || 'Login Google gagal.' }, { status: 500 });
  }
}
