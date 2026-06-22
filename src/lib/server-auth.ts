import { cookies } from 'next/headers';
import { getSessionCookieName, hashSessionToken } from '@/lib/auth-session';
import { getSessionByTokenHash, getUserById, touchSession } from '@/lib/auth-store';

export async function getCurrentSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const session = await getSessionByTokenHash(tokenHash);

  if (!session) {
    return null;
  }

  if (!session.expiresAt || new Date(session.expiresAt).getTime() < Date.now()) {
    return null;
  }

  await touchSession(session.id);
  const user = await getUserById(session.userId);

  if (!user || !user.isActive) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone || '',
    address: user.address || '',
    createdAt: user.createdAt,
  };
}
