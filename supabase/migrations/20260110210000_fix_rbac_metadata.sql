-- RLS FIX: Sync roles to auth.users metadata to avoid recursion

-- 1. Create a function to valid user role in metadata
create or replace function public.handle_role_update() 
returns trigger 
language plpgsql 
security definer 
set search_path = public
as $$
begin
  update auth.users
  set raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', new.role)
  where id = new.user_id;
  return new;
end;
$$;

-- 2. Trigger on update/insert of user_roles
drop trigger if exists on_role_update on public.user_roles;
create trigger on_role_update
  after insert or update on public.user_roles
  for each row execute procedure public.handle_role_update();

-- 3. Backfill existing roles
do $$
declare
  r record;
begin
  for r in select user_id, role from public.user_roles loop
    update auth.users
    set raw_app_meta_data = 
      coalesce(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', r.role)
    where id = r.user_id;
  end loop;
end $$;

-- 4. Re-enable RLS and update policies to use JWT metadata
alter table user_roles enable row level security;

-- Helper function to read from JWT (no DB query!)
create or replace function public.is_admin_jwt()
returns boolean
language sql
stable
as $$
  select (auth.jwt() -> 'app_metadata' ->> 'role') = 'sysadmin';
$$;

-- Drop old recursive policies
drop policy if exists "Sysadmins can manage all roles" on user_roles;
drop policy if exists "Users can read own role" on user_roles;

-- New efficient policies
create policy "Users can read own role"
  on user_roles for select
  using ( auth.uid() = user_id );

create policy "Sysadmins can manage all roles"
  on user_roles for all
  using ( is_admin_jwt() );
