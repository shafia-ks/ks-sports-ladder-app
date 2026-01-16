-- Enable RLS on all public tables
-- This migration addresses Supabase linter security warnings

-- Enable RLS on ladders table
ALTER TABLE public.ladders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ladder_leaders table
ALTER TABLE public.ladder_leaders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ladder_memberships table
ALTER TABLE public.ladder_memberships ENABLE ROW LEVEL SECURITY;

-- Enable RLS on seasons table
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- Enable RLS on matches table
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Enable RLS on audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ranking_history table
ALTER TABLE public.ranking_history ENABLE ROW LEVEL SECURITY;

-- Enable RLS on leader_requests table
ALTER TABLE public.leader_requests ENABLE ROW LEVEL SECURITY;

-- Enable RLS on challenges table
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Enable RLS on invitations table
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ladders
CREATE POLICY "Ladders are viewable by everyone" ON public.ladders
  FOR SELECT USING (true);

CREATE POLICY "Ladders can be created by authenticated users" ON public.ladders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Ladders can be updated by organizers and admins" ON public.ladders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.ladder_leaders
      WHERE ladder_id = ladders.id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Ladders can be deleted by admins" ON public.ladders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for ladder_leaders
CREATE POLICY "Ladder leaders are viewable by ladder members" ON public.ladder_leaders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ladder_memberships
      WHERE ladder_id = ladder_leaders.ladder_id 
        AND user_id = auth.uid() 
        AND status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'organizer')
    )
  );

CREATE POLICY "Ladder leaders can be managed by admins" ON public.ladder_leaders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for ladder_memberships
CREATE POLICY "Memberships are viewable by ladder members" ON public.ladder_memberships
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.ladder_memberships m
      WHERE m.ladder_id = ladder_memberships.ladder_id 
        AND m.user_id = auth.uid() 
        AND m.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.ladder_leaders
      WHERE ladder_id = ladder_memberships.ladder_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'organizer')
    )
  );

CREATE POLICY "Users can request to join ladders" ON public.ladder_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Memberships can be updated by organizers" ON public.ladder_memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.ladder_leaders
      WHERE ladder_id = ladder_memberships.ladder_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Memberships can be deleted by user or organizers" ON public.ladder_memberships
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.ladder_leaders
      WHERE ladder_id = ladder_memberships.ladder_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for matches
CREATE POLICY "Matches are viewable by ladder members" ON public.matches
  FOR SELECT USING (
    player1_id = auth.uid()
    OR player2_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.ladder_memberships
      WHERE ladder_id = matches.ladder_id 
        AND user_id = auth.uid() 
        AND status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.ladder_leaders
      WHERE ladder_id = matches.ladder_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Matches can be created by players" ON public.matches
  FOR INSERT WITH CHECK (
    player1_id = auth.uid() OR player2_id = auth.uid()
  );

CREATE POLICY "Matches can be updated by players or organizers" ON public.matches
  FOR UPDATE USING (
    player1_id = auth.uid()
    OR player2_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.ladder_leaders
      WHERE ladder_id = matches.ladder_id AND user_id = auth.uid()
    )
  );

-- Create RLS policies for challenges
CREATE POLICY "Challenges are viewable by involved parties" ON public.challenges
  FOR SELECT USING (
    challenger_id = auth.uid()
    OR challenged_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.ladder_memberships
      WHERE ladder_id = challenges.ladder_id 
        AND user_id = auth.uid() 
        AND status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.ladder_leaders
      WHERE ladder_id = challenges.ladder_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Challenges can be created by ladder members" ON public.challenges
  FOR INSERT WITH CHECK (
    challenger_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.ladder_memberships
      WHERE ladder_id = challenges.ladder_id 
        AND user_id = auth.uid() 
        AND status = 'active'
    )
  );

CREATE POLICY "Challenges can be updated by involved parties" ON public.challenges
  FOR UPDATE USING (
    challenger_id = auth.uid() OR challenged_id = auth.uid()
  );

-- Create RLS policies for invitations
CREATE POLICY "Invitations are viewable by recipient or sender" ON public.invitations
  FOR SELECT USING (
    invited_by = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.ladder_leaders
      WHERE ladder_id = invitations.ladder_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Invitations can be created by organizers" ON public.invitations
  FOR INSERT WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.ladder_leaders
      WHERE ladder_id = invitations.ladder_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Invitations can be updated by recipient" ON public.invitations
  FOR UPDATE USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Create RLS policies for seasons
CREATE POLICY "Seasons are viewable by everyone" ON public.seasons
  FOR SELECT USING (true);

CREATE POLICY "Seasons can be managed by admins and organizers" ON public.seasons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'organizer')
    )
  );

-- Create RLS policies for audit_logs
CREATE POLICY "Audit logs are viewable by admins only" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for ranking_history
CREATE POLICY "Ranking history is viewable by ladder members" ON public.ranking_history
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.ladder_memberships
      WHERE ladder_id = ranking_history.ladder_id 
        AND user_id = auth.uid() 
        AND status = 'active'
    )
  );

-- Create RLS policies for leader_requests
CREATE POLICY "Leader requests are viewable by requester and admins" ON public.leader_requests
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Leader requests can be created by users" ON public.leader_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Leader requests can be updated by admins" ON public.leader_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Fix the security definer view issue
DROP VIEW IF EXISTS public.player_availability;

-- Recreate without SECURITY DEFINER
CREATE OR REPLACE VIEW public.player_availability AS
SELECT 
  lm.user_id,
  lm.ladder_id,
  lm.is_busy,
  lm.cooling_expires_at,
  CASE 
    WHEN lm.is_busy THEN false
    WHEN lm.cooling_expires_at IS NOT NULL AND lm.cooling_expires_at > now() THEN false
    ELSE true
  END AS is_available
FROM public.ladder_memberships lm
WHERE lm.status = 'active';
