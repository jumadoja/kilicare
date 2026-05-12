import { NextRequest, NextResponse } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/feed', '/messages', '/chat', '/discover', '/map', '/tips', '/sos', '/passport', '/profile', '/experiences'];

// Cookie-based authentication - NO token verification in middleware
// Backend handles authentication via httpOnly cookies
function isAuthenticatedViaCookie(request: NextRequest): boolean {
  // Check if session cookie exists - backend will validate it
  const sessionCookie = request.cookies.get('sessionid');
  const accessTokenCookie = request.cookies.get('access_token');
  
  return !!(sessionCookie || accessTokenCookie);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Check if current path is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  
  // Check authentication via cookies
  const isAuthenticated = isAuthenticatedViaCookie(request);
  
  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect authenticated users from public routes to feed
  if (isPublicRoute && isAuthenticated) {
    const feedUrl = new URL('/feed', request.url);
    return NextResponse.redirect(feedUrl);
  }
  
  // For root path, redirect based on authentication status
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/feed', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
