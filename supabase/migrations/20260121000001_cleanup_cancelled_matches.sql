-- Cleanup: Update challenges to 'Cancelled' status for any matches that are already cancelled
-- This fixes the issue where players remain locked after voiding matches

-- Find all cancelled matches and update their associated challenges
UPDATE challenges
SET status = 'Cancelled'
WHERE id IN (
    SELECT c.id
    FROM challenges c
    INNER JOIN matches m ON m.challenge_id = c.id
    WHERE m.status = 'Cancelled'
      AND c.status != 'Cancelled'
);

-- Log the cleanup
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % challenges to Cancelled status for voided matches', updated_count;
END $$;
