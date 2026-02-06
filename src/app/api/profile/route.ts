import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity-log';

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
    const { display_name, job } = body;

    if (!display_name || display_name.trim().length === 0) {
      return NextResponse.json(
        { error: '表示名は必須です' },
        { status: 400 }
      );
    }

    if (display_name.length > 50) {
      return NextResponse.json(
        { error: '表示名は50文字以内で入力してください' },
        { status: 400 }
      );
    }

    if (!job || job.trim().length === 0) {
      return NextResponse.json(
        { error: '職業は必須です' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    const updateData = {
      display_name: display_name.trim(),
      job: job.trim(),
    };

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json(
        { error: 'プロフィールの更新に失敗しました' },
        { status: 500 }
      );
    }

    logActivity(user.id, 'profile_update', {
      display_name: updateData.display_name,
      job: updateData.job,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
