-- Supabase schema for KS Sports Ladder
-- Run this in the Supabase SQL editor or via CLI before wiring the app.

-- Extensions (Supabase usually pre-installs these)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Users (profile extension of auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  first_name text,
  last_name text,
  full_name text,
  avatar_url text,
  role text not null default 'player' check (role in ('player', 'organizer', 'admin')),
  gdpr_accepted boolean not null default false,
  gdpr_accepted_at timestamptz,
  sportsmanship_accepted boolean not null default false,
  sportsmanship_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists users_email_idx on public.users (email);
create index if not exists users_role_idx on public.users (role);

-- Ladders
create table if not exists public.ladders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sport_id text,
  location text,
  status text not null default 'active' check (status in ('active','inactive')),
  visibility text not null default 'public' check (visibility in ('public','private')),
  challenge_rules jsonb not null,
  ranking_rules jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists ladders_status_idx on public.ladders (status);

-- Alter ladders table to add created_by if it doesn't exist
alter table public.ladders add column if not exists created_by uuid;

-- Add foreign key constraint (will fail silently if already exists)
alter table public.ladders add constraint fk_ladders_created_by foreign key (created_by) references auth.users(id) on delete cascade;

create index if not exists ladders_created_by_idx on public.ladders (created_by);

-- Ladder leaders (group leaders/admins)
create table if not exists public.ladder_leaders (
  id uuid primary key default gen_random_uuid(),
  ladder_id uuid not null references public.ladders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(ladder_id, user_id)
);
create index if not exists ladder_leaders_ladder_idx on public.ladder_leaders (ladder_id);
create index if not exists ladder_leaders_user_idx on public.ladder_leaders (user_id);

-- Ladder memberships
create table if not exists public.ladder_memberships (
  id uuid primary key default gen_random_uuid(),
  ladder_id uuid not null references public.ladders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  current_rank int not null default 1,
  join_date timestamptz,
  unique(ladder_id, user_id)
);
create index if not exists ladder_memberships_ladder_rank_idx on public.ladder_memberships (ladder_id, current_rank);

-- Alter ladder_memberships to add missing columns
alter table public.ladder_memberships add column if not exists status text default 'pending';
alter table public.ladder_memberships add column if not exists requested_at timestamptz default now();
alter table public.ladder_memberships add column if not exists accepted_at timestamptz;
alter table public.ladder_memberships add column if not exists accepted_by uuid;

create index if not exists ladder_memberships_status_idx on public.ladder_memberships (ladder_id, status);
create index if not exists ladder_memberships_user_idx on public.ladder_memberships (user_id, status);

-- Challenges
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  ladder_id uuid not null references public.ladders(id) on delete cascade,
  challenger_id uuid not null references auth.users(id) on delete cascade,
  challenged_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('Pending','Accepted','Declined','Completed','Expired','Cancelled')),
  scheduled_at timestamptz,
  location text,
  notes text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists challenges_ladder_status_idx on public.challenges (ladder_id, status);
create index if not exists challenges_challenger_idx on public.challenges (challenger_id);
create index if not exists challenges_challenged_idx on public.challenges (challenged_id);

-- Matches
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  ladder_id uuid not null references public.ladders(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete set null,
  player1_id uuid not null references auth.users(id) on delete cascade,
  player2_id uuid not null references auth.users(id) on delete cascade,
  set_scores jsonb,
  winner_id uuid references auth.users(id),
  status text not null check (status in ('Submitted','Confirmed','Disputed')),
  confirmed_by uuid references auth.users(id),
  disputed_by uuid references auth.users(id),
  played_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists matches_ladder_status_idx on public.matches (ladder_id, status);
create index if not exists matches_player_idx on public.matches (player1_id, player2_id);

-- Seasons
create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  ladder_id uuid not null references public.ladders(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists seasons_ladder_idx on public.seasons (ladder_id, archived);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, read);

-- Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  performed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

-- (Optional) Ranking history snapshots
create table if not exists public.ranking_history (
  id uuid primary key default gen_random_uuid(),
  ladder_id uuid not null references public.ladders(id) on delete cascade,
  snapshot jsonb not null,
  match_id uuid references public.matches(id),
  created_at timestamptz not null default now()
);
create index if not exists ranking_history_ladder_idx on public.ranking_history (ladder_id, created_at);

-- Leader/Role Promotion Requests
create table if not exists public.leader_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_role text not null check (requested_role in ('organizer', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reason text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  rejection_reason text
);
create index if not exists leader_requests_user_idx on public.leader_requests (user_id);
create index if not exists leader_requests_status_idx on public.leader_requests (status);
create index if not exists leader_requests_requested_at_idx on public.leader_requests (requested_at);

-- Recommended defaults for challenge_rules
-- { "maxPositionsUp": 3, "preventChallengingBusyPlayers": true, "maxActiveChallengesPerPlayer": 1, "expiryDays": 7 }
-- Recommended defaults for ranking_rules
-- { "type": "default-swap-minimal-drop" }

-- RLS can be enabled later; for now, server routes should use the service role key.
