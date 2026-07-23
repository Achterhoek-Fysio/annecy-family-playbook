-- Annecy Family Playbook — live familiespellen
-- Voer dit hele bestand uit in Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.game_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  join_code text not null unique check (join_code = upper(join_code) and char_length(join_code) between 4 and 16),
  created_at timestamptz not null default now()
);

create table if not exists public.game_players (
  id uuid primary key references auth.users(id) on delete cascade,
  group_id uuid not null references public.game_groups(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  score integer not null default 0 check (score between -9999 and 999999),
  updated_at timestamptz not null default now(),
  unique(group_id, display_name)
);

create table if not exists public.game_score_events (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.game_groups(id) on delete cascade,
  player_id uuid not null references public.game_players(id) on delete cascade,
  delta integer not null check (delta between -100 and 100),
  reason text not null default 'spel',
  created_at timestamptz not null default now()
);

create table if not exists public.game_progress (
  player_id uuid not null references public.game_players(id) on delete cascade,
  group_id uuid not null references public.game_groups(id) on delete cascade,
  game_key text not null,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(player_id, game_key)
);

alter table public.game_groups enable row level security;
alter table public.game_players enable row level security;
alter table public.game_score_events enable row level security;
alter table public.game_progress enable row level security;

create or replace function public.my_game_group_id()
returns uuid language sql stable security definer set search_path = public
as $$ select group_id from public.game_players where id = auth.uid() $$;
revoke all on function public.my_game_group_id() from public;
grant execute on function public.my_game_group_id() to authenticated;

-- Groepsleden mogen hun groepsnaam/code bekijken.
drop policy if exists "members view own game group" on public.game_groups;
create policy "members view own game group" on public.game_groups for select to authenticated
using (id = public.my_game_group_id());

-- Groepsleden zien alle spelers in hun eigen groep; alleen de eigen speler mag direct worden aangepast.
drop policy if exists "members view group players" on public.game_players;
create policy "members view group players" on public.game_players for select to authenticated
using (group_id = public.my_game_group_id());
drop policy if exists "players update self" on public.game_players;
create policy "players update self" on public.game_players for update to authenticated
using (id = auth.uid()) with check (id = auth.uid() and group_id = public.my_game_group_id());

-- Scoregeschiedenis is zichtbaar binnen de groep, maar schrijven loopt uitsluitend via RPC.
drop policy if exists "members view group score events" on public.game_score_events;
create policy "members view group score events" on public.game_score_events for select to authenticated
using (group_id = public.my_game_group_id());

-- Spelvoortgang is privé per speler binnen de groep.
drop policy if exists "players manage own progress" on public.game_progress;
create policy "players manage own progress" on public.game_progress for all to authenticated
using (player_id = auth.uid() and group_id = public.my_game_group_id())
with check (player_id = auth.uid() and group_id = public.my_game_group_id());

create or replace function public.join_game_group(p_code text, p_display_name text)
returns table(player_id uuid, group_id uuid, group_name text, join_code text, display_name text, score integer)
language plpgsql security definer set search_path = public
as $$
declare g public.game_groups; clean_name text;
begin
  if auth.uid() is null then raise exception 'Je bent niet aangemeld.'; end if;
  clean_name := trim(p_display_name);
  if char_length(clean_name) < 1 or char_length(clean_name) > 30 then raise exception 'Ongeldige spelersnaam.'; end if;
  select * into g from public.game_groups where game_groups.join_code = upper(trim(p_code));
  if g.id is null then raise exception 'Ongeldige familiecode.'; end if;
  insert into public.game_players(id,group_id,display_name)
  values(auth.uid(),g.id,clean_name)
  on conflict(id) do update set group_id=excluded.group_id,display_name=excluded.display_name,updated_at=now();
  return query select p.id,g.id,g.name,g.join_code,p.display_name,p.score from public.game_players p where p.id=auth.uid();
end $$;

create or replace function public.get_my_game_membership()
returns table(player_id uuid, group_id uuid, group_name text, join_code text, display_name text, score integer)
language sql stable security definer set search_path = public
as $$
 select p.id,g.id,g.name,g.join_code,p.display_name,p.score
 from public.game_players p join public.game_groups g on g.id=p.group_id
 where p.id=auth.uid()
$$;

create or replace function public.change_my_game_score(p_delta integer, p_reason text default 'spel')
returns integer language plpgsql security definer set search_path = public
as $$
declare new_score integer; gid uuid;
begin
 if auth.uid() is null then raise exception 'Niet aangemeld.'; end if;
 if p_delta < -100 or p_delta > 100 then raise exception 'Ongeldige scorewijziging.'; end if;
 select group_id into gid from public.game_players where id=auth.uid();
 if gid is null then raise exception 'Doe eerst mee met een familiegroep.'; end if;
 update public.game_players set score=score+p_delta,updated_at=now() where id=auth.uid() returning score into new_score;
 insert into public.game_score_events(group_id,player_id,delta,reason) values(gid,auth.uid(),p_delta,left(coalesce(p_reason,'spel'),100));
 return new_score;
end $$;

revoke all on function public.join_game_group(text,text) from public;
revoke all on function public.get_my_game_membership() from public;
revoke all on function public.change_my_game_score(integer,text) from public;
grant execute on function public.join_game_group(text,text) to authenticated;
grant execute on function public.get_my_game_membership() to authenticated;
grant execute on function public.change_my_game_score(integer,text) to authenticated;

grant select on public.game_groups, public.game_players, public.game_score_events, public.game_progress to authenticated;
grant insert,update,delete on public.game_progress to authenticated;

-- Voeg game_players toe aan Realtime (melding negeren als hij al is toegevoegd).
do $$ begin
 alter publication supabase_realtime add table public.game_players;
exception when duplicate_object then null; end $$;

-- Eerste groep. Pas naam en code gerust aan vóór uitvoering.
insert into public.game_groups(name,join_code)
values ('Annecy Family Games','ANNECY26')
on conflict(join_code) do update set name=excluded.name;
