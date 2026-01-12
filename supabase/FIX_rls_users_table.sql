-- Fix RLS policy on users table to allow authenticated users to read other users' basic info
-- This fixes "Unknown" names in main dashboard for non-admin users

-- Current issue: Regular players can't read from public.users table
-- Result: Main dashboard shows "Unknown" instead of user names

-- Drop existing restrictive policy if exists
DROP POLICY IF EXISTS "Users can read own data" ON public.users;

-- Create new policy: Allow authenticated users to read basic user info
CREATE POLICY "Allow authenticated users to read basic user info"
ON public.users
FOR SELECT
TO authenticated
USING (true);  -- All authenticated users can read all user records

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
AND schemaname = 'public';

-- Expected: Should show the new policy allowing SELECT for authenticated role
