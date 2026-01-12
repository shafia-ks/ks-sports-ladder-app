-- Fix "In Challenge" status persisting after match completion
-- Marks challenges as Completed when their associated matches are Confirmed

-- Step 1: Find challenges that should be Completed but aren't
SELECT 
  c.id as challenge_id,
  c.status as current_challenge_status,
  m.id as match_id,
  m.status as match_status,
  c.challenger_id,
  c.challenged_id
FROM challenges c
INNER JOIN matches m ON c.id = m.challenge_id
WHERE m.status = 'Confirmed'
  AND c.status != 'Completed';

-- Step 2: Mark those challenges as Completed
UPDATE challenges
SET 
  status = 'Completed',
  completed_at = NOW()
WHERE id IN (
  SELECT c.id
  FROM challenges c
  INNER JOIN matches m ON c.id = m.challenge_id
  WHERE m.status = 'Confirmed'
    AND c.status != 'Completed'
);

-- Step 3: Verify all confirmed matches have completed challenges
SELECT 
  COUNT(*) as confirmed_matches_count,
  (SELECT COUNT(*) 
   FROM challenges c
   INNER JOIN matches m ON c.id = m.challenge_id
   WHERE m.status = 'Confirmed' AND c.status = 'Completed'
  ) as completed_challenges_count
FROM matches
WHERE status = 'Confirmed';

-- Both counts should match
