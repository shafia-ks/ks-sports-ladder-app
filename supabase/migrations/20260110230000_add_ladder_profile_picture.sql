-- Add profile_picture_url column to ladders table
ALTER TABLE public.ladders ADD COLUMN IF NOT EXISTS profile_picture_url text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS ladders_profile_picture_url_idx ON public.ladders (profile_picture_url);
