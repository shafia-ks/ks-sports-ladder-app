-- Fix challenges status check constraint
-- This allows the new status values we're using

ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_status_check;

ALTER TABLE challenges
  ADD CONSTRAINT challenges_status_check 
  CHECK (status IN ('Pending', 'Accepted', 'Declined', 'Cancelled', 'Expired', 'Completed'));
