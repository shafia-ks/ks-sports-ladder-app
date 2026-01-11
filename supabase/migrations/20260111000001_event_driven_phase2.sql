-- =====================================================
-- Phase 2: Realtime Event System Setup
-- =====================================================

-- 1. Enable Realtime for key tables (if not already enabled)
-- Note: This is typically done via Supabase Dashboard, but we document it here

-- ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
-- ALTER PUBLICATION supabase_realtime ADD TABLE matches;
-- ALTER PUBLICATION supabase_realtime ADD TABLE ladder_memberships;

-- 2. Create view for player availability status (optimized for realtime)
CREATE OR REPLACE VIEW player_availability AS
SELECT 
    lm.ladder_id,
    lm.user_id,
    lm.status as membership_status,
    lm.current_rank,
    lm.cooling_expires_at,
    CASE 
        WHEN lm.cooling_expires_at IS NOT NULL AND lm.cooling_expires_at > NOW() THEN 'cooling'
        WHEN EXISTS(
            SELECT 1 FROM challenges c
            WHERE c.ladder_id = lm.ladder_id
            AND (c.challenger_id = lm.user_id OR c.challenged_id = lm.user_id)
            AND c.status IN ('Pending', 'Accepted')
        ) THEN 'in_challenge'
        WHEN EXISTS(
            SELECT 1 FROM matches m
            WHERE m.ladder_id = lm.ladder_id
            AND (m.player1_id = lm.user_id OR m.player2_id = lm.user_id)
            AND m.status IN ('Pending', 'ScoreSubmitted')
        ) THEN 'in_match'
        ELSE 'available'
    END as availability_status,
    check_player_availability(lm.user_id, lm.ladder_id) as is_available
FROM ladder_memberships lm
WHERE lm.status = 'active';

COMMENT ON VIEW player_availability IS 'Real-time view of player availability status for UI subscriptions';

-- 3. Create function to get busy players for a ladder (for API use)
CREATE OR REPLACE FUNCTION get_busy_players(p_ladder_id UUID)
RETURNS TABLE(user_id UUID, reason TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT pa.user_id, pa.availability_status::TEXT
    FROM player_availability pa
    WHERE pa.ladder_id = p_ladder_id
    AND pa.is_available = FALSE;
END;
$$ LANGUAGE plpgsql;

-- 4. Create notification function for challenge events
CREATE OR REPLACE FUNCTION notify_challenge_event()
RETURNS TRIGGER AS $$
DECLARE
    v_payload JSON;
BEGIN
    -- Build payload based on operation
    IF TG_OP = 'INSERT' THEN
        v_payload = json_build_object(
            'event', 'ChallengeCreated',
            'ladder_id', NEW.ladder_id,
            'challenge_id', NEW.id,
            'challenger_id', NEW.challenger_id,
            'challenged_id', NEW.challenged_id,
            'status', NEW.status
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            v_payload = json_build_object(
                'event', CASE 
                    WHEN NEW.status = 'Accepted' THEN 'ChallengeAccepted'
                    WHEN NEW.status = 'Declined' THEN 'ChallengeDeclined'
                    ELSE 'ChallengeUpdated'
                END,
                'ladder_id', NEW.ladder_id,
                'challenge_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status
            );
        END IF;
    END IF;

    -- Notify if we have a payload
    IF v_payload IS NOT NULL THEN
        PERFORM pg_notify('challenge_events', v_payload::TEXT);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for challenge notifications
DROP TRIGGER IF EXISTS challenge_event_notification ON challenges;
CREATE TRIGGER challenge_event_notification
    AFTER INSERT OR UPDATE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION notify_challenge_event();

-- 6. Create notification function for match events
CREATE OR REPLACE FUNCTION notify_match_event()
RETURNS TRIGGER AS $$
DECLARE
    v_payload JSON;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_payload = json_build_object(
            'event', 'MatchCreated',
            'ladder_id', NEW.ladder_id,
            'match_id', NEW.id,
            'player1_id', NEW.player1_id,
            'player2_id', NEW.player2_id,
            'status', NEW.status
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            v_payload = json_build_object(
                'event', CASE 
                    WHEN NEW.status = 'ScoreSubmitted' THEN 'ScoreSubmitted'
                    WHEN NEW.status = 'Confirmed' THEN 'MatchConfirmed'
                    WHEN NEW.status = 'Disputed' THEN 'MatchDisputed'
                    ELSE 'MatchUpdated'
                END,
                'ladder_id', NEW.ladder_id,
                'match_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'submitted_by', NEW.submitted_by,
                'confirmed_by', NEW.confirmed_by
            );
        END IF;
    END IF;

    IF v_payload IS NOT NULL THEN
        PERFORM pg_notify('match_events', v_payload::TEXT);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for match notifications
DROP TRIGGER IF EXISTS match_event_notification ON matches;
CREATE TRIGGER match_event_notification
    AFTER INSERT OR UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION notify_match_event();

-- 8. Create notification function for ranking updates
CREATE OR REPLACE FUNCTION notify_ranking_update()
RETURNS TRIGGER AS $$
DECLARE
    v_payload JSON;
BEGIN
    -- Only notify on rank changes
    IF OLD.current_rank IS DISTINCT FROM NEW.current_rank THEN
        v_payload = json_build_object(
            'event', 'RankingUpdated',
            'ladder_id', NEW.ladder_id,
            'user_id', NEW.user_id,
            'old_rank', OLD.current_rank,
            'new_rank', NEW.current_rank
        );
        
        PERFORM pg_notify('ranking_events', v_payload::TEXT);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for ranking notifications
DROP TRIGGER IF EXISTS ranking_update_notification ON ladder_memberships;
CREATE TRIGGER ranking_update_notification
    AFTER UPDATE ON ladder_memberships
    FOR EACH ROW
    EXECUTE FUNCTION notify_ranking_update();

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_challenges_ladder_status 
    ON challenges(ladder_id, status) 
    WHERE status IN ('Pending', 'Accepted');

CREATE INDEX IF NOT EXISTS idx_matches_ladder_status 
    ON matches(ladder_id, status) 
    WHERE status IN ('Pending', 'ScoreSubmitted');

CREATE INDEX IF NOT EXISTS idx_memberships_cooling 
    ON ladder_memberships(ladder_id, cooling_expires_at) 
    WHERE cooling_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_matches_submitted_by 
    ON matches(submitted_by) 
    WHERE submitted_by IS NOT NULL;

-- 11. Add comments
COMMENT ON FUNCTION notify_challenge_event IS 'Emits pg_notify events for challenge state changes';
COMMENT ON FUNCTION notify_match_event IS 'Emits pg_notify events for match state changes';
COMMENT ON FUNCTION notify_ranking_update IS 'Emits pg_notify events for ranking changes';
COMMENT ON FUNCTION get_busy_players IS 'Returns list of busy players for a ladder with reasons';
