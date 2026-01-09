-- Function to cancel other pending challenges when one is accepted
-- This ensures a player can only have one active challenge at a time

CREATE OR REPLACE FUNCTION cancel_other_pending_challenges(p_accepted_challenge_id UUID)
RETURNS void AS $$
BEGIN
  -- Get the challenger and challenged players from the accepted challenge
  WITH accepted_challenge AS (
    SELECT challenger_id, challenged_id
    FROM challenges
    WHERE id = p_accepted_challenge_id
  )
  -- Cancel all other pending challenges involving these players
  UPDATE challenges
  SET 
    status = 'Cancelled',
    cancelled_at = NOW(),
    cancellation_reason = 'Another challenge was accepted'
  WHERE 
    status = 'Pending'
    AND id != p_accepted_challenge_id
    AND (
      challenger_id IN (SELECT challenger_id FROM accepted_challenge) OR
      challenger_id IN (SELECT challenged_id FROM accepted_challenge) OR
      challenged_id IN (SELECT challenger_id FROM accepted_challenge) OR
      challenged_id IN (SELECT challenged_id FROM accepted_challenge)
    );
END;
$$ LANGUAGE plpgsql;
