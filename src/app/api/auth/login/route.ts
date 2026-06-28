import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieName, generateSessionToken, getSessionExpiryDate, verifyPassword, hashPassword, hashSessionToken } from '@/lib/auth-session';
import { signJwt, JWT_COOKIE_NAME } from '@/lib/jwt';
import { createSession, getUserByEmail } from '@/lib/auth-store';
import { updateUserPasswordHash } from '@/lib/auth-store';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';

export const runtime = 'nodejs';

// ── In-memory rate limiter ──
const LOGIN_ATTEMPTS = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = LOGIN_ATTEMPTS.get(key);

  if (!entry || now > entry.resetAt) {
    LOGIN_ATTEMPTS.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > MAX_ATTEMPTS) {
    return true;
  }

  return false;
}

// Clean up old entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of LOGIN_ATTEMPTS.entries()) {
    if (now > entry.resetAt) {
      LOGIN_ATTEMPTS.delete(key);
    }
  }
}, 30 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ error: 'Backend database belum aktif.' }, { status: 400 });
    }

    // ── Rate limiting ──
    const rateLimitKey = getRateLimitKey(request);
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Email atau password salah.', debug: !user ? 'User not found in DB' : 'User is inactive' }, { status: 401 });
    }

    // ── Verify password (supports bcrypt and legacy SHA-256) ──
    const { valid, needsRehash } = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Email atau password salah.', debug: 'Password hash mismatch' }, { status: 401 });
    }

    // ── Auto-upgrade legacy SHA-256 hash to bcrypt ──
    if (needsRehash) {
      try {
        const newHash = await hashPassword(password);
        await updateUserPasswordHash(user.id, newHash);
      } catch {
        // Non-blocking: if rehash fails, user can still login
      }
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

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Login gagal.' }, { status: 500 });
  }
}
