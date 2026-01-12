-- Create trigger to automatically create public.users record when auth.users is created
-- This ensures all authenticated users have a profile in public.users

-- First, create the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert into public.users with data from auth.users
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    full_name,
    role,
    gdpr_accepted,
    gdpr_accepted_at,
    sportsmanship_accepted,
    sportsmanship_accepted_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'player'),
    true,  -- GDPR must be accepted for signup
    NOW(),
    true,  -- Code of Conduct must be accepted for signup
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if record already exists
  
  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: Create public.users records for any auth.users that don't have them
INSERT INTO public.users (id, email, first_name, last_name, full_name, role, gdpr_accepted, gdpr_accepted_at, sportsmanship_accepted, sportsmanship_accepted_at, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', ''),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  COALESCE(au.raw_user_meta_data->>'role', 'player'),
  true,  -- Assume GDPR was accepted (they signed up somehow)
  au.created_at,
  true,  -- Assume Code of Conduct was accepted
  au.created_at,
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
