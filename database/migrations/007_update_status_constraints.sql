-- Migration: Update status constraints for ladders and matches
-- Date: 2026-01-10
-- Description: Add 'archived' status for ladders and 'Pending' status for matches

-- 1. Update ladders status constraint to include 'archived'
ALTER TABLE public.ladders DROP CONSTRAINT IF EXISTS ladders_status_check;
ALTER TABLE public.ladders
  ADD CONSTRAINT ladders_status_check 
  CHECK (status IN ('active', 'inactive', 'archived'));

-- 2. Update matches status constraint to include 'Pending'  
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE public.matches
  ADD CONSTRAINT matches_status_check
  CHECK (status IN ('Pending', 'Submitted', 'Confirmed', 'Disputed'));

-- Verification queries (run these after migration to test):
-- SELECT constraint_name, check_clause FROM information_schema.check_constraints WHERE constraint_name IN ('ladders_status_check', 'matches_status_check');
