export type Gender = 'male' | 'female';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'none';
export type EventStatus = 'open' | 'matched' | 'closed';
export type EntryType = 'solo' | 'pair';
export type ParticipationStatus = 'pending' | 'matched' | 'canceled';
export type PersonalityType = 'Leader' | 'Supporter' | 'Analyst' | 'Entertainer';
export type ParticipationMood = 'lively' | 'relaxed' | 'inspire' | 'other';
export type ReferralStatus = 'pending' | 'completed' | 'expired';

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  gender: Gender;
  birth_date: string;
  job: string;
  personality_type: PersonalityType | null;
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_period_end: string | null;
  line_user_id: string | null;
  is_admin: boolean;
  referred_by: string | null;
  has_used_invite_coupon: boolean;
  pending_invite_token: string | null;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string | null;
  status: ReferralStatus;
  created_at: string;
  completed_at: string | null;
}

export interface Event {
  id: string;
  event_date: string;
  area: string;
  status: EventStatus;
  created_at: string;
}

export interface Participation {
  id: string;
  user_id: string;
  event_id: string;
  group_id: string;
  entry_type: EntryType;
  invite_token: string;
  mood: ParticipationMood;
  mood_text: string | null;
  status: ParticipationStatus;
  created_at: string;
}

export interface Match {
  id: string;
  event_id: string;
  restaurant_name: string;
  restaurant_url: string | null;
  reservation_name: string | null;
  table_members: string[];
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  target_user_id: string;
  match_id: string;
  rating: number;
  comment: string | null;
  block_flag: boolean;
  created_at: string;
}

export interface Guest {
  id: string;
  event_id: string;
  display_name: string;
  gender: Gender;
  group_id: string;
  created_at: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Partial<User> & {
          email: string;
          display_name: string;
          gender: Gender;
          birth_date: string;
          job: string;
        };
        Update: Partial<User>;
        Relationships: [];
      };
      events: {
        Row: Event;
        Insert: Partial<Event> & {
          event_date: string;
          area: string;
        };
        Update: Partial<Event>;
        Relationships: [];
      };
      participations: {
        Row: Participation;
        Insert: Partial<Participation> & {
          user_id: string;
          event_id: string;
          group_id: string;
          entry_type: EntryType;
          invite_token: string;
          mood: ParticipationMood;
        };
        Update: Partial<Participation>;
        Relationships: [];
      };
      matches: {
        Row: Match;
        Insert: Partial<Match> & {
          event_id: string;
          restaurant_name: string;
          table_members: string[];
        };
        Update: Partial<Match>;
        Relationships: [];
      };
      reviews: {
        Row: Review;
        Insert: Partial<Review> & {
          reviewer_id: string;
          target_user_id: string;
          match_id: string;
          rating: number;
        };
        Update: Partial<Review>;
        Relationships: [];
      };
      referrals: {
        Row: Referral;
        Insert: Partial<Referral> & {
          referrer_id: string;
        };
        Update: Partial<Referral>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      gender: Gender;
      subscription_status: SubscriptionStatus;
      event_status: EventStatus;
      entry_type: EntryType;
      participation_status: ParticipationStatus;
      personality_type: PersonalityType;
      participation_mood: ParticipationMood;
      referral_status: ReferralStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
