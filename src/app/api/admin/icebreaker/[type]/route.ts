import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import type { User } from '@/types/database';

type ContentType = 'questions' | 'would-you-rather' | 'word-wolf' | 'common-things' | 'ng-word';
type TableName = 'icebreaker_questions' | 'icebreaker_would_you_rather' | 'icebreaker_word_wolf' | 'icebreaker_common_things' | 'icebreaker_ng_word';

const TABLE_MAP: Record<ContentType, TableName> = {
  questions: 'icebreaker_questions',
  'would-you-rather': 'icebreaker_would_you_rather',
  'word-wolf': 'icebreaker_word_wolf',
  'common-things': 'icebreaker_common_things',
  'ng-word': 'icebreaker_ng_word',
};

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

// GET - お題一覧取得
export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params;

    if (!Object.keys(TABLE_MAP).includes(type)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const tableName = TABLE_MAP[type as ContentType];
    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch content:', error);
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - お題追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const authResult = await verifyAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { supabase } = authResult;
    const { type } = await params;

    if (!Object.keys(TABLE_MAP).includes(type)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const tableName = TABLE_MAP[type as ContentType];
    const payload = await request.json();

    // バリデーション
    const validationError = validatePayload(type as ContentType, payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { data, error } = await (supabase.from(tableName) as any).insert(payload).select().single();

    if (error) {
      console.error('Failed to create content:', error);
      return NextResponse.json({ error: 'Failed to create content' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - お題編集
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const authResult = await verifyAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { supabase } = authResult;
    const { type } = await params;

    if (!Object.keys(TABLE_MAP).includes(type)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const tableName = TABLE_MAP[type as ContentType];
    const payload = await request.json();

    if (!payload.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { id, ...updateData } = payload;

    const { data, error } = await (supabase.from(tableName) as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update content:', error);
      return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - お題削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const authResult = await verifyAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { supabase } = authResult;
    const { type } = await params;

    if (!Object.keys(TABLE_MAP).includes(type)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const tableName = TABLE_MAP[type as ContentType];
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase.from(tableName).delete().eq('id', id);

    if (error) {
      console.error('Failed to delete content:', error);
      return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function validatePayload(type: ContentType, payload: any): string | null {
  switch (type) {
    case 'questions':
      if (!payload.question) return 'question is required';
      if (!payload.category || !['casual', 'fun', 'deep'].includes(payload.category)) {
        return 'category must be casual, fun, or deep';
      }
      break;
    case 'would-you-rather':
      if (!payload.option_a) return 'option_a is required';
      if (!payload.option_b) return 'option_b is required';
      break;
    case 'word-wolf':
      if (!payload.majority_word) return 'majority_word is required';
      if (!payload.minority_word) return 'minority_word is required';
      if (
        !payload.category ||
        !['food', 'place', 'animal', 'season', 'entertainment', 'sports', 'other'].includes(
          payload.category
        )
      ) {
        return 'category must be food, place, animal, season, entertainment, sports, or other';
      }
      break;
    case 'common-things':
      if (!payload.prompt) return 'prompt is required';
      if (
        !payload.category ||
        !['food', 'hobby', 'travel', 'lifestyle', 'personality', 'experience', 'other'].includes(
          payload.category
        )
      ) {
        return 'category must be food, hobby, travel, lifestyle, personality, experience, or other';
      }
      break;
    case 'ng-word':
      if (!payload.word) return 'word is required';
      if (
        !payload.category ||
        !['food', 'daily', 'emotion', 'action', 'place', 'other'].includes(payload.category)
      ) {
        return 'category must be food, daily, emotion, action, place, or other';
      }
      break;
  }
  return null;
}
