import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSessionByTokenHash } from '@/lib/auth-store';
import { getSessionCookieName, hashSessionToken } from '@/lib/auth-session';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;

    if (token) {
      await deleteSessionByTokenHash(hashSessionToken(token));
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: getSessionCookieName(),
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Logout gagal.' }, { status: 500 });
  }
}
