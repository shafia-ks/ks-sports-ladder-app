-- Run this SQL in your Supabase Dashboard SQL Editor to fix the "Function not found" error.

-- 1. Create the Cancel Match Function
CREATE OR REPLACE FUNCTION cancel_match_no_winner(
    p_match_id UUID,
    p_cancelled_by UUID,
    p_challenge_id UUID,
    p_reason TEXT DEFAULT 'Mutual Forfeit'
) RETURNS VOID AS $$
BEGIN
    -- 1. Update Match status
    -- We use 'Cancelled' status.
    UPDATE matches 
    SET status = 'Cancelled',
        disputed_by = p_cancelled_by,
        set_scores = jsonb_build_object('cancel_reason', p_reason)
    WHERE id = p_match_id;

    -- 2. Update Challenge to Cancelled (Releases players)
    IF p_challenge_id IS NOT NULL THEN
        UPDATE challenges
        SET status = 'Cancelled'
        WHERE id = p_challenge_id;
    END IF;
    
    -- No rank processing needed.
END;
$$ LANGUAGE plpgsql;

-- 2. Allow 'Cancelled' status in matches table
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_status_check 
    CHECK (status IN ('Submitted', 'Confirmed', 'Disputed', 'Cancelled'));
