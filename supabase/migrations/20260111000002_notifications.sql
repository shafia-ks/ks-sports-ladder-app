-- =====================================================
-- Phase 3: Persistent Notification System
-- =====================================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'challenge_received', 
        'challenge_accepted', 
        'challenge_declined', 
        'match_submitted', 
        'match_confirmed', 
        'match_disputed', 
        'match_scheduled',
        'rank_changed'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- 2. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
    ON notifications(user_id, read_at) 
    WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
    ON notifications(created_at DESC);

-- 4. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 5. Update existing event functions to also insert into notifications table

-- Update notify_challenge_event to create notifications
CREATE OR REPLACE FUNCTION notify_challenge_event()
RETURNS TRIGGER AS $$
DECLARE
    v_payload JSON;
    v_challenger_name TEXT;
    v_challenged_name TEXT;
    v_ladder_name TEXT;
BEGIN
    -- Get names
    SELECT full_name INTO v_challenger_name FROM users WHERE id = NEW.challenger_id;
    SELECT full_name INTO v_challenged_name FROM users WHERE id = NEW.challenged_id;
    SELECT name INTO v_ladder_name FROM ladders WHERE id = NEW.ladder_id;

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

        -- Notify the challenged player
        INSERT INTO notifications (user_id, type, title, message, link_url, metadata)
        VALUES (
            NEW.challenged_id,
            'challenge_received',
            'New Challenge Received',
            v_challenger_name || ' has challenged you on ' || v_ladder_name,
            '/ladders/' || NEW.ladder_id,
            json_build_object('challenge_id', NEW.id, 'ladder_id', NEW.ladder_id)
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

            -- Notify challenger when accepted or declined
            IF NEW.status IN ('Accepted', 'Declined') THEN
                INSERT INTO notifications (user_id, type, title, message, link_url, metadata)
                VALUES (
                    NEW.challenger_id,
                    CASE WHEN NEW.status = 'Accepted' THEN 'challenge_accepted' ELSE 'challenge_declined' END,
                    'Challenge ' || NEW.status,
                    v_challenged_name || ' has ' || LOWER(NEW.status) || ' your challenge on ' || v_ladder_name,
                    '/ladders/' || NEW.ladder_id,
                    json_build_object('challenge_id', NEW.id, 'ladder_id', NEW.ladder_id)
                );
            END IF;
        END IF;
    END IF;

    -- Emit Realtime Event
    IF v_payload IS NOT NULL THEN
        PERFORM pg_notify('challenge_events', v_payload::TEXT);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Update notify_match_event to create notifications
CREATE OR REPLACE FUNCTION notify_match_event()
RETURNS TRIGGER AS $$
DECLARE
    v_payload JSON;
    v_opponent_id UUID;
    v_submitter_name TEXT;
    v_ladder_name TEXT;
BEGIN
    SELECT name INTO v_ladder_name FROM ladders WHERE id = NEW.ladder_id;

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

            -- Handle persistence
            IF NEW.status = 'ScoreSubmitted' AND NEW.submitted_by IS NOT NULL THEN
                -- Determine opponent
                v_opponent_id := CASE 
                    WHEN NEW.player1_id = NEW.submitted_by THEN NEW.player2_id 
                    ELSE NEW.player1_id 
                END;
                
                SELECT full_name INTO v_submitter_name FROM users WHERE id = NEW.submitted_by;

                INSERT INTO notifications (user_id, type, title, message, link_url, metadata)
                VALUES (
                    v_opponent_id,
                    'match_submitted',
                    'Match Score Submitted',
                    v_submitter_name || ' submitted a score for your match on ' || v_ladder_name || '. Please confirm it.',
                    '/matches',
                    json_build_object('match_id', NEW.id, 'ladder_id', NEW.ladder_id)
                );
            
            ELSIF NEW.status = 'Disputed' AND NEW.disputed_by IS NOT NULL THEN
                 -- Determine opponent (who submitted)
                v_opponent_id := CASE 
                    WHEN NEW.player1_id = NEW.disputed_by THEN NEW.player2_id 
                    ELSE NEW.player1_id 
                END;
                
                SELECT full_name INTO v_submitter_name FROM users WHERE id = NEW.disputed_by;

                INSERT INTO notifications (user_id, type, title, message, link_url, metadata)
                VALUES (
                    v_opponent_id,
                    'match_disputed',
                    'Match Score Disputed',
                    v_submitter_name || ' disputed the match score on ' || v_ladder_name,
                    '/matches',
                    json_build_object('match_id', NEW.id, 'ladder_id', NEW.ladder_id)
                );

            ELSIF NEW.status = 'Confirmed' THEN
                -- Notify both players (except the one who confirmed if applicable)
                -- Actually simpler to just notify both "Match Confirmed"
                INSERT INTO notifications (user_id, type, title, message, link_url, metadata)
                VALUES 
                (NEW.player1_id, 'match_confirmed', 'Match Confirmed', 'Your match on ' || v_ladder_name || ' has been confirmed.', '/matches', json_build_object('match_id', NEW.id)),
                (NEW.player2_id, 'match_confirmed', 'Match Confirmed', 'Your match on ' || v_ladder_name || ' has been confirmed.', '/matches', json_build_object('match_id', NEW.id))
                ON CONFLICT DO NOTHING; -- In case of weirdness, but UUID primary key prevents conflict on ID. Here we insert distinct rows.
            END IF;
        END IF;
    END IF;

    IF v_payload IS NOT NULL THEN
        PERFORM pg_notify('match_events', v_payload::TEXT);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Update notify_ranking_update to create notifications
CREATE OR REPLACE FUNCTION notify_ranking_update()
RETURNS TRIGGER AS $$
DECLARE
    v_payload JSON;
    v_ladder_name TEXT;
BEGIN
    SELECT name INTO v_ladder_name FROM ladders WHERE id = NEW.ladder_id;

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

        -- Notify user if they climbed efficiently (e.g. gained rank)
        IF NEW.current_rank < OLD.current_rank THEN
             INSERT INTO notifications (user_id, type, title, message, link_url, metadata)
             VALUES (
                NEW.user_id,
                'rank_changed',
                'Rank Improved!',
                'You moved up to rank #' || NEW.current_rank || ' on ' || v_ladder_name || '!',
                '/ladders/' || NEW.ladder_id,
                json_build_object('ladder_id', NEW.ladder_id, 'old_rank', OLD.current_rank, 'new_rank', NEW.current_rank)
             );
        ELSIF NEW.current_rank > OLD.current_rank THEN
             -- Optional: Notify when dropped? Maybe discouraging. Let's stick to positive/neutral.
             -- But knowing you dropped is important.
             INSERT INTO notifications (user_id, type, title, message, link_url, metadata)
             VALUES (
                NEW.user_id,
                'rank_changed',
                'Rank Update',
                'Your rank changed to #' || NEW.current_rank || ' on ' || v_ladder_name,
                '/ladders/' || NEW.ladder_id,
                json_build_object('ladder_id', NEW.ladder_id, 'old_rank', OLD.current_rank, 'new_rank', NEW.current_rank)
             );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
