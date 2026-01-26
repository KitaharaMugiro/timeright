-- Add referrals system for friend invitation with first-month-free coupon

-- Referral status enum
CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'expired');

-- Add referred_by column to users table
ALTER TABLE users ADD COLUMN referred_by UUID REFERENCES users(id);

-- Create index for referred_by
CREATE INDEX idx_users_referred_by ON users(referred_by);

-- Referrals tracking table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status referral_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for referrals table
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- Enable Row Level Security
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view referrals they made"
  ON referrals FOR SELECT
  USING (referrer_id IN (SELECT id FROM users WHERE line_user_id = auth.uid()::text));

CREATE POLICY "Users can view referrals they received"
  ON referrals FOR SELECT
  USING (referred_user_id IN (SELECT id FROM users WHERE line_user_id = auth.uid()::text));

CREATE POLICY "Admins can manage all referrals"
  ON referrals FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE line_user_id = auth.uid()::text AND is_admin = true));

CREATE POLICY "Allow insert for service role"
  ON referrals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for service role"
  ON referrals FOR UPDATE
  USING (true)
  WITH CHECK (true);
