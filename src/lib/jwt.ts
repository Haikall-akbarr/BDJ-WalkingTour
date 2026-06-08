import { SignJWT, jwtVerify } from 'jose';

export const JWT_COOKIE_NAME = 'bdj_jwt';

export function getJwtSecretKey() {
  // Use a consistent hardcoded secret for the demo to avoid Edge vs Node.js env var mismatch issues.
  // We completely ignore process.env here because adding .env.local variables during dev without restarting
  // the server can cause Node.js and Edge runtimes to have different values until the next restart.
  const secret = 'bdj-walking-tour-super-secret-jwt-key-2026-demo-only';
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
    console.log('[JWT] Signed token for role:', safePayload.role);
    return token;
  } catch (error) {
    console.error('Error signing JWT:', error);
    throw new Error('Gagal membuat token JWT.');
  }
}

export async function verifyJwt(token: string) {
  try {
    const secret = getJwtSecretKey();
    console.log('[JWT] Verifying token (first 10 chars):', token.substring(0, 10));
    const { payload } = await jwtVerify(token, secret);
    console.log('[JWT] Verified token for role:', payload.role);
    return payload as { id: string; email: string; role: string; name: string };
  } catch (error: any) {
    console.error('[JWT] Verify error:', error?.code || error?.message || error);
    // Return null if token is invalid or expired
    return null;
  }
}
