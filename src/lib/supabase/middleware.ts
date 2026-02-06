import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const sessionId = request.cookies.get('session_id')?.value;
  if (!sessionId) {
    const url = request.nextUrl.clone();
    url.pathname = '/liff';
    url.searchParams.delete('redirect');
    return NextResponse.redirect(url);
  }

  return response;
}
