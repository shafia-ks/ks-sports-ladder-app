-- Fix: Avoid infinite recursion in users RLS admin policies
-- Create a SECURITY DEFINER helper that checks admin status without triggering RLS recursion

create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  return exists (
    select 1
    from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  );
end;
$$;

-- Recreate admin policies to use the helper function
 drop policy if exists "Admins can read all profiles" on public.users;
 drop policy if exists "Admins can update any profile" on public.users;

create policy "Admins can read all profiles"
  on public.users
  for select
  using (public.is_admin());

create policy "Admins can update any profile"
  on public.users
  for update
  using (public.is_admin());

-- Allow execution of helper function for application roles
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to anon;
