-- Function to recalculate ranks and close gaps
CREATE OR REPLACE FUNCTION fix_ladder_ranks(target_ladder_id uuid)
RETURNS void AS $$
BEGIN
  -- Re-rank active members preserving current relative order
  WITH ranked_members AS (
    SELECT id,
           ROW_NUMBER() OVER (
               -- Order by current_rank (nulls last implicity but be specific)
               ORDER BY 
                 COALESCE(current_rank, 999999) ASC, 
                 created_at ASC
           ) as new_rank
    FROM ladder_members
    WHERE ladder_id = target_ladder_id
      AND status = 'active'
      AND (current_rank IS NOT NULL OR previous_rank IS NOT NULL) -- Only touch played/ranked members just in case, or just active ones?
      -- Actually, all 'active' members in a ladder should have a rank.
  )
  UPDATE ladder_members
  SET current_rank = ranked_members.new_rank
  FROM ranked_members
  WHERE ladder_members.id = ranked_members.id
    AND ladder_members.current_rank IS DISTINCT FROM ranked_members.new_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the fix for all ladders immediately to resolve the reported issue (Rank 4 missing)
DO $$
DECLARE
    lid uuid;
BEGIN
    FOR lid IN SELECT id FROM ladders LOOP
        PERFORM fix_ladder_ranks(lid);
    END LOOP;
END $$;

-- Fix RLS: Ensure users can see their own 'pending' membership
-- This fixes the issue where a pending user sees 'Join Ladder' because they can't read their own pending status.
DROP POLICY IF EXISTS "Users can view own membership" ON ladder_members;
CREATE POLICY "Users can view own membership" 
    ON ladder_members FOR SELECT 
    USING (auth.uid() = user_id);

-- Also allow everyone to view 'active' members (standard visibility) - ensures list active works
DROP POLICY IF EXISTS "Public view active members" ON ladder_members;
CREATE POLICY "Public view active members"
    ON ladder_members FOR SELECT
    USING (status = 'active');
    
-- Allow organizers to view all members in their ladder
DROP POLICY IF EXISTS "Organizers view all members" ON ladder_members;
CREATE POLICY "Organizers view all members"
    ON ladder_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ladders
            WHERE ladders.id = ladder_members.ladder_id
            AND ladders.owner_id = auth.uid()
        )
    );
