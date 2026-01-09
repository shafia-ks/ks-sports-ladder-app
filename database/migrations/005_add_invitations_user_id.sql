-- Fix invitations table structure
-- Add missing user_id column for existing user invitations

-- Add user_id column if it doesn't exist
ALTER TABLE invitations 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_invitations_user_id 
  ON invitations(user_id) WHERE user_id IS NOT NULL;

-- Update the check constraint to allow NULL user_id (for email invitations)
-- The user_id should be NULL for 'new_user' type and NOT NULL for 'existing_user' type
