import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const state = uuidv4();
  const nonce = uuidv4();

  // Get referral code from query parameter
  const referralCode = request.nextUrl.searchParams.get('ref');

  // Get redirect URL from query parameter
  const redirectTo = request.nextUrl.searchParams.get('redirect');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINE_CHANNEL_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    state,
    scope: 'profile openid email',
    nonce,
  });

  const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;

  const response = NextResponse.redirect(lineAuthUrl);

  // Store state and nonce in cookies for verification
  response.cookies.set('line_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
  });

  response.cookies.set('line_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
  });

  // Store referral code in cookie (30 days)
  if (referralCode) {
    response.cookies.set('referral_code', referralCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  // Store redirect URL in cookie
  if (redirectTo) {
    response.cookies.set('auth_redirect', redirectTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    });
  }

  return response;
}
