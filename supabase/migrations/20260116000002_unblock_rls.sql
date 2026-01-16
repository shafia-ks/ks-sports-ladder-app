-- UNBLOCK DASHBOARD SCRIPT
-- This script simplifies RLS policies to remove infinite recursions.
-- Run this in Supabase SQL Editor.

-- 1. USERS TABLE (Allow public read to fix dashboard user fetching)
-- Drop dynamic/unknown policies first (handles "already exists" errors)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.policyname);
  END LOOP;
END $$;
CREATE POLICY "allow_all_read_users" ON public.users FOR SELECT USING (true);
CREATE POLICY "allow_self_update_users" ON public.users FOR UPDATE USING (auth.uid() = id);


-- 2. LADDER MEMBERSHIPS (Remove self-referencing check)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'ladder_memberships' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.ladder_memberships', r.policyname);
  END LOOP;
END $$;
-- Simplify: Any authenticated user can see who is in a ladder
CREATE POLICY "allow_auth_read_memberships" ON public.ladder_memberships FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "allow_self_insert_memberships" ON public.ladder_memberships FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "allow_self_update_memberships" ON public.ladder_memberships FOR UPDATE USING (user_id = auth.uid());


-- 3. MATCHES (Remove complex membership checks for now)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'matches' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.matches', r.policyname);
  END LOOP;
END $$;
-- Simplify: Any authenticated user can view matches
CREATE POLICY "allow_auth_read_matches" ON public.matches FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "allow_player_manage_matches" ON public.matches FOR ALL USING (player1_id = auth.uid() OR player2_id = auth.uid());


-- 4. CHALLENGES
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'challenges' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.challenges', r.policyname);
  END LOOP;
END $$;
-- Simplify: Any authenticated user can view challenges
CREATE POLICY "allow_auth_read_challenges" ON public.challenges FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "allow_participant_manage_challenges" ON public.challenges FOR ALL USING (challenger_id = auth.uid() OR challenged_id = auth.uid());


-- 5. LADDERS
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'ladders' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.ladders', r.policyname);
  END LOOP;
END $$;
CREATE POLICY "allow_public_read_ladders" ON public.ladders FOR SELECT USING (true);
CREATE POLICY "allow_organizer_manage_ladders" ON public.ladders FOR ALL USING (auth.uid() = created_by); -- Basic check
