import { getCurrentSessionUser } from '@/lib/server-auth';

export type AuthGuardResult =
  | { authorized: true; user: NonNullable<Awaited<ReturnType<typeof getCurrentSessionUser>>> }
  | { authorized: false; status: number; error: string };

/**
 * Check that the current request is authenticated and the user has the required role.
 * Returns the authenticated user on success, or an error object on failure.
 */
export async function requireRole(...allowedRoles: string[]): Promise<AuthGuardResult> {
  const user = await getCurrentSessionUser();

  if (!user) {
    return { authorized: false, status: 401, error: 'Sesi tidak valid. Silakan login ulang.' };
  }

  if (!user.role || !allowedRoles.includes(user.role)) {
    return { authorized: false, status: 403, error: 'Anda tidak memiliki izin untuk mengakses resource ini.' };
  }

  return { authorized: true, user };
}

/**
 * Shortcut: require the current user to be an admin.
 */
export async function requireAdmin(): Promise<AuthGuardResult> {
  return requireRole('admin');
}

/**
 * Shortcut: require the current user to be admin or owner.
 */
export async function requireAdminOrOwner(): Promise<AuthGuardResult> {
  return requireRole('admin', 'owner');
}
