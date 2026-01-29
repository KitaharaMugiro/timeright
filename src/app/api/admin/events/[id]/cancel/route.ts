import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { sendCancellationNotificationsToMembers } from '@/lib/line';
import type { User, Event } from '@/types/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

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

    // Check event exists and get event data
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

    // Check event is still open
    if (event.status !== 'open') {
      return NextResponse.json(
        { error: 'Event is not open' },
        { status: 400 }
      );
    }

    // Get all participations for this event
    const { data: participationsData } = await supabase
      .from('participations')
      .select('user_id')
      .eq('event_id', eventId)
      .neq('status', 'canceled');

    const participations = participationsData || [];
    const userIds = participations.map((p: { user_id: string }) => p.user_id);

    // Update event status to closed
    await (supabase.from('events') as any)
      .update({ status: 'closed' })
      .eq('id', eventId);

    // Update all participations to canceled
    if (userIds.length > 0) {
      await (supabase.from('participations') as any)
        .update({ status: 'canceled' })
        .eq('event_id', eventId)
        .in('user_id', userIds);
    }

    // Send LINE cancellation notifications
    let notificationResult = { sent: 0, failed: 0, skipped: 0 };
    try {
      if (userIds.length > 0) {
        // Get user LINE IDs
        const { data: usersData } = await supabase
          .from('users')
          .select('line_user_id')
          .in('id', userIds);

        const members = (usersData || []).map((u: { line_user_id: string | null }) => ({
          lineUserId: u.line_user_id,
        }));

        notificationResult = await sendCancellationNotificationsToMembers(
          members,
          event.event_date,
          event.area
        );

        console.log(`[LINE] Cancellation notifications sent: ${notificationResult.sent}, failed: ${notificationResult.failed}, skipped: ${notificationResult.skipped}`);
      }
    } catch (notifyError) {
      // Don't fail the request if notifications fail
      console.error('LINE cancellation notification error:', notifyError);
    }

    return NextResponse.json({
      success: true,
      canceled_participations: userIds.length,
      notifications: notificationResult,
    });
  } catch (err) {
    console.error('Cancel event error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
