import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { apiRateLimit, authRateLimit } from '@/lib/rate-limit';

// Routes that require authentication
const protectedRoutes = [
  '/agenda',
  '/profile',
  '/matchmaking',
  '/dashboard',
  '/organizer',
  '/premium',
];

// Routes that should redirect to home if already authenticated
const authRoutes = ['/login', '/signup'];

// Public routes that don't require authentication
const publicRoutes = ['/', '/ticketing', '/resources', '/venue', '/leaderboard', '/live', '/scanner'];

// API routes that need rate limiting
const apiRoutes = ['/api'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Apply rate limiting to API routes
  if (apiRoutes.some(route => pathname.startsWith(route))) {
    // Special rate limiting for auth endpoints
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/login') || pathname.startsWith('/api/signup')) {
      const authLimitResponse = authRateLimit(request);
      if (authLimitResponse) {
        return authLimitResponse;
      }
    } else {
      // General API rate limiting
      const apiLimitResponse = apiRateLimit(request);
      if (apiLimitResponse) {
        return apiLimitResponse;
      }
    }
  }
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));

  // Get auth token from cookies (set by client-side auth)
  const authToken = request.cookies.get('auth-token')?.value;
  const isAuthenticated = !!authToken;

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to home if accessing auth routes while authenticated
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
