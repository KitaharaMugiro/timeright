import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { GamesAdminClient } from './client';
import type { IcebreakerGameCategory, IcebreakerGame } from '@/types/database';

export default async function GamesAdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    const cookieStore = await cookies();
    cookieStore.delete('user_id');
    redirect('/api/auth/line?redirect=/admin/games');
  }

  if (!user.is_admin) {
    redirect('/');
  }

  const supabase = await createServiceClient();

  // カテゴリ一覧取得
  const { data: categories } = await supabase
    .from('icebreaker_game_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  // ゲーム一覧取得
  const { data: games } = await supabase
    .from('icebreaker_games')
    .select('*')
    .order('sort_order', { ascending: true });

  return (
    <GamesAdminClient
      initialCategories={(categories || []) as IcebreakerGameCategory[]}
      initialGames={(games || []) as IcebreakerGame[]}
    />
  );
}
