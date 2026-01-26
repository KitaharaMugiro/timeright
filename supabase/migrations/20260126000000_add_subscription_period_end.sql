-- Add subscription_period_end column to users table
ALTER TABLE users
ADD COLUMN subscription_period_end TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN users.subscription_period_end IS 'End date of the current subscription period. Users can access services until this date even after cancellation.';
