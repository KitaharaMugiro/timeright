import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import type { User } from '@/types/database';

/**
 * テスト環境専用のログインエンドポイント
 *
 * WARNING: このエンドポイントは開発/テスト環境でのみ使用してください！
 * 本番環境では無効化されます。
 *
 * Usage:
 *   POST /api/test/login
 *   Body: { "userId": "11111111-1111-1111-1111-111111111111" }
 */
export async function POST(request: NextRequest) {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // ユーザーの存在確認
    const supabase = await createServiceClient();
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const user = userData as User | null;
    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found', userId },
        { status: 404 }
      );
    }

    // user_id Cookieを設定
    const cookieStore = await cookies();
    cookieStore.set('user_id', userId, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        subscription_status: user.subscription_status,
        subscription_period_end: user.subscription_period_end,
        personality_type: user.personality_type,
        is_admin: user.is_admin,
      },
    });
  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * テスト環境専用のログアウトエンドポイント
 */
export async function DELETE() {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.delete('user_id');

  return NextResponse.json({ success: true });
}
