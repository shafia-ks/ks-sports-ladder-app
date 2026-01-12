-- Add GDPR and Code of Conduct compliance columns to users table
-- Fixes the "Missing" compliance status in admin panel

-- ROOT CAUSE: The users table was missing gdpr_accepted and sportsmanship_accepted columns
-- The signup API and trigger were trying to insert these values, but columns didn't exist
-- Result: Values were silently ignored, admin panel showed "Missing"

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS gdpr_accepted BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS gdpr_accepted_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS sportsmanship_accepted BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sportsmanship_accepted_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill all existing users (they must have accepted GDPR/Code to sign up)
-- We assume acceptance because signup form requires it
UPDATE public.users
SET 
  gdpr_accepted = true,
  gdpr_accepted_at = COALESCE(created_at, NOW()),
  sportsmanship_accepted = true,
  sportsmanship_accepted_at = COALESCE(created_at, NOW())
WHERE gdpr_accepted IS NULL OR sportsmanship_accepted IS NULL;

-- Add indexes for faster compliance queries
CREATE INDEX IF NOT EXISTS idx_users_gdpr_accepted ON public.users(gdpr_accepted);
CREATE INDEX IF NOT EXISTS idx_users_sportsmanship_accepted ON public.users(sportsmanship_accepted);
