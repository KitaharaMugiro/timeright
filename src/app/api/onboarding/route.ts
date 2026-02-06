import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { PersonalityType, Gender } from '@/types/database';
import { getCurrentUserId } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

interface OnboardingData {
  display_name: string;
  gender: Gender;
  birth_date: string;
  job: string;
  personality_type?: PersonalityType;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data: OnboardingData = await request.json();

    // Validate required fields (personality_type is optional - can be skipped)
    if (!data.display_name || !data.gender || !data.birth_date || !data.job) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    const { error } = await (supabase.from('users') as any)
      .update({
        display_name: data.display_name,
        gender: data.gender,
        birth_date: data.birth_date,
        job: data.job,
        ...(data.personality_type && { personality_type: data.personality_type }),
      })
      .eq('id', userId);

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    logActivity(userId, 'onboarding_complete', {
      gender: data.gender,
      personality_type: data.personality_type,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Onboarding error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
