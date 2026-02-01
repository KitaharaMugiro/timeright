import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { IcebreakerGame, IcebreakerGameCategory, IcebreakerGameWithCategory } from '@/types/database';

// GET - ゲーム一覧取得（カテゴリ情報含む）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const supabase = await createServiceClient();

    // カテゴリ一覧取得
    let categoriesQuery = supabase
      .from('icebreaker_game_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      categoriesQuery = categoriesQuery.eq('is_active', true);
    }

    const { data: categories, error: categoriesError } = await categoriesQuery;

    if (categoriesError) {
      console.error('Failed to fetch categories:', categoriesError);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // ゲーム一覧取得
    let gamesQuery = supabase
      .from('icebreaker_games')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      gamesQuery = gamesQuery.eq('is_active', true);
    }

    const { data: games, error: gamesError } = await gamesQuery;

    if (gamesError) {
      console.error('Failed to fetch games:', gamesError);
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
    }

    // カテゴリIDでマップを作成
    const categoryMap = new Map(
      (categories as IcebreakerGameCategory[]).map(c => [c.id, c])
    );

    // ゲームにカテゴリ情報を追加
    const gamesWithCategory: IcebreakerGameWithCategory[] = (games as IcebreakerGame[]).map(game => ({
      ...game,
      category: game.category_id ? categoryMap.get(game.category_id) || null : null,
    }));

    // カテゴリごとにゲームをグループ化
    const gamesByCategory = (categories as IcebreakerGameCategory[]).map(category => ({
      category,
      games: gamesWithCategory.filter(g => g.category_id === category.id),
    }));

    // カテゴリ未設定のゲーム
    const uncategorizedGames = gamesWithCategory.filter(g => !g.category_id);

    return NextResponse.json({
      categories: categories as IcebreakerGameCategory[],
      games: gamesWithCategory,
      gamesByCategory,
      uncategorizedGames,
    });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
