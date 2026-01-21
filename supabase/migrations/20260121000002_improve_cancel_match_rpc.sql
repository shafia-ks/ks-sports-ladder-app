-- Improved cancel_match_no_winner RPC to handle challenge updates more robustly
-- This ensures challenges are always updated even if challenge_id is not explicitly provided

CREATE OR REPLACE FUNCTION cancel_match_no_winner(
    p_match_id UUID,
    p_cancelled_by UUID,
    p_challenge_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT 'Mutual Forfeit'
) RETURNS VOID AS $$
BEGIN
    -- 1. Update Match status to Cancelled
    UPDATE matches 
    SET status = 'Cancelled',
        disputed_by = p_cancelled_by,
        set_scores = jsonb_build_object('cancel_reason', p_reason)
    WHERE id = p_match_id;

    -- 2. Update Challenge to Cancelled
    -- Try using provided challenge_id first, then look it up from the match
    IF p_challenge_id IS NOT NULL THEN
        UPDATE challenges
        SET status = 'Cancelled'
        WHERE id = p_challenge_id;
    ELSE
        -- Look up challenge_id from the match and update it
        UPDATE challenges
        SET status = 'Cancelled'
        WHERE id = (SELECT challenge_id FROM matches WHERE id = p_match_id)
          AND status != 'Cancelled'; -- Only update if not already cancelled
    END IF;
    
    -- No rank processing for cancelled matches
END;
$$ LANGUAGE plpgsql;
