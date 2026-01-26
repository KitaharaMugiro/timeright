import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import type { PersonalityType, Gender } from '@/types/database';

interface OnboardingData {
  display_name: string;
  gender: Gender;
  birth_date: string;
  job: string;
  personality_type: PersonalityType;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data: OnboardingData = await request.json();

    // Validate required fields
    if (!data.display_name || !data.gender || !data.birth_date || !data.job || !data.personality_type) {
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
        personality_type: data.personality_type,
      })
      .eq('id', userId);

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Onboarding error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
