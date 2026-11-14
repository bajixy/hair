-- Our home: let Urii come home too. Paste into the Supabase SQL editor and press Run (once).
-- She can walk, jump, send hearts and build. Letters stay between Anujin and Baji.
alter table public.home_seen drop constraint if exists home_seen_who_check;
alter table public.home_seen add constraint home_seen_who_check check (who in ('Anujin','Baji','Urii'));

create or replace function public.home_check(p_secret text, p_who text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_who is null or p_who not in ('Anujin','Baji','Urii') then raise exception 'unknown person'; end if;
  if p_secret is null or not exists (select 1 from home_config where secret_hash = crypt(p_secret, secret_hash)) then
    raise exception 'wrong secret word';
  end if;
end $$;
revoke execute on function public.home_check(text, text) from public, anon, authenticated;

create or replace function public.home_enter(p_secret text, p_who text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform home_check(p_secret, p_who);
  insert into home_seen(who, at) values (p_who, now()) on conflict (who) do update set at = excluded.at;
  return jsonb_build_object(
    'channel', (select channel from home_config where id = 1),
    'blocks',  coalesce((select jsonb_agg(jsonb_build_array(x, y, z, t)) from home_blocks), '[]'::jsonb),
    'notes',   case when p_who in ('Anujin','Baji') then coalesce((select jsonb_agg(to_jsonb(n) order by n.created_at) from home_notes n), '[]'::jsonb) else '[]'::jsonb end,
    'seen',    coalesce((select jsonb_object_agg(who, at) from home_seen), '{}'::jsonb));
end $$;

create or replace function public.home_read_note(p_secret text, p_who text, p_id uuid) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare r jsonb;
begin
  perform home_check(p_secret, p_who);
  if p_who not in ('Anujin','Baji') then return null; end if; -- letters are just between the two of us
  update home_notes set read_at = coalesce(read_at, now()) where id = p_id and author <> p_who;
  select to_jsonb(n) into r from home_notes n where id = p_id;
  return r;
end $$;
