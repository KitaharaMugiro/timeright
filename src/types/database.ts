export type Gender = 'male' | 'female';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'none';
export type EventStatus = 'open' | 'matched' | 'closed';
export type EntryType = 'solo' | 'pair';
export type ParticipationStatus = 'pending' | 'matched' | 'canceled';
export type AttendanceStatus = 'attending' | 'canceled' | 'late';
export type PersonalityType = 'Leader' | 'Supporter' | 'Analyst' | 'Entertainer';
export type ParticipationMood = 'lively' | 'relaxed' | 'inspire' | 'other';
export type BudgetLevel = 1 | 2 | 3;
export type ReferralStatus = 'pending' | 'completed' | 'expired';
export type MemberStage = 'bronze' | 'silver' | 'gold' | 'platinum';
export type StagePointReason = 'participation' | 'review_sent' | 'review_received' | 'cancel' | 'late_cancel' | 'no_show';
export type IcebreakerGameType =
  | 'questions'
  | 'would_you_rather'
  | 'two_truths'
  | 'word_wolf'
  | 'common_things'
  | 'whodunit'
  | 'guess_favorite'
  | 'peer_intro';
export type IcebreakerSessionStatus = 'waiting' | 'playing' | 'finished';
export type IcebreakerQuestionCategory = 'casual' | 'fun' | 'deep';
export type IcebreakerWordWolfCategory = 'food' | 'place' | 'animal' | 'season' | 'entertainment' | 'sports' | 'other';
export type IcebreakerCommonThingsCategory = 'food' | 'hobby' | 'travel' | 'lifestyle' | 'personality' | 'experience' | 'other';
export type IcebreakerNgWordCategory = 'food' | 'daily' | 'emotion' | 'action' | 'place' | 'other';

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
  stage_points: number;
  member_stage: MemberStage;
  stage_updated_at: string;
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
  required_stage: MemberStage;
  created_at: string;
}

export interface Participation {
  id: string;
  user_id: string;
  event_id: string;
  group_id: string;
  entry_type: EntryType;
  invite_token: string;
  short_code: string | null;
  mood: ParticipationMood;
  mood_text: string | null;
  budget_level: BudgetLevel;
  status: ParticipationStatus;
  attendance_status: AttendanceStatus;
  attendance_updated_at: string | null;
  late_minutes: number | null;
  cancel_reason: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  event_id: string;
  restaurant_name: string;
  restaurant_url: string | null;
  reservation_name: string | null;
  table_members: string[];
  reminder_sent_at: string | null;
  reminder_sent_by: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  target_user_id: string;
  match_id: string;
  rating: number;
  comment: string | null;
  memo: string | null;
  block_flag: boolean;
  is_no_show: boolean;
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

export interface StagePointLog {
  id: string;
  user_id: string;
  points: number;
  reason: StagePointReason;
  reference_id: string | null;
  created_at: string;
}

export interface MemberStageHistory {
  id: string;
  user_id: string;
  old_stage: MemberStage | null;
  new_stage: MemberStage;
  points_at_change: number;
  created_at: string;
}

export interface MemberStageInfo {
  stage: MemberStage;
  progressPercent: number;
  nextStage: MemberStage | null;
  message: string;
}

export interface IcebreakerSession {
  id: string;
  match_id: string;
  game_type: IcebreakerGameType;
  status: IcebreakerSessionStatus;
  current_round: number;
  game_data: Json;
  host_user_id: string;
  created_at: string;
}

export interface IcebreakerPlayer {
  id: string;
  session_id: string;
  user_id: string;
  player_data: Json;
  is_ready: boolean;
  joined_at: string;
}

export interface IcebreakerQuestion {
  id: string;
  question: string;
  category: IcebreakerQuestionCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IcebreakerWouldYouRather {
  id: string;
  option_a: string;
  option_b: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IcebreakerWordWolf {
  id: string;
  majority_word: string;
  minority_word: string;
  category: IcebreakerWordWolfCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IcebreakerCommonThings {
  id: string;
  prompt: string;
  category: IcebreakerCommonThingsCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IcebreakerNgWord {
  id: string;
  word: string;
  category: IcebreakerNgWordCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
          required_stage?: MemberStage;
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
          budget_level: BudgetLevel;
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
      icebreaker_sessions: {
        Row: IcebreakerSession;
        Insert: Partial<IcebreakerSession> & {
          match_id: string;
          game_type: IcebreakerGameType;
          host_user_id: string;
        };
        Update: Partial<IcebreakerSession>;
        Relationships: [];
      };
      icebreaker_players: {
        Row: IcebreakerPlayer;
        Insert: Partial<IcebreakerPlayer> & {
          session_id: string;
          user_id: string;
        };
        Update: Partial<IcebreakerPlayer>;
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
      attendance_status: AttendanceStatus;
      personality_type: PersonalityType;
      participation_mood: ParticipationMood;
      budget_level: BudgetLevel;
      referral_status: ReferralStatus;
      member_stage: MemberStage;
      stage_point_reason: StagePointReason;
      icebreaker_game_type: IcebreakerGameType;
      icebreaker_session_status: IcebreakerSessionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
