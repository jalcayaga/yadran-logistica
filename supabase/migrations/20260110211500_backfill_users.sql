-- Backfill missing users from auth.users to public.user_roles

insert into public.user_roles (user_id, email, role)
select 
  id, 
  email, 
  'operator' -- Default role for existing users
from auth.users
where id not in (select user_id from public.user_roles)
on conflict (user_id) do nothing;

-- Ensure metadata is synced for these new entries too
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
