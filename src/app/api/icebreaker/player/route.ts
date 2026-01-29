import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import type { IcebreakerPlayer } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

interface UpdatePlayerRequest {
  session_id: string;
  updates: {
    is_ready?: boolean;
    player_data?: Record<string, unknown>;
  };
}

// Helper to get untyped client for new tables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUntypedClient(): Promise<SupabaseClient<any, 'public', any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await createServiceClient() as unknown as SupabaseClient<any, 'public', any>;
}

// PATCH: Update player data
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getUntypedClient();
    const { session_id, updates }: UpdatePlayerRequest = await request.json();

    // Get current player data for merging
    const { data: playerData } = await supabase
      .from('icebreaker_players')
      .select('id, player_data')
      .eq('session_id', session_id)
      .eq('user_id', userId)
      .single();

    const player = playerData as Pick<IcebreakerPlayer, 'id' | 'player_data'> | null;

    if (!player) {
      return NextResponse.json({ error: 'Player not found in session' }, { status: 404 });
    }

    // Prepare update payload
    const updatePayload: Record<string, unknown> = {};

    if (updates.is_ready !== undefined) {
      updatePayload.is_ready = updates.is_ready;
    }

    if (updates.player_data !== undefined) {
      // Merge with existing player_data
      updatePayload.player_data = {
        ...(player.player_data as Record<string, unknown>),
        ...updates.player_data,
      };
    }

    // Update player
    const { data: updated, error: updateError } = await supabase
      .from('icebreaker_players')
      .update(updatePayload)
      .eq('id', player.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating player:', updateError);
      return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
    }

    return NextResponse.json({ player: updated as IcebreakerPlayer });
  } catch (error) {
    console.error('Error in PATCH /api/icebreaker/player:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
