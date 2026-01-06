-- Enable RLS and create policies for users table
-- This allows users to read their own profile without timeout

-- Enable RLS on users table
alter table public.users enable row level security;

-- Policy: Users can read their own profile
create policy "Users can read own profile"
  on public.users
  for select
  using (auth.uid() = id);

-- Policy: Users can update their own profile
create policy "Users can update own profile"
  on public.users
  for update
  using (auth.uid() = id);

-- Policy: Allow authenticated users to insert their own profile
create policy "Users can insert own profile"
  on public.users
  for insert
  with check (auth.uid() = id);

-- Policy: Admins can read all profiles
create policy "Admins can read all profiles"
  on public.users
  for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Policy: Admins can update any profile
create policy "Admins can update any profile"
  on public.users
  for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );
