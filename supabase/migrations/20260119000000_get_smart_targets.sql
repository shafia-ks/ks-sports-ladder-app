-- Migration: Update get_smart_targets RPC to return user busy status per ladder
-- This allows the frontend to show "Locked" state for specific ladders where the user is busy

CREATE OR REPLACE FUNCTION public.get_smart_targets(p_user_id UUID)
RETURNS TABLE (
    opponent_id UUID,
    opponent_name TEXT,
    opponent_avatar_url TEXT,
    ladder_id UUID,
    ladder_name TEXT,
    opponent_rank INT,
    rank_diff INT,
    is_user_busy BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH user_memberships AS (
        -- Get all active ladders the user is part of
        SELECT lm.ladder_id, lm.current_rank, l.name as ladder_name
        FROM public.ladder_memberships lm
        JOIN public.ladders l ON l.id = lm.ladder_id
        WHERE lm.user_id = p_user_id 
          AND lm.status = 'active'
    ),
    active_engagements AS (
        -- Get (user_id, ladder_id) pairs for anyone currently busy
        SELECT challenger_id as u_id, ladder_id FROM public.challenges WHERE status IN ('Pending', 'Accepted')
        UNION
        SELECT challenged_id as u_id, ladder_id FROM public.challenges WHERE status IN ('Pending', 'Accepted')
        UNION
        SELECT player1_id as u_id, ladder_id FROM public.matches WHERE status IN ('Submitted', 'ScoreSubmitted', 'Disputed', 'Pending') -- Included Pending matches if they count as busy
        UNION
        SELECT player2_id as u_id, ladder_id FROM public.matches WHERE status IN ('Submitted', 'ScoreSubmitted', 'Disputed', 'Pending')
    )
    SELECT 
        u.id as opponent_id,
        u.full_name as opponent_name,
        u.avatar_url as opponent_avatar_url,
        um.ladder_id,
        um.ladder_name,
        om.current_rank as opponent_rank,
        (um.current_rank - om.current_rank) as rank_diff,
        (EXISTS (
            SELECT 1 FROM active_engagements ae 
            WHERE ae.u_id = p_user_id AND ae.ladder_id = um.ladder_id
        )) as is_user_busy
    FROM user_memberships um
    JOIN public.ladder_memberships om ON om.ladder_id = um.ladder_id
    JOIN public.users u ON u.id = om.user_id
    WHERE om.user_id != p_user_id
      AND om.status = 'active'
      AND om.current_rank < um.current_rank
      AND om.current_rank >= (um.current_rank - 5)
      AND NOT EXISTS ( -- Opponent must NOT be busy
          SELECT 1 FROM active_engagements ae 
          WHERE ae.u_id = om.user_id AND ae.ladder_id = um.ladder_id
      )
    ORDER BY (um.current_rank - om.current_rank) ASC
    LIMIT 20; -- Increased limit to allow multiple ladders to show options
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
