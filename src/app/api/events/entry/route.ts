import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { generateInviteToken, isWithin48Hours } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import type { EntryType, User, Event, ParticipationMood, Participation } from '@/types/database';

interface EntryRequest {
  event_id: string;
  entry_type: EntryType;
  mood: ParticipationMood;
  mood_text?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createServiceClient();

    // Check user subscription
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const user = userData as User | null;
    if (!user || user.subscription_status !== 'active') {
      return NextResponse.json(
        { error: 'Active subscription required' },
        { status: 403 }
      );
    }

    const { event_id, entry_type, mood, mood_text }: EntryRequest = await request.json();

    // Get event
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .eq('status', 'open')
      .single();

    const event = eventData as Event | null;
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or not open' },
        { status: 404 }
      );
    }

    // Check if entry is allowed (no entries within 48 hours of event)
    if (isWithin48Hours(event.event_date)) {
      return NextResponse.json(
        { error: '開催48時間前を過ぎているため応募できません' },
        { status: 400 }
      );
    }

    // Check for existing participation
    const { data: existingParticipation } = await supabase
      .from('participations')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', event_id)
      .neq('status', 'canceled')
      .single();

    if (existingParticipation) {
      return NextResponse.json(
        { error: 'Already entered this event' },
        { status: 400 }
      );
    }

    const groupId = uuidv4();
    const inviteToken = generateInviteToken();

    // Create participation
    const { error: insertError } = await (supabase.from('participations') as any).insert({
      user_id: userId,
      event_id,
      group_id: groupId,
      entry_type,
      mood,
      mood_text: mood_text || null,
      invite_token: inviteToken,
      status: 'pending',
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create participation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invite_token: entry_type === 'pair' ? inviteToken : null,
    });
  } catch (err) {
    console.error('Entry error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface CancelRequest {
  participation_id: string;
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { participation_id }: CancelRequest = await request.json();

    if (!participation_id) {
      return NextResponse.json(
        { error: 'participation_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Get participation and verify ownership
    const { data: participationData } = await supabase
      .from('participations')
      .select('*, events(*)')
      .eq('id', participation_id)
      .eq('user_id', userId)
      .single();

    const participation = participationData as (Participation & { events: Event }) | null;

    if (!participation) {
      return NextResponse.json(
        { error: 'Participation not found' },
        { status: 404 }
      );
    }

    // Cannot cancel if already matched
    if (participation.status === 'matched') {
      return NextResponse.json(
        { error: 'マッチング済みのためキャンセルできません' },
        { status: 400 }
      );
    }

    // Cannot cancel if already canceled
    if (participation.status === 'canceled') {
      return NextResponse.json(
        { error: 'Already canceled' },
        { status: 400 }
      );
    }

    // Cannot cancel within 48 hours of event
    if (isWithin48Hours(participation.events.event_date)) {
      return NextResponse.json(
        { error: '開催48時間前を過ぎているためキャンセルできません' },
        { status: 400 }
      );
    }

    // Update status to canceled
    const { error: updateError } = await (supabase
      .from('participations') as any)
      .update({ status: 'canceled' })
      .eq('id', participation_id);

    if (updateError) {
      console.error('Cancel error:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel participation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Cancel error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
