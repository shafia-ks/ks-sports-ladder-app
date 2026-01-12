-- Prevent duplicate match creation
-- IMPORTANT: Run CLEANUP_duplicate_matches.sql FIRST, then run this migration

-- Step 1: Add unique constraint on challenge_id (one match per challenge)
-- This is the primary fix for the race condition bug
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_match_per_challenge
ON matches (challenge_id)
WHERE challenge_id IS NOT NULL;

-- Step 2: Add unique constraint on pending matches between same players
-- This prevents duplicate pending matches even if challenges are separate
-- NOTE: If this fails with error 23505, run CLEANUP_duplicate_matches.sql first
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_match_per_players
ON matches (player1_id, player2_id, ladder_id)
WHERE status = 'Pending';

-- Step 3: Verify constraints are in place
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'matches'
  AND indexname IN ('idx_unique_match_per_challenge', 'idx_unique_pending_match_per_players');

-- Should show 2 rows with the unique indexes
