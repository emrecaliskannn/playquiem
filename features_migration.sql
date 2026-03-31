-- ╔══════════════════════════════════════════════════════════╗
-- ║  QuestLog — Full Features Migration                     ║
-- ║  Run in Supabase SQL Editor                             ║
-- ╚══════════════════════════════════════════════════════════╝

-- ── CUSTOM LISTS ─────────────────────────────────────────────
create table if not exists public.lists (
  id          bigint primary key generated always as identity,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text default '',
  is_public   boolean default true,
  cover_url   text default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists public.list_items (
  id         bigint primary key generated always as identity,
  list_id    bigint not null references public.lists(id) on delete cascade,
  igdb_id    integer not null,
  title      text not null,
  cover_url  text default '',
  genres     text default '',
  position   integer default 0,
  note       text default '',
  added_at   timestamptz default now()
);

-- ── CHALLENGES ───────────────────────────────────────────────
create table if not exists public.challenges (
  id          bigint primary key generated always as identity,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text default '',
  goal_type   text default 'count',   -- count | genre | platform | rating
  goal_value  integer default 52,     -- number of games
  goal_filter text default '',        -- e.g. genre name or platform
  year        integer default extract(year from now())::integer,
  is_public   boolean default true,
  created_at  timestamptz default now()
);

-- ── NOTIFICATIONS ────────────────────────────────────────────
create table if not exists public.notifications (
  id          bigint primary key generated always as identity,
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,  -- follow | log | review | achievement | challenge
  actor_id    uuid references auth.users(id) on delete cascade,
  actor_name  text default '',
  message     text not null,
  link        text default '',
  is_read     boolean default false,
  created_at  timestamptz default now()
);

-- ── ACHIEVEMENTS ─────────────────────────────────────────────
create table if not exists public.user_achievements (
  id           bigint primary key generated always as identity,
  user_id      uuid not null references auth.users(id) on delete cascade,
  achievement  text not null,   -- slug: first_log, logged_10, etc.
  earned_at    timestamptz default now(),
  unique(user_id, achievement)
);

-- ── RLS POLICIES ─────────────────────────────────────────────
alter table public.lists             enable row level security;
alter table public.list_items        enable row level security;
alter table public.challenges        enable row level security;
alter table public.notifications     enable row level security;
alter table public.user_achievements enable row level security;

-- Lists: public ones visible to all, private only to owner
drop policy if exists "Lists public read"   on public.lists;
drop policy if exists "Lists owner write"   on public.lists;
drop policy if exists "Lists owner insert"  on public.lists;
drop policy if exists "Lists owner delete"  on public.lists;
create policy "Lists public read"   on public.lists for select using (is_public or auth.uid() = user_id);
create policy "Lists owner insert"  on public.lists for insert with check (auth.uid() = user_id);
create policy "Lists owner write"   on public.lists for update using (auth.uid() = user_id);
create policy "Lists owner delete"  on public.lists for delete using (auth.uid() = user_id);

-- List items: same visibility as parent list
drop policy if exists "List items read"   on public.list_items;
drop policy if exists "List items write"  on public.list_items;
drop policy if exists "List items insert" on public.list_items;
drop policy if exists "List items delete" on public.list_items;
create policy "List items read"   on public.list_items for select using (true);
create policy "List items insert" on public.list_items for insert with check (
  exists (select 1 from public.lists where id = list_id and user_id = auth.uid()));
create policy "List items write"  on public.list_items for update using (
  exists (select 1 from public.lists where id = list_id and user_id = auth.uid()));
create policy "List items delete" on public.list_items for delete using (
  exists (select 1 from public.lists where id = list_id and user_id = auth.uid()));

-- Challenges: public visible to all
drop policy if exists "Challenges read"   on public.challenges;
drop policy if exists "Challenges insert" on public.challenges;
drop policy if exists "Challenges write"  on public.challenges;
drop policy if exists "Challenges delete" on public.challenges;
create policy "Challenges read"   on public.challenges for select using (is_public or auth.uid() = user_id);
create policy "Challenges insert" on public.challenges for insert with check (auth.uid() = user_id);
create policy "Challenges write"  on public.challenges for update using (auth.uid() = user_id);
create policy "Challenges delete" on public.challenges for delete using (auth.uid() = user_id);

-- Notifications: private
drop policy if exists "Notifs own" on public.notifications;
create policy "Notifs own" on public.notifications for all using (auth.uid() = user_id);

-- Achievements: public readable
drop policy if exists "Achievements read"   on public.user_achievements;
drop policy if exists "Achievements insert" on public.user_achievements;
create policy "Achievements read"   on public.user_achievements for select using (true);
create policy "Achievements insert" on public.user_achievements for insert with check (auth.uid() = user_id);

-- ── ACTIVITY FEED VIEW ────────────────────────────────────────
create or replace view public.activity_feed as
select
  'log'          as activity_type,
  l.id           as activity_id,
  l.user_id,
  p.username,
  p.display_name,
  l.title        as game_title,
  l.cover_url,
  l.igdb_id,
  l.rating,
  l.review,
  l.status,
  l.created_at
from public.logs l
join public.profiles p on p.id = l.user_id
order by l.created_at desc;

-- ── TAGS + REPLAYED (if not already added) ───────────────────
alter table public.logs add column if not exists tags     text    default '';
alter table public.logs add column if not exists replayed boolean default false;

-- ── FUNCTION: create notification on new follow ───────────────
create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer as $$
declare
  actor_username text;
begin
  select username into actor_username from public.profiles where id = new.follower_id;
  insert into public.notifications(user_id, type, actor_id, actor_name, message, link)
  values (
    new.following_id,
    'follow',
    new.follower_id,
    coalesce(actor_username, 'Someone'),
    coalesce(actor_username, 'Someone') || ' started following you',
    '/profile/' || new.follower_id::text
  );
  return new;
end;
$$;

drop trigger if exists on_new_follow on public.follows;
create trigger on_new_follow
  after insert on public.follows
  for each row execute procedure public.notify_on_follow();

-- ── FUNCTION: create notification on new log (for followers) ──
create or replace function public.notify_followers_on_log()
returns trigger language plpgsql security definer as $$
declare
  actor_username text;
  follower record;
begin
  select username into actor_username from public.profiles where id = new.user_id;
  for follower in
    select follower_id from public.follows where following_id = new.user_id
  loop
    insert into public.notifications(user_id, type, actor_id, actor_name, message, link)
    values (
      follower.follower_id,
      'log',
      new.user_id,
      coalesce(actor_username, 'Someone'),
      coalesce(actor_username, 'Someone') || ' logged ' || new.title,
      '/game/' || coalesce(new.igdb_id::text, '')
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists on_new_log on public.logs;
create trigger on_new_log
  after insert on public.logs
  for each row execute procedure public.notify_followers_on_log();

-- ═══════════════════════════════════════════════
-- FRIEND REQUESTS (instead of instant follow)
-- ═══════════════════════════════════════════════
create table if not exists public.friend_requests (
  id           bigint primary key generated always as identity,
  from_id      uuid not null references auth.users(id) on delete cascade,
  to_id        uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending',  -- pending | accepted | declined
  created_at   timestamptz default now(),
  unique(from_id, to_id)
);

alter table public.friend_requests enable row level security;

drop policy if exists "Requests visible to parties" on public.friend_requests;
drop policy if exists "Requests insert"             on public.friend_requests;
drop policy if exists "Requests update"             on public.friend_requests;
drop policy if exists "Requests delete"             on public.friend_requests;

create policy "Requests visible to parties" on public.friend_requests
  for select using (auth.uid() = from_id or auth.uid() = to_id);
create policy "Requests insert" on public.friend_requests
  for insert with check (auth.uid() = from_id);
create policy "Requests update" on public.friend_requests
  for update using (auth.uid() = to_id);
create policy "Requests delete" on public.friend_requests
  for delete using (auth.uid() = from_id or auth.uid() = to_id);

-- Notify recipient when a request is sent
create or replace function public.notify_on_friend_request()
returns trigger language plpgsql security definer as $$
declare actor_username text;
begin
  select username into actor_username from public.profiles where id = new.from_id;
  insert into public.notifications(user_id, type, actor_id, actor_name, message, link)
  values (
    new.to_id, 'follow', new.from_id,
    coalesce(actor_username,'Someone'),
    coalesce(actor_username,'Someone') || ' sent you a friend request',
    '/notifications'
  );
  return new;
end;
$$;

drop trigger if exists on_friend_request on public.friend_requests;
create trigger on_friend_request
  after insert on public.friend_requests
  for each row execute procedure public.notify_on_friend_request();

-- Notify sender when request is accepted
create or replace function public.notify_on_request_accepted()
returns trigger language plpgsql security definer as $$
declare actor_username text;
begin
  if new.status = 'accepted' and old.status = 'pending' then
    select username into actor_username from public.profiles where id = new.to_id;
    -- Also create the mutual follow
    insert into public.follows(follower_id, following_id)
      values (new.from_id, new.to_id) on conflict do nothing;
    insert into public.follows(follower_id, following_id)
      values (new.to_id, new.from_id) on conflict do nothing;
    -- Notify
    insert into public.notifications(user_id, type, actor_id, actor_name, message, link)
    values (
      new.from_id, 'follow', new.to_id,
      coalesce(actor_username,'Someone'),
      coalesce(actor_username,'Someone') || ' accepted your friend request',
      '/profile/' || new.to_id::text
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_request_accepted on public.friend_requests;
create trigger on_request_accepted
  after update on public.friend_requests
  for each row execute procedure public.notify_on_request_accepted();
