-- Create role enum
create type app_role as enum ('sysadmin', 'manager', 'operator');

-- Create user_roles table
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  email text, -- Cached email for display purposes
  role app_role not null default 'operator',
  created_at timestamptz default now()
);

-- Enable RLS
alter table user_roles enable row level security;

-- Policies for user_roles

-- 1. Users can read their own role
create policy "Users can read own role"
  on user_roles for select
  using ( auth.uid() = user_id );

-- 2. Sysadmins can do everything
create policy "Sysadmins can manage all roles"
  on user_roles for all
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid() and role = 'sysadmin'
    )
  );

-- Trigger to create a user_role entry when a new user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_roles (user_id, email, role)
  values (new.id, new.email, 'operator');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
