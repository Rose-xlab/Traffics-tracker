// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { apiRateLimiter } from '@/lib/services/rate-limiter';
import { createLogger } from '@/lib/services/logger';

const logger = createLogger('middleware');

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get client IP
  const ip = request.ip || 'unknown';

  // API rate limiting
  if (pathname.startsWith('/api')) {
    if (apiRateLimiter.isRateLimited(ip)) {
      logger.warn(`Rate limit exceeded for IP: ${ip}`);
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    try {
      // Create a server client
      const supabase = createServerClient();
      
      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if user is authenticated and has admin permissions
      if (!session || !session.user?.app_metadata?.is_admin) {
        // Redirect to login page with redirect back to admin
        return NextResponse.redirect(
          new URL(`/auth/login?redirect=${encodeURIComponent(pathname)}`, request.url)
        );
      }
    } catch (error) {
      logger.error('Error verifying admin access:', error);
      
      // Redirect to login on error
      return NextResponse.redirect(
        new URL('/auth/login', request.url)
      );
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  return response;
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - static (static files)
    // - _next/static (Next.js static files)
    // - favicon.ico (favicon file)
    '/((?!_next/static|static|favicon.ico).*)',
    // Match API routes
    '/api/:path*',
    // Match admin routes
    '/admin/:path*',
  ],
};