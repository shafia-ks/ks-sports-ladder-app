-- ==========================================
-- FORCE CLEAR MATCHES SCRIPT (GLOBAL)
-- ==========================================
-- Run this script in the Supabase SQL Editor to delete
-- ALL active matches and challenges for ALL users.
-- This effectively resets the schedule for the entire application.

DO $$
DECLARE
    target_matches UUID[];
BEGIN
    -- Get IDs of matches to delete (Status = 'Confirmed')
    SELECT array_agg(id) INTO target_matches
    FROM matches
    WHERE status = 'Confirmed';

    -- 1. Delete associated Ranking History first (Foreign Key constraint)
    -- This fixes the 23503 violation error
    IF target_matches IS NOT NULL THEN
        DELETE FROM ranking_history
        WHERE match_id = ANY(target_matches);
    END IF;

    -- 2. Delete ALL Confirmed Matches (Scheduled but not played)
    DELETE FROM matches
    WHERE status = 'Confirmed';

    -- 3. Delete ALL Pending/Accepted Challenges
    DELETE FROM challenges
    WHERE status IN ('Pending', 'Accepted');

    RAISE NOTICE 'Cleared ALL scheduled matches, associated ranking history, and active challenges for all users.';
END $$;
