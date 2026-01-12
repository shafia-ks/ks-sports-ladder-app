-- Diagnose "Unknown" user names issue
-- This checks if users exist in auth.users but NOT in public.users

-- Step 1: Find users in auth.users who are missing from public.users
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  CASE 
    WHEN pu.id IS NULL THEN '❌ MISSING from public.users'
    ELSE '✓ EXISTS in public.users'
  END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- Step 2: If users are missing, create them manually
-- ONLY run this if Step 1 shows missing users
INSERT INTO public.users (id, email, first_name, last_name, full_name, role, gdpr_accepted, gdpr_accepted_at, sportsmanship_accepted, sportsmanship_accepted_at, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', ''),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  COALESCE(au.raw_user_meta_data->>'role', 'player'),
  true,
  au.created_at,
  true,
  au.created_at,
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 3: Verify all auth.users now have public.users records
SELECT 
  COUNT(*) as auth_users_count,
  (SELECT COUNT(*) FROM public.users) as public_users_count,
  COUNT(*) - (SELECT COUNT(*) FROM public.users) as missing_count
FROM auth.users;

-- missing_count should be 0
