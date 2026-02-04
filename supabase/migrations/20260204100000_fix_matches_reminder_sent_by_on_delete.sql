-- Fix matches_reminder_sent_by_fkey to use ON DELETE SET NULL
-- This allows users to be deleted even if they have sent match reminders

-- Drop the existing foreign key constraint
ALTER TABLE matches
DROP CONSTRAINT IF EXISTS matches_reminder_sent_by_fkey;

-- Re-add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE matches
ADD CONSTRAINT matches_reminder_sent_by_fkey
FOREIGN KEY (reminder_sent_by)
REFERENCES users(id)
ON DELETE SET NULL;
