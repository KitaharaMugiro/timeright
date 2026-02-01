import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import type { User } from '@/types/database';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

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

// GET - カテゴリ一覧取得（管理者用、全て取得）
export async function GET() {
  try {
    const authResult = await verifyAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { supabase } = authResult;

    const { data, error } = await supabase
      .from('icebreaker_game_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - カテゴリ追加
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { supabase } = authResult;
    const payload = await request.json();

    if (!payload.slug || !payload.name) {
      return NextResponse.json({ error: 'slug and name are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('icebreaker_game_categories')
      .insert({
        slug: payload.slug,
        name: payload.name,
        description: payload.description || null,
        emoji: payload.emoji || null,
        sort_order: payload.sort_order || 0,
        is_active: payload.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create category:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Category slug already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - カテゴリ更新
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
    const allowedFields = ['name', 'description', 'emoji', 'sort_order', 'is_active'];
    const filteredData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in updateData) {
        filteredData[field] = updateData[field];
      }
    }

    filteredData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('icebreaker_game_categories')
      .update(filteredData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update category:', error);
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - カテゴリ削除
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { supabase } = authResult;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // カテゴリに属するゲームのcategory_idをnullに設定
    await supabase
      .from('icebreaker_games')
      .update({ category_id: null, updated_at: new Date().toISOString() })
      .eq('category_id', id);

    const { error } = await supabase
      .from('icebreaker_game_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete category:', error);
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - 複数カテゴリの一括更新（並び順など）
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { supabase } = authResult;
    const { categories } = await request.json();

    if (!Array.isArray(categories)) {
      return NextResponse.json({ error: 'categories array is required' }, { status: 400 });
    }

    // 各カテゴリを更新
    const updates = categories.map(async (category: { id: string; sort_order?: number; is_active?: boolean }) => {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if ('sort_order' in category) updateData.sort_order = category.sort_order;
      if ('is_active' in category) updateData.is_active = category.is_active;

      return supabase
        .from('icebreaker_game_categories')
        .update(updateData)
        .eq('id', category.id);
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
