-- Migration 008: Simplify challenges and add match auto-creation
-- Remove location and time from challenges, add match linking, implement busy player logic

-- 1. Add match_id to challenges table to link challenge to auto-created match
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES matches(id) ON DELETE SET NULL;

-- 2. Add challenge_id to matches table for reverse linking
ALTER TABLE matches ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL;

-- 3. Add sets column to matches for detailed score tracking (JSONB array)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS sets JSONB DEFAULT '[]'::jsonb;

-- 4. Add confirmed_by column to track who confirmed the match result
ALTER TABLE matches ADD COLUMN IF NOT EXISTS confirmed_by TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 5. Add is_busy flag to ladder_memberships for quick availability check
ALTER TABLE ladder_memberships ADD COLUMN IF NOT EXISTS is_busy BOOLEAN DEFAULT FALSE;

-- 6. Create index on is_busy for faster queries
CREATE INDEX IF NOT EXISTS idx_ladder_memberships_is_busy ON ladder_memberships(is_busy) WHERE is_busy = TRUE;

-- 7. Create index on match_id in challenges
CREATE INDEX IF NOT EXISTS idx_challenges_match_id ON challenges(match_id) WHERE match_id IS NOT NULL;

-- 8. Create index on challenge_id in matches
CREATE INDEX IF NOT EXISTS idx_matches_challenge_id ON matches(challenge_id) WHERE challenge_id IS NOT NULL;

-- 9. Create function to check if a player is busy (has active challenge or match)
CREATE OR REPLACE FUNCTION is_player_busy(p_user_id UUID, p_ladder_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if player has any pending or accepted challenges
  IF EXISTS (
    SELECT 1 FROM challenges
    WHERE ladder_id = p_ladder_id
    AND (challenger_id = p_user_id OR challenged_id = p_user_id)
    AND status IN ('pending', 'accepted')
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if player has any in-progress matches
  IF EXISTS (
    SELECT 1 FROM matches m
    JOIN challenges c ON c.match_id = m.id
    WHERE c.ladder_id = p_ladder_id
    AND (m.player1_id = p_user_id OR m.player2_id = p_user_id)
    AND m.status = 'in_progress'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to update is_busy flag for a player in a ladder
CREATE OR REPLACE FUNCTION update_player_busy_status(p_user_id UUID, p_ladder_id UUID)
RETURNS VOID AS $$
DECLARE
  v_is_busy BOOLEAN;
BEGIN
  -- Check if player is busy
  v_is_busy := is_player_busy(p_user_id, p_ladder_id);
  
  -- Update ladder_memberships
  UPDATE ladder_memberships
  SET is_busy = v_is_busy
  WHERE ladder_id = p_ladder_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger function to auto-update busy status when challenges change
CREATE OR REPLACE FUNCTION trigger_update_busy_status_on_challenge()
RETURNS TRIGGER AS $$
BEGIN
  -- Update both challenger and challenged player status
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_player_busy_status(NEW.challenger_id, NEW.ladder_id);
    PERFORM update_player_busy_status(NEW.challenged_id, NEW.ladder_id);
  END IF;
  
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    PERFORM update_player_busy_status(OLD.challenger_id, OLD.ladder_id);
    PERFORM update_player_busy_status(OLD.challenged_id, OLD.ladder_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger to auto-update busy status
DROP TRIGGER IF EXISTS trg_update_busy_status_on_challenge ON challenges;
CREATE TRIGGER trg_update_busy_status_on_challenge
AFTER INSERT OR UPDATE OR DELETE ON challenges
FOR EACH ROW
EXECUTE FUNCTION trigger_update_busy_status_on_challenge();

-- 13. Create function to cancel all pending challenges for both players when one is accepted
CREATE OR REPLACE FUNCTION cancel_other_pending_challenges(p_accepted_challenge_id UUID)
RETURNS VOID AS $$
DECLARE
  v_challenger_id UUID;
  v_challenged_id UUID;
  v_ladder_id UUID;
BEGIN
  -- Get the accepted challenge details
  SELECT challenger_id, challenged_id, ladder_id
  INTO v_challenger_id, v_challenged_id, v_ladder_id
  FROM challenges
  WHERE id = p_accepted_challenge_id;
  
  -- Cancel all other pending challenges for the challenger
  UPDATE challenges
  SET status = 'cancelled', cancelled_at = NOW()
  WHERE id != p_accepted_challenge_id
  AND (challenger_id = v_challenger_id OR challenged_id = v_challenger_id)
  AND status = 'pending'
  AND ladder_id = v_ladder_id;
  
  -- Cancel all other pending challenges for the challenged player
  UPDATE challenges
  SET status = 'cancelled', cancelled_at = NOW()
  WHERE id != p_accepted_challenge_id
  AND (challenger_id = v_challenged_id OR challenged_id = v_challenged_id)
  AND status = 'pending'
  AND ladder_id = v_ladder_id;
END;
$$ LANGUAGE plpgsql;

-- 14. Update existing challenges to mark location/time as optional (keep columns for backward compatibility)
-- But they won't be required in the new flow

-- 15. Initialize is_busy flag for all existing members based on current challenges
UPDATE ladder_memberships lm
SET is_busy = (
  SELECT is_player_busy(lm.user_id, lm.ladder_id)
);

COMMENT ON COLUMN challenges.match_id IS 'Auto-created match when challenge is accepted';
COMMENT ON COLUMN matches.challenge_id IS 'Original challenge that created this match';
COMMENT ON COLUMN matches.sets IS 'Array of set scores: [{set: 1, player1_score: 21, player2_score: 19}, ...]';
COMMENT ON COLUMN matches.confirmed_by IS 'Array of user IDs who confirmed the match result';
COMMENT ON COLUMN ladder_memberships.is_busy IS 'TRUE if player has active challenge or match';
COMMENT ON FUNCTION is_player_busy IS 'Check if a player has any active challenges or matches';
COMMENT ON FUNCTION cancel_other_pending_challenges IS 'Cancel all pending challenges for both players when one is accepted';
