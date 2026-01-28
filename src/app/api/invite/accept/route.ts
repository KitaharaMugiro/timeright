import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { generateInviteToken, isWithin48Hours } from '@/lib/utils';
import type { User, Participation, Event, ParticipationMood, BudgetLevel } from '@/types/database';

interface AcceptRequest {
  token: string;
  mood: ParticipationMood;
  mood_text?: string | null;
  budget_level: BudgetLevel;
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
    const { data: existingParticipation } = await supabase
      .from('participations')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', originalParticipation.event_id)
      .neq('status', 'canceled')
      .single();

    if (existingParticipation) {
      return NextResponse.json(
        { error: 'Already entered this event' },
        { status: 400 }
      );
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
      status: 'pending',
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to accept invite' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Accept invite error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
