-- Create verification status enum
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Create identity verification requests table
CREATE TABLE identity_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  line_user_id text NOT NULL,
  line_message_id text NOT NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE identity_verification_requests ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage verification requests
CREATE POLICY "Admins can manage verification requests"
  ON identity_verification_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = (SELECT (current_setting('request.jwt.claims', true)::json->>'sub')::uuid) AND is_admin = true)
  );

-- Service role can manage all
CREATE POLICY "Service role can manage verification requests"
  ON identity_verification_requests FOR ALL
  USING (auth.role() = 'service_role');

-- Create indexes for efficient querying
CREATE INDEX idx_verification_requests_status ON identity_verification_requests(status);
CREATE INDEX idx_verification_requests_user_id ON identity_verification_requests(user_id);
CREATE INDEX idx_verification_requests_line_user_id ON identity_verification_requests(line_user_id);
CREATE INDEX idx_verification_requests_created_at ON identity_verification_requests(created_at DESC);
