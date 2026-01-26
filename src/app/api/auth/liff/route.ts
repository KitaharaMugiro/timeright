import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { User } from '@/types/database';

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
    let needsSubscription = false;

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

      // Check subscription status
      const hasValidSubscription =
        existingUser.subscription_status === 'active' ||
        (existingUser.subscription_status === 'canceled' &&
          existingUser.subscription_period_end &&
          new Date(existingUser.subscription_period_end) > new Date());

      needsSubscription = !hasValidSubscription && !needsOnboarding;
    } else {
      // Create new user with minimal data - rest will be filled in onboarding
      const { data: newUserData, error: insertError } = await (supabase
        .from('users') as any)
        .insert({
          email: `${profile.userId}@line.unplanned.app`,
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
    }

    // Set session cookies
    const cookieStore = await cookies();

    cookieStore.set('user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    cookieStore.set('line_user_id', profile.userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    // Determine redirect URL
    let redirectUrl = '/dashboard';
    if (needsOnboarding) {
      redirectUrl = '/onboarding';
    } else if (needsSubscription) {
      redirectUrl = '/onboarding/subscribe';
    }

    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error('LIFF auth error:', err);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
