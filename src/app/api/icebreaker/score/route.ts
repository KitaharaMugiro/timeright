import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import type { Match } from '@/types/database';
import type { IcebreakerScore } from '@/lib/icebreaker/types';
import type { SupabaseClient } from '@supabase/supabase-js';

interface AwardRequest {
  match_id: string;
  awards: { user_id: string; points: number }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUntypedClient(): Promise<SupabaseClient<any, 'public', any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await createServiceClient() as unknown as SupabaseClient<any, 'public', any>;
}

// GET: Fetch scores for a match
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('match_id');

    if (!matchId) {
      return NextResponse.json({ error: 'match_id required' }, { status: 400 });
    }

    const supabase = await getUntypedClient();

    const { data, error } = await supabase
      .from('icebreaker_scores')
      .select('*')
      .eq('match_id', matchId);

    if (error) {
      console.error('Error fetching scores:', error);
      return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
    }

    return NextResponse.json({ scores: data as IcebreakerScore[] });
  } catch (error) {
    console.error('Error in GET /api/icebreaker/score:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Award points to users
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getUntypedClient();
    const { match_id, awards }: AwardRequest = await request.json();

    if (!match_id || !awards || awards.length === 0) {
      return NextResponse.json({ error: 'match_id and awards required' }, { status: 400 });
    }

    // Verify user is part of the match
    const { data: matchData } = await supabase
      .from('matches')
      .select('table_members')
      .eq('id', match_id)
      .single();

    const match = matchData as Pick<Match, 'table_members'> | null;
    const tableMembers = (match?.table_members as string[]) || [];

    if (!match || !tableMembers.includes(userId)) {
      return NextResponse.json({ error: 'Not a match participant' }, { status: 403 });
    }

    // Award points: read existing, then insert or update
    for (const award of awards) {
      const { data: existing } = await supabase
        .from('icebreaker_scores')
        .select('id, points')
        .eq('match_id', match_id)
        .eq('user_id', award.user_id)
        .single();

      if (existing) {
        await supabase
          .from('icebreaker_scores')
          .update({
            points: (existing.points as number) + award.points,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('icebreaker_scores')
          .insert({
            match_id,
            user_id: award.user_id,
            points: award.points,
            updated_at: new Date().toISOString(),
          });
      }
    }

    // Return updated scores
    const { data: scores } = await supabase
      .from('icebreaker_scores')
      .select('*')
      .eq('match_id', match_id);

    return NextResponse.json({ scores: scores as IcebreakerScore[] });
  } catch (error) {
    console.error('Error in POST /api/icebreaker/score:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
