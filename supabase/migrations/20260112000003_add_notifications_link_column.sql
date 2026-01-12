-- Add missing 'link' column to notifications table
-- This fixes the error: "Could not find the 'link' column of 'notifications'"

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS link TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_link ON notifications(link);

-- Update existing notifications to have a default link
UPDATE notifications 
SET link = '/dashboard' 
WHERE link IS NULL AND type IN ('role_changed', 'membership_approved', 'membership_rejected');
