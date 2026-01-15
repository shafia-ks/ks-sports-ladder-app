-- Add columns for rank history tracking
ALTER TABLE ladder_memberships
ADD COLUMN IF NOT EXISTS previous_rank INTEGER,
ADD COLUMN IF NOT EXISTS last_rank_change_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN ladder_memberships.previous_rank IS 'The user''s rank before the last match update';
COMMENT ON COLUMN ladder_memberships.last_rank_change_at IS 'Timestamp of the last rank change';

-- Update the confirm_match_and_update_ranks function to track history
CREATE OR REPLACE FUNCTION confirm_match_and_update_ranks(
  p_match_id UUID,
  p_confirmed_by UUID,
  p_ladder_id UUID,
  p_challenge_id UUID,
  p_ranking_snapshot JSONB
) RETURNS VOID AS $$
BEGIN
  -- 1. Update Match
  UPDATE matches 
  SET status = 'Confirmed', 
      confirmed_by = p_confirmed_by
  WHERE id = p_match_id;

  -- 2. Update Challenge (if exists)
  IF p_challenge_id IS NOT NULL THEN
    UPDATE challenges
    SET status = 'Completed',
    completed_at = NOW()
    WHERE id = p_challenge_id;
  END IF;

  -- 3. Insert History Log
  INSERT INTO ranking_history (ladder_id, match_id, snapshot, created_at)
  VALUES (p_ladder_id, p_match_id, p_ranking_snapshot, NOW());

  -- 4. Update Ranks with History Tracking
  -- We save the old 'current_rank' into 'previous_rank' before overwriting it.
  -- We only update 'last_rank_change_at' if the rank actually changes.
  UPDATE ladder_memberships AS m
  SET 
    previous_rank = m.current_rank,
    last_rank_change_at = CASE 
        WHEN m.current_rank IS DISTINCT FROM (elem->>'currentRank')::int THEN NOW() 
        ELSE m.last_rank_change_at 
    END,
    current_rank = (elem->>'currentRank')::int
  FROM jsonb_array_elements(p_ranking_snapshot) AS elem
  WHERE m.user_id = (elem->>'userId')::uuid 
    AND m.ladder_id = p_ladder_id;

END;
$$ LANGUAGE plpgsql;
