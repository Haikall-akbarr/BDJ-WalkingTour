import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt, JWT_COOKIE_NAME } from '@/lib/jwt';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // ── Protect /api/admin/* API routes ──
  if (path.startsWith('/api/admin')) {
    const token = request.cookies.get(JWT_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Autentikasi diperlukan. Silakan login.' },
        { status: 401 }
      );
    }

    const payload = await verifyJwt(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Token tidak valid atau sudah kedaluwarsa. Silakan login ulang.' },
        { status: 401 }
      );
    }

    // Allow 'admin', but also allow 'owner' ONLY for the /api/admin/users endpoint
    if (payload.role !== 'admin') {
      if (!(payload.role === 'owner' && path.startsWith('/api/admin/users'))) {
        return NextResponse.json(
          { error: 'Anda tidak memiliki izin untuk mengakses resource ini.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  }

  // ── Protect /dashboard routes ──
  if (path.startsWith('/dashboard')) {
    const token = request.cookies.get(JWT_COOKIE_NAME)?.value;

    if (!token) {
      // Redirect to login if no token is found
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyJwt(token);

    if (!payload) {
      // Token invalid or expired, clear it and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(JWT_COOKIE_NAME);
      return response;
    }

    // Specific protection for admin routes
    if (path.startsWith('/dashboard/admin') && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/user', request.url));
    }

    // Specific protection for owner routes
    if (path.startsWith('/dashboard/owner') && payload.role !== 'owner' && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/user', request.url));
    }

    // Specific protection for guide routes
    if (path.startsWith('/dashboard/guide') && payload.role !== 'guide' && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/user', request.url));
    }

    // Specific protection for user routes
    if (path.startsWith('/dashboard/user') && payload.role !== 'user') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  // Allow all other routes
  return NextResponse.next();
}

// Specify the paths that middleware should run on
export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
};
