-- Fix infinite recursion in user_roles policies

-- 1. Create a secure function to check for sysadmin role
create or replace function public.is_sysadmin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 
    from public.user_roles 
    where user_id = auth.uid() 
    and role = 'sysadmin'
  );
end;
$$;

-- 2. Drop the recursive policy if it exists (using IF EXISTS just in case, though we know it does)
drop policy if exists "Sysadmins can manage all roles" on user_roles;

-- 3. Create the new policy using the function
create policy "Sysadmins can manage all roles"
  on user_roles
  for all
  using ( is_sysadmin() );

-- 4. Bootstrap the sysadmin user (ensure jalcayagas@gmail.com is sysadmin)
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'jalcayagas@gmail.com';
  
  if v_user_id is not null then
    insert into public.user_roles (user_id, email, role)
    values (v_user_id, 'jalcayagas@gmail.com', 'sysadmin')
    on conflict (user_id) do update set role = 'sysadmin';
  end if;
end $$;
