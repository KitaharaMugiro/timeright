export interface UserMetrics {
  total_users: number;
  new_users_today: number;
  new_users_week: number;
  new_users_month: number;
  onboarded_users: number;
  onboarding_completion_rate: number;
}

export interface SubscriptionMetrics {
  active_subscribers: number;
  canceled_subscribers: number;
  past_due_subscribers: number;
  no_subscription: number;
  subscription_rate: number;
}

export interface EventMetrics {
  total_events: number;
  open_events: number;
  matched_events: number;
  closed_events: number;
}

export interface ParticipationMetrics {
  total_participations: number;
  solo_entries: number;
  pair_entries: number;
  canceled_entries: number;
  cancellation_rate: number;
  mood_lively: number;
  mood_relaxed: number;
  mood_inspire: number;
  mood_other: number;
}

export interface ReviewMetrics {
  total_reviews: number;
  average_rating: number;
  rating_1: number;
  rating_2: number;
  rating_3: number;
  rating_4: number;
  rating_5: number;
  block_count: number;
  block_rate: number;
}

export interface ReferralMetrics {
  total_referrals: number;
  pending_referrals: number;
  completed_referrals: number;
  expired_referrals: number;
  completion_rate: number;
}

export interface DailySignup {
  date: string;
  signups: number;
}

export interface DailyParticipation {
  date: string;
  participations: number;
  cancellations: number;
}

export interface KPIData {
  userMetrics: UserMetrics;
  subscriptionMetrics: SubscriptionMetrics;
  eventMetrics: EventMetrics;
  participationMetrics: ParticipationMetrics;
  reviewMetrics: ReviewMetrics;
  referralMetrics: ReferralMetrics;
  dailySignups: DailySignup[];
  dailyParticipations: DailyParticipation[];
  generatedAt: string;
}
