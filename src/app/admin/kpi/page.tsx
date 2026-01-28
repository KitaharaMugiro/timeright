import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { KPIDashboardClient } from './client';
import type { KPIData } from '@/types/kpi';

export default async function AdminKPIPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/api/auth/line?redirect=/admin/kpi');
  }

  if (!user.is_admin) {
    redirect('/');
  }

  const supabase = await createServiceClient();

  // Fetch all KPI data in parallel
  const [
    { data: userMetrics },
    { data: subscriptionMetrics },
    { data: eventMetrics },
    { data: participationMetrics },
    { data: reviewMetrics },
    { data: referralMetrics },
    { data: dailySignups },
    { data: dailyParticipations },
  ] = await Promise.all([
    supabase.from('kpi_user_metrics').select('*').single(),
    supabase.from('kpi_subscription_metrics').select('*').single(),
    supabase.from('kpi_event_metrics').select('*').single(),
    supabase.from('kpi_participation_metrics').select('*').single(),
    supabase.from('kpi_review_metrics').select('*').single(),
    supabase.from('kpi_referral_metrics').select('*').single(),
    supabase.from('kpi_daily_signups').select('*'),
    supabase.from('kpi_daily_participations').select('*'),
  ]);

  const kpiData: KPIData = {
    userMetrics: userMetrics || {
      total_users: 0,
      new_users_today: 0,
      new_users_week: 0,
      new_users_month: 0,
      onboarded_users: 0,
      onboarding_completion_rate: 0,
    },
    subscriptionMetrics: subscriptionMetrics || {
      active_subscribers: 0,
      canceled_subscribers: 0,
      past_due_subscribers: 0,
      no_subscription: 0,
      subscription_rate: 0,
    },
    eventMetrics: eventMetrics || {
      total_events: 0,
      open_events: 0,
      matched_events: 0,
      closed_events: 0,
    },
    participationMetrics: participationMetrics || {
      total_participations: 0,
      solo_entries: 0,
      pair_entries: 0,
      canceled_entries: 0,
      cancellation_rate: 0,
      mood_lively: 0,
      mood_relaxed: 0,
      mood_inspire: 0,
      mood_other: 0,
    },
    reviewMetrics: reviewMetrics || {
      total_reviews: 0,
      average_rating: 0,
      rating_1: 0,
      rating_2: 0,
      rating_3: 0,
      rating_4: 0,
      rating_5: 0,
      block_count: 0,
      block_rate: 0,
    },
    referralMetrics: referralMetrics || {
      total_referrals: 0,
      pending_referrals: 0,
      completed_referrals: 0,
      expired_referrals: 0,
      completion_rate: 0,
    },
    dailySignups: dailySignups || [],
    dailyParticipations: dailyParticipations || [],
    generatedAt: new Date().toISOString(),
  };

  return <KPIDashboardClient data={kpiData} />;
}
