-- Update generate_share_token to handle expiration in one step to avoid RLS issues on follow-up updates
create or replace function generate_share_token(p_itinerary_id uuid, p_expires_at timestamptz default null)
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
        -- Update expiration if provided and different
        if p_expires_at is not null then
            update itinerary_shares 
            set expires_at = p_expires_at 
            where token = v_token;
        end if;
        return v_token;
    end if;

    -- Generate new token
    loop
        v_token := encode(gen_random_bytes(24), 'base64');
        v_token := replace(replace(v_token, '+', '-'), '/', '_');
        
        select exists(select 1 from itinerary_shares where token = v_token) into v_exists;
        exit when not v_exists;
    end loop;

    insert into itinerary_shares (itinerary_id, token, expires_at)
    values (p_itinerary_id, v_token, p_expires_at);

    return v_token;
end;
$$ language plpgsql security definer;
