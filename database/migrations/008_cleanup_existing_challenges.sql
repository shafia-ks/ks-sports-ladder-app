-- Clean up existing challenges
-- This script cancels all pending and accepted challenges
-- Run this AFTER applying migration 007

-- 1. Cancel all Pending challenges (not yet accepted)
UPDATE challenges
SET 
  status = 'Cancelled',
  cancelled_at = NOW(),
  cancelled_by = challenger_id
WHERE status = 'Pending';

-- 2. Cancel all Accepted challenges (accepted but no match result yet)
UPDATE challenges
SET 
  status = 'Cancelled',
  cancelled_at = NOW(),
  cancelled_by = challenger_id
WHERE status = 'Accepted';

-- 3. Show summary of what was cancelled
SELECT 
  'Challenges Cancelled' AS action,
  COUNT(*) AS count
FROM challenges
WHERE status = 'Cancelled'
  AND cancelled_at >= NOW() - INTERVAL '1 minute';

-- 4. Verify no active challenges remain
SELECT 
  status,
  COUNT(*) AS count
FROM challenges
GROUP BY status
ORDER BY status;

-- Expected result: Only 'Cancelled', 'Declined', 'Expired', or 'Completed' challenges should remain
-- No 'Pending' or 'Accepted' challenges should exist
