import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import type { PersonalityType } from '@/types/database';

const validPersonalityTypes: PersonalityType[] = ['Leader', 'Supporter', 'Analyst', 'Entertainer'];

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { personality_type } = body;

    if (!personality_type || !validPersonalityTypes.includes(personality_type)) {
      return NextResponse.json(
        { error: '有効なパーソナリティタイプを選択してください' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    const { error } = await supabase
      .from('users')
      // @ts-expect-error Supabase type inference issue with service role client
      .update({ personality_type })
      .eq('id', user.id);

    if (error) {
      console.error('Personality type update error:', error);
      return NextResponse.json(
        { error: 'パーソナリティタイプの更新に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, personality_type });
  } catch (error) {
    console.error('Personality API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
