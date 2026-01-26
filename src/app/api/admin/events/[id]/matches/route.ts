import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { sendMatchNotificationsToMembers } from '@/lib/line';
import type { User, Match, Event } from '@/types/database';

interface MatchData {
  table_id: string;
  restaurant_name: string;
  restaurant_url: string;
  reservation_name?: string;
  members: string[];
}

interface ImportRequest {
  matches: MatchData[];
}

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

    const { matches: matchData }: ImportRequest = await request.json();

    // Delete existing matches for this event
    await supabase.from('matches').delete().eq('event_id', eventId);

    // Create new matches
    const matchInserts = matchData.map((m) => ({
      event_id: eventId,
      restaurant_name: m.restaurant_name,
      restaurant_url: m.restaurant_url || null,
      reservation_name: m.reservation_name || null,
      table_members: m.members,
    }));

    // Use type assertion for insert
    const { data: createdMatches, error: insertError } = await (supabase
      .from('matches') as any)
      .insert(matchInserts)
      .select();

    if (insertError) {
      console.error('Insert matches error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create matches' },
        { status: 500 }
      );
    }

    // Update event status to matched
    await (supabase.from('events') as any)
      .update({ status: 'matched' })
      .eq('id', eventId);

    // Helper to check if ID is a guest ID
    const isGuestId = (id: string) => id.startsWith('guest:');
    const fromGuestId = (id: string) => id.replace('guest:', '');

    // Get all member IDs, separating users from guests
    const allMemberIds = matchData.flatMap((m) => m.members);
    const userIds = allMemberIds.filter(id => !isGuestId(id));
    const guestIds = allMemberIds.filter(id => isGuestId(id)).map(fromGuestId);

    // Update participation status to matched (only for actual users)
    if (userIds.length > 0) {
      await (supabase.from('participations') as any)
        .update({ status: 'matched' })
        .eq('event_id', eventId)
        .in('user_id', userIds);
    }

    // Send LINE notifications to all matched members
    try {
      // Get user data
      type MemberData = { id: string; display_name: string; line_user_id: string | null };
      const membersMap = new Map<string, { displayName: string; lineUserId: string | null }>();

      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, display_name, line_user_id')
          .in('id', userIds);

        const users = (usersData || []) as MemberData[];
        users.forEach(u => {
          membersMap.set(u.id, { displayName: u.display_name, lineUserId: u.line_user_id });
        });
      }

      // Get guest data
      type GuestData = { id: string; display_name: string };
      if (guestIds.length > 0) {
        const { data: guestsData } = await supabase
          .from('guests')
          .select('id, display_name')
          .in('id', guestIds);

        const guests = (guestsData || []) as GuestData[];
        guests.forEach(g => {
          membersMap.set(`guest:${g.id}`, { displayName: g.display_name, lineUserId: null });
        });
      }

      let totalSent = 0;
      let totalFailed = 0;
      let totalSkipped = 0;

      // Send notifications for each match/table
      for (const match of matchData) {
        const members = match.members.map((id) => {
          const userData = membersMap.get(id);
          return {
            lineUserId: userData?.lineUserId || null,
            displayName: userData?.displayName || 'ゲスト',
          };
        });

        const result = await sendMatchNotificationsToMembers(
          members,
          event.event_date,
          event.area,
          match.restaurant_name,
          match.restaurant_url,
          match.reservation_name
        );

        totalSent += result.sent;
        totalFailed += result.failed;
        totalSkipped += result.skipped;
      }

      console.log(`[LINE] Notifications sent: ${totalSent}, failed: ${totalFailed}, skipped: ${totalSkipped}`);
    } catch (notifyError) {
      // Don't fail the request if notifications fail
      console.error('LINE notification error:', notifyError);
    }

    return NextResponse.json({ matches: createdMatches as Match[] });
  } catch (err) {
    console.error('Import matches error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
