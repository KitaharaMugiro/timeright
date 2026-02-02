import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import type { IcebreakerSession, IcebreakerPlayer, Match } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

interface JoinSessionRequest {
  session_id: string;
}

// Helper to get untyped client for new tables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUntypedClient(): Promise<SupabaseClient<any, 'public', any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await createServiceClient() as unknown as SupabaseClient<any, 'public', any>;
}

// POST: Join a session
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getUntypedClient();
    const { session_id }: JoinSessionRequest = await request.json();

    // Get session and verify user is part of the match
    const { data: sessionData } = await supabase
      .from('icebreaker_sessions')
      .select('match_id, status')
      .eq('id', session_id)
      .single();

    const session = sessionData as Pick<IcebreakerSession, 'match_id' | 'status'> | null;

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'finished') {
      return NextResponse.json({ error: 'Session has ended' }, { status: 400 });
    }

    const { data: matchData } = await supabase
      .from('matches')
      .select('table_members')
      .eq('id', session.match_id)
      .single();

    const match = matchData as Pick<Match, 'table_members'> | null;
    const tableMembers = (match?.table_members as string[]) || [];

    if (!match || !tableMembers.includes(userId)) {
      return NextResponse.json({ error: 'Not a match participant' }, { status: 403 });
    }

    // Check if already joined
    const { data: existingData } = await supabase
      .from('icebreaker_players')
      .select('id')
      .eq('session_id', session_id)
      .eq('user_id', userId)
      .single();

    const existing = existingData as Pick<IcebreakerPlayer, 'id'> | null;

    if (existing) {
      return NextResponse.json({ message: 'Already joined', player_id: existing.id });
    }

    // Join session
    const { data: playerData, error: joinError } = await supabase
      .from('icebreaker_players')
      .insert({
        session_id,
        user_id: userId,
        is_ready: false,
        player_data: {},
      })
      .select()
      .single();

    if (joinError) {
      console.error('Error joining session:', joinError);
      return NextResponse.json({ error: 'Failed to join session' }, { status: 500 });
    }

    return NextResponse.json({ player: playerData as IcebreakerPlayer });
  } catch (error) {
    console.error('Error in POST /api/icebreaker/join:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
