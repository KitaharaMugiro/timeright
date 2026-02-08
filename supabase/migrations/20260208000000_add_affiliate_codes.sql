-- Affiliate codes table
CREATE TABLE affiliate_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(8) UNIQUE NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Affiliate code uses tracking table
CREATE TABLE affiliate_code_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code_id uuid NOT NULL REFERENCES affiliate_codes(id),
  user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(affiliate_code_id, user_id)
);

-- RLS: Service role only (matching existing pattern)
ALTER TABLE affiliate_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_code_uses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON affiliate_codes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role only" ON affiliate_code_uses FOR ALL USING (auth.role() = 'service_role');
