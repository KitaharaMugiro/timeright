import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import type { IcebreakerGameType, IcebreakerSession, Match } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

interface CreateSessionRequest {
  match_id: string;
  game_type: IcebreakerGameType;
}

interface UpdateSessionRequest {
  session_id: string;
  updates: {
    status?: 'waiting' | 'playing' | 'finished';
    current_round?: number;
    game_data?: Record<string, unknown>;
  };
}

// Helper to get untyped client for new tables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUntypedClient(): Promise<SupabaseClient<any, 'public', any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await createServiceClient() as unknown as SupabaseClient<any, 'public', any>;
}

// POST: Create a new session
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getUntypedClient();
    const { match_id, game_type }: CreateSessionRequest = await request.json();

    // Verify user is part of the match
    const { data: matchData } = await supabase
      .from('matches')
      .select('table_members')
      .eq('id', match_id)
      .single();

    const match = matchData as Pick<Match, 'table_members'> | null;

    if (!match || !match.table_members.includes(userId)) {
      return NextResponse.json({ error: 'Not a match participant' }, { status: 403 });
    }

    // Check for existing active session
    const { data: existingSessions } = await supabase
      .from('icebreaker_sessions')
      .select('*')
      .eq('match_id', match_id)
      .in('status', ['waiting', 'playing'])
      .limit(1);

    if (existingSessions && existingSessions.length > 0) {
      // Return existing session instead of creating new one
      const existingSession = existingSessions[0] as IcebreakerSession;

      // Auto-join if not already a player
      const { data: existingPlayer } = await supabase
        .from('icebreaker_players')
        .select('id')
        .eq('session_id', existingSession.id)
        .eq('user_id', userId)
        .single();

      if (!existingPlayer) {
        await supabase.from('icebreaker_players').insert({
          session_id: existingSession.id,
          user_id: userId,
          is_ready: false,
          player_data: {},
        });
      }

      return NextResponse.json({ session: existingSession, joined_existing: true });
    }

    // Create new session
    const { data: sessionData, error: sessionError } = await supabase
      .from('icebreaker_sessions')
      .insert({
        match_id,
        game_type,
        host_user_id: userId,
        status: 'waiting',
        current_round: 0,
        game_data: {},
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    const session = sessionData as IcebreakerSession;

    // Auto-join as player (host)
    await supabase.from('icebreaker_players').insert({
      session_id: session.id,
      user_id: userId,
      is_ready: true,
      player_data: {},
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error in POST /api/icebreaker/session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update session
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getUntypedClient();
    const { session_id, updates }: UpdateSessionRequest = await request.json();

    // Verify user is part of the session's match
    const { data: sessionData } = await supabase
      .from('icebreaker_sessions')
      .select('match_id')
      .eq('id', session_id)
      .single();

    const session = sessionData as Pick<IcebreakerSession, 'match_id'> | null;

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { data: matchData } = await supabase
      .from('matches')
      .select('table_members')
      .eq('id', session.match_id)
      .single();

    const match = matchData as Pick<Match, 'table_members'> | null;

    if (!match || !match.table_members.includes(userId)) {
      return NextResponse.json({ error: 'Not a match participant' }, { status: 403 });
    }

    // Update session
    const { data: updated, error: updateError } = await supabase
      .from('icebreaker_sessions')
      .update(updates)
      .eq('id', session_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating session:', updateError);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json({ session: updated as IcebreakerSession });
  } catch (error) {
    console.error('Error in PATCH /api/icebreaker/session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: End/delete session (host only)
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getUntypedClient();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 });
    }

    // Verify user is the host
    const { data: sessionData } = await supabase
      .from('icebreaker_sessions')
      .select('host_user_id')
      .eq('id', sessionId)
      .single();

    const session = sessionData as Pick<IcebreakerSession, 'host_user_id'> | null;

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.host_user_id !== userId) {
      return NextResponse.json({ error: 'Only the host can end the session' }, { status: 403 });
    }

    // Update session status to finished instead of deleting
    const { error: updateError } = await supabase
      .from('icebreaker_sessions')
      .update({ status: 'finished' })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error ending session:', updateError);
      return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/icebreaker/session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
