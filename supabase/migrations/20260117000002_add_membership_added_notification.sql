-- Add membership_added to notifications type constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'challenge_received', 
    'challenge_accepted', 
    'challenge_declined', 
    'match_submitted', 
    'match_confirmed', 
    'match_disputed', 
    'match_scheduled',
    'rank_changed',
    'ladder_invitation',
    'challenge_expired',
    'challenge_reminder',
    'match_ready',
    'score_to_confirm',
    'match_completed',
    'match_score_submitted',
    'role_changed',
    'membership_approved',
    'membership_rejected',
    'membership_removed',
    'membership_added', -- New type
    'join_request',
    'account_disabled',
    'account_deleted'
));
