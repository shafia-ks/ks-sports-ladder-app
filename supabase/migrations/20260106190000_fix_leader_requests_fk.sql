-- Fix: Add missing foreign key relationships for leader_requests table

-- Add foreign key to users table
alter table public.leader_requests
  add constraint leader_requests_user_id_fkey 
  foreign key (user_id) 
  references public.users(id) 
  on delete cascade;

-- Add foreign key to users for reviewed_by column (if not already exists)
alter table public.leader_requests
  add constraint leader_requests_reviewed_by_fkey 
  foreign key (reviewed_by) 
  references public.users(id) 
  on delete set null;
