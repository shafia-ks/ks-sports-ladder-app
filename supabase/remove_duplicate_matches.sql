-- 1. Identify and delete duplicate matches based on challenge_id
-- Keeps the earliest created match (ORDER BY created_at ASC)
-- Deletes any subsequent matches for the same challenge_id

WITH duplicates AS (
  SELECT 
    id,
    challenge_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY challenge_id
      ORDER BY created_at ASC
    ) as rn
  FROM matches
  WHERE challenge_id IS NOT NULL
)
DELETE FROM matches
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 2. Optional: Verify duplications are gone
-- SELECT id, challenge_id, created_at FROM matches;

-- 3. (Recommended) Add Unique Constraint to prevent this forever
-- Uncomment the following line to enforce uniqueness at the database level:
-- ALTER TABLE matches ADD CONSTRAINT matches_challenge_id_key UNIQUE (challenge_id);
