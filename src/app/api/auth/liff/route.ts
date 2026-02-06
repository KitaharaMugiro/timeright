import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { User } from '@/types/database';
import { createSession, SESSION_TTL_SECONDS } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    // Verify token and get profile from LINE API
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      console.error('LINE profile fetch failed:', await profileResponse.text());
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
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
      const { data: newUserData, error: insertError } = await (supabase
        .from('users') as any)
        .insert({
          email: `${profile.userId}@line.dinetokyo.app`,
          display_name: profile.displayName,
          avatar_url: profile.pictureUrl || null,
          line_user_id: profile.userId,
          gender: 'male', // Will be updated in onboarding
          birth_date: '2000-01-01', // Will be updated in onboarding
          job: '', // Will be updated in onboarding
          subscription_status: 'none',
        })
        .select()
        .single();

      if (insertError) {
        console.error('User creation failed:', insertError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }

      const newUser = newUserData as User;
      userId = newUser.id;
      needsOnboarding = true;
      logActivity(userId, 'signup');
    }

    // Create session and set cookies
    const cookieStore = await cookies();

    const session = await createSession(userId);
    cookieStore.set('session_id', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_SECONDS,
    });

    cookieStore.set('line_user_id', profile.userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_SECONDS,
    });

    // Check for pending invite token and save to user for coupon application at checkout
    const pendingInviteToken = cookieStore.get('pending_invite')?.value;
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

      // Clear the cookie
      cookieStore.delete('pending_invite');
    }

    // Determine redirect URL
    const redirectUrl = needsOnboarding ? '/onboarding' : '/dashboard';

    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error('LIFF auth error:', err);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
