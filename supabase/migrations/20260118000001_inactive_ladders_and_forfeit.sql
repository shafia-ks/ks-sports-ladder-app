-- 1. Update RLS on Ladders to hide inactive ones from public
DROP POLICY IF EXISTS "Ladders are viewable by everyone" ON public.ladders;

CREATE POLICY "Ladders are viewable by public if active" ON public.ladders
FOR SELECT USING (
    status = 'active'
    OR (auth.uid() IS NOT NULL AND (
        -- Creator can see their own ladders
        created_by = auth.uid()
        -- Specific organizers can see their ladders
        OR EXISTS (
            SELECT 1 FROM ladder_leaders 
            WHERE ladder_id = ladders.id AND user_id = auth.uid()
        )
        -- Global Admins and Organizers can see all
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'organizer')
        )
    ))
);

-- 2. Function to Cancel Match (Mutual Forfeit / No Winner)
-- This unlocks the players (Challenge -> Cancelled) and marks match as Cancelled.
-- No rank changes occur.
CREATE OR REPLACE FUNCTION cancel_match_no_winner(
    p_match_id UUID,
    p_cancelled_by UUID,
    p_challenge_id UUID,
    p_reason TEXT DEFAULT 'Mutual Forfeit'
) RETURNS VOID AS $$
BEGIN
    -- 1. Update Match status
    UPDATE matches 
    SET status = 'Cancelled', -- Ensure 'Cancelled' is a valid status in constraints!
        disputed_by = p_cancelled_by, -- Using disputed_by to track who cancelled? Or need new column? 
        -- Actually, matches status check is ('Submitted','Confirmed','Disputed').
        -- We might need to add 'Cancelled' to the check constraint if not present.
        set_scores = jsonb_build_object('cancel_reason', p_reason)
    WHERE id = p_match_id;

    -- 2. Update Challenge to Cancelled (Releases players)
    IF p_challenge_id IS NOT NULL THEN
        UPDATE challenges
        SET status = 'Cancelled'
        WHERE id = p_challenge_id;
    END IF;
    
    -- No rank processing.
END;
$$ LANGUAGE plpgsql;

-- CRITICAL: We need to enable 'Cancelled' status on matches table if not exists.
-- Check constraint: status in ('Submitted','Confirmed','Disputed')
-- We need to update this constraint.
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_status_check 
    CHECK (status IN ('Submitted', 'Confirmed', 'Disputed', 'Cancelled'));

-- Also ensure 'Completed' is set on challenges? 
-- Challenges status: ('Pending','Accepted','Declined','Completed','Expired','Cancelled') - This is already fine.
