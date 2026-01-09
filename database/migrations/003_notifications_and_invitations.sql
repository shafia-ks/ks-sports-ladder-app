-- Notifications Table
-- Store in-app notifications for users
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'ladder_invitation',
    'challenge_received',
    'challenge_accepted',
    'challenge_declined',
    'match_ready',
    'score_to_confirm',
    'match_confirmed',
    'rank_changed'
  )),
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON notifications(user_id, created_at DESC);

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY notifications_select_own 
  ON notifications FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_own 
  ON notifications FOR UPDATE 
  USING (auth.uid() = user_id);

-- System/API can insert notifications (handled via service role)


-- Enhance Invitations Table
-- Add support for email invitations
ALTER TABLE invitations 
  ADD COLUMN IF NOT EXISTS invitation_type TEXT DEFAULT 'existing_user' CHECK (invitation_type IN ('existing_user', 'new_user')),
  ADD COLUMN IF NOT EXISTS token UUID DEFAULT uuid_generate_v4(),
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token 
  ON invitations(token) WHERE token IS NOT NULL;

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_invitations_email 
  ON invitations(email) WHERE email IS NOT NULL;


-- Function to auto-reject duplicate pending invitations
CREATE OR REPLACE FUNCTION prevent_duplicate_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for existing pending invitation
  IF EXISTS (
    SELECT 1 FROM invitations
    WHERE ladder_id = NEW.ladder_id
      AND (
        (NEW.invitation_type = 'existing_user' AND user_id = NEW.user_id) OR
        (NEW.invitation_type = 'new_user' AND email = NEW.email)
      )
      AND status = 'pending'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'User already has a pending invitation to this ladder';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_duplicate_invitations
  BEFORE INSERT OR UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_invitations();
