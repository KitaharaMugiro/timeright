import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { User } from '@/types/database';
import { decodeReferralCode } from '@/lib/referral';
import { createSession, SESSION_TTL_SECONDS } from '@/lib/auth';
import { sanitizeInternalRedirectPath } from '@/lib/utils';
import { logActivity } from '@/lib/activity-log';

interface LineTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  id_token: string;
}

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface LineIdTokenPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  nonce: string;
  name?: string;
  picture?: string;
  email?: string;
}

function decodeJwt(token: string): LineIdTokenPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  const payload = parts[1];
  const decoded = Buffer.from(payload, 'base64').toString('utf-8');
  return JSON.parse(decoded);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const storedState = request.cookies.get('line_state')?.value;
  const storedNonce = request.cookies.get('line_nonce')?.value;

  // Check for errors
  if (error) {
    console.error('LINE auth error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/?error=missing_params', request.url));
  }

  // Verify state
  if (state !== storedState) {
    console.error('State mismatch');
    return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
        client_id: process.env.LINE_CHANNEL_ID!,
        client_secret: process.env.LINE_CHANNEL_SECRET!,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => tokenResponse.text());
      console.error('Token exchange failed:', JSON.stringify(errorData, null, 2));
      console.error('Request params:', {
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
        client_id: process.env.LINE_CHANNEL_ID,
        // Don't log full secret, just confirm it exists
        has_secret: !!process.env.LINE_CHANNEL_SECRET,
      });
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url));
    }

    const tokens: LineTokenResponse = await tokenResponse.json();

    // Decode ID token
    const idTokenPayload = decodeJwt(tokens.id_token);

    // Verify nonce
    if (idTokenPayload.nonce !== storedNonce) {
      console.error('Nonce mismatch');
      return NextResponse.redirect(new URL('/?error=invalid_nonce', request.url));
    }

    // Get user profile
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      console.error('Profile fetch failed');
      return NextResponse.redirect(new URL('/?error=profile_fetch_failed', request.url));
    }

    const profile: LineProfile = await profileResponse.json();

    // Store user in database
    const supabase = await createServiceClient();

    // Check if user exists
    const { data: existingUserData } = await supabase
      .from('users')
      .select('*')
      .eq('line_user_id', profile.userId)
      .single();

    const existingUser = existingUserData as User | null;
    let userId: string;
    let needsOnboarding = false;

    if (existingUser) {
      userId = existingUser.id;
      // Update avatar if changed
      if (profile.pictureUrl && profile.pictureUrl !== existingUser.avatar_url) {
        await (supabase.from('users') as any)
          .update({ avatar_url: profile.pictureUrl })
          .eq('id', userId);
      }
      // Check if onboarding is complete
      needsOnboarding = !existingUser.personality_type;
      logActivity(userId, 'login');
    } else {
      // Create new user with minimal data - rest will be filled in onboarding
      const email = idTokenPayload.email || `${profile.userId}@line.dinetokyo.app`;

      // Check for referral code
      const referralCodeFromCookie = request.cookies.get('referral_code')?.value;
      let referrerId: string | null = null;

      if (referralCodeFromCookie) {
        const decodedReferrerId = decodeReferralCode(referralCodeFromCookie);
        if (decodedReferrerId) {
          // Verify referrer exists
          const { data: referrer } = await supabase
            .from('users')
            .select('id')
            .eq('id', decodedReferrerId)
            .single();

          if (referrer) {
            referrerId = decodedReferrerId;
          }
        }
      }

      const { data: newUserData, error: insertError } = await (supabase
        .from('users') as any)
        .insert({
          email,
          display_name: profile.displayName,
          avatar_url: profile.pictureUrl || null,
          line_user_id: profile.userId,
          gender: 'male', // Will be updated in onboarding
          birth_date: '2000-01-01', // Will be updated in onboarding
          job: '', // Will be updated in onboarding
          subscription_status: 'none',
          referred_by: referrerId,
        })
        .select()
        .single();

      if (insertError) {
        console.error('User creation failed:', insertError);
        return NextResponse.redirect(new URL('/?error=user_creation_failed', request.url));
      }

      const newUser = newUserData as User;
      userId = newUser.id;
      needsOnboarding = true;

      logActivity(userId, 'signup', referrerId ? { referred_by: referrerId } : undefined);

      // Create referral record if referred
      if (referrerId) {
        await (supabase.from('referrals') as any).insert({
          referrer_id: referrerId,
          referred_user_id: userId,
          status: 'pending',
        });
      }
    }

    // Check for pending invite token and save to user for coupon application at checkout
    const pendingInviteToken = request.cookies.get('pending_invite')?.value;
    if (pendingInviteToken) {
      // Verify the invite token is valid
      const { data: inviteParticipation } = await supabase
        .from('participations')
        .select('id')
        .eq('invite_token', pendingInviteToken)
        .single();

      if (inviteParticipation) {
        // Save pending invite token to user (will be used at checkout for coupon)
        await (supabase.from('users') as any)
          .update({ pending_invite_token: pendingInviteToken })
          .eq('id', userId);
      }
    }

    // Determine redirect URL
    const authRedirect = sanitizeInternalRedirectPath(
      request.cookies.get('auth_redirect')?.value,
      '/dashboard'
    );
    let redirectUrl: string;
    if (needsOnboarding) {
      redirectUrl = '/onboarding';
    } else if (authRedirect) {
      redirectUrl = authRedirect;
    } else {
      redirectUrl = '/dashboard';
    }
    const finalResponse = NextResponse.redirect(new URL(redirectUrl, request.url));

    // Clear auth cookies
    finalResponse.cookies.delete('line_state');
    finalResponse.cookies.delete('line_nonce');
    finalResponse.cookies.delete('referral_code');
    finalResponse.cookies.delete('pending_invite');
    finalResponse.cookies.delete('auth_redirect');

    // Create session and set cookies
    const session = await createSession(userId);
    finalResponse.cookies.set('session_id', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_SECONDS,
    });

    finalResponse.cookies.set('line_user_id', profile.userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_SECONDS,
    });

    return finalResponse;
  } catch (err) {
    console.error('Auth callback error:', err instanceof Error ? err.message : err);
    console.error('Full error:', err);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}
