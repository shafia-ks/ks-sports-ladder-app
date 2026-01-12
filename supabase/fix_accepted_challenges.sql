-- Fix challenges that are stuck in 'Accepted' even though a match is 'Confirmed'
-- This happens because of the previous bug where match submission didn't update challenge status.

UPDATE challenges c
SET status = 'Completed', completed_at = NOW()
WHERE c.status = 'Accepted'
AND EXISTS (
  SELECT 1 FROM matches m
  WHERE m.challenge_id = c.id
  AND m.status = 'Confirmed'
);

-- Optional: You can verify how many were fixed by checking row count returned (in Supabase UI)
