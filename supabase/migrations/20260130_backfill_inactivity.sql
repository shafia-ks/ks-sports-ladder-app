-- Backfill member_inactivity_tracking for existing members
-- Run this to ensure all members have inactivity tracking records

INSERT INTO member_inactivity_tracking (ladder_id, user_id)
SELECT ladder_id, user_id
FROM ladder_memberships
ON CONFLICT (ladder_id, user_id) DO NOTHING;

-- Also ensure all ladders have inactivity settings
INSERT INTO ladder_inactivity_settings (ladder_id)
SELECT id FROM ladders
ON CONFLICT (ladder_id) DO NOTHING;
