-- =====================================================
-- Phase 1: Database Hardening for Event-Driven System
-- =====================================================

-- 1. Add new columns to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS dispute_reason TEXT;

-- 2. Add cooling period column to ladder_memberships
ALTER TABLE ladder_memberships
ADD COLUMN IF NOT EXISTS cooling_expires_at TIMESTAMPTZ;

-- 3. Update match status constraint to include new states
ALTER TABLE matches
DROP CONSTRAINT IF EXISTS matches_status_check;

ALTER TABLE matches
ADD CONSTRAINT matches_status_check 
CHECK (status IN ('Pending', 'ScoreSubmitted', 'Confirmed', 'Disputed', 'Cancelled'));

-- 4. Create function to check player availability
CREATE OR REPLACE FUNCTION check_player_availability(
    p_user_id UUID,
    p_ladder_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_active_challenge BOOLEAN;
    v_has_active_match BOOLEAN;
    v_is_cooling BOOLEAN;
BEGIN
    -- Check for active challenges
    SELECT EXISTS(
        SELECT 1 FROM challenges
        WHERE ladder_id = p_ladder_id
        AND (challenger_id = p_user_id OR challenged_id = p_user_id)
        AND status IN ('Pending', 'Accepted')
    ) INTO v_has_active_challenge;

    -- Check for active matches
    SELECT EXISTS(
        SELECT 1 FROM matches
        WHERE ladder_id = p_ladder_id
        AND (player1_id = p_user_id OR player2_id = p_user_id)
        AND status IN ('Pending', 'ScoreSubmitted')
    ) INTO v_has_active_match;

    -- Check cooling period
    SELECT EXISTS(
        SELECT 1 FROM ladder_memberships
        WHERE ladder_id = p_ladder_id
        AND user_id = p_user_id
        AND cooling_expires_at IS NOT NULL
        AND cooling_expires_at > NOW()
    ) INTO v_is_cooling;

    -- Player is available if none of the above are true
    RETURN NOT (v_has_active_challenge OR v_has_active_match OR v_is_cooling);
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger function to prevent challenges when busy
CREATE OR REPLACE FUNCTION prevent_challenge_if_busy()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if challenger is available
    IF NOT check_player_availability(NEW.challenger_id, NEW.ladder_id) THEN
        RAISE EXCEPTION 'Challenger is currently busy or in cooling period';
    END IF;

    -- Check if challenged player is available
    IF NOT check_player_availability(NEW.challenged_id, NEW.ladder_id) THEN
        RAISE EXCEPTION 'Challenged player is currently busy or in cooling period';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger on challenges table
DROP TRIGGER IF EXISTS check_availability_before_challenge ON challenges;
CREATE TRIGGER check_availability_before_challenge
    BEFORE INSERT ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION prevent_challenge_if_busy();

-- 7. Create function to enforce match state transitions
CREATE OR REPLACE FUNCTION enforce_match_transitions()
RETURNS TRIGGER AS $$
BEGIN
    -- Only enforce on status updates
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Pending -> ScoreSubmitted (valid)
        IF OLD.status = 'Pending' AND NEW.status = 'ScoreSubmitted' THEN
            -- Require submitted_by to be set
            IF NEW.submitted_by IS NULL THEN
                RAISE EXCEPTION 'submitted_by must be set when submitting score';
            END IF;
            RETURN NEW;
        END IF;

        -- ScoreSubmitted -> Confirmed (valid, but must be different user)
        IF OLD.status = 'ScoreSubmitted' AND NEW.status = 'Confirmed' THEN
            -- Prevent self-confirmation
            IF NEW.confirmed_by = OLD.submitted_by THEN
                RAISE EXCEPTION 'Player cannot confirm their own submitted score';
            END IF;
            RETURN NEW;
        END IF;

        -- ScoreSubmitted -> Disputed (valid)
        IF OLD.status = 'ScoreSubmitted' AND NEW.status = 'Disputed' THEN
            RETURN NEW;
        END IF;

        -- Disputed -> Confirmed (valid, organizer/admin override)
        IF OLD.status = 'Disputed' AND NEW.status = 'Confirmed' THEN
            RETURN NEW;
        END IF;

        -- Any -> Cancelled (always valid)
        IF NEW.status = 'Cancelled' THEN
            RETURN NEW;
        END IF;

        -- Invalid transition
        RAISE EXCEPTION 'Invalid match status transition from % to %', OLD.status, NEW.status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger on matches table
DROP TRIGGER IF EXISTS enforce_match_state_transitions ON matches;
CREATE TRIGGER enforce_match_state_transitions
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION enforce_match_transitions();

-- 9. Create function to auto-create match when challenge is accepted
CREATE OR REPLACE FUNCTION auto_create_match_on_accept()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when status changes to Accepted
    IF OLD.status != 'Accepted' AND NEW.status = 'Accepted' THEN
        INSERT INTO matches (
            ladder_id,
            player1_id,
            player2_id,
            status,
            created_at
        ) VALUES (
            NEW.ladder_id,
            NEW.challenger_id,
            NEW.challenged_id,
            'Pending',
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for auto match creation
DROP TRIGGER IF EXISTS create_match_on_challenge_accept ON challenges;
CREATE TRIGGER create_match_on_challenge_accept
    AFTER UPDATE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_match_on_accept();

-- 11. Create function to apply cooling period and update rankings
CREATE OR REPLACE FUNCTION apply_cooling_on_confirm()
RETURNS TRIGGER AS $$
DECLARE
    v_cooldown_hours INTEGER;
BEGIN
    -- Only trigger when status changes to Confirmed
    IF OLD.status != 'Confirmed' AND NEW.status = 'Confirmed' THEN
        -- Get cooldown hours from ladder settings
        SELECT COALESCE((challenge_rules->>'cooldown_hours')::INTEGER, 0)
        INTO v_cooldown_hours
        FROM ladders
        WHERE id = NEW.ladder_id;

        -- Apply cooling period to both players
        IF v_cooldown_hours > 0 THEN
            UPDATE ladder_memberships
            SET cooling_expires_at = NOW() + (v_cooldown_hours || ' hours')::INTERVAL
            WHERE ladder_id = NEW.ladder_id
            AND user_id IN (NEW.player1_id, NEW.player2_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger for cooling period application
DROP TRIGGER IF EXISTS apply_cooling_period_on_confirm ON matches;
CREATE TRIGGER apply_cooling_period_on_confirm
    AFTER UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION apply_cooling_on_confirm();

-- 13. Add comments for documentation
COMMENT ON COLUMN matches.submitted_by IS 'User who submitted the match score';
COMMENT ON COLUMN matches.dispute_reason IS 'Reason provided when match is disputed';
COMMENT ON COLUMN ladder_memberships.cooling_expires_at IS 'Timestamp when cooling period expires; player is busy if > NOW()';
COMMENT ON FUNCTION check_player_availability IS 'Returns true if player is available to challenge or be challenged';
COMMENT ON FUNCTION prevent_challenge_if_busy IS 'Trigger function to block challenge creation if either player is busy';
COMMENT ON FUNCTION enforce_match_transitions IS 'Trigger function to enforce valid match status transitions';
COMMENT ON FUNCTION auto_create_match_on_accept IS 'Trigger function to automatically create match when challenge is accepted';
COMMENT ON FUNCTION apply_cooling_on_confirm IS 'Trigger function to apply cooling period when match is confirmed';
