-- Fix Match Status Constraints to include Cancelled and Pending/ScoreSubmitted properly.

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_status_check;

ALTER TABLE public.matches ADD CONSTRAINT matches_status_check 
    CHECK (status IN ('Pending', 'ScoreSubmitted', 'Confirmed', 'Disputed', 'Cancelled'));
