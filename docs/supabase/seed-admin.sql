-- Quick admin setup script
-- Run this in Supabase SQL Editor after creating a user through signup

-- Find the latest user (usually the one you just created)
-- UPDATE public.users 
-- SET role = 'admin' 
-- WHERE email = 'your-email@example.com';

-- Example: If you signed up with admin@example.com, run:
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@example.com';

-- Verify the role was updated
SELECT id, email, full_name, role FROM public.users WHERE role = 'admin';
