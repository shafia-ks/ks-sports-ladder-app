-- Create membership_events table to track join/leave activity
CREATE TABLE IF NOT EXISTS public.membership_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ladder_id UUID NOT NULL REFERENCES public.ladders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('joined', 'left')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Indexes for performance
  CONSTRAINT membership_events_ladder_id_idx UNIQUE (ladder_id, user_id, event_type, created_at)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS membership_events_ladder_created_idx 
  ON public.membership_events(ladder_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.membership_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Members can view events for their ladders
CREATE POLICY "Members can view membership events for their ladders"
  ON public.membership_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ladder_memberships
      WHERE ladder_memberships.ladder_id = membership_events.ladder_id
        AND ladder_memberships.user_id = auth.uid()
        AND ladder_memberships.status = 'active'
    )
  );

-- Add comment
COMMENT ON TABLE public.membership_events IS 'Tracks when members join or leave ladders for activity feed';
