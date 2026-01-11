-- =====================================================
-- Fix Ranking Algorithm and Add Ladder Images
-- =====================================================

-- 1. Add image_url column to ladders table
ALTER TABLE ladders 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Add index for image queries
CREATE INDEX IF NOT EXISTS ladders_image_url_idx 
ON ladders(image_url) 
WHERE image_url IS NOT NULL;

-- 3. Update existing ladders to use slide-shift ranking
-- This changes from "default-swap-minimal-drop" to "slide-shift"
-- Slide-shift: Winner takes loser's position, everyone in between shifts down by 1
UPDATE ladders 
SET ranking_rules = jsonb_set(
    ranking_rules, 
    '{type}', 
    '"slide-shift"'
)
WHERE ranking_rules->>'type' = 'default-swap-minimal-drop';

-- 4. Add comments for documentation
COMMENT ON COLUMN ladders.image_url IS 'URL or path to ladder cover image';

-- 5. Verify the update
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM ladders
    WHERE ranking_rules->>'type' = 'slide-shift';
    
    RAISE NOTICE 'Updated % ladder(s) to use slide-shift ranking', v_count;
END $$;
