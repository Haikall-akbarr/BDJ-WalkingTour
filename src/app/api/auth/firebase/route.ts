import { createPublicKey, createVerify } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSession, getUserByEmail, upsertUser } from '@/lib/mysql-auth-store';
import { generateSessionToken, getSessionCookieName, getSessionExpiryDate, hashPassword, hashSessionToken } from '@/lib/auth-session';
import { isMySqlEnabled } from '@/lib/mysql';

export const runtime = 'nodejs';

type FirebaseTokenPayload = {
  aud?: string;
  auth_time?: number;
  email?: string;
  email_verified?: boolean;
  exp?: number;
  iat?: number;
  iss?: string;
  name?: string;
  picture?: string;
  sub?: string;
  user_id?: string;
};

type JwtHeader = {
  alg?: string;
  kid?: string;
  typ?: string;
};

const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const CERT_CACHE_TTL_MS = 60 * 60 * 1000;

let cachedCerts: Record<string, string> | null = null;
let cachedCertsAt = 0;

function base64UrlDecode(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

async function getFirebaseCerts() {
  if (cachedCerts && Date.now() - cachedCertsAt < CERT_CACHE_TTL_MS) {
    return cachedCerts;
  }

  const response = await fetch(CERTS_URL);
  if (!response.ok) {
    throw new Error('Tidak bisa memuat sertifikat Firebase.');
  }

  cachedCerts = (await response.json()) as Record<string, string>;
  cachedCertsAt = Date.now();
  return cachedCerts;
}

async function verifyFirebaseIdToken(idToken: string) {
  const projectId = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '').trim();
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID belum disetel.');
  }

  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Format token Firebase tidak valid.');
  }

  const header = JSON.parse(base64UrlDecode(parts[0])) as JwtHeader;
  const payload = JSON.parse(base64UrlDecode(parts[1])) as FirebaseTokenPayload;

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Header token Firebase tidak valid.');
  }

  const certs = await getFirebaseCerts();
  const cert = certs[header.kid];
  if (!cert) {
    throw new Error('Sertifikat Firebase tidak ditemukan.');
  }

  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${parts[0]}.${parts[1]}`);
  verifier.end();

  const isValidSignature = verifier.verify(createPublicKey(cert), Buffer.from(parts[2], 'base64url'));
  if (!isValidSignature) {
    throw new Error('Tanda tangan token Firebase tidak valid.');
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== projectId) {
    throw new Error('Audience token Firebase tidak cocok.');
  }

  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error('Issuer token Firebase tidak cocok.');
  }

  if (!payload.sub) {
    throw new Error('Subjek token Firebase tidak ditemukan.');
  }

  if (!payload.exp || payload.exp <= now) {
    throw new Error('Token Firebase sudah kedaluwarsa.');
  }

  if (!payload.email) {
    throw new Error('Email dari Firebase tidak ditemukan.');
  }

  return payload;
}

export async function POST(request: NextRequest) {
  try {
    if (!isMySqlEnabled()) {
      return NextResponse.json({ error: 'MySQL backend belum aktif.' }, { status: 400 });
    }

    const body = await request.json();
    const idToken = String(body?.idToken || '').trim();

    if (!idToken) {
      return NextResponse.json({ error: 'Firebase ID token wajib diisi.' }, { status: 400 });
    }

    const firebaseUser = await verifyFirebaseIdToken(idToken);
    const email = firebaseUser.email!.toLowerCase();
    const existing = await getUserByEmail(email);

    if (existing && existing.role !== 'user') {
      return NextResponse.json({ error: 'Akun ini dipakai untuk akses Heritage Walks.' }, { status: 403 });
    }

    const user = existing
      ? await upsertUser({
          id: existing.id,
          email: existing.email,
          name: firebaseUser.name || existing.name,
          role: existing.role,
          passwordHash: existing.passwordHash,
          isActive: true,
        })
      : await upsertUser({
          email,
          name: firebaseUser.name || email.split('@')[0],
          role: 'user',
          passwordHash: hashPassword(idToken),
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

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Login Firebase gagal.' }, { status: 500 });
  }
}