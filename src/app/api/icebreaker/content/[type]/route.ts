import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

type ContentType = 'questions' | 'would-you-rather' | 'word-wolf' | 'common-things' | 'ng-word' | 'ng-word-topics';
type TableName = 'icebreaker_questions' | 'icebreaker_would_you_rather' | 'icebreaker_word_wolf' | 'icebreaker_common_things' | 'icebreaker_ng_word' | 'icebreaker_ng_word_topics';

const TABLE_MAP: Record<ContentType, TableName> = {
  questions: 'icebreaker_questions',
  'would-you-rather': 'icebreaker_would_you_rather',
  'word-wolf': 'icebreaker_word_wolf',
  'common-things': 'icebreaker_common_things',
  'ng-word': 'icebreaker_ng_word',
  'ng-word-topics': 'icebreaker_ng_word_topics',
};

// GET - アクティブなお題を取得
export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params;

    if (!Object.keys(TABLE_MAP).includes(type)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const tableName = TABLE_MAP[type as ContentType];
    const supabase = await createServiceClient();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const random = searchParams.get('random') === 'true';

    let query = supabase.from(tableName).select('*').eq('is_active', true);

    // カテゴリーフィルター（questions, word-wolf, common-thingsのみ）
    if (category && type !== 'would-you-rather') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch content:', error);
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }

    let result = data || [];

    // ランダムシャッフル
    if (random) {
      result = result.sort(() => Math.random() - 0.5);
    }

    // 件数制限
    if (limit > 0) {
      result = result.slice(0, limit);
    }

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
