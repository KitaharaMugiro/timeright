import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { addStagePoints, STAGE_POINTS } from '@/lib/member-stage';
import type { User, Event } from '@/types/database';
import { getCurrentUserId } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createServiceClient();

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const user = userData as User | null;
    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check event exists
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    const event = eventData as Event | null;
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Event must be in matched status to complete
    if (event.status !== 'matched') {
      return NextResponse.json(
        { error: 'Event must be in matched status to complete' },
        { status: 400 }
      );
    }

    // Get all matched participations
    const { data: participationsData } = await supabase
      .from('participations')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('status', 'matched');

    const participations = participationsData || [];
    const participantIds = participations.map((p: { user_id: string }) => p.user_id);

    // Update event status to closed
    const { error: updateError } = await (supabase.from('events') as any)
      .update({ status: 'closed' })
      .eq('id', eventId);

    if (updateError) {
      console.error('Update event error:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete event' },
        { status: 500 }
      );
    }

    // Award participation points to all matched participants
    let pointsAwarded = 0;
    let pointsFailed = 0;

    for (const participantId of participantIds) {
      try {
        await addStagePoints(
          participantId,
          STAGE_POINTS.PARTICIPATION,
          'participation',
          eventId
        );
        pointsAwarded++;
      } catch (error) {
        console.error(`Failed to add points for user ${participantId}:`, error);
        pointsFailed++;
      }
    }

    return NextResponse.json({
      success: true,
      participants: participantIds.length,
      points_awarded: pointsAwarded,
      points_failed: pointsFailed,
    });
  } catch (err) {
    console.error('Complete event error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
