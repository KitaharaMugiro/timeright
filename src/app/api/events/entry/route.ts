import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { generateInviteToken, generateShortCode, isWithin48Hours } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import type { EntryType, Event, ParticipationMood, Participation, BudgetLevel, User } from '@/types/database';
import { getCurrentUserId, requireActiveSubscription } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

interface EntryRequest {
  event_id: string;
  entry_type: EntryType;
  mood: ParticipationMood;
  mood_text?: string | null;
  budget_level: BudgetLevel;
}

export async function POST(request: NextRequest) {
  try {
    let user: User;
    try {
      user = await requireActiveSubscription();
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      if (error instanceof Error && error.message === 'Subscription required') {
        return NextResponse.json(
          { error: 'Active subscription required' },
          { status: 403 }
        );
      }
      throw error;
    }

    const userId = user.id;

    const supabase = await createServiceClient();

    const { event_id, entry_type, mood, mood_text, budget_level }: EntryRequest = await request.json();

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

    // Check for existing participation (including canceled ones)
    const { data: existingParticipationData } = await supabase
      .from('participations')
      .select('id, status')
      .eq('user_id', userId)
      .eq('event_id', event_id)
      .single();

    const existingParticipation = existingParticipationData as { id: string; status: string } | null;

    if (existingParticipation && existingParticipation.status !== 'canceled') {
      return NextResponse.json(
        { error: 'Already entered this event' },
        { status: 400 }
      );
    }

    const groupId = uuidv4();
    const inviteToken = generateInviteToken();
    const shortCode = generateShortCode();

    if (existingParticipation && existingParticipation.status === 'canceled') {
      // Reactivate canceled participation
      const { error: updateError } = await (supabase.from('participations') as any)
        .update({
          group_id: groupId,
          entry_type,
          mood,
          mood_text: mood_text || null,
          budget_level,
          invite_token: inviteToken,
          short_code: shortCode,
          status: 'pending',
        })
        .eq('id', existingParticipation.id);

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to reactivate participation' },
          { status: 500 }
        );
      }
    } else {
      // Create new participation
      const { error: insertError } = await (supabase.from('participations') as any).insert({
        user_id: userId,
        event_id,
        group_id: groupId,
        entry_type,
        mood,
        mood_text: mood_text || null,
        budget_level,
        invite_token: inviteToken,
        short_code: shortCode,
        status: 'pending',
      });

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create participation' },
          { status: 500 }
        );
      }
    }

    logActivity(userId, 'event_join', { event_id, entry_type, mood });

    return NextResponse.json({
      success: true,
      invite_token: entry_type === 'pair' ? inviteToken : null,
      short_code: entry_type === 'pair' ? shortCode : null,
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
    const userId = await getCurrentUserId();

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

    logActivity(userId, 'event_cancel', {
      participation_id,
      event_id: participation.event_id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Cancel error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
