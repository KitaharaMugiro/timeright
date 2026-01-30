import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { DashboardClient } from './client';
import type { Match, Event, Participation } from '@/types/database';

interface DashboardPageProps {
  searchParams: Promise<{ success?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  // Check if onboarding is complete
  if (!user.personality_type) {
    redirect('/onboarding');
  }

  // Check subscription status
  // Skip check if coming from successful Stripe checkout (webhook may not have processed yet)
  const isFromCheckout = params.success === 'true';

  // Allow access if:
  // 1. Status is 'active'
  // 2. Status is 'canceled' but still within the subscription period
  // 3. Coming from successful checkout (webhook may not have processed yet)
  const hasValidSubscription =
    user.subscription_status === 'active' ||
    (user.subscription_status === 'canceled' &&
     user.subscription_period_end &&
     new Date(user.subscription_period_end) > new Date());

  if (!hasValidSubscription && !isFromCheckout) {
    redirect('/onboarding/subscribe');
  }

  const supabase = await createServiceClient();

  // Get upcoming events (at least 2 days away)
  // e.g., on 1/27, don't show 1/28 events
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + 2);
  cutoffDate.setHours(0, 0, 0, 0);
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'open')
    .gte('event_date', cutoffDate.toISOString())
    .order('event_date', { ascending: true });

  // Get user's participations
  const { data: participations } = await supabase
    .from('participations')
    .select('*, events(*)')
    .eq('user_id', user.id)
    .neq('status', 'canceled') as { data: (Participation & { events: Event })[] | null };

  // Get pair partners for user's pair participations
  type PairPartner = {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  const pairPartnersMap: Record<string, PairPartner> = {};

  const pairParticipations = (participations || []).filter((p) => p.entry_type === 'pair');
  if (pairParticipations.length > 0) {
    const groupIds = pairParticipations.map((p) => p.group_id);

    // Fetch pair partners (other users in the same groups)
    const { data: pairPartners } = await supabase
      .from('participations')
      .select('group_id, user_id, users!participations_user_id_fkey(id, display_name, avatar_url)')
      .in('group_id', groupIds)
      .neq('user_id', user.id)
      .neq('status', 'canceled') as { data: { group_id: string; user_id: string; users: PairPartner | null }[] | null };

    // Create a map of group_id -> partner info
    (pairPartners || []).forEach((p) => {
      if (p.users) {
        pairPartnersMap[p.group_id] = {
          id: p.users.id,
          display_name: p.users.display_name,
          avatar_url: p.users.avatar_url,
        };
      }
    });
  }

  // Get user's matches (today and future only)
  // Note: table_members is a JSONB array, so we need to stringify the array for contains filter
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: matches } = await supabase
    .from('matches')
    .select('*, events!inner(*)')
    .contains('table_members', JSON.stringify([user.id]))
    .gte('events.event_date', today.toISOString()) as { data: (Match & { events: Event })[] | null };

  // Get all unique member IDs from matches for participant info
  const allMemberIds = [...new Set((matches || []).flatMap((m) => m.table_members))];

  // Fetch participant details (avatar_url and job only)
  const { data: participants } = allMemberIds.length > 0
    ? await supabase
        .from('users')
        .select('id, avatar_url, job')
        .in('id', allMemberIds) as { data: { id: string; avatar_url: string | null; job: string }[] | null }
    : { data: [] as { id: string; avatar_url: string | null; job: string }[] };

  // Create a map for quick lookup
  const participantsMap: Record<string, { avatar_url: string | null; job: string }> = {};
  (participants || []).forEach((p) => {
    participantsMap[p.id] = { avatar_url: p.avatar_url, job: p.job };
  });

  return (
    <DashboardClient
      user={user}
      events={events || []}
      participations={participations || []}
      matches={matches || []}
      participantsMap={participantsMap}
      pairPartnersMap={pairPartnersMap}
    />
  );
}
