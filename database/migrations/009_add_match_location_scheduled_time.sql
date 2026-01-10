-- Migration: Add location and scheduled_time to matches table
-- Date: 2026-01-10
-- Description: Support optional match scheduling and location details

-- Add location column for match venue
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add scheduled_time for when match is planned
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP WITH TIME ZONE;

-- Add index for querying matches by scheduled time
CREATE INDEX IF NOT EXISTS idx_matches_scheduled_time 
ON public.matches(scheduled_time) 
WHERE scheduled_time IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.matches.location IS 'Optional venue/court location for the match';
COMMENT ON COLUMN public.matches.scheduled_time IS 'Optional scheduled date/time for the match';
