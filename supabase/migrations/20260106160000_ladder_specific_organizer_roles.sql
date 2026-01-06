-- Migration: Make organizer roles ladder-specific, not application-wide
-- This corrects the architecture so that:
-- 1. Users have a global role (player/admin only)
-- 2. ladder_leaders table tracks per-ladder organizers
-- 3. leader_requests table now includes ladder_id for requests to become organizer of a specific ladder

-- Step 1: Update leader_requests to include ladder_id (nullable for backward compat initially)
alter table if exists public.leader_requests 
  add column if not exists ladder_id uuid references public.ladders(id) on delete cascade;

-- Step 2: Update leader_requests to require ladder_id going forward
-- (for now keep it optional, but new requests must have it)
-- The requested_role should ONLY be 'organizer' if ladder_id is set
-- If requested_role is 'admin', ladder_id should be null

-- Step 3: Update users table to clarify role is global (only 'player' or 'admin')
-- The 'organizer' role in users table should NOT be used anymore
-- Instead use ladder_leaders table to track per-ladder organizers
comment on column public.users.role is 'Global role: player, organizer (deprecated - use ladder_leaders), or admin. New organizer requests should use ladder_leaders table.';

-- Step 4: Add indexes for ladder-specific organizer lookups
create index if not exists leader_requests_ladder_idx on public.leader_requests (ladder_id);
create index if not exists leader_requests_ladder_user_idx on public.leader_requests (ladder_id, user_id, status);

-- Step 5: Add constraint to ensure ladder_requests makes sense
-- If requesting 'organizer' role, must have ladder_id
-- If requesting 'admin' role, must NOT have ladder_id
alter table public.leader_requests
  add constraint check_role_ladder_consistency 
  check (
    (requested_role = 'organizer' AND ladder_id IS NOT NULL) OR
    (requested_role = 'admin' AND ladder_id IS NULL)
  );
