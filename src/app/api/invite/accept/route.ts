import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { generateInviteToken, generateShortCode, isWithin48Hours } from '@/lib/utils';
import type { Participation, Event, ParticipationMood, BudgetLevel, User } from '@/types/database';
import { requireActiveSubscription } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

interface AcceptRequest {
  token: string;
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

    const { token, mood, mood_text, budget_level }: AcceptRequest = await request.json();

    // Get the original participation
    const { data: participationData } = await supabase
      .from('participations')
      .select('*, events(*)')
      .eq('invite_token', token)
      .single();

    const originalParticipation = participationData as (Participation & { events: Event }) | null;
    if (!originalParticipation) {
      return NextResponse.json(
        { error: 'Invalid invite token' },
        { status: 404 }
      );
    }

    // Check if event is open
    if (originalParticipation.events.status !== 'open') {
      return NextResponse.json(
        { error: 'Event is not open' },
        { status: 400 }
      );
    }

    // Check if within 48 hours
    if (isWithin48Hours(originalParticipation.events.event_date)) {
      return NextResponse.json(
        { error: 'Invite expired - within 48 hours of event' },
        { status: 400 }
      );
    }

    // Check if user is the inviter
    if (userId === originalParticipation.user_id) {
      return NextResponse.json(
        { error: 'Cannot accept your own invite' },
        { status: 400 }
      );
    }

    // Check for existing participation
    const { data: existingData } = await supabase
      .from('participations')
      .select('id, entry_type, group_id')
      .eq('user_id', userId)
      .eq('event_id', originalParticipation.event_id)
      .neq('status', 'canceled')
      .single();

    const existingParticipation = existingData as { id: string; entry_type: string; group_id: string } | null;

    if (existingParticipation) {
      // If already in a pair/group, don't allow
      if (existingParticipation.entry_type === 'pair') {
        return NextResponse.json(
          { error: 'Already entered this event with a friend' },
          { status: 400 }
        );
      }

      // Solo entry exists - link to friend's group instead of creating new participation
      // Check group size limit before linking
      const { count: groupCount } = await supabase
        .from('participations')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', originalParticipation.group_id)
        .eq('event_id', originalParticipation.event_id)
        .neq('status', 'canceled');

      if (groupCount && groupCount >= 3) {
        return NextResponse.json(
          { error: 'この招待リンクは既に使用されています（グループ上限: 3人）' },
          { status: 400 }
        );
      }

      // Update existing solo participation to join the group
      const { error: updateError } = await (supabase
        .from('participations') as any)
        .update({
          group_id: originalParticipation.group_id,
          entry_type: 'pair',
          mood,
          mood_text: mood_text || null,
          budget_level,
        })
        .eq('id', existingParticipation.id);

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to link to friend' },
          { status: 500 }
        );
      }

      logActivity(userId, 'invite_accept', {
        event_id: originalParticipation.event_id,
        inviter_user_id: originalParticipation.user_id,
      });

      return NextResponse.json({ success: true, linked: true });
    }

    // Check group size limit (max 3 members)
    const { count: groupCount } = await supabase
      .from('participations')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', originalParticipation.group_id)
      .eq('event_id', originalParticipation.event_id)
      .neq('status', 'canceled');

    if (groupCount && groupCount >= 3) {
      return NextResponse.json(
        { error: 'この招待リンクは既に使用されています（グループ上限: 3人）' },
        { status: 400 }
      );
    }

    // Create participation with same group_id
    const { error: insertError } = await (supabase.from('participations') as any).insert({
      user_id: userId,
      event_id: originalParticipation.event_id,
      group_id: originalParticipation.group_id,
      entry_type: 'pair',
      mood,
      mood_text: mood_text || null,
      budget_level,
      invite_token: generateInviteToken(),
      short_code: generateShortCode(),
      status: 'pending',
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to accept invite' },
        { status: 500 }
      );
    }

    logActivity(userId, 'invite_accept', {
      event_id: originalParticipation.event_id,
      inviter_user_id: originalParticipation.user_id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Accept invite error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
