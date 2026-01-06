-- Schema updates for enhanced challenge features
-- Run this in Supabase SQL editor to add new columns

-- Add cancellation reason and counter-proposal fields to challenges table
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS counter_proposal_time timestamptz,
ADD COLUMN IF NOT EXISTS counter_proposal_location text,
ADD COLUMN IF NOT EXISTS counter_proposal_notes text,
ADD COLUMN IF NOT EXISTS reminded_at timestamptz,
ADD COLUMN IF NOT EXISTS completed_at timestamptz,
ADD COLUMN IF NOT EXISTS declined_at timestamptz,
ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

-- Add index for efficient querying of active challenges
CREATE INDEX IF NOT EXISTS challenges_status_created_idx ON public.challenges (status, created_at DESC);

-- Add index for expiry notifications
CREATE INDEX IF NOT EXISTS challenges_expires_status_idx ON public.challenges (expires_at, status) WHERE status = 'Pending';
