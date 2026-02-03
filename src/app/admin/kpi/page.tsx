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

  const DAILY_WINDOW_DAYS = 90;
  const since = new Date();
  since.setDate(since.getDate() - (DAILY_WINDOW_DAYS - 1));
  const sinceDate = since.toISOString().split('T')[0];

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
    supabase
      .from('kpi_daily_signups')
      .select('date, signups')
      .gte('date', sinceDate)
      .order('date', { ascending: true }),
    supabase
      .from('kpi_daily_participations')
      .select('date, participations, cancellations')
      .gte('date', sinceDate)
      .order('date', { ascending: true }),
  ]);

  const kpiData: KPIData = {
    userMetrics: {
      total_users: userMetrics?.total_users ?? 0,
      new_users_today: userMetrics?.new_users_today ?? 0,
      new_users_week: userMetrics?.new_users_week ?? 0,
      new_users_month: userMetrics?.new_users_month ?? 0,
      onboarded_users: userMetrics?.onboarded_users ?? 0,
      onboarding_completion_rate: userMetrics?.onboarding_completion_rate ?? 0,
    },
    subscriptionMetrics: {
      active_subscribers: subscriptionMetrics?.active_subscribers ?? 0,
      canceled_subscribers: subscriptionMetrics?.canceled_subscribers ?? 0,
      past_due_subscribers: subscriptionMetrics?.past_due_subscribers ?? 0,
      no_subscription: subscriptionMetrics?.no_subscription ?? 0,
      subscription_rate: subscriptionMetrics?.subscription_rate ?? 0,
    },
    eventMetrics: {
      total_events: eventMetrics?.total_events ?? 0,
      open_events: eventMetrics?.open_events ?? 0,
      matched_events: eventMetrics?.matched_events ?? 0,
      closed_events: eventMetrics?.closed_events ?? 0,
    },
    participationMetrics: {
      total_participations: participationMetrics?.total_participations ?? 0,
      solo_entries: participationMetrics?.solo_entries ?? 0,
      pair_entries: participationMetrics?.pair_entries ?? 0,
      canceled_entries: participationMetrics?.canceled_entries ?? 0,
      cancellation_rate: participationMetrics?.cancellation_rate ?? 0,
      mood_lively: participationMetrics?.mood_lively ?? 0,
      mood_relaxed: participationMetrics?.mood_relaxed ?? 0,
      mood_inspire: participationMetrics?.mood_inspire ?? 0,
      mood_other: 0,
    },
    reviewMetrics: {
      total_reviews: reviewMetrics?.total_reviews ?? 0,
      average_rating: reviewMetrics?.average_rating ?? 0,
      rating_1: reviewMetrics?.rating_1 ?? 0,
      rating_2: reviewMetrics?.rating_2 ?? 0,
      rating_3: reviewMetrics?.rating_3 ?? 0,
      rating_4: reviewMetrics?.rating_4 ?? 0,
      rating_5: reviewMetrics?.rating_5 ?? 0,
      block_count: reviewMetrics?.block_count ?? 0,
      block_rate: reviewMetrics?.block_rate ?? 0,
    },
    referralMetrics: {
      total_referrals: referralMetrics?.total_referrals ?? 0,
      pending_referrals: referralMetrics?.pending_referrals ?? 0,
      completed_referrals: referralMetrics?.completed_referrals ?? 0,
      expired_referrals: referralMetrics?.expired_referrals ?? 0,
      completion_rate: referralMetrics?.completion_rate ?? 0,
    },
    dailySignups: (dailySignups || []).map((d) => ({
      date: d.date ?? '',
      signups: d.signups ?? 0,
    })),
    dailyParticipations: (dailyParticipations || []).map((d) => ({
      date: d.date ?? '',
      participations: d.participations ?? 0,
      cancellations: d.cancellations ?? 0,
    })),
    generatedAt: new Date().toISOString(),
  };

  return <KPIDashboardClient data={kpiData} />;
}
