-- SIMPLE FIX: Just UPDATE existing users to have GDPR compliance
-- Run this FIRST if the column already exists

-- For existing users who are Missing GDPR
UPDATE public.users
SET 
  gdpr_accepted = true,
  gdpr_accepted_at = COALESCE(created_at, NOW()),
  sportsmanship_accepted = true,
  sportsmanship_accepted_at = COALESCE(created_at, NOW())
WHERE gdpr_accepted IS NULL 
   OR sportsmanship_accepted IS NULL
   OR gdpr_accepted = false
   OR sportsmanship_accepted = false;

-- Verify the update worked
SELECT 
  email,
  gdpr_accepted,
  sportsmanship_accepted,
  CASE 
    WHEN gdpr_accepted AND sportsmanship_accepted THEN '✓ GDPR / Code'
    ELSE '✗ Missing'
  END as compliance_status
FROM public.users
ORDER BY created_at DESC;
