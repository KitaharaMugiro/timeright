import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUntypedClient(): Promise<SupabaseClient<any, 'public', any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await createServiceClient() as unknown as SupabaseClient<any, 'public', any>;
}

/**
 * Test endpoint to set up Ice Breaker scenarios
 *
 * WARNING: This endpoint is for development/test environment only!
 *
 * Creates or updates an event and match to be within the 3-hour window
 * for Ice Breaker testing.
 *
 * Usage:
 *   POST /api/test/setup-icebreaker
 *   Body: {
 *     "eventId": "...",
 *     "matchId": "...",
 *     "members": ["user_id_1", "user_id_2", ...],
 *     "eventDate": "2024-01-15T12:00:00Z" // optional, defaults to 1 hour ago
 *   }
 */
export async function POST(request: NextRequest) {
  // Disable in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { eventId, matchId, members, eventDate } = body;

    if (!eventId || !matchId || !members || members.length < 2) {
      return NextResponse.json(
        { error: 'eventId, matchId, and members (at least 2) are required' },
        { status: 400 }
      );
    }

    const supabase = await getUntypedClient();

    // Calculate event date to be within 3-hour window (1 hour ago by default)
    const targetEventDate = eventDate || new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Update or create event with the target date
    const { error: eventError } = await supabase
      .from('events')
      .upsert({
        id: eventId,
        event_date: targetEventDate,
        area: 'test-area',
        status: 'matched',
      });

    if (eventError) {
      console.error('Failed to upsert event:', eventError);
      return NextResponse.json(
        { error: 'Failed to create/update event', details: eventError.message },
        { status: 500 }
      );
    }

    // Update or create match
    const { error: matchError } = await supabase
      .from('matches')
      .upsert({
        id: matchId,
        event_id: eventId,
        restaurant_name: 'Test Restaurant',
        restaurant_url: 'https://example.com/test-restaurant',
        table_members: members,
      });

    if (matchError) {
      console.error('Failed to upsert match:', matchError);
      return NextResponse.json(
        { error: 'Failed to create/update match', details: matchError.message },
        { status: 500 }
      );
    }

    // Create participations for all members
    const participations = members.map((userId: string, index: number) => ({
      id: `${matchId}-participation-${index}`,
      user_id: userId,
      event_id: eventId,
      group_id: `${matchId}-group`,
      entry_type: 'solo',
      status: 'matched',
      invite_token: `test-token-${userId}`,
    }));

    const { error: participationError } = await supabase
      .from('participations')
      .upsert(participations);

    if (participationError) {
      console.error('Failed to upsert participations:', participationError);
      // Not fatal, continue
    }

    return NextResponse.json({
      success: true,
      event: {
        id: eventId,
        event_date: targetEventDate,
      },
      match: {
        id: matchId,
        members,
      },
    });
  } catch (error) {
    console.error('Setup icebreaker error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Clean up Ice Breaker test data
 */
export async function DELETE(request: NextRequest) {
  // Disable in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');
    const matchId = url.searchParams.get('matchId');

    const supabase = await getUntypedClient();

    // Delete ice breaker sessions and players for the match
    if (matchId) {
      await supabase
        .from('icebreaker_players')
        .delete()
        .eq('session_id', matchId);

      await supabase
        .from('icebreaker_sessions')
        .delete()
        .eq('match_id', matchId);

      await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);
    }

    // Delete participations and event
    if (eventId) {
      await supabase
        .from('participations')
        .delete()
        .eq('event_id', eventId);

      await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cleanup icebreaker error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
