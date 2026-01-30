import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { sendReminderNotificationsToMembers } from '@/lib/line';
import type { User, Match, Event } from '@/types/database';

// Helper functions for guest IDs
const isGuestId = (id: string) => id.startsWith('guest:');
const fromGuestId = (id: string) => id.replace('guest:', '');

/**
 * GET - Fetch recipients preview for reminder
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get matches for this event
    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .eq('event_id', eventId);

    const matches = (matchesData || []) as Match[];

    if (matches.length === 0) {
      return NextResponse.json({
        recipients: [],
        stats: { total: 0, willReceive: 0, willSkip: 0 },
        reminderAlreadySent: false,
      });
    }

    const allMemberIds = matches.flatMap(m => m.table_members);
    const userIds = [...new Set(allMemberIds.filter(id => !isGuestId(id)))];
    const guestIds = [...new Set(allMemberIds.filter(id => isGuestId(id)).map(fromGuestId))];

    const recipients: Array<{
      id: string;
      displayName: string;
      hasLineId: boolean;
      isGuest: boolean;
    }> = [];

    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, display_name, line_user_id')
        .in('id', userIds);

      (usersData || []).forEach((u: { id: string; display_name: string; line_user_id: string | null }) => {
        recipients.push({
          id: u.id,
          displayName: u.display_name,
          hasLineId: !!u.line_user_id,
          isGuest: false,
        });
      });
    }

    if (guestIds.length > 0) {
      const { data: guestsData } = await supabase
        .from('guests')
        .select('id, display_name')
        .in('id', guestIds);

      (guestsData || []).forEach((g: { id: string; display_name: string }) => {
        recipients.push({
          id: `guest:${g.id}`,
          displayName: g.display_name,
          hasLineId: false,
          isGuest: true,
        });
      });
    }

    const reminderAlreadySent = matches.some(m => m.reminder_sent_at);

    return NextResponse.json({
      recipients,
      stats: {
        total: recipients.length,
        willReceive: recipients.filter(r => r.hasLineId).length,
        willSkip: recipients.filter(r => !r.hasLineId).length,
      },
      reminderAlreadySent,
    });
  } catch (err) {
    console.error('Get reminder recipients error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Send reminder notifications
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check event exists and is matched
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    const event = eventData as Event | null;
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status !== 'matched') {
      return NextResponse.json(
        { error: 'Reminders can only be sent for matched events' },
        { status: 400 }
      );
    }

    // Check event is today
    const eventDate = new Date(event.event_date);
    const today = new Date();
    const isToday =
      eventDate.getFullYear() === today.getFullYear() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getDate() === today.getDate();

    if (!isToday) {
      return NextResponse.json(
        { error: 'Reminders can only be sent on the event day' },
        { status: 400 }
      );
    }

    // Get all matches for this event
    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .eq('event_id', eventId);

    const matches = (matchesData || []) as Match[];

    if (matches.length === 0) {
      return NextResponse.json(
        { error: 'No matches found for this event' },
        { status: 400 }
      );
    }

    // Collect all member IDs
    const allMemberIds = matches.flatMap(m => m.table_members);
    const userIds = allMemberIds.filter(id => !isGuestId(id));
    const guestIds = allMemberIds.filter(id => isGuestId(id)).map(fromGuestId);

    // Build members map
    type MemberData = { id: string; display_name: string; line_user_id: string | null };
    const membersMap = new Map<string, { displayName: string; lineUserId: string | null }>();

    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, display_name, line_user_id')
        .in('id', userIds);

      (usersData || []).forEach((u: MemberData) => {
        membersMap.set(u.id, { displayName: u.display_name, lineUserId: u.line_user_id });
      });
    }

    if (guestIds.length > 0) {
      const { data: guestsData } = await supabase
        .from('guests')
        .select('id, display_name')
        .in('id', guestIds);

      (guestsData || []).forEach((g: { id: string; display_name: string }) => {
        membersMap.set(`guest:${g.id}`, { displayName: g.display_name, lineUserId: null });
      });
    }

    // Send notifications for each match
    let totalSent = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    for (const match of matches) {
      const members = match.table_members.map(id => {
        const userData = membersMap.get(id);
        return {
          lineUserId: userData?.lineUserId || null,
          displayName: userData?.displayName || 'ゲスト',
        };
      });

      const result = await sendReminderNotificationsToMembers(
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

    // Update matches with reminder timestamp
    const matchIds = matches.map(m => m.id);
    await (supabase.from('matches') as any)
      .update({
        reminder_sent_at: new Date().toISOString(),
        reminder_sent_by: userId,
      })
      .in('id', matchIds);

    console.log(`[LINE] Reminders sent: ${totalSent}, failed: ${totalFailed}, skipped: ${totalSkipped}`);

    return NextResponse.json({
      success: true,
      notifications: {
        sent: totalSent,
        failed: totalFailed,
        skipped: totalSkipped,
      },
    });
  } catch (err) {
    console.error('Send reminder error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
