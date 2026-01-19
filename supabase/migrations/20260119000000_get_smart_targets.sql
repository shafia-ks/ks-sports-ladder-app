-- Migration: Create get_smart_targets RPC for Quick Challenge Feature
-- This function finds active ladder members who are valid targets for the user
-- It filters out users who are busy (in pending challenges or submitted matches)

CREATE OR REPLACE FUNCTION public.get_smart_targets(p_user_id UUID)
RETURNS TABLE (
    opponent_id UUID,
    opponent_name TEXT,
    opponent_avatar_url TEXT,
    ladder_id UUID,
    ladder_name TEXT,
    opponent_rank INT,
    rank_diff INT
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
    busy_users AS (
        -- Users involved in active/pending challenges
        SELECT challenger_id as u_id FROM public.challenges WHERE status IN ('Pending', 'Accepted')
        UNION
        SELECT challenged_id as u_id FROM public.challenges WHERE status IN ('Pending', 'Accepted')
        UNION
        -- Users involved in matches that aren't finished/confirmed
        SELECT player1_id as u_id FROM public.matches WHERE status IN ('Submitted', 'ScoreSubmitted', 'Disputed')
        UNION
        SELECT player2_id as u_id FROM public.matches WHERE status IN ('Submitted', 'ScoreSubmitted', 'Disputed')
    )
    SELECT 
        u.id as opponent_id,
        u.full_name as opponent_name,
        u.avatar_url as opponent_avatar_url,
        um.ladder_id,
        um.ladder_name,
        om.current_rank as opponent_rank,
        (um.current_rank - om.current_rank) as rank_diff
    FROM user_memberships um
    JOIN public.ladder_memberships om ON om.ladder_id = um.ladder_id
    JOIN public.users u ON u.id = om.user_id
    WHERE om.user_id != p_user_id
      AND om.status = 'active'
      AND om.current_rank < um.current_rank -- Only people ranked higher
      AND om.current_rank >= (um.current_rank - 5) -- Within reasonable range (e.g. 5 spots)
      AND om.user_id NOT IN (SELECT u_id FROM busy_users) -- Opponent is free
      AND p_user_id NOT IN (SELECT u_id FROM busy_users) -- User is free to challenge
    ORDER BY (um.current_rank - om.current_rank) ASC -- Sort by closest rank first
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
