-- COMPREHENSIVE DUPLICATE MATCH CLEANUP
-- Run this BEFORE the migration to remove ALL types of duplicates

-- Step 1: Delete duplicates based on challenge_id (same challenge, multiple matches)
DELETE FROM matches m1
USING matches m2
WHERE m1.id > m2.id
  AND m1.challenge_id = m2.challenge_id
  AND m1.challenge_id IS NOT NULL;

-- Step 2: Delete duplicates based on pending matches between same players in same ladder
-- This handles cases where multiple challenges created multiple pending matches
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY player1_id, player2_id, ladder_id, status
      ORDER BY created_at ASC  -- Keep the oldest
    ) as rn
  FROM matches
  WHERE status = 'Pending'
)
DELETE FROM matches
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 3: Also check for reversed player order (player1 <-> player2 swap)
-- In case player1 and player2 are swapped in duplicates
WITH duplicates_reversed AS (
  SELECT 
    m1.id as id_to_delete,
    m1.created_at as created1,
    m2.created_at as created2
  FROM matches m1
  INNER JOIN matches m2 
    ON m1.player1_id = m2.player2_id 
    AND m1.player2_id = m2.player1_id
    AND m1.ladder_id = m2.ladder_id
    AND m1.status = 'Pending'
    AND m2.status = 'Pending'
    AND m1.id > m2.id  -- Keep the match with smaller ID (older)
)
DELETE FROM matches
WHERE id IN (SELECT id_to_delete FROM duplicates_reversed);

-- Step 4: Verify no duplicates remain
SELECT 
  player1_id,
  player2_id,
  ladder_id,
  status,
  COUNT(*) as count,
  array_agg(id ORDER BY created_at) as match_ids
FROM matches
WHERE status = 'Pending'
GROUP BY player1_id, player2_id, ladder_id, status
HAVING COUNT(*) > 1;

-- This query should return 0 rows if all duplicates are gone
-- If it still shows duplicates, something is wrong and don't proceed with unique index
