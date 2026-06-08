import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt, JWT_COOKIE_NAME } from '@/lib/jwt';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect /dashboard routes
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
  matcher: ['/dashboard/:path*'],
};
