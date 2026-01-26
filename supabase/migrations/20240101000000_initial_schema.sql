-- Enable UUID extension (pgcrypto for gen_random_uuid)

-- Gender enum
CREATE TYPE gender AS ENUM ('male', 'female');

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'none');

-- Event status enum
CREATE TYPE event_status AS ENUM ('open', 'matched', 'closed');

-- Entry type enum
CREATE TYPE entry_type AS ENUM ('solo', 'pair');

-- Participation status enum
CREATE TYPE participation_status AS ENUM ('pending', 'matched', 'canceled');

-- Personality type enum
CREATE TYPE personality_type AS ENUM ('Leader', 'Supporter', 'Analyst', 'Entertainer');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  gender gender NOT NULL,
  birth_date DATE NOT NULL,
  job TEXT NOT NULL,
  personality_type personality_type,
  stripe_customer_id TEXT,
  subscription_status subscription_status DEFAULT 'none' NOT NULL,
  line_user_id TEXT UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date TIMESTAMPTZ NOT NULL,
  area TEXT NOT NULL,
  status event_status DEFAULT 'open' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Participations table
CREATE TABLE participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  group_id UUID NOT NULL,
  entry_type entry_type NOT NULL,
  invite_token TEXT UNIQUE NOT NULL,
  status participation_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, event_id)
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  restaurant_url TEXT,
  table_members JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  block_flag BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(reviewer_id, target_user_id, match_id)
);

-- Indexes
CREATE INDEX idx_users_line_user_id ON users(line_user_id);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_participations_user_id ON participations(user_id);
CREATE INDEX idx_participations_event_id ON participations(event_id);
CREATE INDEX idx_participations_group_id ON participations(group_id);
CREATE INDEX idx_participations_invite_token ON participations(invite_token);
CREATE INDEX idx_matches_event_id ON matches(event_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_target_user_id ON reviews(target_user_id);
CREATE INDEX idx_reviews_match_id ON reviews(match_id);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid()::text = line_user_id OR is_admin = true);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid()::text = line_user_id)
  WITH CHECK (auth.uid()::text = line_user_id);

CREATE POLICY "Allow insert for authenticated users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Events policies (public read)
CREATE POLICY "Anyone can read events"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage events"
  ON events FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE line_user_id = auth.uid()::text AND is_admin = true));

-- Participations policies
CREATE POLICY "Users can read own participations"
  ON participations FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE line_user_id = auth.uid()::text));

CREATE POLICY "Users can create own participations"
  ON participations FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE line_user_id = auth.uid()::text));

CREATE POLICY "Users can update own participations"
  ON participations FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE line_user_id = auth.uid()::text));

CREATE POLICY "Admins can manage all participations"
  ON participations FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE line_user_id = auth.uid()::text AND is_admin = true));

-- Matches policies
CREATE POLICY "Users can read matches they are part of"
  ON matches FOR SELECT
  USING (
    table_members ? (SELECT id::text FROM users WHERE line_user_id = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM users WHERE line_user_id = auth.uid()::text AND is_admin = true)
  );

CREATE POLICY "Only admins can manage matches"
  ON matches FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE line_user_id = auth.uid()::text AND is_admin = true));

-- Reviews policies
CREATE POLICY "Users can read own reviews"
  ON reviews FOR SELECT
  USING (
    reviewer_id IN (SELECT id FROM users WHERE line_user_id = auth.uid()::text)
    OR target_user_id IN (SELECT id FROM users WHERE line_user_id = auth.uid()::text)
  );

CREATE POLICY "Users can create own reviews"
  ON reviews FOR INSERT
  WITH CHECK (reviewer_id IN (SELECT id FROM users WHERE line_user_id = auth.uid()::text));

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (reviewer_id IN (SELECT id FROM users WHERE line_user_id = auth.uid()::text));
