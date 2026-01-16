-- Fix for player_availability view with SECURITY DEFINER
-- Run this in Supabase SQL Editor

-- Drop the existing view completely
DROP VIEW IF EXISTS public.player_availability CASCADE;

-- Recreate without SECURITY DEFINER (uses SECURITY INVOKER by default)
CREATE VIEW public.player_availability 
WITH (security_invoker = true)
AS
SELECT 
  lm.user_id,
  lm.ladder_id,
  lm.is_busy,
  lm.cooling_expires_at,
  CASE 
    WHEN lm.is_busy THEN false
    WHEN lm.cooling_expires_at IS NOT NULL AND lm.cooling_expires_at > now() THEN false
    ELSE true
  END AS is_available
FROM public.ladder_memberships lm
WHERE lm.status = 'active';

-- Verify it's fixed
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE viewname = 'player_availability';
