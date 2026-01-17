-- FIX: Recalculate ranks PER LADDER (fixing previous global counter error)
DO $$
DECLARE
    l RECORD;
    m RECORD;
    i INTEGER;
BEGIN
    -- Iterate through each ladder separately
    FOR l IN SELECT id FROM ladders LOOP
        i := 0;
        
        -- Re-assign ranks 1..N for active members in THIS ladder
        FOR m IN 
            SELECT id FROM ladder_memberships 
            WHERE ladder_id = l.id AND status = 'active'
            -- Preserve existing relative order as much as possible
            ORDER BY current_rank ASC NULLS LAST, accepted_at ASC 
        LOOP
            i := i + 1;
            UPDATE ladder_memberships 
            SET current_rank = i 
            WHERE id = m.id;
        END LOOP;
    END LOOP;
END $$;
