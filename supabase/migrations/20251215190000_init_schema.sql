-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1) PROFILES (extiende auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','logistica')),
  full_name text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- 2) PEOPLE (catálogo de personas)
create table people (
  id uuid primary key default gen_random_uuid(),
  rut_normalized text unique not null,
  rut_display text not null,
  full_name text not null,
  company text not null,
  job_title text,
  phone_e164 text,
  active boolean default true,
  created_at timestamptz default now()
);

alter table people enable row level security;

-- 3) LOCATIONS
create table locations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  type text not null check (type in ('city','port','center','base','other')) default 'other',
  active boolean default true,
  created_at timestamptz default now()
);

alter table locations enable row level security;

-- 4) OPERATORS
create table operators (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  type text not null check (type in ('airline','marine','internal','other')) default 'other',
  active boolean default true,
  created_at timestamptz default now()
);

alter table operators enable row level security;

-- 5) VESSELS
create table vessels (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  type text not null check (type in ('lancha','barcaza','other')) default 'lancha',
  active boolean default true,
  created_at timestamptz default now()
);

alter table vessels enable row level security;

-- 6) ROUTES (rutas típicas reutilizables)
create table routes (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('avion','lancha','interno')),
  origin_location_id uuid not null references locations(id),
  destination_location_id uuid not null references locations(id),
  default_operator_id uuid references operators(id),
  default_vessel_id uuid references vessels(id),
  active boolean default true,
  created_at timestamptz default now(),
  unique(mode, origin_location_id, destination_location_id)
);

alter table routes enable row level security;

-- 7) ITINERARIES
create table itineraries (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(id),
  status text not null check (status in ('draft','assigned','cancelled','completed')) default 'draft',
  start_date date not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table itineraries enable row level security;

-- 8) ITINERARY SEGMENTS
create table itinerary_segments (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  seq int not null,
  route_id uuid references routes(id),
  mode text not null check (mode in ('avion','lancha','interno')),
  origin_location_id uuid not null references locations(id),
  destination_location_id uuid not null references locations(id),
  operator_id uuid references operators(id),
  vessel_id uuid references vessels(id),
  presentation_at timestamptz,
  departure_at timestamptz not null,
  ticket text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(itinerary_id, seq)
);

alter table itinerary_segments enable row level security;

-- 9) ITINERARY SHARES
create table itinerary_shares (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  token text unique not null,
  expires_at timestamptz,
  revoked boolean default false,
  created_at timestamptz default now()
);

alter table itinerary_shares enable row level security;

-- 10) NOTIFICATIONS
create table notifications (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  event text not null check (event in ('ASSIGNED','CANCELLED','UPDATED')),
  status text not null check (status in ('queued','sent','failed','missing_phone')) default 'queued',
  channel text not null default 'whatsapp',
  payload jsonb not null,
  provider_message_id text,
  error text,
  created_at timestamptz default now(),
  sent_at timestamptz
);

alter table notifications enable row level security;

-- --- TRIGGERS & FUNCTIONS ---

-- A) Updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_itineraries_modtime
    before update on itineraries
    for each row execute procedure update_updated_at_column();

create trigger update_itinerary_segments_modtime
    before update on itinerary_segments
    for each row execute procedure update_updated_at_column();

-- B) Generate Share Token
create or replace function generate_share_token(p_itinerary_id uuid)
returns text as $$
declare
    v_token text;
    v_exists boolean;
begin
    -- Check if valid token exists
    select token into v_token
    from itinerary_shares
    where itinerary_id = p_itinerary_id
      and not revoked
      and (expires_at is null or expires_at > now())
    limit 1;

    if v_token is not null then
        return v_token;
    end if;

    -- Generate new token
    loop
        v_token := encode(gen_random_bytes(24), 'base64'); -- ~32 chars
        v_token := replace(replace(v_token, '+', '-'), '/', '_'); -- URL safeish
        
        select exists(select 1 from itinerary_shares where token = v_token) into v_exists;
        exit when not v_exists;
    end loop;

    insert into itinerary_shares (itinerary_id, token)
    values (p_itinerary_id, v_token);

    return v_token;
end;
$$ language plpgsql security definer;

-- Helper to build notification payload
create or replace function build_notification_payload(p_itinerary_id uuid)
returns jsonb as $$
declare
    v_person record;
    v_segments jsonb;
    v_token text;
    v_public_url text;
    v_itinerary record;
begin
    select * into v_itinerary from itineraries where id = p_itinerary_id;
    select * into v_person from people where id = v_itinerary.person_id;
    
    -- Get or create token
    v_token := generate_share_token(p_itinerary_id);
    
    -- APP_BASE_URL should be set in client, but for now we put a placeholder or rely on client to format
    -- We will store the relative path for safety: /i/TOKEN
    v_public_url := '/i/' || v_token;

    select jsonb_agg(
        jsonb_build_object(
            'seq', s.seq,
            'origin', lo.name,
            'destination', ld.name,
            'departure_at', s.departure_at,
            'mode', s.mode,
            'operator', op.name
        ) order by s.seq
    ) into v_segments
    from itinerary_segments s
    left join locations lo on s.origin_location_id = lo.id
    left join locations ld on s.destination_location_id = ld.id
    left join operators op on s.operator_id = op.id
    where s.itinerary_id = p_itinerary_id;

    return jsonb_build_object(
        'person', jsonb_build_object(
            'full_name', v_person.full_name,
            'rut_display', v_person.rut_display,
            'phone_e164', v_person.phone_e164
        ),
        'itinerary', jsonb_build_object(
            'id', v_itinerary.id,
            'status', v_itinerary.status,
            'start_date', v_itinerary.start_date
        ),
        'public_url_path', v_public_url,
        'segments', coalesce(v_segments, '[]'::jsonb)
    );
end;
$$ language plpgsql security definer;

-- C) Itinerary Status Trigger (ASSIGNED/CANCELLED)
create or replace function handle_itinerary_status_change()
returns trigger as $$
declare
    v_payload jsonb;
    v_status text := 'queued';
    v_phone text;
begin
    if old.status = new.status then
        return new;
    end if;

    select phone_e164 into v_phone from people where id = new.person_id;
    if v_phone is null then
        v_status := 'missing_phone';
    end if;

    if new.status = 'assigned' and old.status = 'draft' then
        v_payload := build_notification_payload(new.id);
        insert into notifications (itinerary_id, event, status, payload)
        values (new.id, 'ASSIGNED', v_status, v_payload);
    
    elsif new.status = 'cancelled' and old.status = 'assigned' then
        v_payload := build_notification_payload(new.id);
        insert into notifications (itinerary_id, event, status, payload)
        values (new.id, 'CANCELLED', v_status, v_payload);
    end if;

    return new;
end;
$$ language plpgsql security definer;

create trigger trg_itinerary_status_change
    after update on itineraries
    for each row execute procedure handle_itinerary_status_change();


-- D) Segment Update Trigger (UPDATED)
create or replace function handle_segment_update()
returns trigger as $$
declare
    v_itinerary_status text;
    v_payload jsonb;
    v_status text := 'queued';
    v_phone text;
    v_person_id uuid;
begin
    select status, person_id into v_itinerary_status, v_person_id 
    from itineraries where id = new.itinerary_id;

    -- Conditions: Itinerary Assigned + Segment Future + Significant Change
    if v_itinerary_status = 'assigned' 
       and new.departure_at > now()
       and (
           new.departure_at is distinct from old.departure_at or
           new.presentation_at is distinct from old.presentation_at or
           new.origin_location_id is distinct from old.origin_location_id or
           new.destination_location_id is distinct from old.destination_location_id or
           new.operator_id is distinct from old.operator_id or
           new.vessel_id is distinct from old.vessel_id or
           new.ticket is distinct from old.ticket or
           new.notes is distinct from old.notes
       )
    then
        select phone_e164 into v_phone from people where id = v_person_id;
        if v_phone is null then
            v_status := 'missing_phone';
        end if;

        v_payload := build_notification_payload(new.itinerary_id);
        
        -- Debounce logic could be here, but for now strict insert
        insert into notifications (itinerary_id, event, status, payload)
        values (new.itinerary_id, 'UPDATED', v_status, v_payload);
    end if;

    return new;
end;
$$ language plpgsql security definer;

create trigger trg_segment_update
    after update on itinerary_segments
    for each row execute procedure handle_segment_update();

-- --- RLS POLICIES ---

-- Helper function to check role
create or replace function is_admin_or_logistica()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('admin', 'logistica')
  );
end;
$$ language plpgsql security definer;

-- 1) PROFILES: Users can read own. Admin/Logistica can read all.
create policy "Users can read own profile" on profiles
  for select using (auth.uid() = id);

create policy "Staff can read all profiles" on profiles
  for select using (is_admin_or_logistica());

-- 2) CATALOGS (People, Locations, Operators, Vessels, Routes)
-- Read/Write for Staff. No public access.
create policy "Staff full access people" on people for all using (is_admin_or_logistica());
create policy "Staff full access locations" on locations for all using (is_admin_or_logistica());
create policy "Staff full access operators" on operators for all using (is_admin_or_logistica());
create policy "Staff full access vessels" on vessels for all using (is_admin_or_logistica());
create policy "Staff full access routes" on routes for all using (is_admin_or_logistica());

-- 3) ITINERARIES & SEGMENTS & SHARES & NOTIFICATIONS
-- Staff full access.
create policy "Staff full access itineraries" on itineraries for all using (is_admin_or_logistica());
create policy "Staff full access segments" on itinerary_segments for all using (is_admin_or_logistica());
create policy "Staff full access shares" on itinerary_shares for all using (is_admin_or_logistica());
create policy "Staff full access notifications" on notifications for all using (is_admin_or_logistica());

-- NOTE: We explicitly DO NOT ADD public policies for 'itinerary_shares' or 'itineraries'.
-- Public access will be handled via a secure Postgres function or Server-Side API (Service Role)
-- as requested: "Public Link (Pasajero sin login) ... Endpoint público GET /api/public/itinerary/<token> (server-side)"
