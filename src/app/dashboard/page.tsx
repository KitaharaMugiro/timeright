import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { DashboardClient } from './client';

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

  // Get upcoming events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'open')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true });

  // Get user's participations
  const { data: participations } = await supabase
    .from('participations')
    .select('*, events(*)')
    .eq('user_id', user.id)
    .neq('status', 'canceled');

  // Get user's matches
  // Note: table_members is a JSONB array, so we need to stringify the array for contains filter
  const { data: matches } = await supabase
    .from('matches')
    .select('*, events(*)')
    .contains('table_members', JSON.stringify([user.id]));

  return (
    <DashboardClient
      user={user}
      events={events || []}
      participations={participations || []}
      matches={matches || []}
    />
  );
}
