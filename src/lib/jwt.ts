import { SignJWT, jwtVerify } from 'jose';

export const JWT_COOKIE_NAME = 'bdj_jwt';

export function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable belum di-set. ' +
      'Tambahkan JWT_SECRET di .env.local (development) atau di environment variables hosting Anda (production). ' +
      'Gunakan string acak minimal 32 karakter.'
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signJwt(payload: { id: string; email: string; role: string; name: string }) {
  try {
    const secret = getJwtSecretKey();
    const alg = 'HS256';
    const safePayload = JSON.parse(JSON.stringify(payload));
    const token = await new SignJWT(safePayload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('14d')
      .sign(secret);
    return token;
  } catch (error) {
    console.error('Error signing JWT:', error);
    throw new Error('Gagal membuat token JWT.');
  }
}

export async function verifyJwt(token: string) {
  try {
    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as { id: string; email: string; role: string; name: string };
  } catch (error: any) {
    // Return null if token is invalid or expired
    return null;
  }
}
