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

  -- 3. Insert History
  INSERT INTO ranking_history (ladder_id, match_id, snapshot, created_at)
  VALUES (p_ladder_id, p_match_id, p_ranking_snapshot, NOW());

  -- 4. Update Ranks (Bulk Update using Set-Based approach)
  UPDATE ladder_memberships AS m
  SET current_rank = (elem->>'currentRank')::int
  FROM jsonb_array_elements(p_ranking_snapshot) AS elem
  WHERE m.user_id = (elem->>'userId')::uuid 
    AND m.ladder_id = p_ladder_id;

END;
$$ LANGUAGE plpgsql;
