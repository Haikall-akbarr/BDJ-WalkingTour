import { NextRequest, NextResponse } from 'next/server';

type UserRole = 'admin' | 'owner' | 'guide' | 'user';

async function getCurrentUser(request: NextRequest): Promise<{ role: UserRole } | null> {
  const meUrl = new URL('/api/auth/me', request.url);

  try {
    const response = await fetch(meUrl.toString(), {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result?.user?.role ? { role: String(result.user.role).toLowerCase() as UserRole } : null;
  } catch {
    return null;
  }
}

function redirectToLogin(request: NextRequest, mode: 'staff' | 'user') {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('mode', mode);

  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (nextPath && nextPath !== '/login') {
    loginUrl.searchParams.set('next', nextPath);
  }

  return NextResponse.redirect(loginUrl);
}

function jsonForbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

function isProtectedPage(pathname: string) {
  return (
    pathname.startsWith('/dashboard/') ||
    pathname.startsWith('/book/') ||
    pathname.startsWith('/payments/')
  );
}

function isProtectedApi(pathname: string) {
  return (
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/api/analytics/') ||
    pathname.startsWith('/api/attendance/') ||
    pathname.startsWith('/api/bookings/') ||
    pathname.startsWith('/api/notifications') ||
    pathname.startsWith('/api/payments/') ||
    pathname === '/api/tours/images'
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await getCurrentUser(request);

  const isApi = pathname.startsWith('/api/');
  const isPage = !isApi && isProtectedPage(pathname);

  if (!isApi && !isPage) {
    return NextResponse.next();
  }

  if (!user) {
    if (isApi) {
      return jsonForbidden('Login diperlukan.');
    }

    return redirectToLogin(request, pathname.startsWith('/dashboard/') ? 'staff' : 'user');
  }

  if (pathname.startsWith('/dashboard/admin') && user.role !== 'admin') {
    return isApi ? jsonForbidden('Akses admin ditolak.') : redirectToLogin(request, 'staff');
  }

  if (pathname.startsWith('/dashboard/owner') && user.role !== 'owner') {
    return isApi ? jsonForbidden('Akses owner ditolak.') : redirectToLogin(request, 'staff');
  }

  if (pathname.startsWith('/dashboard/guide') && user.role !== 'guide') {
    return isApi ? jsonForbidden('Akses pemandu ditolak.') : redirectToLogin(request, 'staff');
  }

  if (pathname.startsWith('/dashboard/user') && user.role !== 'user') {
    return isApi ? jsonForbidden('Akses peserta ditolak.') : redirectToLogin(request, 'user');
  }

  if (pathname.startsWith('/api/admin/') && user.role !== 'admin') {
    return jsonForbidden('Akses admin ditolak.')
  }

  if (pathname.startsWith('/api/analytics/') && !['admin', 'owner'].includes(user.role)) {
    return jsonForbidden('Akses analytics ditolak.')
  }

  if (pathname.startsWith('/api/attendance/') && !['guide', 'admin'].includes(user.role)) {
    return jsonForbidden('Akses absensi ditolak.')
  }

  if ((pathname.startsWith('/api/bookings/') || pathname === '/api/bookings') && !['admin', 'owner'].includes(user.role)) {
    return jsonForbidden('Akses booking ditolak.')
  }

  if (pathname === '/api/tours/images' && !['admin', 'owner'].includes(user.role)) {
    return jsonForbidden('Akses unggah gambar ditolak.')
  }

  if (pathname.startsWith('/api/payments/') && !['user', 'admin', 'owner', 'guide'].includes(user.role)) {
    return jsonForbidden('Akses pembayaran ditolak.')
  }

  if (pathname === '/api/notifications' && !['user', 'admin', 'owner', 'guide'].includes(user.role)) {
    return jsonForbidden('Akses notifikasi ditolak.')
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/book/:path*',
    '/payments/:path*',
    '/api/admin/:path*',
    '/api/analytics/:path*',
    '/api/attendance/:path*',
    '/api/bookings/:path*',
    '/api/notifications',
    '/api/payments/:path*',
    '/api/tours/images',
  ],
};