import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  // Check for custom session cookie (set by LINE auth callback)
  const userId = request.cookies.get('user_id')?.value;

  // Protected routes
  const protectedPaths = ['/dashboard', '/onboarding', '/events', '/reviews', '/admin'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Public paths that don't require auth
  const publicPaths = ['/', '/api/auth', '/terms', '/privacy', '/contact'];
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith('/api/auth')
  );

  if (isProtectedPath && !userId) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}
