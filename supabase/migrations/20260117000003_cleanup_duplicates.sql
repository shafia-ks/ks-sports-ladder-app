-- Clean up duplicate memberships, keeping the most recent one
DELETE FROM ladder_memberships
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (partition BY user_id, ladder_id ORDER BY accepted_at DESC) as rnum
    FROM ladder_memberships
  ) t
  WHERE t.rnum > 1
);

-- Recalculate ranks to close gaps (like the missing Rank 4)
DO $$
DECLARE
    r RECORD;
    i INTEGER := 0;
BEGIN
    FOR r IN 
        SELECT id FROM ladder_memberships 
        WHERE status = 'active'
        ORDER BY current_rank ASC NULLS LAST, accepted_at ASC 
    LOOP
        i := i + 1;
        UPDATE ladder_memberships 
        SET current_rank = i 
        WHERE id = r.id AND (current_rank IS NULL OR current_rank != i);
    END LOOP;
END $$;
