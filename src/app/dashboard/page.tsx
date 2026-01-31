import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { DashboardClient } from './client';
import type { Match, Event, Participation } from '@/types/database';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/liff');
  }

  // Check if onboarding is complete
  if (!user.personality_type) {
    redirect('/onboarding');
  }

  const supabase = await createServiceClient();

  // Prepare date filters
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + 2);
  cutoffDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // First batch: Run independent queries in parallel
  const [eventsResult, participationsResult, matchesResult] = await Promise.all([
    // Get upcoming events (at least 2 days away)
    supabase
      .from('events')
      .select('*')
      .eq('status', 'open')
      .gte('event_date', cutoffDate.toISOString())
      .order('event_date', { ascending: true }),

    // Get user's participations
    supabase
      .from('participations')
      .select('*, events(*)')
      .eq('user_id', user.id)
      .neq('status', 'canceled'),

    // Get user's matches (today and future only)
    supabase
      .from('matches')
      .select('*, events!inner(*)')
      .contains('table_members', JSON.stringify([user.id]))
      .gte('events.event_date', today.toISOString()),
  ]);

  const events = eventsResult.data;
  const participations = participationsResult.data as (Participation & { events: Event })[] | null;
  const matches = matchesResult.data as (Match & { events: Event })[] | null;

  // Prepare data for second batch of queries
  type PairPartner = {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };

  const pairParticipations = (participations || []).filter((p) => p.entry_type === 'pair');
  const groupIds = pairParticipations.map((p) => p.group_id);

  const allMemberIds = [...new Set((matches || []).flatMap((m) => m.table_members))];
  const realUserIds = allMemberIds.filter((id) => !id.startsWith('guest:'));
  const guestIds = allMemberIds
    .filter((id) => id.startsWith('guest:'))
    .map((id) => id.replace('guest:', ''));
  const matchEventIds = [...new Set((matches || []).map((m) => m.event_id))];

  // Second batch: Run dependent queries in parallel
  const [pairPartnersResult, participantsResult, guestsResult, matchParticipationsResult] = await Promise.all([
    // Fetch pair partners
    groupIds.length > 0
      ? supabase
          .from('participations')
          .select('group_id, user_id, users!participations_user_id_fkey(id, display_name, avatar_url)')
          .in('group_id', groupIds)
          .neq('user_id', user.id)
          .neq('status', 'canceled')
      : null,

    // Fetch participant details
    realUserIds.length > 0
      ? supabase
          .from('users')
          .select('id, display_name, avatar_url, job')
          .in('id', realUserIds)
      : null,

    // Fetch guest details
    guestIds.length > 0
      ? supabase
          .from('guests')
          .select('id, display_name, gender')
          .in('id', guestIds)
      : null,

    // Fetch attendance status
    matchEventIds.length > 0 && realUserIds.length > 0
      ? supabase
          .from('participations')
          .select('user_id, event_id, attendance_status, late_minutes')
          .in('event_id', matchEventIds)
          .in('user_id', realUserIds)
      : null,
  ]);

  // Build pairPartnersMap
  const pairPartnersMap: Record<string, PairPartner> = {};
  const pairPartners = pairPartnersResult?.data as { group_id: string; user_id: string; users: PairPartner | null }[] | null;
  (pairPartners || []).forEach((p) => {
    if (p.users) {
      pairPartnersMap[p.group_id] = {
        id: p.users.id,
        display_name: p.users.display_name,
        avatar_url: p.users.avatar_url,
      };
    }
  });

  // Build guestsMap
  const guestsMap: Record<string, { display_name: string; gender: string }> = {};
  const guests = guestsResult?.data as { id: string; display_name: string; gender: string }[] | null;
  (guests || []).forEach((g) => {
    guestsMap[`guest:${g.id}`] = { display_name: g.display_name, gender: g.gender };
  });

  // Build attendanceMap
  const attendanceMap: Record<string, Record<string, { attendance_status: string; late_minutes: number | null }>> = {};
  const matchParticipations = matchParticipationsResult?.data as { user_id: string; event_id: string; attendance_status: string; late_minutes: number | null }[] | null;
  (matchParticipations || []).forEach((p) => {
    if (!attendanceMap[p.event_id]) {
      attendanceMap[p.event_id] = {};
    }
    attendanceMap[p.event_id][p.user_id] = {
      attendance_status: p.attendance_status,
      late_minutes: p.late_minutes,
    };
  });

  // Build participantsMap
  const participantsMap: Record<string, { display_name: string; avatar_url: string | null; job: string }> = {};
  const participants = participantsResult?.data as { id: string; display_name: string; avatar_url: string | null; job: string }[] | null;
  (participants || []).forEach((p) => {
    participantsMap[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url, job: p.job };
  });

  return (
    <DashboardClient
      user={user}
      events={events || []}
      participations={participations || []}
      matches={matches || []}
      participantsMap={participantsMap}
      guestsMap={guestsMap}
      attendanceMap={attendanceMap}
      pairPartnersMap={pairPartnersMap}
    />
  );
}
