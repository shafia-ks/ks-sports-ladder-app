-- Function to strictly recalculate ranks for a specific ladder
-- content: closes gaps, re-indexes from 1 to N based on current relative order.
CREATE OR REPLACE FUNCTION recalculate_ladder_ranks(target_ladder_id uuid)
RETURNS void AS $$
BEGIN
    -- Update active members with new dense ranks
    WITH ranked_members AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                ORDER BY 
                    -- Prioritize existing rank. If null (new member), put at bottom (handle later or here?)
                    -- Usually new members are rank N+1.
                    -- If we are fixing gaps, valid ranks come first.
                    COALESCE(current_rank, 1000000) ASC, 
                    -- Tie-breaker: Join date (earlier join = better rank if ranks are same?? usually opposite or arbitrary)
                    -- In tennis ladder, usually join date matters if unranked.
                    created_at ASC 
            ) as new_rank
        FROM ladder_memberships
        WHERE ladder_id = target_ladder_id
          AND status = 'active'
    )
    UPDATE ladder_memberships
    SET current_rank = ranked_members.new_rank
    FROM ranked_members
    WHERE ladder_memberships.id = ranked_members.id
      AND ladder_memberships.current_rank IS DISTINCT FROM ranked_members.new_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Trigger Function to call recalculate on changes
CREATE OR REPLACE FUNCTION trigger_recalculate_ranks()
RETURNS TRIGGER AS $$
BEGIN
    -- If a member is deleted, recalculate for their ladder
    IF (TG_OP = 'DELETE') THEN
        PERFORM recalculate_ladder_ranks(OLD.ladder_id);
        RETURN OLD;
    -- If status changes (e.g. active -> left), recalculate
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Only if status changed significance (active <-> not active)
        IF (NEW.status != OLD.status) THEN
            PERFORM recalculate_ladder_ranks(NEW.ladder_id);
            -- Also assume if they moved ladders (unlikely) handle OLD ladder?
            IF (NEW.ladder_id != OLD.ladder_id) THEN
                 PERFORM recalculate_ladder_ranks(OLD.ladder_id);
            END IF;
        END IF;
        RETURN NEW;
    -- If inserted? New member usually gets max rank + 1, handled by app or default.
    -- But if inserted with null rank, maybe?
    -- For now, let's focus on maintaining gaps from leaving.
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create Triggers
DROP TRIGGER IF EXISTS on_member_delete_rank_fix ON ladder_memberships;
CREATE TRIGGER on_member_delete_rank_fix
    AFTER DELETE ON ladder_memberships
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_ranks();

DROP TRIGGER IF EXISTS on_member_update_rank_fix ON ladder_memberships;
CREATE TRIGGER on_member_update_rank_fix
    AFTER UPDATE OF status, ladder_id ON ladder_memberships
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.ladder_id IS DISTINCT FROM NEW.ladder_id)
    EXECUTE FUNCTION trigger_recalculate_ranks();


-- IMMEDIATE TEMPORARY FIX:
-- Run recalculation for ALL ladders now to fix any existing gaps.
DO $$
DECLARE
    l RECORD;
BEGIN
    FOR l IN SELECT id FROM ladders LOOP
        PERFORM recalculate_ladder_ranks(l.id);
    END LOOP;
END $$;
