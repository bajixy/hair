-- Our home: database setup. Paste all of this into the Supabase SQL editor and press Run.
-- Before you run it, scroll to the very bottom and put your secret word between the quotes.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.home_config(
  id int primary key default 1 check (id = 1),
  secret_hash text not null,
  channel text not null default encode(extensions.gen_random_bytes(16), 'hex')
);
create table if not exists public.home_blocks(
  x int not null, y int not null, z int not null,
  t smallint not null check (t between 0 and 12),
  by_who text, at timestamptz not null default now(),
  primary key (x, y, z)
);
create table if not exists public.home_notes(
  id uuid primary key default gen_random_uuid(),
  x int not null, y int not null, z int not null,
  author text not null check (author in ('Anujin','Baji')),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create table if not exists public.home_seen(
  who text primary key check (who in ('Anujin','Baji','Urii')),
  at timestamptz not null default now()
);
alter table public.home_config enable row level security;
alter table public.home_blocks enable row level security;
alter table public.home_notes  enable row level security;
alter table public.home_seen   enable row level security;
revoke all on public.home_config, public.home_blocks, public.home_notes, public.home_seen from anon, authenticated;

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

create or replace function public.home_seed(p_secret text, p_who text, p_blocks jsonb) returns int
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform home_check(p_secret, p_who);
  if not exists (select 1 from home_blocks) then
    insert into home_blocks(x, y, z, t, by_who)
    select (e->>0)::int, (e->>1)::int, (e->>2)::int, (e->>3)::smallint, 'starter'
    from (select e from jsonb_array_elements(p_blocks) e limit 6000) s
    where abs((e->>0)::int) <= 12 and abs((e->>2)::int) <= 12 and (e->>1)::int between 0 and 20 and (e->>3)::int between 0 and 12
    on conflict do nothing;
  end if;
  return (select count(*) from home_blocks);
end $$;

create or replace function public.home_set_block(p_secret text, p_who text, p_x int, p_y int, p_z int, p_t int) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform home_check(p_secret, p_who);
  if abs(p_x) > 12 or abs(p_z) > 12 or p_y < 0 or p_y > 20 then raise exception 'outside the plot'; end if;
  if p_t is null then
    delete from home_blocks where x = p_x and y = p_y and z = p_z;
  else
    if p_t < 0 or p_t > 12 then raise exception 'unknown block'; end if;
    insert into home_blocks(x, y, z, t, by_who, at) values (p_x, p_y, p_z, p_t, p_who, now())
    on conflict (x, y, z) do update set t = excluded.t, by_who = excluded.by_who, at = excluded.at;
  end if;
end $$;

create or replace function public.home_add_note(p_secret text, p_who text, p_x int, p_y int, p_z int, p_body text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare r jsonb;
begin
  perform home_check(p_secret, p_who);
  if (select count(*) from home_notes) >= 1000 then raise exception 'too many letters'; end if;
  insert into home_notes(x, y, z, author, body) values (p_x, p_y, p_z, p_who, left(btrim(p_body), 1000))
  returning to_jsonb(home_notes.*) into r;
  return r;
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

create or replace function public.home_delete_note(p_secret text, p_who text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform home_check(p_secret, p_who);
  delete from home_notes where id = p_id and author = p_who;
end $$;

create or replace function public.home_touch(p_secret text, p_who text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform home_check(p_secret, p_who);
  insert into home_seen(who, at) values (p_who, now()) on conflict (who) do update set at = excluded.at;
end $$;

revoke execute on function public.home_enter(text,text), public.home_seed(text,text,jsonb), public.home_set_block(text,text,int,int,int,int),
  public.home_add_note(text,text,int,int,int,text), public.home_read_note(text,text,uuid), public.home_delete_note(text,text,uuid),
  public.home_touch(text,text) from public;
grant execute on function public.home_enter(text,text), public.home_seed(text,text,jsonb), public.home_set_block(text,text,int,int,int,int),
  public.home_add_note(text,text,int,int,int,text), public.home_read_note(text,text,uuid), public.home_delete_note(text,text,uuid),
  public.home_touch(text,text) to anon, authenticated;

-- Our secret word. Replace  our word here  with yours (keep the quotes). Run this part again any time to change it.
insert into public.home_config (id, secret_hash)
values (1, extensions.crypt('our word here', extensions.gen_salt('bf')))
on conflict (id) do update set secret_hash = excluded.secret_hash;
