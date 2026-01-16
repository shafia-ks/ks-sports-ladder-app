
-- Fix RLS for notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Notifications are viewable by owner" ON public.notifications;

-- Create policy allowing users to see their own notifications
CREATE POLICY "Notifications are viewable by owner" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Also allow users to update (mark as read) their own notifications
CREATE POLICY "Notifications can be updated by owner" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role (or anyone with access) to insert (handled by API usually, but harmless to be explicit if using client)
-- Actually, insert is usually done by service_role in our API. 
-- But if we want client-side creation (unlikely), we'd add it. 
-- For now, just SELECT and UPDATE (mark as read) are critical for the UI.
