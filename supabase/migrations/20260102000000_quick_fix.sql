-- Quick fix: Add missing columns to existing tables
-- Run this if tables already exist

-- Add first_name and last_name to users table if they don't exist
alter table if exists public.users add column if not exists first_name text;
alter table if exists public.users add column if not exists last_name text;

-- Create leader_requests table if it doesn't exist
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
 
-- Create indexes if they don't exist
create index if not exists leader_requests_user_idx on public.leader_requests (user_id);
create index if not exists leader_requests_status_idx on public.leader_requests (status);
create index if not exists leader_requests_requested_at_idx on public.leader_requests (requested_at);
