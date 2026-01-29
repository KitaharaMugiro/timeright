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
 * for Ice Breaker testing. Also creates test users if they don't exist.
 *
 * Usage:
 *   POST /api/test/setup-icebreaker
 *   Body: {
 *     "memberCount": 4 // optional, creates N test users (default 4)
 *   }
 *
 * Returns created event, match, and user IDs for testing.
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
    const body = await request.json().catch(() => ({}));
    const memberCount = body.memberCount || 4;

    const supabase = await getUntypedClient();

    // Generate UUIDs for event and match
    const eventId = crypto.randomUUID();
    const matchId = crypto.randomUUID();

    // Create test users
    const members: string[] = [];
    for (let i = 0; i < memberCount; i++) {
      const userId = crypto.randomUUID();
      const personalityTypes = ['Leader', 'Supporter', 'Analyst', 'Entertainer'];
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          line_user_id: `test-line-${userId}`,
          display_name: `テストユーザー${i + 1}`,
          email: `test-${userId}@example.com`,
          gender: i % 2 === 0 ? 'male' : 'female',
          birth_date: '1990-01-01',
          job: 'エンジニア',
          personality_type: personalityTypes[i % 4],
          subscription_status: 'active',
          subscription_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (userError) {
        console.error(`Failed to create user ${i + 1}:`, userError);
      } else {
        members.push(userId);
      }
    }

    if (members.length < 2) {
      return NextResponse.json(
        { error: 'Failed to create enough test users' },
        { status: 500 }
      );
    }

    // Calculate event date to be within 3-hour window (1 hour ago)
    const targetEventDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();

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
    const groupId = crypto.randomUUID();
    const participations = members.map((userId: string) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      event_id: eventId,
      group_id: groupId,
      entry_type: 'solo',
      status: 'matched',
      invite_token: crypto.randomUUID(),
    }));

    const { error: participationError } = await supabase
      .from('participations')
      .upsert(participations);

    if (participationError) {
      console.error('Failed to upsert participations:', participationError);
      // Not fatal, continue
    }

    // Generate login commands for convenience
    const loginCommands = members.map((userId, i) =>
      `// ブラウザ${i + 1}: await fetch('/api/test/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ userId: '${userId}' }) })`
    );

    return NextResponse.json({
      success: true,
      message: 'テストデータを作成しました。各ブラウザで下記コマンドでログインしてください。',
      icebreakerUrl: `/events/${eventId}/icebreaker`,
      event: {
        id: eventId,
        event_date: targetEventDate,
      },
      match: {
        id: matchId,
      },
      users: members.map((id, i) => ({ id, name: `テストユーザー${i + 1}` })),
      loginCommands,
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
 * Reset (cleanup) existing icebreaker sessions for a match
 * PUT /api/test/setup-icebreaker?matchId=xxx
 */
export async function PUT(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    const url = new URL(request.url);
    const matchId = url.searchParams.get('matchId');
    const eventId = url.searchParams.get('eventId');

    const supabase = await getUntypedClient();

    if (matchId) {
      // Mark all sessions for this match as finished
      await supabase
        .from('icebreaker_sessions')
        .update({ status: 'finished' })
        .eq('match_id', matchId)
        .in('status', ['waiting', 'playing']);

      return NextResponse.json({ success: true, message: 'Sessions reset for match' });
    }

    if (eventId) {
      // Get match for event and reset its sessions
      const { data: match } = await supabase
        .from('matches')
        .select('id')
        .eq('event_id', eventId)
        .single();

      if (match) {
        await supabase
          .from('icebreaker_sessions')
          .update({ status: 'finished' })
          .eq('match_id', match.id)
          .in('status', ['waiting', 'playing']);
      }

      return NextResponse.json({ success: true, message: 'Sessions reset for event' });
    }

    return NextResponse.json({ error: 'matchId or eventId required' }, { status: 400 });
  } catch (error) {
    console.error('Reset sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Get existing Ice Breaker test data by eventId
 */
export async function GET(request: NextRequest) {
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

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      );
    }

    const supabase = await getUntypedClient();

    // Get event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get match for this event
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Get users from table_members
    const memberIds = match.table_members as string[];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', memberIds);

    if (usersError) {
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Sort users by their order in table_members
    const sortedUsers = memberIds.map((id) => {
      const user = users?.find((u) => u.id === id);
      return user ? { id: user.id, name: user.display_name } : null;
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      icebreakerUrl: `/events/${eventId}/icebreaker`,
      event: {
        id: eventId,
        event_date: event.event_date,
      },
      match: {
        id: match.id,
      },
      users: sortedUsers,
    });
  } catch (error) {
    console.error('Get icebreaker data error:', error);
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
