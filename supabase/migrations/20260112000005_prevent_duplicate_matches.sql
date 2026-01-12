-- Prevent duplicate match creation
-- Adds a unique constraint to ensure only ONE match per challenge

-- Step 1: Delete any existing duplicates first
-- Keep only the oldest match for each challenge_id
DELETE FROM matches m1
USING matches m2
WHERE m1.id > m2.id
  AND m1.challenge_id = m2.challenge_id
  AND m1.challenge_id IS NOT NULL;

-- Step 2: Add unique  constraint on challenge_id
-- This prevents the race condition where two API calls create duplicate matches
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_match_per_challenge
ON matches (challenge_id)
WHERE challenge_id IS NOT NULL;

-- Step 3: Also prevent duplicate pending matches between same players
-- This catches cases where challenges are created separately but matches are duplicated
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_match_per_players
ON matches (player1_id, player2_id, ladder_id)
WHERE status = 'Pending';

-- Verify no duplicates remain
SELECT 
  challenge_id,
  player1_id,
  player2_id,
  COUNT(*) as match_count
FROM matches
WHERE challenge_id IS NOT NULL
GROUP BY challenge_id, player1_id, player2_id
HAVING COUNT(*) > 1;

-- This should return 0 rows if all duplicates are gone
