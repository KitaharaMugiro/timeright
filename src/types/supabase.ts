export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          color: string
          created_at: string
          description: string
          icon_emoji: string | null
          icon_type: string | null
          id: string
          is_active: boolean
          lucide_icon: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          color: string
          created_at?: string
          description: string
          icon_emoji?: string | null
          icon_type?: string | null
          id?: string
          is_active?: boolean
          lucide_icon?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          icon_emoji?: string | null
          icon_type?: string | null
          id?: string
          is_active?: boolean
          lucide_icon?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          area: string
          created_at: string
          event_date: string
          id: string
          required_stage: Database["public"]["Enums"]["member_stage"] | null
          status: Database["public"]["Enums"]["event_status"]
        }
        Insert: {
          area: string
          created_at?: string
          event_date: string
          id?: string
          required_stage?: Database["public"]["Enums"]["member_stage"] | null
          status?: Database["public"]["Enums"]["event_status"]
        }
        Update: {
          area?: string
          created_at?: string
          event_date?: string
          id?: string
          required_stage?: Database["public"]["Enums"]["member_stage"] | null
          status?: Database["public"]["Enums"]["event_status"]
        }
        Relationships: []
      }
      guests: {
        Row: {
          created_at: string
          display_name: string
          event_id: string
          gender: string
          group_id: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          event_id: string
          gender: string
          group_id: string
          id?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          event_id?: string
          gender?: string
          group_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      icebreaker_common_things: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          prompt: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          prompt: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      icebreaker_game_categories: {
        Row: {
          created_at: string | null
          description: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      icebreaker_games: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          emoji: string | null
          game_type: string
          has_rounds: boolean | null
          id: string
          instructions: string[] | null
          is_active: boolean | null
          max_players: number | null
          min_players: number | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          game_type: string
          has_rounds?: boolean | null
          id?: string
          instructions?: string[] | null
          is_active?: boolean | null
          max_players?: number | null
          min_players?: number | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          game_type?: string
          has_rounds?: boolean | null
          id?: string
          instructions?: string[] | null
          is_active?: boolean | null
          max_players?: number | null
          min_players?: number | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "icebreaker_games_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "icebreaker_game_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      icebreaker_ng_word: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          word: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          word: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          word?: string
        }
        Relationships: []
      }
      icebreaker_players: {
        Row: {
          id: string
          is_ready: boolean
          joined_at: string
          player_data: Json
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_ready?: boolean
          joined_at?: string
          player_data?: Json
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_ready?: boolean
          joined_at?: string
          player_data?: Json
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "icebreaker_players_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "icebreaker_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icebreaker_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      icebreaker_questions: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      icebreaker_sessions: {
        Row: {
          created_at: string
          current_round: number
          game_data: Json
          game_type: Database["public"]["Enums"]["icebreaker_game_type"]
          host_user_id: string
          id: string
          match_id: string
          status: Database["public"]["Enums"]["icebreaker_session_status"]
        }
        Insert: {
          created_at?: string
          current_round?: number
          game_data?: Json
          game_type: Database["public"]["Enums"]["icebreaker_game_type"]
          host_user_id: string
          id?: string
          match_id: string
          status?: Database["public"]["Enums"]["icebreaker_session_status"]
        }
        Update: {
          created_at?: string
          current_round?: number
          game_data?: Json
          game_type?: Database["public"]["Enums"]["icebreaker_game_type"]
          host_user_id?: string
          id?: string
          match_id?: string
          status?: Database["public"]["Enums"]["icebreaker_session_status"]
        }
        Relationships: [
          {
            foreignKeyName: "icebreaker_sessions_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icebreaker_sessions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      icebreaker_word_wolf: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          majority_word: string
          minority_word: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          majority_word: string
          minority_word: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          majority_word?: string
          minority_word?: string
          updated_at?: string
        }
        Relationships: []
      }
      icebreaker_would_you_rather: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          option_a: string
          option_b: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          option_a: string
          option_b: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          option_a?: string
          option_b?: string
          updated_at?: string
        }
        Relationships: []
      }
      identity_verification_requests: {
        Row: {
          created_at: string
          id: string
          line_message_id: string
          line_user_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          line_message_id: string
          line_user_id: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          line_message_id?: string
          line_user_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          event_id: string
          id: string
          reminder_sent_at: string | null
          reminder_sent_by: string | null
          reservation_name: string | null
          restaurant_name: string
          restaurant_url: string | null
          table_members: Json
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          reminder_sent_at?: string | null
          reminder_sent_by?: string | null
          reservation_name?: string | null
          restaurant_name: string
          restaurant_url?: string | null
          table_members?: Json
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          reminder_sent_at?: string | null
          reminder_sent_by?: string | null
          reservation_name?: string | null
          restaurant_name?: string
          restaurant_url?: string | null
          table_members?: Json
        }
        Relationships: [
          {
            foreignKeyName: "matches_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_reminder_sent_by_fkey"
            columns: ["reminder_sent_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      member_stage_history: {
        Row: {
          created_at: string | null
          id: string
          new_stage: Database["public"]["Enums"]["member_stage"] | null
          old_stage: Database["public"]["Enums"]["member_stage"] | null
          points_at_change: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_stage?: Database["public"]["Enums"]["member_stage"] | null
          old_stage?: Database["public"]["Enums"]["member_stage"] | null
          points_at_change?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          new_stage?: Database["public"]["Enums"]["member_stage"] | null
          old_stage?: Database["public"]["Enums"]["member_stage"] | null
          points_at_change?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_stage_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      participations: {
        Row: {
          attendance_status: Database["public"]["Enums"]["attendance_status"]
          attendance_updated_at: string | null
          budget_level: number
          cancel_reason: string | null
          created_at: string
          entry_type: Database["public"]["Enums"]["entry_type"]
          event_id: string
          group_id: string
          id: string
          invite_token: string
          late_minutes: number | null
          mood: Database["public"]["Enums"]["participation_mood"]
          mood_text: string | null
          short_code: string | null
          status: Database["public"]["Enums"]["participation_status"]
          user_id: string
        }
        Insert: {
          attendance_status?: Database["public"]["Enums"]["attendance_status"]
          attendance_updated_at?: string | null
          budget_level?: number
          cancel_reason?: string | null
          created_at?: string
          entry_type: Database["public"]["Enums"]["entry_type"]
          event_id: string
          group_id: string
          id?: string
          invite_token: string
          late_minutes?: number | null
          mood?: Database["public"]["Enums"]["participation_mood"]
          mood_text?: string | null
          short_code?: string | null
          status?: Database["public"]["Enums"]["participation_status"]
          user_id: string
        }
        Update: {
          attendance_status?: Database["public"]["Enums"]["attendance_status"]
          attendance_updated_at?: string | null
          budget_level?: number
          cancel_reason?: string | null
          created_at?: string
          entry_type?: Database["public"]["Enums"]["entry_type"]
          event_id?: string
          group_id?: string
          id?: string
          invite_token?: string
          late_minutes?: number | null
          mood?: Database["public"]["Enums"]["participation_mood"]
          mood_text?: string | null
          short_code?: string | null
          status?: Database["public"]["Enums"]["participation_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referred_user_id: string | null
          referrer_id: string
          status: Database["public"]["Enums"]["referral_status"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referred_user_id?: string | null
          referrer_id: string
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referred_user_id?: string | null
          referrer_id?: string
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          block_flag: boolean
          comment: string | null
          created_at: string
          id: string
          is_no_show: boolean
          match_id: string
          memo: string | null
          rating: number
          reviewer_id: string
          target_user_id: string
        }
        Insert: {
          block_flag?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          is_no_show?: boolean
          match_id: string
          memo?: string | null
          rating: number
          reviewer_id: string
          target_user_id: string
        }
        Update: {
          block_flag?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          is_no_show?: boolean
          match_id?: string
          memo?: string | null
          rating?: number
          reviewer_id?: string
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_point_logs: {
        Row: {
          created_at: string | null
          id: string
          points: number
          reason: string
          reference_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          points: number
          reason: string
          reference_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          points?: number
          reason?: string
          reference_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stage_point_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          awarded_reason: string | null
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_reason?: string | null
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          awarded_reason?: string | null
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          birth_date: string
          created_at: string
          display_name: string
          email: string
          gender: Database["public"]["Enums"]["gender"]
          has_used_invite_coupon: boolean
          id: string
          is_admin: boolean
          is_identity_verified: boolean
          job: string
          line_user_id: string | null
          member_stage: Database["public"]["Enums"]["member_stage"] | null
          pending_invite_token: string | null
          personality_type:
            | Database["public"]["Enums"]["personality_type"]
            | null
          referred_by: string | null
          stage_points: number | null
          stage_updated_at: string | null
          stripe_customer_id: string | null
          subscription_period_end: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
        }
        Insert: {
          avatar_url?: string | null
          birth_date: string
          created_at?: string
          display_name: string
          email: string
          gender: Database["public"]["Enums"]["gender"]
          has_used_invite_coupon?: boolean
          id?: string
          is_admin?: boolean
          is_identity_verified?: boolean
          job: string
          line_user_id?: string | null
          member_stage?: Database["public"]["Enums"]["member_stage"] | null
          pending_invite_token?: string | null
          personality_type?:
            | Database["public"]["Enums"]["personality_type"]
            | null
          referred_by?: string | null
          stage_points?: number | null
          stage_updated_at?: string | null
          stripe_customer_id?: string | null
          subscription_period_end?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string
          created_at?: string
          display_name?: string
          email?: string
          gender?: Database["public"]["Enums"]["gender"]
          has_used_invite_coupon?: boolean
          id?: string
          is_admin?: boolean
          is_identity_verified?: boolean
          job?: string
          line_user_id?: string | null
          member_stage?: Database["public"]["Enums"]["member_stage"] | null
          pending_invite_token?: string | null
          personality_type?:
            | Database["public"]["Enums"]["personality_type"]
            | null
          referred_by?: string | null
          stage_points?: number | null
          stage_updated_at?: string | null
          stripe_customer_id?: string | null
          subscription_period_end?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
        }
        Relationships: [
          {
            foreignKeyName: "users_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      kpi_daily_participations: {
        Row: {
          cancellations: number | null
          date: string | null
          participations: number | null
        }
        Relationships: []
      }
      kpi_daily_signups: {
        Row: {
          date: string | null
          signups: number | null
        }
        Relationships: []
      }
      kpi_event_metrics: {
        Row: {
          closed_events: number | null
          matched_events: number | null
          open_events: number | null
          total_events: number | null
        }
        Relationships: []
      }
      kpi_participation_metrics: {
        Row: {
          canceled_entries: number | null
          cancellation_rate: number | null
          mood_inspire: number | null
          mood_lively: number | null
          mood_relaxed: number | null
          pair_entries: number | null
          solo_entries: number | null
          total_participations: number | null
        }
        Relationships: []
      }
      kpi_referral_metrics: {
        Row: {
          completed_referrals: number | null
          completion_rate: number | null
          expired_referrals: number | null
          pending_referrals: number | null
          total_referrals: number | null
        }
        Relationships: []
      }
      kpi_review_metrics: {
        Row: {
          average_rating: number | null
          block_count: number | null
          block_rate: number | null
          rating_1: number | null
          rating_2: number | null
          rating_3: number | null
          rating_4: number | null
          rating_5: number | null
          total_reviews: number | null
        }
        Relationships: []
      }
      kpi_subscription_metrics: {
        Row: {
          active_subscribers: number | null
          canceled_subscribers: number | null
          no_subscription: number | null
          past_due_subscribers: number | null
          subscription_rate: number | null
        }
        Relationships: []
      }
      kpi_user_metrics: {
        Row: {
          new_users_month: number | null
          new_users_today: number | null
          new_users_week: number | null
          onboarded_users: number | null
          onboarding_completion_rate: number | null
          total_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_stage_points: {
        Args: {
          p_points: number
          p_reason: string
          p_reference_id?: string
          p_user_id: string
        }
        Returns: undefined
      }
      get_stage_from_points: {
        Args: { p_points: number }
        Returns: Database["public"]["Enums"]["member_stage"]
      }
    }
    Enums: {
      attendance_status: "attending" | "canceled" | "late"
      entry_type: "solo" | "pair"
      event_status: "open" | "matched" | "closed"
      gender: "male" | "female"
      icebreaker_game_type:
        | "questions"
        | "would_you_rather"
        | "two_truths"
        | "word_wolf"
        | "common_things"
        | "whodunit"
        | "guess_favorite"
        | "peer_intro"
        | "ng_word"
      icebreaker_session_status: "waiting" | "playing" | "finished"
      member_stage: "bronze" | "silver" | "gold" | "platinum"
      participation_mood: "lively" | "relaxed" | "inspire"
      participation_status: "pending" | "matched" | "canceled"
      personality_type: "Leader" | "Supporter" | "Analyst" | "Entertainer"
      referral_status: "pending" | "completed" | "expired"
      subscription_status: "active" | "canceled" | "past_due" | "none"
      verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof DatabaseWithoutInternals, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never
