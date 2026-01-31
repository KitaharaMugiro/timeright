-- Add identity verification column to users table
ALTER TABLE public.users
ADD COLUMN is_identity_verified BOOLEAN NOT NULL DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.users.is_identity_verified IS 'Whether the user has completed identity verification via LINE';
