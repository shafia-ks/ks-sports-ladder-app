-- Fix Dashboard and Ladder Data Issues
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Cancel Expired Challenges
-- ============================================
UPDATE challenges
SET status = 'Cancelled'
WHERE status = 'Pending'
AND expires_at < NOW();

-- ============================================
-- 2. Clear All Cooling Periods
-- ============================================
UPDATE ladder_memberships
SET cooling_expires_at = NULL
WHERE cooling_expires_at IS NOT NULL;

-- ============================================
-- 3. Verify Player Status (Check Query)
-- ============================================
SELECT 
  lm.user_id,
  u.full_name,
  lm.ladder_id,
  l.name as ladder_name,
  lm.cooling_expires_at,
  COUNT(DISTINCT CASE WHEN c.status = 'Pending' THEN c.id END) as active_challenges,
  COUNT(DISTINCT CASE WHEN m.status IN ('Pending', 'ScoreSubmitted') THEN m.id END) as active_matches
FROM ladder_memberships lm
JOIN users u ON u.id = lm.user_id
JOIN ladders l ON l.id = lm.ladder_id
LEFT JOIN challenges c ON (c.challenger_id = lm.user_id OR c.challenged_id = lm.user_id)
  AND c.ladder_id = lm.ladder_id
LEFT JOIN matches m ON (m.player1_id = lm.user_id OR m.player2_id = lm.user_id)
  AND m.ladder_id = lm.ladder_id
WHERE lm.status = 'active'
GROUP BY lm.user_id, u.full_name, lm.ladder_id, l.name, lm.cooling_expires_at
ORDER BY u.full_name, l.name;

-- ============================================
-- 4. Check All Challenges Status
-- ============================================
SELECT 
  c.id,
  c.status,
  c.expires_at,
  c.created_at,
  l.name as ladder_name,
  challenger.full_name as challenger_name,
  challenged.full_name as challenged_name,
  CASE 
    WHEN c.expires_at < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END as should_be
FROM challenges c
JOIN ladders l ON l.id = c.ladder_id
JOIN users challenger ON challenger.id = c.challenger_id
JOIN users challenged ON challenged.id = c.challenged_id
WHERE c.status = 'Pending'
ORDER BY c.created_at DESC;

-- ============================================
-- 5. Check All Matches Status
-- ============================================
SELECT 
  m.id,
  m.status,
  m.created_at,
  m.played_at,
  l.name as ladder_name,
  p1.full_name as player1_name,
  p2.full_name as player2_name,
  m.submitted_by,
  m.confirmed_by
FROM matches m
JOIN ladders l ON l.id = m.ladder_id
JOIN users p1 ON p1.id = m.player1_id
JOIN users p2 ON p2.id = m.player2_id
WHERE m.status IN ('Pending', 'ScoreSubmitted')
ORDER BY m.created_at DESC;

-- ============================================
-- RESULTS SUMMARY
-- ============================================
-- After running this script:
-- 1. All expired challenges will be cancelled
-- 2. All cooling periods will be cleared
-- 3. Players should show as "Available" instead of "Busy"
-- 4. You can review the check queries to verify data integrity
