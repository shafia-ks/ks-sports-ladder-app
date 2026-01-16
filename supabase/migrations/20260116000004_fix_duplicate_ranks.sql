-- Fix duplicate ranks in ladder_memberships
-- This script reassigns ranks sequentially to fix any duplicates

-- Create a function to fix ranks for a specific ladder
CREATE OR REPLACE FUNCTION fix_ladder_ranks(p_ladder_id UUID)
RETURNS void AS $$
DECLARE
  member_record RECORD;
  new_rank INTEGER := 1;
BEGIN
  -- Loop through all active members ordered by their current rank, then by accepted_at
  FOR member_record IN
    SELECT id, user_id, current_rank
    FROM ladder_memberships
    WHERE ladder_id = p_ladder_id
      AND status = 'active'
    ORDER BY 
      COALESCE(current_rank, 999999) ASC,  -- Put null ranks at the end
      accepted_at ASC NULLS LAST,           -- Earlier acceptances first
      created_at ASC                        -- Fallback to creation time
  LOOP
    -- Update the rank sequentially
    UPDATE ladder_memberships
    SET current_rank = new_rank
    WHERE id = member_record.id;
    
    new_rank := new_rank + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the fix for all ladders
DO $$
DECLARE
  ladder_record RECORD;
BEGIN
  FOR ladder_record IN SELECT DISTINCT ladder_id FROM ladder_memberships WHERE status = 'active'
  LOOP
    PERFORM fix_ladder_ranks(ladder_record.ladder_id);
  END LOOP;
END $$;

-- Add a comment
COMMENT ON FUNCTION fix_ladder_ranks IS 'Fixes duplicate or null ranks by reassigning them sequentially';
