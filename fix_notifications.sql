-- ╔══════════════════════════════════════════════════╗
-- ║  Playquiem — Notification Triggers Fix           ║
-- ║  Run this in Supabase SQL Editor                 ║
-- ╚══════════════════════════════════════════════════╝

-- ── 1. Follow notification trigger ───────────────────────────
-- Fires whenever someone inserts a row into public.follows
create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer as $$
declare actor_username text;
begin
  select username into actor_username
  from public.profiles where id = new.follower_id;

  -- Avoid duplicate notifications (if JS already sent one)
  if not exists (
    select 1 from public.notifications
    where user_id   = new.following_id
      and actor_id  = new.follower_id
      and type      = 'follow'
      and created_at > now() - interval '10 seconds'
  ) then
    insert into public.notifications(user_id, type, actor_id, actor_name, message, link)
    values (
      new.following_id,
      'follow',
      new.follower_id,
      coalesce(actor_username, 'Someone'),
      coalesce(actor_username, 'Someone') || ' started following you',
      '/profile/' || new.follower_id::text
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_new_follow on public.follows;
create trigger on_new_follow
  after insert on public.follows
  for each row execute procedure public.notify_on_follow();

-- ── 2. New log notification (notifies all followers) ─────────
create or replace function public.notify_followers_on_log()
returns trigger language plpgsql security definer as $$
declare
  actor_username text;
  follower record;
begin
  select username into actor_username
  from public.profiles where id = new.user_id;

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

-- ── 3. Friend request notification ───────────────────────────
create or replace function public.notify_on_friend_request()
returns trigger language plpgsql security definer as $$
declare actor_username text;
begin
  select username into actor_username
  from public.profiles where id = new.from_id;

  insert into public.notifications(user_id, type, actor_id, actor_name, message, link)
  values (
    new.to_id, 'friend_request', new.from_id,
    coalesce(actor_username, 'Someone'),
    coalesce(actor_username, 'Someone') || ' sent you a friend request',
    '/notifications'
  );
  return new;
end;
$$;

drop trigger if exists on_friend_request on public.friend_requests;
create trigger on_friend_request
  after insert on public.friend_requests
  for each row execute procedure public.notify_on_friend_request();

-- ── 4. Friend request accepted → mutual follow + notification ─
create or replace function public.notify_on_request_accepted()
returns trigger language plpgsql security definer as $$
declare actor_username text;
begin
  if new.status = 'accepted' and old.status = 'pending' then
    select username into actor_username
    from public.profiles where id = new.to_id;

    -- Create mutual follows
    insert into public.follows(follower_id, following_id)
      values (new.from_id, new.to_id) on conflict do nothing;
    insert into public.follows(follower_id, following_id)
      values (new.to_id, new.from_id) on conflict do nothing;

    -- Notify the requester
    insert into public.notifications(user_id, type, actor_id, actor_name, message, link)
    values (
      new.from_id, 'follow', new.to_id,
      coalesce(actor_username, 'Someone'),
      coalesce(actor_username, 'Someone') || ' accepted your friend request',
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

-- ── 5. Grant notification insert to authenticated users ───────
-- This is critical — RLS must allow users to insert notifications
drop policy if exists "Users can insert notifications" on public.notifications;
create policy "Users can insert notifications"
  on public.notifications for insert
  with check (true);  -- triggers run as security definer so this is safe
