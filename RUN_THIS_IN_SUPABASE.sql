-- ═══════════════════════════════════════════════════════════════
-- PLAYQUIEM — Run this entire file in Supabase SQL Editor
-- Go to: Supabase → SQL Editor → paste everything → click Run
-- ═══════════════════════════════════════════════════════════════

-- ── Profiles ─────────────────────────────────────────────────
alter table public.profiles add column if not exists avatar_url text default '';
alter table public.profiles add column if not exists bio text default '';
alter table public.profiles add column if not exists display_name text default '';

-- ── Friend requests ───────────────────────────────────────────
create table if not exists public.friend_requests (
  id         bigint primary key generated always as identity,
  from_id    uuid not null references auth.users(id) on delete cascade,
  to_id      uuid not null references auth.users(id) on delete cascade,
  status     text not null default 'pending',
  created_at timestamptz default now(),
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

-- ── Notifications ─────────────────────────────────────────────
create table if not exists public.notifications (
  id         bigint primary key generated always as identity,
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,
  actor_id   uuid references auth.users(id) on delete set null,
  actor_name text,
  message    text,
  link       text,
  read       boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;

drop policy if exists "Notifs owner read"   on public.notifications;
drop policy if exists "Notifs owner update" on public.notifications;
drop policy if exists "Notifs insert"       on public.notifications;

create policy "Notifs owner read"   on public.notifications
  for select using (auth.uid() = user_id);
create policy "Notifs owner update" on public.notifications
  for update using (auth.uid() = user_id);
create policy "Notifs insert" on public.notifications
  for insert with check (true);

-- ── Lists ─────────────────────────────────────────────────────
create table if not exists public.lists (
  id         bigint primary key generated always as identity,
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  description text default '',
  is_public  boolean default true,
  created_at timestamptz default now()
);
alter table public.lists enable row level security;

drop policy if exists "Lists public read"  on public.lists;
drop policy if exists "Lists owner insert" on public.lists;
drop policy if exists "Lists owner write"  on public.lists;
drop policy if exists "Lists owner delete" on public.lists;

create policy "Lists public read"  on public.lists for select using (is_public or auth.uid() = user_id);
create policy "Lists owner insert" on public.lists for insert with check (auth.uid() = user_id);
create policy "Lists owner write"  on public.lists for update using (auth.uid() = user_id);
create policy "Lists owner delete" on public.lists for delete using (auth.uid() = user_id);

-- ── List items ────────────────────────────────────────────────
create table if not exists public.list_items (
  id         bigint primary key generated always as identity,
  list_id    bigint not null references public.lists(id) on delete cascade,
  igdb_id    bigint,
  title      text not null,
  cover_url  text default '',
  note       text default '',
  position   int default 0,
  created_at timestamptz default now()
);
alter table public.list_items enable row level security;

drop policy if exists "List items read"   on public.list_items;
drop policy if exists "List items insert" on public.list_items;
drop policy if exists "List items write"  on public.list_items;
drop policy if exists "List items delete" on public.list_items;

create policy "List items read"   on public.list_items for select using (true);
create policy "List items insert" on public.list_items for insert with check (
  exists (select 1 from public.lists where id = list_id and user_id = auth.uid()));
create policy "List items write"  on public.list_items for update using (
  exists (select 1 from public.lists where id = list_id and user_id = auth.uid()));
create policy "List items delete" on public.list_items for delete using (
  exists (select 1 from public.lists where id = list_id and user_id = auth.uid()));

-- ── Challenges ────────────────────────────────────────────────
create table if not exists public.challenges (
  id          bigint primary key generated always as identity,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text default '',
  goal        int default 10,
  progress    int default 0,
  completed   boolean default false,
  created_at  timestamptz default now()
);
alter table public.challenges enable row level security;

drop policy if exists "Challenges owner" on public.challenges;
create policy "Challenges owner" on public.challenges
  for all using (auth.uid() = user_id);

-- ── User achievements ─────────────────────────────────────────
create table if not exists public.user_achievements (
  id           bigint primary key generated always as identity,
  user_id      uuid not null references auth.users(id) on delete cascade,
  achievement  text not null,
  earned_at    timestamptz default now(),
  unique(user_id, achievement)
);
alter table public.user_achievements enable row level security;

drop policy if exists "Achievements owner" on public.user_achievements;
create policy "Achievements owner" on public.user_achievements
  for all using (auth.uid() = user_id);

-- ── Follows ───────────────────────────────────────────────────
create table if not exists public.follows (
  follower_id  uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (follower_id, following_id)
);
alter table public.follows enable row level security;

drop policy if exists "Follows public read" on public.follows;
drop policy if exists "Follows insert"      on public.follows;
drop policy if exists "Follows delete"      on public.follows;

create policy "Follows public read" on public.follows for select using (true);
create policy "Follows insert"      on public.follows for insert with check (auth.uid() = follower_id);
create policy "Follows delete"      on public.follows for delete using (auth.uid() = follower_id);

-- ── Notify on follow ─────────────────────────────────────────
create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer as $$
declare actor_username text;
begin
  select username into actor_username from public.profiles where id = new.follower_id;
  if not exists (
    select 1 from public.notifications
    where user_id = new.following_id and actor_id = new.follower_id
      and type = 'follow'
      and created_at > now() - interval '10 seconds'
  ) then
    insert into public.notifications(user_id, type, actor_id, actor_name, message, link)
    values (
      new.following_id, 'follow', new.follower_id,
      coalesce(actor_username,'Someone'),
      coalesce(actor_username,'Someone') || ' started following you',
      '/profile/' || new.follower_id::text
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_follow on public.follows;
create trigger on_follow
  after insert on public.follows
  for each row execute procedure public.notify_on_follow();

-- ── Notify on friend request ──────────────────────────────────
create or replace function public.notify_on_friend_request()
returns trigger language plpgsql security definer as $$
declare actor_username text;
begin
  select username into actor_username from public.profiles where id = new.from_id;
  insert into public.notifications(user_id, type, actor_id, actor_name, message, link)
  values (
    new.to_id, 'friend_request', new.from_id,
    coalesce(actor_username,'Someone'),
    coalesce(actor_username,'Someone') || ' sent you a friend request',
    '/profile/' || new.from_id::text
  );
  return new;
end;
$$;

drop trigger if exists on_friend_request on public.friend_requests;
create trigger on_friend_request
  after insert on public.friend_requests
  for each row execute procedure public.notify_on_friend_request();

-- ── Notify on friend request accepted ────────────────────────
create or replace function public.notify_on_request_accepted()
returns trigger language plpgsql security definer as $$
declare actor_username text;
begin
  if new.status = 'accepted' and old.status = 'pending' then
    select username into actor_username from public.profiles where id = new.to_id;
    insert into public.follows(follower_id, following_id) values (new.from_id, new.to_id) on conflict do nothing;
    insert into public.follows(follower_id, following_id) values (new.to_id, new.from_id) on conflict do nothing;
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

-- ── Done! ─────────────────────────────────────────────────────
select 'Playquiem database ready! 🎮' as status;

-- ── Review Likes ──────────────────────────────────────────────
create table if not exists public.review_likes (
  id         bigint primary key generated always as identity,
  user_id    uuid not null references auth.users(id) on delete cascade,
  log_id     bigint not null references public.logs(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, log_id)
);
alter table public.review_likes enable row level security;

drop policy if exists "Likes public read"  on public.review_likes;
drop policy if exists "Likes owner insert" on public.review_likes;
drop policy if exists "Likes owner delete" on public.review_likes;

create policy "Likes public read"  on public.review_likes for select using (true);
create policy "Likes owner insert" on public.review_likes for insert with check (auth.uid() = user_id);
create policy "Likes owner delete" on public.review_likes for delete using (auth.uid() = user_id);

-- Add like_count to logs view for easy querying
create or replace view public.recent_reviews as
select
  l.id,
  l.user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  l.title,
  l.cover_url,
  l.igdb_id,
  l.rating,
  l.review,
  l.platform,
  l.status,
  l.created_at,
  count(rl.id)::int as like_count
from public.logs l
join public.profiles p on p.id = l.user_id
left join public.review_likes rl on rl.log_id = l.id
where l.review is not null and l.review != ''
group by l.id, p.username, p.display_name, p.avatar_url
order by l.created_at desc;
