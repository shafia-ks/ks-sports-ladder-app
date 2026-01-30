-- Add leave_ends_at to member_inactivity_tracking for scheduled return
ALTER TABLE member_inactivity_tracking
ADD COLUMN IF NOT EXISTS leave_ends_at TIMESTAMPTZ;
