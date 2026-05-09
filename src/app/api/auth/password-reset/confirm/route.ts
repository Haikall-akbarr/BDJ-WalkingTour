import { NextRequest, NextResponse } from 'next/server';
import { deleteSessionsByUserId, getPasswordResetTokenByHash, getUserByEmail, markPasswordResetTokenUsed, updateUserPasswordHash, createSession } from '@/lib/mysql-auth-store';
import { isMySqlEnabled } from '@/lib/mysql';
import { generateSessionToken, getSessionCookieName, getSessionExpiryDate, hashPassword, hashSessionToken, hashResetToken } from '@/lib/auth-session';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    if (!isMySqlEnabled()) {
      return NextResponse.json({ error: 'MySQL backend belum aktif.' }, { status: 400 });
    }

    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const token = String(body?.token || '').trim();
    const password = String(body?.password || '');
    const confirmPassword = String(body?.confirmPassword || '');

    if (!email || !token || !password || !confirmPassword) {
      return NextResponse.json({ error: 'Email, token, dan password wajib diisi.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter.' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Konfirmasi password tidak sama.' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user || user.role !== 'user') {
      return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
    }

    const tokenRecord = await getPasswordResetTokenByHash(hashResetToken(token));
    if (!tokenRecord || tokenRecord.userId !== user.id) {
      return NextResponse.json({ error: 'Token reset tidak valid.' }, { status: 400 });
    }

    if (tokenRecord.usedAt) {
      return NextResponse.json({ error: 'Token reset sudah dipakai.' }, { status: 400 });
    }

    if (!tokenRecord.expiresAt || new Date(tokenRecord.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Token reset sudah kedaluwarsa.' }, { status: 400 });
    }

    await updateUserPasswordHash(user.id, hashPassword(password));
    await markPasswordResetTokenUsed(tokenRecord.id);
    await deleteSessionsByUserId(user.id);

    const sessionToken = generateSessionToken();
    const sessionTokenHash = hashSessionToken(sessionToken);
    const expiresAt = getSessionExpiryDate(14);

    await createSession({
      userId: user.id,
      tokenHash: sessionTokenHash,
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
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Reset password gagal.' }, { status: 500 });
  }
}
