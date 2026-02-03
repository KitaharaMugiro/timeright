import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { User } from '@/types/database';
import { getCurrentUserId } from '@/lib/auth';

async function verifyAdmin() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return { error: 'Unauthorized', status: 401 };
  }

  const supabase = await createServiceClient();
  const { data: userData } = await supabase.from('users').select('*').eq('id', userId).single();

  const user = userData as User | null;
  if (!user || !user.is_admin) {
    return { error: 'Admin access required', status: 403 };
  }

  return { user, supabase };
}

// GET - ゲーム一覧取得（管理者用、全て取得）
export async function GET() {
  try {
    const authResult = await verifyAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { supabase } = authResult;

    // カテゴリ一覧取得
    const { data: categories, error: categoriesError } = await supabase
      .from('icebreaker_game_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (categoriesError) {
      console.error('Failed to fetch categories:', categoriesError);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // ゲーム一覧取得
    const { data: games, error: gamesError } = await supabase
      .from('icebreaker_games')
      .select('*')
      .order('sort_order', { ascending: true });

    if (gamesError) {
      console.error('Failed to fetch games:', gamesError);
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
    }

    return NextResponse.json({ categories, games });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - ゲーム更新
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await verifyAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { supabase } = authResult;
    const payload = await request.json();

    if (!payload.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { id, ...updateData } = payload;

    // 更新可能なフィールドのみ許可
    const allowedFields = [
      'category_id',
      'name',
      'description',
      'emoji',
      'min_players',
      'max_players',
      'has_rounds',
      'instructions',
      'is_active',
      'sort_order',
    ];
    const filteredData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in updateData) {
        filteredData[field] = updateData[field];
      }
    }

    filteredData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('icebreaker_games')
      .update(filteredData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update game:', error);
      return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - 複数ゲームの一括更新（並び順など）
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { supabase } = authResult;
    const { games } = await request.json();

    if (!Array.isArray(games)) {
      return NextResponse.json({ error: 'games array is required' }, { status: 400 });
    }

    // 各ゲームを更新
    const updates = games.map(async (game: { id: string; category_id?: string; sort_order?: number; is_active?: boolean }) => {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if ('category_id' in game) updateData.category_id = game.category_id;
      if ('sort_order' in game) updateData.sort_order = game.sort_order;
      if ('is_active' in game) updateData.is_active = game.is_active;

      return supabase
        .from('icebreaker_games')
        .update(updateData)
        .eq('id', game.id);
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
