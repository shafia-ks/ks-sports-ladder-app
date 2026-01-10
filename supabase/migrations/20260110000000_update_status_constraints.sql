-- Migration: Update status constraints for ladders and matches
-- Run this in your Supabase SQL editor

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

-- Note: Invitations already support 'new_user' and 'existing_user' via migration 003
-- No changes needed there.
